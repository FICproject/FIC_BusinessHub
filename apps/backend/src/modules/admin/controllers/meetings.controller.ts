import { Router, Response } from 'express';
import { MeetingModel } from '../models/Meeting';
import { MemberModel } from '../models/Member';
import { AdminUserModel } from '../models/AdminUser';
import { FundingApplicationModel } from '../models/FundingApplication';
import { UserModel } from '../../users/users.model';
import { notifyMember } from '../../notifications/notifications.service';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/meetings - List all meetings with optional filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;

    // First, sync any Funding Applications that have meetings scheduled but aren't yet in the Meetings collection
    try {
      const fundingAppsWithMeetings = await FundingApplicationModel.find({
        meetingScheduledAt: { $exists: true, $ne: null },
      });

      for (const fApp of fundingAppsWithMeetings) {
        const existing = await MeetingModel.findOne({ relatedFundingApplicationId: fApp._id });
        if (!existing) {
          const sampleAdmin = await AdminUserModel.findOne({ role: 'SUPER_ADMIN' });
          await MeetingModel.create({
            title: `FIC Funding Pitch: ${fApp.businessName}`,
            description: `Venture capital investment pitch with ${fApp.applicantName} (${fApp.applicantEmail}). Requested: ₹${fApp.requestedAmount?.toLocaleString('en-IN')}. Notes: ${fApp.diligenceNotes || ''}`,
            hostAdminId: sampleAdmin?._id,
            participantMemberIds: [],
            externalParticipants: [
              {
                name: fApp.applicantName,
                email: fApp.applicantEmail,
                phone: fApp.applicantPhone,
                roleOrCompany: fApp.businessName,
              },
            ],
            meetingType: 'FUNDING_PITCH',
            relatedFundingApplicationId: fApp._id,
            scheduledAt: fApp.meetingScheduledAt,
            durationMinutes: 45,
            meetingLink: fApp.meetingLink || 'https://meet.google.com/fic-pitch-session',
            status: fApp.stage === 'FUNDED' || fApp.stage === 'REPAID' ? 'COMPLETED' : 'SCHEDULED',
            notificationSent: true,
          });
        }
      }
    } catch (syncErr) {
      console.warn('Funding meeting sync warning:', syncErr);
    }

    let meetings = await MeetingModel.find(filter)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('relatedFundingApplicationId', 'businessName requestedAmount approvedPrincipal stage')
      .sort({ scheduledAt: -1 });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      meetings = meetings.filter((m: any) => {
        const titleMatch = m.title?.toLowerCase().includes(q);
        const memberMatch = m.participantMemberIds?.some(
          (p: any) =>
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.includes(q)
        );
        const externalMatch = m.externalParticipants?.some(
          (e: any) =>
            e.name?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q) ||
            e.roleOrCompany?.toLowerCase().includes(q)
        );
        return titleMatch || memberMatch || externalMatch;
      });
    }

    res.json({ success: true, data: meetings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/meetings - Create & schedule a new meeting, trigger mock notification, and write audit log
router.post('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { title, description, participantMemberIds, scheduledAt, durationMinutes, meetingLink } = req.body;

    if (!title || !scheduledAt || !participantMemberIds || !participantMemberIds.length) {
      res.status(400).json({
        success: false,
        error: 'Title, scheduled date/time, and at least one participant customer are required.',
      });
      return;
    }

    const trimmedMeetingLink = typeof meetingLink === 'string' ? meetingLink.trim() : '';
    if (!trimmedMeetingLink) {
      res.status(400).json({
        success: false,
        error: 'Meeting URL is required. Please enter a valid meeting link.',
      });
      return;
    }

    try {
      const parsedUrl = new URL(trimmedMeetingLink);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        res.status(400).json({
          success: false,
          error: 'Meeting URL must start with http:// or https://.',
        });
        return;
      }
    } catch {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid Meeting URL (e.g., https://meet.google.com/xyz-abc).',
      });
      return;
    }

    const finalMeetingLink = trimmedMeetingLink;

    const hostAdminId = req.admin!.id;

    const meeting = await MeetingModel.create({
      title,
      description,
      hostAdminId,
      participantMemberIds,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
      meetingLink: finalMeetingLink,
      status: 'SCHEDULED',
      notificationSent: false,
    });

    // Dispatch live notification and email invites to members
    try {
      const members = await MemberModel.find({ _id: { $in: participantMemberIds } });
      for (const m of members) {
        let u = await UserModel.findOne({ email: m.email.toLowerCase().trim() });
        const targetUserId = u?._id || m._id;
        await notifyMember({
          userId: targetUserId,
          eventType: 'MEETING_SCHEDULED',
          title: `New Meeting Scheduled: ${title}`,
          message: `FIC Admin has scheduled a consultation: "${title}" on ${new Date(scheduledAt).toLocaleString()}.`,
          link: '/meetings',
          priority: 'HIGH'
        });
      }
      meeting.notificationSent = true;
      await meeting.save();
    } catch (notifErr) {
      console.error('Notification dispatch warning:', notifErr);
    }

    // Write immutable audit log entry
    await logAdminAction(req, 'SCHEDULE_MEETING', 'Meeting', meeting._id.toString(), {
      title,
      scheduledAt,
      participantCount: participantMemberIds.length,
      meetingLink: finalMeetingLink,
    });

    const populated = await MeetingModel.findById(meeting._id)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName');

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/meetings/:id/status - Update meeting status (IN_PROGRESS, COMPLETED, CANCELLED)
router.patch('/:id/status', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid meeting status' });
      return;
    }

    const meeting = await MeetingModel.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    if (meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') {
      res.status(409).json({
        success: false,
        error: `Cannot reschedule a ${meeting.status.toLowerCase()} meeting.`,
      });
      return;
    }

    const previousStatus = meeting.status;
    meeting.status = status;
    await meeting.save();

    try {
      const members = await MemberModel.find({ _id: { $in: meeting.participantMemberIds } });
      for (const m of members) {
        let u = await UserModel.findOne({ email: m.email.toLowerCase().trim() });
        const targetUserId = u?._id || m._id;
        await notifyMember({
          userId: targetUserId,
          eventType: `MEETING_${status}`,
          title: `Meeting ${status === 'COMPLETED' ? 'Completed' : 'Cancelled'}: ${meeting.title}`,
          message: `Your meeting "${meeting.title}" has been marked as ${status.toLowerCase()}.`,
          link: '/meetings',
          priority: 'MEDIUM'
        });
      }
    } catch {}

    await logAdminAction(req, `MEETING_STATUS_${status}`, 'Meeting', id, {
      previousStatus,
      newStatus: status,
    });

    const populated = await MeetingModel.findById(id)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName');

    res.json({ success: true, message: `Meeting marked as ${status}`, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/meetings/:id/reschedule - Reschedule meeting time & duration
router.patch('/:id/reschedule', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes, meetingLink, note } = req.body;

    if (!scheduledAt) {
      res.status(400).json({ success: false, error: 'New scheduled date/time is required.' });
      return;
    }

    const meeting = await MeetingModel.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    if (meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') {
      res.status(409).json({
        success: false,
        error: `Cannot reschedule a ${meeting.status.toLowerCase()} meeting.`,
      });
      return;
    }

    const prevScheduledAt = meeting.scheduledAt;
    meeting.scheduledAt = new Date(scheduledAt);
    if (durationMinutes) meeting.durationMinutes = Number(durationMinutes);
    if (meetingLink) meeting.meetingLink = meetingLink;
    meeting.status = 'SCHEDULED';
    await meeting.save();

    try {
      const members = await MemberModel.find({ _id: { $in: meeting.participantMemberIds } });
      for (const m of members) {
        let u = await UserModel.findOne({ email: m.email.toLowerCase().trim() });
        const targetUserId = u?._id || m._id;
        await notifyMember({
          userId: targetUserId,
          eventType: 'MEETING_RESCHEDULED',
          title: `Meeting Rescheduled: ${meeting.title}`,
          message: `Your meeting "${meeting.title}" has been rescheduled to ${new Date(scheduledAt).toLocaleString()}.`,
          link: '/meetings',
          priority: 'HIGH'
        });
      }
    } catch {}

    await logAdminAction(req, 'RESCHEDULE_MEETING', 'Meeting', id, {
      prevScheduledAt,
      newScheduledAt: meeting.scheduledAt,
      durationMinutes: meeting.durationMinutes,
      note,
    });

    const populated = await MeetingModel.findById(id)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName');

    res.json({ success: true, message: 'Meeting rescheduled successfully', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/meetings/:id - Cancel or delete a scheduled meeting
router.delete('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await MeetingModel.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    meeting.status = 'CANCELLED';
    await meeting.save();

    await logAdminAction(req, 'CANCEL_MEETING', 'Meeting', id, { title: meeting.title });

    res.json({ success: true, message: 'Meeting cancelled successfully', data: meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


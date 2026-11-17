import { Router, Response } from 'express';
import mongoose from 'mongoose';
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

    // Sync any Student-Mentor Mentorship Requests into Meetings so Admin has complete visibility
    try {
      const { MentorshipRequestModel } = await import('../../mentoring/mentorship.model');
      const mentorshipSessions = await MentorshipRequestModel.find({});
      const sampleAdmin = await AdminUserModel.findOne();

      for (const mReq of mentorshipSessions) {
        const titleStr = mReq.title || `Student Mentorship: ${mReq.studentName} with ${mReq.mentorName}`;
        const existing = await MeetingModel.findOne({
          $or: [
            { title: titleStr },
            { description: { $regex: mReq.requestId || String(mReq._id) } }
          ]
        });

        if (!existing) {
          const participantMembers = await MemberModel.find({
            $or: [
              { _id: { $in: [mReq.studentId, mReq.mentorId] } },
              { email: { $in: [mReq.studentEmail ? mReq.studentEmail.toLowerCase() : ''] } }
            ]
          }).select('_id');

          const scheduledAtDate = mReq.confirmedDate
            ? new Date(`${mReq.confirmedDate} ${mReq.confirmedTime || '11:00 AM'}`)
            : new Date(`${mReq.preferredDate} ${mReq.preferredTime || '11:00 AM'}`);

          await MeetingModel.create({
            title: titleStr,
            description: `[${mReq.requestId}] ${mReq.purpose}: ${mReq.reason || ''}. Student: ${mReq.studentName}, Mentor: ${mReq.mentorName}.`,
            hostAdminId: sampleAdmin?._id,
            participantMemberIds: participantMembers.map((p) => p._id),
            externalParticipants: [
              { name: mReq.studentName, email: mReq.studentEmail || '', phone: '', roleOrCompany: 'Student' },
              { name: mReq.mentorName, email: '', phone: '', roleOrCompany: 'Mentor' }
            ],
            meetingType: 'GENERAL_CONSULTATION',
            scheduledAt: isNaN(scheduledAtDate.getTime()) ? new Date() : scheduledAtDate,
            durationMinutes: 45,
            meetingLink: mReq.locationOrUrl || 'https://meet.google.com/fic-mentor-session',
            status: mReq.status === 'COMPLETED' ? 'COMPLETED' : mReq.status === 'REJECTED' || mReq.status === 'CANCELLED' ? 'CANCELLED' : mReq.status === 'CONFIRMED' || mReq.status === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING_COORDINATION',
            notificationSent: true
          });
        }
      }
    } catch (mentorSyncErr) {
      console.warn('Mentorship meeting sync warning:', mentorSyncErr);
    }

    // Sync Service Request Stage 1 & Stage 2 meetings into Meetings collection
    try {
      const { FicRequestModel } = await import('../models/FicRequest');
      const serviceRequestsWithMeetings = await FicRequestModel.find({
        $or: [
          { 'stage1Meeting.status': { $in: ['SCHEDULED', 'COMPLETED'] } },
          { 'stage2Meeting.status': { $in: ['SCHEDULED', 'COMPLETED'] } },
        ],
      }).populate('requesterId targetProviderId');

      const sampleAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

      for (const r of serviceRequestsWithMeetings) {
        // Stage 1 Sync
        if (r.stage1Meeting?.status && ['SCHEDULED', 'COMPLETED'].includes(r.stage1Meeting.status)) {
          let existingMeeting = r.stage1Meeting.meetingId ? await MeetingModel.findById(r.stage1Meeting.meetingId) : null;
          const pName = (r.targetProviderId as any)?.name || 'Provider';
          const pEmail = (r.targetProviderId as any)?.email || '';
          const sDate = r.stage1Meeting.scheduledDate && r.stage1Meeting.scheduledTime
            ? new Date(`${r.stage1Meeting.scheduledDate}T${r.stage1Meeting.scheduledTime}:00`)
            : new Date();

          if (!existingMeeting) {
            existingMeeting = await MeetingModel.create({
              title: `Stage 1 Intro: Admin & Provider (${pName}) - ${r.title}`,
              description: `Stage 1 alignment meeting between FIC Admin and service provider for request ${r.requestId || r._id}. Requestor is excluded from this stage.`,
              hostAdminId: r.stage1Meeting.scheduledByAdminId || sampleAdmin?._id,
              participantMemberIds: (r.targetProviderId as any)?._id ? [(r.targetProviderId as any)._id] : [],
              externalParticipants: [{ name: pName, email: pEmail, roleOrCompany: 'Service Provider' }],
              scheduledAt: isNaN(sDate.getTime()) ? new Date() : sDate,
              durationMinutes: r.stage1Meeting.durationMinutes || 45,
              meetingLink: r.stage1Meeting.meetingLink,
              status: r.stage1Meeting.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
              meetingType: 'CONSULTATION',
              notificationSent: true,
            });
            await FicRequestModel.findByIdAndUpdate(r._id, { 'stage1Meeting.meetingId': existingMeeting._id.toString() });
          } else if (existingMeeting.status !== r.stage1Meeting.status) {
            existingMeeting.status = r.stage1Meeting.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED';
            await existingMeeting.save();
          }
        }

        // Stage 2 Sync
        if (r.stage2Meeting?.status && ['SCHEDULED', 'COMPLETED'].includes(r.stage2Meeting.status)) {
          let existingMeeting = r.stage2Meeting.meetingId ? await MeetingModel.findById(r.stage2Meeting.meetingId) : null;
          const reqName = (r.requesterId as any)?.name || r.requesterName || 'Client';
          const reqEmail = (r.requesterId as any)?.email || r.requesterEmail || '';
          const sDate = r.stage2Meeting.scheduledDate && r.stage2Meeting.scheduledTime
            ? new Date(`${r.stage2Meeting.scheduledDate}T${r.stage2Meeting.scheduledTime}:00`)
            : new Date();

          if (!existingMeeting) {
            existingMeeting = await MeetingModel.create({
              title: `Stage 2 Briefing: Admin & Requestor (${reqName}) - ${r.title}`,
              description: `Stage 2 debrief meeting between FIC Admin and original service requestor for request ${r.requestId || r._id}. Provider is excluded from this stage.`,
              hostAdminId: r.stage2Meeting.scheduledByAdminId || sampleAdmin?._id,
              participantMemberIds: (r.requesterId as any)?._id ? [(r.requesterId as any)._id] : [],
              externalParticipants: [{ name: reqName, email: reqEmail, roleOrCompany: 'Service Requestor' }],
              scheduledAt: isNaN(sDate.getTime()) ? new Date() : sDate,
              durationMinutes: r.stage2Meeting.durationMinutes || 45,
              meetingLink: r.stage2Meeting.meetingLink,
              status: r.stage2Meeting.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
              meetingType: 'CONSULTATION',
              notificationSent: true,
            });
            await FicRequestModel.findByIdAndUpdate(r._id, { 'stage2Meeting.meetingId': existingMeeting._id.toString() });
          } else if (existingMeeting.status !== r.stage2Meeting.status) {
            existingMeeting.status = r.stage2Meeting.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED';
            await existingMeeting.save();
          }
        }
      }
    } catch (srvMeetingSyncErr) {
      console.warn('Service requests meeting sync warning:', srvMeetingSyncErr);
    }

    // Sync Scaling Requests with meetings into central Meetings collection
    try {
      const { BusinessDevRequestModel } = await import('../../business-development/business-development.model');
      const scalingWithMeetings = await BusinessDevRequestModel.find({
        $or: [
          { status: { $in: ['MEETING_SCHEDULED', 'MEETING_COMPLETED'] } },
          { 'meetingDetails.scheduledAt': { $exists: true, $ne: null } },
          { 'meetingDetails.date': { $exists: true, $ne: '' } }
        ]
      });

      const sampleAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

      for (const sReq of scalingWithMeetings) {
        let existingMeeting = sReq.meetingDetails?.meetingId
          ? await MeetingModel.findById(sReq.meetingDetails.meetingId)
          : null;

        if (!existingMeeting) {
          existingMeeting = await MeetingModel.findOne({
            $or: [
              { title: `Business Scaling Advisory: ${sReq.businessName}` },
              { description: { $regex: sReq.requestId || String(sReq._id) } }
            ]
          });
        }

        const sDate = sReq.meetingDetails?.scheduledAt || (
          sReq.meetingDetails?.date && sReq.meetingDetails?.time
            ? new Date(`${sReq.meetingDetails.date}T${sReq.meetingDetails.time}:00`)
            : new Date()
        );

        const isCompleted = sReq.status === 'MEETING_COMPLETED' || sReq.meetingDetails?.isCompleted;

        if (!existingMeeting) {
          const sReqAny = sReq as any;
          const member = await MemberModel.findOne({
            $or: [
              ...(mongoose.isValidObjectId(sReq.userId) ? [{ userId: sReq.userId }, { _id: sReq.userId }] : []),
              ...(sReq.submitterEmail ? [{ email: sReq.submitterEmail }] : []),
              ...(sReqAny.applicantEmail ? [{ email: sReqAny.applicantEmail }] : [])
            ]
          });

          const participantMemberIds = member?._id
            ? [member._id]
            : mongoose.isValidObjectId(sReq.userId)
            ? [new mongoose.Types.ObjectId(sReq.userId)]
            : [];

          existingMeeting = await MeetingModel.create({
            title: `Business Scaling Advisory: ${sReq.businessName || 'Scaling'}`,
            description: sReq.meetingDetails?.notes || `FIC scaling consultation for ${sReq.scalingSupportType || 'Business Scaling'}. [${sReq.requestId || sReq._id}]`,
            hostAdminId: sampleAdmin?._id,
            participantMemberIds,
            externalParticipants: [
              {
                name: sReq.submitterName || member?.name || 'Member',
                email: sReq.submitterEmail || sReqAny.applicantEmail || member?.email || 'member@fic.com',
                phone: sReq.submitterPhone || member?.phone || '',
                roleOrCompany: sReq.businessName || 'Business Owner'
              }
            ],
            meetingType: 'CONSULTATION',
            scheduledAt: isNaN(new Date(sDate).getTime()) ? new Date() : new Date(sDate),
            durationMinutes: sReq.meetingDetails?.durationMinutes || 45,
            meetingLink: sReq.meetingDetails?.linkOrLocation || 'https://meet.google.com/fic-scaling-session',
            status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
            notificationSent: true
          });

          if (!sReq.meetingDetails) {
            (sReq as any).meetingDetails = { meetingId: existingMeeting._id.toString() };
          } else {
            sReq.meetingDetails.meetingId = existingMeeting._id.toString();
          }
          await sReq.save();
        } else {
          let changed = false;
          if (isCompleted && existingMeeting.status !== 'COMPLETED') {
            existingMeeting.status = 'COMPLETED';
            changed = true;
          }
          if (sReq.meetingDetails?.linkOrLocation && existingMeeting.meetingLink !== sReq.meetingDetails.linkOrLocation) {
            existingMeeting.meetingLink = sReq.meetingDetails.linkOrLocation;
            changed = true;
          }
          if (!existingMeeting.hostAdminId && sampleAdmin?._id) {
            existingMeeting.hostAdminId = sampleAdmin._id;
            changed = true;
          }
          if (changed) await existingMeeting.save();
        }
      }
    } catch (scalingSyncErr) {
      console.warn('Scaling meeting sync warning:', scalingSyncErr);
    }

    const defaultAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

    let meetings = await MeetingModel.find(filter)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('relatedFundingApplicationId', 'businessName requestedAmount approvedPrincipal stage')
      .sort({ scheduledAt: -1 });

    // Ensure hostAdminId has proper fallback data for any orphaned meetings
    meetings = meetings.map((m: any) => {
      const mObj = m.toObject ? m.toObject() : m;
      if (!mObj.hostAdminId || !mObj.hostAdminId.name) {
        mObj.hostAdminId = {
          _id: defaultAdmin?._id,
          name: defaultAdmin?.name || 'FIC Super Administrator',
          email: defaultAdmin?.email || 'admin@fic.com',
          role: defaultAdmin?.role || 'SUPER_ADMIN'
        };
      }
      return mObj;
    });

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


import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { MeetingModel } from '../models/Meeting';
import { CentralMeetingsService } from '../services/central-meetings.service';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/meetings - List all meetings with optional filters across all modules
router.get('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { status, sourceModule, search, startDate, endDate } = req.query;
    const meetings = await CentralMeetingsService.getAdminMeetings({
      status: status ? String(status) : undefined,
      sourceModule: sourceModule ? String(sourceModule) : undefined,
      search: search ? String(search) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    });

    res.json({ success: true, data: meetings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/meetings/:id - Get single meeting details
router.get('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await MeetingModel.findOne({
      $or: [
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
        { meetingId: id }
      ]
    })
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('providerId', 'name email phone primaryCategoryName')
      .populate('relatedFundingApplicationId', 'businessName requestedAmount approvedPrincipal stage');

    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    res.json({ success: true, data: meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/meetings - Create & schedule a new direct meeting
router.post('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      participantMemberIds,
      scheduledAt,
      meetingDate,
      startTime,
      durationMinutes,
      meetingLink,
      meetingLocation,
      meetingMode = 'VIRTUAL',
      sourceModule = 'DIRECT_ADMIN',
      relatedEntityId,
      externalParticipants = []
    } = req.body;

    if (!title || (!scheduledAt && (!meetingDate || !startTime))) {
      res.status(400).json({
        success: false,
        error: 'Title and scheduled date/time are required.',
      });
      return;
    }

    const hostAdminId = req.admin!.id;
    const hostAdminName = req.admin?.name || 'FIC Super Administrator';

    const dateStr = meetingDate || (scheduledAt ? new Date(scheduledAt).toISOString().split('T')[0] : '');
    const timeStr = startTime || (scheduledAt ? new Date(scheduledAt).toTimeString().substring(0, 5) : '11:00');

    const meeting = await CentralMeetingsService.syncOrCreateMeeting({
      sourceModule,
      sourceRecordId: `direct-${Date.now()}`,
      relatedEntityId,
      title,
      description,
      hostAdminId,
      hostAdminName,
      participantMemberIds,
      externalParticipants,
      meetingDate: dateStr,
      startTime: timeStr,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingMode,
      meetingLink,
      meetingLocation,
      meetingType: 'CONSULTATION',
      status: 'SCHEDULED'
    });

    await logAdminAction(req, 'SCHEDULE_MEETING', 'Meeting', meeting._id.toString(), {
      title,
      scheduledAt: meeting.scheduledAt,
      meetingLink: meeting.meetingLink,
      sourceModule
    });

    const populated = await MeetingModel.findById(meeting._id)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('providerId', 'name email phone primaryCategoryName');

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/meetings/:id/status - Update meeting status (IN_PROGRESS, COMPLETED, CANCELLED)
router.patch('/:id/status', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;

    if (!['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid meeting status' });
      return;
    }

    let updatedMeeting: any = null;
    if (status === 'COMPLETED') {
      updatedMeeting = await CentralMeetingsService.completeMeeting(id, notes);
    } else if (status === 'CANCELLED') {
      updatedMeeting = await CentralMeetingsService.cancelMeeting(id, reason || notes);
    } else {
      const meeting = await MeetingModel.findById(id);
      if (!meeting) {
        res.status(404).json({ success: false, error: 'Meeting not found' });
        return;
      }
      meeting.status = status;
      await meeting.save();
      updatedMeeting = meeting;
    }

    if (!updatedMeeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    await logAdminAction(req, `MEETING_STATUS_${status}`, 'Meeting', id, {
      newStatus: status,
      notes
    });

    const populated = await MeetingModel.findById(updatedMeeting._id)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('providerId', 'name email phone primaryCategoryName');

    res.json({ success: true, message: `Meeting marked as ${status}`, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/meetings/:id/reschedule - Reschedule meeting time & duration across ecosystem
router.patch('/:id/reschedule', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, date, time, durationMinutes, meetingLink, meetingLocation, note } = req.body;

    const dateVal = date || (scheduledAt ? new Date(scheduledAt).toISOString().split('T')[0] : '');
    const timeVal = time || (scheduledAt ? new Date(scheduledAt).toTimeString().substring(0, 5) : '11:00');

    if (!dateVal || !timeVal) {
      res.status(400).json({ success: false, error: 'New scheduled date and time are required.' });
      return;
    }

    const meeting = await CentralMeetingsService.rescheduleMeeting(id, {
      date: dateVal,
      time: timeVal,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      meetingLink,
      meetingLocation,
      notes: note,
      adminName: req.admin?.name
    });

    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    await logAdminAction(req, 'RESCHEDULE_MEETING', 'Meeting', id, {
      newScheduledAt: meeting.scheduledAt,
      durationMinutes: meeting.durationMinutes,
      note,
    });

    const populated = await MeetingModel.findById(meeting._id)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('providerId', 'name email phone primaryCategoryName');

    res.json({ success: true, message: 'Meeting rescheduled successfully', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/meetings/:id - Cancel a scheduled meeting
router.delete('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const meeting = await CentralMeetingsService.cancelMeeting(id, reason);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    await logAdminAction(req, 'CANCEL_MEETING', 'Meeting', id, { title: meeting.title, reason });

    res.json({ success: true, message: 'Meeting cancelled successfully', data: meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

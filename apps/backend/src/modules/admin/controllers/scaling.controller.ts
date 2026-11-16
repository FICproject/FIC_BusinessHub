import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { BusinessDevRequestModel } from '../../business-development/business-development.model';
import { FicRequestModel } from '../models/FicRequest';
import { MeetingModel } from '../models/Meeting';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { notifyMember } from '../../notifications/notifications.service';
import {
  authenticateAdmin,
  AuthenticatedAdminRequest,
  logAdminAction,
  requirePermission
} from '../middleware/admin-auth.middleware';

export const adminScalingRouter = Router();

/**
 * Helper to robustly find a Scaling Request by ID, RequestID, RefNumber,
 * or even a linked FicRequest _id.
 */
async function findScalingDoc(id: string) {
  let doc = await BusinessDevRequestModel.findOne({
    $or: [
      { _id: mongoose.isValidObjectId(id) ? id : null },
      { requestId: id },
      { refNumber: id }
    ]
  });

  if (!doc && mongoose.isValidObjectId(id)) {
    const ficReq = await FicRequestModel.findById(id).lean();
    if (ficReq?.sourceRefId) {
      doc = await BusinessDevRequestModel.findById(ficReq.sourceRefId);
    }
  }

  return doc;
}

/**
 * Helper to keep FicRequestModel in sync with Scaling status & meeting details
 */
async function syncFicRequest(scalingDoc: any, updates: Record<string, any>) {
  try {
    await FicRequestModel.findOneAndUpdate(
      {
        $or: [
          { sourceRefId: scalingDoc._id },
          { requestId: scalingDoc.requestId }
        ]
      },
      { $set: updates }
    );
  } catch (err) {
    console.warn('Failed to sync FicRequestModel from scaling action:', err);
  }
}

// ========================================================
// 1. List All Scaling Requests (Admin)
// ========================================================
adminScalingRouter.get(
  '/',
  authenticateAdmin,
  requirePermission('SERVICES_READ', 'REQUESTS_READ', 'SCALING_READ'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { status, supportType, search, page = 1, limit = 50 } = req.query;

      const filter: Record<string, any> = {};

      if (status && status !== 'ALL') {
        filter.status = status;
      }

      if (supportType && supportType !== 'ALL') {
        filter.$or = [
          { scalingSupportType: supportType },
          { supportType: supportType }
        ];
      }

      if (search) {
        const q = String(search).trim();
        const searchRegex = new RegExp(q, 'i');
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { requestId: searchRegex },
            { refNumber: searchRegex },
            { businessName: searchRegex },
            { submitterName: searchRegex },
            { submitterEmail: searchRegex },
            { mainCategoryName: searchRegex },
            { subcategoryName: searchRegex },
            { currentBusinessLocation: searchRegex },
            { targetExpansionLocation: searchRegex }
          ]
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [items, total] = await Promise.all([
        BusinessDevRequestModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        BusinessDevRequestModel.countDocuments(filter)
      ]);

      // Calculate summary statistics
      const [totalCount, submittedCount, reviewCount, scheduledCount, completedCount] = await Promise.all([
        BusinessDevRequestModel.countDocuments(),
        BusinessDevRequestModel.countDocuments({ status: 'SUBMITTED' }),
        BusinessDevRequestModel.countDocuments({ status: 'UNDER_REVIEW' }),
        BusinessDevRequestModel.countDocuments({ status: 'MEETING_SCHEDULED' }),
        BusinessDevRequestModel.countDocuments({ status: 'MEETING_COMPLETED' })
      ]);

      res.status(200).json({
        success: true,
        items,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        stats: {
          total: totalCount,
          submitted: submittedCount,
          underReview: reviewCount,
          scheduled: scheduledCount,
          completed: completedCount
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 2. Get Single Scaling Request Details (Admin)
// ========================================================
adminScalingRouter.get(
  '/:id',
  authenticateAdmin,
  requirePermission('SERVICES_READ', 'REQUESTS_READ', 'SCALING_READ'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const request: any = await findScalingDoc(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found.' });
        return;
      }

      // Fetch submitter credentials from Member & User models
      let submitterDetails: any = null;
      if (request.userId) {
        const user: any = await UserModel.findById(request.userId)
          .select('fullName email phoneNumber isKycApproved primaryCategoryName subCategory status')
          .lean();
        const member: any = await MemberModel.findOne({
          $or: [{ _id: request.userId }, { email: request.submitterEmail }]
        })
          .select('name email phone kycStatus paymentStatus primaryCategoryName subcategories status')
          .lean();

        submitterDetails = {
          name: member?.name || user?.fullName || request.submitterName,
          email: member?.email || user?.email || request.submitterEmail,
          phone: member?.phone || user?.phoneNumber || request.submitterPhone,
          kycStatus: member?.kycStatus || (user?.isKycApproved ? 'APPROVED' : 'PENDING'),
          primaryCategoryName: member?.primaryCategoryName || user?.primaryCategoryName || request.mainCategoryName,
          subcategories: member?.subcategories || [user?.subCategory || request.subcategoryName],
          status: member?.status || user?.status || 'ACTIVE'
        };
      }

      res.status(200).json({
        success: true,
        data: {
          ...(request.toObject ? request.toObject() : request),
          submitterDetails
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 3. Update Status (e.g. Under Review)
// ========================================================
adminScalingRouter.put(
  '/:id/status',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE', 'REQUESTS_APPROVE', 'SCALING_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const request: any = await findScalingDoc(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found.' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      if (status) request.status = status;
      if (adminNotes !== undefined) request.adminNotes = String(adminNotes).trim();

      request.activityTimeline = request.activityTimeline || [];
      request.activityTimeline.push({
        action: `Status Updated to ${status}`,
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: adminNotes || `Scaling request marked as ${status}.`,
        timestamp: new Date()
      });

      await request.save();

      // Sync central FicRequest
      await syncFicRequest(request, {
        status: request.status,
        internalNotes: [`[${new Date().toISOString()} by ${adminName}]: Status updated to ${status}.`]
      });

      // Log admin audit action
      await logAdminAction(
        req,
        'SCALING_STATUS_UPDATE',
        'BusinessDevRequest',
        String(request._id),
        { previousStatus: request.status, newStatus: status }
      );

      // Notify member if marked UNDER_REVIEW
      if (status === 'UNDER_REVIEW') {
        await notifyMember({
          userId: String(request.userId),
          eventType: 'SCALING_STATUS_CHANGED',
          title: 'Scaling Request Under Review',
          message: `Your scaling request for "${request.businessName}" is now being reviewed by FIC Admin.`
        });
      }

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}.`,
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 4. Arrange Meeting (Schedule Consultation)
// ========================================================
adminScalingRouter.post(
  '/:id/schedule-meeting',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE', 'REQUESTS_APPROVE', 'SCALING_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, time, mode, linkOrLocation, notes, durationMinutes = 45 } = req.body;

      if (!date || !time) {
        res.status(400).json({ success: false, error: 'Meeting Date and Time are required.' });
        return;
      }

      if (!linkOrLocation || !String(linkOrLocation).trim()) {
        res.status(400).json({
          success: false,
          error: mode === 'VIRTUAL' ? 'Virtual Meeting Link is required.' : 'Meeting Location address is required.'
        });
        return;
      }

      const request: any = await findScalingDoc(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found.' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      // Parse scheduled timestamp
      const scheduledDateTime = new Date(`${date}T${time}`);

      // Create / Sync central MeetingModel record so it appears in the member's Meetings tab
      let meetingDoc: any = null;
      try {
        const hostAdminObjectId = mongoose.isValidObjectId(adminId)
          ? new mongoose.Types.ObjectId(adminId)
          : new mongoose.Types.ObjectId();

        meetingDoc = await MeetingModel.create({
          title: `Business Scaling Advisory: ${request.businessName}`,
          description: notes || `FIC scaling consultation for ${request.scalingSupportType || 'Business Scaling'}.`,
          hostAdminId: hostAdminObjectId,
          participantMemberIds: mongoose.isValidObjectId(request.userId) ? [request.userId] : [],
          externalParticipants: [
            {
              name: request.submitterName || 'Member',
              email: request.submitterEmail || 'member@fic.com',
              phone: request.submitterPhone || '',
              roleOrCompany: request.businessName
            }
          ],
          meetingType: 'CONSULTATION',
          scheduledAt: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
          durationMinutes: Number(durationMinutes) || 45,
          meetingLink: mode === 'VIRTUAL' ? linkOrLocation : undefined,
          status: 'SCHEDULED',
          notificationSent: true
        });
      } catch (meetErr) {
        console.warn('Could not create MeetingModel entry:', meetErr);
      }

      // Update Scaling Request status and embedded meetingDetails
      request.status = 'MEETING_SCHEDULED';
      request.meetingDetails = {
        meetingId: meetingDoc?._id ? String(meetingDoc._id) : undefined,
        date: String(date).trim(),
        time: String(time).trim(),
        durationMinutes: Number(durationMinutes) || 45,
        mode: mode === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL',
        linkOrLocation: String(linkOrLocation).trim(),
        notes: notes ? String(notes).trim() : '',
        scheduledAt: new Date(),
        scheduledBy: adminName,
        isCompleted: false
      };

      request.latestFicUpdate = `Meeting arranged for ${date} at ${time} (${mode === 'IN_PERSON' ? 'In-Person' : 'Virtual Session'}).`;
      request.whatHappensNext = 'Please join the scheduled meeting on the designated date and time.';

      request.activityTimeline = request.activityTimeline || [];
      request.activityTimeline.push({
        action: 'Meeting Arranged by Admin',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: `Scheduled ${mode} meeting on ${date} at ${time}. Venue/Link: ${linkOrLocation}.`,
        timestamp: new Date()
      });

      await request.save();

      // Sync central FicRequest
      await syncFicRequest(request, {
        status: 'MEETING_SCHEDULED',
        scheduledMeetingId: meetingDoc?._id,
        meetingDetails: {
          scheduledDate: String(date).trim(),
          scheduledTime: String(time).trim(),
          durationMinutes: Number(durationMinutes) || 45,
          meetingLink: mode === 'VIRTUAL' ? linkOrLocation : undefined,
          status: 'SCHEDULED',
          bookedAt: new Date(),
          bookedByAdminName: adminName
        }
      });

      // Log admin audit action
      await logAdminAction(
        req,
        'SCALING_MEETING_SCHEDULED',
        'BusinessDevRequest',
        String(request._id),
        { date, time, mode, linkOrLocation }
      );

      // Notify Member
      await notifyMember({
        userId: String(request.userId),
        eventType: 'MEETING_SCHEDULED',
        title: 'Scaling Consultation Scheduled',
        message: `FIC Admin has arranged a ${mode === 'IN_PERSON' ? 'In-person' : 'Virtual'} scaling consultation for "${request.businessName}" on ${date} at ${time}.`
      });

      res.status(200).json({
        success: true,
        message: 'Meeting successfully arranged and member notified.',
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 5. Reschedule Meeting
// ========================================================
adminScalingRouter.post(
  '/:id/reschedule-meeting',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE', 'REQUESTS_APPROVE', 'SCALING_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, time, mode, linkOrLocation, notes, durationMinutes = 45 } = req.body;

      if (!date || !time) {
        res.status(400).json({ success: false, error: 'New Meeting Date and Time are required.' });
        return;
      }

      const request: any = await findScalingDoc(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found.' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      const prevMeeting = request.meetingDetails;

      request.meetingDetails = {
        ...prevMeeting,
        date: String(date).trim(),
        time: String(time).trim(),
        durationMinutes: Number(durationMinutes) || 45,
        mode: mode ? (mode === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL') : prevMeeting?.mode || 'VIRTUAL',
        linkOrLocation: linkOrLocation ? String(linkOrLocation).trim() : prevMeeting?.linkOrLocation || '',
        notes: notes !== undefined ? String(notes).trim() : prevMeeting?.notes || '',
        scheduledAt: new Date(),
        scheduledBy: adminName,
        isCompleted: false
      };

      request.status = 'MEETING_SCHEDULED';
      request.latestFicUpdate = `Meeting rescheduled to ${date} at ${time}.`;

      request.activityTimeline = request.activityTimeline || [];
      request.activityTimeline.push({
        action: 'Meeting Rescheduled',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: `Rescheduled to ${date} at ${time}. ${notes || ''}`,
        timestamp: new Date()
      });

      // Update linked MeetingModel if exists
      if (prevMeeting?.meetingId && mongoose.isValidObjectId(prevMeeting.meetingId)) {
        try {
          const scheduledDateTime = new Date(`${date}T${time}`);
          await MeetingModel.findByIdAndUpdate(prevMeeting.meetingId, {
            scheduledAt: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
            meetingLink: mode === 'VIRTUAL' ? linkOrLocation : undefined,
            status: 'SCHEDULED'
          });
        } catch (mErr) {
          console.warn('Failed to update linked MeetingModel:', mErr);
        }
      }

      await request.save();

      // Sync central FicRequest
      await syncFicRequest(request, {
        status: 'MEETING_SCHEDULED',
        meetingDetails: {
          scheduledDate: String(date).trim(),
          scheduledTime: String(time).trim(),
          durationMinutes: Number(durationMinutes) || 45,
          meetingLink: mode === 'VIRTUAL' ? linkOrLocation : undefined,
          status: 'RESCHEDULED',
          bookedAt: new Date(),
          bookedByAdminName: adminName
        }
      });

      // Notify Member
      await notifyMember({
        userId: String(request.userId),
        eventType: 'MEETING_SCHEDULED',
        title: 'Meeting Rescheduled',
        message: `Your scaling consultation for "${request.businessName}" has been rescheduled to ${date} at ${time}.`
      });

      res.status(200).json({
        success: true,
        message: 'Meeting rescheduled successfully and member notified.',
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 6. Cancel Meeting
// ========================================================
adminScalingRouter.post(
  '/:id/cancel-meeting',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE', 'REQUESTS_APPROVE', 'SCALING_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      const request: any = await findScalingDoc(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found.' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      const prevMeetingId = request.meetingDetails?.meetingId;

      request.status = 'UNDER_REVIEW'; // Returns to Under Review so Admin can reschedule
      request.latestFicUpdate = 'Scheduled meeting was cancelled. FIC Admin is reviewing the next steps.';

      request.activityTimeline = request.activityTimeline || [];
      request.activityTimeline.push({
        action: 'Meeting Cancelled',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: cancellationReason || 'Scheduled session cancelled by Admin.',
        timestamp: new Date()
      });

      // Update linked MeetingModel to CANCELLED
      if (prevMeetingId && mongoose.isValidObjectId(prevMeetingId)) {
        try {
          await MeetingModel.findByIdAndUpdate(prevMeetingId, { status: 'CANCELLED' });
        } catch (mErr) {
          console.warn('Failed to cancel linked MeetingModel:', mErr);
        }
      }

      await request.save();

      // Sync central FicRequest
      await syncFicRequest(request, {
        status: 'UNDER_REVIEW',
        meetingDetails: undefined
      });

      // Notify Member
      await notifyMember({
        userId: String(request.userId),
        eventType: 'MEETING_SCHEDULED',
        title: 'Scaling Consultation Cancelled',
        message: `Your scaling consultation for "${request.businessName}" was cancelled: ${cancellationReason || 'Our team will contact you to reschedule.'}`
      });

      res.status(200).json({
        success: true,
        message: 'Meeting cancelled. Request reverted to Under Review.',
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 7. Mark Meeting as Completed (Workflow Finish)
// ========================================================
adminScalingRouter.post(
  '/:id/complete-meeting',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE', 'REQUESTS_APPROVE', 'SCALING_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { completionSummary, adminNotes } = req.body;

      const request: any = await findScalingDoc(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found.' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';
      const completionDate = new Date();

      request.status = 'MEETING_COMPLETED';
      request.meetingCompletedAt = completionDate;
      if (completionSummary) request.completionSummary = String(completionSummary).trim();
      if (adminNotes !== undefined) request.adminNotes = String(adminNotes).trim();

      if (request.meetingDetails) {
        request.meetingDetails.isCompleted = true;
        request.meetingDetails.completedAt = completionDate;
        request.meetingDetails.completionSummary = completionSummary ? String(completionSummary).trim() : '';
      }

      request.latestFicUpdate = 'Consultation meeting completed successfully. Scaling advisory concluded.';
      request.whatHappensNext = 'The scaling request workflow is completed. You may explore separate funding or partnership tracks as needed.';

      request.activityTimeline = request.activityTimeline || [];
      request.activityTimeline.push({
        action: 'Meeting Marked as Completed',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: completionSummary || 'Consultation meeting concluded successfully.',
        timestamp: completionDate
      });

      // Update linked MeetingModel
      if (request.meetingDetails?.meetingId && mongoose.isValidObjectId(request.meetingDetails.meetingId)) {
        try {
          await MeetingModel.findByIdAndUpdate(request.meetingDetails.meetingId, { status: 'COMPLETED' });
        } catch (mErr) {
          console.warn('Failed to mark linked MeetingModel completed:', mErr);
        }
      }

      await request.save();

      // Sync central FicRequest
      await syncFicRequest(request, {
        status: 'MEETING_COMPLETED',
        'meetingDetails.status': 'COMPLETED'
      });

      // Log admin audit action
      await logAdminAction(
        req,
        'SCALING_MEETING_COMPLETED',
        'BusinessDevRequest',
        String(request._id),
        { completionSummary, completionDate }
      );

      // Notify Member
      await notifyMember({
        userId: String(request.userId),
        eventType: 'MEETING_COMPLETED',
        title: 'Scaling Consultation Completed',
        message: `Your scaling consultation for "${request.businessName}" has been successfully completed. Thank you for collaborating with FIC!`
      });

      res.status(200).json({
        success: true,
        message: 'Meeting marked as completed. Scaling workflow is finished.',
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

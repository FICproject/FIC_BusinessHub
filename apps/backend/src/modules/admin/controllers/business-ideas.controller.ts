import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { BusinessIdeaModel, BusinessIdeaInterestModel } from '../../business-ideas/business-ideas.model';
import { MemberModel } from '../models/Member';
import { AdminUserModel } from '../models/AdminUser';
import { MeetingModel } from '../models/Meeting';
import { notifyMember } from '../../notifications/notifications.service';
import {
  authenticateAdmin,
  AuthenticatedAdminRequest,
  logAdminAction,
  requirePermission
} from '../middleware/admin-auth.middleware';

export const adminBusinessIdeasRouter = Router();

// ========================================================
// 1. List All Business Ideas (Admin)
// ========================================================
adminBusinessIdeasRouter.get(
  '/',
  authenticateAdmin,
  requirePermission('SERVICES_READ'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { status, category, search, page = 1, limit = 50 } = req.query;

      const filter: Record<string, any> = {};

      if (status && status !== 'ALL') {
        filter.$or = [{ adminReviewStatus: status }, { status: status }];
      }

      if (category && category !== 'ALL') {
        filter.$or = [
          { mainCategoryId: category },
          { mainCategorySlug: category },
          { mainCategoryName: new RegExp(String(category), 'i') }
        ];
      }

      if (search) {
        const q = String(search).trim();
        const searchRegex = new RegExp(q, 'i');
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { ideaRequestId: searchRegex },
            { refNumber: searchRegex },
            { title: searchRegex },
            { submitterName: searchRegex },
            { submitterEmail: searchRegex },
            { mainCategoryName: searchRegex },
            { subcategoryName: searchRegex },
            { targetMarket: searchRegex },
            { targetLocation: searchRegex }
          ]
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [ideas, total] = await Promise.all([
        BusinessIdeaModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        BusinessIdeaModel.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          items: ideas,
          total,
          page: Number(page),
          pageSize: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 2. Get Single Business Idea with Interested Members (Admin)
// ========================================================
adminBusinessIdeasRouter.get(
  '/:id',
  authenticateAdmin,
  requirePermission('SERVICES_READ'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      }).lean();

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      // Fetch all interested members for this idea
      const interestedMembers = await BusinessIdeaInterestModel.find({
        ideaId: idea._id
      })
        .sort({ createdAt: -1 })
        .lean();

      // Fetch submitter member details if available
      let submitterDetails: any = null;
      if (idea.submitterMemberId) {
        submitterDetails = await MemberModel.findById(idea.submitterMemberId)
          .select('name email phone kycStatus paymentStatus primaryCategoryName subcategories status')
          .lean();
      }

      res.status(200).json({
        success: true,
        data: {
          ...idea,
          submitterDetails,
          interestedMembers
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 3. Admin Reviews Idea (Approve, Reject, Request Info, Notes)
// ========================================================
adminBusinessIdeasRouter.put(
  '/:id/review',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, adminNotes, rejectionReason, infoNotes } = req.body;

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      // Phase 7: State Transition Validation
      const currentStatus = (idea.status || idea.adminReviewStatus || '').toUpperCase();
      if (currentStatus === 'APPROVED' || currentStatus === 'SHARED_ON_MARKETPLACE' || currentStatus === 'ON_MARKETPLACE') {
        res.status(400).json({
          success: false,
          error: 'This business idea has already been approved and cannot be reviewed again.'
        });
        return;
      }

      if (currentStatus === 'REJECTED') {
        res.status(400).json({
          success: false,
          error: 'This business idea has already been rejected and cannot be reviewed further.'
        });
        return;
      }

      if (action === 'UNDER_REVIEW' && currentStatus === 'UNDER_REVIEW') {
        res.status(400).json({
          success: false,
          error: 'This business idea is already marked as Under Review.'
        });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      if (adminNotes !== undefined) {
        idea.adminNotes = String(adminNotes).trim();
      }

      if (action === 'APPROVE') {
        idea.adminReviewStatus = 'APPROVED';
        idea.status = 'APPROVED';
        idea.latestFicUpdate = 'Great news! Your business idea has been approved by FIC. Admin will now prepare it for network collaboration.';

        idea.activityTimeline.push({
          action: 'Idea Approved by Admin',
          actorType: 'ADMIN',
          actorId: adminId,
          actorName: adminName,
          notes: idea.adminNotes || 'Idea validated and approved for network collaboration.',
          timestamp: new Date()
        });

        // Notify Submitter
        await notifyMember({
          userId: String(idea.userId),
          eventType: 'BUSINESS_IDEA_APPROVED',
          title: 'Business Idea Approved! 🎉',
          message: `Your business idea "${idea.title}" has been approved by FIC Admin. Next step: sharing on the Marketplace.`,
          metadata: { link: '/business-ideas' }
        });
      } else if (action === 'REJECT') {
        if (!rejectionReason || !String(rejectionReason).trim()) {
          res.status(400).json({ success: false, error: 'Rejection reason is required.' });
          return;
        }

        idea.adminReviewStatus = 'REJECTED';
        idea.status = 'REJECTED';
        idea.rejectionReason = String(rejectionReason).trim();
        idea.latestFicUpdate = `Review Feedback: ${idea.rejectionReason}`;

        idea.activityTimeline.push({
          action: 'Idea Rejected',
          actorType: 'ADMIN',
          actorId: adminId,
          actorName: adminName,
          notes: `Rejection Reason: ${idea.rejectionReason}`,
          timestamp: new Date()
        });

        // Notify Submitter
        await notifyMember({
          userId: String(idea.userId),
          eventType: 'BUSINESS_IDEA_REJECTED',
          title: 'Business Idea Review Update',
          message: `FIC Admin has completed the review of your business idea "${idea.title}". Check details for feedback.`,
          metadata: { link: '/business-ideas' }
        });
      } else if (action === 'REQUEST_INFO') {
        if (!infoNotes || !String(infoNotes).trim()) {
          res.status(400).json({ success: false, error: 'Please specify the information requested from the member.' });
          return;
        }

        idea.adminReviewStatus = 'INFORMATION_REQUESTED';
        idea.status = 'INFORMATION_REQUESTED';
        idea.informationRequestNotes = String(infoNotes).trim();
        idea.latestFicUpdate = `Information Requested: ${idea.informationRequestNotes}`;

        idea.activityTimeline.push({
          action: 'Additional Information Requested',
          actorType: 'ADMIN',
          actorId: adminId,
          actorName: adminName,
          notes: idea.informationRequestNotes,
          timestamp: new Date()
        });

        // Notify Submitter
        await notifyMember({
          userId: String(idea.userId),
          eventType: 'BUSINESS_IDEA_INFO_REQUESTED',
          title: 'Action Required: Information Requested',
          message: `FIC Admin requested additional details for your business idea "${idea.title}". Please review and provide details.`,
          metadata: { link: '/business-ideas' }
        });
      } else if (action === 'UNDER_REVIEW') {
        idea.adminReviewStatus = 'UNDER_REVIEW';
        idea.status = 'UNDER_REVIEW';
        idea.latestFicUpdate = 'Your business idea is currently under active evaluation by the FIC incubation desk.';

        idea.activityTimeline.push({
          action: 'Marked Under Review',
          actorType: 'ADMIN',
          actorId: adminId,
          actorName: adminName,
          notes: idea.adminNotes || 'Comprehensive evaluation in progress.',
          timestamp: new Date()
        });
      }

      await idea.save();

      await logAdminAction(
        req,
        'REVIEW_BUSINESS_IDEA',
        'BusinessIdea',
        idea._id.toString(),
        { action, status: idea.status, adminNotes: idea.adminNotes }
      );

      res.status(200).json({
        success: true,
        message: `Business idea status updated to ${idea.status}.`,
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 4. Publish Approved Idea to Marketplace (Admin)
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/publish',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      if (idea.status === 'REJECTED' || idea.adminReviewStatus === 'REJECTED') {
        res.status(400).json({
          success: false,
          error: 'Rejected ideas cannot be published to the Marketplace.'
        });
        return;
      }

      if (idea.adminReviewStatus !== 'APPROVED' && idea.adminReviewStatus !== 'SHARED_ON_MARKETPLACE') {
        res.status(400).json({
          success: false,
          error: 'Only approved ideas can be shared on the Marketplace. Please approve the idea first.'
        });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      idea.marketplacePublished = true;
      idea.marketplacePublishedAt = new Date();
      idea.adminReviewStatus = 'SHARED_ON_MARKETPLACE';
      idea.status = 'SHARED_ON_MARKETPLACE';
      idea.collaborationStatus = 'OPEN_FOR_INTEREST';
      idea.latestFicUpdate = 'Published! Your business idea is now live on the FIC Marketplace for network members to express interest.';

      idea.activityTimeline.push({
        action: 'Published to Marketplace',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: 'Business Idea Request opened publicly on the Universal Marketplace (submitter personal identity protected).',
        timestamp: new Date()
      });

      await idea.save();

      await logAdminAction(
        req,
        'PUBLISH_BUSINESS_IDEA_MARKETPLACE',
        'BusinessIdea',
        idea._id.toString(),
        { ideaRequestId: idea.ideaRequestId, title: idea.title }
      );

      // Notify Submitter
      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_PUBLISHED',
        title: 'Idea Shared on Marketplace! 🚀',
        message: `Your business idea "${idea.title}" is now published on the Marketplace. Interested members across the network can now offer collaboration.`,
        metadata: { link: '/business-ideas' }
      });

      res.status(200).json({
        success: true,
        message: 'Business idea successfully published to Marketplace.',
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 5. Admin Reviews Interested Member (Shortlist, Select, Not Selected)
// ========================================================
adminBusinessIdeasRouter.put(
  '/:id/interests/:interestId',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id, interestId } = req.params;
      const { reviewStatus, status: bodyStatus, adminNotes, privateNotes, selectionReason } = req.body;
      const resolvedStatus = reviewStatus || bodyStatus;
      const resolvedNotes = adminNotes !== undefined ? adminNotes : privateNotes;

      const validStatuses = ['INTEREST_SUBMITTED', 'UNDER_ADMIN_REVIEW', 'SHORTLISTED', 'SELECTED', 'NOT_SELECTED'];
      if (!resolvedStatus || !validStatuses.includes(resolvedStatus)) {
        res.status(400).json({ success: false, error: `Invalid review status. Allowed: ${validStatuses.join(', ')}` });
        return;
      }

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      const interest = await BusinessIdeaInterestModel.findOne({
        _id: interestId,
        ideaId: idea._id
      });

      if (!interest) {
        res.status(404).json({ success: false, error: 'Collaboration interest submission not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';

      interest.reviewStatus = resolvedStatus;
      if (resolvedNotes !== undefined) interest.adminNotes = String(resolvedNotes).trim();
      if (selectionReason !== undefined) interest.selectionReason = String(selectionReason).trim();
      interest.reviewedBy = adminName;
      interest.reviewedAt = new Date();

      await interest.save();

      // If selected, update idea collaboration status
      if (resolvedStatus === 'SELECTED') {
        idea.collaborationStatus = 'COLLABORATORS_SELECTED';
        if (idea.adminReviewStatus === 'INTEREST_RECEIVED') {
          idea.adminReviewStatus = 'MEMBER_SELECTION_PENDING';
          idea.status = 'MEMBER_SELECTION_PENDING';
        }

        idea.activityTimeline.push({
          action: 'Contributor Selected by Admin',
          actorType: 'ADMIN',
          actorId: req.admin?.id,
          actorName: adminName,
          notes: `Selected ${interest.interestedMemberName} (${interest.contributionType}). Reason: ${interest.selectionReason || 'Strong strategic alignment.'}`,
          timestamp: new Date()
        });

        await idea.save();
      }

      res.status(200).json({
        success: true,
        message: `Collaboration interest review status updated to ${reviewStatus}.`,
        data: interest
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 6. Admin Sends Official Update to Idea Submitter
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/update-submitter',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !String(message).trim()) {
        res.status(400).json({ success: false, error: 'Please enter the message for the idea submitter.' });
        return;
      }

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const cleanMsg = String(message).trim();

      idea.adminFeedbackToSubmitter = cleanMsg;
      idea.latestFicUpdate = cleanMsg;
      idea.adminReviewStatus = 'MATCHED';
      idea.status = 'MATCHED';
      idea.collaborationStatus = 'COORDINATING_CALL';
      idea.fundingAsked = true; // Automatically prompt submitter if funding support is also required!

      idea.activityTimeline.push({
        action: 'Official Update Sent to Submitter',
        actorType: 'ADMIN',
        actorId: req.admin?.id,
        actorName: adminName,
        notes: cleanMsg,
        timestamp: new Date()
      });

      await idea.save();

      // In-app Notification to Submitter
      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_MATCHED',
        title: 'New Update on Your Business Idea! 🌟',
        message: cleanMsg.length > 120 ? `${cleanMsg.substring(0, 120)}...` : cleanMsg,
        metadata: { link: '/business-ideas' }
      });

      res.status(200).json({
        success: true,
        message: 'Official update successfully delivered to the submitter.',
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 7. Admin Prompts Funding Inquiry
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/ask-funding',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      idea.fundingAsked = true;

      idea.activityTimeline.push({
        action: 'Funding Support Assessment Enabled',
        actorType: 'ADMIN',
        actorId: req.admin?.id,
        actorName: req.admin?.name || 'FIC Admin',
        notes: 'Admin enabled funding support evaluation for this business idea.',
        timestamp: new Date()
      });

      await idea.save();

      // Notify Submitter
      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_FUNDING_ENABLED',
        title: 'Funding Assessment Available',
        message: `FIC Admin has opened funding support options for your idea "${idea.title}". Check your idea details to indicate if you require capital.`,
        metadata: { link: '/business-ideas' }
      });

      res.status(200).json({
        success: true,
        message: 'Funding support inquiry enabled for member.',
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 8. Admin Schedules Consultation Meeting with Idea Requester
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/schedule-meeting',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, time, durationMinutes, mode, linkOrLocation, notes } = req.body;

      if (!date || !time) {
        res.status(400).json({ success: false, error: 'Meeting Date and Time are required.' });
        return;
      }

      if (!linkOrLocation || !String(linkOrLocation).trim()) {
        res.status(400).json({
          success: false,
          error: mode === 'VIRTUAL' ? 'Virtual Meeting Link is required.' : 'Meeting Location is required.'
        });
        return;
      }

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';
      const scheduledDateTime = new Date(`${date}T${time}`);

      let hostAdminObjectId = mongoose.isValidObjectId(adminId) ? new mongoose.Types.ObjectId(adminId) : null;
      if (!hostAdminObjectId) {
        const superAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());
        hostAdminObjectId = superAdmin?._id || new mongoose.Types.ObjectId();
      }

      // Create central MeetingModel record
      let meetingDoc: any = null;
      try {
        meetingDoc = await MeetingModel.create({
          title: `Business Idea Consultation: ${idea.title}`,
          description: notes || `FIC Incubation & Market Advisory consultation for idea "${idea.title}". [${idea.ideaRequestId || idea.refNumber || idea._id}]`,
          hostAdminId: hostAdminObjectId,
          participantMemberIds: idea.submitterMemberId ? [idea.submitterMemberId] : (mongoose.isValidObjectId(idea.userId) ? [idea.userId] : []),
          externalParticipants: [
            {
              name: idea.submitterName || 'Member',
              email: idea.submitterEmail || 'member@fic.com',
              phone: idea.submitterPhone || '',
              roleOrCompany: idea.title
            }
          ],
          meetingType: 'CONSULTATION',
          scheduledAt: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
          durationMinutes: Number(durationMinutes) || 45,
          meetingLink: mode === 'VIRTUAL' ? linkOrLocation : undefined,
          status: 'SCHEDULED',
          notificationSent: true
        });
      } catch (mErr) {
        console.warn('Could not create MeetingModel for idea:', mErr);
      }

      idea.status = 'MEETING_SCHEDULED';
      idea.adminReviewStatus = 'MEETING_SCHEDULED';
      idea.meetingDetails = {
        meetingId: meetingDoc?._id ? String(meetingDoc._id) : undefined,
        date: String(date).trim(),
        time: String(time).trim(),
        durationMinutes: Number(durationMinutes) || 45,
        mode: mode === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL',
        linkOrLocation: String(linkOrLocation).trim(),
        notes: notes ? String(notes).trim() : '',
        scheduledAt: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
        scheduledBy: adminName,
        isCompleted: false
      };

      idea.latestFicUpdate = `FIC consultation meeting arranged for ${date} at ${time} (${mode === 'IN_PERSON' ? 'In-Person' : 'Virtual Session'}).`;
      idea.whatHappensNext = 'Please join the scheduled consultation call with FIC incubation coordinators.';

      idea.activityTimeline.push({
        action: 'Consultation Meeting Arranged by Admin',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: `Scheduled ${mode} meeting on ${date} at ${time}. Link/Venue: ${linkOrLocation}.`,
        timestamp: new Date()
      });

      await idea.save();

      // Notify submitter
      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_MEETING_SCHEDULED',
        title: 'FIC Consultation Meeting Scheduled 📅',
        message: `FIC Admin has arranged your Business Idea consultation meeting on ${date} at ${time}.`,
        metadata: { link: '/meetings' }
      });

      await logAdminAction(
        req,
        'SCHEDULE_IDEA_MEETING',
        'BusinessIdea',
        idea._id.toString(),
        { meetingId: meetingDoc?._id, date, time }
      );

      res.status(200).json({
        success: true,
        message: 'Consultation meeting arranged successfully and member notified!',
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 9. Admin Marks Meeting Completed & Publishes Idea to Marketplace
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/complete-meeting-publish',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { summary } = req.body;

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';

      // Mark meeting completed in central MeetingModel
      if (idea.meetingDetails?.meetingId) {
        try {
          await MeetingModel.findByIdAndUpdate(idea.meetingDetails.meetingId, { status: 'COMPLETED' });
        } catch (mErr) {
          console.warn('Failed to update MeetingModel status:', mErr);
        }
      }

      if (!idea.meetingDetails) {
        idea.meetingDetails = {
          isCompleted: true,
          completedAt: new Date(),
          completionSummary: summary ? String(summary).trim() : 'Meeting completed and verified by Admin.'
        };
      } else {
        idea.meetingDetails.isCompleted = true;
        idea.meetingDetails.completedAt = new Date();
        if (summary) idea.meetingDetails.completionSummary = String(summary).trim();
      }

      idea.status = 'SHARED_ON_MARKETPLACE';
      idea.adminReviewStatus = 'SHARED_ON_MARKETPLACE';
      idea.marketplacePublished = true;
      idea.marketplacePublishedAt = new Date();
      idea.collaborationStatus = 'OPEN_FOR_INTEREST';
      idea.latestFicUpdate = 'Meeting completed! Your business idea has been validated and is now live on the Universal Marketplace for network members to express interest.';
      idea.whatHappensNext = 'Interested entrepreneurs, mentors, and partners can now review your proposal and submit collaboration requests.';

      idea.activityTimeline.push({
        action: 'Meeting Completed & Published to Marketplace',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: summary || 'Consultation meeting successfully concluded. Idea published to Universal Marketplace.',
        timestamp: new Date()
      });

      await idea.save();

      // Notify submitter
      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_PUBLISHED',
        title: 'Idea Live on Marketplace! 🚀',
        message: `Your consultation meeting for "${idea.title}" was completed and your business idea is now live on the Marketplace!`,
        metadata: { link: '/business-ideas' }
      });

      await logAdminAction(
        req,
        'COMPLETE_MEETING_AND_PUBLISH',
        'BusinessIdea',
        idea._id.toString(),
        { status: idea.status }
      );

      res.status(200).json({
        success: true,
        message: 'Consultation meeting marked as completed and idea published to Marketplace!',
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 10. Admin Schedules Meeting for an Interested Member
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/interests/:interestId/schedule-meeting',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id, interestId } = req.params;
      const { date, time, durationMinutes, mode, linkOrLocation, notes } = req.body;

      if (!date || !time || !linkOrLocation) {
        res.status(400).json({ success: false, error: 'Meeting Date, Time, and Link/Location are required.' });
        return;
      }

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      const interest = await BusinessIdeaInterestModel.findById(interestId);
      if (!interest) {
        res.status(404).json({ success: false, error: 'Interested member record not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';
      const scheduledDateTime = new Date(`${date}T${time}`);

      let hostAdminObjectId = mongoose.isValidObjectId(adminId) ? new mongoose.Types.ObjectId(adminId) : null;
      if (!hostAdminObjectId) {
        const superAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());
        hostAdminObjectId = superAdmin?._id || new mongoose.Types.ObjectId();
      }

      const participantMemberIds = [idea.submitterMemberId, interest.interestedMemberId].filter(
        (pid) => pid && mongoose.isValidObjectId(pid)
      );

      // Create multi-party meeting in MeetingModel
      const meetingDoc = await MeetingModel.create({
        title: `Business Idea Collaboration: ${idea.title} - ${interest.interestedMemberName}`,
        description: notes || `FIC multi-party intermediary call between idea submitter (${idea.submitterName}) and interested collaborator (${interest.interestedMemberName}).`,
        hostAdminId: hostAdminObjectId,
        participantMemberIds,
        externalParticipants: [
          {
            name: idea.submitterName,
            email: idea.submitterEmail || 'member@fic.com',
            phone: idea.submitterPhone || '',
            roleOrCompany: 'Idea Requester'
          },
          {
            name: interest.interestedMemberName,
            email: interest.interestedMemberEmail || 'collaborator@fic.com',
            phone: interest.interestedMemberPhone || '',
            roleOrCompany: interest.contributionType || 'Interested Collaborator'
          }
        ],
        meetingType: 'CONSULTATION',
        scheduledAt: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
        durationMinutes: Number(durationMinutes) || 45,
        meetingLink: mode === 'VIRTUAL' ? linkOrLocation : undefined,
        status: 'SCHEDULED',
        notificationSent: true
      });

      interest.reviewStatus = 'MEETING_SCHEDULED';
      interest.meetingDetails = {
        meetingId: String(meetingDoc._id),
        date: String(date).trim(),
        time: String(time).trim(),
        durationMinutes: Number(durationMinutes) || 45,
        mode: mode === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL',
        linkOrLocation: String(linkOrLocation).trim(),
        notes: notes ? String(notes).trim() : '',
        scheduledAt: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
        scheduledBy: adminName,
        status: 'SCHEDULED'
      };
      await interest.save();

      idea.activityTimeline.push({
        action: 'Collaboration Meeting Arranged with Interested Member',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: `Meeting scheduled with ${interest.interestedMemberName} (${interest.interestedMemberEmail}) on ${date} at ${time}.`,
        timestamp: new Date()
      });
      await idea.save();

      // Notify both parties
      await notifyMember({
        userId: String(interest.interestedUserId),
        eventType: 'BUSINESS_IDEA_MEETING_SCHEDULED',
        title: 'Collaboration Meeting Scheduled! 🤝',
        message: `FIC Admin has arranged your collaboration call regarding "${idea.title}" on ${date} at ${time}.`,
        metadata: { link: '/meetings' }
      });

      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_MEETING_SCHEDULED',
        title: 'Intro Meeting Scheduled with Interested Member! 🤝',
        message: `FIC Admin arranged a collaboration call with ${interest.interestedMemberName} for your idea "${idea.title}" on ${date} at ${time}.`,
        metadata: { link: '/meetings' }
      });

      res.status(200).json({
        success: true,
        message: `Collaboration meeting scheduled with ${interest.interestedMemberName} and both members notified!`,
        data: interest
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================================
// 11. Admin Concludes / Removes Business Idea (Completed)
// ========================================================
adminBusinessIdeasRouter.post(
  '/:id/conclude',
  authenticateAdmin,
  requirePermission('SERVICES_APPROVE'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const adminId = req.admin?.id || 'admin';
      const concludingReason = reason ? String(reason).trim() : 'Project concluded and completed by FIC Admin.';

      idea.status = 'COMPLETED';
      idea.adminReviewStatus = 'CLOSED';
      idea.marketplacePublished = false;
      idea.collaborationStatus = 'COMPLETED';
      idea.latestFicUpdate = `Business idea concluded: ${concludingReason}`;
      idea.whatHappensNext = 'This business idea cycle has been completed and archived.';

      idea.activityTimeline.push({
        action: 'Business Idea Concluded & Removed by Admin',
        actorType: 'ADMIN',
        actorId: adminId,
        actorName: adminName,
        notes: concludingReason,
        timestamp: new Date()
      });

      await idea.save();

      // Notify submitter
      await notifyMember({
        userId: String(idea.userId),
        eventType: 'BUSINESS_IDEA_COMPLETED',
        title: 'Business Idea Concluded & Completed',
        message: `Your business idea "${idea.title}" has been concluded by FIC Admin: ${concludingReason}`,
        metadata: { link: '/business-ideas' }
      });

      await logAdminAction(
        req,
        'CONCLUDE_BUSINESS_IDEA',
        'BusinessIdea',
        idea._id.toString(),
        { reason: concludingReason }
      );

      res.status(200).json({
        success: true,
        message: 'Business idea marked as completed and removed from Marketplace.',
        data: idea
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

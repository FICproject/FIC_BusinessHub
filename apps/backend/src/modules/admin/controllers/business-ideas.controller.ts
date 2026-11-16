import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { BusinessIdeaModel, BusinessIdeaInterestModel } from '../../business-ideas/business-ideas.model';
import { MemberModel } from '../models/Member';
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

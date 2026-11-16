import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BusinessIdeaModel } from './business-ideas.model';
import { FicRequestModel } from '../admin/models/FicRequest';
import { MemberModel } from '../admin/models/Member';
import { UserModel } from '../users/users.model';
import { notifyAdmins } from '../notifications/notifications.service';
import {
  authenticate,
  requireActiveVerifiedMember,
  AuthenticatedRequest
} from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const businessIdeasRouter = Router();

/**
 * Generate unique Idea Request ID in format: IDEA-YYYY-XXXXX
 */
function generateIdeaRequestId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `IDEA-${year}-${randomPart}`;
}

// ========================================================
// 1. Submit a Business Idea (Member)
// ========================================================
businessIdeasRouter.post(
  '/',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const {
        title,
        description,
        targetMarket,
        targetLocation,
        developmentStage,
        supportRequirements,
        customSupportRequirement,
        additionalMessage,
        supportingDocuments
      } = req.body;

      if (!title || !String(title).trim()) {
        res.status(400).json({ success: false, error: 'Business Idea Title is required.' });
        return;
      }

      if (!description || !String(description).trim()) {
        res.status(400).json({ success: false, error: 'Business Idea Description is required.' });
        return;
      }

      const user: any = await UserModel.findById(req.user.userId).lean();
      if (!user) throw new AppError('User profile not found', 404);

      const requesterEmail = (user.email || req.user.email || '').toLowerCase().trim();
      const requesterName = user.fullName || (req.user as any)?.name || 'FIC Member';
      const requesterPhone = user.phoneNumber || '';

      // Find or create associated MemberModel record
      let member = await MemberModel.findOne({
        $or: [{ _id: req.user.userId }, { email: requesterEmail }]
      });

      if (!member) {
        member = await MemberModel.create({
          _id: req.user.userId,
          name: requesterName,
          email: requesterEmail,
          phone: requesterPhone || '9876543210',
          primaryCategory: user.primaryCategoryId || new mongoose.Types.ObjectId(),
          primaryCategoryName: user.primaryCategoryName || 'General Business',
          subcategories: [user.subCategory || user.primarySubcategoryName || 'Entrepreneur'].filter(Boolean),
          status: 'ACTIVE',
          kycStatus: 'APPROVED',
          membershipPlan: 'FIRST_YEAR_INTRO',
          membershipFeePaid: 99,
          paymentStatus: 'PAID'
        });
      }

      // Auto-populate Category & Subcategory strictly from member's registered profile
      const mainCategoryName =
        user.primaryCategoryName ||
        member.primaryCategoryName ||
        'Business & Entrepreneurship';
      const subcategoryName =
        user.subCategory ||
        user.primarySubcategoryName ||
        (member.subcategories && member.subcategories[0]) ||
        'Entrepreneur';

      const ideaRequestId = generateIdeaRequestId();
      const resolvedStage = developmentStage || 'Just an Idea';
      const resolvedSupport = Array.isArray(supportRequirements) ? supportRequirements : [];

      const initialTimeline = [
        {
          action: 'Business Idea Submitted',
          actorType: 'MEMBER' as const,
          actorId: String(member._id),
          actorName: requesterName,
          notes: 'Business idea registered securely with FIC for review and network collaboration.',
          timestamp: new Date()
        }
      ];

      const idea = await BusinessIdeaModel.create({
        ideaRequestId,
        refNumber: ideaRequestId,
        userId: user._id,
        submitterMemberId: member._id,
        submitterName: requesterName,
        submitterEmail: requesterEmail,
        submitterPhone: requesterPhone,
        title: String(title).trim(),
        mainCategoryId: user.primaryCategoryId || member.primaryCategory,
        mainCategoryName,
        mainCategorySlug: user.primaryCategorySlug || 'general-business',
        subcategoryId: user.primarySubcategoryId,
        subcategoryName,
        description: String(description).trim(),
        targetMarket: targetMarket ? String(targetMarket).trim() : '',
        targetLocation: targetLocation ? String(targetLocation).trim() : '',
        developmentStage: resolvedStage,
        supportRequirements: resolvedSupport,
        customSupportRequirement: customSupportRequirement ? String(customSupportRequirement).trim() : '',
        additionalMessage: additionalMessage ? String(additionalMessage).trim() : '',
        supportingDocuments: Array.isArray(supportingDocuments) ? supportingDocuments : [],
        adminReviewStatus: 'SUBMITTED',
        status: 'SUBMITTED',
        marketplacePublished: false,
        interestedMembersCount: 0,
        collaborationStatus: 'PENDING_REVIEW',
        fundingAsked: false,
        activityTimeline: initialTimeline,

        // Legacy compatibility
        stage: resolvedStage,
        supportNeeded: resolvedSupport,
        supportRequired: resolvedSupport.join(', '),
        latestFicUpdate: 'Your business idea has been successfully submitted. FIC will review your idea and notify you about the next steps.',
        whatHappensNext: 'FIC Admin will evaluate your proposal and reach out with review findings.',
        updateHistory: [
          {
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            status: 'Submitted',
            update: 'Your business idea has been successfully submitted. FIC will review your idea and notify you about the next steps.',
            updatedBy: 'FIC Incubation Desk'
          }
        ]
      });

      // Synchronize to FicRequestModel for Admin Request Desk visibility
      try {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        await FicRequestModel.create({
          type: 'BUSINESS_IDEAS',
          sourceModule: 'BUSINESS_IDEAS',
          sourceRefId: idea._id,
          title: idea.title,
          description: `Stage: ${resolvedStage}. Target: ${idea.targetMarket || 'All'}. Location: ${idea.targetLocation || 'India'}. Support: ${resolvedSupport.join(', ')}. Details: ${idea.description}`,
          requesterId: member._id,
          requesterName,
          requesterEmail,
          requesterPhone: requesterPhone || member.phone,
          requesterCategory: mainCategoryName,
          status: 'NEW',
          internalNotes: [
            `[${timestamp} by System]: Business Idea submitted (${idea.ideaRequestId}). Awaiting Admin Desk evaluation.`
          ]
        });

        // Notify Admins
        await notifyAdmins({
          eventType: 'NEW_REQUEST',
          title: `New Business Idea: ${idea.title}`,
          message: `Member ${requesterName} submitted a new business idea (${idea.ideaRequestId}).`,
          link: '/business-ideas',
          priority: 'HIGH'
        });
      } catch (syncErr) {
        console.warn('Failed to sync business idea with FicRequest or notify admins:', syncErr);
      }

      res.status(201).json({
        success: true,
        message: 'Your business idea has been successfully submitted. FIC will review your idea and notify you about the next steps.',
        data: idea
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// 2. Get Own Submitted Business Ideas (Member)
// ========================================================
businessIdeasRouter.get(
  '/me',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const ideas = await BusinessIdeaModel.find({
        $or: [{ userId: req.user.userId }, { submitterMemberId: req.user.userId }]
      })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: ideas
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// 3. Get Single Business Idea Details (Owner Member)
// ========================================================
businessIdeasRouter.get(
  '/:id',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const idea = await BusinessIdeaModel.findOne({
        $and: [
          { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }] },
          { $or: [{ userId: req.user.userId }, { submitterMemberId: req.user.userId }] }
        ]
      }).lean();

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found or access restricted.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: idea
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// 4. Respond to Funding Requirement Question (Member)
// ========================================================
businessIdeasRouter.post(
  '/:id/funding-response',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const { fundingRequired } = req.body;

      const idea = await BusinessIdeaModel.findOne({
        $and: [
          { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }] },
          { $or: [{ userId: req.user.userId }, { submitterMemberId: req.user.userId }] }
        ]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found.' });
        return;
      }

      const isRequired = Boolean(fundingRequired);
      idea.fundingRequired = isRequired;

      idea.activityTimeline.push({
        action: 'Funding Requirement Recorded',
        actorType: 'MEMBER',
        actorId: String(req.user.userId),
        actorName: (req.user as any)?.name || 'Member',
        notes: isRequired
          ? 'Member indicated financial funding support is needed. Funding request link initialized.'
          : 'Member confirmed funding is not currently required.',
        timestamp: new Date()
      });

      await idea.save();

      res.status(200).json({
        success: true,
        message: isRequired
          ? 'Funding requirement confirmed. You may now submit your funding proposal.'
          : 'Response recorded. No funding request will be initiated.',
        data: idea
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// 5. Submit Additional Information (Member)
// ========================================================
businessIdeasRouter.put(
  '/:id/additional-info',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const { additionalInfo } = req.body;

      if (!additionalInfo || !String(additionalInfo).trim()) {
        res.status(400).json({ success: false, error: 'Please enter the requested information.' });
        return;
      }

      const idea = await BusinessIdeaModel.findOne({
        $and: [
          { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }] },
          { $or: [{ userId: req.user.userId }, { submitterMemberId: req.user.userId }] }
        ]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea not found.' });
        return;
      }

      idea.status = 'UNDER_REVIEW';
      idea.adminReviewStatus = 'UNDER_REVIEW';
      idea.informationRequestNotes = `Member Response: ${String(additionalInfo).trim()}`;
      idea.latestFicUpdate = 'Additional details submitted. FIC Admin is reviewing the updated submission.';

      idea.activityTimeline.push({
        action: 'Additional Information Provided',
        actorType: 'MEMBER',
        actorId: String(req.user.userId),
        actorName: (req.user as any)?.name || 'Member',
        notes: String(additionalInfo).trim(),
        timestamp: new Date()
      });

      await idea.save();

      await notifyAdmins({
        eventType: 'NEW_REQUEST',
        title: `Information Provided: ${idea.title}`,
        message: `Member responded with requested information for business idea (${idea.ideaRequestId}).`,
        link: '/business-ideas',
        priority: 'MEDIUM'
      });

      res.status(200).json({
        success: true,
        message: 'Additional information successfully submitted to FIC Admin.',
        data: idea
      });
    } catch (error) {
      next(error);
    }
  }
);

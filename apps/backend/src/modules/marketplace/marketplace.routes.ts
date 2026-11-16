import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ServiceListingModel } from '../services/services.model';
import { BusinessIdeaModel, BusinessIdeaInterestModel } from '../business-ideas/business-ideas.model';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import { notifyAdmins } from '../notifications/notifications.service';
import { authenticate, AuthenticatedRequest, requireActiveVerifiedMember } from '../../common/middleware/auth.middleware';
import { ServiceListingStatus, AccountStatus } from '@fic/shared-types';

export const marketplaceRouter = Router();

// ========================================================
// Universal Service Discovery: All approved services discoverable across all member categories
// Provider personal contact info (name, email, mobile) is strictly excluded at field projection level!
// ========================================================
marketplaceRouter.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search, page = 1, limit = 50 } = req.query;

    // Exclude services from unapproved, suspended, or unverified members
    const activeVerifiedUsers = await UserModel.find({
      status: AccountStatus.ACTIVE,
      isKycApproved: true
    }).select('_id').lean();

    const activeUserObjectIds = activeVerifiedUsers.map((u: any) => u._id);
    const activeUserStringIds = activeVerifiedUsers.map((u: any) => u._id.toString());
    const validProviderIds = [...activeUserObjectIds, ...activeUserStringIds];

    const filter: Record<string, any> = {
      status: ServiceListingStatus.APPROVED,
      isActive: true,
      providerId: { $in: validProviderIds }
    };

    if (categoryId && categoryId !== 'all') {
      filter.$or = [
        { categoryId: categoryId },
        { categorySlug: categoryId }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { categoryName: { $regex: search, $options: 'i' } },
          { subcategoryName: { $regex: search, $options: 'i' } },
          { tags: { $in: [searchRegex] } }
        ]
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Strict projection: NEVER return provider details (no populate on provider personal data)
    // Timeline and Pricing are NOT included for public card view.
    const [listings, total] = await Promise.all([
      ServiceListingModel.find(filter)
        .select(
          '_id providerId title shortDescription description categoryId subcategoryId categoryName categorySlug subcategoryName servicesOffered skills tags targetCustomers coverageArea deliveryMode createdAt'
        )
        .populate('categoryId', 'name slug iconName')
        .populate('subcategoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServiceListingModel.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: listings,
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Single Service Detail (Privacy Safe)
marketplaceRouter.get('/services/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const service = await ServiceListingModel.findOne({
      _id: id,
      status: ServiceListingStatus.APPROVED,
      isActive: true
    })
      .select(
        '_id title shortDescription description categoryId subcategoryId categoryName categorySlug subcategoryName servicesOffered skills tags targetCustomers coverageArea deliveryMode createdAt'
      )
      .populate('categoryId', 'name slug iconName')
      .populate('subcategoryId', 'name slug')
      .lean();

    if (!service) {
      res.status(404).json({ success: false, message: 'Service listing not found or not active.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// Business Idea Requests on Marketplace (Strict Privacy Guard)
// Only Admin-approved & published ideas are displayed!
// Submitter personal contact info is STRICTLY shielded.
// ========================================================
marketplaceRouter.get('/business-ideas', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, categorySlug, search, page = 1, limit = 50 } = req.query;

    const filter: Record<string, any> = {
      marketplacePublished: true,
      adminReviewStatus: { $in: ['SHARED_ON_MARKETPLACE', 'INTEREST_RECEIVED', 'MEMBER_SELECTION_PENDING', 'MATCHED'] }
    };

    if (categoryId && categoryId !== 'all') {
      filter.$or = [
        { mainCategoryId: categoryId },
        { mainCategorySlug: categoryId }
      ];
    } else if (categorySlug && categorySlug !== 'all') {
      filter.mainCategorySlug = categorySlug;
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { mainCategoryName: { $regex: searchRegex } },
          { subcategoryName: { $regex: searchRegex } },
          { targetMarket: { $regex: searchRegex } },
          { targetLocation: { $regex: searchRegex } }
        ]
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Strict projection: NEVER return submitter private credentials
    const [ideas, total] = await Promise.all([
      BusinessIdeaModel.find(filter)
        .select(
          '_id ideaRequestId title description mainCategoryId mainCategoryName mainCategorySlug subcategoryId subcategoryName targetMarket targetLocation developmentStage supportRequirements customSupportRequirement marketplacePublished marketplacePublishedAt interestedMembersCount collaborationStatus createdAt'
        )
        .sort({ marketplacePublishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      BusinessIdeaModel.countDocuments(filter)
    ]);

    const formatted = ideas.map((idea: any) => ({
      id: idea._id,
      ideaRequestId: idea.ideaRequestId || idea.refNumber,
      title: idea.title,
      mainCategoryName: idea.mainCategoryName,
      mainCategorySlug: idea.mainCategorySlug,
      subcategoryName: idea.subcategoryName,
      shortDescription: idea.description.length > 180 ? `${idea.description.substring(0, 180)}...` : idea.description,
      description: idea.description,
      targetMarket: idea.targetMarket || 'All Target Customers',
      targetLocation: idea.targetLocation || 'Pan-India',
      developmentStage: idea.developmentStage || 'Just an Idea',
      supportRequirements: idea.supportRequirements || [],
      customSupportRequirement: idea.customSupportRequirement,
      publishedDate: idea.marketplacePublishedAt
        ? new Date(idea.marketplacePublishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date(idea.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      interestedCount: idea.interestedMembersCount || 0,
      isFicVerified: true,
      badgeLabel: 'FIC Verified & Shared'
    }));

    res.status(200).json({
      success: true,
      data: {
        items: formatted,
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// Member Expresses Collaboration Interest ("I'm Interested")
// ========================================================
marketplaceRouter.post(
  '/business-ideas/:id/interest',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const {
        contributionType,
        interestReason,
        contributionOffer,
        experience,
        additionalMessage
      } = req.body;

      if (!interestReason || !String(interestReason).trim()) {
        res.status(400).json({ success: false, error: 'Please explain why you are interested in this idea.' });
        return;
      }

      if (!contributionType) {
        res.status(400).json({ success: false, error: 'Please select what contribution you can offer.' });
        return;
      }

      const idea = await BusinessIdeaModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ideaRequestId: id }, { refNumber: id }]
      });

      if (!idea) {
        res.status(404).json({ success: false, error: 'Business idea request not found.' });
        return;
      }

      if (!idea.marketplacePublished) {
        res.status(400).json({ success: false, error: 'This business idea is not currently open for network interest.' });
        return;
      }

      // Submitting member cannot express interest in their own idea
      if (
        String(idea.userId) === String(req.user.userId) ||
        String(idea.submitterMemberId) === String(req.user.userId)
      ) {
        res.status(400).json({ success: false, error: 'You cannot submit collaboration interest for your own business idea.' });
        return;
      }

      // Fetch calling member's profile
      const user: any = await UserModel.findById(req.user.userId).lean();
      if (!user) {
        res.status(404).json({ success: false, error: 'User profile not found.' });
        return;
      }

      const interestedEmail = (user.email || req.user.email || '').toLowerCase().trim();
      const interestedName = user.fullName || (req.user as any)?.name || 'FIC Member';
      const interestedPhone = user.phoneNumber || '';

      let member = await MemberModel.findOne({
        $or: [{ _id: req.user.userId }, { email: interestedEmail }]
      });

      if (!member) {
        member = await MemberModel.create({
          _id: req.user.userId,
          name: interestedName,
          email: interestedEmail,
          phone: interestedPhone || '9876543210',
          primaryCategory: user.primaryCategoryId || new mongoose.Types.ObjectId(),
          primaryCategoryName: user.primaryCategoryName || 'General Business',
          subcategories: [user.subCategory || user.primarySubcategoryName || 'Member'].filter(Boolean),
          status: 'ACTIVE',
          kycStatus: 'APPROVED',
          membershipPlan: 'FIRST_YEAR_INTRO',
          membershipFeePaid: 99,
          paymentStatus: 'PAID'
        });
      }

      // Prevent duplicate interest submissions
      const existingInterest = await BusinessIdeaInterestModel.findOne({
        ideaId: idea._id,
        $or: [{ interestedMemberId: member._id }, { interestedUserId: user._id }]
      });

      if (existingInterest) {
        res.status(400).json({
          success: false,
          error: 'You have already submitted collaboration interest for this business idea. FIC Admin is reviewing your profile.'
        });
        return;
      }

      const interestRecord = await BusinessIdeaInterestModel.create({
        ideaRequestId: idea.ideaRequestId,
        ideaId: idea._id,
        ideaTitle: idea.title,
        interestedMemberId: member._id,
        interestedUserId: user._id,
        interestedMemberName: interestedName,
        interestedMemberEmail: interestedEmail,
        interestedMemberPhone: interestedPhone,
        interestedCategoryName: user.primaryCategoryName || member.primaryCategoryName || 'General Business',
        interestedSubcategoryName: user.subCategory || (member.subcategories && member.subcategories[0]) || 'Member',
        contributionType,
        interestReason: String(interestReason).trim(),
        contributionOffer: contributionOffer ? String(contributionOffer).trim() : contributionType,
        experience: experience ? String(experience).trim() : '',
        additionalMessage: additionalMessage ? String(additionalMessage).trim() : '',
        reviewStatus: 'INTEREST_SUBMITTED'
      });

      // Update idea stats
      idea.interestedMembersCount = (idea.interestedMembersCount || 0) + 1;
      if (idea.adminReviewStatus === 'SHARED_ON_MARKETPLACE') {
        idea.adminReviewStatus = 'INTEREST_RECEIVED';
        idea.status = 'INTEREST_RECEIVED';
      }

      idea.activityTimeline.push({
        action: 'Member Expressed Interest',
        actorType: 'INTERESTED_MEMBER',
        actorId: String(member._id),
        actorName: 'Confidential Member',
        notes: `Member offered contribution: ${contributionType}. Awaiting Admin review.`,
        timestamp: new Date()
      });

      await idea.save();

      // Notify FIC Admins
      await notifyAdmins({
        eventType: 'NEW_REQUEST',
        title: `Collaboration Interest: ${idea.title}`,
        message: `Member ${interestedName} (${user.primaryCategoryName || 'Business'}) offered "${contributionType}" for idea ${idea.ideaRequestId}.`,
        link: '/business-ideas',
        priority: 'MEDIUM'
      });

      res.status(201).json({
        success: true,
        message: 'Your collaboration interest has been submitted to FIC Admin. FIC will review your profile and coordinate introductions.',
        data: interestRecord
      });
    } catch (error) {
      next(error);
    }
  }
);

// Member checks own collaboration interests
marketplaceRouter.get(
  '/my-interests',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const interests = await BusinessIdeaInterestModel.find({
        $or: [{ interestedUserId: req.user.userId }, { interestedMemberId: req.user.userId }]
      })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: interests
      });
    } catch (error) {
      next(error);
    }
  }
);


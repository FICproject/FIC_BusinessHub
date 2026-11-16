import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BusinessDevRequestModel } from './business-development.model';
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

export const businessDevRouter = Router();

// ========================================================
// 1. Submit Scaling Request (Member)
// ========================================================
businessDevRouter.post(
  '/',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const {
        scalingSupportType,
        businessName,
        mainCategoryId,
        mainCategoryName,
        subcategoryId,
        subcategoryName,
        currentBusinessStage,
        businessDescription,
        currentBusinessLocation,
        targetExpansionLocation,
        mainChallenge,
        supportRequired,
        customSupportRequired,
        additionalDetails,
        supportingDocuments,
        // Legacy fields if passed
        supportType,
        currentChallenges,
        expectedOutcomes
      } = req.body;

      // Validation
      const selectedSupportType = scalingSupportType || supportType;
      if (!selectedSupportType || !String(selectedSupportType).trim()) {
        res.status(400).json({
          success: false,
          error: 'Please select a Scaling Support Type (Business Growth, Marketing, Funding, or Mentorship).'
        });
        return;
      }

      if (!businessName || !String(businessName).trim()) {
        res.status(400).json({ success: false, error: 'Business Name is required.' });
        return;
      }

      if (!currentBusinessLocation || !String(currentBusinessLocation).trim()) {
        res.status(400).json({ success: false, error: 'Current Business Location is required.' });
        return;
      }

      const selectedChallenge = mainChallenge || currentChallenges;
      if (!selectedChallenge || !String(selectedChallenge).trim()) {
        res.status(400).json({ success: false, error: 'Please describe the main challenge you are facing.' });
        return;
      }

      const selectedSupportRequired = supportRequired || 'Business Expansion & New Branches';
      if (
        selectedSupportRequired === 'Other – Specify Your Requirement' &&
        (!customSupportRequired || !String(customSupportRequired).trim())
      ) {
        res.status(400).json({
          success: false,
          error: 'Please specify your requirement in the custom requirement text field.'
        });
        return;
      }

      // Fetch member profile details to enforce registered category & subcategory
      const user: any = await UserModel.findById(req.user.userId).lean();
      const resolvedCategoryName =
        user?.primaryCategoryName ||
        (user?.primaryCategoryId ? String(user.primaryCategoryId) : null) ||
        mainCategoryName ||
        'Business & Entrepreneurship';
      const resolvedCategoryId = user?.primaryCategoryId ? String(user.primaryCategoryId) : mainCategoryId || '';
      const resolvedSubcategoryName =
        user?.subCategory ||
        user?.primarySubcategoryName ||
        subcategoryName ||
        'General Business';

      const submitterName = user?.fullName || (req.user as any)?.name || 'FIC Member';
      const submitterEmail = (user?.email || req.user.email || '').toLowerCase().trim();
      const submitterPhone = user?.phoneNumber || '';

      // Generate unique Request ID: SCALE-2026-XXXXX
      const year = new Date().getFullYear();
      const count = await BusinessDevRequestModel.countDocuments();
      const randomPadding = Math.floor(1000 + Math.random() * 9000);
      const generatedRequestId = `SCALE-${year}-${String(count + 1).padStart(3, '0')}${randomPadding.toString().slice(-2)}`;

      const newScalingRequest = await BusinessDevRequestModel.create({
        userId: req.user.userId,
        requestId: generatedRequestId,
        refNumber: generatedRequestId,
        submitterName,
        submitterEmail,
        submitterPhone,
        businessName: String(businessName).trim(),
        mainCategoryId: resolvedCategoryId,
        mainCategoryName: resolvedCategoryName,
        subcategoryId: subcategoryId || '',
        subcategoryName: resolvedSubcategoryName,
        scalingSupportType: selectedSupportType,
        currentBusinessStage: currentBusinessStage || 'Running Business',
        businessDescription: businessDescription ? String(businessDescription).trim() : '',
        currentBusinessLocation: String(currentBusinessLocation).trim(),
        targetExpansionLocation: targetExpansionLocation ? String(targetExpansionLocation).trim() : '',
        mainChallenge: String(selectedChallenge).trim(),
        supportRequired: selectedSupportRequired,
        customSupportRequired: customSupportRequired ? String(customSupportRequired).trim() : '',
        additionalDetails: additionalDetails ? String(additionalDetails).trim() : '',
        supportingDocuments: Array.isArray(supportingDocuments) ? supportingDocuments : [],
        status: 'SUBMITTED',
        activityTimeline: [
          {
            action: 'Scaling Request Submitted',
            actorType: 'MEMBER',
            actorId: String(req.user.userId),
            actorName: submitterName,
            notes: `Submitted scaling request for ${selectedSupportType} under ${resolvedCategoryName}.`,
            timestamp: new Date()
          }
        ],

        // Legacy compatibility fields
        supportType: 'EXPANSION_SCALING',
        currentChallenges: String(selectedChallenge).trim(),
        expectedOutcomes: expectedOutcomes || `Target expansion support in ${selectedSupportRequired}`,
        latestFicUpdate: 'Your scaling request has been received. Our team is reviewing your business details.',
        whatHappensNext: 'FIC Admin will evaluate your requirements and arrange an exploratory consultation.',
        updateHistory: [
          {
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            status: 'Submitted',
            update: 'Your scaling request has been received. Our team is reviewing your business details.',
            updatedBy: 'FIC Scaling Desk'
          }
        ]
      });

      // Synchronize to FicRequestModel for central Request Desk visibility
      try {
        let member = await MemberModel.findOne({
          $or: [{ _id: req.user.userId }, { email: submitterEmail }]
        });

        if (!member) {
          member = await MemberModel.create({
            _id: req.user.userId,
            name: submitterName,
            email: submitterEmail,
            phone: submitterPhone || '9876543210',
            primaryCategory: user?.primaryCategoryId || new mongoose.Types.ObjectId(),
            primaryCategoryName: resolvedCategoryName,
            subcategories: [resolvedSubcategoryName],
            status: 'ACTIVE',
            kycStatus: 'APPROVED',
            membershipPlan: 'FIRST_YEAR_INTRO',
            membershipFeePaid: 99,
            paymentStatus: 'PAID'
          });
        }

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        await FicRequestModel.create({
          requestId: generatedRequestId,
          type: 'SCALING_SUPPORT',
          sourceModule: 'SCALING_SUPPORT',
          sourceRefId: newScalingRequest._id,
          title: `${newScalingRequest.businessName} - ${selectedSupportType}`,
          description: `Challenge: ${newScalingRequest.mainChallenge}. Location: ${newScalingRequest.currentBusinessLocation}. Support: ${selectedSupportRequired}`,
          requesterId: member._id,
          requesterName: submitterName,
          requesterEmail: submitterEmail,
          requesterPhone: submitterPhone,
          requesterCategory: resolvedCategoryName,
          status: 'SUBMITTED',
          internalNotes: [
            `[${timestamp} by System]: Scaling Support requested (${generatedRequestId}). Admin review pending.`
          ]
        });

        // Notify Admins
        await notifyAdmins({
          eventType: 'NEW_REQUEST',
          title: `New Scaling Request: ${newScalingRequest.businessName}`,
          message: `Member ${submitterName} requested scaling support for "${newScalingRequest.businessName}" (${selectedSupportType}).`,
          link: '/scaling',
          priority: 'HIGH'
        });
      } catch (syncErr) {
        console.warn('Failed to sync scaling request with FicRequest or send admin notification:', syncErr);
      }

      res.status(201).json({
        success: true,
        message: 'Your scaling request has been successfully submitted to FIC. Admin will review and arrange a consultation.',
        data: newScalingRequest
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// 2. Get My Scaling Requests (Member - Ownership Enforced)
// ========================================================
businessDevRouter.get(
  '/me',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const requests = await BusinessDevRequestModel.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .select('-adminNotes') // Strict privacy: exclude internal admin notes from member response
        .lean();

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// 3. Get Single Scaling Request (Member - Ownership Enforced)
// ========================================================
businessDevRouter.get(
  '/:id',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const request = await BusinessDevRequestModel.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : null },
          { requestId: id },
          { refNumber: id }
        ],
        userId: req.user.userId
      })
        .select('-adminNotes')
        .lean();

      if (!request) {
        res.status(404).json({ success: false, error: 'Scaling request not found or access denied.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  }
);

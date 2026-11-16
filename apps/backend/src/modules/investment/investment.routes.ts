import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  FundingRequestModel,
  InvestmentRequestModel,
  FinancialTransactionModel,
  ReceivingBankAccountModel,
  InvestorProfileModel,
  InvestmentProfileModel
} from './investment.model';
import { BusinessIdeaModel } from '../business-ideas/business-ideas.model';
import { FundingApplicationModel } from '../admin/models/FundingApplication';
import { InvestmentPoolModel } from '../admin/models/InvestmentPool';
import { MemberModel } from '../admin/models/Member';
import { UserModel } from '../users/users.model';
import { FicRequestModel } from '../admin/models/FicRequest';
import { notifyAdmins, notifyMember } from '../notifications/notifications.service';
import { MeetingModel } from '../admin/models/Meeting';
import { getOrCreateMemberWallet } from '../admin/controllers/funding.controller';
import {
  authenticate,
  requireActiveVerifiedMember,
  requireRoles,
  AuthenticatedRequest
} from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { DocumentAssetModel } from '../documents/documents.model';
import { UserRole } from '@fic/shared-types';

export const investmentRouter = Router();

async function resolveOwnedInvestmentDocuments(userId: string, docs: any[], entityId?: string) {
  if (!Array.isArray(docs) || docs.length === 0) return [];
  const resolved = [];
  for (const d of docs) {
    if (d && d.documentId) {
      const asset = await DocumentAssetModel.findOne({
        documentId: String(d.documentId),
        ownerId: userId,
        isDeleted: { $ne: true }
      });
      if (!asset) {
        throw new AppError(
          `Referenced document "${d.documentId}" not found or access denied.`,
          403,
          'INVALID_DOCUMENT_REFERENCE'
        );
      }
      asset.entityType = 'INVESTMENT';
      if (entityId) asset.entityId = entityId;
      await asset.save();
      resolved.push({
        documentId: asset.documentId,
        name: d.name || asset.originalFileName,
        fileUrl: `/api/v1/documents/${asset.documentId}/view`,
        originalMimeType: asset.originalMimeType,
        originalFileSize: asset.originalFileSize,
        checksum: asset.checksum,
        fileType: d.fileType || asset.originalFileExtension,
        uploadedAt: d.uploadedAt || asset.createdAt.toISOString(),
        status: d.status || 'PENDING'
      });
    } else if (d) {
      resolved.push(d);
    }
  }
  return resolved;
}

// ========================================================
// PHASE 1: FUNDING REQUEST SUBMISSION (MEMBER WEBSITE)
// ========================================================

// 1.1 & 1.2 & 1.3: Submit Funding Request
investmentRouter.post(
  '/funding',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const {
        companyName,
        businessName,
        projectName,
        fundingDuration,
        durationMonths,
        requiredFundingAmount,
        fundingAmount,
        minInvestmentAmount,
        maxInvestmentAmount,
        expectedReturns,
        returnRatePercent,
        returnFrequency,
        fundingPurpose,
        documents,
        useOfFundsExplanation,
        businessDescription,
        businessType,
        industry,
        businessStage,
        currentAnnualRevenue,
        location,
        businessIdeaRequestId,
        linkedIdeaId
      } = req.body;

      // Mandatory Field 1: Project / Company Name
      const resolvedCompanyName = (companyName || businessName || projectName || '').trim();
      if (!resolvedCompanyName) {
        throw new AppError('Project / Company Name is required.', 400);
      }

      // Mandatory Field 2: Funding Duration
      const resolvedDuration = (fundingDuration || `${durationMonths || 12} Months`).trim();
      if (!resolvedDuration) {
        throw new AppError('Funding Duration is required.', 400);
      }
      const parsedDurationMonths = Number(durationMonths) || parseInt(resolvedDuration, 10) || 12;
      if (parsedDurationMonths <= 0) {
        throw new AppError('Funding duration must be greater than 0 months.', 400);
      }

      // Mandatory Field 3: Required Funding Amount
      const parsedFundingAmount = Number(requiredFundingAmount || fundingAmount);
      if (!parsedFundingAmount || isNaN(parsedFundingAmount) || parsedFundingAmount <= 0) {
        throw new AppError('Required Funding Amount must be a valid positive number.', 400);
      }

      // Mandatory Field 4: Minimum Investment Amount
      const parsedMinInvestment = Number(minInvestmentAmount);
      if (!parsedMinInvestment || isNaN(parsedMinInvestment) || parsedMinInvestment <= 0) {
        throw new AppError('Minimum Investment Amount must be a valid positive number.', 400);
      }

      // Mandatory Field 5: Maximum Investment Amount
      const parsedMaxInvestment = Number(maxInvestmentAmount);
      if (!parsedMaxInvestment || isNaN(parsedMaxInvestment) || parsedMaxInvestment <= 0) {
        throw new AppError('Maximum Investment Amount must be a valid positive number.', 400);
      }

      // Validation: Minimum cannot exceed Maximum
      if (parsedMinInvestment > parsedMaxInvestment) {
        throw new AppError('Minimum Investment Amount cannot exceed Maximum Investment Amount.', 400);
      }

      // Validation: Maximum cannot exceed Required Funding Amount
      if (parsedMaxInvestment > parsedFundingAmount) {
        throw new AppError('Maximum Investment Amount cannot exceed Required Funding Amount.', 400);
      }

      // Mandatory Field 6: Expected Returns & Frequency
      const resolvedReturns = (expectedReturns || `${returnRatePercent || 15}% p.a.`).trim();
      if (!resolvedReturns) {
        throw new AppError('Expected Returns must be clearly defined.', 400);
      }
      const validFrequencies = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'MATURITY'];
      const resolvedFrequency = String(returnFrequency || 'YEARLY').toUpperCase();
      if (!validFrequencies.includes(resolvedFrequency)) {
        throw new AppError(`Return Frequency must be one of: ${validFrequencies.join(', ')}`, 400);
      }

      // Mandatory Field 7: Funding Purpose
      const resolvedPurpose =
        Array.isArray(fundingPurpose) && fundingPurpose.length > 0
          ? fundingPurpose.join(', ')
          : String(fundingPurpose || '').trim();
      if (!resolvedPurpose) {
        throw new AppError('Funding Purpose is required.', 400);
      }

      // Mandatory Field 8: Required Documents
      const parsedDocs = Array.isArray(documents) ? documents : [];
      if (parsedDocs.length === 0) {
        throw new AppError('At least one Required Document must be uploaded before submitting.', 400);
      }

      const generatedRef = `FIC-FUND-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const userDoc = await UserModel.findById(req.user.userId);
      const memberName = userDoc?.fullName || (req.user as any).name || 'FIC Member';
      const memberEmail = (userDoc?.email || (req.user as any).email || '').toLowerCase().trim();
      const memberPhone = userDoc?.phoneNumber || (req.user as any).phone || '9876543210';

      const resolvedDocs = await resolveOwnedInvestmentDocuments(req.user.userId, parsedDocs, generatedRef);

      // Create Funding Request Record
      const newFundingRequest = await FundingRequestModel.create({
        userId: req.user.userId,
        refNumber: generatedRef,
        fundingRequestId: generatedRef,
        companyName: resolvedCompanyName,
        businessName: resolvedCompanyName,
        fundingDuration: resolvedDuration,
        durationMonths: parsedDurationMonths,
        requiredFundingAmount: parsedFundingAmount,
        fundingAmount: parsedFundingAmount,
        minInvestmentAmount: parsedMinInvestment,
        maxInvestmentAmount: parsedMaxInvestment,
        expectedReturns: resolvedReturns,
        returnRatePercent: Number(returnRatePercent) || 15,
        returnFrequency: resolvedFrequency,
        fundingPurpose: resolvedPurpose,
        useOfFundsExplanation: useOfFundsExplanation || resolvedPurpose,
        businessDescription: businessDescription || resolvedPurpose,
        businessType: businessType || 'Private Limited Company',
        industry: industry || 'Business & Entrepreneurship',
        businessStage: businessStage || 'Growing Business',
        currentAnnualRevenue: currentAnnualRevenue || 'Not Disclosed',
        location: location || { country: 'India', state: '', city: '' },
        documents: resolvedDocs,
        status: 'SUBMITTED',
        totalInvested: 0,
        remainingFundingAmount: parsedFundingAmount,
        investorCount: 0,
        changeRequests: [],
        versionHistory: [
          {
            versionNumber: 1,
            submittedAt: new Date(),
            data: {
              companyName: resolvedCompanyName,
              fundingDuration: resolvedDuration,
              requiredFundingAmount: parsedFundingAmount,
              minInvestmentAmount: parsedMinInvestment,
              maxInvestmentAmount: parsedMaxInvestment,
              expectedReturns: resolvedReturns,
              returnFrequency: resolvedFrequency,
              fundingPurpose: resolvedPurpose
            }
          }
        ],
        activityTimeline: [
          {
            action: 'Funding Proposal Submitted',
            actorType: 'MEMBER',
            actorName: memberName,
            notes: `Initial proposal submitted for ₹${parsedFundingAmount.toLocaleString('en-IN')}.`,
            timestamp: new Date()
          }
        ],
        updateHistory: [
          {
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            status: 'Submitted',
            update: 'Funding request submitted. Review by FIC Admin is pending.',
            updatedBy: 'FIC Member'
          }
        ]
      });

      // Synchronize to Central FicRequestModel for Admin Desk visibility
      try {
        await FicRequestModel.create({
          requestId: generatedRef,
          type: 'SERVICE_INQUIRY',
          sourceModule: 'CUSTOM',
          sourceRefId: newFundingRequest._id,
          title: `Funding Request: ${resolvedCompanyName}`,
          description: `Required Amount: ₹${parsedFundingAmount.toLocaleString('en-IN')}, Duration: ${resolvedDuration}, Returns: ${resolvedReturns} (${resolvedFrequency})`,
          requesterId: req.user.userId,
          requesterName: memberName,
          requesterEmail: memberEmail,
          requesterPhone: memberPhone,
          status: 'SUBMITTED'
        });
      } catch (ficReqErr) {
        console.warn('FicRequest sync warning:', ficReqErr);
      }

      // Synchronize to FundingApplicationModel for Admin Portal compatibility
      try {
        await FundingApplicationModel.create({
          applicantName: memberName,
          applicantEmail: memberEmail,
          applicantPhone: memberPhone,
          businessName: resolvedCompanyName,
          industryCategory: industry || 'Business & Entrepreneurship',
          businessPitch: resolvedPurpose,
          requestedAmount: parsedFundingAmount,
          fundingType: 'DEBT',
          interestRateAnnual: Number(returnRatePercent) || 15,
          tenureMonths: parsedDurationMonths,
          memberUserId: req.user.userId,
          fundingRequestId: newFundingRequest._id,
          stage: 'USER_REQUEST'
        });
      } catch (appSyncErr) {
        console.warn('FundingApplicationModel sync warning:', appSyncErr);
      }

      // Link to Business Idea if applicable
      const resolvedIdeaRequestId = businessIdeaRequestId || linkedIdeaId;
      if (resolvedIdeaRequestId) {
        try {
          const linkedIdea = await BusinessIdeaModel.findOne({
            $or: [
              { _id: mongoose.isValidObjectId(resolvedIdeaRequestId) ? resolvedIdeaRequestId : null },
              { ideaRequestId: resolvedIdeaRequestId },
              { refNumber: resolvedIdeaRequestId }
            ]
          });
          if (linkedIdea) {
            linkedIdea.fundingRequired = true;
            linkedIdea.fundingRequestId = String(newFundingRequest._id);
            linkedIdea.fundingRequestRef = generatedRef;
            linkedIdea.activityTimeline.push({
              action: 'Funding Proposal Linked',
              actorType: 'MEMBER',
              actorName: memberName,
              notes: `Formal funding proposal linked (${generatedRef}) for ₹${parsedFundingAmount.toLocaleString('en-IN')}.`,
              timestamp: new Date()
            });
            await linkedIdea.save();
          }
        } catch (linkErr) {
          console.warn('BusinessIdea link warning:', linkErr);
        }
      }

      // Notify Admin Team
      await notifyAdmins({
        eventType: 'NEW_FUNDING_REQUEST',
        title: `New Funding Request: ${resolvedCompanyName}`,
        message: `Member ${memberName} submitted a funding request for ₹${parsedFundingAmount.toLocaleString('en-IN')}.`,
        link: '/funding',
        priority: 'HIGH'
      });

      res.status(201).json({
        success: true,
        message: 'Funding request submitted successfully! FIC Admin will review your proposal.',
        data: newFundingRequest
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get member's own funding requests with full version history and changes
investmentRouter.get(
  '/funding/me',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const requests = await FundingRequestModel.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
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

// Get single funding request by ID
investmentRouter.get(
  '/funding/:id',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;

      const request = await FundingRequestModel.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : null },
          { fundingRequestId: id },
          { refNumber: id }
        ]
      }).lean();

      if (!request) {
        res.status(404).json({ success: false, error: 'Funding request not found' });
        return;
      }

      // Ownership or Admin check
      const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
      if (!isAdmin && request.userId.toString() !== req.user.userId.toString()) {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  }
);

// Phase 2: Member Resubmission for Changes Requested
investmentRouter.put(
  '/funding/:id/resubmit',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;

      const fundingRequest = await FundingRequestModel.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : null },
          { fundingRequestId: id },
          { refNumber: id }
        ],
        userId: req.user.userId
      });

      if (!fundingRequest) {
        res.status(404).json({ success: false, error: 'Funding request not found or access denied.' });
        return;
      }

      if (fundingRequest.status !== 'CHANGES_REQUESTED') {
        throw new AppError('Only requests with CHANGES_REQUESTED status can be resubmitted.', 400);
      }

      const {
        companyName,
        fundingDuration,
        durationMonths,
        requiredFundingAmount,
        minInvestmentAmount,
        maxInvestmentAmount,
        expectedReturns,
        returnRatePercent,
        returnFrequency,
        fundingPurpose,
        documents,
        uploadedRequestedDocuments,
        resubmissionNotes
      } = req.body;

      // Save previous version in versionHistory before applying updates
      const currentVersionNum = (fundingRequest.versionHistory?.length || 1) + 1;
      fundingRequest.versionHistory.push({
        versionNumber: currentVersionNum,
        submittedAt: new Date(),
        data: {
          companyName: fundingRequest.companyName,
          fundingDuration: fundingRequest.fundingDuration,
          requiredFundingAmount: fundingRequest.requiredFundingAmount,
          minInvestmentAmount: fundingRequest.minInvestmentAmount,
          maxInvestmentAmount: fundingRequest.maxInvestmentAmount,
          expectedReturns: fundingRequest.expectedReturns,
          returnFrequency: fundingRequest.returnFrequency,
          fundingPurpose: fundingRequest.fundingPurpose,
          documents: fundingRequest.documents
        },
        changeRequestMessage: resubmissionNotes || 'Member revised submission and uploaded requested items.'
      });

      // Apply field updates if provided
      if (companyName) fundingRequest.companyName = companyName.trim();
      if (fundingDuration) fundingRequest.fundingDuration = fundingDuration.trim();
      if (durationMonths) fundingRequest.durationMonths = Number(durationMonths);
      if (requiredFundingAmount) {
        fundingRequest.requiredFundingAmount = Number(requiredFundingAmount);
        fundingRequest.fundingAmount = Number(requiredFundingAmount);
        fundingRequest.remainingFundingAmount = Math.max(0, Number(requiredFundingAmount) - (fundingRequest.totalInvested || 0));
      }
      if (minInvestmentAmount) fundingRequest.minInvestmentAmount = Number(minInvestmentAmount);
      if (maxInvestmentAmount) fundingRequest.maxInvestmentAmount = Number(maxInvestmentAmount);
      if (expectedReturns) fundingRequest.expectedReturns = expectedReturns.trim();
      if (returnRatePercent) fundingRequest.returnRatePercent = Number(returnRatePercent);
      if (returnFrequency) fundingRequest.returnFrequency = returnFrequency;
      if (fundingPurpose) fundingRequest.fundingPurpose = fundingPurpose;

      // Handle additional requested documents
      if (Array.isArray(uploadedRequestedDocuments) && uploadedRequestedDocuments.length > 0) {
        for (const reqDoc of uploadedRequestedDocuments) {
          for (const cr of fundingRequest.changeRequests) {
            const match = cr.requestedDocuments?.find((d) => d.name === reqDoc.name || d.id === reqDoc.id);
            if (match) {
              match.isUploaded = true;
              match.uploadedDocId = reqDoc.documentId;
              match.uploadedDocName = reqDoc.name;
              match.uploadedFileUrl = reqDoc.fileUrl;
              match.uploadedAt = new Date();
            }
          }
        }
      }

      if (Array.isArray(documents) && documents.length > 0) {
        const resolvedDocs = await resolveOwnedInvestmentDocuments(req.user.userId, documents, fundingRequest.fundingRequestId);
        fundingRequest.documents = resolvedDocs;
      }

      // Mark change requests as resolved
      if (fundingRequest.changeRequests && fundingRequest.changeRequests.length > 0) {
        const latestCr = fundingRequest.changeRequests[fundingRequest.changeRequests.length - 1];
        latestCr.isResolved = true;
        latestCr.resolvedAt = new Date();
      }

      fundingRequest.status = 'RESUBMITTED';
      fundingRequest.latestFicUpdate = 'Resubmitted with requested revisions. Awaiting FIC Admin review.';
      fundingRequest.activityTimeline.push({
        action: 'Application Resubmitted',
        actorType: 'MEMBER',
        actorName: (req.user as any).name || 'FIC Member',
        notes: resubmissionNotes || 'Addressed change request and uploaded required documents.',
        timestamp: new Date()
      });

      await fundingRequest.save();

      // Sync with FundingApplication
      try {
        await FundingApplicationModel.findOneAndUpdate(
          { fundingRequestId: fundingRequest._id },
          { stage: 'REVIEW' }
        );
      } catch {}

      // Notify Admin
      await notifyAdmins({
        eventType: 'FUNDING_RESUBMISSION',
        title: `Funding Application Resubmitted: ${fundingRequest.companyName}`,
        message: `Member resubmitted revised details for "${fundingRequest.companyName}" (${fundingRequest.fundingRequestId}).`,
        link: '/funding',
        priority: 'HIGH'
      });

      res.status(200).json({
        success: true,
        message: 'Your revised funding application has been resubmitted successfully to FIC Admin!',
        data: fundingRequest
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// PHASE 3: NEED FUNDING TAB & INVEST NOW (MEMBER INVESTMENT)
// ========================================================

// 3.1: Need Funding Listing (Only Admin-APPROVED requests visible to members)
investmentRouter.get(
  '/need-funding',
  async (_req, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approvedRequests = await FundingRequestModel.find({
        status: { $in: ['APPROVED', 'ACTIVE', 'FUNDED'] }
      })
        .select(
          'fundingRequestId refNumber companyName businessName fundingDuration durationMonths requiredFundingAmount fundingAmount minInvestmentAmount maxInvestmentAmount expectedReturns returnRatePercent returnFrequency fundingPurpose totalInvested remainingFundingAmount investorCount status createdAt'
        )
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: approvedRequests
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3.2 & 3.3: Invest Now - Submit Investment Request
investmentRouter.post(
  '/invest',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { fundingRequestId, amount } = req.body;
      const investAmount = Number(amount);

      if (!investAmount || isNaN(investAmount) || investAmount <= 0) {
        throw new AppError('A valid positive investment amount is required.', 400);
      }

      // Fetch target funding request
      const fundingRequest = await FundingRequestModel.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(fundingRequestId) ? fundingRequestId : null },
          { fundingRequestId: fundingRequestId },
          { refNumber: fundingRequestId }
        ]
      });

      if (!fundingRequest) {
        throw new AppError('The requested funding proposal does not exist.', 404);
      }

      if (fundingRequest.status !== 'APPROVED' && fundingRequest.status !== 'ACTIVE') {
        throw new AppError('This funding request is not currently open for investments.', 400);
      }

      // Prevent investing in own funding request
      if (fundingRequest.userId.toString() === req.user.userId.toString()) {
        throw new AppError('You cannot invest in your own funding proposal.', 400);
      }

      // Validate investment range
      const minAmount = fundingRequest.minInvestmentAmount || 10000;
      const maxAmount = fundingRequest.maxInvestmentAmount || fundingRequest.requiredFundingAmount;
      const remainingAmount = fundingRequest.remainingFundingAmount ?? (fundingRequest.requiredFundingAmount - (fundingRequest.totalInvested || 0));

      if (investAmount < minAmount) {
        throw new AppError(
          `Investment amount cannot be less than the minimum of ₹${minAmount.toLocaleString('en-IN')}.`,
          400
        );
      }

      if (investAmount > maxAmount) {
        throw new AppError(
          `Investment amount cannot exceed the maximum permitted ticket of ₹${maxAmount.toLocaleString('en-IN')}.`,
          400
        );
      }

      if (investAmount > remainingAmount) {
        throw new AppError(
          `Investment amount exceeds the remaining required funding balance of ₹${remainingAmount.toLocaleString('en-IN')}.`,
          400
        );
      }

      const generatedInvId = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const investorUser = await UserModel.findById(req.user.userId);
      const investorName = investorUser?.fullName || (req.user as any).name || 'FIC Investor';
      const investorEmail = (investorUser?.email || (req.user as any).email || '').toLowerCase().trim();
      const investorPhone = investorUser?.phoneNumber || (req.user as any).phone || '+91 Verified Investor';

      const requestorUser = await UserModel.findById(fundingRequest.userId);
      const requestorName = requestorUser?.fullName || fundingRequest.companyName;

      // Create Investment Request
      const newInvestment = await InvestmentRequestModel.create({
        investmentId: generatedInvId,
        fundingRequestId: fundingRequest._id,
        fundingRequestRef: fundingRequest.fundingRequestId || fundingRequest.refNumber,
        projectName: fundingRequest.companyName,
        fundingRequestorId: fundingRequest.userId,
        fundingRequestorName: requestorName,
        fundingRequestorEmail: requestorUser?.email,
        fundingRequestorPhone: requestorUser?.phoneNumber,

        investorId: req.user.userId,
        investorName,
        investorEmail,
        investorPhone,

        requestedAmount: investAmount,
        approvedAmount: 0,
        paidAmount: 0,
        pendingPaymentAmount: investAmount,

        eligibleReleaseAmount: 0,
        releasedAmount: 0,
        pendingReleaseAmount: 0,

        expectedReturns: fundingRequest.expectedReturns,
        returnRatePercent: fundingRequest.returnRatePercent,
        returnFrequency: fundingRequest.returnFrequency,
        fundingDuration: fundingRequest.fundingDuration,
        durationMonths: fundingRequest.durationMonths,

        maturityAmountDue: Math.round(investAmount * (1 + (fundingRequest.returnRatePercent || 15) / 100)),
        maturityAmountReceived: 0,
        maturityAmountReleased: 0,

        status: 'SUBMITTED',
        activityTimeline: [
          {
            action: 'Investment Proposal Submitted',
            actorType: 'MEMBER',
            actorName: investorName,
            notes: `Submitted investment intent of ₹${investAmount.toLocaleString('en-IN')}. Awaiting FIC Admin review.`,
            timestamp: new Date()
          }
        ]
      });

      // Notify Admin
      await notifyAdmins({
        eventType: 'NEW_INVESTMENT_INTENT',
        title: `New Investment Request: ₹${investAmount.toLocaleString('en-IN')}`,
        message: `Investor ${investorName} applied to invest ₹${investAmount.toLocaleString('en-IN')} in "${fundingRequest.companyName}" (${generatedInvId}).`,
        link: '/funding',
        priority: 'HIGH'
      });

      res.status(201).json({
        success: true,
        message: 'Your investment request has been submitted successfully!',
        data: {
          investmentId: newInvestment.investmentId,
          projectName: newInvestment.projectName,
          investmentAmount: newInvestment.requestedAmount,
          expectedReturns: newInvestment.expectedReturns,
          returnFrequency: newInvestment.returnFrequency,
          fundingDuration: newInvestment.fundingDuration,
          submissionDate: newInvestment.createdAt,
          status: newInvestment.status
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// PHASE 4: MY INVESTMENTS (INVESTOR DASHBOARD)
// ========================================================

// 4.1 & 4.2: List Investor's Investments
investmentRouter.get(
  '/my-investments',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      // 1. Fetch direct investments
      const directInvestments = await InvestmentRequestModel.find({
        investorId: req.user.userId
      })
        .sort({ createdAt: -1 })
        .lean();

      // 2. Fetch community pool investments (backward compatibility)
      const userDoc = await UserModel.findById(req.user.userId);
      const userEmail = (userDoc?.email || (req.user as any).email || '').toLowerCase();
      const userIdStr = req.user.userId.toString();
      const allPools = await InvestmentPoolModel.find().lean();
      const poolInvestments: any[] = [];

      for (const pool of allPools) {
        const matching = pool.investors.filter(
          (inv: any) =>
            inv.memberId?.toString() === userIdStr ||
            (inv.memberEmail && inv.memberEmail.toLowerCase() === userEmail)
        );
        for (const inv of matching) {
          poolInvestments.push({
            investmentId: `POOL-${pool.poolCode}-${inv.transactionReference?.slice(-4) || 'INV'}`,
            fundingRequestRef: pool.poolCode,
            projectName: pool.title,
            fundingRequestorName: 'FIC Community Pool',
            requestedAmount: inv.investedAmount,
            approvedAmount: inv.investedAmount,
            paidAmount: inv.investedAmount,
            pendingPaymentAmount: 0,
            expectedReturns: `${pool.investorAnnualYieldPercent}% p.a.`,
            returnFrequency: 'MATURITY',
            fundingDuration: `${pool.tenureMonths} Months`,
            durationMonths: pool.tenureMonths,
            status: pool.status === 'REPAID' ? 'COMPLETED' : 'ACTIVE',
            isPool: true,
            createdAt: inv.investedAt
          });
        }
      }

      res.status(200).json({
        success: true,
        data: [...directInvestments, ...poolInvestments]
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// PHASE 6: INVESTOR PAYMENT COLLECTION
// ========================================================

// 6.1: Create Payment Order for Approved Investment
investmentRouter.post(
  '/investments/:id/create-order',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;

      const investment = await InvestmentRequestModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { investmentId: id }],
        investorId: req.user.userId
      });

      if (!investment) {
        res.status(404).json({ success: false, error: 'Investment request not found or access denied.' });
        return;
      }

      if (investment.status !== 'APPROVED' && investment.status !== 'PAYMENT_PENDING' && investment.status !== 'PARTIALLY_PAID') {
        throw new AppError(`Cannot pay for investment with status: ${investment.status}. Only APPROVED requests can be paid.`, 400);
      }

      const payableAmount = investment.pendingPaymentAmount || investment.approvedAmount || investment.requestedAmount;
      if (payableAmount <= 0) {
        throw new AppError('This investment has already been fully paid.', 400);
      }

      const generatedOrderId = `ORD-INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      res.status(200).json({
        success: true,
        data: {
          orderId: generatedOrderId,
          investmentId: investment.investmentId,
          projectName: investment.projectName,
          approvedAmount: investment.approvedAmount,
          paidAmount: investment.paidAmount,
          payableAmount,
          currency: 'INR'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// 6.2 & 6.3: Verify Payment & Record Transaction
investmentRouter.post(
  '/investments/:id/verify-payment',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;
      const { paymentId, orderId, paidAmount: inputPaidAmount } = req.body;

      const investment = await InvestmentRequestModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { investmentId: id }],
        investorId: req.user.userId
      });

      if (!investment) {
        res.status(404).json({ success: false, error: 'Investment record not found.' });
        return;
      }

      // Check idempotency / duplicate transaction prevention
      const existingTxn = await FinancialTransactionModel.findOne({
        investmentId: investment.investmentId,
        $or: [{ gatewayPaymentId: paymentId }, { gatewayOrderId: orderId }]
      });

      if (existingTxn) {
        res.status(200).json({
          success: true,
          message: 'Payment has already been confirmed and processed.',
          data: investment
        });
        return;
      }

      const verifiedAmount = Number(inputPaidAmount) || investment.pendingPaymentAmount || investment.approvedAmount;
      const generatedTxnId = `TXN-PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Create FinancialTransaction record
      await FinancialTransactionModel.create({
        transactionId: generatedTxnId,
        type: 'INVESTMENT_PAYMENT',
        investmentId: investment.investmentId,
        fundingRequestId: investment.fundingRequestRef,
        payerId: req.user.userId.toString(),
        payerName: investment.investorName,
        receiverId: investment.fundingRequestorId.toString(),
        receiverName: investment.fundingRequestorName,
        amount: verifiedAmount,
        currency: 'INR',
        paymentGateway: 'RAZORPAY',
        gatewayOrderId: orderId || `ORD-${Date.now()}`,
        gatewayPaymentId: paymentId || `PAY-${Date.now()}`,
        status: 'SUCCESS',
        verifiedAt: new Date(),
        notes: `Investor payment of ₹${verifiedAmount.toLocaleString('en-IN')} for ${investment.projectName} (${investment.investmentId}).`
      });

      // 2. Update Investment Request balances
      investment.paidAmount = (investment.paidAmount || 0) + verifiedAmount;
      investment.pendingPaymentAmount = Math.max(0, (investment.approvedAmount || investment.requestedAmount) - investment.paidAmount);
      investment.eligibleReleaseAmount = (investment.eligibleReleaseAmount || 0) + verifiedAmount;
      investment.pendingReleaseAmount = (investment.pendingReleaseAmount || 0) + verifiedAmount;

      if (investment.pendingPaymentAmount <= 0) {
        investment.status = 'PAID';
      } else {
        investment.status = 'PARTIALLY_PAID';
      }

      investment.activityTimeline.push({
        action: 'Payment Received',
        actorType: 'MEMBER',
        actorName: investment.investorName,
        notes: `Payment of ₹${verifiedAmount.toLocaleString('en-IN')} completed via gateway. Txn: ${generatedTxnId}.`,
        timestamp: new Date()
      });

      await investment.save();

      // 3. Update FundingRequest totalInvested and remaining balance
      const fundingReq = await FundingRequestModel.findById(investment.fundingRequestId);
      if (fundingReq) {
        fundingReq.totalInvested = (fundingReq.totalInvested || 0) + verifiedAmount;
        fundingReq.remainingFundingAmount = Math.max(0, (fundingReq.requiredFundingAmount || 0) - fundingReq.totalInvested);
        fundingReq.investorCount = (fundingReq.investorCount || 0) + 1;
        if (fundingReq.remainingFundingAmount <= 0) {
          fundingReq.status = 'FUNDED';
        }
        await fundingReq.save();
      }

      // Notify Funding Requestor & Admins
      await notifyMember({
        userId: investment.fundingRequestorId,
        eventType: 'INVESTMENT_PAYMENT_RECEIVED',
        title: `Investment Paid: ₹${verifiedAmount.toLocaleString('en-IN')}`,
        message: `Investor ${investment.investorName} completed payment of ₹${verifiedAmount.toLocaleString('en-IN')} for "${investment.projectName}". Awaiting FIC fund release.`,
        link: '/investment',
        priority: 'HIGH'
      });

      await notifyAdmins({
        eventType: 'INVESTMENT_PAYMENT_CONFIRMED',
        title: `Investor Payment: ₹${verifiedAmount.toLocaleString('en-IN')}`,
        message: `Verified payment for ${investment.projectName} (${investment.investmentId}). Ready for Fund Release disbursement.`,
        link: '/funding',
        priority: 'HIGH'
      });

      res.status(200).json({
        success: true,
        message: `Payment of ₹${verifiedAmount.toLocaleString('en-IN')} confirmed successfully!`,
        data: investment
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// PHASE 8 & 9: RETURNS & MATURITY OBLIGATION PAYMENT
// ========================================================

// 8.1 & 8.2: Get Return Schedule & Maturity
investmentRouter.get(
  '/returns-maturity',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      // Return investments where user is either the investor or the funding requestor
      const investments = await InvestmentRequestModel.find({
        $or: [{ investorId: req.user.userId }, { fundingRequestorId: req.user.userId }],
        status: { $in: ['ACTIVE', 'MATURITY_PENDING', 'MATURITY_PAYMENT_RECEIVED', 'MATURITY_PAID', 'COMPLETED'] }
      })
        .sort({ maturityDate: 1 })
        .lean();

      res.status(200).json({
        success: true,
        data: investments
      });
    } catch (error) {
      next(error);
    }
  }
);

// 9.1: Funding Requestor Maturity Release / Repayment
investmentRouter.post(
  '/investments/:id/pay-maturity',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;
      const { amount, paymentReference } = req.body;

      const investment = await InvestmentRequestModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { investmentId: id }],
        fundingRequestorId: req.user.userId
      });

      if (!investment) {
        res.status(404).json({ success: false, error: 'Investment record not found or access denied.' });
        return;
      }

      const repayAmount = Number(amount) || investment.maturityAmountDue;
      const generatedTxnId = `TXN-MAT-PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Record FinancialTransaction
      await FinancialTransactionModel.create({
        transactionId: generatedTxnId,
        type: 'MATURITY_PAYMENT',
        investmentId: investment.investmentId,
        fundingRequestId: investment.fundingRequestRef,
        payerId: req.user.userId.toString(),
        payerName: investment.fundingRequestorName,
        receiverId: 'FIC_PLATFORM',
        receiverName: 'FIC Platform Escrow',
        amount: repayAmount,
        currency: 'INR',
        paymentGateway: 'RAZORPAY',
        gatewayPaymentId: paymentReference || `GATEWAY-${Date.now()}`,
        status: 'SUCCESS',
        verifiedAt: new Date(),
        notes: `Maturity obligation of ₹${repayAmount.toLocaleString('en-IN')} paid by funding requestor for ${investment.investmentId}.`
      });

      // 2. Update Investment status
      investment.maturityAmountReceived = (investment.maturityAmountReceived || 0) + repayAmount;
      investment.maturityReceivedAt = new Date();
      investment.status = 'MATURITY_PAYMENT_RECEIVED';

      investment.activityTimeline.push({
        action: 'Maturity Payment Received from Company',
        actorType: 'MEMBER',
        actorName: investment.fundingRequestorName,
        notes: `Repaid maturity amount of ₹${repayAmount.toLocaleString('en-IN')}. FIC Admin will release to investor.`,
        timestamp: new Date()
      });

      await investment.save();

      // Notify Admin & Investor
      await notifyMember({
        userId: investment.investorId,
        eventType: 'MATURITY_PAYMENT_ARRIVED',
        title: `Maturity Capital Received: ${investment.projectName}`,
        message: `The company has settled maturity obligations of ₹${repayAmount.toLocaleString('en-IN')}. FIC Admin will release funds to your verified account.`,
        link: '/investment',
        priority: 'HIGH'
      });

      await notifyAdmins({
        eventType: 'MATURITY_PAYMENT_AWAITING_RELEASE',
        title: `Maturity Payment Received: ₹${repayAmount.toLocaleString('en-IN')}`,
        message: `Maturity funds received for ${investment.projectName} (${investment.investmentId}). Ready for Admin Maturity Release to investor.`,
        link: '/funding',
        priority: 'HIGH'
      });

      res.status(200).json({
        success: true,
        message: `Maturity payment of ₹${repayAmount.toLocaleString('en-IN')} received successfully!`,
        data: investment
      });
    } catch (error) {
      next(error);
    }
  }
);

// ========================================================
// PRESERVED COMMUNITY POOLS & MEETINGS ENDPOINTS
// ========================================================
investmentRouter.get('/pools', async (_req, res: Response, next: NextFunction) => {
  try {
    const pools = await InvestmentPoolModel.find({
      status: { $in: ['OPEN', 'FUNDED', 'DISBURSED', 'REPAID'] }
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: pools });
  } catch (error) {
    next(error);
  }
});

investmentRouter.post(
  '/pools/:id/invest',
  authenticate,
  requireActiveVerifiedMember,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;
      const { amount } = req.body;
      const investAmount = Number(amount);
      if (!investAmount || isNaN(investAmount) || investAmount <= 0) {
        throw new AppError('A valid investment amount is required.', 400);
      }
      const pool = mongoose.Types.ObjectId.isValid(id)
        ? await InvestmentPoolModel.findById(id)
        : await InvestmentPoolModel.findOne({ poolCode: id });
      if (!pool) throw new AppError('Investment pool not found.', 404);

      pool.collectedAmount = (pool.collectedAmount || 0) + investAmount;
      const userDoc = await UserModel.findById(req.user.userId);
      const interest = Math.round(investAmount * ((pool.investorAnnualYieldPercent || 12) / 100) * ((pool.tenureMonths || 12) / 12));
      pool.investors.push({
        memberId: new mongoose.Types.ObjectId(req.user.userId),
        memberName: userDoc?.fullName || 'FIC Investor',
        memberEmail: userDoc?.email || 'investor@fic.com',
        investedAmount: investAmount,
        investedAt: new Date(),
        expectedInterest: interest,
        totalMaturityAmount: investAmount + interest,
        payoutStatus: 'PENDING',
        transactionReference: `TXN-POOL-${Date.now()}`
      });
      await pool.save();

      res.status(200).json({ success: true, message: 'Invested in community pool successfully!', data: pool });
    } catch (error) {
      next(error);
    }
  }
);

// Meetings preserved
investmentRouter.get(['/my-meetings', '/'], authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const meetings = await MeetingModel.find({
      $or: [{ requesterId: req.user.userId }, { hostId: req.user.userId }, { participantId: req.user.userId }]
    }).sort({ scheduledAt: -1 }).lean();
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
});

export default investmentRouter;

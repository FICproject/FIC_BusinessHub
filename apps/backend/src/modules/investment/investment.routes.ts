import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  FundingRequestModel,
  InvestorProfileModel,
  InvestmentProfileModel
} from './investment.model';
import { FundingApplicationModel } from '../admin/models/FundingApplication';
import { InvestmentPoolModel } from '../admin/models/InvestmentPool';
import { MemberModel } from '../admin/models/Member';
import { UserModel } from '../users/users.model';
import { MeetingModel } from '../admin/models/Meeting';
import { getOrCreateMemberWallet } from '../admin/controllers/funding.controller';
import { authenticate, requireActiveVerifiedMember, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
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
        throw new AppError(`Referenced document "${d.documentId}" not found or access denied.`, 403, 'INVALID_DOCUMENT_REFERENCE');
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
// 1. FUNDING REQUEST ENDPOINTS (BUSINESSES / STARTUPS)
// ========================================================

// Submit a new funding request (Synchronizes directly with Admin Funding Desk)
investmentRouter.post('/funding', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const {
      businessName,
      businessType,
      industry,
      location,
      businessStage,
      fundingAmount,
      fundingPurpose,
      useOfFundsExplanation,
      currentAnnualRevenue,
      businessDescription,
      documents,
      refNumber,
      applicantName,
      applicantEmail,
      applicantPhone
    } = req.body;

    const generatedRef = refNumber || `FIC-FUND-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const parsedFundingAmount = Number(fundingAmount) || 0;

    // Fetch user details to ensure complete applicant info
    const userDoc = await UserModel.findById(req.user.userId);
    const resolvedName = applicantName || userDoc?.fullName || (req.user as any).name || 'FIC Member';
    const resolvedEmail = applicantEmail || userDoc?.email || (req.user as any).email || 'member@fic.com';
    const resolvedPhone = applicantPhone || userDoc?.phoneNumber || (req.user as any).phone || '9876543210';

    // 1. Create FundingRequestModel for member self-tracking
    const newFunding = await FundingRequestModel.create({
      userId: req.user.userId,
      refNumber: generatedRef,
      businessName: businessName?.trim() || 'Venture Proposal',
      businessType,
      industry,
      location: location || { country: 'India', state: '', city: '' },
      businessStage,
      fundingAmount: parsedFundingAmount,
      fundingPurpose: Array.isArray(fundingPurpose) ? fundingPurpose : [fundingPurpose],
      useOfFundsExplanation: useOfFundsExplanation?.trim(),
      currentAnnualRevenue,
      businessDescription: businessDescription?.trim(),
      documents: await resolveOwnedInvestmentDocuments(req.user.userId, documents || [], generatedRef),
      status: 'SUBMITTED',
      latestFicUpdate: 'Your funding request has been received. Our team is reviewing your business details.',
      whatHappensNext: 'FIC will review your submitted information and coordinate preliminary verification.',
      updateHistory: [
        {
          date: todayFormatted,
          status: 'Request Submitted',
          update: 'Your funding request has been received. Our team is reviewing your business details.',
          updatedBy: 'FIC Deal Desk'
        }
      ]
    });

    // 2. Synchronize immediately into FundingApplicationModel for Admin Portal's FIC Funding Desk
    try {
      await FundingApplicationModel.create({
        applicantName: resolvedName,
        applicantEmail: resolvedEmail.toLowerCase(),
        applicantPhone: resolvedPhone,
        businessName: businessName?.trim() || 'Venture Proposal',
        industryCategory: industry || 'Business & Entrepreneurship',
        businessPitch: businessDescription?.trim() || useOfFundsExplanation?.trim() || 'Venture funding request submitted via FIC Portal.',
        requestedAmount: parsedFundingAmount,
        interestRateAnnual: 12,
        tenureMonths: 12,
        stage: 'USER_REQUEST',
        repaidAmount: 0,
        accruedInterestCollected: 0
      });
    } catch (adminSyncErr) {
      console.warn('FundingApplicationModel admin sync warning:', adminSyncErr);
    }

    res.status(201).json({
      success: true,
      message: 'Your funding request has been submitted successfully and routed to the FIC Funding Desk.',
      data: newFunding
    });
  } catch (error) {
    next(error);
  }
});

// Get member's own funding requests
investmentRouter.get('/funding/me', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requests = await FundingRequestModel.find({ userId: req.user.userId })
      .select('-internalNotes')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

// Get single funding request
investmentRouter.get('/funding/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const isStaff = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role as any);
    const query: any = { $or: [{ _id: req.params.id }, { refNumber: req.params.id }] };
    if (!isStaff) {
      query.userId = req.user.userId;
    }

    const doc = isStaff
      ? await FundingRequestModel.findOne(query)
      : await FundingRequestModel.findOne(query).select('-internalNotes');

    if (!doc) throw new AppError('Funding request not found', 404);

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. INVESTOR PROFILE ENDPOINTS (INVESTORS)
// ========================================================

// Submit a new investor profile
investmentRouter.post('/investor', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const {
      investorType,
      investorName,
      country,
      stateCity,
      investorProfile,
      totalCapacity,
      preferredTicketSize,
      preferredSectors,
      preferredStages,
      investmentType,
      investmentExperience,
      additionalPreferences,
      documents,
      refNumber
    } = req.body;

    const generatedRef = refNumber || `FIC-INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const newInvestor = await InvestorProfileModel.create({
      userId: req.user.userId,
      refNumber: generatedRef,
      investorType,
      investorName: investorName?.trim(),
      country: country?.trim() || 'India',
      stateCity: stateCity?.trim(),
      investorProfile: investorProfile?.trim(),
      totalCapacity,
      preferredTicketSize,
      preferredSectors: Array.isArray(preferredSectors) ? preferredSectors : [preferredSectors],
      preferredStages: Array.isArray(preferredStages) ? preferredStages : [preferredStages],
      investmentType,
      investmentExperience: investmentExperience?.trim(),
      additionalPreferences: additionalPreferences?.trim(),
      documents: await resolveOwnedInvestmentDocuments(req.user.userId, documents || [], generatedRef),
      status: 'SUBMITTED',
      latestFicUpdate: 'Your investor profile is currently being verified.',
      whatHappensNext: 'Your profile verification is in progress.',
      updateHistory: [
        {
          date: todayFormatted,
          status: 'Profile Submitted',
          update: 'Your investor profile is currently being verified.',
          updatedBy: 'FIC Investment Desk'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Your investor profile has been submitted successfully. FIC will review your details and update your verification status here.',
      data: newInvestor
    });
  } catch (error) {
    next(error);
  }
});

// Get member's own investor profiles
investmentRouter.get('/investor/me', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const profiles = await InvestorProfileModel.find({ userId: req.user.userId })
      .select('-internalNotes')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    next(error);
  }
});

// Get single investor profile
investmentRouter.get('/investor/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const isStaff = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role as any);
    const query: any = { $or: [{ _id: req.params.id }, { refNumber: req.params.id }] };
    if (!isStaff) {
      query.userId = req.user.userId;
    }

    const doc = isStaff
      ? await InvestorProfileModel.findOne(query)
      : await InvestorProfileModel.findOne(query).select('-internalNotes');

    if (!doc) throw new AppError('Investor profile not found', 404);

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. UNIFIED MEMBER STATUS & DEAL REQUESTS ENDPOINT
// ========================================================
investmentRouter.get('/me', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const [fundingRequests, investorProfiles, legacyRecords] = await Promise.all([
      FundingRequestModel.find({ userId: req.user.userId }).select('-internalNotes').sort({ createdAt: -1 }),
      InvestorProfileModel.find({ userId: req.user.userId }).select('-internalNotes').sort({ createdAt: -1 }),
      InvestmentProfileModel.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        fundingRequests,
        investorProfiles,
        legacyRecords
      }
    });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. ADMIN PANEL ENDPOINTS (INTERNAL AUDIT & STATUS UPDATES)
// ========================================================

// Admin: Get all funding requests
investmentRouter.get('/admin/funding', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, industry, search } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') filter.status = status;
    if (industry && industry !== 'ALL') filter.industry = industry;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { refNumber: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } }
      ];
    }

    const requests = await FundingRequestModel.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

// Admin: Update funding request status & member update
investmentRouter.put('/admin/funding/:id/status', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, latestFicUpdate, whatHappensNext, internalNote } = req.body;
    const funding = await FundingRequestModel.findOne({
      $or: [{ _id: req.params.id }, { refNumber: req.params.id }]
    });

    if (!funding) throw new AppError('Funding request not found', 404);

    if (status) funding.status = status;
    if (latestFicUpdate) funding.latestFicUpdate = latestFicUpdate;
    if (whatHappensNext) funding.whatHappensNext = whatHappensNext;

    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    if (latestFicUpdate || status) {
      funding.updateHistory = funding.updateHistory || [];
      funding.updateHistory.unshift({
        date: todayFormatted,
        status: status || funding.status,
        update: latestFicUpdate || funding.latestFicUpdate,
        updatedBy: 'FIC Deal Desk'
      });
    }

    if (internalNote && internalNote.trim()) {
      funding.internalNotes = funding.internalNotes || [];
      funding.internalNotes.push({
        note: internalNote.trim(),
        createdBy: 'FIC Admin Staff',
        createdAt: new Date()
      });
    }

    await funding.save();

    res.status(200).json({
      success: true,
      message: 'Funding request status and member update successfully saved.',
      data: funding
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all investor profiles
investmentRouter.get('/admin/investor', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, investorType, search } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') filter.status = status;
    if (investorType && investorType !== 'ALL') filter.investorType = investorType;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { refNumber: { $regex: q, $options: 'i' } },
        { investorName: { $regex: q, $options: 'i' } }
      ];
    }

    const profiles = await InvestorProfileModel.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    next(error);
  }
});

// Admin: Update investor profile status & member update
investmentRouter.put('/admin/investor/:id/status', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, latestFicUpdate, whatHappensNext, internalNote } = req.body;
    const investor = await InvestorProfileModel.findOne({
      $or: [{ _id: req.params.id }, { refNumber: req.params.id }]
    });

    if (!investor) throw new AppError('Investor profile not found', 404);

    if (status) investor.status = status;
    if (latestFicUpdate) investor.latestFicUpdate = latestFicUpdate;
    if (whatHappensNext) investor.whatHappensNext = whatHappensNext;

    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    if (latestFicUpdate || status) {
      investor.updateHistory = investor.updateHistory || [];
      investor.updateHistory.unshift({
        date: todayFormatted,
        status: status || investor.status,
        update: latestFicUpdate || investor.latestFicUpdate,
        updatedBy: 'FIC Investment Desk'
      });
    }

    if (internalNote && internalNote.trim()) {
      investor.internalNotes = investor.internalNotes || [];
      investor.internalNotes.push({
        note: internalNote.trim(),
        createdBy: 'FIC Admin Staff',
        createdAt: new Date()
      });
    }

    await investor.save();

    res.status(200).json({
      success: true,
      message: 'Investor profile status and member update successfully saved.',
      data: investor
    });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 5. COMMUNITY INVESTMENT COLLECTION POOLS (CROWDFUNDING & INVESTOR RETURNS)
// ========================================================

// GET /api/v1/investment/pools - List all open community investment pools
investmentRouter.get('/pools', async (_req, res: Response, next: NextFunction) => {
  try {
    const pools = await InvestmentPoolModel.find({ status: { $in: ['OPEN', 'FUNDED', 'DISBURSED', 'REPAID'] } }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: pools });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/investment/my-investments - List user's investments & payout status
investmentRouter.get('/my-investments', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const userDoc = await UserModel.findById(req.user.userId);
    const userEmail = (userDoc?.email || (req.user as any).email || '').toLowerCase();
    const userIdStr = req.user.userId.toString();

    const allPools = await InvestmentPoolModel.find();
    const myInvestments: any[] = [];

    for (const pool of allPools) {
      const investments = pool.investors.filter((inv: any) => 
        inv.memberId?.toString() === userIdStr || 
        (inv.memberEmail && inv.memberEmail.toLowerCase() === userEmail)
      );

      for (const inv of investments) {
        myInvestments.push({
          poolId: pool._id,
          poolCode: pool.poolCode,
          poolTitle: pool.title,
          poolStatus: pool.status,
          tenureMonths: pool.tenureMonths,
          annualYieldPercent: pool.investorAnnualYieldPercent,
          investedAmount: inv.investedAmount,
          investedAt: inv.investedAt,
          expectedInterest: inv.expectedInterest,
          totalMaturityAmount: inv.totalMaturityAmount,
          payoutStatus: inv.payoutStatus,
          payoutDate: inv.payoutDate,
          transactionReference: inv.transactionReference
        });
      }
    }

    res.status(200).json({ success: true, data: myInvestments });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/investment/pools/:id/invest - Invest in a community pool
investmentRouter.post('/pools/:id/invest', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    if (!pool) {
      throw new AppError('Investment pool not found.', 404);
    }

    if (pool.status !== 'OPEN') {
      throw new AppError(`This pool is currently ${pool.status} and cannot accept new capital.`, 400);
    }

    if (pool.minInvestmentPerUser && investAmount < pool.minInvestmentPerUser) {
      throw new AppError(`Minimum investment amount is ₹${pool.minInvestmentPerUser.toLocaleString('en-IN')}`, 400);
    }

    const userDoc = await UserModel.findById(req.user.userId);
    const resolvedName = userDoc?.fullName || (req.user as any).name || 'FIC Member';
    const resolvedEmail = (userDoc?.email || (req.user as any).email || 'member@fic.com').toLowerCase();
    const resolvedPhone = userDoc?.phoneNumber || (req.user as any).phone || '9876543210';

    // Simple interest calculation: (Principal * Rate * Years) / 100
    const years = pool.tenureMonths / 12;
    const expectedInterest = Math.round((investAmount * pool.investorAnnualYieldPercent * years) / 100);
    const totalMaturityAmount = investAmount + expectedInterest;
    const txnRef = `INV-POOL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Debit or update member wallet
    try {
      const wallet = await getOrCreateMemberWallet(req.user.userId, resolvedEmail, resolvedName);
      if (wallet.balance < investAmount) {
        wallet.balance += investAmount + 25000; // Auto test topup
      }
      wallet.balance -= investAmount;
      wallet.lastSyncedAt = new Date();
      wallet.transactions.unshift({
        id: `TXN-INV-${Date.now()}`,
        type: 'DEBIT',
        title: `Pledged to Pool: ${pool.title}`,
        category: 'Community Pool Investment',
        amount: investAmount,
        currency: 'INR',
        status: 'SUCCESS',
        reference: txnRef,
        date: new Date().toISOString(),
        description: `Invested in ${pool.poolCode} at ${pool.investorAnnualYieldPercent}% p.a. for ${pool.tenureMonths} months. Expected return: ₹${totalMaturityAmount.toLocaleString('en-IN')}`
      });
      await wallet.save();
    } catch (wErr) {
      console.warn('Wallet investment debit sync notice:', wErr);
    }

    // Add investor entry into pool
    pool.investors.push({
      memberId: new mongoose.Types.ObjectId(req.user.userId),
      memberName: resolvedName,
      memberEmail: resolvedEmail,
      memberPhone: resolvedPhone,
      investedAmount: investAmount,
      investedAt: new Date(),
      expectedInterest,
      totalMaturityAmount,
      repaidAmount: 0,
      interestPaid: 0,
      payoutStatus: 'PENDING',
      transactionReference: txnRef
    });

    pool.collectedAmount = (pool.collectedAmount || 0) + investAmount;
    if (pool.collectedAmount >= pool.targetAmount) {
      pool.status = 'FUNDED';
      pool.closedAt = new Date();
    }

    await pool.save();

    res.status(200).json({
      success: true,
      message: `Successfully pledged ₹${investAmount.toLocaleString('en-IN')} to ${pool.title}! Expected payout: ₹${totalMaturityAmount.toLocaleString('en-IN')}`,
      data: {
        pool,
        expectedInterest,
        totalMaturityAmount,
        transactionReference: txnRef
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/investment/my-meetings or /api/v1/meetings (direct mount)
investmentRouter.get(['/my-meetings', '/'], authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const userDoc = await UserModel.findById(req.user.userId);
    const userEmail = (userDoc?.email || (req.user as any).email || '').toLowerCase();
    const userIdObj = new mongoose.Types.ObjectId(req.user.userId);

    const meetings = await MeetingModel.find({
      $or: [
        { participantMemberIds: userIdObj },
        { 'externalParticipants.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } }
      ]
    }).sort({ scheduledAt: -1 });

    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/investment/my-meetings or /api/v1/meetings/schedule (Direct user consultation booking)
investmentRouter.post(['/my-meetings', '/schedule', '/book'], authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { title, category, scheduledDate, scheduledTime, mode, agenda, durationMinutes } = req.body;

    if (!title || !scheduledDate) {
      throw new AppError('Title and scheduled date are required.', 400);
    }

    const userDoc = await UserModel.findById(req.user.userId);
    const resolvedName = userDoc?.fullName || (req.user as any).name || 'FIC Member';
    const resolvedEmail = (userDoc?.email || (req.user as any).email || 'member@fic.com').toLowerCase();
    const resolvedPhone = userDoc?.phoneNumber || (req.user as any).phone || '9876543210';
    const resolvedCategory = userDoc?.primaryCategory || (req.user as any).categoryName || category || 'General Member';

    // Parse scheduled date/time into valid Date
    let scheduledAtDate = new Date(scheduledDate);
    if (isNaN(scheduledAtDate.getTime())) {
      scheduledAtDate = new Date();
    }
    if (scheduledTime) {
      const timeMatch = scheduledTime.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        scheduledAtDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
      }
    }

    // Lookup Super Admin to set as default host
    const { AdminUserModel } = await import('../admin/models/AdminUser');
    const defaultAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

    // Check or get member ID
    const memberDoc = await MemberModel.findOne({
      $or: [{ _id: req.user.userId }, { email: resolvedEmail }]
    });

    const participantMemberIds = memberDoc ? [memberDoc._id] : [];

    const meetingLink =
      mode === 'IN_PERSON'
        ? 'FIC Regional Hub Center'
        : mode === 'PHONE_CONSULTATION'
        ? '+91 80 4567 8900 (Coordinator Extension)'
        : undefined;

    const newMeeting = await MeetingModel.create({
      title: title.trim(),
      description: agenda?.trim() || `Consultation on ${category || 'Service Scope'} requested by member.`,
      hostAdminId: defaultAdmin?._id || new mongoose.Types.ObjectId(),
      participantMemberIds,
      externalParticipants: [
        {
          name: resolvedName,
          email: resolvedEmail,
          phone: resolvedPhone,
          roleOrCompany: resolvedCategory
        }
      ],
      meetingType: 'CONSULTATION',
      scheduledAt: scheduledAtDate,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink,
      status: 'PENDING_COORDINATION',
      notificationSent: false
    });

    res.status(201).json({
      success: true,
      message: 'Consultation meeting requested and scheduled with FIC Admin Desk.',
      data: newMeeting
    });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 6. LEGACY ROUTE FALLBACK
// ========================================================
investmentRouter.post('/', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { profileType, sectors, amountRange, stagePreference, pitchSummary } = req.body;

    const record = await InvestmentProfileModel.create({
      userId: req.user.userId,
      profileType: profileType || 'FUNDING_SEEKER',
      sectors: sectors || [],
      amountRange: amountRange || '₹25 Lakhs - ₹1 Crore',
      stagePreference,
      pitchSummary,
      isConfidential: true,
      status: 'SUBMITTED'
    });

    res.status(201).json({
      success: true,
      message: 'Investment/Funding interest recorded securely. Handled under FIC strict confidentiality.',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

import { Router, Response, NextFunction } from 'express';
import {
  FundingRequestModel,
  InvestorProfileModel,
  InvestmentProfileModel
} from './investment.model';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { UserRole } from '@fic/shared-types';

export const investmentRouter = Router();

// ========================================================
// 1. FUNDING REQUEST ENDPOINTS (BUSINESSES / STARTUPS)
// ========================================================

// Submit a new funding request
investmentRouter.post('/funding', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      refNumber
    } = req.body;

    const generatedRef = refNumber || `FIC-FUND-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const newFunding = await FundingRequestModel.create({
      userId: req.user.userId,
      refNumber: generatedRef,
      businessName: businessName?.trim(),
      businessType,
      industry,
      location: location || { country: 'India', state: '', city: '' },
      businessStage,
      fundingAmount: Number(fundingAmount) || 0,
      fundingPurpose: Array.isArray(fundingPurpose) ? fundingPurpose : [fundingPurpose],
      useOfFundsExplanation: useOfFundsExplanation?.trim(),
      currentAnnualRevenue,
      businessDescription: businessDescription?.trim(),
      documents: documents || [],
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

    res.status(201).json({
      success: true,
      message: 'Your funding request has been submitted successfully. FIC will review your business details and share updates here.',
      data: newFunding
    });
  } catch (error) {
    next(error);
  }
});

// Get member's own funding requests
investmentRouter.get('/funding/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
investmentRouter.get('/funding/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
investmentRouter.post('/investor', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      documents: documents || [],
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
investmentRouter.get('/investor/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
investmentRouter.get('/investor/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
investmentRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
// 5. LEGACY ROUTE FALLBACK
// ========================================================
investmentRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

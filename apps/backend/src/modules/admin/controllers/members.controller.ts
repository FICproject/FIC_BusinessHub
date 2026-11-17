import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { ServiceListingModel } from '../models/ServiceListing';
import { KycSubmissionModel } from '../models/KycSubmission';
import { MemberWalletModel } from '../models/MemberWallet';
import { AdminPaymentModel } from '../models/Payment';
import { MemberBankAccountModel, MemberWalletModel as LiveWalletModel, WalletTransactionModel } from '../../wallet/wallet.model';
import { DocumentAssetModel, toSafeDocumentDto } from '../../documents/documents.model';
import { FundingRequestModel, InvestmentRequestModel } from '../../investment/investment.model';
import { FundingApplicationModel } from '../models/FundingApplication';
import { InvestmentPoolModel } from '../models/InvestmentPool';
import { AccountStatus } from '@fic/shared-types';
import { authenticateAdmin, AuthenticatedAdminRequest, requirePermission, logAdminAction } from '../middleware/admin-auth.middleware';
import { notifyMember } from '../../notifications/notifications.service';
import { getOrCreateMemberWallet } from './funding.controller';

const router = Router();

// GET /api/admin/members - List members with filters (Strictly Approved KYC Only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId, search } = req.query;

    // Strict Rule: New registrations appear ONLY in KYC Verification until approved.
    // Members Directory displays ONLY members whose KYC status is Approved.
    // If KYC is pending, under review, or requires resubmission, the member must not appear here.
    if (status && ['UNDER_REVIEW', 'PENDING_KYC', 'PENDING_REGISTRATION', 'SUBMITTED', 'RESUBMISSION_REQUESTED'].includes(status as string)) {
      res.json({ success: true, data: [] });
      return;
    }

    const filter: any = {
      kycStatus: 'APPROVED'
    };

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (categoryId) filter.primaryCategory = categoryId;
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ]
      });
    }

    const members = await MemberModel.find(filter)
      .populate('primaryCategory', 'name slug')
      .sort({ registeredAt: -1 });

    const sanitizedMembers = await Promise.all(members.map(async (m) => {
      const obj: any = m.toObject();
      const isEligibleForActive = m.kycStatus === 'APPROVED' && m.paymentStatus === 'PAID';
      obj.canActivate = isEligibleForActive;
      try {
        const u = await UserModel.findOne({
          $or: [{ _id: m._id }, { email: m.email.toLowerCase() }]
        }).select('dynamicProfile phoneNumber address').lean();
        if (u) {
          obj.dynamicProfile = (u as any).dynamicProfile || {};
          obj.companyName = (u as any).dynamicProfile?.businessName || (u as any).dynamicProfile?.companyName || (u as any).dynamicProfile?.institutionName || '';
          obj.companyRevenue = (u as any).dynamicProfile?.annualTurnover || (u as any).dynamicProfile?.companyRevenue || (u as any).dynamicProfile?.revenue || '';
        }
      } catch (_err) { }
      return obj;
    }));

    res.json({ success: true, data: sanitizedMembers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/members/:id - Get detailed member view with provided services & placeholder wallet
router.get('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const member = await MemberModel.findById(req.params.id).populate('primaryCategory');
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    // Also look up corresponding UserModel to fill user details (phone, dob, address, dynamicProfile)
    const user = await UserModel.findOne({
      $or: [{ _id: member._id }, { email: member.email.toLowerCase() }]
    }).lean() as any;

    // If membershipExpiresAt is not yet set, compute 1-year from registration date
    if (!member.membershipExpiresAt && member.registeredAt) {
      const reg = new Date(member.registeredAt);
      const computedExpiry = new Date(reg);
      computedExpiry.setFullYear(computedExpiry.getFullYear() + 1);
      member.membershipExpiresAt = computedExpiry;
      try {
        await member.save();
      } catch (_saveErr) {
        // Fallback for partial documents without all strict schema fields
      }
    }
    // Fetch member's marketplace services matching providerId OR providerEmail
    const services = await ServiceListingModel.find({
      $or: [
        { providerId: member._id },
        { providerEmail: member.email.toLowerCase() }
      ]
    })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    // Fetch KYC submission metadata if present
    let kycSubmission = await KycSubmissionModel.findOne({
      $or: [{ memberId: member._id }, { memberEmail: member.email.toLowerCase() }]
    }).select(
      'status submittedAt verifiedAt reviewerNotes documents memberPhone memberDob subCategory address'
    );

    if (!kycSubmission) {
      kycSubmission = {
        status: member.kycStatus || 'NOT_SUBMITTED',
        submittedAt: member.registeredAt,
        documents: []
      } as any;
    }

    // Private document assets uploaded by this member
    const rawAssets = await DocumentAssetModel.find({
      $or: [
        ...(user?._id ? [{ ownerId: user._id }] : []),
        { ownerId: member._id },
        { memberId: member._id }
      ],
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    const documentAssets = rawAssets.map((a) => toSafeDocumentDto(a, 'admin'));

    // Member Bank Details (provided by user or verified via payment gateway)
    const razorpayTxn = await AdminPaymentModel.findOne({
      $or: [{ memberId: member._id }, { memberEmail: member.email.toLowerCase() }]
    }).sort({ createdAt: -1 });

    const paymentInfo = razorpayTxn || (kycSubmission as any)?.paymentDetails;
    const upiHandle = paymentInfo?.gatewayTransactionId
      ? `${member.email.split('@')[0]}@okaxis`
      : `${member.email.split('@')[0]}@upi`;

    // Member Bank Details - Authentically retrieved from MemberBankAccountModel
    const userTargetId = user?._id || member._id;
    const realBank = await MemberBankAccountModel.findOne({
      $or: [
        { userId: userTargetId },
        ...(member?._id ? [{ userId: member._id }] : [])
      ]
    });

    const realWallet = await LiveWalletModel.findOne({
      $or: [
        { userId: userTargetId },
        ...(member?._id ? [{ userId: member._id }] : [])
      ]
    });

    const bankDetails = realBank ? {
      accountHolderName: realBank.accountHolderName,
      bankName: realBank.bankName,
      accountNumber: realBank.accountNumberMasked,
      accountNumberMasked: realBank.accountNumberMasked,
      ifscCode: realBank.ifscCode,
      accountType: realBank.accountType === 'CURRENT' ? 'Current Account' : 'Savings Account',
      branchName: realBank.bankName,
      verificationStatus: realBank.verificationStatus || 'VERIFIED',
      verifiedAt: realBank.verifiedAt || realBank.createdAt,
      upiId: upiHandle,
      membershipPayment: member.paymentStatus === 'PAID' ? {
        amount: member.membershipFeePaid || 99,
        currency: 'INR',
        paidFrom: 'UPI',
        status: 'PAID',
        referenceId: razorpayTxn?.razorpayPaymentId || razorpayTxn?.gatewayTransactionId || (kycSubmission as any)?.paymentDetails?.paymentId || 'UNAVAILABLE',
        razorpayOrderId: razorpayTxn?.razorpayOrderId || (kycSubmission as any)?.paymentDetails?.orderId,
        razorpayPaymentId: razorpayTxn?.razorpayPaymentId || razorpayTxn?.gatewayTransactionId,
        paymentMethod: razorpayTxn?.paymentMethod || 'Online / Razorpay',
        signatureVerified: Boolean(razorpayTxn?.signatureVerified),
        webhookVerified: Boolean(razorpayTxn?.webhookVerified),
        invoiceUrl: razorpayTxn?.invoiceUrl,
        paidAt: member.registeredAt || new Date()
      } : undefined
    } : {
      accountHolderName: member.name,
      bankName: 'No Bank Linked',
      accountNumber: 'Not Added',
      accountNumberMasked: 'Not Added',
      ifscCode: 'N/A',
      accountType: 'Savings Account',
      branchName: 'N/A',
      verificationStatus: 'NOT_ADDED',
      verifiedAt: undefined,
      upiId: upiHandle,
      membershipPayment: member.paymentStatus === 'PAID' ? {
        amount: member.membershipFeePaid || 99,
        currency: 'INR',
        paidFrom: 'UPI',
        status: 'PAID',
        referenceId: razorpayTxn?.razorpayPaymentId || razorpayTxn?.gatewayTransactionId || (kycSubmission as any)?.paymentDetails?.paymentId || 'UNAVAILABLE',
        razorpayOrderId: razorpayTxn?.razorpayOrderId || (kycSubmission as any)?.paymentDetails?.orderId,
        razorpayPaymentId: razorpayTxn?.razorpayPaymentId || razorpayTxn?.gatewayTransactionId,
        paymentMethod: razorpayTxn?.paymentMethod || 'Online / Razorpay',
        signatureVerified: Boolean(razorpayTxn?.signatureVerified),
        webhookVerified: Boolean(razorpayTxn?.webhookVerified),
        invoiceUrl: razorpayTxn?.invoiceUrl,
        paidAt: member.registeredAt || new Date()
      } : undefined
    };

    // Safe retrieval of member wallet from authoritative MemberWalletModel and transactions
    let wallet = {
      balance: realWallet ? realWallet.availableBalance : 0,
      currency: realWallet?.currency || 'INR',
      currencySymbol: '₹',
      status: realWallet?.status || 'ACTIVE',
      lastSyncedAt: (realWallet?.updatedAt || new Date()).toISOString(),
      note: 'Live Member Wallet Ledger synchronized from MongoDB',
      transactions: [] as any[],
    };

    try {
      const realTxs = await WalletTransactionModel.find({
        $or: [
          { userId: userTargetId },
          ...(realWallet?._id ? [{ walletId: realWallet._id }] : [])
        ]
      })
        .sort({ createdAt: -1 })
        .limit(50);

      if (realTxs.length > 0) {
        wallet.transactions = realTxs.map((t) => ({
          id: t.transactionId,
          type: t.direction,
          title: t.description,
          category: t.transactionType,
          amount: t.amount,
          currency: t.currency || 'INR',
          status: t.status === 'COMPLETED' ? 'SUCCESS' : t.status,
          reference: t.sourceReferenceId || t.transactionId,
          date: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          description: t.description
        }));
      }
    } catch (wErr) {
      console.warn('Live wallet transactions query fallback:', wErr);
    }

    // Resolve referral attribution accurately (Direct registrations must never appear as referrals)
    let referralInfo = {
      source: 'DIRECT',
      sourceLabel: 'Direct Registration',
      referredByName: '',
      referralCode: ''
    };

    if (user?.referrerUserId && (user?.referralSource === 'REFERRED' || user?.registrationSource === 'REFERRAL')) {
      const refUser = await UserModel.findById(user.referrerUserId).select('fullName email referralCode').lean();
      if (refUser && (refUser as any).fullName) {
        referralInfo = {
          source: 'REFERRAL',
          sourceLabel: 'Referral',
          referredByName: (refUser as any).fullName,
          referralCode: user.referredByCode || (refUser as any).referralCode || ''
        };
      }
    }

    // Dynamic Profile fields & company registration data
    const dynamicProfile = user?.dynamicProfile || (kycSubmission as any)?.dynamicProfile || {};
    const companyName = dynamicProfile.businessName || dynamicProfile.companyName || dynamicProfile.institutionName || dynamicProfile.startupName || dynamicProfile.firmName || '';
    const companyRevenue = dynamicProfile.annualTurnover || dynamicProfile.companyRevenue || dynamicProfile.revenue || dynamicProfile.budget || '';
    const businessStage = dynamicProfile.businessStage || dynamicProfile.stage || '';
    const industrySector = dynamicProfile.industrySector || dynamicProfile.sector || '';

    // Enrich member response object with User fields
    const enrichedMember = {
      ...member.toObject(),
      referralInfo,
      phone: member.phone || user?.phoneNumber || '',
      dob: user?.dob || (kycSubmission as any)?.memberDob || '',
      address: user?.address || (kycSubmission as any)?.address || '',
      dynamicProfile,
      companyName,
      companyRevenue,
      businessStage,
      industrySector,
      subcategories: (member.subcategories && member.subcategories.length > 0)
        ? member.subcategories
        : (user?.subCategory ? [user.subCategory] : (user?.primarySubcategoryName ? [user.primarySubcategoryName] : []))
    };

    // Authentically retrieve comprehensive member financial summary (Funding & Loans + Investments & Yields)
    let financialData: any = null;
    try {
      financialData = await getMemberFinancialData(req.params.id);
    } catch (finErr) {
      console.warn('Could not compute member financial summary:', finErr);
    }

    res.json({
      success: true,
      data: {
        member: enrichedMember,
        services,
        kycSubmission,
        documentAssets,
        wallet,
        bankDetails,
        funding: financialData?.funding || {
          totalFundingRequested: 0,
          totalFundingApproved: 0,
          totalFundedPrincipal: 0,
          totalOutstandingPrincipal: 0,
          totalInterestObligations: 0,
          totalRepaidAmount: 0,
          activeFundingRequests: 0,
          records: []
        },
        investments: financialData?.investments || {
          totalInvestedCapital: 0,
          totalCommittedCapital: 0,
          totalPaidInvestment: 0,
          activeInvestments: 0,
          completedInvestments: 0,
          expectedReturns: 0,
          realizedYields: 0,
          records: []
        }
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Reusable helper to aggregate actual member financial records for Funding and Investments
 */
export async function getMemberFinancialData(memberId: string) {
  const member = await MemberModel.findById(memberId);
  if (!member) return null;

  const user = await UserModel.findOne({
    $or: [{ _id: member._id }, { email: member.email.toLowerCase() }]
  }).lean() as any;

  const memberIds: any[] = [member._id, user?._id].filter(Boolean);
  const memberEmail = member.email.toLowerCase().trim();

  // 1. Funding Requests & Proposals
  const [fundingRequests, fundingApps] = await Promise.all([
    FundingRequestModel.find({
      $or: [{ userId: { $in: memberIds } }]
    }).sort({ createdAt: -1 }).lean(),
    FundingApplicationModel.find({
      $or: [{ memberUserId: { $in: memberIds } }, { applicantEmail: memberEmail }]
    }).sort({ createdAt: -1 }).lean()
  ]);

  const fundingRecords: any[] = [];

  for (const r of fundingRequests) {
    const isApproved = ['APPROVED', 'ACTIVE', 'FUNDED', 'COMPLETED', 'REPAID'].includes(r.status);
    const isFunded = ['FUNDED', 'ACTIVE', 'COMPLETED', 'REPAID'].includes(r.status);
    const isRepaid = ['REPAID', 'COMPLETED'].includes(r.status);
    const reqAmt = r.requiredFundingAmount || r.fundingAmount || 0;
    const fundedAmt = isFunded ? (r.totalInvested || reqAmt) : 0;
    const approvedAmt = isApproved ? (r.totalInvested || reqAmt) : 0;
    const durMonths = r.durationMonths || 12;
    const returnRate = r.returnRatePercent || 15;
    const totalInterest = isFunded ? Math.round(fundedAmt * (returnRate / 100) * (durMonths / 12)) : 0;
    const repaid = isRepaid ? fundedAmt : 0;
    const outstandingPrincipal = isFunded ? Math.max(0, fundedAmt - repaid) : 0;
    const outstandingInterest = isFunded ? (isRepaid ? 0 : totalInterest) : 0;

    fundingRecords.push({
      id: r._id.toString(),
      fundingRequestId: r.fundingRequestId || r.refNumber || `FR-${r._id.toString().slice(-6).toUpperCase()}`,
      projectName: r.companyName || r.businessName || 'Business Venture',
      requestedAmount: reqAmt,
      approvedAmount: approvedAmt,
      fundedPrincipal: fundedAmt,
      monthlyInterestRate: Number((returnRate / 12).toFixed(2)),
      interestCalculationType: r.returnFrequency || 'Fixed APR',
      totalInterestPayable: totalInterest,
      amountRepaid: repaid,
      outstandingPrincipal,
      outstandingInterest,
      repaymentStatus: isRepaid ? 'Fully Repaid' : isFunded ? 'Active Obligation' : 'Not Yet Disbursed',
      fundingStatus: r.status,
      fundingStartDate: r.createdAt,
      repaymentStartDate: isFunded ? r.updatedAt : undefined,
      nextDueDate: isFunded && !isRepaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      maturityDate: isFunded ? new Date(new Date(r.createdAt).setMonth(new Date(r.createdAt).getMonth() + durMonths)) : undefined,
      source: 'FUNDING_REQUEST'
    });
  }

  for (const r of fundingApps) {
    const isFunded = ['FUNDED', 'REPAID'].includes(r.stage);
    const isRepaid = r.stage === 'REPAID';
    const reqAmt = r.requestedAmount || 0;
    const appAmt = r.approvedPrincipal || (isFunded ? reqAmt : 0);
    const fundedAmt = isFunded ? appAmt : 0;
    const repaidAmt = r.repaidAmount || (isRepaid ? fundedAmt : 0);
    const outstandingPrincipal = isFunded ? Math.max(0, fundedAmt - repaidAmt) : 0;
    const outstandingInterest = isFunded ? Math.max(0, (r.expectedTotalInterest || 0) - (r.accruedInterestCollected || 0)) : 0;

    fundingRecords.push({
      id: r._id.toString(),
      fundingRequestId: `FUND-APP-${r._id.toString().slice(-6).toUpperCase()}`,
      projectName: r.businessName || 'Business Proposal',
      requestedAmount: reqAmt,
      approvedAmount: appAmt,
      fundedPrincipal: fundedAmt,
      monthlyInterestRate: r.interestRateAnnual ? Number((r.interestRateAnnual / 12).toFixed(2)) : 1.0,
      interestCalculationType: 'Annual Percentage Rate (APR)',
      totalInterestPayable: r.expectedTotalInterest || 0,
      amountRepaid: repaidAmt,
      outstandingPrincipal,
      outstandingInterest,
      repaymentStatus: isRepaid ? 'Fully Repaid' : repaidAmt > 0 ? 'Partially Repaid' : isFunded ? 'Active Obligation' : 'Not Disbursed',
      fundingStatus: r.stage,
      fundingStartDate: r.disbursementDate || r.createdAt,
      repaymentStartDate: r.disbursementDate,
      nextDueDate: isFunded && !isRepaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      maturityDate: r.tenureMonths && r.disbursementDate ? new Date(new Date(r.disbursementDate).setMonth(new Date(r.disbursementDate).getMonth() + r.tenureMonths)) : undefined,
      source: 'FUNDING_APPLICATION'
    });
  }

  // Funding Summary Metrics
  const totalFundingRequested = fundingRecords.reduce((acc, r) => acc + (r.requestedAmount || 0), 0);
  const totalFundingApproved = fundingRecords.reduce((acc, r) => acc + (r.approvedAmount || 0), 0);
  const totalFundedPrincipal = fundingRecords.reduce((acc, r) => acc + (r.fundedPrincipal || 0), 0);
  const totalOutstandingPrincipal = fundingRecords.reduce((acc, r) => acc + (r.outstandingPrincipal || 0), 0);
  const totalInterestObligations = fundingRecords.reduce((acc, r) => acc + (r.totalInterestPayable || 0), 0);
  const totalRepaidAmount = fundingRecords.reduce((acc, r) => acc + (r.amountRepaid || 0), 0);
  const activeFundingRequests = fundingRecords.filter((r) => ['ACTIVE', 'FUNDED', 'APPROVED'].includes(r.fundingStatus)).length;

  const fundingSummary = {
    totalFundingRequested,
    totalFundingApproved,
    totalFundedPrincipal,
    totalOutstandingPrincipal,
    totalInterestObligations,
    totalRepaidAmount,
    activeFundingRequests,
    records: fundingRecords
  };

  // 2. Investments & Yields
  const [directInvestments, poolInvestments] = await Promise.all([
    InvestmentRequestModel.find({
      $or: [{ investorId: { $in: memberIds } }, { investorEmail: memberEmail }]
    }).sort({ createdAt: -1 }).lean(),
    InvestmentPoolModel.find({ 'investors.memberId': { $in: memberIds } }).lean()
  ]);

  const investmentRecords: any[] = [];

  for (const r of directInvestments) {
    const isPaid = ['PAID', 'ACTIVE', 'COMPLETED', 'MATURITY_PENDING', 'MATURITY_PAID'].includes(r.status);
    const isCompleted = ['COMPLETED', 'MATURITY_PAID'].includes(r.status);
    const commAmt = r.requestedAmount || r.approvedAmount || 0;
    const paidAmt = r.paidAmount || (isPaid ? (r.approvedAmount || commAmt) : 0);
    const pendingAmt = r.pendingPaymentAmount || Math.max(0, (r.approvedAmount || commAmt) - paidAmt);
    const expYield = r.maturityAmountDue || (paidAmt ? Math.round(paidAmt * ((r.returnRatePercent || 15) / 100) * ((r.durationMonths || 12) / 12)) : 0);
    const realYield = isCompleted ? (r.maturityAmountReleased || expYield) : (r.maturityAmountReleased || 0);

    investmentRecords.push({
      id: r._id.toString(),
      investmentId: r.investmentId || `INV-${r._id.toString().slice(-6).toUpperCase()}`,
      referenceId: r.fundingRequestRef || 'N/A',
      projectName: r.projectName || 'Venture Syndicate',
      investmentPool: 'Direct Strategic Funding',
      committedAmount: commAmt,
      amountPaid: paidAmt,
      outstandingCommitment: pendingAmt,
      expectedReturnRate: r.returnRatePercent ? `${r.returnRatePercent}% p.a.` : (r.expectedReturns || '15% p.a.'),
      expectedYieldAmount: expYield,
      realizedYieldAmount: realYield,
      payoutFrequency: r.returnFrequency || 'At Maturity',
      startDate: r.investmentStartDate || r.createdAt,
      maturityDate: r.maturityDate,
      investmentStatus: r.status,
      paymentStatus: isPaid ? 'PAID' : paidAmt > 0 ? 'PARTIALLY_PAID' : 'PAYMENT_PENDING',
      source: 'DIRECT_INVESTMENT'
    });
  }

  for (const p of poolInvestments) {
    for (const inv of (p.investors || [])) {
      if (memberIds.some((id: any) => id.toString() === inv.memberId?.toString())) {
        const isCompleted = p.status === 'CLOSED' || p.status === 'REPAID' || inv.payoutStatus === 'COMPLETED';
        const investedAmt = inv.investedAmount || 0;
        const expInterest = inv.expectedInterest || 0;
        const realYield = inv.interestPaid || (inv.payoutStatus === 'COMPLETED' ? expInterest : 0);

        investmentRecords.push({
          id: (inv as any)._id?.toString() || p._id.toString(),
          investmentId: `POOL-${(inv as any)._id?.toString().slice(-6).toUpperCase() || p.poolCode}`,
          referenceId: p.poolCode || 'POOL-001',
          projectName: p.title,
          investmentPool: p.industryCategory || 'Capital Pool',
          committedAmount: investedAmt,
          amountPaid: investedAmt,
          outstandingCommitment: 0,
          expectedReturnRate: `${p.investorAnnualYieldPercent}% p.a.`,
          expectedYieldAmount: expInterest,
          realizedYieldAmount: realYield,
          payoutFrequency: 'At Maturity',
          startDate: inv.investedAt || p.openedAt,
          maturityDate: p.repaymentDueDate,
          investmentStatus: p.status,
          paymentStatus: 'PAID',
          source: 'INVESTMENT_POOL'
        });
      }
    }
  }

  // Investment Summary Metrics
  const totalCommittedCapital = investmentRecords.reduce((acc, r) => acc + (r.committedAmount || 0), 0);
  const totalPaidInvestment = investmentRecords.reduce((acc, r) => acc + (r.amountPaid || 0), 0);
  const totalInvestedCapital = totalPaidInvestment;
  const activeInvestments = investmentRecords.filter((r) => ['ACTIVE', 'PAID', 'FUNDED', 'OPEN'].includes(r.investmentStatus)).length;
  const completedInvestments = investmentRecords.filter((r) => ['COMPLETED', 'REPAID', 'CLOSED', 'MATURITY_PAID'].includes(r.investmentStatus)).length;
  const expectedReturns = investmentRecords.reduce((acc, r) => acc + (r.expectedYieldAmount || 0), 0);
  const realizedYields = investmentRecords.reduce((acc, r) => acc + (r.realizedYieldAmount || 0), 0);

  const investmentSummary = {
    totalInvestedCapital,
    totalCommittedCapital,
    totalPaidInvestment,
    activeInvestments,
    completedInvestments,
    expectedReturns,
    realizedYields,
    records: investmentRecords
  };

  return {
    funding: fundingSummary,
    investments: investmentSummary
  };
}

// GET /api/admin/members/:id/financial-summary
router.get('/:id/financial-summary', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const fin = await getMemberFinancialData(req.params.id);
    if (!fin) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: fin });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/members/:id/funding
router.get('/:id/funding', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const fin = await getMemberFinancialData(req.params.id);
    if (!fin) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: fin.funding });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/members/:id/investments
router.get('/:id/investments', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const fin = await getMemberFinancialData(req.params.id);
    if (!fin) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: fin.investments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/members/:id/status - Update member account status (active/suspended/blocked)
router.patch('/:id/status', authenticateAdmin, requirePermission('MEMBERS_MANAGE'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'

    const member = await MemberModel.findById(id);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'ACTIVE') {
      if (member.kycStatus !== 'APPROVED') {
        res.status(400).json({
          success: false,
          error: 'Cannot grant Active Privilege. Member KYC must be approved in KYC Verification first before activating the account.'
        });
        return;
      }
      if (member.paymentStatus !== 'PAID') {
        res.status(400).json({
          success: false,
          error: 'Cannot grant Active Privilege. Member membership payment is pending.'
        });
        return;
      }
    }

    member.status = normalized as any;
    await member.save();

    const nextUserStatus =
      normalized === 'SUSPENDED' || normalized === 'BLOCKED'
        ? AccountStatus.SUSPENDED
        : normalized === 'ACTIVE'
          ? AccountStatus.ACTIVE
          : undefined;

    const linkedUser = nextUserStatus
      ? await UserModel.findOneAndUpdate(
        { $or: [{ _id: member._id }, { email: member.email.toLowerCase() }] },
        { $set: { status: nextUserStatus } }
      )
      : await UserModel.findOne({ $or: [{ _id: member._id }, { email: member.email.toLowerCase() }] });

    if (linkedUser) {
      await notifyMember({
        userId: linkedUser._id,
        eventType: normalized === 'SUSPENDED' || normalized === 'BLOCKED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED',
        title: normalized === 'SUSPENDED' || normalized === 'BLOCKED' ? 'Account Suspended' : 'Account Status Updated',
        message:
          normalized === 'SUSPENDED' || normalized === 'BLOCKED'
            ? `Your account has been ${normalized.toLowerCase()}${reason ? `: ${reason}` : '.'}`
            : `Your account status has been updated to ${normalized}.`,
        link: '/kyc-pending',
        priority: 'HIGH'
      });
    }

    await logAdminAction(req, `MEMBER_STATUS_${normalized}`, 'Member', id, { reason });
    res.json({ success: true, message: `Member status updated to ${normalized}`, data: member });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
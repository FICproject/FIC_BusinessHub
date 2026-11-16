import { Router, Response } from 'express';
import mongoose from 'mongoose';
import {
  authenticateAdmin,
  requireRole,
  AuthenticatedAdminRequest,
  logAdminAction
} from '../middleware/admin-auth.middleware';
import {
  FundingRequestModel,
  InvestmentRequestModel,
  FinancialTransactionModel,
  ReceivingBankAccountModel,
  ensureReceivingBankAccount
} from '../../investment/investment.model';
import { FundingApplicationModel } from '../models/FundingApplication';
import { InvestmentPoolModel } from '../models/InvestmentPool';
import { MeetingModel } from '../models/Meeting';
import { MemberModel } from '../models/Member';
import { AdminMemberWalletModel, IMemberWallet } from '../models/MemberWallet';
import { UserModel } from '../../users/users.model';
import { notifyMember } from '../../notifications/notifications.service';

const router = Router();

// Helper to get or create member wallet
export const getOrCreateMemberWallet = async (
  memberId: mongoose.Types.ObjectId | string,
  memberEmail: string,
  _memberName?: string
): Promise<IMemberWallet> => {
  let wallet = await AdminMemberWalletModel.findOne({
    $or: [{ memberId }, { memberEmail: memberEmail.toLowerCase() }]
  });

  if (!wallet) {
    wallet = await AdminMemberWalletModel.create({
      memberId: new mongoose.Types.ObjectId(memberId.toString()),
      memberEmail: memberEmail.toLowerCase(),
      balance: 0,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'ACTIVE',
      lastSyncedAt: new Date(),
      transactions: []
    });
  }

  return wallet;
};

// ========================================================
// PHASE 2: FIC ADMIN FUNDING DESK (FUNDING REQUESTS)
// ========================================================

// 2.1: Funding Request Listing (with search, filter, pagination)
router.get('/requests', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20', sort = '-createdAt' } = req.query;

    const filter: any = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { fundingRequestId: { $regex: q, $options: 'i' } },
        { refNumber: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      FundingRequestModel.find(filter)
        .populate('userId', 'fullName email phoneNumber primaryCategoryName')
        .sort(String(sort))
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FundingRequestModel.countDocuments(filter)
    ]);

    // Format items with submitter info
    const formatted = items.map((item: any) => {
      const user = item.userId as any;
      return {
        ...item,
        requestorName: user?.fullName || 'FIC Member',
        requestorEmail: user?.email || '',
        requestorPhone: user?.phoneNumber || '+91 Verified Member'
      };
    });

    res.json({
      success: true,
      items: formatted,
      data: formatted,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (err: any) {
    console.error('Failed to get funding requests:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch funding requests', details: err.message });
  }
});

// 2.2: Single Funding Request Detail Review
router.get('/requests/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request = await FundingRequestModel.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : null },
        { fundingRequestId: id },
        { refNumber: id }
      ]
    })
      .populate('userId', 'fullName email phoneNumber primaryCategoryName')
      .lean();

    if (!request) {
      res.status(404).json({ success: false, error: 'Funding request not found' });
      return;
    }

    const user = (request as any).userId;
    res.json({
      success: true,
      data: {
        ...request,
        requestorName: user?.fullName || 'FIC Member',
        requestorEmail: user?.email || '',
        requestorPhone: user?.phoneNumber || '+91 Verified Member'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.2: Admin Requests Changes (with optional + Add Document dynamic requirements)
router.put(
  '/requests/:id/request-changes',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { message, requestedDocuments } = req.body;

      if (!message || !String(message).trim()) {
        res.status(400).json({ success: false, error: 'A clear change request message is required.' });
        return;
      }

      const request = await FundingRequestModel.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : null },
          { fundingRequestId: id },
          { refNumber: id }
        ]
      });

      if (!request) {
        res.status(404).json({ success: false, error: 'Funding request not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const parsedReqDocs = Array.isArray(requestedDocuments)
        ? requestedDocuments.map((d: any, index: number) => ({
            id: d.id || `REQ-DOC-${Date.now()}-${index}`,
            name: String(d.name || '').trim(),
            instructions: String(d.instructions || '').trim(),
            isUploaded: false
          })).filter((d: any) => d.name && d.instructions)
        : [];

      request.changeRequests = request.changeRequests || [];
      request.changeRequests.push({
        date: new Date(),
        requestedBy: adminName,
        message: String(message).trim(),
        requestedDocuments: parsedReqDocs,
        isResolved: false
      });

      request.status = 'CHANGES_REQUESTED';
      request.latestFicUpdate = `Changes requested by ${adminName}: ${message}`;
      request.whatHappensNext = 'Please review the requested changes and upload any specified documents.';

      request.activityTimeline.push({
        action: 'Changes Requested by Admin',
        actorType: 'ADMIN',
        actorName: adminName,
        notes: String(message).trim(),
        timestamp: new Date()
      });

      await request.save();

      // Log action
      await logAdminAction(req, 'UPDATE', 'FundingRequest', request._id.toString(), {
        action: 'CHANGES_REQUESTED',
        message,
        requestedDocumentsCount: parsedReqDocs.length
      });

      // Notify Member
      try {
        await notifyMember({
          userId: request.userId,
          eventType: 'FUNDING_CHANGES_REQUESTED',
          title: `Action Required: Funding Proposal Revisions`,
          message: `FIC Admin requested revisions for "${request.companyName}". Please review the instructions and resubmit.`,
          link: '/investment',
          priority: 'HIGH'
        });
      } catch {}

      res.json({
        success: true,
        message: 'Change request submitted and member notified successfully.',
        data: request
      });
    } catch (err: any) {
      console.error('Failed to request changes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 2.3: Admin Approves Funding Request (Makes it eligible for Need Funding tab)
router.put(
  '/requests/:id/approve',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { approvalNotes } = req.body;

      const request = await FundingRequestModel.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : null },
          { fundingRequestId: id },
          { refNumber: id }
        ]
      });

      if (!request) {
        res.status(404).json({ success: false, error: 'Funding request not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Super Admin';
      const adminId = (req.admin as any)?.adminId || req.admin?.id || 'SYSTEM';

      request.status = 'APPROVED';
      request.approvedBy = adminName;
      request.approvedAdminId = adminId;
      request.approvedAt = new Date();
      if (approvalNotes) request.approvalNotes = String(approvalNotes).trim();

      request.latestFicUpdate = `Proposal approved by FIC Admin. It is now published live on the Need Funding investor network.`;
      request.whatHappensNext = 'Investors across the FIC network can now review your proposal and submit investment commitments.';

      request.activityTimeline.push({
        action: 'Proposal Approved by FIC Admin',
        actorType: 'ADMIN',
        actorName: adminName,
        notes: approvalNotes || 'Application approved for investor commitments.',
        timestamp: new Date()
      });

      await request.save();

      // Sync FundingApplication
      try {
        await FundingApplicationModel.findOneAndUpdate(
          { fundingRequestId: request._id },
          { stage: 'REVIEW' }
        );
      } catch {}

      // Log action
      await logAdminAction(req, 'UPDATE', 'FundingRequest', request._id.toString(), {
        action: 'APPROVED',
        approvedBy: adminName,
        approvedAt: new Date()
      });

      // Notify Member
      try {
        await notifyMember({
          userId: request.userId,
          eventType: 'FUNDING_APPROVED',
          title: `Proposal Approved: ${request.companyName}`,
          message: `Congratulations! Your funding request for ₹${request.requiredFundingAmount?.toLocaleString('en-IN')} has been approved and published to the FIC Investor Network.`,
          link: '/investment',
          priority: 'HIGH'
        });
      } catch {}

      res.json({
        success: true,
        message: 'Funding proposal approved successfully! It is now live in the Need Funding section for investors.',
        data: request
      });
    } catch (err: any) {
      console.error('Failed to approve funding request:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PHASE 5: FIC ADMIN INVESTMENT REQUESTS
// ========================================================

// 5.1: List Investment Requests
router.get(
  '/investment-requests',
  authenticateAdmin,
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { status, search, page = '1', limit = '20' } = req.query;

      const filter: any = {};
      if (status && status !== 'ALL') {
        filter.status = status;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        filter.$or = [
          { investmentId: { $regex: q, $options: 'i' } },
          { fundingRequestRef: { $regex: q, $options: 'i' } },
          { projectName: { $regex: q, $options: 'i' } },
          { investorName: { $regex: q, $options: 'i' } },
          { fundingRequestorName: { $regex: q, $options: 'i' } }
        ];
      }

      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        InvestmentRequestModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        InvestmentRequestModel.countDocuments(filter)
      ]);

      res.json({
        success: true,
        items,
        data: items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1
      });
    } catch (err: any) {
      console.error('Failed to get investment requests:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 5.2: Admin Review Action (Approve, Request Changes, Reject)
router.put(
  '/investment-requests/:id/review',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, approvedAmount, notes, rejectionReason } = req.body;

      const investment = await InvestmentRequestModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { investmentId: id }]
      });

      if (!investment) {
        res.status(404).json({ success: false, error: 'Investment request not found' });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';

      if (action === 'APPROVE') {
        const resolvedApprovedAmount = Number(approvedAmount) || investment.requestedAmount;
        investment.status = 'APPROVED';
        investment.approvedAmount = resolvedApprovedAmount;
        investment.pendingPaymentAmount = resolvedApprovedAmount;
        investment.approvedBy = adminName;
        investment.approvedAt = new Date();
        if (notes) investment.adminNotes = String(notes).trim();

        investment.activityTimeline.push({
          action: 'Investment Approved by Admin',
          actorType: 'ADMIN',
          actorName: adminName,
          notes: `Approved for ₹${resolvedApprovedAmount.toLocaleString('en-IN')}. Payment is now enabled for the investor.`,
          timestamp: new Date()
        });

        await investment.save();

        // Notify Investor to pay
        try {
          await notifyMember({
            userId: investment.investorId,
            eventType: 'INVESTMENT_APPROVED',
            title: `Investment Approved: Pay Amount`,
            message: `Your investment proposal for "${investment.projectName}" was approved for ₹${resolvedApprovedAmount.toLocaleString('en-IN')}. Please proceed to Pay Amount in My Investments.`,
            link: '/investment',
            priority: 'HIGH'
          });
        } catch {}

        await logAdminAction(req, 'UPDATE', 'InvestmentRequest', investment._id.toString(), {
          action: 'APPROVE',
          approvedAmount: resolvedApprovedAmount
        });

        res.json({
          success: true,
          message: `Investment request approved for ₹${resolvedApprovedAmount.toLocaleString('en-IN')}! Investor can now pay amount.`,
          data: investment
        });
        return;
      }

      if (action === 'REQUEST_CHANGES') {
        if (!notes || !String(notes).trim()) {
          res.status(400).json({ success: false, error: 'Change request notes are required.' });
          return;
        }

        investment.status = 'CHANGES_REQUESTED';
        investment.changeRequestNotes = String(notes).trim();

        investment.activityTimeline.push({
          action: 'Changes Requested by Admin',
          actorType: 'ADMIN',
          actorName: adminName,
          notes: String(notes).trim(),
          timestamp: new Date()
        });

        await investment.save();

        try {
          await notifyMember({
            userId: investment.investorId,
            eventType: 'INVESTMENT_CHANGES_REQUESTED',
            title: `Changes Requested on Investment`,
            message: `FIC Admin requested changes on your investment for "${investment.projectName}": ${notes}`,
            link: '/investment',
            priority: 'HIGH'
          });
        } catch {}

        res.json({
          success: true,
          message: 'Change request sent to investor.',
          data: investment
        });
        return;
      }

      if (action === 'REJECT') {
        if (!rejectionReason || !String(rejectionReason).trim()) {
          res.status(400).json({ success: false, error: 'A rejection reason is required.' });
          return;
        }

        investment.status = 'REJECTED';
        investment.rejectionReason = String(rejectionReason).trim();

        investment.activityTimeline.push({
          action: 'Investment Rejected by Admin',
          actorType: 'ADMIN',
          actorName: adminName,
          notes: String(rejectionReason).trim(),
          timestamp: new Date()
        });

        await investment.save();

        try {
          await notifyMember({
            userId: investment.investorId,
            eventType: 'INVESTMENT_REJECTED',
            title: `Investment Proposal Declined`,
            message: `Your investment proposal for "${investment.projectName}" was declined: ${rejectionReason}`,
            link: '/investment',
            priority: 'LOW'
          });
        } catch {}

        res.json({
          success: true,
          message: 'Investment request rejected.',
          data: investment
        });
        return;
      }

      res.status(400).json({ success: false, error: 'Invalid review action. Allowed: APPROVE, REQUEST_CHANGES, REJECT' });
    } catch (err: any) {
      console.error('Failed to review investment request:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PHASE 7: FUND RELEASE TO FUNDING REQUESTOR
// ========================================================

// 7.1: Fund Release Listing (Investments where investor paid)
router.get(
  '/fund-releases',
  authenticateAdmin,
  async (_req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const paidInvestments = await InvestmentRequestModel.find({
        status: { $in: ['PAID', 'PARTIALLY_PAID', 'FUND_RELEASE_PENDING', 'ACTIVE'] }
      })
        .sort({ updatedAt: -1 })
        .lean();

      res.json({
        success: true,
        data: paidInvestments,
        items: paidInvestments
      });
    } catch (err: any) {
      console.error('Failed to get fund releases:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 7.2: Disburse Amount to Funding Requestor
router.post(
  '/fund-releases/:id/disburse',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { disburseAmount, payoutReference, notes } = req.body;

      const investment = await InvestmentRequestModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { investmentId: id }]
      });

      if (!investment) {
        res.status(404).json({ success: false, error: 'Investment record not found' });
        return;
      }

      const eligibleAmount = investment.pendingReleaseAmount || investment.eligibleReleaseAmount || investment.paidAmount;
      const amountToRelease = Number(disburseAmount) || eligibleAmount;

      if (amountToRelease <= 0) {
        res.status(400).json({ success: false, error: 'Disbursement amount must be greater than 0.' });
        return;
      }

      if (amountToRelease > eligibleAmount) {
        res.status(400).json({
          success: false,
          error: `Disbursement amount cannot exceed the pending eligible balance of ₹${eligibleAmount.toLocaleString('en-IN')}.`
        });
        return;
      }

      const adminName = req.admin?.name || 'FIC Admin';
      const generatedTxnId = `TXN-REL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Create FinancialTransaction record
      await FinancialTransactionModel.create({
        transactionId: generatedTxnId,
        type: 'FUND_RELEASE',
        investmentId: investment.investmentId,
        fundingRequestId: investment.fundingRequestRef,
        payerId: 'FIC_PLATFORM',
        payerName: 'FIC Platform Escrow',
        receiverId: investment.fundingRequestorId.toString(),
        receiverName: investment.fundingRequestorName,
        amount: amountToRelease,
        currency: 'INR',
        paymentGateway: 'BANK_TRANSFER',
        gatewayPaymentId: payoutReference || `PAYOUT-${Date.now()}`,
        status: 'SUCCESS',
        verifiedAt: new Date(),
        notes: notes || `Capital disbursed to ${investment.fundingRequestorName} for ${investment.projectName} (${investment.investmentId}).`
      });

      // 2. Update balances & status
      investment.releasedAmount = (investment.releasedAmount || 0) + amountToRelease;
      investment.pendingReleaseAmount = Math.max(0, eligibleAmount - amountToRelease);
      investment.disbursedAt = new Date();
      investment.disbursedBy = adminName;
      investment.disbursementTxnId = generatedTxnId;

      investment.status = 'ACTIVE';
      investment.investmentStartDate = new Date();

      // Calculate Maturity Date based on durationMonths
      const tenure = investment.durationMonths || 12;
      const matDate = new Date();
      matDate.setMonth(matDate.getMonth() + tenure);
      investment.maturityDate = matDate;

      investment.activityTimeline.push({
        action: 'Capital Disbursed to Company',
        actorType: 'ADMIN',
        actorName: adminName,
        notes: `Disbursed ₹${amountToRelease.toLocaleString('en-IN')} to company. Investment is now ACTIVE. Maturity: ${matDate.toLocaleDateString('en-GB')}.`,
        timestamp: new Date()
      });

      await investment.save();

      // Log action
      await logAdminAction(req, 'UPDATE', 'InvestmentRequest', investment._id.toString(), {
        action: 'FUND_RELEASE_DISBURSE',
        amount: amountToRelease,
        txnId: generatedTxnId
      });

      // Notify Funding Requestor & Investor
      try {
        await notifyMember({
          userId: investment.fundingRequestorId,
          eventType: 'FUNDS_DISBURSED',
          title: `Capital Disbursed: ₹${amountToRelease.toLocaleString('en-IN')}`,
          message: `FIC has disbursed ₹${amountToRelease.toLocaleString('en-IN')} for "${investment.projectName}". Investment is now active.`,
          link: '/investment',
          priority: 'HIGH'
        });

        await notifyMember({
          userId: investment.investorId,
          eventType: 'INVESTMENT_ACTIVE',
          title: `Investment Active: ${investment.projectName}`,
          message: `Your investment in "${investment.projectName}" has been deployed and is now ACTIVE. Yield tracking has begun.`,
          link: '/investment',
          priority: 'HIGH'
        });
      } catch {}

      res.json({
        success: true,
        message: `₹${amountToRelease.toLocaleString('en-IN')} disbursed successfully to ${investment.fundingRequestorName}!`,
        data: investment
      });
    } catch (err: any) {
      console.error('Failed to disburse funds:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PHASE 8: RETURNS & MATURITY SCHEDULE
// ========================================================
router.get(
  '/returns-maturity',
  authenticateAdmin,
  async (_req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const investments = await InvestmentRequestModel.find({
        status: { $in: ['ACTIVE', 'MATURITY_PENDING', 'MATURITY_PAYMENT_RECEIVED', 'MATURITY_PAID', 'COMPLETED'] }
      })
        .sort({ maturityDate: 1 })
        .lean();

      res.json({
        success: true,
        data: investments,
        items: investments
      });
    } catch (err: any) {
      console.error('Failed to get returns & maturity schedule:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PHASE 10: FIC ADMIN MATURITY RELEASE
// ========================================================

// 10.1: Maturity Release Listing (Investments where funding requestor repaid maturity)
router.get(
  '/maturity-releases',
  authenticateAdmin,
  async (_req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const items = await InvestmentRequestModel.find({
        status: { $in: ['MATURITY_PAYMENT_RECEIVED', 'MATURITY_PAID', 'COMPLETED'] }
      })
        .sort({ maturityReceivedAt: -1 })
        .lean();

      res.json({
        success: true,
        data: items,
        items
      });
    } catch (err: any) {
      console.error('Failed to get maturity releases:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 10.2: Release Maturity to Investor
router.post(
  '/maturity-releases/:id/release',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { releaseAmount, payoutReference, notes } = req.body;

      const investment = await InvestmentRequestModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { investmentId: id }]
      });

      if (!investment) {
        res.status(404).json({ success: false, error: 'Investment record not found' });
        return;
      }

      const receivedMaturity = investment.maturityAmountReceived || investment.maturityAmountDue;
      const amountToRelease = Number(releaseAmount) || receivedMaturity;

      const adminName = req.admin?.name || 'FIC Super Admin';
      const generatedTxnId = `TXN-MAT-REL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Record FinancialTransaction
      await FinancialTransactionModel.create({
        transactionId: generatedTxnId,
        type: 'MATURITY_RELEASE',
        investmentId: investment.investmentId,
        fundingRequestId: investment.fundingRequestRef,
        payerId: 'FIC_PLATFORM',
        payerName: 'FIC Platform Escrow',
        receiverId: investment.investorId.toString(),
        receiverName: investment.investorName,
        amount: amountToRelease,
        currency: 'INR',
        paymentGateway: 'BANK_TRANSFER',
        gatewayPaymentId: payoutReference || `PAYOUT-MAT-${Date.now()}`,
        status: 'SUCCESS',
        verifiedAt: new Date(),
        notes: notes || `Maturity return of ₹${amountToRelease.toLocaleString('en-IN')} paid out to investor ${investment.investorName}.`
      });

      // 2. Mark Investment COMPLETED
      investment.maturityAmountReleased = (investment.maturityAmountReleased || 0) + amountToRelease;
      investment.maturityReleasedAt = new Date();
      investment.maturityReleaseTxnId = generatedTxnId;
      investment.status = 'COMPLETED';

      investment.activityTimeline.push({
        action: 'Maturity Capital Released to Investor',
        actorType: 'ADMIN',
        actorName: adminName,
        notes: `Maturity payout of ₹${amountToRelease.toLocaleString('en-IN')} sent to investor. Cycle COMPLETED.`,
        timestamp: new Date()
      });

      await investment.save();

      // Log action
      await logAdminAction(req, 'UPDATE', 'InvestmentRequest', investment._id.toString(), {
        action: 'MATURITY_RELEASE',
        amount: amountToRelease,
        txnId: generatedTxnId
      });

      // Notify Investor & Requestor
      try {
        await notifyMember({
          userId: investment.investorId,
          eventType: 'MATURITY_RELEASED_TO_INVESTOR',
          title: `Maturity Payout Completed: ₹${amountToRelease.toLocaleString('en-IN')}`,
          message: `Your maturity payout of ₹${amountToRelease.toLocaleString('en-IN')} for "${investment.projectName}" has been transferred to your verified account!`,
          link: '/investment',
          priority: 'HIGH'
        });

        await notifyMember({
          userId: investment.fundingRequestorId,
          eventType: 'INVESTMENT_CYCLE_COMPLETED',
          title: `Investment Cycle Completed: ${investment.projectName}`,
          message: `Maturity settlement has been disbursed to the investor. This investment cycle is now fully completed.`,
          link: '/investment',
          priority: 'MEDIUM'
        });
      } catch {}

      res.json({
        success: true,
        message: `Maturity funds of ₹${amountToRelease.toLocaleString('en-IN')} successfully released to ${investment.investorName}!`,
        data: investment
      });
    } catch (err: any) {
      console.error('Failed to release maturity funds:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PHASE 12: CENTRALIZED FINANCIAL TRANSACTIONS LEDGER
// ========================================================
router.get(
  '/transactions',
  authenticateAdmin,
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { type, status, search, page = '1', limit = '30' } = req.query;

      const filter: any = {};
      if (type && type !== 'ALL') {
        filter.type = type;
      }
      if (status && status !== 'ALL') {
        filter.status = status;
      }
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        filter.$or = [
          { transactionId: { $regex: q, $options: 'i' } },
          { investmentId: { $regex: q, $options: 'i' } },
          { fundingRequestId: { $regex: q, $options: 'i' } },
          { payerName: { $regex: q, $options: 'i' } },
          { receiverName: { $regex: q, $options: 'i' } },
          { gatewayPaymentId: { $regex: q, $options: 'i' } }
        ];
      }

      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 30));
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        FinancialTransactionModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        FinancialTransactionModel.countDocuments(filter)
      ]);

      res.json({
        success: true,
        items,
        data: items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1
      });
    } catch (err: any) {
      console.error('Failed to get transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PHASE 6.2: FIC RECEIVING BANK ACCOUNT CONFIGURATION
// ========================================================
router.get(
  '/receiving-bank',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (_req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const bankConfig = await ensureReceivingBankAccount();
      res.json({
        success: true,
        data: {
          accountHolderName: bankConfig.accountHolderName,
          bankName: bankConfig.bankName,
          accountNumberMasked: bankConfig.accountNumberMasked,
          ifscCode: bankConfig.ifscCode,
          branchName: bankConfig.branchName,
          status: bankConfig.status,
          updatedByAdminName: bankConfig.updatedByAdminName,
          updatedAt: bankConfig.updatedAt,
          auditHistory: bankConfig.auditHistory
        }
      });
    } catch (err: any) {
      console.error('Failed to get receiving bank config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put(
  '/receiving-bank',
  authenticateAdmin,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const {
        accountHolderName,
        bankName,
        accountNumber,
        confirmAccountNumber,
        ifscCode,
        branchName,
        status
      } = req.body;

      if (!accountHolderName || !String(accountHolderName).trim()) {
        res.status(400).json({ success: false, error: 'Account Holder Name is required.' });
        return;
      }
      if (!bankName || !String(bankName).trim()) {
        res.status(400).json({ success: false, error: 'Bank Name is required.' });
        return;
      }
      if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
        res.status(400).json({ success: false, error: 'Account Number and Confirm Account Number must match.' });
        return;
      }
      if (!ifscCode || !String(ifscCode).trim()) {
        res.status(400).json({ success: false, error: 'IFSC Code is required.' });
        return;
      }

      const bankConfig = await ensureReceivingBankAccount();
      const adminName = req.admin?.name || 'FIC Super Admin';
      const adminId = (req.admin as any)?.adminId || req.admin?.id || 'ADMIN';

      bankConfig.accountHolderName = String(accountHolderName).trim();
      bankConfig.bankName = String(bankName).trim();
      bankConfig.ifscCode = String(ifscCode).trim().toUpperCase();
      if (branchName) bankConfig.branchName = String(branchName).trim();
      if (status) bankConfig.status = status;

      if (accountNumber && String(accountNumber).trim()) {
        const cleanAcc = String(accountNumber).trim();
        bankConfig.accountNumber = cleanAcc;
        const last4 = cleanAcc.slice(-4);
        bankConfig.accountNumberMasked = `•••• •••• ${last4}`;
      }

      bankConfig.updatedByAdminId = adminId;
      bankConfig.updatedByAdminName = adminName;
      bankConfig.auditHistory = bankConfig.auditHistory || [];
      bankConfig.auditHistory.push({
        updatedBy: adminName,
        timestamp: new Date(),
        changes: `Receiving bank account updated: ${bankConfig.bankName} (${bankConfig.accountNumberMasked}), IFSC: ${bankConfig.ifscCode}.`
      });

      await bankConfig.save();

      // Log in audit log
      await logAdminAction(req, 'UPDATE', 'ReceivingBankAccount', bankConfig._id.toString(), {
        action: 'UPDATE_RECEIVING_BANK',
        bankName: bankConfig.bankName,
        maskedAccount: bankConfig.accountNumberMasked
      });

      res.json({
        success: true,
        message: 'FIC Receiving Bank Account configuration updated successfully.',
        data: {
          accountHolderName: bankConfig.accountHolderName,
          bankName: bankConfig.bankName,
          accountNumberMasked: bankConfig.accountNumberMasked,
          ifscCode: bankConfig.ifscCode,
          branchName: bankConfig.branchName,
          status: bankConfig.status,
          updatedByAdminName: bankConfig.updatedByAdminName,
          updatedAt: bankConfig.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Failed to update receiving bank config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ========================================================
// PRESERVED LEGACY CONTROLLER SUMMARY & POOL METHODS
// ========================================================
router.get('/summary', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const [fundingReqs, applications, directInvestments] = await Promise.all([
      FundingRequestModel.find().lean(),
      FundingApplicationModel.find().lean(),
      InvestmentRequestModel.find().lean()
    ]);

    const userRequestCount = fundingReqs.filter((a) => a.status === 'SUBMITTED' || a.status === 'RESUBMITTED').length;
    const reviewCount = fundingReqs.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'CHANGES_REQUESTED').length;
    const fundedCount = fundingReqs.filter((a) => a.status === 'APPROVED' || a.status === 'ACTIVE' || a.status === 'FUNDED').length;
    const repaidCount = fundingReqs.filter((a) => a.status === 'COMPLETED').length;
    const rejectedCount = fundingReqs.filter((a) => a.status === 'REJECTED').length;

    const totalPipelineRequested = fundingReqs.reduce((sum, a) => sum + (a.requiredFundingAmount || 0), 0);
    const totalPrincipalFunded = directInvestments
      .filter((i) => i.status === 'ACTIVE' || i.status === 'COMPLETED' || i.status === 'MATURITY_PAYMENT_RECEIVED')
      .reduce((sum, i) => sum + (i.paidAmount || 0), 0);

    res.json({
      success: true,
      data: {
        metrics: {
          totalPrincipalFunded,
          totalExpectedInterest: Math.round(totalPrincipalFunded * 0.15),
          totalInterestCollected: directInvestments.reduce((sum, i) => sum + (i.maturityAmountReceived || 0), 0),
          totalCapitalRepaid: directInvestments.reduce((sum, i) => sum + (i.maturityAmountReleased || 0), 0),
          totalPipelineRequested,
          userRequestCount,
          reviewCount,
          fundedCount,
          repaidCount,
          rejectedCount,
          totalApplications: fundingReqs.length
        },
        applications: fundingReqs.length > 0 ? fundingReqs : applications
      }
    });
  } catch (err: any) {
    console.error('Failed to get funding summary:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch funding data', details: err.message });
  }
});

router.get('/pools', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const dbPools = await InvestmentPoolModel.find().sort({ createdAt: -1 });
    res.json({ success: true, pools: dbPools, data: dbPools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pools', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { poolCode, title, description, targetAmount, minInvestmentAmount, maxInvestmentAmount, borrowerCompanyName, borrowerIndustry, borrowerPurpose, tenureMonths, borrowerAnnualInterestPercent, investorAnnualYieldPercent } = req.body;
    const newPool = await InvestmentPoolModel.create({
      poolCode: poolCode || `POOL-${Date.now().toString().slice(-4)}`,
      title,
      description,
      targetAmount: Number(targetAmount),
      collectedAmount: 0,
      minInvestmentAmount: Number(minInvestmentAmount) || 5000,
      maxInvestmentAmount: Number(maxInvestmentAmount) || 100000,
      borrowerCompanyName,
      borrowerIndustry,
      borrowerPurpose,
      tenureMonths: Number(tenureMonths) || 12,
      borrowerAnnualInterestPercent: Number(borrowerAnnualInterestPercent) || 15,
      investorAnnualYieldPercent: Number(investorAnnualYieldPercent) || 12,
      status: 'OPEN',
      investors: []
    });
    res.status(201).json({ success: true, message: 'Investment collection pool launched successfully!', pool: newPool, data: newPool });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

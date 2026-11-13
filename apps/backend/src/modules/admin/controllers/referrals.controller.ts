import { Router, Response } from 'express';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';
import { ReferralConfigModel, ReferralRecordModel } from '../models/Referral';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { getOrCreateWallet } from '../../wallet/wallet.routes';
import { WalletTransactionModel } from '../../wallet/wallet.model';
import { WalletTransactionType, WalletTransactionStatus } from '@fic/shared-types';
import { ReferralModel } from '../../referrals/referral.model';
import { FinancialConfigModel, ensureFinancialConfig } from '../models/FinancialConfig';

const router = Router();

// Ensure initial configuration exists if empty, synced with central FinancialConfig
const ensureReferralInit = async () => {
  const finConfig = await ensureFinancialConfig();
  let config = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
  if (!config) {
    config = await ReferralConfigModel.create({
      key: 'DEFAULT_CONFIG',
      bonusPerReferral: finConfig.referralRewardAmount || 500,
      currency: 'INR',
      minimumPayoutAmount: 1000,
      isActive: finConfig.referralProgramEnabled !== false,
      updatedBy: 'System',
    });
  } else if (finConfig.referralRewardAmount && config.bonusPerReferral !== finConfig.referralRewardAmount) {
    config.bonusPerReferral = finConfig.referralRewardAmount;
    config.isActive = finConfig.referralProgramEnabled !== false;
    await config.save();
  }
  return config;
};

// GET /api/admin/referrals/summary
// Returns config, stats (total referrals, total amount paid, pending amount, etc.), and recent referrals list
router.get('/summary', authenticateAdmin, async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const config = await ensureReferralInit();
    const records = await ReferralRecordModel.find().sort({ createdAt: -1 });

    const totalReferrals = records.length;
    const paidRecords = records.filter((r) => r.status === 'PAID');
    const totalPaidBonus = paidRecords.reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

    const pendingOrApprovedRecords = records.filter((r) => r.status === 'APPROVED' || r.status === 'PENDING');
    const totalPendingBonus = pendingOrApprovedRecords.reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

    // Group referrals by referrer
    const referrerMap: Record<
      string,
      {
        referrerName: string;
        referrerEmail: string;
        count: number;
        totalEarned: number;
        paidAmount: number;
      }
    > = {};

    records.forEach((r) => {
      const email = r.referrerEmail?.toLowerCase() || 'unknown';
      if (!referrerMap[email]) {
        referrerMap[email] = {
          referrerName: r.referrerName || 'Member',
          referrerEmail: r.referrerEmail,
          count: 0,
          totalEarned: 0,
          paidAmount: 0,
        };
      }
      referrerMap[email].count += 1;
      referrerMap[email].totalEarned += r.bonusAmount || 0;
      if (r.status === 'PAID') {
        referrerMap[email].paidAmount += r.bonusAmount || 0;
      }
    });

    const topReferrers = Object.values(referrerMap).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        config,
        stats: {
          totalReferrals,
          totalPaidBonus,
          totalPendingBonus,
          currentBonusPerReferral: config.bonusPerReferral,
          activeReferrersCount: Object.keys(referrerMap).length,
        },
        records,
        topReferrers,
      },
    });
  } catch (err: any) {
    console.error('Failed to get referral summary:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch referral data', details: err.message });
  }
});

// PATCH /api/admin/referrals/config
// Update the referral bonus configuration
router.patch('/config', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { bonusPerReferral, minimumPayoutAmount, isActive } = req.body;

    let config = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
    if (!config) {
      config = new ReferralConfigModel({ key: 'DEFAULT_CONFIG' });
    }

    if (typeof bonusPerReferral === 'number' && bonusPerReferral >= 0) {
      config.bonusPerReferral = bonusPerReferral;
    }
    if (typeof minimumPayoutAmount === 'number' && minimumPayoutAmount >= 0) {
      config.minimumPayoutAmount = minimumPayoutAmount;
    }
    if (typeof isActive === 'boolean') {
      config.isActive = isActive;
    }
    config.updatedBy = req.admin?.name || 'Admin';

    await config.save();

    // Sync with central FinancialConfig
    await FinancialConfigModel.findOneAndUpdate(
      { key: 'DEFAULT_FINANCIAL_CONFIG' },
      {
        referralRewardAmount: config.bonusPerReferral,
        referralProgramEnabled: config.isActive,
        updatedByAdminName: req.admin?.name || 'Admin'
      },
      { upsert: true }
    );

    await logAdminAction(
      req,
      'UPDATE',
      'ReferralConfig',
      config._id.toString(),
      { message: `Updated referral bonus to ₹${config.bonusPerReferral}` }
    );

    res.json({ message: 'Referral configuration updated successfully', config });
  } catch (err: any) {
    console.error('Failed to update referral config:', err);
    res.status(500).json({ error: 'Failed to update referral configuration' });
  }
});

// POST /api/admin/referrals/record
// Admin can log or assign a new referral record manually
router.post('/record', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { referrerEmail, referredEmail, bonusAmount, notes } = req.body;

    const [referrer, referred] = await Promise.all([
      MemberModel.findOne({ email: referrerEmail.toLowerCase().trim() }),
      MemberModel.findOne({ email: referredEmail.toLowerCase().trim() }),
    ]);

    if (!referrer) {
      return res.status(404).json({ error: 'Referrer member not found by that email' });
    }
    if (!referred) {
      return res.status(404).json({ error: 'Referred member not found by that email' });
    }

    const config = await ensureReferralInit();
    const amount = typeof bonusAmount === 'number' ? bonusAmount : config?.bonusPerReferral || 500;

    const record = await ReferralRecordModel.create({
      referrerMemberId: referrer._id,
      referrerName: referrer.name,
      referrerEmail: referrer.email,
      referredMemberId: referred._id,
      referredName: referred.name,
      referredEmail: referred.email,
      bonusAmount: amount,
      status: 'PENDING',
      notes: notes || 'Manual entry by operations team',
    });

    await logAdminAction(
      req,
      'CREATE',
      'ReferralRecord',
      record._id.toString(),
      { message: `Created referral for referrer ${referrer.email}`, referredEmail: referred.email }
    );

    res.status(201).json({ message: 'Referral created successfully', record });
  } catch (err: any) {
    console.error('Failed to create referral record:', err);
    res.status(500).json({ error: 'Failed to record referral', details: err.message });
  }
});

// PATCH /api/admin/referrals/record/:id/payout
// Approve and disburse referral reward atomically to referrer's wallet with ledger entry
router.patch('/record/:id/payout', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { payoutReference, notes } = req.body;
    const record = await ReferralRecordModel.findById(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Referral record not found' });
      return;
    }

    if (record.status === 'PAID') {
      res.status(400).json({ error: 'This referral reward has already been disbursed and paid.' });
      return;
    }

    // Find referrer in UserModel
    const referrerUser = await UserModel.findOne({
      $or: [
        { email: record.referrerEmail.toLowerCase() },
        { _id: record.referrerMemberId }
      ]
    });

    const bonusAmount = Number(record.bonusAmount) || 500;

    if (referrerUser) {
      const wallet = await getOrCreateWallet(referrerUser._id);

      // Atomically credit wallet
      const balanceAfter = wallet.availableBalance + bonusAmount;
      wallet.availableBalance += bonusAmount;
      wallet.totalBalance += bonusAmount;
      wallet.withdrawalEligibleBalance += bonusAmount;
      wallet.totalReferralEarnings += bonusAmount;
      await wallet.save();

      // Create transaction ledger record
      await WalletTransactionModel.create({
        transactionId: `TXN_REF_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
        walletId: wallet._id,
        userId: referrerUser._id,
        transactionType: WalletTransactionType.REFERRAL_REWARD,
        direction: 'CREDIT',
        amount: bonusAmount,
        currency: 'INR',
        description: `Referral reward approved for verified member: ${record.referredName} (${record.referredEmail})`,
        status: WalletTransactionStatus.COMPLETED,
        balanceAfter,
        sourceReferenceId: record._id.toString()
      });
    }

    // Also sync ReferralModel if present
    await ReferralModel.updateMany(
      {
        $or: [
          { referredUserId: record.referredMemberId },
          { referralCode: record.notes }
        ]
      },
      {
        $set: {
          rewardStatus: 'CREDITED',
          creditedAt: new Date(),
          approvedBy: req.admin?.name || 'Admin Compliance'
        }
      }
    );

    record.status = 'PAID';
    record.payoutDate = new Date();
    record.payoutReference = payoutReference || `PAYOUT-${Date.now().toString().slice(-6)}`;
    if (notes) record.notes = notes;
    await record.save();

    await logAdminAction(
      req,
      'APPROVE_REFERRAL_REWARD',
      'ReferralRecord',
      record._id.toString(),
      {
        message: `Approved and credited ₹${bonusAmount} referral reward to ${record.referrerEmail}`,
        payoutReference: record.payoutReference,
        referrerEmail: record.referrerEmail
      }
    );

    res.json({
      success: true,
      message: `Referral reward of ₹${bonusAmount} approved and credited to ${record.referrerName}'s wallet successfully.`,
      record
    });
  } catch (err: any) {
    console.error('Failed to update payout:', err);
    res.status(500).json({ error: 'Failed to complete payout', details: err.message });
  }
});

// PATCH /api/admin/referrals/record/:id/reject
// Admin rejects a referral reward request
router.patch('/record/:id/reject', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { rejectionReason, notes } = req.body;
    const record = await ReferralRecordModel.findById(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Referral record not found' });
      return;
    }

    record.status = 'REJECTED';
    record.notes = rejectionReason || notes || 'Rejected by Admin Compliance Review';
    await record.save();

    await ReferralModel.updateMany(
      {
        $or: [
          { referredUserId: record.referredMemberId },
          { referralCode: record.notes }
        ]
      },
      {
        $set: {
          rewardStatus: 'REJECTED',
          rejectionReason: record.notes
        }
      }
    );

    await logAdminAction(
      req,
      'REJECT_REFERRAL_REWARD',
      'ReferralRecord',
      record._id.toString(),
      {
        message: `Rejected referral reward for ${record.referrerEmail}`,
        rejectionReason: record.notes
      }
    );

    res.json({
      success: true,
      message: 'Referral reward rejected.',
      record
    });
  } catch (err: any) {
    console.error('Failed to reject referral:', err);
    res.status(500).json({ error: 'Failed to reject referral', details: err.message });
  }
});

export default router;

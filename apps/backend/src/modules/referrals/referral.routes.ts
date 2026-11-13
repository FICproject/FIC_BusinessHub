import { Router, Request, Response, NextFunction } from 'express';
import { ReferralModel, ReferralProgrammeConfigModel } from './referral.model';
import { UserModel } from '../users/users.model';
import { getOrCreateWallet } from '../wallet/wallet.routes';
import { WalletTransactionModel } from '../wallet/wallet.model';
import { authenticate, requireActiveVerifiedMember, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { WalletTransactionType, WalletTransactionStatus, UserRole } from '@fic/shared-types';

export const referralsRouter = Router();

// 1. GET /api/v1/referrals/validate-code/:code - Validate referral code during registration
referralsRouter.get('/validate-code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    if (!code) throw new AppError('Referral code required.', 400);

    const cleanCode = code.trim().toUpperCase();
    const referrer = await UserModel.findOne({
      $or: [
        { referralCode: cleanCode },
        { referralCode: new RegExp(`^${cleanCode}$`, 'i') },
        { email: cleanCode.toLowerCase() }
      ]
    });

    if (!referrer) {
      return res.status(200).json({
        success: false,
        valid: false,
        message: 'Invalid referral code.'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        referralCode: cleanCode,
        referrerUserId: referrer._id,
        referrerName: referrer.fullName
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/v1/referrals/my-referrals - Current user's referral summary and history
referralsRouter.get('/my-referrals', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const user = await UserModel.findById(req.user.userId);
    if (!user) throw new AppError('User not found', 404);

    // Use user's authoritative stored referral code or generate and persist if missing
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = `FIC-${user.fullName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${user._id.toString().slice(-4).toUpperCase()}`;
      user.referralCode = referralCode;
      await user.save();
    }

    const referrals = await ReferralModel.find({ referrerUserId: req.user.userId })
      .populate('referredUserId', 'fullName primaryCategoryName primarySubcategoryName subCategory createdAt')
      .sort({ createdAt: -1 });

    const sanitizedReferrals = referrals.map((r: any) => {
      const refUser = r.referredUserId || {};
      const memberId = refUser._id ? `FIC-${refUser._id.toString().slice(-6).toUpperCase()}` : (r.referralId || 'FIC-MBR');
      return {
        _id: r._id,
        referralId: r.referralId,
        referredUserId: refUser._id ? refUser._id.toString() : '',
        referredName: refUser.fullName || r.referredName || 'Registered Member',
        referredMemberName: refUser.fullName || r.referredName || 'Registered Member',
        referredMemberId: memberId,
        categoryName: refUser.primaryCategoryName || r.categoryName || 'General Member',
        subCategory: refUser.primarySubcategoryName || refUser.subCategory || r.subCategory || 'Member',
        registrationDate: r.registrationDate ? new Date(r.registrationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
        paymentStatus: r.paymentStatus || 'PAID',
        kycStatus: r.kycStatus || 'PENDING',
        accountStatus: r.accountStatus || 'ACTIVE',
        referralStatus: r.referralStatus || 'REGISTERED',
        rewardAmount: r.rewardAmount || 500,
        rewardStatus: r.rewardStatus || 'PENDING_APPROVAL',
        referralSource: r.referralSource || 'REFERRED'
      };
    });

    const totalReferrals = sanitizedReferrals.length;
    const pendingReferrals = sanitizedReferrals.filter((r) => r.rewardStatus === 'PENDING_ELIGIBILITY' || r.rewardStatus === 'PENDING_APPROVAL').length;
    const kycApprovedReferrals = sanitizedReferrals.filter((r) => r.kycStatus === 'VERIFIED').length;
    const rewardPending = sanitizedReferrals
      .filter((r) => r.rewardStatus === 'PENDING_APPROVAL')
      .reduce((sum, r) => sum + (r.rewardAmount || 500), 0);
    const rewardCredited = sanitizedReferrals
      .filter((r) => r.rewardStatus === 'CREDITED')
      .reduce((sum, r) => sum + (r.rewardAmount || 500), 0);

    res.status(200).json({
      success: true,
      data: {
        referralCode,
        referralLink: `https://www.ficapp.in/register?ref=${referralCode}`,
        summary: {
          totalReferrals,
          pendingReferrals,
          kycApprovedReferrals,
          rewardPending,
          rewardCredited,
          totalEarnings: rewardCredited
        },
        referrals: sanitizedReferrals
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Admin: GET /api/v1/referrals/admin/all - View all referrals with attribution
referralsRouter.get('/admin/all', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const referrals = await ReferralModel.find()
      .populate('referrerUserId', 'fullName email')
      .populate('referredUserId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals
    });
  } catch (error) {
    next(error);
  }
});

// 4. Admin: PATCH /api/v1/referrals/admin/:id/approve-reward - Approve reward & credit referrer wallet
referralsRouter.patch('/admin/:id/approve-reward', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const referral = await ReferralModel.findById(id);
    if (!referral) throw new AppError('Referral record not found', 404);

    if (referral.rewardStatus === 'CREDITED') {
      throw new AppError('Reward has already been credited to member wallet.', 400);
    }

    const rewardAmount = referral.rewardAmount || 500;
    const referrerWallet = await getOrCreateWallet(referral.referrerUserId);

    // Credit wallet atomically
    const balanceAfter = referrerWallet.availableBalance + rewardAmount;
    referrerWallet.availableBalance += rewardAmount;
    referrerWallet.totalBalance += rewardAmount;
    referrerWallet.totalReferralEarnings += rewardAmount;
    referrerWallet.withdrawalEligibleBalance += rewardAmount;
    referrerWallet.membershipEligibleBalance += rewardAmount;
    await referrerWallet.save();

    // Create ledger transaction
    await WalletTransactionModel.create({
      transactionId: `TXN_REF_${Date.now()}`,
      walletId: referrerWallet._id,
      userId: referral.referrerUserId,
      transactionType: WalletTransactionType.REFERRAL_REWARD,
      direction: 'CREDIT',
      amount: rewardAmount,
      currency: 'INR',
      description: `Referral reward credited for verified member (Ref: ${referral.referralCode})`,
      status: WalletTransactionStatus.COMPLETED,
      balanceAfter,
      sourceReferenceId: referral.referralId
    });

    referral.rewardStatus = 'CREDITED';
    referral.creditedAt = new Date();
    referral.approvedBy = req.user?.userId || 'ADMIN_OPERATIONS';
    referral.approvedAt = new Date();
    await referral.save();

    res.status(200).json({
      success: true,
      message: `Referral reward of ₹${rewardAmount} approved and credited to referrer wallet.`,
      data: referral
    });
  } catch (error) {
    next(error);
  }
});

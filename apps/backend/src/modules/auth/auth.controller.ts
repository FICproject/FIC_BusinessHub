import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../users/users.model';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { JWTPayload, UserRole, AccountStatus, KYCStatus } from '@fic/shared-types';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { KYCSubmissionModel } from '../kyc/kyc.model';
import { evaluateMemberActivationAccess, resolveUserKycSnapshot } from '../kyc/kyc-status.helpers';

export { resolveUserKycSnapshot };

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      dob,
      password,
      primaryCategoryId,
      primaryCategoryName,
      subCategory,
      subcategoryIds,
      primarySubcategoryName,
      dynamicProfile,
      address,
      referralCode,
      referredByCode,
      ageConfirmed,
      termsAccepted
    } = req.body;

    if (!ageConfirmed) {
      throw new AppError('You must be at least 18 years of age to register for FIC Business Hub.', 400, 'UNDERAGE_NOT_PERMITTED');
    }

    if (!dob) {
      throw new AppError('Date of birth is required.', 400, 'DOB_REQUIRED');
    }

    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      throw new AppError('Please enter a valid date of birth.', 400, 'INVALID_DOB');
    }

    const today = new Date();
    if (birthDate > today) {
      throw new AppError('Date of birth cannot be in the future.', 400, 'INVALID_DOB');
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new AppError(`You must be at least 18 years of age to register (calculated age: ${age} years). Under FIC Adult Eligibility Policy, only verified adults can register.`, 400, 'UNDERAGE_NOT_PERMITTED');
    }

    if (age > 120 || birthDate.getFullYear() < 1900) {
      throw new AppError(`Please enter a valid date of birth. Calculated age (${age} years) exceeds the maximum limit of 120 years.`, 400, 'INVALID_DOB');
    }

    if (!termsAccepted) {
      throw new AppError('You must accept the terms and conditions.', 400, 'TERMS_NOT_ACCEPTED');
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber }]
    });

    if (existingUser) {
      throw new AppError('An account with this email or mobile number already exists.', 409, 'ACCOUNT_EXISTS');
    }

    // Validate residential address if provided
    let validatedAddress = undefined;
    if (address) {
      if (!address.addressLine1?.trim()) {
        throw new AppError('Address Line 1 is required.', 400, 'ADDRESS_LINE1_REQUIRED');
      }
      if (!address.state?.trim()) {
        throw new AppError('State is required.', 400, 'STATE_REQUIRED');
      }
      if (!address.district?.trim()) {
        throw new AppError('District is required.', 400, 'DISTRICT_REQUIRED');
      }
      if (!address.city?.trim()) {
        throw new AppError('City / Town is required.', 400, 'CITY_REQUIRED');
      }
      if (!address.pinCode?.trim() || !/^\d{6}$/.test(address.pinCode.trim())) {
        throw new AppError('Valid 6-digit Indian PIN code is required.', 400, 'PINCODE_INVALID');
      }

      validatedAddress = {
        addressLine1: address.addressLine1.trim(),
        addressLine2: address.addressLine2?.trim() || '',
        landmark: address.landmark?.trim() || '',
        country: address.country?.trim() || 'India',
        state: address.state.trim(),
        district: address.district.trim(),
        city: address.city.trim(),
        pinCode: address.pinCode.trim(),
        addressType: address.addressType?.trim() || 'Residential'
      };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const resolvedSubcategory =
      primarySubcategoryName ||
      subCategory ||
      (Array.isArray(subcategoryIds) && subcategoryIds.length > 0 ? subcategoryIds[0] : 'Member');

    // Referral code generation & attribution
    const generatedReferralCode = `FIC-${fullName.toUpperCase().replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    let referrerUserId: mongoose.Types.ObjectId | undefined = undefined;
    let referralSource: 'REFERRED' | 'ORGANIC' = 'ORGANIC';
    const cleanRefBy = (referredByCode || referralCode || '').trim().toUpperCase();

    if (cleanRefBy) {
      const referrer = await UserModel.findOne({
        $or: [{ referralCode: cleanRefBy }, { email: cleanRefBy.toLowerCase() }]
      });
      if (referrer) {
        referrerUserId = referrer._id as mongoose.Types.ObjectId;
        referralSource = 'REFERRED';
      }
    }

    const newUser = await UserModel.create({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      dob,
      passwordHash,
      role: UserRole.MEMBER,
      status: AccountStatus.ACTIVE,
      primaryCategoryId: mongoose.isValidObjectId(primaryCategoryId) ? primaryCategoryId : undefined,
      primaryCategoryName: primaryCategoryName || undefined,
      subCategory: resolvedSubcategory,
      primarySubcategoryName: resolvedSubcategory,
      subcategoryIds: Array.isArray(subcategoryIds) ? subcategoryIds.filter(id => mongoose.isValidObjectId(id)) : [],
      dynamicProfile: dynamicProfile || {},
      address: validatedAddress,
      referralCode: generatedReferralCode,
      referralSource,
      referredByCode: cleanRefBy || undefined,
      referrerUserId,
      isEmailVerified: true, // simplified for onboarding
      isPhoneVerified: true,
      isKycApproved: false,
      isMembershipActive: false
    });

    // Only initialize the private KYCSubmissionModel draft here.
    // Admin Member, Admin KYC Submission, Admin Payment, Referral payouts, and Admin notifications
    // are deferred until BOTH verified payment AND final KYC submission succeed in POST /api/v1/kyc/submit.
    try {
      await KYCSubmissionModel.findOneAndUpdate(
        { userId: newUser._id },
        {
          $setOnInsert: {
            userId: newUser._id,
            categoryId: newUser.primaryCategoryId || new mongoose.Types.ObjectId(),
            status: KYCStatus.NOT_SUBMITTED,
            documents: []
          }
        },
        { upsert: true, new: true }
      );
    } catch (kycInitErr) {
      console.warn('KYC draft initialization warning:', kycInitErr);
    }

    const payload: JWTPayload = {
      userId: newUser._id.toString(),
      role: newUser.role,
      primaryCategoryId: newUser.primaryCategoryId?.toString(),
      isKycApproved: newUser.isKycApproved,
      isMembershipActive: newUser.isMembershipActive
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to FIC Business Hub.',
      data: {
        token: accessToken,
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          dob: newUser.dob,
          role: newUser.role,
          primaryCategoryId: newUser.primaryCategoryId,
          primaryCategoryName: newUser.primaryCategoryName,
          subCategory: newUser.subCategory,
          primarySubcategoryName: newUser.primarySubcategoryName,
          subcategories: [newUser.subCategory].filter(Boolean),
          address: newUser.address,
          referralCode: newUser.referralCode,
          status: newUser.status,
          kycStatus: 'NOT_SUBMITTED',
          isKycApproved: newUser.isKycApproved,
          isMembershipActive: newUser.isMembershipActive,
          canAccessDashboard: false,
          activationChecks: {
            accountActive: true,
            isSuspended: false,
            kycApproved: false,
            kycStatus: 'NOT_SUBMITTED',
            membershipActive: false,
            paymentStatus: 'PENDING',
            hasReuploadRequiredDocs: false
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.phoneNumber || '';
    const password = req.body.password;

    if (!rawIdentifier || !password) {
      throw new AppError('Email/mobile and password are required.', 400, 'CREDENTIALS_REQUIRED');
    }

    const identifier = String(rawIdentifier).trim();

    const user = await UserModel.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phoneNumber: identifier }]
    });

    if (!user) {
      throw new AppError('Invalid email/mobile or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email/mobile or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      throw new AppError('Your account has been deactivated or suspended. Please contact FIC support.', 403, 'ACCOUNT_INACTIVE');
    }

    const activation = await evaluateMemberActivationAccess(user._id.toString());
    if (activation.checks.isSuspended) {
      throw new AppError('Your account has been suspended or deactivated. Please contact FIC support.', 403, 'ACCOUNT_INACTIVE');
    }
    const kycSnapshot = activation.kycSnapshot || (await resolveUserKycSnapshot(user));

    const payload: JWTPayload = {
      userId: user._id.toString(),
      role: user.role,
      primaryCategoryId: user.primaryCategoryId?.toString(),
      isKycApproved: kycSnapshot.isKycApproved,
      isMembershipActive: user.isMembershipActive
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token: accessToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          dob: user.dob,
          role: user.role,
          status: user.status,
          primaryCategoryId: user.primaryCategoryId,
          primaryCategoryName: user.primaryCategoryName,
          subCategory: user.subCategory,
          primarySubcategoryName: user.primarySubcategoryName,
          subcategories: user.subCategory ? [user.subCategory] : [],
          subcategoryIds: user.subcategoryIds,
          address: user.address,
          referralCode: user.referralCode,
          isKycApproved: kycSnapshot.isKycApproved,
          kycStatus: kycSnapshot.kycStatus,
          rejectionReason: kycSnapshot.rejectionReason,
          reviewerNotes: kycSnapshot.reviewerNotes,
          reviewedAt: kycSnapshot.reviewedAt,
        submittedAt: kycSnapshot.submittedAt,
          isMembershipActive: activation.checks.membershipActive,
          canAccessDashboard: activation.canAccessDashboard,
          activationChecks: activation.checks
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized.', 401, 'UNAUTHORIZED');
    }

    const {
      fullName,
      phoneNumber,
      address,
      personalInfo,
      professionalInfo,
      subCategory,
      subcategories
    } = req.body;

    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (fullName) user.fullName = fullName.trim();
    if (phoneNumber) user.phoneNumber = phoneNumber.trim();

    if (address) {
      user.address = {
        addressLine1: address.addressLine1?.trim() || user.address?.addressLine1 || '',
        addressLine2: address.addressLine2?.trim() || '',
        landmark: address.landmark?.trim() || '',
        country: address.country?.trim() || 'India',
        state: address.state?.trim() || user.address?.state || '',
        district: address.district?.trim() || user.address?.district || '',
        city: address.city?.trim() || user.address?.city || '',
        pinCode: address.pinCode?.trim() || user.address?.pinCode || '',
        addressType: address.addressType?.trim() || 'Residential'
      };
    }

    if (subCategory) {
      user.subCategory = subCategory;
      user.primarySubcategoryName = subCategory;
    }

    await user.save();

    const userResponse = user.toJSON();
    delete (userResponse as any).passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized.', 401, 'UNAUTHORIZED');
    }

    const user = await UserModel.findById(req.user.userId)
      .populate('primaryCategoryId')
      .populate('subcategoryIds')
      .select('-passwordHash');

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const activation = await evaluateMemberActivationAccess(user._id.toString());
    const kycSnapshot = activation.kycSnapshot || (await resolveUserKycSnapshot(user));
    const userObj = user.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...userObj,
        isKycApproved: kycSnapshot.isKycApproved,
        kycStatus: kycSnapshot.kycStatus,
        rejectionReason: kycSnapshot.rejectionReason,
        reviewerNotes: kycSnapshot.reviewerNotes,
        reviewedAt: kycSnapshot.reviewedAt,
        submittedAt: kycSnapshot.submittedAt
      }
    });
  } catch (error) {
    next(error);
  }
};


export const awardReferralBonusIfApplicable = async (newUser: any): Promise<void> => {
  if (!newUser?.referrerUserId) return;
  try {
    const { ReferralModel } = await import('../referrals/referral.model');
    const existingRef = await ReferralModel.findOne({ referredUserId: newUser._id }).lean();
    if (existingRef) return;

    await ReferralModel.create({
      referralId: `REF_${Date.now()}`,
      referralCode: newUser.referredByCode || '',
      referrerUserId: newUser.referrerUserId,
      referredUserId: newUser._id,
      referralSource: 'REFERRED',
      registrationDate: newUser.createdAt || new Date(),
      paymentStatus: 'PAID',
      kycStatus: 'PENDING',
      accountStatus: 'ACTIVE',
      referralStatus: 'ELIGIBLE',
      rewardAmount: 500,
      rewardStatus: 'CREDITED',
      approvedBy: 'System Auto-Credit',
      approvedAt: new Date(),
      creditedAt: new Date()
    });

    const referrerUser = await UserModel.findById(newUser.referrerUserId);
    if (!referrerUser) return;

    const { ReferralRecordModel } = await import('../admin/models/Referral');
    await ReferralRecordModel.findOneAndUpdate(
      { referredMemberId: newUser._id },
      {
        referrerMemberId: referrerUser._id,
        referrerName: referrerUser.fullName,
        referrerEmail: referrerUser.email,
        referredMemberId: newUser._id,
        referredName: newUser.fullName,
        referredEmail: newUser.email,
        bonusAmount: 500,
        status: 'PAID',
        payoutDate: new Date(),
        payoutReference: `REF-TXN-${referrerUser._id.toString().slice(-4).toUpperCase()}${newUser._id.toString().slice(-4).toUpperCase()}`,
        notes: `Referral bonus automatically attributed to ${referrerUser.fullName} for onboarding member ${newUser.fullName}`
      },
      { upsert: true, new: true }
    );

    const { MemberWalletModel } = await import('../admin/models/MemberWallet');
    const rWallet = await MemberWalletModel.findOne({
      $or: [{ memberId: referrerUser._id }, { memberEmail: referrerUser.email.toLowerCase() }]
    });

    const bonusTx = {
      id: `TXN-REF-${newUser._id.toString().slice(-6)}`,
      type: 'CREDIT',
      title: `Referral Bonus Reward (${newUser.fullName})`,
      category: 'Referral Bonus',
      amount: 500,
      currency: 'INR',
      status: 'SUCCESS',
      reference: `REF-TXN-${newUser._id.toString().slice(-6).toUpperCase()}`,
      date: new Date().toISOString(),
      description: `Referral reward credited for onboarding member ${newUser.fullName} (${newUser.email})`
    };

    if (rWallet) {
      rWallet.balance = (rWallet.balance || 0) + 500;
      const rTxs = rWallet.transactions || [];
      rTxs.unshift(bonusTx as any);
      rWallet.transactions = rTxs;
      rWallet.lastSyncedAt = new Date();
      await rWallet.save();
    } else {
      await MemberWalletModel.create({
        memberId: referrerUser._id,
        memberEmail: referrerUser.email.toLowerCase(),
        balance: 50500,
        currency: 'INR',
        currencySymbol: '₹',
        status: 'ACTIVE',
        lastSyncedAt: new Date(),
        transactions: [bonusTx]
      });
    }
  } catch (err: any) {
    console.warn('Referral creation warning:', err?.message);
  }
};

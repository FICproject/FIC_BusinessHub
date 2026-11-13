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
import { MemberModel } from '../admin/models/Member';
import { CategoryModel as AdminCategoryModel } from '../admin/models/Category';
import { evaluateMemberActivationAccess, resolveUserKycSnapshot } from '../kyc/kyc-status.helpers';
import {
  validateAddressPayload,
  validateDynamicProfileValues,
  validateEmailFormat,
  validateFullName,
  validateIndianMobile,
  validatePasswordStrength
} from '../../common/utils/registration-validation';

export { resolveUserKycSnapshot };

export const checkEmailAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const normalizedEmail = validateEmailFormat(req.query.email);
    const [existingUser, existingMember] = await Promise.all([
      UserModel.exists({ email: normalizedEmail }),
      MemberModel.exists({ email: normalizedEmail })
    ]);
    const exists = Boolean(existingUser || existingMember);
    res.status(200).json({
      success: true,
      data: {
        available: !exists,
        message: exists
          ? 'This email address is already registered. Please use another email address.'
          : 'Email address is available.'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const checkMobileAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mobile = validateIndianMobile(req.query.phoneNumber ?? req.query.mobile);
    const [existingUser, existingMember] = await Promise.all([
      UserModel.exists({ phoneNumber: mobile }),
      MemberModel.exists({ phone: mobile })
    ]);
    const exists = Boolean(existingUser || existingMember);
    res.status(200).json({
      success: true,
      data: {
        available: !exists,
        message: exists
          ? 'This mobile number is already registered. Please use another number.'
          : 'Mobile number is available.'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      dob,
      password,
      confirmPassword,
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

    const cleanFullName = validateFullName(fullName);
    const cleanEmail = validateEmailFormat(email);
    const cleanPhone = validateIndianMobile(phoneNumber);
    const cleanPassword = validatePasswordStrength(password);

    if (confirmPassword !== undefined && confirmPassword !== cleanPassword) {
      throw new AppError('Passwords do not match.', 400, 'PASSWORD_MISMATCH');
    }

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

    const [existingByEmail, existingByPhone] = await Promise.all([
      UserModel.findOne({ email: cleanEmail }).select('_id').lean(),
      UserModel.findOne({ phoneNumber: cleanPhone }).select('_id').lean()
    ]);

    if (existingByEmail) {
      throw new AppError(
        'This email address is already registered. Please use another email address.',
        409,
        'EMAIL_EXISTS'
      );
    }
    if (existingByPhone) {
      throw new AppError(
        'This mobile number is already registered. Please use another number.',
        409,
        'MOBILE_EXISTS'
      );
    }

    const validatedAddress = address ? validateAddressPayload(address) : undefined;

    let adminCat: any = null;
    if (primaryCategoryId && mongoose.isValidObjectId(primaryCategoryId)) {
      adminCat = await AdminCategoryModel.findById(primaryCategoryId).lean();
    } else if (primaryCategoryName) {
      adminCat = await AdminCategoryModel.findOne({ name: String(primaryCategoryName).trim() }).lean();
    }

    const resolvedSubcategory =
      (typeof (primarySubcategoryName || subCategory) === 'string' && (primarySubcategoryName || subCategory).trim()) ||
      (Array.isArray(subcategoryIds) && subcategoryIds.length > 0 ? String(subcategoryIds[0]).trim() : 'Member');

    if (adminCat && Array.isArray(adminCat.subcategories) && adminCat.subcategories.length > 0) {
      const validSubs = adminCat.subcategories.map((s: any) =>
        typeof s === 'string' ? s.trim().toLowerCase() : String(s?.name || '').trim().toLowerCase()
      );
      if (resolvedSubcategory && !validSubs.includes(resolvedSubcategory.toLowerCase())) {
        throw new AppError(
          `Selected subcategory "${resolvedSubcategory}" is not configured under "${adminCat.name}".`,
          400,
          'INVALID_SUBCATEGORY'
        );
      }
    }

    const validatedDynamicProfile = validateDynamicProfileValues(
      dynamicProfile,
      adminCat?.customFields || []
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);

    const basePrefix = cleanFullName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'MEMBER';
    const generatedReferralCode = `FIC-${basePrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

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

    let newUser;
    try {
      newUser = await UserModel.create({
        fullName: cleanFullName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        dob,
        passwordHash,
        role: UserRole.MEMBER,
        status: AccountStatus.ACTIVE,
        primaryCategoryId: adminCat?._id || (mongoose.isValidObjectId(primaryCategoryId) ? primaryCategoryId : undefined),
        primaryCategoryName: adminCat?.name || primaryCategoryName || undefined,
        subCategory: resolvedSubcategory,
        primarySubcategoryName: resolvedSubcategory,
        subcategoryIds: Array.isArray(subcategoryIds) ? subcategoryIds.filter(id => mongoose.isValidObjectId(id)) : [],
        dynamicProfile: validatedDynamicProfile,
        address: validatedAddress,
        referralCode: generatedReferralCode,
        referralSource,
        referredByCode: cleanRefBy || undefined,
        referrerUserId,
        isEmailVerified: true,
        isPhoneVerified: true,
        isKycApproved: false,
        isMembershipActive: false
      });
    } catch (createErr: any) {
      if (createErr?.code === 11000) {
        const keyPattern = Object.keys(createErr.keyPattern || {});
        if (keyPattern.includes('phoneNumber')) {
          throw new AppError('This mobile number is already registered. Please use another number.', 409, 'MOBILE_EXISTS');
        }
        throw new AppError('This email address is already registered. Please use another email address.', 409, 'EMAIL_EXISTS');
      }
      throw createErr;
    }

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
          referralSource: newUser.referralSource,
          referredByCode: newUser.referredByCode,
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

    if (fullName) user.fullName = validateFullName(fullName);
    if (phoneNumber) {
      const validatedPhone = validateIndianMobile(phoneNumber);
      const conflict = await UserModel.findOne({
        phoneNumber: validatedPhone,
        _id: { $ne: user._id }
      })
        .select('_id')
        .lean();
      if (conflict) {
        throw new AppError(
          'This mobile number is already registered. Please use another number.',
          409,
          'MOBILE_EXISTS'
        );
      }
      user.phoneNumber = validatedPhone;
    }

    if (address) {
      user.address = validateAddressPayload({
        addressLine1: address.addressLine1 ?? user.address?.addressLine1,
        addressLine2: address.addressLine2 ?? user.address?.addressLine2,
        landmark: address.landmark ?? user.address?.landmark,
        country: address.country ?? user.address?.country ?? 'India',
        state: address.state ?? user.address?.state,
        district: address.district ?? user.address?.district,
        city: address.city ?? user.address?.city,
        pinCode: address.pinCode ?? user.address?.pinCode,
        addressType: address.addressType ?? user.address?.addressType ?? 'Residential'
      });
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
        isKycApproved: activation.checks.kycApproved,
        kycApproved: activation.checks.kycApproved,
        kycStatus: kycSnapshot.kycStatus,
        canAccessDashboard: activation.canAccessDashboard,
        activationChecks: activation.checks,
        isMembershipActive: activation.checks.membershipActive,
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

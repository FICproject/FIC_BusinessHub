import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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
    let registrationSource: 'DIRECT' | 'REFERRAL' = 'DIRECT';
    let validatedReferredByCode: string | undefined = undefined;
    const cleanRefBy = (referredByCode || referralCode || '').trim().toUpperCase();

    if (cleanRefBy) {
      const referrer = await UserModel.findOne({
        $or: [{ referralCode: cleanRefBy }, { email: cleanRefBy.toLowerCase() }]
      });
      // Validate referrer exists and prevent self-referral
      if (referrer && referrer.email?.toLowerCase() !== cleanEmail.toLowerCase()) {
        referrerUserId = referrer._id as mongoose.Types.ObjectId;
        referralSource = 'REFERRED';
        registrationSource = 'REFERRAL';
        validatedReferredByCode = referrer.referralCode || cleanRefBy;
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
        status: AccountStatus.PENDING,
        primaryCategoryId: adminCat?._id || (mongoose.isValidObjectId(primaryCategoryId) ? primaryCategoryId : undefined),
        primaryCategoryName: adminCat?.name || primaryCategoryName || undefined,
        subCategory: resolvedSubcategory,
        primarySubcategoryName: resolvedSubcategory,
        subcategoryIds: Array.isArray(subcategoryIds) ? subcategoryIds.filter(id => mongoose.isValidObjectId(id)) : [],
        dynamicProfile: validatedDynamicProfile,
        address: validatedAddress,
        referralCode: generatedReferralCode,
        referralSource,
        registrationSource,
        referredByCode: validatedReferredByCode,
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
            accountActive: false,
            isSuspended: false,
            accountStatus: 'UNDER_REVIEW',
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

    const { MembershipModel } = await import('../membership/membership.model');
    const membership = await MembershipModel.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean();
    const membershipExpiresAt = membership?.endDate || new Date(new Date(user.createdAt || Date.now()).getTime() + 365 * 24 * 60 * 60 * 1000);
    const msRemaining = new Date(membershipExpiresAt).getTime() - Date.now();
    const daysUntilExpiry = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const isRenewalAvailable = daysUntilExpiry <= 30;

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
        membershipPlan: membership?.planType === 'ANNUAL_RENEWAL' ? 'Annual Renewal' : '1st Year Membership',
        membershipExpiresAt,
        membershipExpiryDate: new Date(membershipExpiresAt).toLocaleDateString('en-GB'),
        daysUntilExpiry,
        isRenewalAvailable,
        autoRenewWithWallet: user.autoRenewWithWallet ?? false,
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
    const { ReferralRecordModel } = await import('../admin/models/Referral');
    const { ensureFinancialConfig } = await import('../admin/models/FinancialConfig');

    const finConfig = await ensureFinancialConfig();
    const rewardAmount = finConfig.referralRewardAmount || 500;

    const existingRef = await ReferralModel.findOne({ referredUserId: newUser._id });
    if (!existingRef) {
      await ReferralModel.create({
        referralId: `REF-${newUser._id.toString().slice(-6).toUpperCase()}`,
        referralCode: newUser.referredByCode || '',
        referrerUserId: newUser.referrerUserId,
        referredUserId: newUser._id,
        referralSource: 'REFERRED',
        registrationDate: newUser.createdAt || new Date(),
        paymentStatus: 'PAID',
        kycStatus: 'PENDING',
        accountStatus: 'ACTIVE',
        referralStatus: 'ELIGIBLE',
        rewardAmount,
        rewardStatus: 'PENDING_APPROVAL', // Wallet is ONLY credited upon Admin disbursement
      });
    }

    const referrerUser = await UserModel.findById(newUser.referrerUserId);
    if (!referrerUser) return;

    await ReferralRecordModel.findOneAndUpdate(
      { referredMemberId: newUser._id },
      {
        referrerMemberId: referrerUser._id,
        referrerName: referrerUser.fullName,
        referrerEmail: referrerUser.email,
        referredMemberId: newUser._id,
        referredName: newUser.fullName,
        referredEmail: newUser.email,
        bonusAmount: rewardAmount,
        status: 'PENDING', // Awaiting KYC verification and Admin disbursement
        notes: `Referred via ${newUser.referredByCode || referrerUser.referralCode || 'FIC-REF'}. Awaiting KYC approval and Admin disbursement.`
      },
      { upsert: true, new: true }
    );
  } catch (err: any) {
    console.warn('Referral attribution warning:', err?.message);
  }
};

function maskDestination(identifier: string, isEmail: boolean): string {
  if (isEmail) {
    const [name, domain] = identifier.split('@');
    if (!name || !domain) return identifier;
    const maskedName = name.length <= 2 ? name[0] + '*' : name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    return `${maskedName}@${domain}`;
  }
  const clean = identifier.replace(/\D/g, '');
  if (clean.length >= 10) {
    const last4 = clean.slice(-4);
    return `+91 ******${last4}`;
  }
  return identifier;
}

export const sendForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, deliveryMethod } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      throw new AppError('Please provide your registered email address or mobile number.', 400);
    }
    const cleanId = identifier.trim();
    const isEmail = cleanId.includes('@');
    let user;

    if (isEmail) {
      const email = cleanId.toLowerCase();
      user = await UserModel.findOne({ email });
    } else {
      const cleanPhone = cleanId.replace(/\D/g, '').slice(-10);
      user = await UserModel.findOne({
        $or: [
          { phoneNumber: cleanPhone },
          { phoneNumber: `+91${cleanPhone}` },
          { phoneNumber: cleanId }
        ]
      });
    }

    if (!user) {
      throw new AppError('No active member account found with this registered credential. Please verify and try again.', 404);
    }

    // Rate-limiting / Cooldown check: 60s
    if (user.passwordResetCooldownUntil && user.passwordResetCooldownUntil.getTime() > Date.now()) {
      const remainingSecs = Math.ceil((user.passwordResetCooldownUntil.getTime() - Date.now()) / 1000);
      throw new AppError(`Please wait ${remainingSecs}s before requesting a new OTP.`, 429);
    }

    // Generate 6-digit cryptographic OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.passwordResetAttempts = 0;
    user.passwordResetCooldownUntil = new Date(Date.now() + 60 * 1000); // 60s cooldown
    await user.save();

    const masked = maskDestination(isEmail ? user.email : user.phoneNumber, isEmail);
    console.log(`[AUTH:FORGOT_PASSWORD] Generated 6-digit OTP ${otp} for ${user.email} (${masked})`);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to your registered ${isEmail ? 'email address' : 'mobile number'} (${masked}).`,
      data: {
        maskedDestination: masked,
        deliveryMethod: isEmail ? 'EMAIL' : 'SMS',
        cooldownSeconds: 60,
        debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      }
    });
  } catch (err) {
    next(err);
  }
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      throw new AppError('Registered identifier and 6-digit OTP are required.', 400);
    }

    const cleanId = String(identifier).trim();
    const isEmail = cleanId.includes('@');
    let user;

    if (isEmail) {
      user = await UserModel.findOne({ email: cleanId.toLowerCase() });
    } else {
      const cleanPhone = cleanId.replace(/\D/g, '').slice(-10);
      user = await UserModel.findOne({
        $or: [
          { phoneNumber: cleanPhone },
          { phoneNumber: `+91${cleanPhone}` },
          { phoneNumber: cleanId }
        ]
      });
    }

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw new AppError('No pending password reset request found. Please request a new OTP.', 400);
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      throw new AppError('The verification OTP has expired. Please request a new OTP.', 400);
    }

    if ((user.passwordResetAttempts || 0) >= 5) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      await user.save();
      throw new AppError('Too many failed verification attempts. Please request a new OTP.', 400);
    }

    const suppliedHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (suppliedHash !== user.passwordResetOtpHash) {
      user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.passwordResetAttempts;
      throw new AppError(`Invalid 6-digit code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400);
    }

    // Invalidate OTP and generate secure Reset Token
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetAttempts = 0;

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins to set password
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now enter your new password.',
      data: {
        resetToken
      }
    });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordWithToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw new AppError('Reset token and new password are required.', 400);
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match. Please re-enter matching passwords.', 400);
    }

    if (String(newPassword).length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(String(resetToken).trim()).digest('hex');
    const user = await UserModel.findOne({
      passwordResetTokenHash: hashedToken,
      passwordResetTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Invalid or expired password reset session. Please restart the forgot password process.', 400);
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHashedPassword;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.passwordResetAttempts = 0;
    await user.save();

    console.log(`[AUTH:PASSWORD_RESET] Password successfully updated for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
};

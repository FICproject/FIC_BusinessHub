import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../users/users.model';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { JWTPayload, UserRole, AccountStatus } from '@fic/shared-types';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';

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

    // Synchronize to Admin Portal members collection in Atlas
    try {
      await mongoose.connection.collection('members').updateOne(
        { email: newUser.email.toLowerCase() },
        {
          $set: {
            name: newUser.fullName,
            email: newUser.email.toLowerCase(),
            phone: newUser.phoneNumber,
            primaryCategory: newUser.primaryCategoryId,
            primaryCategoryName: newUser.primaryCategoryName || '',
            subcategories: [newUser.subCategory || 'Member'],
            status: 'ACTIVE',
            membershipPlan: 'FIRST_YEAR_INTRO',
            membershipFeePaid: 99,
            paymentStatus: 'PAID',
            kycStatus: 'SUBMITTED',
            registeredAt: new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (adminSyncErr) {
      console.warn('Admin member sync warning:', adminSyncErr);
    }

    // If referred, create attributed Referral record
    if (referrerUserId) {
      try {
        const { ReferralModel } = await import('../referrals/referral.model');
        await ReferralModel.create({
          referralId: `REF_${Date.now()}`,
          referralCode: cleanRefBy,
          referrerUserId,
          referredUserId: newUser._id,
          referralSource: 'REFERRED',
          registrationDate: new Date(),
          paymentStatus: 'PAID',
          kycStatus: 'PENDING',
          accountStatus: 'ACTIVE',
          referralStatus: 'ELIGIBLE',
          rewardAmount: 500,
          rewardStatus: 'PENDING_APPROVAL'
        });
      } catch (err: any) {
        console.warn('Referral creation warning:', err?.message);
      }
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
          isKycApproved: newUser.isKycApproved,
          isMembershipActive: newUser.isMembershipActive
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

    if (user.status !== AccountStatus.ACTIVE) {
      throw new AppError('Your account has been deactivated or suspended. Please contact FIC support.', 403, 'ACCOUNT_INACTIVE');
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      role: user.role,
      primaryCategoryId: user.primaryCategoryId?.toString(),
      isKycApproved: user.isKycApproved,
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
          primaryCategoryId: user.primaryCategoryId,
          primaryCategoryName: user.primaryCategoryName,
          subCategory: user.subCategory,
          primarySubcategoryName: user.primarySubcategoryName,
          subcategories: user.subCategory ? [user.subCategory] : [],
          subcategoryIds: user.subcategoryIds,
          address: user.address,
          referralCode: user.referralCode,
          isKycApproved: user.isKycApproved,
          isMembershipActive: user.isMembershipActive
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

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};


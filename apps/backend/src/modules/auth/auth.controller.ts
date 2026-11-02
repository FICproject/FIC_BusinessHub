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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const resolvedSubcategory =
      primarySubcategoryName ||
      subCategory ||
      (Array.isArray(subcategoryIds) && subcategoryIds.length > 0 ? subcategoryIds[0] : 'Member');

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
      isEmailVerified: true, // simplified for onboarding
      isPhoneVerified: true,
      isKycApproved: false,
      isMembershipActive: false
    });

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
    const { identifier, password } = req.body;

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
          isKycApproved: user.isKycApproved,
          isMembershipActive: user.isMembershipActive
        }
      }
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


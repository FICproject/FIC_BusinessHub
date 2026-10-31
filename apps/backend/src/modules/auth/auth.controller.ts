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
    const { fullName, email, phoneNumber, password, primaryCategoryId, subcategoryIds, ageConfirmed, termsAccepted } = req.body;

    if (!ageConfirmed) {
      throw new AppError('You must be at least 18 years of age to register for FIC Business Hub.', 400, 'UNDERAGE_NOT_PERMITTED');
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

    const newUser = await UserModel.create({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      passwordHash,
      role: UserRole.MEMBER,
      status: AccountStatus.ACTIVE,
      primaryCategoryId,
      subcategoryIds: subcategoryIds || [],
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
          role: newUser.role,
          primaryCategoryId: newUser.primaryCategoryId,
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
          role: user.role,
          primaryCategoryId: user.primaryCategoryId,
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


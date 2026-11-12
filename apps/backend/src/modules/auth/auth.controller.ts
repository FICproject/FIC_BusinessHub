import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../users/users.model';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { JWTPayload, UserRole, AccountStatus, KYCStatus } from '@fic/shared-types';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { MemberModel } from '../admin/models/Member';
import { KycSubmissionModel as AdminKycSubmissionModel } from '../admin/models/KycSubmission';
import { KYCSubmissionModel } from '../kyc/kyc.model';

export async function resolveUserKycSnapshot(user: {
  _id: any;
  email?: string;
  isKycApproved?: boolean;
}) {
  const email = user.email?.toLowerCase();
  const [adminSub, customerSub, memberRecord] = await Promise.all([
    AdminKycSubmissionModel.findOne({
      $or: [{ memberId: user._id }, ...(email ? [{ memberEmail: email }] : [])]
    })
      .sort({ updatedAt: -1, submittedAt: -1 })
      .lean() as Promise<any>,
    KYCSubmissionModel.findOne({ userId: user._id })
      .sort({ updatedAt: -1 })
      .lean() as Promise<any>,
    MemberModel.findOne({
      $or: [{ _id: user._id }, ...(email ? [{ email }] : [])]
    }).lean() as Promise<any>
  ]);

  let kycStatus = 'NOT_SUBMITTED';
  let rejectionReason: string | undefined;
  let reviewerNotes: string | undefined;
  let reviewedAt: Date | string | undefined;
  let submittedAt: Date | string | undefined;

  if (adminSub?.status) {
    kycStatus = adminSub.status === 'RESUBMIT_REQUIRED' ? 'RESUBMISSION_REQUESTED' : String(adminSub.status);
    rejectionReason = adminSub.rejectionReason || customerSub?.rejectionReason || undefined;
    reviewerNotes = adminSub.reviewerNotes || undefined;
    reviewedAt = adminSub.verifiedAt || adminSub.updatedAt || customerSub?.reviewedAt || undefined;
    submittedAt = adminSub.submittedAt || customerSub?.createdAt || undefined;
  } else if (customerSub?.status) {
    const raw = String(customerSub.status);
    if (raw === 'NOT_SUBMITTED' && memberRecord?.kycStatus && memberRecord.kycStatus !== 'NOT_SUBMITTED') {
      kycStatus =
        memberRecord.kycStatus === 'RESUBMIT_REQUIRED'
          ? 'RESUBMISSION_REQUESTED'
          : String(memberRecord.kycStatus);
    } else {
      kycStatus =
        raw === 'PENDING'
          ? 'SUBMITTED'
          : raw === 'RESUBMIT_REQUIRED'
          ? 'RESUBMISSION_REQUESTED'
          : raw;
    }
    rejectionReason = customerSub.rejectionReason || undefined;
    reviewedAt = customerSub.reviewedAt || undefined;
    submittedAt = customerSub.createdAt || undefined;
  } else if (memberRecord?.kycStatus) {
    kycStatus =
      memberRecord.kycStatus === 'RESUBMIT_REQUIRED'
        ? 'RESUBMISSION_REQUESTED'
        : String(memberRecord.kycStatus);
    submittedAt = memberRecord.registeredAt || undefined;
  } else if (user.isKycApproved) {
    kycStatus = 'APPROVED';
  }

  return {
    kycStatus,
    isKycApproved: kycStatus === 'APPROVED',
    rejectionReason,
    reviewerNotes,
    reviewedAt,
    submittedAt
  };
}

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

    // Synchronize to Admin Portal members collection and initialize customer KYC record without mutating immutable _id
    try {
      await MemberModel.findOneAndUpdate(
        { $or: [{ _id: newUser._id }, { email: newUser.email.toLowerCase() }] },
        {
          $setOnInsert: {
            _id: newUser._id,
            registeredAt: new Date()
          },
          $set: {
            name: newUser.fullName,
            email: newUser.email.toLowerCase(),
            phone: newUser.phoneNumber,
            primaryCategory: newUser.primaryCategoryId,
            primaryCategoryName: newUser.primaryCategoryName || '',
            subcategories: [newUser.subCategory || newUser.primarySubcategoryName || 'Member'].filter(Boolean),
            status: 'PENDING_KYC',
            membershipPlan: 'FIRST_YEAR_INTRO',
            membershipFeePaid: 0,
            paymentStatus: 'PENDING',
            kycStatus: 'NOT_SUBMITTED'
          }
        },
        { upsert: true, new: true }
      );

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
    } catch (adminSyncErr) {
      console.warn('Admin member sync warning:', adminSyncErr);
    }

    // If referred, create attributed Referral record for customer and admin portals
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
          rewardStatus: 'CREDITED',
          approvedBy: 'System Auto-Credit',
          approvedAt: new Date(),
          creditedAt: new Date()
        });

        // Also create / upsert Admin ReferralRecordModel for Admin Referral Bonus Desk
        const referrerUser = await UserModel.findById(referrerUserId);
        if (referrerUser) {
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

          // Credit referrer's admin wallet
          const { MemberWalletModel } = await import('../admin/models/MemberWallet');
          let rWallet = await MemberWalletModel.findOne({
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
        }
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

    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      throw new AppError('Your account has been deactivated or suspended. Please contact FIC support.', 403, 'ACCOUNT_INACTIVE');
    }

    const kycSnapshot = await resolveUserKycSnapshot(user);

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

    const kycSnapshot = await resolveUserKycSnapshot(user);
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


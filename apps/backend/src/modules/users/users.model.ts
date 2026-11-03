import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, AccountStatus } from '@fic/shared-types';

export interface IUserAddress {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  country: string;
  state: string;
  district: string;
  city: string;
  pinCode: string;
  addressType?: string;
}

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  dob?: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  primaryCategoryId?: mongoose.Types.ObjectId;
  primaryCategoryName?: string;
  subCategory?: string;
  primarySubcategoryName?: string;
  subcategoryIds: mongoose.Types.ObjectId[];
  dynamicProfile?: Record<string, any>;
  address?: IUserAddress;
  referralCode?: string;
  referralSource?: 'REFERRED' | 'ORGANIC';
  referredByCode?: string;
  referrerUserId?: mongoose.Types.ObjectId;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycApproved: boolean;
  isMembershipActive: boolean;
  activeMembershipId?: mongoose.Types.ObjectId;
  activeKycSubmissionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    dob: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE
    },
    primaryCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    primaryCategoryName: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    primarySubcategoryName: { type: String, trim: true },
    subcategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Subcategory' }],
    dynamicProfile: { type: Schema.Types.Mixed },
    address: {
      addressLine1: { type: String, trim: true },
      addressLine2: { type: String, trim: true },
      landmark: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      city: { type: String, trim: true },
      pinCode: { type: String, trim: true },
      addressType: { type: String, trim: true, default: 'Residential' }
    },
    referralCode: { type: String, trim: true },
    referralSource: { type: String, enum: ['REFERRED', 'ORGANIC'], default: 'ORGANIC' },
    referredByCode: { type: String, trim: true },
    referrerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isKycApproved: { type: Boolean, default: false },
    isMembershipActive: { type: Boolean, default: false },
    activeMembershipId: { type: Schema.Types.ObjectId, ref: 'Membership' },
    activeKycSubmissionId: { type: Schema.Types.ObjectId, ref: 'KYCSubmission' }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);


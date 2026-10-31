import { UserRole, AccountStatus } from './auth.types';

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: AccountStatus;
  primaryCategoryId?: string;
  subcategoryIds?: string[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycApproved: boolean;
  isMembershipActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}


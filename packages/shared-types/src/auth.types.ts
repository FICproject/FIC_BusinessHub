export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VERIFICATION_EXECUTIVE = 'VERIFICATION_EXECUTIVE',
  MEMBER = 'MEMBER'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED'
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  primaryCategoryId?: string;
  isKycApproved: boolean;
  isMembershipActive: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}


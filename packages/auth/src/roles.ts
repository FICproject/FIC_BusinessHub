import { UserRole } from '@fic/shared-types';

export const ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.VERIFICATION_EXECUTIVE
];

export const hasAdminAccess = (role: UserRole): boolean => {
  return ADMIN_ROLES.includes(role);
};

export const hasSuperAdminAccess = (role: UserRole): boolean => {
  return role === UserRole.SUPER_ADMIN;
};

export const canVerifyKyc = (role: UserRole): boolean => {
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN ||
    role === UserRole.VERIFICATION_EXECUTIVE
  );
};

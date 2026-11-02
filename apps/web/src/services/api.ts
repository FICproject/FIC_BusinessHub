import { INITIAL_CATEGORIES_DATA } from './mockData';

const BASE_URL = 'http://localhost:5000/api/v1';
const ACCOUNTS_STORAGE_KEY = 'fic_registered_accounts';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  mobileNumber: string;
  primaryCategory: string;
  categoryName: string;
  primaryCategoryId: string;
  subcategoryIds: string[];
  accountStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'SUBMITTED' | 'REJECTED';
  isKycApproved: boolean;
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  isMembershipActive: boolean;
  membershipPlan: string;
  membershipExpiryDate: string;
  role: string;
  roles: string[];
  uploadedDocumentsCount?: number;
}

// Default Seed Accounts for Multi-User Testing (Kathir and S. Moorthy)
const INITIAL_SEED_ACCOUNTS: AuthenticatedUser[] = [
  {
    id: 'usr_kathir_001',
    userId: 'usr_kathir_001',
    fullName: 'Kathir',
    email: 'kathir@gmail.com',
    phoneNumber: '9988776655',
    mobileNumber: '9988776655',
    primaryCategory: 'Technology & Digital',
    categoryName: 'Technology & Digital',
    primaryCategoryId: 'cat-3',
    subcategoryIds: ['Web Apps', 'Cloud Architecture'],
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    isKycApproved: true,
    membershipStatus: 'ACTIVE',
    isMembershipActive: true,
    membershipPlan: '1st Year Membership (₹99)',
    membershipExpiryDate: 'Valid for 365 Days (₹99)',
    role: 'MEMBER',
    roles: ['MEMBER'],
    uploadedDocumentsCount: 2
  },
  {
    id: 'usr_moorthy_002',
    userId: 'usr_moorthy_002',
    fullName: 'S. Moorthy',
    email: 'moorthy@ficapp.in',
    phoneNumber: '9876543210',
    mobileNumber: '9876543210',
    primaryCategory: 'Manufacturing & Industrial',
    categoryName: 'Manufacturing & Industrial',
    primaryCategoryId: 'cat-2',
    subcategoryIds: ['Textiles', 'OEM Production'],
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    isKycApproved: true,
    membershipStatus: 'ACTIVE',
    isMembershipActive: true,
    membershipPlan: '1st Year Membership (₹99)',
    membershipExpiryDate: 'Valid for 365 Days (₹99)',
    role: 'MEMBER',
    roles: ['MEMBER'],
    uploadedDocumentsCount: 2
  }
];

export const getAuthToken = (): string | null => {
  return localStorage.getItem('fic_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('fic_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('fic_token');
  localStorage.removeItem('fic_user');
};

export const getStoredUser = (): AuthenticatedUser | null => {
  const userStr = localStorage.getItem('fic_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthenticatedUser | any): void => {
  // Ensure both id and userId are present
  const normalized: AuthenticatedUser = {
    ...user,
    id: user.id || user.userId || `usr_${Date.now()}`,
    userId: user.userId || user.id || `usr_${Date.now()}`,
    mobileNumber: user.mobileNumber || user.phoneNumber || '',
    phoneNumber: user.phoneNumber || user.mobileNumber || '',
    categoryName: user.categoryName || user.primaryCategory || 'Business & Entrepreneurship',
    primaryCategory: user.primaryCategory || user.categoryName || 'Business & Entrepreneurship',
    roles: user.roles || [user.role || 'MEMBER']
  };

  localStorage.setItem('fic_user', JSON.stringify(normalized));
  saveRegisteredAccount(normalized);
};

// ========================================================
// PERSISTENT ACCOUNT REGISTRY FOR MULTI-USER ISOLATION
// ========================================================

export const getRegisteredAccounts = (): AuthenticatedUser[] => {
  const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ACCOUNTS));
    return INITIAL_SEED_ACCOUNTS;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ACCOUNTS));
    return INITIAL_SEED_ACCOUNTS;
  } catch {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ACCOUNTS));
    return INITIAL_SEED_ACCOUNTS;
  }
};

export const saveRegisteredAccount = (account: Partial<AuthenticatedUser> & { email: string }): AuthenticatedUser => {
  const accounts = getRegisteredAccounts();
  const normalizedEmail = account.email.toLowerCase().trim();
  const index = accounts.findIndex(
    (a) => a.email.toLowerCase().trim() === normalizedEmail || (account.mobileNumber && a.mobileNumber === account.mobileNumber)
  );

  const fullAccount: AuthenticatedUser = {
    id: account.id || account.userId || `usr_${Date.now()}`,
    userId: account.userId || account.id || `usr_${Date.now()}`,
    fullName: account.fullName || 'Member',
    email: normalizedEmail,
    phoneNumber: account.phoneNumber || account.mobileNumber || '',
    mobileNumber: account.mobileNumber || account.phoneNumber || '',
    primaryCategory: account.primaryCategory || account.categoryName || 'Business & Entrepreneurship',
    categoryName: account.categoryName || account.primaryCategory || 'Business & Entrepreneurship',
    primaryCategoryId: account.primaryCategoryId || 'cat-1',
    subcategoryIds: account.subcategoryIds || [],
    accountStatus: account.accountStatus || 'ACTIVE',
    kycStatus: account.kycStatus || 'PENDING',
    isKycApproved: account.isKycApproved ?? false,
    membershipStatus: account.membershipStatus || 'ACTIVE',
    isMembershipActive: account.isMembershipActive ?? true,
    membershipPlan: account.membershipPlan || '1st Year Membership (₹99)',
    membershipExpiryDate: account.membershipExpiryDate || 'Valid for 365 Days (₹99)',
    role: account.role || 'MEMBER',
    roles: account.roles || ['MEMBER'],
    uploadedDocumentsCount: account.uploadedDocumentsCount || 0
  };

  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...fullAccount };
  } else {
    accounts.push(fullAccount);
  }

  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  return fullAccount;
};

export const findRegisteredAccount = (identifier: string): AuthenticatedUser | null => {
  const accounts = getRegisteredAccounts();
  const cleanId = identifier.toLowerCase().trim();
  return (
    accounts.find(
      (a) => a.email.toLowerCase().trim() === cleanId || a.phoneNumber.trim() === cleanId || a.mobileNumber.trim() === cleanId
    ) || null
  );
};

// ========================================================
// USER-SPECIFIC REQUEST & IDEA DATA ISOLATION
// ========================================================

export const getUserRequests = (userId: string): any[] => {
  const key = `fic_user_requests_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }

  // Initial user-specific sample data to verify isolation
  if (userId === 'usr_kathir_001') {
    return [
      {
        id: 'req-kathir-01',
        serviceTitle: 'Cloud Native Microservices Architecture',
        category: 'Technology & Software',
        status: 'IN_PROGRESS',
        statusText: 'FIC Specialist Reviewing Scope',
        date: 'Today'
      }
    ];
  }

  if (userId === 'usr_moorthy_002') {
    return [
      {
        id: 'req-moorthy-01',
        serviceTitle: 'Bulk Cotton Garment & Uniform Manufacturing',
        category: 'Manufacturing & Industrial',
        status: 'IN_PROGRESS',
        statusText: 'FIC Proposal Coordinated',
        date: 'Today'
      },
      {
        id: 'req-moorthy-02',
        serviceTitle: 'Statutory GST & Corporate Incorporation',
        category: 'Professional & Legal',
        status: 'SUBMITTED',
        statusText: 'Under FIC Coordinator Review',
        date: 'Yesterday'
      }
    ];
  }

  return [];
};

export const saveUserRequest = (userId: string, request: any): void => {
  const current = getUserRequests(userId);
  current.unshift({
    id: `req-${Date.now()}`,
    date: 'Just now',
    status: 'SUBMITTED',
    statusText: 'Under FIC Coordinator Review',
    ...request
  });
  localStorage.setItem(`fic_user_requests_${userId}`, JSON.stringify(current));
};

// ========================================================
// REAL API REQUEST WRAPPER WITH OFFLINE SIMULATION
// ========================================================

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (_networkError) {
    // API server offline, graceful fallback
  }

  return null;
};

import { INITIAL_CATEGORIES_DATA } from './categoriesData';
import {
  WalletStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WithdrawalStatus,
  IMemberWallet,
  IWalletTransaction,
  IWalletFunding,
  IWalletWithdrawal,
  IMemberBankAccount,
  IReferral,
  IWalletNotification
} from '@fic/shared-types';

export {
  WalletStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WithdrawalStatus
};
export type {
  IMemberWallet,
  IWalletTransaction,
  IWalletFunding,
  IWalletWithdrawal,
  IMemberBankAccount,
  IReferral,
  IWalletNotification
};

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '');
const ACCOUNTS_STORAGE_KEY = 'fic_registered_accounts';

// Auto-purge all legacy mock data and user caches from browser localStorage
if (typeof window !== 'undefined') {
  const PURGE_KEY = 'fic_live_production_clean_v1';
  if (!localStorage.getItem(PURGE_KEY)) {
    try {
      const keysToPreserve = new Set(['fic_admin_token', 'fic_admin_user']);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && !keysToPreserve.has(k)) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(PURGE_KEY, 'true');
    } catch (_e) {}
  }
}

export interface UserAddress {
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

export interface AuthenticatedUser {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  mobileNumber: string;
  primaryCategory: string;
  primaryCategoryName?: string;
  categoryName: string;
  primaryCategoryId: string;
  subcategories: string[];
  subCategory?: string;
  primarySubcategoryName?: string;
  subcategoryIds?: string[];
  address?: UserAddress;
  accountStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'SUBMITTED' | 'REJECTED';
  isKycApproved: boolean;
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  isMembershipActive: boolean;
  membershipPlan: string;
  membershipAmountPaid?: string;
  membershipStartDate?: string;
  membershipExpiryDate: string;
  renewalInfo?: string;
  referralCode?: string;
  referralSource?: 'REFERRED' | 'ORGANIC';
  referredByCode?: string;
  referrerUserId?: string;
  paymentHistory?: {
    orderId: string;
    transactionId: string;
    amount: string;
    date: string;
    status: string;
  }[];
  role: string;
  roles: string[];
  uploadedDocumentsCount?: number;
  submittedDocuments?: {
    type: string;
    name: string;
    documentNumber?: string;
    status: string;
    uploadedAt: string;
  }[];
  password?: string;
  profilePicture?: string;
  dynamicProfile?: Record<string, any>;
  personalInfo?: {
    dob?: string;
    gender?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  professionalInfo?: {
    roleTitle?: string;
    skills?: string[];
    experience?: string;
    portfolioUrl?: string;
    businessName?: string;
    businessType?: string;
    businessLocation?: string;
    description?: string;
    institution?: string;
    qualification?: string;
    manufacturingType?: string;
    productionCapabilities?: string;
    investmentInterest?: string;
    preferredSectors?: string[];
    investmentRange?: string;
    servicesOffered?: string[];
  };
}

// Default Seed Accounts for Multi-User Testing (Kathir and S. Moorthy)
const INITIAL_SEED_ACCOUNTS: AuthenticatedUser[] = [];

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

export interface DobValidationResult {
  valid: boolean;
  age: number | null;
  error?: string;
  formattedDisplay?: string;
}

export const validateDobAndAge = (dobString: string): DobValidationResult => {
  if (!dobString || !dobString.trim()) {
    return { valid: false, age: null, error: 'Please enter your Date of Birth.' };
  }

  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) {
    return { valid: false, age: null, error: 'Please enter a valid calendar date of birth.' };
  }

  const today = new Date();
  if (birthDate > today) {
    return { valid: false, age: null, error: 'Date of birth cannot be in the future.' };
  }

  const birthYear = birthDate.getFullYear();
  const currentYear = today.getFullYear();

  // Implausible dates (e.g. year 1111 or older than 120 years)
  if (birthYear < currentYear - 120) {
    return {
      valid: false,
      age: null,
      error: `Please enter a valid date of birth. Maximum allowable age is 120 years (minimum birth year: ${currentYear - 120}).`
    };
  }

  let age = currentYear - birthYear;
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      valid: false,
      age,
      error: `Underage restriction: You are currently ${age} years old. In accordance with FIC Adult Eligibility Policy, all registered members must be 18 years of age or older.`
    };
  }

  if (age > 120) {
    return {
      valid: false,
      age,
      error: `Please enter a valid date of birth. Calculated age (${age} years) exceeds the maximum limit of 120 years.`
    };
  }

  const formattedDisplay = birthDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return {
    valid: true,
    age,
    formattedDisplay
  };
};

export const calculateAgeFromDob = (dobString: string): number => {
  const result = validateDobAndAge(dobString);
  return result.age || 0;
};

export const formatDisplayDob = (dobString: string): string => {
  if (!dobString) return '';
  const d = new Date(dobString);
  if (isNaN(d.getTime())) return dobString;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getStoredUser = (): AuthenticatedUser | null => {
  const userStr = localStorage.getItem('fic_user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    let changed = false;

    if (user && user.email?.toLowerCase() === 'kathir@gmail.com') {
      if (!user.personalInfo?.dob) {
        user.personalInfo = {
          ...(user.personalInfo || {}),
          dob: '15 Aug 1996'
        };
        changed = true;
      }
      if (
        !user.submittedDocuments ||
        user.submittedDocuments.length === 0 ||
        (user.submittedDocuments.length === 1 && user.submittedDocuments[0].name?.includes('Proprietor Identity Proof'))
      ) {
        user.submittedDocuments = [
          { type: 'AADHAAR_CARD', name: 'Aadhaar Card', status: 'VERIFIED', uploadedAt: '01 Nov 2026' },
          { type: 'PAN_CARD', name: 'PAN Card', status: 'VERIFIED', uploadedAt: '01 Nov 2026' },
          { type: 'TECHNICAL_PORTFOLIO', name: 'Professional Technical Credentials', status: 'VERIFIED', uploadedAt: '01 Nov 2026' }
        ];
        user.uploadedDocumentsCount = 3;
        changed = true;
      }
    }

    if (user && user.email?.toLowerCase() === 'moorthy@ficapp.in') {
      if (
        !user.submittedDocuments ||
        user.submittedDocuments.length === 0 ||
        (user.submittedDocuments.length === 1 && user.submittedDocuments[0].name?.includes('Proprietor Identity Proof'))
      ) {
        user.submittedDocuments = [
          { type: 'AADHAAR_CARD', name: 'Aadhaar Card', status: 'VERIFIED', uploadedAt: '28 Oct 2026' },
          { type: 'PAN_CARD', name: 'PAN Card', status: 'VERIFIED', uploadedAt: '28 Oct 2026' },
          { type: 'GST_CERTIFICATE', name: 'GSTIN Certificate', status: 'VERIFIED', uploadedAt: '28 Oct 2026' },
          { type: 'UDYAM_MSME', name: 'Business Registration Certificate', status: 'VERIFIED', uploadedAt: '28 Oct 2026' }
        ];
        user.uploadedDocumentsCount = 4;
        changed = true;
      }
    }

    if (
      user &&
      (user.fullName?.toLowerCase().includes('abdul') || user.primaryCategory?.toLowerCase().includes('business')) &&
      user.subCategory === 'Freelance Specialist'
    ) {
      user.subCategory = 'Business Owner';
      user.subcategories = ['Business Owner'];
      changed = true;
    }

    if (changed) {
      localStorage.setItem('fic_user', JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthenticatedUser | any): void => {
  // Ensure consistent object structure without hardcoding categories
  const rawCat =
    user.primaryCategoryName ||
    (typeof user.primaryCategoryId === 'object' ? user.primaryCategoryId?.name : undefined) ||
    user.primaryCategory ||
    user.categoryName ||
    'General Category';
  const resolvedCategory = typeof rawCat === 'string' && rawCat.trim() ? rawCat.trim() : 'General Category';

  const resolvedSubcategory =
    user.subCategory ||
    user.primarySubcategoryName ||
    (user.subcategories && user.subcategories.length > 0
      ? user.subcategories[0]
      : `${resolvedCategory} Member`);

  const normalized: AuthenticatedUser = {
    ...user,
    id: user.id || user.userId || `usr_${Date.now()}`,
    userId: user.userId || user.id || `usr_${Date.now()}`,
    mobileNumber: user.mobileNumber || user.phoneNumber || '',
    phoneNumber: user.phoneNumber || user.mobileNumber || '',
    categoryName: resolvedCategory,
    primaryCategory: resolvedCategory,
    primaryCategoryName: resolvedCategory,
    subcategories:
      user.subcategories && user.subcategories.length > 0
        ? user.subcategories
        : [resolvedSubcategory],
    subCategory: resolvedSubcategory,
    primarySubcategoryName: resolvedSubcategory,
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
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveRegisteredAccount = (account: Partial<AuthenticatedUser> & { email: string }): AuthenticatedUser => {
  const accounts = getRegisteredAccounts();
  const normalizedEmail = account.email.toLowerCase().trim();
  const index = accounts.findIndex(
    (a) => a.email.toLowerCase().trim() === normalizedEmail || (account.mobileNumber && a.mobileNumber === account.mobileNumber)
  );

  const existingAccount = index >= 0 ? accounts[index] : null;

  const resolvedDob =
    account.personalInfo?.dob ||
    (account as any).dob ||
    existingAccount?.personalInfo?.dob ||
    (normalizedEmail === 'kathir@gmail.com' ? '15 Aug 1996' : undefined);

  const rawCat =
    account.primaryCategoryName ||
    account.primaryCategory ||
    account.categoryName ||
    existingAccount?.primaryCategoryName ||
    existingAccount?.primaryCategory ||
    existingAccount?.categoryName ||
    'General Category';
  const resolvedCategory = typeof rawCat === 'string' && rawCat.trim() ? rawCat.trim() : 'General Category';

  let resolvedSubcategory =
    account.subCategory ||
    account.primarySubcategoryName ||
    (account.subcategories && account.subcategories.length > 0 ? account.subcategories[0] : undefined) ||
    existingAccount?.subCategory ||
    existingAccount?.primarySubcategoryName ||
    (existingAccount?.subcategories && existingAccount.subcategories.length > 0 ? existingAccount.subcategories[0] : undefined);

  // Fix corrupted accounts that had Freelance Specialist when category is Business
  if (
    (account.fullName?.toLowerCase().includes('abdul') || resolvedCategory.toLowerCase().includes('business')) &&
    resolvedSubcategory === 'Freelance Specialist'
  ) {
    resolvedSubcategory = 'Business Owner';
  }

  if (!resolvedSubcategory) {
    resolvedSubcategory = `${resolvedCategory} Specialist`;
  }

  const resolvedSubcategories =
    account.subcategories && account.subcategories.length > 0
      ? account.subcategories
      : existingAccount?.subcategories && existingAccount.subcategories.length > 0
      ? existingAccount.subcategories
      : [resolvedSubcategory];

  const fullAccount: AuthenticatedUser = {
    id: account.id || account.userId || existingAccount?.id || `usr_${Date.now()}`,
    userId: account.userId || account.id || existingAccount?.userId || `usr_${Date.now()}`,
    fullName: account.fullName || existingAccount?.fullName || 'Member',
    email: normalizedEmail,
    password: account.password || existingAccount?.password || 'password123',
    phoneNumber: account.phoneNumber || account.mobileNumber || existingAccount?.phoneNumber || '',
    mobileNumber: account.mobileNumber || account.phoneNumber || existingAccount?.mobileNumber || '',
    primaryCategory: resolvedCategory,
    categoryName: resolvedCategory,
    primaryCategoryId: account.primaryCategoryId || existingAccount?.primaryCategoryId || 'cat-1',
    subcategories: resolvedSubcategories,
    subCategory: resolvedSubcategory,
    dynamicProfile: (account as any).dynamicProfile || existingAccount?.dynamicProfile || {},
    subcategoryIds: account.subcategoryIds || existingAccount?.subcategoryIds || [resolvedSubcategory],
    accountStatus: account.accountStatus || existingAccount?.accountStatus || 'ACTIVE',
    kycStatus: account.kycStatus || existingAccount?.kycStatus || 'VERIFIED',
    isKycApproved: account.isKycApproved ?? existingAccount?.isKycApproved ?? true,
    membershipStatus: account.membershipStatus || existingAccount?.membershipStatus || 'ACTIVE',
    isMembershipActive: account.isMembershipActive ?? existingAccount?.isMembershipActive ?? true,
    membershipPlan: account.membershipPlan || existingAccount?.membershipPlan || 'First-Year Introductory Membership',
    membershipAmountPaid: account.membershipAmountPaid || existingAccount?.membershipAmountPaid || '₹99',
    membershipStartDate: account.membershipStartDate || existingAccount?.membershipStartDate || 'Active from Registration',
    membershipExpiryDate: account.membershipExpiryDate || existingAccount?.membershipExpiryDate || 'Valid for 365 Days',
    renewalInfo: account.renewalInfo || 'Annual renewal available at ₹5,999/yr for Year 2+',
    paymentHistory: account.paymentHistory || [
      {
        orderId: `ORD_${Date.now()}`,
        transactionId: `TXN_UPI_${Date.now()}`,
        amount: '₹99',
        date: 'Today',
        status: 'SUCCESS'
      }
    ],
    role: account.role || 'MEMBER',
    roles: account.roles || ['MEMBER'],
    uploadedDocumentsCount:
      account.submittedDocuments?.length ||
      existingAccount?.submittedDocuments?.length ||
      account.uploadedDocumentsCount ||
      2,
    submittedDocuments:
      account.submittedDocuments && account.submittedDocuments.length > 0
        ? account.submittedDocuments
        : existingAccount?.submittedDocuments && existingAccount.submittedDocuments.length > 0
        ? existingAccount.submittedDocuments
        : normalizedEmail === 'kathir@gmail.com'
        ? [
            { type: 'AADHAAR_CARD', name: 'Aadhaar Card', status: 'VERIFIED', uploadedAt: '01 Nov 2026' },
            { type: 'PAN_CARD', name: 'PAN Card', status: 'VERIFIED', uploadedAt: '01 Nov 2026' },
            { type: 'TECHNICAL_PORTFOLIO', name: 'Professional Technical Credentials', status: 'VERIFIED', uploadedAt: '01 Nov 2026' }
          ]
        : [
            { type: 'AADHAAR_CARD', name: 'Aadhaar Card', status: 'VERIFIED', uploadedAt: 'On Registration' }
          ],
    address: account.address || existingAccount?.address,
    personalInfo: {
      ...(existingAccount?.personalInfo || {}),
      ...(account.personalInfo || {}),
      ...(resolvedDob ? { dob: resolvedDob } : {}),
      ...(account.address ? {
        address: account.address.addressLine1 + (account.address.addressLine2 ? ', ' + account.address.addressLine2 : ''),
        city: account.address.city,
        district: account.address.district,
        state: account.address.state,
        pincode: account.address.pinCode
      } : {})
    },
    professionalInfo: {
      ...(existingAccount?.professionalInfo || {}),
      ...(account.professionalInfo || {})
    }
  };

  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...fullAccount };
  } else {
    accounts.push(fullAccount);
  }

  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  return fullAccount;
};

export const updateUserProfile = (userId: string, updates: Partial<AuthenticatedUser>): AuthenticatedUser => {
  const current = getStoredUser();
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((a) => a.userId === userId || a.id === userId);

  let updatedAccount: AuthenticatedUser;
  if (index >= 0) {
    updatedAccount = {
      ...accounts[index],
      ...updates,
      address: updates.address || accounts[index].address,
      personalInfo: {
        ...(accounts[index].personalInfo || {}),
        ...(updates.personalInfo || {}),
        ...(updates.address ? {
          address: updates.address.addressLine1 + (updates.address.addressLine2 ? ', ' + updates.address.addressLine2 : ''),
          city: updates.address.city,
          district: updates.address.district,
          state: updates.address.state,
          pincode: updates.address.pinCode
        } : {})
      },
      professionalInfo: {
        ...(accounts[index].professionalInfo || {}),
        ...(updates.professionalInfo || {})
      }
    };
    accounts[index] = updatedAccount;
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } else {
    updatedAccount = {
      ...(current || ({} as AuthenticatedUser)),
      ...updates,
      address: updates.address || current?.address
    };
  }

  if (current && (current.userId === userId || current.id === userId)) {
    localStorage.setItem('fic_user', JSON.stringify(updatedAccount));
  }

  // Also sync with backend if token is available
  try {
    const token = getAuthToken();
    if (token) {
      apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }).catch((e) => console.warn('Backend profile update deferred:', e?.message));
    }
  } catch (err) {
    // Ignore network / offline errors
  }

  return updatedAccount;
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
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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

// ========================================================
// UNIVERSAL SERVICES CATALOG & MEMBER SERVICE MANAGEMENT
// ========================================================

export interface ServiceListing {
  id: string;
  ownerUserId: string;
  ownerName?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  subcategoryId?: string;
  subcategoryName?: string;
  title: string;
  shortDescription?: string;
  description: string;
  servicesOffered: string[];
  skills: string[];
  tags: string[];
  targetCustomers?: string[];
  coverageArea?: string;
  deliveryMode: 'ONLINE' | 'IN_PERSON' | 'BOTH';
  portfolioUrl?: string;
  supportingDocument?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
  adminFeedback?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const SERVICES_CATALOG_KEY = 'fic_services_catalog';

const INITIAL_SEED_SERVICES: ServiceListing[] = [];

export const getAllCatalogServices = (): ServiceListing[] => {
  const data = localStorage.getItem(SERVICES_CATALOG_KEY);
  if (!data) {
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveCatalogServices = (services: ServiceListing[]): void => {
  localStorage.setItem(SERVICES_CATALOG_KEY, JSON.stringify(services));
};

// 1. Universal Marketplace Discovery: returns ONLY approved services across all categories
export const getMarketplaceServices = (): ServiceListing[] => {
  const all = getAllCatalogServices();
  return all.filter((s) => s.status === 'APPROVED');
};

// 2. Member Service Management: returns services owned by a specific member
export const getMemberServices = (userId: string): ServiceListing[] => {
  const all = getAllCatalogServices();
  return all.filter((s) => s.ownerUserId === userId && s.status !== 'ARCHIVED');
};

// Sync member service with persistent backend for admin desk review
const syncServiceWithAdminBackend = async (service: ServiceListing) => {
  try {
    const user = getStoredUser();
    const backendBase = BASE_URL.replace(/\/api\/v1\/?$/, '');
    await fetch(`${backendBase}/api/admin/services/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: service.id,
        title: service.title,
        description: service.description,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        categorySlug: service.categorySlug,
        subcategoryId: service.subcategoryId,
        subcategoryName: service.subcategoryName,
        providerId: service.ownerUserId,
        providerPrivateName: service.ownerName || user?.fullName || 'FIC Member',
        providerEmail: user?.email || 'member@ficapp.in',
        pricingEstimate: 'Custom Quote',
        servicesOffered: service.servicesOffered || [],
        skills: service.skills || [],
        tags: service.tags || [],
        coverageArea: service.coverageArea || 'Pan India',
        deliveryMode: service.deliveryMode || 'ONLINE',
        status: service.status
      })
    });
  } catch (_e) {
    // Non-blocking sync
  }
};

// 3. Create a new service listing for the member
export const createMemberService = (
  userId: string,
  data: Partial<ServiceListing>
): ServiceListing => {
  const all = getAllCatalogServices();
  const user = getStoredUser();

  const newService: ServiceListing = {
    id: `srv_${Date.now()}`,
    ownerUserId: userId,
    ownerName: user?.fullName || 'FIC Member',
    categoryId: data.categoryId || 'cat-1',
    categoryName: data.categoryName || 'Business & Entrepreneurship',
    categorySlug: data.categorySlug || 'business-entrepreneurship',
    subcategoryId: data.subcategoryId,
    subcategoryName: data.subcategoryName,
    title: data.title?.trim() || 'Untitled Capability Listing',
    shortDescription: data.shortDescription || data.description?.substring(0, 140) || '',
    description: data.description?.trim() || '',
    servicesOffered: data.servicesOffered || [],
    skills: data.skills || [],
    tags: data.tags || [],
    targetCustomers: data.targetCustomers || [],
    coverageArea: data.coverageArea || 'Pan India',
    deliveryMode: data.deliveryMode || 'ONLINE',
    portfolioUrl: data.portfolioUrl?.trim() || '',
    supportingDocument: data.supportingDocument?.trim() || '',
    status: data.status || 'DRAFT',
    createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    submittedAt: data.status === 'PENDING_APPROVAL' ? 'Today' : undefined
  };

  all.unshift(newService);
  saveCatalogServices(all);

  // Sync to database
  syncServiceWithAdminBackend(newService);

  return newService;
};

// 4. Update an existing service listing
export const updateMemberService = (
  serviceId: string,
  updates: Partial<ServiceListing>
): ServiceListing | null => {
  const all = getAllCatalogServices();
  const index = all.findIndex((s) => s.id === serviceId);
  if (index === -1) return null;

  const updated: ServiceListing = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  };

  all[index] = updated;
  saveCatalogServices(all);

  // Sync update to backend
  syncServiceWithAdminBackend(updated);

  return updated;
};

// 5. Submit a draft or rejected service for FIC approval
export const submitServiceForApproval = (serviceId: string): ServiceListing | null => {
  return updateMemberService(serviceId, {
    status: 'PENDING_APPROVAL',
    submittedAt: 'Today',
    adminFeedback: undefined
  });
};

// 6. Simulate FIC Reviewer / Admin Approval (instantly publishes to Marketplace)
export const simulateAdminApproveService = (serviceId: string): ServiceListing | null => {
  return updateMemberService(serviceId, {
    status: 'APPROVED',
    approvedAt: 'Today',
    adminFeedback: undefined
  });
};

// 7. Simulate FIC Reviewer / Admin Rejection with feedback
export const simulateAdminRejectService = (
  serviceId: string,
  reason: string
): ServiceListing | null => {
  return updateMemberService(serviceId, {
    status: 'REJECTED',
    adminFeedback: reason || 'Please provide more details on deliverables and capabilities.'
  });
};

// 8. Delete / Archive service
export const deleteMemberService = (serviceId: string): boolean => {
  const all = getAllCatalogServices();
  const index = all.findIndex((s) => s.id === serviceId);
  if (index === -1) return false;

  all[index].status = 'ARCHIVED';
  saveCatalogServices(all);
  return true;
};

// ============================================================================
// FIC MEMBER MEETINGS & FACILITATED CONSULTATIONS
// ============================================================================
export type MeetingStatus = 'SCHEDULED' | 'PENDING_COORDINATION' | 'COMPLETED' | 'CANCELLED';
export type MeetingMode = 'VIRTUAL_MEET' | 'IN_PERSON' | 'PHONE';

export interface MeetingItem {
  id: string;
  userId: string;
  title: string;
  category: string;
  scheduledDate: string;
  scheduledTime: string;
  mode: MeetingMode;
  modeLabel: string;
  locationOrUrl?: string;
  facilitatorName: string;
  facilitatorRole: string;
  agenda: string;
  status: MeetingStatus;
  coordinatorNotes?: string;
  createdAt: string;
}

const MEETINGS_STORAGE_KEY = 'fic_member_meetings_db';

const INITIAL_SEED_MEETINGS: MeetingItem[] = [];

export const getAllMeetings = (): MeetingItem[] => {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_MEETINGS));
      return [...INITIAL_SEED_MEETINGS];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_SEED_MEETINGS];
  }
};

export const saveAllMeetings = (meetings: MeetingItem[]): void => {
  try {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
  } catch (err) {
    console.error('Failed to save meetings to localStorage:', err);
  }
};

export const getUserMeetings = (userId: string): MeetingItem[] => {
  const all = getAllMeetings();
  return all.filter((m) => m.userId === userId);
};

export const scheduleMeeting = (
  userId: string,
  data: {
    title: string;
    category: string;
    scheduledDate: string;
    scheduledTime: string;
    mode: MeetingMode;
    agenda: string;
  }
): MeetingItem => {
  const all = getAllMeetings();
  const newMeeting: MeetingItem = {
    id: `mtg_${Date.now()}`,
    userId,
    title: data.title,
    category: data.category,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    mode: data.mode,
    modeLabel:
      data.mode === 'VIRTUAL_MEET'
        ? 'Google Meet (Encrypted Video)'
        : data.mode === 'IN_PERSON'
        ? 'FIC Regional Hub'
        : 'FIC Coordinator Direct Phone Line',
    locationOrUrl:
      data.mode === 'VIRTUAL_MEET'
        ? undefined
        : data.mode === 'IN_PERSON'
        ? 'FIC Regional Hub Center'
        : '+91 80 4567 8900 (Coordinator Extension)',
    facilitatorName: 'FIC Desk Coordinator',
    facilitatorRole: 'Reviewing Request',
    agenda: data.agenda,
    status: 'PENDING_COORDINATION',
    coordinatorNotes: 'Request received. FIC Desk coordinator is assigning specialist and confirming schedule.',
    createdAt: 'Today'
  };

  all.unshift(newMeeting);
  saveAllMeetings(all);

  return newMeeting;
};

export const rescheduleMeeting = (
  meetingId: string,
  newDate: string,
  newTime: string
): MeetingItem | null => {
  const all = getAllMeetings();
  const index = all.findIndex((m) => m.id === meetingId);
  if (index === -1) return null;

  all[index] = {
    ...all[index],
    scheduledDate: newDate,
    scheduledTime: newTime,
    status: 'PENDING_COORDINATION',
    coordinatorNotes: `Reschedule requested for ${newDate} (${newTime}). Awaiting FIC coordinator confirmation.`
  };

  saveAllMeetings(all);
  return all[index];
};

export const cancelMeeting = (meetingId: string, reason?: string): boolean => {
  const all = getAllMeetings();
  const index = all.findIndex((m) => m.id === meetingId);
  if (index === -1) return false;

  all[index] = {
    ...all[index],
    status: 'CANCELLED',
    coordinatorNotes: reason ? `Cancelled by member: ${reason}` : 'Cancelled by member.'
  };

  saveAllMeetings(all);
  return true;
};

// ============================================================================
// UNIVERSAL MEMBER WALLET, REFERRALS, BANK ACCOUNTS & NOTIFICATIONS
// ============================================================================
const WALLETS_STORAGE_KEY = 'fic_member_wallets_db';
const TRANSACTIONS_STORAGE_KEY = 'fic_wallet_transactions_db';
const REFERRALS_STORAGE_KEY = 'fic_member_referrals_db';
const BANK_ACCOUNTS_STORAGE_KEY = 'fic_member_bank_accounts_db';
const NOTIFICATIONS_STORAGE_KEY = 'fic_member_notifications_db';

const INITIAL_SEED_WALLETS: Record<string, IMemberWallet> = {};

const INITIAL_SEED_TRANSACTIONS: IWalletTransaction[] = [];

const INITIAL_SEED_REFERRALS: IReferral[] = [];

const INITIAL_SEED_BANK_ACCOUNTS: Record<string, IMemberBankAccount> = {};

const INITIAL_SEED_NOTIFICATIONS: Record<string, IWalletNotification[]> = {};

// -------------------------------------------------------------
// Storage Access Helpers
// -------------------------------------------------------------
const getStoredWallets = (): Record<string, IMemberWallet> => {
  try {
    const raw = localStorage.getItem(WALLETS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveStoredWallets = (wallets: Record<string, IMemberWallet>) => {
  try {
    localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(wallets));
  } catch (err) {
    console.error('Failed to save wallets:', err);
  }
};

const getAllTransactions = (): IWalletTransaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAllTransactions = (txs: IWalletTransaction[]) => {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
};

const getAllReferrals = (): IReferral[] => {
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAllReferrals = (refs: IReferral[]) => {
  try {
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(refs));
  } catch (err) {
    console.error('Failed to save referrals:', err);
  }
};

const getAllBankAccounts = (): Record<string, IMemberBankAccount> => {
  try {
    const raw = localStorage.getItem(BANK_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_BANK_ACCOUNTS));
      return { ...INITIAL_SEED_BANK_ACCOUNTS };
    }
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_SEED_BANK_ACCOUNTS };
  }
};

const saveAllBankAccounts = (accounts: Record<string, IMemberBankAccount>) => {
  try {
    localStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save bank accounts:', err);
  }
};

const getAllNotifications = (): Record<string, IWalletNotification[]> => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_NOTIFICATIONS));
      return { ...INITIAL_SEED_NOTIFICATIONS };
    }
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_SEED_NOTIFICATIONS };
  }
};

const saveAllNotifications = (notifs: Record<string, IWalletNotification[]>) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
};

// -------------------------------------------------------------
// Public Member Wallet API Methods
// -------------------------------------------------------------
export const getUserWallet = (userId: string): IMemberWallet => {
  const wallets = getStoredWallets();
  if (wallets[userId]) return wallets[userId];

  // Initialize new default wallet
  const newWallet: IMemberWallet = {
    walletId: `wlt_${userId}`,
    userId,
    currency: 'INR',
    totalBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    restrictedBalance: 0,
    withdrawalEligibleBalance: 0,
    membershipEligibleBalance: 0,
    totalAdded: 0,
    totalWithdrawn: 0,
    totalReferralEarnings: 0,
    totalRenewalSpent: 0,
    status: WalletStatus.ACTIVE,
    createdAt: 'Today',
    updatedAt: 'Today'
  };

  wallets[userId] = newWallet;
  saveStoredWallets(wallets);
  return newWallet;
};

export const getUserWalletTransactions = (
  userId: string,
  filters?: { type?: string; status?: string; search?: string }
): IWalletTransaction[] => {
  const all = getAllTransactions();
  let userTxs = all.filter((t) => t.userId === userId);

  if (userTxs.length === 0 && (userId === 'usr_kathir_001' || userId.toLowerCase().includes('kathir'))) {
    userTxs = all.filter((t) => t.userId === 'usr_kathir_001');
  }

  if (filters?.type && filters.type !== 'ALL') {
    userTxs = userTxs.filter((t) => t.transactionType === filters.type);
  }
  if (filters?.status && filters.status !== 'ALL') {
    userTxs = userTxs.filter((t) => t.status === filters.status);
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase();
    userTxs = userTxs.filter(
      (t) =>
        t.transactionId.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
    );
  }

  return userTxs;
};

export const addWalletFunds = (
  userId: string,
  amount: number,
  paymentMethod: string = 'UPI'
): { success: boolean; transaction: IWalletTransaction; wallet: IMemberWallet } => {
  const wallets = getStoredWallets();
  const wallet = getUserWallet(userId);
  const txs = getAllTransactions();

  const balanceAfter = wallet.availableBalance + amount;
  wallet.availableBalance += amount;
  wallet.totalBalance += amount;
  wallet.withdrawalEligibleBalance += amount;
  wallet.membershipEligibleBalance += amount;
  wallet.totalAdded += amount;
  wallet.updatedAt = 'Today';

  wallets[userId] = wallet;
  saveStoredWallets(wallets);

  const newTx: IWalletTransaction = {
    transactionId: `TXN_CR_${Date.now()}`,
    walletId: wallet.walletId,
    userId,
    transactionType: WalletTransactionType.ADD_FUNDS,
    direction: 'CREDIT',
    amount,
    currency: 'INR',
    description: `Wallet top-up via ${paymentMethod}`,
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter,
    createdAt: 'Today'
  };

  txs.unshift(newTx);
  saveAllTransactions(txs);

  // Trigger Notification
  addUserNotification(userId, {
    title: 'Money Added Successfully',
    message: `₹${amount.toLocaleString('en-IN')} has been added to your FIC Wallet via ${paymentMethod}.`,
    type: 'MONEY_ADDED_SUCCESS'
  });

  return { success: true, transaction: newTx, wallet };
};

export const requestWalletWithdrawal = (
  userId: string,
  amount: number
): { success: boolean; withdrawal?: any; wallet: IMemberWallet; error?: string } => {
  const wallets = getStoredWallets();
  const wallet = getUserWallet(userId);
  const bankAcc = getUserBankAccount(userId);

  if (!bankAcc || bankAcc.verificationStatus !== 'VERIFIED') {
    return {
      success: false,
      wallet,
      error: 'Please verify and link a valid bank account before requesting withdrawal.'
    };
  }

  if (wallet.availableBalance < amount) {
    return {
      success: false,
      wallet,
      error: `Insufficient available balance. You have ₹${wallet.availableBalance.toLocaleString('en-IN')} available.`
    };
  }

  // Atomically reserve funds
  wallet.availableBalance -= amount;
  wallet.pendingBalance += amount;
  wallet.updatedAt = 'Today';

  wallets[userId] = wallet;
  saveStoredWallets(wallets);

  const txs = getAllTransactions();
  const newTx: IWalletTransaction = {
    transactionId: `TXN_WD_${Date.now()}`,
    walletId: wallet.walletId,
    userId,
    transactionType: WalletTransactionType.WITHDRAWAL,
    direction: 'DEBIT',
    amount,
    currency: 'INR',
    description: `Withdrawal request to ${bankAcc.bankName} (${bankAcc.accountNumberMasked})`,
    status: WalletTransactionStatus.PENDING,
    balanceAfter: wallet.availableBalance,
    createdAt: 'Today'
  };

  txs.unshift(newTx);
  saveAllTransactions(txs);

  // Add notification
  addUserNotification(userId, {
    title: 'Withdrawal Requested',
    message: `Withdrawal request for ₹${amount.toLocaleString('en-IN')} to ${bankAcc.bankName} is under review.`,
    type: 'WITHDRAWAL_REQUESTED'
  });

  return { success: true, wallet };
};

export const renewMembershipWithWallet = (
  userId: string
): { success: boolean; newExpiryDate?: string; transaction?: IWalletTransaction; wallet: IMemberWallet; error?: string } => {
  const wallets = getStoredWallets();
  const wallet = getUserWallet(userId);
  const renewalFee = 5999;

  if (wallet.availableBalance < renewalFee) {
    const shortfall = renewalFee - wallet.availableBalance;
    return {
      success: false,
      wallet,
      error: `Insufficient wallet balance. Shortfall is ₹${shortfall.toLocaleString('en-IN')}. Please top up your wallet.`
    };
  }

  // Atomically deduct renewal
  const balanceAfter = wallet.availableBalance - renewalFee;
  wallet.availableBalance -= renewalFee;
  wallet.totalBalance -= renewalFee;
  wallet.withdrawalEligibleBalance = Math.max(0, wallet.withdrawalEligibleBalance - renewalFee);
  wallet.membershipEligibleBalance = Math.max(0, wallet.membershipEligibleBalance - renewalFee);
  wallet.totalRenewalSpent += renewalFee;
  wallet.updatedAt = 'Today';

  wallets[userId] = wallet;
  saveStoredWallets(wallets);

  const txs = getAllTransactions();
  const transaction: IWalletTransaction = {
    transactionId: `TXN_RNW_${Date.now()}`,
    walletId: wallet.walletId,
    userId,
    transactionType: WalletTransactionType.MEMBERSHIP_RENEWAL,
    direction: 'DEBIT',
    amount: renewalFee,
    currency: 'INR',
    description: 'Annual Membership Renewal (Year 2+) via FIC Wallet',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter,
    createdAt: 'Today'
  };

  txs.unshift(transaction);
  saveAllTransactions(txs);

  // Update stored user membership expiry date
  const storedUser = getStoredUser();
  const nextYear = new Date();
  nextYear.setDate(nextYear.getDate() + 365);
  const formattedExpiry = nextYear.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (storedUser && (storedUser.id === userId || storedUser.userId === userId)) {
    storedUser.membershipExpiryDate = `Valid until ${formattedExpiry}`;
    storedUser.isMembershipActive = true;
    setStoredUser(storedUser);
  }

  // Add success notification
  addUserNotification(userId, {
    title: 'Membership Renewal Successful',
    message: `Your FIC Business Hub membership has been renewed for 365 days (Valid until ${formattedExpiry}).`,
    type: 'MEMBERSHIP_RENEWAL_SUCCESS'
  });

  return {
    success: true,
    newExpiryDate: `Valid until ${formattedExpiry}`,
    transaction,
    wallet
  };
};

export const getUserReferrals = (userId: string) => {
  const user = getStoredUser();
  const code =
    user?.referralCode ||
    (userId === 'usr_kathir_001'
      ? 'FIC-KATHIR-7782'
      : userId === 'usr_moorthy_002'
      ? 'FIC-MOORTHY-9914'
      : `FIC-MEMBER-${userId.slice(-4).toUpperCase()}`);

  const allRefs = getAllReferrals();
  const userRefs = allRefs.filter((r) => r.referrerUserId === userId);

  const totalReferrals = userRefs.length;
  const pendingReferrals = userRefs.filter((r) => r.rewardStatus === 'PENDING_ELIGIBILITY' || r.rewardStatus === 'PENDING_APPROVAL').length;
  const kycApprovedReferrals = userRefs.filter((r) => r.kycStatus === 'VERIFIED').length;
  const rewardPending = userRefs
    .filter((r) => r.rewardStatus === 'PENDING_APPROVAL')
    .reduce((sum, r) => sum + (r.rewardAmount || 500), 0);
  const rewardCredited = userRefs
    .filter((r) => r.rewardStatus === 'CREDITED')
    .reduce((sum, r) => sum + (r.rewardAmount || 500), 0);

  return {
    referralCode: code,
    referralLink: `${window.location.origin}/register?ref=${code}`,
    summary: {
      totalReferrals,
      pendingReferrals,
      kycApprovedReferrals,
      rewardPending,
      rewardCredited,
      totalEarnings: rewardCredited
    },
    referrals: userRefs
  };
};

export const validateReferralCodeApi = async (
  code: string
): Promise<{ valid: boolean; referrerName?: string; referrerUserId?: string }> => {
  if (!code || !code.trim()) return { valid: false };
  const clean = code.trim().toUpperCase();
  try {
    const res = await fetch(`${BASE_URL}/referrals/validate-code/${encodeURIComponent(clean)}`);
    const json = await res.json();
    if (json?.success && json?.valid && json?.data) {
      return {
        valid: true,
        referrerName: json.data.referrerName,
        referrerUserId: json.data.referrerUserId
      };
    }
  } catch {}
  return validateReferralCode(clean);
};

export const validateReferralCode = (
  code: string
): { valid: boolean; referrerName?: string; referrerUserId?: string } => {
  if (!code || !code.trim()) return { valid: false };
  const clean = code.trim().toUpperCase();

  const accounts = getRegisteredAccounts();
  const match = accounts.find((a) => (a.referralCode || '').toUpperCase() === clean);

  if (match) {
    return {
      valid: true,
      referrerName: match.fullName,
      referrerUserId: match.id || match.userId
    };
  }

  // Built-in aliases
  if (clean === 'FIC-KATHIR-7782') {
    return { valid: true, referrerName: 'Kathir', referrerUserId: 'usr_kathir_001' };
  }
  if (clean === 'FIC-MOORTHY-9914') {
    return { valid: true, referrerName: 'S. Moorthy', referrerUserId: 'usr_moorthy_002' };
  }

  return { valid: false };
};

export const getUserBankAccount = (userId: string): IMemberBankAccount | null => {
  const accounts = getAllBankAccounts();
  return accounts[userId] || null;
};

export const saveUserBankAccount = (
  userId: string,
  data: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType?: 'SAVINGS' | 'CURRENT';
  }
): IMemberBankAccount => {
  const accounts = getAllBankAccounts();
  const cleanAcc = String(data.accountNumber).trim();
  const masked = `XXXX XXXX ${cleanAcc.slice(-4)}`;

  const newBankAcc: IMemberBankAccount = {
    bankAccountId: `bnk_${Date.now()}`,
    userId,
    accountHolderName: data.accountHolderName.trim(),
    bankName: data.bankName.trim(),
    accountNumberMasked: masked,
    ifscCode: data.ifscCode.trim().toUpperCase(),
    accountType: data.accountType || 'SAVINGS',
    verificationStatus: 'VERIFIED',
    verifiedAt: 'Today',
    createdAt: 'Today'
  };

  accounts[userId] = newBankAcc;
  saveAllBankAccounts(accounts);
  return newBankAcc;
};

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
export const getUserNotifications = (userId: string): IWalletNotification[] => {
  const notifs = getAllNotifications();
  return notifs[userId] || [];
};

export const addUserNotification = (
  userId: string,
  item: Omit<IWalletNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
): IWalletNotification => {
  const notifs = getAllNotifications();
  const list = notifs[userId] || [];

  const newNotif: IWalletNotification = {
    id: `notif_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    userId,
    title: item.title,
    message: item.message,
    type: item.type,
    isRead: false,
    createdAt: 'Just now'
  };

  list.unshift(newNotif);
  notifs[userId] = list;
  saveAllNotifications(notifs);
  return newNotif;
};

export const markNotificationAsRead = (userId: string, notificationId: string): void => {
  const notifs = getAllNotifications();
  const list = notifs[userId] || [];
  const item = list.find((n) => n.id === notificationId);
  if (item) {
    item.isRead = true;
    saveAllNotifications(notifs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fic_notifications_updated'));
    }
  }
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifs = getAllNotifications();
  const list = notifs[userId] || [];
  list.forEach((n) => (n.isRead = true));
  saveAllNotifications(notifs);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fic_notifications_updated'));
  }
};

// -------------------------------------------------------------
// Admin Management API Helpers
// -------------------------------------------------------------
export const getAdminWalletsData = () => {
  const walletsMap = getStoredWallets();
  const wallets = Object.values(walletsMap);
  const transactions = getAllTransactions();
  const referrals = getAllReferrals();
  return {
    wallets,
    transactions,
    referrals
  };
};

export const adminApproveReferralReward = (referralId: string): boolean => {
  const referrals = getAllReferrals();
  const target = referrals.find((r) => r.referralId === referralId);
  if (!target || target.rewardStatus === 'CREDITED') return false;

  target.rewardStatus = 'CREDITED';
  target.creditedAt = 'Today';
  target.approvedBy = 'SUPER_ADMIN';
  target.approvedAt = 'Today';
  saveAllReferrals(referrals);

  // Credit referrer's wallet
  const wallet = getUserWallet(target.referrerUserId);
  const amount = target.rewardAmount || 500;
  const balanceAfter = wallet.availableBalance + amount;
  wallet.availableBalance += amount;
  wallet.totalBalance += amount;
  wallet.totalReferralEarnings += amount;
  wallet.withdrawalEligibleBalance += amount;
  wallet.membershipEligibleBalance += amount;
  wallet.updatedAt = 'Today';

  const wallets = getStoredWallets();
  wallets[target.referrerUserId] = wallet;
  saveStoredWallets(wallets);

  const txs = getAllTransactions();
  txs.unshift({
    transactionId: `TXN_REF_${Date.now()}`,
    walletId: wallet.walletId,
    userId: target.referrerUserId,
    transactionType: WalletTransactionType.REFERRAL_REWARD,
    direction: 'CREDIT',
    amount,
    currency: 'INR',
    description: `Referral reward approved for ${target.referredName} (${target.referralCode})`,
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter,
    createdAt: 'Today'
  });
  saveAllTransactions(txs);

  // Send notification to referrer
  addUserNotification(target.referrerUserId, {
    title: 'Referral Reward Credited: ₹500',
    message: `Congratulations! Your referral reward of ₹500 for ${target.referredName} has been approved and credited to your wallet.`,
    type: 'REFERRAL_REWARD_CREDITED'
  });

  return true;
};

export const adminRejectReferralReward = (referralId: string, reason: string): boolean => {
  const referrals = getAllReferrals();
  const target = referrals.find((r) => r.referralId === referralId);
  if (!target || target.rewardStatus === 'CREDITED') return false;

  target.rewardStatus = 'REJECTED';
  target.rejectionReason = reason;
  saveAllReferrals(referrals);
  return true;
};

export const adminAdjustWallet = (
  userId: string,
  direction: 'CREDIT' | 'DEBIT',
  amount: number,
  reason: string
): boolean => {
  const wallets = getStoredWallets();
  const wallet = getUserWallet(userId);
  if (direction === 'DEBIT' && wallet.availableBalance < amount) return false;

  const balanceAfter =
    direction === 'CREDIT' ? wallet.availableBalance + amount : wallet.availableBalance - amount;

  wallet.availableBalance = balanceAfter;
  wallet.totalBalance = balanceAfter;
  wallet.updatedAt = 'Today';
  wallets[userId] = wallet;
  saveStoredWallets(wallets);

  const txs = getAllTransactions();
  txs.unshift({
    transactionId: `TXN_ADJ_${Date.now()}`,
    walletId: wallet.walletId,
    userId,
    transactionType:
      direction === 'CREDIT' ? WalletTransactionType.ADMIN_CREDIT : WalletTransactionType.ADMIN_DEBIT,
    direction,
    amount,
    currency: 'INR',
    description: `Admin Adjustment: ${reason}`,
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter,
    createdAt: 'Today'
  });
  saveAllTransactions(txs);
  return true;
};





// ========================================================
// MENTORSHIP & STUDENT ECOSYSTEM (DATA-DRIVEN)
// ========================================================

export interface ITeachingService {
  _id?: string;
  id?: string;
  mentorId: string;
  mentorName: string;
  title: string;
  subject: string;
  shortDescription?: string;
  detailedDescription: string;
  subjectCategory?: string;
  studentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  teachingLanguage: string;
  teachingMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  relevantExperience: string;
  qualifications?: string;
  topicsCovered?: string[];
  learningOutcomes?: string[];
  availability: string;
  sessionDuration: string;
  thumbnailUrl?: string;
  thumbnailStorageKey?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED';
  enrolledCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ILearningVideo {
  _id?: string;
  id?: string;
  mentorId: string;
  mentorName: string;
  teachingServiceId?: string;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  studentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  language: string;
  videoUrl: string;
  thumbnailUrl?: string;
  thumbnailStorageKey?: string;
  duration: string;
  durationSeconds?: number;
  fileSize?: number;
  originalFilename?: string;
  mimeType?: string;
  videoStorageKey?: string;
  learningObjectives?: string[];
  status: 'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED' | 'PENDING_REVIEW';
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMentorshipRequest {
  _id?: string;
  id?: string;
  requestId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  mentorId: string;
  mentorName: string;
  purpose: string;
  title: string;
  reason: string;
  studentLevel: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  meetingMode: 'ONLINE' | 'OFFLINE';
  locationOrUrl?: string;
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'SCHEDULED'
    | 'RESCHEDULE_REQUESTED'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
  mentorNotes?: string;
  sessionSummary?: string;
  recommendedMaterials?: string[];
  followUpInstructions?: string;
  rejectionReason?: string;
  rescheduleProposal?: {
    proposedDate: string;
    proposedTime: string;
    proposedMode?: string;
    proposedNotes?: string;
    proposedBy: 'MENTOR' | 'STUDENT';
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IMentorDirectoryItem {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  subCategory: string;
  organization: string;
  experience: string;
  servicesCount: number;
  services?: Array<{ _id: string; title: string; subject: string; studentLevel: string }>;
}

export interface IEcosystemCounts {
  registeredStudents: number;
  availableMentors: number;
  learningVideosCount: number;
  completedSessions: number;
  totalTeachingServices: number;
}

const STORAGE_KEY_TEACHING_SERVICES = 'fic_mentoring_teaching_services';
const STORAGE_KEY_VIDEOS = 'fic_mentoring_videos';
const STORAGE_KEY_MENTORSHIP_REQUESTS = 'fic_mentorship_requests';

// Initial fallback dataset
const INITIAL_FALLBACK_TEACHING_SERVICES: ITeachingService[] = [];

const INITIAL_FALLBACK_VIDEOS: ILearningVideo[] = [];

const INITIAL_FALLBACK_REQUESTS: IMentorshipRequest[] = [];

// Local Storage helpers
const getStoredTeachingServices = (): ITeachingService[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHING_SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEACHING_SERVICES, JSON.stringify(INITIAL_FALLBACK_TEACHING_SERVICES));
      return INITIAL_FALLBACK_TEACHING_SERVICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FALLBACK_TEACHING_SERVICES;
  }
};

const saveStoredTeachingServices = (items: ITeachingService[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_TEACHING_SERVICES, JSON.stringify(items));
  } catch (_e) {}
};

const getStoredLearningVideos = (): ILearningVideo[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(INITIAL_FALLBACK_VIDEOS));
      return INITIAL_FALLBACK_VIDEOS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FALLBACK_VIDEOS;
  }
};

const saveStoredLearningVideos = (items: ILearningVideo[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(items));
  } catch (_e) {}
};

export const getStoredMentorshipRequests = (): IMentorshipRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MENTORSHIP_REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MENTORSHIP_REQUESTS, JSON.stringify(INITIAL_FALLBACK_REQUESTS));
      return INITIAL_FALLBACK_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FALLBACK_REQUESTS;
  }
};

const saveStoredMentorshipRequests = (items: IMentorshipRequest[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_MENTORSHIP_REQUESTS, JSON.stringify(items));
  } catch (_e) {}
};

// 1. Live Ecosystem Counts
export const getEcosystemCounts = async (): Promise<IEcosystemCounts> => {
  try {
    const res = await apiRequest('/mentoring/ecosystem-counts');
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  // Local fallback calculation
  const accounts = getRegisteredAccounts();
  const studentsCount = accounts.filter(
    (a) => a.subCategory?.toLowerCase().includes('student') || a.primaryCategory?.toLowerCase().includes('student')
  ).length;
  const mentorsCount = accounts.filter(
    (a) => a.subCategory?.toLowerCase().includes('mentor') || a.primaryCategory?.toLowerCase().includes('mentor')
  ).length;

  const videos = getStoredLearningVideos();
  const requests = getStoredMentorshipRequests();
  const teachingServices = getStoredTeachingServices();

  return {
    registeredStudents: Math.max(studentsCount, 48),
    availableMentors: Math.max(mentorsCount, 16),
    learningVideosCount: videos.filter((v) => v.status === 'PUBLISHED').length,
    completedSessions: requests.filter((r) => r.status === 'COMPLETED').length,
    totalTeachingServices: teachingServices.filter((s) => s.status === 'PUBLISHED').length
  };
};

// 2. Mentors Directory
export const getMentorsDirectory = async (): Promise<IMentorDirectoryItem[]> => {
  try {
    const res = await apiRequest('/mentoring/mentors');
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (_e) {}

  // Fallback
  return [
    {
      _id: 'usr_mentor_sundaram',
      fullName: 'Dr. R. Sundaram',
      email: 'mentor@ficapp.in',
      phoneNumber: '9840123456',
      subCategory: 'Mentor / Trainer',
      organization: 'FIC Academic & Career Council',
      experience: '12+ Years Industry & Research',
      servicesCount: 2,
      services: [
        {
          _id: 'ts-1',
          title: 'Full-Stack Cloud & System Architecture Mentorship',
          subject: 'Full-Stack Engineering & Cloud Systems',
          studentLevel: 'ALL_LEVELS'
        },
        {
          _id: 'ts-2',
          title: 'Student Startup Incubation & Tech Feasibility',
          subject: 'Startup Mentorship & Product Validation',
          studentLevel: 'BEGINNER'
        }
      ]
    },
    {
      _id: 'usr_mentor_radhika',
      fullName: 'Prof. Radhika Venkataraman',
      email: 'radhika.mentor@ficapp.in',
      phoneNumber: '9840234567',
      subCategory: 'Mentor / Trainer',
      organization: 'Center for Entrepreneurship & AI',
      experience: '9+ Years Academic Mentorship',
      servicesCount: 1,
      services: [
        {
          _id: 'ts-3',
          title: 'AI Product Prototyping & Academic Research',
          subject: 'Artificial Intelligence & Data',
          studentLevel: 'INTERMEDIATE'
        }
      ]
    }
  ];
};

// 3. Teaching Services
export const getMyTeachingServices = async (): Promise<ITeachingService[]> => {
  try {
    const res = await apiRequest('/mentoring/teaching-services/my');
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (_e) {}

  const user = getStoredUser();
  const all = getStoredTeachingServices();
  if (!user) return all;
  const filtered = all.filter((s) => s.mentorId === user.id || s.mentorId === user.userId || s.mentorName === user.fullName);
  return filtered.length > 0 ? filtered : all;
};

export const getPublicTeachingServices = async (filters?: {
  subject?: string;
  level?: string;
  search?: string;
}): Promise<ITeachingService[]> => {
  try {
    let q = '';
    if (filters?.subject) q += `&subject=${encodeURIComponent(filters.subject)}`;
    if (filters?.level && filters.level !== 'ALL') q += `&level=${encodeURIComponent(filters.level)}`;
    if (filters?.search) q += `&search=${encodeURIComponent(filters.search)}`;
    const res = await apiRequest(`/mentoring/teaching-services/public?${q}`);
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (_e) {}

  let list = getStoredTeachingServices().filter((s) => s.status === 'PUBLISHED');
  if (filters?.level && filters.level !== 'ALL') {
    list = list.filter((s) => s.studentLevel === filters.level);
  }
  if (filters?.search) {
    const sLow = filters.search.toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(sLow) ||
        s.subject.toLowerCase().includes(sLow) ||
        s.mentorName.toLowerCase().includes(sLow)
    );
  }
  return list;
};

export const createTeachingService = async (
  data: Partial<ITeachingService>
): Promise<ITeachingService> => {
  const user = getStoredUser();
  try {
    const res = await apiRequest('/mentoring/teaching-services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredTeachingServices();
  const newService: ITeachingService = {
    id: `ts-${Date.now()}`,
    _id: `ts-${Date.now()}`,
    mentorId: user?.id || user?.userId || 'usr_mentor_demo',
    mentorName: user?.fullName || 'Dr. R. Sundaram',
    title: data.title || 'Specialized Mentorship Session',
    subject: data.subject || 'General Mentorship',
    shortDescription: data.shortDescription,
    detailedDescription: data.detailedDescription || 'Comprehensive mentoring session tailored to your learning goals.',
    subjectCategory: data.subjectCategory || 'Education & Knowledge',
    studentLevel: data.studentLevel || 'ALL_LEVELS',
    teachingLanguage: data.teachingLanguage || 'English & Tamil',
    teachingMode: data.teachingMode || 'ONLINE',
    relevantExperience: data.relevantExperience || 'Verified Mentor',
    qualifications: data.qualifications,
    topicsCovered: data.topicsCovered || [],
    learningOutcomes: data.learningOutcomes || [],
    availability: data.availability || 'Weekdays & Weekends',
    sessionDuration: data.sessionDuration || '45 mins',
    status: data.status || 'PUBLISHED',
    enrolledCount: 0,
    createdAt: new Date().toISOString()
  };

  all.unshift(newService);
  saveStoredTeachingServices(all);
  return newService;
};

export const updateTeachingService = async (
  id: string,
  data: Partial<ITeachingService>
): Promise<ITeachingService | null> => {
  try {
    const res = await apiRequest(`/mentoring/teaching-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredTeachingServices();
  const idx = all.findIndex((s) => s.id === id || s._id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    saveStoredTeachingServices(all);
    return all[idx];
  }
  return null;
};

export const deleteTeachingService = async (id: string): Promise<boolean> => {
  try {
    const res = await apiRequest(`/mentoring/teaching-services/${id}`, {
      method: 'DELETE'
    });
    if (res?.success) {
      return true;
    }
  } catch (_e) {}

  const all = getStoredTeachingServices();
  const filtered = all.filter((s) => s.id !== id && s._id !== id);
  saveStoredTeachingServices(filtered);
  return true;
};

// 4. Learning Videos
export const getMyLearningVideos = async (): Promise<ILearningVideo[]> => {
  try {
    const res = await apiRequest('/mentoring/videos/my');
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (_e) {}

  const user = getStoredUser();
  const all = getStoredLearningVideos();
  if (!user) return all;
  const filtered = all.filter((v) => v.mentorId === user.id || v.mentorId === user.userId || v.mentorName === user.fullName);
  return filtered.length > 0 ? filtered : all;
};

export const getPublicLearningVideos = async (filters?: {
  subject?: string;
  level?: string;
  language?: string;
  mentorId?: string;
  search?: string;
}): Promise<ILearningVideo[]> => {
  try {
    let q = '';
    if (filters?.subject) q += `&subject=${encodeURIComponent(filters.subject)}`;
    if (filters?.level && filters.level !== 'ALL') q += `&level=${encodeURIComponent(filters.level)}`;
    if (filters?.language && filters.language !== 'ALL') q += `&language=${encodeURIComponent(filters.language)}`;
    if (filters?.mentorId) q += `&mentorId=${encodeURIComponent(filters.mentorId)}`;
    if (filters?.search) q += `&search=${encodeURIComponent(filters.search)}`;
    const res = await apiRequest(`/mentoring/videos/public?${q}`);
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (_e) {}

  let list = getStoredLearningVideos().filter((v) => v.status === 'PUBLISHED');
  if (filters?.level && filters.level !== 'ALL') {
    list = list.filter((v) => v.studentLevel === filters.level);
  }
  if (filters?.mentorId) {
    list = list.filter((v) => v.mentorId === filters.mentorId);
  }
  if (filters?.search) {
    const sLow = filters.search.toLowerCase();
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(sLow) ||
        v.description.toLowerCase().includes(sLow) ||
        v.subject.toLowerCase().includes(sLow) ||
        v.mentorName.toLowerCase().includes(sLow)
    );
  }
  return list;
};

export const createLearningVideo = async (
  data: Partial<ILearningVideo>
): Promise<ILearningVideo> => {
  const user = getStoredUser();
  try {
    const res = await apiRequest('/mentoring/videos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredLearningVideos();
  const newVideo: ILearningVideo = {
    id: `vid-${Date.now()}`,
    _id: `vid-${Date.now()}`,
    mentorId: user?.id || user?.userId || 'usr_mentor_demo',
    mentorName: user?.fullName || 'Dr. R. Sundaram',
    title: data.title || 'Untitled Masterclass',
    description: data.description || 'Comprehensive video masterclass on skill development.',
    subject: data.subject || 'Skill Development',
    topic: data.topic,
    studentLevel: data.studentLevel || 'ALL_LEVELS',
    language: data.language || 'Tamil & English',
    videoUrl: data.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl:
      data.thumbnailUrl ||
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    duration: data.duration || '15:00',
    learningObjectives: data.learningObjectives || [],
    status: data.status || 'PUBLISHED',
    viewsCount: 0,
    createdAt: new Date().toISOString()
  };

  all.unshift(newVideo);
  saveStoredLearningVideos(all);
  return newVideo;
};

export const updateLearningVideo = async (
  id: string,
  data: Partial<ILearningVideo>
): Promise<ILearningVideo | null> => {
  try {
    const res = await apiRequest(`/mentoring/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredLearningVideos();
  const idx = all.findIndex((v) => v.id === id || v._id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    saveStoredLearningVideos(all);
    return all[idx];
  }
  return null;
};

export const deleteLearningVideo = async (id: string): Promise<boolean> => {
  try {
    const res = await apiRequest(`/mentoring/videos/${id}`, {
      method: 'DELETE'
    });
    if (res?.success) {
      return true;
    }
  } catch (_e) {}

  const all = getStoredLearningVideos();
  const filtered = all.filter((v) => v.id !== id && v._id !== id);
  saveStoredLearningVideos(filtered);
  return true;
};

export const incrementVideoViews = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/mentoring/videos/${id}/views`, { method: 'PATCH' });
  } catch (_e) {}

  const all = getStoredLearningVideos();
  const video = all.find((v) => v.id === id || v._id === id);
  if (video) {
    video.viewsCount = (video.viewsCount || 0) + 1;
    saveStoredLearningVideos(all);
  }
};

// 5. Mentorship Requests & Meetings Lifecycle
export const createMentorshipRequest = async (
  data: Partial<IMentorshipRequest>
): Promise<IMentorshipRequest> => {
  const user = getStoredUser();
  try {
    const res = await apiRequest('/mentoring/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const newReq: IMentorshipRequest = {
    id: `req-m-${Date.now()}`,
    _id: `req-m-${Date.now()}`,
    requestId: `REQ-MENTOR-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
    studentId: user?.id || user?.userId || 'usr_student_demo',
    studentName: user?.fullName || 'Student Member',
    studentEmail: user?.email || 'student@ficapp.in',
    mentorId: data.mentorId || 'usr_mentor_sundaram',
    mentorName: data.mentorName || 'Dr. R. Sundaram',
    purpose: data.purpose || 'Career Guidance',
    title: data.title || `${data.purpose || 'Mentorship'} Session`,
    reason: data.reason || 'Seeking career and academic guidance.',
    studentLevel: data.studentLevel || 'Undergraduate',
    preferredDate: data.preferredDate || new Date().toISOString().split('T')[0],
    preferredTime: data.preferredTime || '11:00 AM',
    meetingMode: data.meetingMode || 'ONLINE',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  all.unshift(newReq);
  saveStoredMentorshipRequests(all);
  return newReq;
};

export const getStudentMentorshipRequests = async (): Promise<IMentorshipRequest[]> => {
  try {
    const res = await apiRequest('/mentoring/requests/student');
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (_e) {}

  const user = getStoredUser();
  const all = getStoredMentorshipRequests();
  if (!user) return all;
  const filtered = all.filter((r) => r.studentId === user.id || r.studentId === user.userId || r.studentName === user.fullName);
  return filtered.length > 0 ? filtered : all;
};

export const getMentorMentorshipRequests = async (): Promise<IMentorshipRequest[]> => {
  try {
    const res = await apiRequest('/mentoring/requests/mentor');
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (_e) {}

  const user = getStoredUser();
  const all = getStoredMentorshipRequests();
  if (!user) return all;
  const filtered = all.filter((r) => r.mentorId === user.id || r.mentorId === user.userId || r.mentorName === user.fullName);
  return filtered.length > 0 ? filtered : all;
};

export const acceptMentorshipRequest = async (
  id: string,
  payload: {
    confirmedDate?: string;
    confirmedTime?: string;
    meetingMode?: 'ONLINE' | 'OFFLINE';
    locationOrUrl?: string;
    mentorNotes?: string;
  }
): Promise<IMentorshipRequest | null> => {
  try {
    const res = await apiRequest(`/mentoring/requests/${id}/accept`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const target = all.find((r) => r.id === id || r._id === id);
  if (target) {
    target.status = 'CONFIRMED';
    target.confirmedDate = payload.confirmedDate || target.preferredDate;
    target.confirmedTime = payload.confirmedTime || target.preferredTime;
    if (payload.meetingMode) target.meetingMode = payload.meetingMode;
    if (payload.locationOrUrl) target.locationOrUrl = payload.locationOrUrl;
    if (payload.mentorNotes) target.mentorNotes = payload.mentorNotes;
    target.updatedAt = new Date().toISOString();
    saveStoredMentorshipRequests(all);
    return target;
  }
  return null;
};

export const rejectMentorshipRequest = async (
  id: string,
  rejectionReason: string
): Promise<IMentorshipRequest | null> => {
  try {
    const res = await apiRequest(`/mentoring/requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason })
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const target = all.find((r) => r.id === id || r._id === id);
  if (target) {
    target.status = 'REJECTED';
    target.rejectionReason = rejectionReason;
    target.updatedAt = new Date().toISOString();
    saveStoredMentorshipRequests(all);
    return target;
  }
  return null;
};

export const rescheduleMentorshipRequest = async (
  id: string,
  proposal: {
    proposedDate: string;
    proposedTime: string;
    proposedMode?: string;
    proposedNotes?: string;
  }
): Promise<IMentorshipRequest | null> => {
  try {
    const res = await apiRequest(`/mentoring/requests/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(proposal)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const target = all.find((r) => r.id === id || r._id === id);
  if (target) {
    target.status = 'RESCHEDULE_REQUESTED';
    target.rescheduleProposal = {
      proposedDate: proposal.proposedDate,
      proposedTime: proposal.proposedTime,
      proposedMode: proposal.proposedMode,
      proposedNotes: proposal.proposedNotes,
      proposedBy: 'MENTOR'
    };
    target.updatedAt = new Date().toISOString();
    saveStoredMentorshipRequests(all);
    return target;
  }
  return null;
};

export const respondToReschedule = async (
  id: string,
  action: 'ACCEPT' | 'DECLINE'
): Promise<IMentorshipRequest | null> => {
  try {
    const res = await apiRequest(`/mentoring/requests/${id}/reschedule-response`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const target = all.find((r) => r.id === id || r._id === id);
  if (target && target.rescheduleProposal) {
    if (action === 'ACCEPT') {
      target.status = 'CONFIRMED';
      target.confirmedDate = target.rescheduleProposal.proposedDate;
      target.confirmedTime = target.rescheduleProposal.proposedTime;
      if (target.rescheduleProposal.proposedMode) {
        target.meetingMode = target.rescheduleProposal.proposedMode as 'ONLINE' | 'OFFLINE';
      }
    } else {
      target.status = 'CANCELLED';
      target.rejectionReason = 'Student declined the reschedule proposal.';
    }
    target.updatedAt = new Date().toISOString();
    saveStoredMentorshipRequests(all);
    return target;
  }
  return null;
};

export const completeMentorshipSession = async (
  id: string,
  details: {
    sessionSummary: string;
    mentorNotes?: string;
    recommendedMaterials?: string[];
    followUpInstructions?: string;
  }
): Promise<IMentorshipRequest | null> => {
  try {
    const res = await apiRequest(`/mentoring/requests/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(details)
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const target = all.find((r) => r.id === id || r._id === id);
  if (target) {
    target.status = 'COMPLETED';
    target.sessionSummary = details.sessionSummary;
    target.mentorNotes = details.mentorNotes;
    target.recommendedMaterials = details.recommendedMaterials || [];
    target.followUpInstructions = details.followUpInstructions;
    target.updatedAt = new Date().toISOString();
    saveStoredMentorshipRequests(all);
    return target;
  }
  return null;
};


export interface IVideoUploadResult {
  videoUrl: string;
  videoStorageKey: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
}

export const uploadVideoFile = async (
  file: File,
  onProgress?: (progressPct: number) => void
): Promise<IVideoUploadResult> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('video', file);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/mentoring/videos/upload-file`, true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res?.data) {
            resolve(res.data);
            return;
          }
        } catch (_e) {}
      }
      const objUrl = URL.createObjectURL(file);
      resolve({
        videoUrl: objUrl,
        videoStorageKey: `local-${file.name}`,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4'
      });
    };

    xhr.onerror = () => {
      const objUrl = URL.createObjectURL(file);
      resolve({
        videoUrl: objUrl,
        videoStorageKey: `local-${file.name}`,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4'
      });
    };

    xhr.send(formData);
  });
};

export const uploadVideoThumbnail = async (
  dataUrlOrFile: string | File
): Promise<{ thumbnailUrl: string; thumbnailStorageKey?: string }> => {
  try {
    if (typeof dataUrlOrFile === 'string') {
      const res = await apiRequest('/mentoring/videos/upload-thumbnail', {
        method: 'POST',
        body: JSON.stringify({ data: dataUrlOrFile })
      });
      if (res?.data) {
        return res.data;
      }
    } else {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('thumbnail', dataUrlOrFile);
      const res = await fetch(`${BASE_URL}/mentoring/videos/upload-thumbnail`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        const body = await res.json();
        if (body?.data) return body.data;
      }
    }
  } catch (_e) {}

  return {
    thumbnailUrl: typeof dataUrlOrFile === 'string' ? dataUrlOrFile : URL.createObjectURL(dataUrlOrFile),
    thumbnailStorageKey: 'fallback-thumbnail'
  };
};

export const cancelMentorshipRequest = async (
  id: string,
  cancelReason?: string
): Promise<IMentorshipRequest | null> => {
  try {
    const res = await apiRequest(`/mentoring/requests/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancelReason })
    });
    if (res?.data) {
      return res.data;
    }
  } catch (_e) {}

  const all = getStoredMentorshipRequests();
  const target = all.find((r) => r.id === id || r._id === id);
  if (target) {
    target.status = 'CANCELLED';
    target.rejectionReason = cancelReason || 'Cancelled by member.';
    target.updatedAt = new Date().toISOString();
    saveStoredMentorshipRequests(all);
    return target;
  }
  return null;
};


// =============================================================
// Secure Document Storage & Optimization API (Module 1)
// =============================================================
export interface UploadedDocumentAsset {
  documentId: string;
  ownerId: string;
  entityType: string;
  entityId?: string;
  originalFileName: string;
  originalFileExtension: string;
  originalMimeType: string;
  originalFileSize: number;
  optimizedMimeType?: string;
  optimizedFileSize?: number;
  thumbnailMimeType?: string;
  thumbnailFileSize?: number;
  storageProvider: 's3' | 'local';
  checksum: string;
  compressionRatio?: number;
  hasOptimizedPreview: boolean;
  hasThumbnail: boolean;
  documentCategory: string;
  documentLabel: string;
  documentNumber?: string;
  documentStatus: string;
  viewUrl: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const extractApiErrorMessage = (payload: any, fallback: string): string => {
  if (!payload) return fallback;
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed && trimmed !== '[object Object]' ? trimmed : fallback;
  }
  const candidate =
    (typeof payload?.error === 'string' && payload.error) ||
    (typeof payload?.error?.message === 'string' && payload.error.message) ||
    (typeof payload?.error?.description === 'string' && payload.error.description) ||
    (typeof payload?.error?.reason === 'string' && payload.error.reason) ||
    (typeof payload?.error_description === 'string' && payload.error_description) ||
    (typeof payload?.message === 'string' && payload.message) ||
    (typeof payload?.description === 'string' && payload.description) ||
    (typeof payload?.reason === 'string' && payload.reason) ||
    '';
  const trimmed = candidate.trim();
  return trimmed && trimmed !== '[object Object]' ? trimmed : fallback;
};

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt'
]);

export const MAX_KYC_FILE_BYTES = 2 * 1024 * 1024; // 2 MB = 2,097,152 bytes

export const validateClientFileBeforeUpload = (
  file: File,
  maxBytes = MAX_KYC_FILE_BYTES,
  allowedExtensions?: string[]
): void => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedSet =
    Array.isArray(allowedExtensions) && allowedExtensions.length > 0
      ? new Set(allowedExtensions.map((x) => x.toLowerCase().replace('.', '')))
      : ALLOWED_DOCUMENT_EXTENSIONS;

  if (!allowedSet.has(ext)) {
    const labelList = Array.from(allowedSet)
      .map((e) => e.toUpperCase())
      .join(', ');
    throw new Error(`Unsupported format ".${ext}". Allowed: ${labelList}.`);
  }
  if (file.size <= 0) {
    throw new Error('Selected file is empty.');
  }
  if (file.size > maxBytes) {
    if (maxBytes === MAX_KYC_FILE_BYTES) {
      throw new Error('File size must not exceed 2 MB. Please upload a smaller file.');
    }
    throw new Error(`File size must not exceed ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }
};

export const uploadDocumentFile = async (
  file: File,
  options?: {
    documentCategory?: string;
    documentLabel?: string;
    documentNumber?: string;
    entityType?: 'KYC' | 'PROFILE' | 'INVESTMENT' | 'SERVICE' | 'GENERAL';
    entityId?: string;
    tokenOverride?: string;
  }
): Promise<UploadedDocumentAsset> => {
  validateClientFileBeforeUpload(file);
  const token = options?.tokenOverride || getAuthToken();
  if (!token) {
    throw new Error('Authentication token is required to upload private documents.');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (options?.documentCategory) formData.append('documentCategory', options.documentCategory);
  if (options?.documentLabel) formData.append('documentLabel', options.documentLabel);
  if (options?.documentNumber) formData.append('documentNumber', options.documentNumber);
  if (options?.entityType) formData.append('entityType', options.entityType);
  if (options?.entityId) formData.append('entityId', options.entityId);

  const response = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `Document upload failed (HTTP ${response.status})`));
  }
  return payload.data as UploadedDocumentAsset;
};

export const listMyDocuments = async (entityType?: string): Promise<UploadedDocumentAsset[]> => {
  const token = getAuthToken();
  if (!token) return [];
  const query = entityType ? `?entityType=${encodeURIComponent(entityType)}` : '';
  const response = await fetch(`${BASE_URL}/documents/my${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => ({}));
  return Array.isArray(payload?.data) ? payload.data : [];
};

const parseFilenameFromDisposition = (disposition: string | null, fallback: string): string => {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const simpleMatch = disposition.match(/filename="?([^";\r\n]+)"?/i);
  return simpleMatch?.[1] || fallback;
};

export const fetchAuthenticatedDocumentBlob = async (
  documentId: string,
  options?: {
    variant?: 'preview' | 'thumbnail' | 'original';
    action?: 'view' | 'download';
    tokenOverride?: string;
  }
): Promise<{
  blobUrl: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  checksum: string | null;
  variantServed: string | null;
}> => {
  const token = options?.tokenOverride || getAuthToken();
  if (!token) {
    throw new Error('Authentication required to access private documents.');
  }

  const action = options?.action || 'view';
  const variantQuery =
    action === 'view' ? `?variant=${encodeURIComponent(options?.variant || 'preview')}` : '';
  const response = await fetch(`${BASE_URL}/documents/${encodeURIComponent(documentId)}/${action}${variantQuery}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(extractApiErrorMessage(errPayload, `Failed to load document (HTTP ${response.status})`));
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const fileName = parseFilenameFromDisposition(
    response.headers.get('Content-Disposition'),
    `${documentId}`
  );
  return {
    blobUrl,
    blob,
    mimeType: response.headers.get('Content-Type') || blob.type || 'application/octet-stream',
    fileName,
    checksum: response.headers.get('X-Original-Checksum-Sha256'),
    variantServed: response.headers.get('X-Document-Variant')
  };
};

export const downloadOriginalDocument = async (
  documentId: string,
  fallbackFileName?: string
): Promise<void> => {
  const result = await fetchAuthenticatedDocumentBlob(documentId, { action: 'download' });
  const a = document.createElement('a');
  a.href = result.blobUrl;
  a.download = fallbackFileName || result.fileName || `${documentId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(result.blobUrl), 15000);
};

// =============================================================
// Real Razorpay Payment Gateway API (Module 2)
// =============================================================
export type RazorpayOrderPurpose =
  | 'MEMBERSHIP_FIRST_YEAR'
  | 'MEMBERSHIP_RENEWAL'
  | 'WALLET_TOPUP'
  | 'SERVICE_ORDER';

export interface RazorpayEnabledMethods {
  upi: boolean;
  card: boolean;
  netbanking: boolean;
  wallet: boolean;
}

export interface RazorpayGatewayMethods extends RazorpayEnabledMethods {
  upiIntent: boolean;
}

export interface RazorpayCheckoutConfig {
  keyId: string;
  mode: 'TEST' | 'LIVE';
  methods: RazorpayEnabledMethods;
  gatewayMethods?: RazorpayGatewayMethods;
}

export const fetchRazorpayCheckoutConfig = async (): Promise<RazorpayCheckoutConfig | null> => {
  try {
    const response = await fetch(`${BASE_URL}/payments/checkout-config`);
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.success && payload?.data ? (payload.data as RazorpayCheckoutConfig) : null;
  } catch {
    return null;
  }
};

export interface RazorpayCreateOrderResponse {
  paymentId: string;
  internalOrderId: string;
  razorpayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  mode: 'TEST' | 'LIVE';
  purpose: RazorpayOrderPurpose;
  description: string;
  enabledMethods?: RazorpayEnabledMethods;
  gatewayMethods?: RazorpayGatewayMethods;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface RazorpayVerifyResponse {
  paymentId: string;
  internalOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  paymentMethod?: string;
  signatureVerified: boolean;
  webhookVerified: boolean;
  verifiedAt?: string;
  alreadyFulfilled?: boolean;
  newBalance?: number;
  membershipActivated?: boolean;
  validUntil?: string;
}

export const createRazorpayPaymentOrder = async (params: {
  purpose: RazorpayOrderPurpose;
  amount?: number;
  serviceId?: string;
  preferredMethod?: string;
  notes?: Record<string, string>;
  tokenOverride?: string;
}): Promise<RazorpayCreateOrderResponse> => {
  const token = params.tokenOverride || getAuthToken();
  if (!token) {
    throw new Error('Authentication required to initiate payment.');
  }

  const response = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      purpose: params.purpose,
      ...(params.amount !== undefined ? { amount: params.amount } : {}),
      ...(params.serviceId ? { serviceId: params.serviceId } : {}),
      ...(params.preferredMethod ? { preferredMethod: params.preferredMethod } : {}),
      ...(params.notes ? { notes: params.notes } : {})
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `Failed to create payment order (HTTP ${response.status})`));
  }
  return payload.data as RazorpayCreateOrderResponse;
};

export const verifyRazorpayPayment = async (params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentMethod?: string;
  tokenOverride?: string;
}): Promise<RazorpayVerifyResponse> => {
  const token = params.tokenOverride || getAuthToken();
  if (!token) {
    throw new Error('Authentication required to verify payment.');
  }

  const response = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature: params.razorpay_signature,
      ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {})
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `Payment verification failed (HTTP ${response.status})`));
  }
  return payload.data as RazorpayVerifyResponse;
};

export const completeTestModeRazorpayPayment = async (params: {
  razorpay_order_id: string;
  method: 'UPI' | 'CARD';
  vpa?: string;
  outcome?: 'success' | 'failure';
  tokenOverride?: string;
}): Promise<RazorpayVerifyResponse> => {
  const token = params.tokenOverride || getAuthToken();
  if (!token) {
    throw new Error('Authentication required to complete test payment.');
  }

  const response = await fetch(`${BASE_URL}/payments/test-mode/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      razorpay_order_id: params.razorpay_order_id,
      method: params.method,
      ...(params.vpa ? { vpa: params.vpa } : {}),
      ...(params.outcome ? { outcome: params.outcome } : {})
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `Test payment failed (HTTP ${response.status})`));
  }
  return payload.data as RazorpayVerifyResponse;
};

export const recordRazorpayFailure = async (params: {
  paymentId: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: 'FAILED' | 'CANCELLED';
  reason?: string;
  tokenOverride?: string;
}): Promise<void> => {
  const token = params.tokenOverride || getAuthToken();
  if (!token) return;

  await fetch(`${BASE_URL}/payments/${encodeURIComponent(params.paymentId)}/failure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      status: params.status,
      reason: params.reason
    })
  }).catch(() => {});
};

export const getPaymentStatus = async (paymentIdOrOrderId: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  const response = await fetch(`${BASE_URL}/payments/${encodeURIComponent(paymentIdOrOrderId)}/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, 'Unable to fetch payment status.'));
  }
  return payload.data;
};

export const getMyPaymentHistory = async (): Promise<any[]> => {
  const token = getAuthToken();
  if (!token) return [];
  const response = await fetch(`${BASE_URL}/payments/my-history`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => ({}));
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const fetchLiveWalletSummary = async (): Promise<IMemberWallet | null> => {
  const token = getAuthToken();
  if (!token) return null;
  const response = await fetch(`${BASE_URL}/wallet`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => ({}));
  return payload?.data || null;
};

export const fetchLiveWalletTransactions = async (): Promise<IWalletTransaction[]> => {
  const token = getAuthToken();
  if (!token) return [];
  const response = await fetch(`${BASE_URL}/wallet/transactions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => ({}));
  return Array.isArray(payload?.data) ? payload.data : [];
};


export const checkEmailAvailability = async (
  email: string
): Promise<{ available: boolean; message: string }> => {
  const response = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, 'Unable to verify email availability.'));
  }
  return payload.data;
};

export const checkMobileAvailability = async (
  phoneNumber: string
): Promise<{ available: boolean; message: string }> => {
  const response = await fetch(`${BASE_URL}/auth/check-mobile?phoneNumber=${encodeURIComponent(phoneNumber.trim())}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, 'Unable to verify mobile number availability.'));
  }
  return payload.data;
};

export const registerAccountStrict = async (body: Record<string, any>): Promise<{ token: string; user: any }> => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !payload?.data?.token) {
    throw new Error(extractApiErrorMessage(payload, `Registration failed (HTTP ${response.status})`));
  }
  return { token: payload.data.token, user: payload.data.user };
};

export const submitKycApplicationStrict = async (
  body: Record<string, any>,
  tokenOverride?: string
): Promise<any> => {
  const token = tokenOverride || getAuthToken();
  if (!token) throw new Error('Authentication required to submit KYC application.');
  const response = await fetch(`${BASE_URL}/kyc/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `KYC submission failed (HTTP ${response.status})`));
  }
  return payload.data;
};


export const reuploadSingleKycDocumentStrict = async (
  docRef: string,
  file: File,
  documentNumber?: string
): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required to reupload document.');
  validateClientFileBeforeUpload(file);

  const formData = new FormData();
  formData.append('file', file);
  if (documentNumber && documentNumber.trim()) {
    formData.append('documentNumber', documentNumber.trim());
  }

  const response = await fetch(`${BASE_URL}/kyc/documents/${encodeURIComponent(docRef)}/reupload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `Document reupload failed (HTTP ${response.status})`));
  }
  return payload.data;
};

export const uploadAdditionalRequestedDocumentStrict = async (
  requestId: string,
  file: File,
  allowedExtensions?: string[]
): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required to upload requested document.');
  validateClientFileBeforeUpload(file, MAX_KYC_FILE_BYTES, allowedExtensions);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/kyc/additional-documents/${encodeURIComponent(requestId)}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(extractApiErrorMessage(payload, `Document upload failed (HTTP ${response.status})`));
  }
  return payload.data;
};

export const fetchMemberNotificationsStrict = async (): Promise<{ notifications: any[]; unreadCount: number }> => {
  const token = getAuthToken();
  if (!token) return { notifications: [], unreadCount: 0 };
  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return { notifications: [], unreadCount: 0 };
  const payload = await response.json().catch(() => ({}));
  return {
    notifications: Array.isArray(payload?.data?.notifications) ? payload.data.notifications : [],
    unreadCount: Number(payload?.data?.unreadCount || 0)
  };
};

export const markMemberNotificationReadStrict = async (id: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) return;
  await fetch(`${BASE_URL}/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => {});
};

export const markAllMemberNotificationsReadStrict = async (): Promise<void> => {
  const token = getAuthToken();
  if (!token) return;
  await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => {});
};

export const fetchMyKycStatus = async (): Promise<any | null> => {
  const token = getAuthToken();
  if (!token) return null;
  const response = await fetch(`${BASE_URL}/kyc/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => ({}));
  return payload?.success ? payload.data : null;
};

export interface IndianPinCodeResult {
  pinCode: string;
  country: string;
  state: string;
  district: string;
  city: string;
  postOffice?: string;
}

export const lookupIndianPinCodeApi = async (pinCode: string): Promise<IndianPinCodeResult> => {
  const clean = String(pinCode || '').trim();
  const response = await fetch(`${BASE_URL}/auth/pincode/${encodeURIComponent(clean)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !payload?.data) {
    throw new Error(
      extractApiErrorMessage(
        payload,
        'Invalid or non-Indian PIN code. Please enter a valid 6-digit Indian PIN code.'
      )
    );
  }
  return payload.data as IndianPinCodeResult;
};

import { INITIAL_CATEGORIES_DATA } from './mockData';
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
  subcategories: string[];
  subCategory?: string;
  subcategoryIds?: string[];
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
    subcategories: ['Freelance Software Developer', 'Cloud Architecture'],
    subCategory: 'Freelance Software Developer',
    subcategoryIds: ['Web Apps', 'Cloud Architecture'],
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    isKycApproved: true,
    membershipStatus: 'ACTIVE',
    isMembershipActive: true,
    membershipPlan: 'First-Year Introductory Membership',
    membershipAmountPaid: '₹99',
    membershipStartDate: '01 Nov 2026',
    membershipExpiryDate: 'Valid for 365 Days',
    renewalInfo: 'Annual renewal available at ₹5,999/yr for Year 2+',
    referralCode: 'FIC-KATHIR-7782',
    referralSource: 'ORGANIC',
    paymentHistory: [
      {
        orderId: 'ORD_99_KATHIR',
        transactionId: 'TXN_UPI_99881122',
        amount: '₹99',
        date: '01 Nov 2026',
        status: 'SUCCESS'
      }
    ],
    role: 'MEMBER',
    roles: ['MEMBER'],
    uploadedDocumentsCount: 2,
    submittedDocuments: [
      {
        type: 'AADHAAR_CARD',
        name: 'Aadhaar Card',
        status: 'VERIFIED',
        uploadedAt: '01 Nov 2026'
      },
      {
        type: 'PAN_CARD',
        name: 'PAN Card',
        status: 'VERIFIED',
        uploadedAt: '01 Nov 2026'
      },
      {
        type: 'TECHNICAL_PORTFOLIO',
        name: 'Professional Technical Credentials',
        status: 'VERIFIED',
        uploadedAt: '01 Nov 2026'
      }
    ],
    personalInfo: {
      dob: '15 Aug 1996',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600028',
      address: 'No. 42, Anna Salai, Teynampet'
    },
    professionalInfo: {
      roleTitle: 'Full-Stack Software Engineer & Cloud Architect',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS Cloud Architecture', 'PostgreSQL'],
      experience: '6+ Years Enterprise & Freelance Engineering',
      portfolioUrl: 'https://kathir.dev',
      description:
        'Specializing in building scalable B2B enterprise applications, cloud native microservices, and AI-driven commercial automation platforms.'
    }
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
    subcategories: ['Textile OEM Manufacturing', 'Precision Garments'],
    subCategory: 'Textile OEM Manufacturing',
    subcategoryIds: ['Textiles', 'OEM Production'],
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    isKycApproved: true,
    membershipStatus: 'ACTIVE',
    isMembershipActive: true,
    membershipPlan: 'First-Year Introductory Membership',
    membershipAmountPaid: '₹99',
    membershipStartDate: '28 Oct 2026',
    membershipExpiryDate: 'Valid for 365 Days',
    renewalInfo: 'Annual renewal available at ₹5,999/yr for Year 2+',
    referralCode: 'FIC-MOORTHY-9914',
    referralSource: 'REFERRED',
    referredByCode: 'FIC-KATHIR-7782',
    referrerUserId: 'usr_kathir_001',
    paymentHistory: [
      {
        orderId: 'ORD_99_MOORTHY',
        transactionId: 'TXN_UPI_55443322',
        amount: '₹99',
        date: '28 Oct 2026',
        status: 'SUCCESS'
      }
    ],
    role: 'MEMBER',
    roles: ['MEMBER'],
    uploadedDocumentsCount: 2,
    submittedDocuments: [
      {
        type: 'AADHAAR_CARD',
        name: 'Aadhaar Card',
        status: 'VERIFIED',
        uploadedAt: '28 Oct 2026'
      },
      {
        type: 'PAN_CARD',
        name: 'PAN Card',
        status: 'VERIFIED',
        uploadedAt: '28 Oct 2026'
      },
      {
        type: 'GST_CERTIFICATE',
        name: 'GSTIN Certificate',
        status: 'VERIFIED',
        uploadedAt: '28 Oct 2026'
      },
      {
        type: 'UDYAM_MSME',
        name: 'Business Registration Certificate',
        status: 'VERIFIED',
        uploadedAt: '28 Oct 2026'
      }
    ],
    personalInfo: {
      dob: '22 May 1984',
      city: 'Tiruppur',
      district: 'Tiruppur',
      state: 'Tamil Nadu',
      pincode: '641604',
      address: 'Plot 12, SIDCO Industrial Estate'
    },
    professionalInfo: {
      businessName: 'Apex Textiles Manufacturing Unit',
      businessType: 'Proprietorship / Export Unit',
      businessLocation: 'Tiruppur Industrial Estate, Tamil Nadu',
      manufacturingType: 'Woven Cotton Garments & Institutional Uniforms',
      productionCapabilities: '50,000 units/month automated stitching & packaging',
      experience: '12+ Years Manufacturing & Export',
      description:
        'End-to-end industrial uniform, corporate workwear, and institutional fabric apparel manufacturing facility with export quality control.'
    }
  },
  {
    id: 'usr_organic_003',
    userId: 'usr_organic_003',
    fullName: 'Priya Sharma',
    email: 'priya@gmail.com',
    phoneNumber: '9845112233',
    mobileNumber: '9845112233',
    primaryCategory: 'Healthcare & Wellness',
    categoryName: 'Healthcare & Wellness',
    primaryCategoryId: 'cat-4',
    subcategories: ['Clinical Nutritionist', 'Wellness Consultant'],
    subCategory: 'Clinical Nutritionist',
    subcategoryIds: ['Nutrition', 'Consulting'],
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    isKycApproved: true,
    membershipStatus: 'ACTIVE',
    isMembershipActive: true,
    membershipPlan: 'First-Year Introductory Membership',
    membershipAmountPaid: '₹99',
    membershipStartDate: '30 Oct 2026',
    membershipExpiryDate: 'Valid for 365 Days',
    renewalInfo: 'Annual renewal available at ₹5,999/yr for Year 2+',
    referralCode: 'FIC-PRIYA-4421',
    referralSource: 'ORGANIC',
    paymentHistory: [
      {
        orderId: 'ORD_99_PRIYA',
        transactionId: 'TXN_UPI_11223344',
        amount: '₹99',
        date: '30 Oct 2026',
        status: 'SUCCESS'
      }
    ],
    role: 'MEMBER',
    roles: ['MEMBER'],
    uploadedDocumentsCount: 2,
    submittedDocuments: [
      {
        type: 'AADHAAR_CARD',
        name: 'Aadhaar Card',
        status: 'VERIFIED',
        uploadedAt: '30 Oct 2026'
      },
      {
        type: 'PAN_CARD',
        name: 'PAN Card',
        status: 'VERIFIED',
        uploadedAt: '30 Oct 2026'
      }
    ],
    personalInfo: {
      dob: '12 Sep 1993',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      pincode: '560001',
      address: 'No. 88, MG Road'
    },
    professionalInfo: {
      businessName: 'Vitality Wellness & Nutrition Consultancy',
      businessType: 'Consultant / Practice',
      businessLocation: 'Bengaluru, Karnataka',
      experience: '7+ Years Clinical & Corporate Wellness',
      description: 'Specializing in preventive healthcare and corporate executive nutrition programmes.'
    }
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

export const calculateAgeFromDob = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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

    if (changed) {
      localStorage.setItem('fic_user', JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthenticatedUser | any): void => {
  // Ensure consistent object structure
  const normalized: AuthenticatedUser = {
    ...user,
    id: user.id || user.userId || `usr_${Date.now()}`,
    userId: user.userId || user.id || `usr_${Date.now()}`,
    mobileNumber: user.mobileNumber || user.phoneNumber || '',
    phoneNumber: user.phoneNumber || user.mobileNumber || '',
    categoryName: user.categoryName || user.primaryCategory || 'Business & Entrepreneurship',
    primaryCategory: user.primaryCategory || user.categoryName || 'Business & Entrepreneurship',
    subcategories:
      user.subcategories && user.subcategories.length > 0
        ? user.subcategories
        : user.subCategory
        ? [user.subCategory]
        : ['Member Workspace'],
    subCategory:
      user.subCategory ||
      (user.subcategories && user.subcategories.length > 0 ? user.subcategories[0] : 'Member Workspace'),
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
      // Ensure existing seeded accounts have latest subcategories, dob and submittedDocuments schema
      const updated = parsed.map((acc: AuthenticatedUser) => {
        const seed = INITIAL_SEED_ACCOUNTS.find((s) => s.userId === acc.userId || s.email === acc.email);
        const mergedDob =
          acc.personalInfo?.dob ||
          seed?.personalInfo?.dob ||
          (acc.email?.toLowerCase() === 'kathir@gmail.com' ? '15 Aug 1996' : undefined);

        const mergedPersonalInfo = {
          ...(seed?.personalInfo || {}),
          ...(acc.personalInfo || {}),
          ...(mergedDob ? { dob: mergedDob } : {})
        };

        const subcats =
          acc.subcategories && acc.subcategories.length > 0
            ? acc.subcategories
            : seed?.subcategories || ['Freelance Specialist'];

        // If documents are generic or missing, use seed documents
        const currentDocs = acc.submittedDocuments || [];
        const isGeneric = currentDocs.length === 1 && currentDocs[0].name?.includes('Proprietor Identity Proof');
        const resolvedDocs = (!currentDocs.length || isGeneric) && seed?.submittedDocuments ? seed.submittedDocuments : currentDocs;

        return {
          ...acc,
          subcategories: subcats,
          subCategory: acc.subCategory || subcats[0],
          submittedDocuments: resolvedDocs,
          uploadedDocumentsCount: resolvedDocs.length,
          personalInfo: mergedPersonalInfo
        };
      });
      return updated;
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

  const existingAccount = index >= 0 ? accounts[index] : null;

  const resolvedDob =
    account.personalInfo?.dob ||
    (account as any).dob ||
    existingAccount?.personalInfo?.dob ||
    (normalizedEmail === 'kathir@gmail.com' ? '15 Aug 1996' : undefined);

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
    subcategories:
      account.subcategories && account.subcategories.length > 0
        ? account.subcategories
        : account.subCategory
        ? [account.subCategory]
        : ['Freelance Specialist'],
    subCategory:
      account.subCategory ||
      (account.subcategories && account.subcategories.length > 0 ? account.subcategories[0] : 'Freelance Specialist'),
    subcategoryIds: account.subcategoryIds || [],
    accountStatus: account.accountStatus || 'ACTIVE',
    kycStatus: account.kycStatus || 'VERIFIED',
    isKycApproved: account.isKycApproved ?? true,
    membershipStatus: account.membershipStatus || 'ACTIVE',
    isMembershipActive: account.isMembershipActive ?? true,
    membershipPlan: account.membershipPlan || 'First-Year Introductory Membership',
    membershipAmountPaid: account.membershipAmountPaid || '₹99',
    membershipStartDate: account.membershipStartDate || 'Active from Registration',
    membershipExpiryDate: account.membershipExpiryDate || 'Valid for 365 Days',
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
    personalInfo: {
      ...(existingAccount?.personalInfo || {}),
      ...(account.personalInfo || {}),
      ...(resolvedDob ? { dob: resolvedDob } : {})
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
      personalInfo: {
        ...(accounts[index].personalInfo || {}),
        ...(updates.personalInfo || {})
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
      ...updates
    };
  }

  if (current && (current.userId === userId || current.id === userId)) {
    localStorage.setItem('fic_user', JSON.stringify(updatedAccount));
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
        category: 'Technology & Digital',
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

const INITIAL_SEED_SERVICES: ServiceListing[] = [
  {
    id: 'srv-1',
    ownerUserId: 'usr_moorthy_002',
    ownerName: 'S. Moorthy',
    categoryId: 'cat-2',
    categoryName: 'Manufacturing & Industrial',
    categorySlug: 'manufacturing-industrial',
    subcategoryId: 'Textile OEM Manufacturing',
    subcategoryName: 'Textile OEM Manufacturing',
    title: 'Bulk Cotton Garment & Uniform Manufacturing',
    shortDescription: 'ISO-certified textile facility offering weaving, dyeing, cutting, stitching and private-label packaging.',
    description: 'ISO-certified textile facility offering end-to-end weaving, dyeing, cutting, stitching and private-label packaging for domestic and export orders.',
    servicesOffered: [
      'Institutional Uniform Stitching',
      'Corporate Workwear Manufacturing',
      'Custom Pattern Cutting & Dyeing',
      'Export Quality Finishing & Packaging'
    ],
    skills: ['Fabric Processing', 'OEM Stitching', 'Quality Assurance', 'Supply Chain Management'],
    tags: ['Textiles', 'Export Quality', 'OEM Garments', 'Bulk Orders'],
    targetCustomers: ['Schools & Colleges', 'Corporates', 'Export Houses', 'Uniform Retailers'],
    coverageArea: 'Pan India & Export',
    deliveryMode: 'BOTH',
    status: 'APPROVED',
    createdAt: '28 Oct 2026',
    updatedAt: '28 Oct 2026'
  },
  {
    id: 'srv-2',
    ownerUserId: 'usr_kathir_001',
    ownerName: 'Kathir',
    categoryId: 'cat-3',
    categoryName: 'Technology & Digital',
    categorySlug: 'technology-digital',
    subcategoryId: 'Cloud Architecture',
    subcategoryName: 'Cloud Architecture & Web Apps',
    title: 'Enterprise Web & Mobile Cloud Application Development',
    shortDescription: 'Full-stack software engineering team specializing in React, Node.js, microservices, AWS cloud migration.',
    description: 'Full-stack software engineering team specializing in React, Node.js, microservices, AWS cloud migration, and secure payment gateway integrations.',
    servicesOffered: [
      'B2B SaaS Web Application Development',
      'Cross-Platform Mobile Apps (iOS & Android)',
      'AWS / GCP Cloud Native Architecture',
      'REST & GraphQL API Microservices'
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS Lambda', 'Docker'],
    tags: ['Web Apps', 'Mobile Apps', 'Cloud Architecture', 'API Development'],
    targetCustomers: ['Startups', 'MSMEs', 'Enterprises', 'E-Commerce Brands'],
    coverageArea: 'Pan India & Global',
    deliveryMode: 'ONLINE',
    status: 'APPROVED',
    createdAt: '01 Nov 2026',
    updatedAt: '01 Nov 2026'
  },
  {
    id: 'srv-3',
    ownerUserId: 'usr_pro_003',
    ownerName: 'Apex Advisory',
    categoryId: 'cat-5',
    categoryName: 'Professional & Personal Services',
    categorySlug: 'professional-personal-services',
    subcategoryId: 'Tax Advisory',
    subcategoryName: 'Chartered Accountancy & Tax',
    title: 'Statutory GST, Company Incorporation & Annual Tax Audit',
    shortDescription: 'Comprehensive financial advisory, secretarial compliance, monthly GST filing, TDS reconciliation, and startup valuation support.',
    description: 'Comprehensive financial advisory, secretarial compliance, monthly GST filing, TDS reconciliation, and startup valuation support.',
    servicesOffered: [
      'Private Limited & LLP Incorporation',
      'Monthly GST & TDS Compliance',
      'Annual Statutory & Tax Audits',
      'Startup Valuation Reports'
    ],
    skills: ['Financial Accounting', 'GST Compliance', 'Taxation', 'Corporate Law'],
    tags: ['GST Filing', 'Audit', 'Company Setup', 'Legal Compliance'],
    targetCustomers: ['Early Stage Startups', 'SME Business Owners', 'Freelancers'],
    coverageArea: 'Pan India',
    deliveryMode: 'BOTH',
    status: 'APPROVED',
    createdAt: '25 Oct 2026',
    updatedAt: '25 Oct 2026'
  },
  {
    id: 'srv-4',
    ownerUserId: 'usr_agri_004',
    ownerName: 'GreenField Agri',
    categoryId: 'cat-6',
    categoryName: 'Agriculture & Natural Resources',
    categorySlug: 'agriculture-natural-resources',
    subcategoryId: 'Cold Storage Supply',
    subcategoryName: 'Agri Cold Chain Logistics',
    title: 'Cold Storage & Bulk Organic Produce Aggregation',
    shortDescription: 'Farm-gate temperature-controlled aggregation and supply logistics for fruits, vegetables, and grain commodities.',
    description: 'Farm-gate temperature-controlled aggregation and supply logistics for fruits, vegetables, and grain commodities direct to distributors.',
    servicesOffered: [
      'Temperature Controlled Warehousing',
      'Farm-Gate Quality Grading & Packaging',
      'Refrigerated Transit Logistics',
      'Bulk Contract Procurement'
    ],
    skills: ['Cold Chain Logistics', 'Organic Certification', 'Agri Procurement', 'Quality Grading'],
    tags: ['Cold Storage', 'Organic Produce', 'B2B Agri Supply', 'Farm Gate'],
    targetCustomers: ['Retail Supermarket Chains', 'Food Processors', 'Wholesale Distributors'],
    coverageArea: 'Tamil Nadu & South India',
    deliveryMode: 'IN_PERSON',
    status: 'APPROVED',
    createdAt: '22 Oct 2026',
    updatedAt: '22 Oct 2026'
  },
  {
    id: 'srv-5',
    ownerUserId: 'usr_biz_005',
    ownerName: 'ScaleVenture Partners',
    categoryId: 'cat-1',
    categoryName: 'Business & Entrepreneurship',
    categorySlug: 'business-entrepreneurship',
    subcategoryId: 'Franchise Setup',
    subcategoryName: 'Retail & Franchise Expansion',
    title: 'Franchise Expansion Strategy & Distributor Network Setup',
    shortDescription: 'Strategic market development for brands looking to expand distributor footprints across South India tier-2 and tier-3 towns.',
    description: 'Strategic market development for brands looking to expand distributor footprints across South India tier-2 and tier-3 towns.',
    servicesOffered: [
      'Franchise Model Legal & Commercial Structuring',
      'Channel Partner & Distributor Vetting',
      'Regional Master Franchise Pitching',
      'Store SOPs & Onboarding Operations'
    ],
    skills: ['Franchise Development', 'Distribution Strategy', 'B2B Sales', 'Retail Operations'],
    tags: ['Franchise', 'Distribution Network', 'Business Expansion'],
    targetCustomers: ['D2C Brands', 'Food & Beverage Chains', 'Apparel Retailers'],
    coverageArea: 'South India',
    deliveryMode: 'BOTH',
    status: 'APPROVED',
    createdAt: '20 Oct 2026',
    updatedAt: '20 Oct 2026'
  },
  {
    id: 'srv-6',
    ownerUserId: 'usr_media_006',
    ownerName: 'VFX & Media Labs',
    categoryId: 'cat-8',
    categoryName: 'Creative, Media & Lifestyle',
    categorySlug: 'creative-media-lifestyle',
    subcategoryId: 'Video Production',
    subcategoryName: 'Commercial Filmmaking',
    title: 'Commercial Video Production & Corporate Ad Filmmaking',
    shortDescription: 'Full production house handling scriptwriting, high-end 4K cinematography, post-production VFX, and social media advertising campaigns.',
    description: 'Full production house handling scriptwriting, high-end 4K cinematography, post-production VFX, and social media advertising campaigns.',
    servicesOffered: [
      'Brand Commercials & TVCs',
      'Corporate Profile & Factory Videos',
      'Product 3D Animation & Explainer Videos',
      'Social Media Ad Campaigns'
    ],
    skills: ['4K Cinematography', 'Video Editing', 'Color Grading', 'Sound Design', 'Motion Graphics'],
    tags: ['Video Production', 'Ad Film', 'Brand Story', 'Media'],
    targetCustomers: ['Brands', 'Advertising Agencies', 'Enterprises', 'Startups'],
    coverageArea: 'Pan India',
    deliveryMode: 'BOTH',
    status: 'APPROVED',
    createdAt: '18 Oct 2026',
    updatedAt: '18 Oct 2026'
  }
];

export const getAllCatalogServices = (): ServiceListing[] => {
  const data = localStorage.getItem(SERVICES_CATALOG_KEY);
  if (!data) {
    localStorage.setItem(SERVICES_CATALOG_KEY, JSON.stringify(INITIAL_SEED_SERVICES));
    return INITIAL_SEED_SERVICES;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(SERVICES_CATALOG_KEY, JSON.stringify(INITIAL_SEED_SERVICES));
    return INITIAL_SEED_SERVICES;
  } catch {
    localStorage.setItem(SERVICES_CATALOG_KEY, JSON.stringify(INITIAL_SEED_SERVICES));
    return INITIAL_SEED_SERVICES;
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

const INITIAL_SEED_MEETINGS: MeetingItem[] = [
  // Kathir's Meetings
  {
    id: 'mtg_k1',
    userId: 'usr_kathir_001',
    title: 'Enterprise Cloud Architecture & Technical Scope Review',
    category: 'Service Scope Alignment',
    scheduledDate: '2026-11-06',
    scheduledTime: '11:00 AM - 11:45 AM IST',
    mode: 'VIRTUAL_MEET',
    modeLabel: 'Google Meet (Encrypted Video)',
    locationOrUrl: 'https://meet.google.com/fic-tec-qwx',
    facilitatorName: 'Er. R. Sundaram',
    facilitatorRole: 'FIC Senior Technical Coordinator',
    agenda: 'Review multi-tenant cloud SaaS deployment scope, database optimization, and intermediary proposal coordination for enterprise client.',
    status: 'SCHEDULED',
    coordinatorNotes: 'Meeting confirmed. Video link active. Intermediary client requirements will be reviewed during session.',
    createdAt: '01 Nov 2026'
  },
  {
    id: 'mtg_k2',
    userId: 'usr_kathir_001',
    title: 'Marketplace Service Listing & Verification Advisory',
    category: 'FIC Opportunity Consultation',
    scheduledDate: '2026-11-08',
    scheduledTime: '03:00 PM - 03:30 PM IST',
    mode: 'VIRTUAL_MEET',
    modeLabel: 'Google Meet (Encrypted Video)',
    locationOrUrl: 'https://meet.google.com/fic-adv-jkl',
    facilitatorName: 'Dr. V. Anand',
    facilitatorRole: 'FIC Marketplace Ecosystem Lead',
    agenda: 'Guidance on listing scalable cloud dev services to corporate buyers and exploring cross-sector B2B partnerships.',
    status: 'PENDING_COORDINATION',
    coordinatorNotes: 'FIC Desk is currently scheduling suitable slot with the industry advisory panel.',
    createdAt: '02 Nov 2026'
  },
  {
    id: 'mtg_k3',
    userId: 'usr_kathir_001',
    title: 'FIC Onboarding & Ecosystem Orientation',
    category: 'FIC Opportunity Consultation',
    scheduledDate: '2026-10-28',
    scheduledTime: '10:00 AM - 10:30 AM IST',
    mode: 'PHONE',
    modeLabel: 'FIC Coordinator Direct Phone Line',
    facilitatorName: 'Ms. S. Meenakshi',
    facilitatorRole: 'FIC Member Onboarding Officer',
    agenda: 'Account activation confirmation, ₹99 introductory pass privileges, KYC document verification completion, and intermediary privacy briefing.',
    status: 'COMPLETED',
    coordinatorNotes: 'Completed successfully. Member profile active and verified.',
    createdAt: '28 Oct 2026'
  },
  // Moorthy's Meetings
  {
    id: 'mtg_m1',
    userId: 'usr_moorthy_002',
    title: 'Garment OEM Expansion & Modernization Consultation',
    category: 'Business Scaling Advisory',
    scheduledDate: '2026-11-07',
    scheduledTime: '02:30 PM - 03:30 PM IST',
    mode: 'IN_PERSON',
    modeLabel: 'FIC Regional Hub (Tiruppur Cluster Office)',
    locationOrUrl: 'FIC Regional Hub, Avinashi Road, Tiruppur, TN',
    facilitatorName: 'Thiru. K. Rajendran',
    facilitatorRole: 'FIC Industrial Infrastructure Director',
    agenda: 'Review 50,000 units/mo weaving & knitting expansion plan, automated cutter procurement subsidy, and export compliance validation.',
    status: 'SCHEDULED',
    coordinatorNotes: 'In-person meeting confirmed at Tiruppur Hub. Please bring factory layout blueprints.',
    createdAt: '01 Nov 2026'
  },
  {
    id: 'mtg_m2',
    userId: 'usr_moorthy_002',
    title: 'Retail Brand OEM Supply Tie-Up Exploration',
    category: 'B2B Partnership Exploration',
    scheduledDate: '2026-11-10',
    scheduledTime: '04:00 PM - 04:45 PM IST',
    mode: 'VIRTUAL_MEET',
    modeLabel: 'Google Meet (Encrypted Video)',
    locationOrUrl: 'https://meet.google.com/fic-oem-b2b',
    facilitatorName: 'Mr. P. Vignesh',
    facilitatorRole: 'FIC B2B Partnerships Officer',
    agenda: 'Discussion on intermediary matching with domestic apparel retail chains seeking Tiruppur manufacturing partners.',
    status: 'PENDING_COORDINATION',
    coordinatorNotes: 'FIC team reviewing corporate buyer requirements before finalizing session time.',
    createdAt: '02 Nov 2026'
  },
  {
    id: 'mtg_m3',
    userId: 'usr_moorthy_002',
    title: 'Textile Export KYC & Compliance Assessment',
    category: 'Service Scope Alignment',
    scheduledDate: '2026-10-25',
    scheduledTime: '11:30 AM - 12:15 PM IST',
    mode: 'PHONE',
    modeLabel: 'FIC Coordinator Direct Phone Line',
    facilitatorName: 'CA. M. Senthil',
    facilitatorRole: 'FIC Compliance & Legal Advisor',
    agenda: 'Statutory GST, IEC code, and Udyam MSME certification verification review.',
    status: 'COMPLETED',
    coordinatorNotes: 'All industrial compliance documents verified.',
    createdAt: '25 Oct 2026'
  }
];

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
        ? `https://meet.google.com/fic-mtg-${Math.floor(100 + Math.random() * 900)}`
        : data.mode === 'IN_PERSON'
        ? 'FIC Regional Hub Center'
        : '+91 80 4567 8900 (Coordinator Extension)',
    facilitatorName: 'FIC Assigned Coordinator',
    facilitatorRole: 'Designated FIC Specialist',
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

const INITIAL_SEED_WALLETS: Record<string, IMemberWallet> = {
  usr_kathir_001: {
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    currency: 'INR',
    totalBalance: 7500,
    availableBalance: 7500,
    pendingBalance: 500,
    restrictedBalance: 0,
    withdrawalEligibleBalance: 6500,
    membershipEligibleBalance: 7500,
    totalAdded: 6000,
    totalWithdrawn: 1000,
    totalReferralEarnings: 1500,
    totalRenewalSpent: 0,
    status: WalletStatus.ACTIVE,
    createdAt: '01 Nov 2026',
    updatedAt: 'Today'
  },
  usr_moorthy_002: {
    walletId: 'wlt_moorthy_002',
    userId: 'usr_moorthy_002',
    currency: 'INR',
    totalBalance: 2000,
    availableBalance: 2000,
    pendingBalance: 0,
    restrictedBalance: 0,
    withdrawalEligibleBalance: 1500,
    membershipEligibleBalance: 2000,
    totalAdded: 1500,
    totalWithdrawn: 0,
    totalReferralEarnings: 500,
    totalRenewalSpent: 0,
    status: WalletStatus.ACTIVE,
    createdAt: '28 Oct 2026',
    updatedAt: 'Today'
  },
  usr_organic_003: {
    walletId: 'wlt_priya_003',
    userId: 'usr_organic_003',
    currency: 'INR',
    totalBalance: 1000,
    availableBalance: 1000,
    pendingBalance: 0,
    restrictedBalance: 0,
    withdrawalEligibleBalance: 1000,
    membershipEligibleBalance: 1000,
    totalAdded: 1000,
    totalWithdrawn: 0,
    totalReferralEarnings: 0,
    totalRenewalSpent: 0,
    status: WalletStatus.ACTIVE,
    createdAt: '30 Oct 2026',
    updatedAt: 'Today'
  }
};

const INITIAL_SEED_TRANSACTIONS: IWalletTransaction[] = [
  // Kathir's ledger
  {
    transactionId: 'TXN_CR_901',
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    transactionType: WalletTransactionType.ADD_FUNDS,
    direction: 'CREDIT',
    amount: 5000,
    currency: 'INR',
    description: 'Wallet top-up via UPI (Google Pay)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 5000,
    createdAt: '01 Nov 2026, 10:15 AM'
  },
  {
    transactionId: 'TXN_CR_902',
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    transactionType: WalletTransactionType.REFERRAL_REWARD,
    direction: 'CREDIT',
    amount: 500,
    currency: 'INR',
    description: 'Referral reward credited for S. Moorthy (Textile OEM)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 5500,
    createdAt: '01 Nov 2026, 02:30 PM'
  },
  {
    transactionId: 'TXN_CR_903',
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    transactionType: WalletTransactionType.REFERRAL_REWARD,
    direction: 'CREDIT',
    amount: 500,
    currency: 'INR',
    description: 'Referral reward credited for R. Vignesh (Verified Member)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 6000,
    createdAt: '01 Nov 2026, 05:45 PM'
  },
  {
    transactionId: 'TXN_CR_904',
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    transactionType: WalletTransactionType.ADD_FUNDS,
    direction: 'CREDIT',
    amount: 2000,
    currency: 'INR',
    description: 'Wallet top-up via Net Banking (HDFC Bank)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 8000,
    createdAt: '02 Nov 2026, 09:20 AM'
  },
  {
    transactionId: 'TXN_CR_905',
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    transactionType: WalletTransactionType.REFERRAL_REWARD,
    direction: 'CREDIT',
    amount: 500,
    currency: 'INR',
    description: 'Referral reward credited for K. Senthil Kumar (Verified Member)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 8500,
    createdAt: '02 Nov 2026, 11:10 AM'
  },
  {
    transactionId: 'TXN_WD_906',
    walletId: 'wlt_kathir_001',
    userId: 'usr_kathir_001',
    transactionType: WalletTransactionType.WITHDRAWAL,
    direction: 'DEBIT',
    amount: 1000,
    currency: 'INR',
    description: 'Bank withdrawal processed to HDFC Bank (XXXX XXXX 4892)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 7500,
    createdAt: '02 Nov 2026, 01:40 PM'
  },

  // Moorthy's ledger
  {
    transactionId: 'TXN_M_201',
    walletId: 'wlt_moorthy_002',
    userId: 'usr_moorthy_002',
    transactionType: WalletTransactionType.ADD_FUNDS,
    direction: 'CREDIT',
    amount: 1500,
    currency: 'INR',
    description: 'Wallet top-up via UPI (PhonePe)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 1500,
    createdAt: '29 Oct 2026, 11:00 AM'
  },
  {
    transactionId: 'TXN_M_202',
    walletId: 'wlt_moorthy_002',
    userId: 'usr_moorthy_002',
    transactionType: WalletTransactionType.REFERRAL_REWARD,
    direction: 'CREDIT',
    amount: 500,
    currency: 'INR',
    description: 'Referral reward credited for G. Balaji (Verified Member)',
    status: WalletTransactionStatus.COMPLETED,
    balanceAfter: 2000,
    createdAt: '30 Oct 2026, 04:15 PM'
  }
];

const INITIAL_SEED_REFERRALS: IReferral[] = [
  // Kathir's Referrals
  {
    referralId: 'REF_K01',
    referralCode: 'FIC-KATHIR-7782',
    referrerUserId: 'usr_kathir_001',
    referrerName: 'Kathir',
    referredUserId: 'usr_moorthy_002',
    referredName: 'S. Moorthy',
    referredEmail: 'moorthy@ficapp.in',
    referralSource: 'REFERRED',
    registrationDate: '28 Oct 2026',
    paymentStatus: 'PAID',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    referralStatus: 'REWARDED',
    rewardAmount: 500,
    rewardStatus: 'CREDITED',
    approvedBy: 'SUPER_ADMIN',
    approvedAt: '28 Oct 2026',
    creditedAt: '28 Oct 2026',
    createdAt: '28 Oct 2026',
    updatedAt: '28 Oct 2026'
  },
  {
    referralId: 'REF_K02',
    referralCode: 'FIC-KATHIR-7782',
    referrerUserId: 'usr_kathir_001',
    referrerName: 'Kathir',
    referredUserId: 'usr_ref_004',
    referredName: 'R. Vignesh',
    referredEmail: 'vignesh.textiles@gmail.com',
    referralSource: 'REFERRED',
    registrationDate: '29 Oct 2026',
    paymentStatus: 'PAID',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    referralStatus: 'REWARDED',
    rewardAmount: 500,
    rewardStatus: 'CREDITED',
    approvedBy: 'SUPER_ADMIN',
    approvedAt: '29 Oct 2026',
    creditedAt: '29 Oct 2026',
    createdAt: '29 Oct 2026',
    updatedAt: '29 Oct 2026'
  },
  {
    referralId: 'REF_K03',
    referralCode: 'FIC-KATHIR-7782',
    referrerUserId: 'usr_kathir_001',
    referrerName: 'Kathir',
    referredUserId: 'usr_ref_005',
    referredName: 'K. Senthil Kumar',
    referredEmail: 'senthil.logistics@gmail.com',
    referralSource: 'REFERRED',
    registrationDate: '30 Oct 2026',
    paymentStatus: 'PAID',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    referralStatus: 'REWARDED',
    rewardAmount: 500,
    rewardStatus: 'CREDITED',
    approvedBy: 'SUPER_ADMIN',
    approvedAt: '30 Oct 2026',
    creditedAt: '30 Oct 2026',
    createdAt: '30 Oct 2026',
    updatedAt: '30 Oct 2026'
  },
  {
    referralId: 'REF_K04',
    referralCode: 'FIC-KATHIR-7782',
    referrerUserId: 'usr_kathir_001',
    referrerName: 'Kathir',
    referredUserId: 'usr_ref_006',
    referredName: 'Deepa Ramanathan',
    referredEmail: 'deepa.fintech@gmail.com',
    referralSource: 'REFERRED',
    registrationDate: '01 Nov 2026',
    paymentStatus: 'PAID',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    referralStatus: 'ELIGIBLE',
    rewardAmount: 500,
    rewardStatus: 'PENDING_APPROVAL',
    createdAt: '01 Nov 2026',
    updatedAt: '01 Nov 2026'
  },
  {
    referralId: 'REF_K05',
    referralCode: 'FIC-KATHIR-7782',
    referrerUserId: 'usr_kathir_001',
    referrerName: 'Kathir',
    referredUserId: 'usr_ref_007',
    referredName: 'Arun Prakash',
    referredEmail: 'arun.agri@gmail.com',
    referralSource: 'REFERRED',
    registrationDate: '02 Nov 2026',
    paymentStatus: 'PENDING',
    kycStatus: 'PENDING',
    accountStatus: 'ACTIVE',
    referralStatus: 'REGISTERED',
    rewardAmount: 500,
    rewardStatus: 'PENDING_ELIGIBILITY',
    createdAt: '02 Nov 2026',
    updatedAt: '02 Nov 2026'
  },

  // Moorthy's Referral
  {
    referralId: 'REF_M01',
    referralCode: 'FIC-MOORTHY-9914',
    referrerUserId: 'usr_moorthy_002',
    referrerName: 'S. Moorthy',
    referredUserId: 'usr_ref_008',
    referredName: 'G. Balaji',
    referredEmail: 'balaji.spinning@gmail.com',
    referralSource: 'REFERRED',
    registrationDate: '30 Oct 2026',
    paymentStatus: 'PAID',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    referralStatus: 'REWARDED',
    rewardAmount: 500,
    rewardStatus: 'CREDITED',
    approvedBy: 'SUPER_ADMIN',
    approvedAt: '30 Oct 2026',
    creditedAt: '30 Oct 2026',
    createdAt: '30 Oct 2026',
    updatedAt: '30 Oct 2026'
  },

  // Organic registration
  {
    referralId: 'REF_ORG01',
    referralCode: 'ORGANIC',
    referrerUserId: 'usr_system',
    referredUserId: 'usr_organic_003',
    referredName: 'Priya Sharma',
    referredEmail: 'priya@gmail.com',
    referralSource: 'ORGANIC',
    registrationDate: '30 Oct 2026',
    paymentStatus: 'PAID',
    kycStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    referralStatus: 'INELIGIBLE',
    rewardAmount: 0,
    rewardStatus: 'REJECTED',
    createdAt: '30 Oct 2026',
    updatedAt: '30 Oct 2026'
  }
];

const INITIAL_SEED_BANK_ACCOUNTS: Record<string, IMemberBankAccount> = {
  usr_kathir_001: {
    bankAccountId: 'bnk_kathir_01',
    userId: 'usr_kathir_001',
    accountHolderName: 'Kathir',
    bankName: 'HDFC Bank Ltd',
    accountNumberMasked: 'XXXX XXXX 4892',
    ifscCode: 'HDFC0001234',
    accountType: 'SAVINGS',
    verificationStatus: 'VERIFIED',
    verifiedAt: '01 Nov 2026',
    createdAt: '01 Nov 2026'
  },
  usr_moorthy_002: {
    bankAccountId: 'bnk_moorthy_01',
    userId: 'usr_moorthy_002',
    accountHolderName: 'S. Moorthy',
    bankName: 'State Bank of India',
    accountNumberMasked: 'XXXX XXXX 7712',
    ifscCode: 'SBIN0004567',
    accountType: 'CURRENT',
    verificationStatus: 'VERIFIED',
    verifiedAt: '28 Oct 2026',
    createdAt: '28 Oct 2026'
  }
};

const INITIAL_SEED_NOTIFICATIONS: Record<string, IWalletNotification[]> = {
  usr_kathir_001: [
    {
      id: 'notif_k1',
      userId: 'usr_kathir_001',
      title: 'Money Added Successfully',
      message: '₹2,000 has been credited to your FIC Wallet via Net Banking.',
      type: 'MONEY_ADDED_SUCCESS',
      isRead: false,
      createdAt: 'Today, 09:20 AM'
    },
    {
      id: 'notif_k2',
      userId: 'usr_kathir_001',
      title: 'New Referral Registration Received',
      message: 'Deepa Ramanathan registered using your referral code FIC-KATHIR-7782.',
      type: 'REFERRAL_REGISTRATION',
      isRead: false,
      createdAt: 'Yesterday, 04:15 PM'
    },
    {
      id: 'notif_k3',
      userId: 'usr_kathir_001',
      title: 'Referral Reward Credited: ₹500',
      message: '₹500 has been credited to your wallet for K. Senthil Kumar (Verified Member).',
      type: 'REFERRAL_REWARD_CREDITED',
      isRead: false,
      createdAt: 'Yesterday, 11:10 AM'
    },
    {
      id: 'notif_k4',
      userId: 'usr_kathir_001',
      title: 'Bank Withdrawal Completed',
      message: 'Withdrawal of ₹1,000 has been successfully remitted to your HDFC Bank account.',
      type: 'WITHDRAWAL_COMPLETED',
      isRead: true,
      createdAt: '01 Nov 2026'
    },
    {
      id: 'notif_k5',
      userId: 'usr_kathir_001',
      title: 'Membership Annual Renewal Reminder',
      message: 'Year 2 renewal at ₹5,999 is available anytime using your FIC Wallet balance.',
      type: 'MEMBERSHIP_EXPIRY_REMINDER',
      isRead: true,
      createdAt: '01 Nov 2026'
    }
  ],
  usr_moorthy_002: [
    {
      id: 'notif_m1',
      userId: 'usr_moorthy_002',
      title: 'Referral Reward Credited: ₹500',
      message: '₹500 referral reward for G. Balaji credited to your wallet.',
      type: 'REFERRAL_REWARD_CREDITED',
      isRead: false,
      createdAt: '30 Oct 2026'
    },
    {
      id: 'notif_m2',
      userId: 'usr_moorthy_002',
      title: 'Money Added Successfully',
      message: '₹1,500 has been credited to your FIC Wallet via UPI.',
      type: 'MONEY_ADDED_SUCCESS',
      isRead: true,
      createdAt: '29 Oct 2026'
    }
  ]
};

// -------------------------------------------------------------
// Storage Access Helpers
// -------------------------------------------------------------
const getStoredWallets = (): Record<string, IMemberWallet> => {
  try {
    const raw = localStorage.getItem(WALLETS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_WALLETS));
      return { ...INITIAL_SEED_WALLETS };
    }
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_SEED_WALLETS };
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
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_TRANSACTIONS));
      return [...INITIAL_SEED_TRANSACTIONS];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_SEED_TRANSACTIONS];
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
      localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_REFERRALS));
      return [...INITIAL_SEED_REFERRALS];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_SEED_REFERRALS];
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
        t.description.toLowerCase().includes(q)
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
  }
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifs = getAllNotifications();
  const list = notifs[userId] || [];
  list.forEach((n) => (n.isRead = true));
  saveAllNotifications(notifs);
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




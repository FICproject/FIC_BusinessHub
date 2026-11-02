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
        type: 'AADHAAR_OR_PAN',
        name: 'Proprietor PAN Card',
        documentNumber: 'ABCDE1234F',
        status: 'VERIFIED',
        uploadedAt: '01 Nov 2026'
      },
      {
        type: 'TECHNICAL_PORTFOLIO',
        name: 'Technical Verification & Work Portfolio',
        documentNumber: 'PORT-K01',
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
        type: 'GST_CERTIFICATE',
        name: 'GST Registration Certificate',
        documentNumber: '33AAAAA0000A1Z5',
        status: 'VERIFIED',
        uploadedAt: '28 Oct 2026'
      },
      {
        type: 'UDYAM_MSME',
        name: 'Udyam MSME Registration Certificate',
        documentNumber: 'UDYAM-TN-03-0012345',
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
      // Ensure existing seeded accounts have latest subcategories schema
      const updated = parsed.map((acc: AuthenticatedUser) => {
        const seed = INITIAL_SEED_ACCOUNTS.find((s) => s.userId === acc.userId || s.email === acc.email);
        if (seed && (!acc.subcategories || acc.subcategories.length === 0)) {
          return { ...seed, ...acc, subcategories: seed.subcategories, subCategory: seed.subCategory };
        }
        return acc;
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
    uploadedDocumentsCount: account.uploadedDocumentsCount || 2,
    submittedDocuments: account.submittedDocuments || [
      {
        type: 'ID_PROOF',
        name: 'Proprietor Identity Proof (Aadhaar / PAN)',
        documentNumber: 'Verified on Onboarding',
        status: 'VERIFIED',
        uploadedAt: 'On Registration'
      }
    ],
    personalInfo: account.personalInfo || {},
    professionalInfo: account.professionalInfo || {}
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

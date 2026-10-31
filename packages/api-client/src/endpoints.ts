export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_ME: '/api/v1/auth/me',

  // Categories & Configs
  CATEGORIES: '/api/v1/categories',
  CATEGORY_CONFIG: (id: string) => `/api/v1/category-configurations/${id}`,

  // Membership & KYC
  MEMBERSHIP_STATUS: '/api/v1/membership/status',
  MEMBERSHIP_INITIATE_PAYMENT: '/api/v1/payments/membership',
  KYC_SUBMIT: '/api/v1/kyc/submit',
  KYC_STATUS: '/api/v1/kyc/status',

  // Marketplace & Services
  SERVICES: '/api/v1/services',
  SERVICE_REQUESTS: '/api/v1/services/requests',

  // Admin Workspaces
  ADMIN_MEMBERS: '/api/v1/admin/members',
  ADMIN_KYC_PENDING: '/api/v1/admin/kyc/pending',
  ADMIN_KYC_REVIEW: (id: string) => `/api/v1/admin/kyc/${id}/review`,
  ADMIN_CONFIG_BUILDER: '/api/v1/admin/category-configurations'
};

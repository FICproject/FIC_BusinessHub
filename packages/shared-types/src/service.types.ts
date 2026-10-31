export enum ServiceListingStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE'
}

export enum ServiceRequestStatus {
  SUBMITTED = 'SUBMITTED',
  IN_FIC_REVIEW = 'IN_FIC_REVIEW',
  PROVIDER_CONTACTED = 'PROVIDER_CONTACTED',
  PROPOSAL_COORDINATION = 'PROPOSAL_COORDINATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export interface IServiceListing {
  _id: string;
  providerId: string;
  categoryId: string;
  title: string;
  description: string;
  pricingType: 'FIXED' | 'STARTING_FROM' | 'CUSTOM_QUOTE';
  price?: number;
  deliveryTimeline?: string;
  status: ServiceListingStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IServiceRequest {
  _id: string;
  serviceId: string;
  requesterId: string;
  assignedFicStaffId?: string;
  status: ServiceRequestStatus;
  requirementNotes: string;
  ficNotes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}


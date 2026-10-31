export enum KYCStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESUBMIT_REQUIRED = 'RESUBMIT_REQUIRED'
}

export interface IKYCDocument {
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  uploadedAt: Date | string;
  verificationStatus: KYCStatus;
  remarks?: string;
}

export interface IKYCSubmission {
  _id: string;
  userId: string;
  categoryId: string;
  status: KYCStatus;
  documents: IKYCDocument[];
  reviewedBy?: string;
  reviewedAt?: Date | string;
  rejectionReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

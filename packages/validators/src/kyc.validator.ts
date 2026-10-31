import { z } from 'zod';

export const kycUploadSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  documents: z.array(z.object({
    documentType: z.string().min(1, 'Document type is required'),
    documentNumber: z.string().optional(),
    fileUrl: z.string().url('Invalid file URL')
  })).min(1, 'At least one KYC document is required')
});

export const kycReviewSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  status: z.enum(['APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED']),
  rejectionReason: z.string().optional(),
  remarks: z.string().optional()
});

export type KycUploadInput = z.infer<typeof kycUploadSchema>;
export type KycReviewInput = z.infer<typeof kycReviewSchema>;


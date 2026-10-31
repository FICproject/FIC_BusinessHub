import { z } from 'zod';

export const serviceListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  pricingType: z.enum(['FIXED', 'STARTING_FROM', 'CUSTOM_QUOTE']),
  price: z.number().positive().optional(),
  deliveryTimeline: z.string().optional()
});

export const serviceRequestSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  requirementNotes: z.string().min(10, 'Please provide details about your requirement (at least 10 characters)')
});

export type ServiceListingInput = z.infer<typeof serviceListingSchema>;
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;


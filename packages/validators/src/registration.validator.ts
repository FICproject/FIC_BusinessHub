import { z } from 'zod';

export const dynamicRegistrationFieldSchema = z.record(z.string(), z.any());

export const dynamicSubmissionSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryIds: z.array(z.string()).min(1, 'Select at least one subcategory'),
  fieldsData: dynamicRegistrationFieldSchema
});

export type DynamicSubmissionInput = z.infer<typeof dynamicSubmissionSchema>;

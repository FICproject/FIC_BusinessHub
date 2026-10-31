import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits starting with 6-9)'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  primaryCategoryId: z.string().min(1, 'Please select a primary business category'),
  subcategoryIds: z.array(z.string()).optional(),
  ageConfirmed: z.boolean().refine(val => val === true, 'You must be at least 18 years old to join'),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required')
});

export const otpVerifySchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

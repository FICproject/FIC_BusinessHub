import mongoose, { Schema, Document } from 'mongoose';
import { AdminPaymentStatus, PaymentType } from '@fic/shared-types';

export interface IPayment extends Document {
  paymentId?: string;
  internalOrderId?: string;
  memberId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  purpose?: string;
  status: AdminPaymentStatus;
  gatewayProvider: string;
  gatewayTransactionId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  signatureVerified?: boolean;
  webhookVerified?: boolean;
  failureReason?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, index: true },
    internalOrderId: { type: String, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentType: {
      type: String,
      enum: ['INTRO_FEE', 'ANNUAL_RENEWAL', 'MANUAL_OVERRIDE', 'WALLET_TOPUP', 'SERVICE_ORDER'],
      default: 'INTRO_FEE',
      required: true,
    },
    purpose: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'SUCCESS',
      required: true,
    },
    gatewayProvider: { type: String, default: 'RAZORPAY' },
    gatewayTransactionId: { type: String, required: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    paymentMethod: { type: String },
    signatureVerified: { type: Boolean, default: false },
    webhookVerified: { type: Boolean, default: false },
    failureReason: { type: String },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

export const AdminPaymentModel =
  (mongoose.models.AdminPayment as mongoose.Model<IPayment>) ||
  mongoose.model<IPayment>('AdminPayment', PaymentSchema);
export const PaymentModel = AdminPaymentModel;

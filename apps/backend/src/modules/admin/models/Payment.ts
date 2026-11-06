import mongoose, { Schema, Document } from 'mongoose';
import { AdminPaymentStatus, PaymentType } from '@fic/shared-types';

export interface IPayment extends Document {
  memberId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: AdminPaymentStatus;
  gatewayProvider: string;
  gatewayTransactionId: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentType: {
      type: String,
      enum: ['INTRO_FEE', 'ANNUAL_RENEWAL', 'MANUAL_OVERRIDE'],
      default: 'INTRO_FEE',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'SUCCESS',
      required: true,
    },
    gatewayProvider: { type: String, default: 'RAZORPAY' },
    gatewayTransactionId: { type: String, required: true },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

export const PaymentModel = (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema);

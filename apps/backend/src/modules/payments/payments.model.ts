import mongoose, { Document, Schema } from 'mongoose';
import { PaymentStatus } from '@fic/shared-types';

export interface IPaymentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  purpose: 'MEMBERSHIP_FIRST_YEAR' | 'MEMBERSHIP_RENEWAL';
  provider: 'MOCK_GATEWAY' | 'RAZORPAY';
  paymentDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, unique: true },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.INITIATED
    },
    purpose: {
      type: String,
      enum: ['MEMBERSHIP_FIRST_YEAR', 'MEMBERSHIP_RENEWAL'],
      default: 'MEMBERSHIP_FIRST_YEAR'
    },
    provider: {
      type: String,
      enum: ['MOCK_GATEWAY', 'RAZORPAY'],
      default: 'MOCK_GATEWAY'
    },
    paymentDetails: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPaymentDocument>('Payment', PaymentSchema);

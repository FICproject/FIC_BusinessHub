import mongoose, { Document, Schema } from 'mongoose';

export type PaymentPurpose =
  | 'MEMBERSHIP_FIRST_YEAR'
  | 'MEMBERSHIP_RENEWAL'
  | 'WALLET_TOPUP'
  | 'SERVICE_ORDER'
  | 'FIRST_YEAR_MEMBERSHIP'
  | 'ANNUAL_RENEWAL';

export type PaymentGatewayStatus =
  | 'CREATED'
  | 'INITIATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface IPaymentDocument extends Document {
  paymentId: string;
  userId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  orderId: string;
  internalOrderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  transactionId?: string;
  transactionReference?: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  status: PaymentGatewayStatus;
  paymentMethod?: string;
  preferredMethod?: string;
  purpose: PaymentPurpose;
  provider: string;
  mode: 'TEST' | 'LIVE';
  signatureVerified: boolean;
  webhookVerified: boolean;
  fulfilled: boolean;
  webhookEventIds: string[];
  failureReason?: string;
  verifiedAt?: Date;
  paymentDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', index: true },
    orderId: { type: String, required: true, index: true },
    internalOrderId: { type: String, required: true, unique: true, index: true },
    razorpayOrderId: { type: String, unique: true, sparse: true, index: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true, index: true },
    razorpaySignature: { type: String },
    transactionId: { type: String },
    transactionReference: { type: String },
    amount: { type: Number, required: true },
    amountInPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['CREATED', 'INITIATED', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: 'CREATED',
      index: true
    },
    paymentMethod: { type: String },
    preferredMethod: { type: String },
    purpose: {
      type: String,
      enum: [
        'MEMBERSHIP_FIRST_YEAR',
        'MEMBERSHIP_RENEWAL',
        'WALLET_TOPUP',
        'SERVICE_ORDER',
        'FIRST_YEAR_MEMBERSHIP',
        'ANNUAL_RENEWAL'
      ],
      required: true,
      index: true
    },
    provider: { type: String, default: 'RAZORPAY' },
    mode: { type: String, enum: ['TEST', 'LIVE'], default: 'TEST' },
    signatureVerified: { type: Boolean, default: false },
    webhookVerified: { type: Boolean, default: false },
    fulfilled: { type: Boolean, default: false },
    webhookEventIds: { type: [String], default: [] },
    failureReason: { type: String },
    verifiedAt: { type: Date },
    paymentDetails: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const PaymentModel =
  (mongoose.models.Payment as mongoose.Model<IPaymentDocument>) ||
  mongoose.model<IPaymentDocument>('Payment', PaymentSchema);

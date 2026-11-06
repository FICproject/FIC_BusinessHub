import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralConfig extends Document {
  key: string;
  bonusPerReferral: number;
  currency: string;
  minimumPayoutAmount: number;
  isActive: boolean;
  updatedBy?: string;
  updatedAt: Date;
}

export interface IReferralRecord extends Document {
  referrerMemberId: mongoose.Types.ObjectId;
  referrerName: string;
  referrerEmail: string;
  referredMemberId: mongoose.Types.ObjectId;
  referredName: string;
  referredEmail: string;
  bonusAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  payoutDate?: Date;
  payoutReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralConfigSchema = new Schema<IReferralConfig>(
  {
    key: { type: String, required: true, unique: true, default: 'DEFAULT_CONFIG' },
    bonusPerReferral: { type: Number, required: true, default: 500 },
    currency: { type: String, default: 'INR' },
    minimumPayoutAmount: { type: Number, default: 1000 },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

const ReferralRecordSchema = new Schema<IReferralRecord>(
  {
    referrerMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    referrerName: { type: String, required: true },
    referrerEmail: { type: String, required: true },
    referredMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    referredName: { type: String, required: true },
    referredEmail: { type: String, required: true },
    bonusAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'],
      default: 'APPROVED',
    },
    payoutDate: { type: Date },
    payoutReference: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ReferralConfigModel = (mongoose.models.ReferralConfig as mongoose.Model<IReferralConfig>) || mongoose.model<IReferralConfig>('ReferralConfig', ReferralConfigSchema);
export const ReferralRecordModel = (mongoose.models.ReferralRecord as mongoose.Model<IReferralRecord>) || mongoose.model<IReferralRecord>('ReferralRecord', ReferralRecordSchema);

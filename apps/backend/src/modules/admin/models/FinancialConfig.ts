import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialConfig extends Document {
  key: string;
  firstYearMembershipFee: number;
  renewalMembershipFee: number;
  referralRewardAmount: number;
  referralProgramEnabled: boolean;
  minWithdrawalAmount: number;
  currency: string;
  pricingVersion: number;
  updatedByAdminId?: string;
  updatedByAdminName?: string;
  updatedAt: Date;
  createdAt: Date;
}

const FinancialConfigSchema = new Schema<IFinancialConfig>(
  {
    key: { type: String, required: true, unique: true, default: 'DEFAULT_FINANCIAL_CONFIG' },
    firstYearMembershipFee: { type: Number, required: true, default: 99 },
    renewalMembershipFee: { type: Number, required: true, default: 5999 },
    referralRewardAmount: { type: Number, required: true, default: 500 },
    referralProgramEnabled: { type: Boolean, default: true },
    minWithdrawalAmount: { type: Number, default: 500 },
    currency: { type: String, default: 'INR' },
    pricingVersion: { type: Number, default: 1 },
    updatedByAdminId: { type: String },
    updatedByAdminName: { type: String, default: 'System Initializer' },
  },
  { timestamps: true }
);

export const FinancialConfigModel =
  (mongoose.models.FinancialConfig as mongoose.Model<IFinancialConfig>) ||
  mongoose.model<IFinancialConfig>('FinancialConfig', FinancialConfigSchema);

export async function ensureFinancialConfig(): Promise<IFinancialConfig> {
  let config = await FinancialConfigModel.findOne({ key: 'DEFAULT_FINANCIAL_CONFIG' });
  if (!config) {
    config = await FinancialConfigModel.create({
      key: 'DEFAULT_FINANCIAL_CONFIG',
      firstYearMembershipFee: 99,
      renewalMembershipFee: 5999,
      referralRewardAmount: 500,
      referralProgramEnabled: true,
      minWithdrawalAmount: 500,
      currency: 'INR',
      pricingVersion: 1,
      updatedByAdminName: 'System Initializer'
    });
  }
  return config;
}


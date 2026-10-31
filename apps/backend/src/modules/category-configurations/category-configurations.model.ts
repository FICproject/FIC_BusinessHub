import mongoose, { Document, Schema } from 'mongoose';
import { ConfigStatus } from '@fic/shared-types';

export interface IFormField {
  fieldKey: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'file' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface IKYCRequirement {
  documentType: string;
  label: string;
  description?: string;
  required: boolean;
}

export interface ICategoryConfigurationDocument extends Document {
  categoryId: mongoose.Types.ObjectId;
  version: number;
  status: ConfigStatus;
  registrationFields: IFormField[];
  kycRequiredDocuments: IKYCRequirement[];
  dashboardWidgets: string[];
  featuresEnabled: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryConfigurationSchema = new Schema<ICategoryConfigurationDocument>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(ConfigStatus),
      default: ConfigStatus.PUBLISHED
    },
    registrationFields: [
      {
        fieldKey: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, required: true },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
        placeholder: { type: String },
        helpText: { type: String }
      }
    ],
    kycRequiredDocuments: [
      {
        documentType: { type: String, required: true },
        label: { type: String, required: true },
        description: { type: String },
        required: { type: Boolean, default: true }
      }
    ],
    dashboardWidgets: [{ type: String }],
    featuresEnabled: [{ type: String }]
  },
  { timestamps: true }
);

export const CategoryConfigurationModel = mongoose.model<ICategoryConfigurationDocument>(
  'CategoryConfiguration',
  CategoryConfigurationSchema
);


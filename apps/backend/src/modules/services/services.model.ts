import mongoose, { Document, Schema } from 'mongoose';
import { ServiceListingStatus } from '@fic/shared-types';

export interface IServiceListingDocument extends Document {
  providerId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  categoryName?: string;
  categorySlug?: string;
  subcategoryName?: string;
  title: string;
  shortDescription?: string;
  description: string;
  servicesOffered?: string[];
  skills?: string[];
  tags: string[];
  targetCustomers?: string[];
  coverageArea?: string;
  deliveryMode?: 'ONLINE' | 'IN_PERSON' | 'BOTH';
  portfolioUrl?: string;
  supportingDocument?: string;
  pricingType?: 'FIXED' | 'STARTING_FROM' | 'CUSTOM_QUOTE';
  price?: number;
  deliveryTimeline?: string;
  status: ServiceListingStatus;
  adminFeedback?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceListingSchema = new Schema<IServiceListingDocument>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'Subcategory' },
    categoryName: { type: String, trim: true },
    categorySlug: { type: String, trim: true },
    subcategoryName: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    description: { type: String, required: true },
    servicesOffered: [{ type: String }],
    skills: [{ type: String }],
    tags: [{ type: String }],
    targetCustomers: [{ type: String }],
    coverageArea: { type: String, default: 'Pan India' },
    deliveryMode: {
      type: String,
      enum: ['ONLINE', 'IN_PERSON', 'BOTH'],
      default: 'ONLINE'
    },
    portfolioUrl: { type: String, trim: true },
    supportingDocument: { type: String, trim: true },
    pricingType: {
      type: String,
      enum: ['FIXED', 'STARTING_FROM', 'CUSTOM_QUOTE'],
      default: 'CUSTOM_QUOTE'
    },
    price: { type: Number },
    deliveryTimeline: { type: String },
    status: {
      type: String,
      enum: [...Object.values(ServiceListingStatus), 'DELETED', 'ARCHIVED'],
      default: ServiceListingStatus.DRAFT
    },
    adminFeedback: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ServiceListingModel = mongoose.model<IServiceListingDocument>('ServiceListing', ServiceListingSchema);

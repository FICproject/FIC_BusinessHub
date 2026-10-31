import mongoose, { Document, Schema } from 'mongoose';
import { ServiceListingStatus } from '@fic/shared-types';

export interface IServiceListingDocument extends Document {
  providerId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  pricingType: 'FIXED' | 'STARTING_FROM' | 'CUSTOM_QUOTE';
  price?: number;
  deliveryTimeline?: string;
  tags: string[];
  status: ServiceListingStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceListingSchema = new Schema<IServiceListingDocument>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'Subcategory' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pricingType: {
      type: String,
      enum: ['FIXED', 'STARTING_FROM', 'CUSTOM_QUOTE'],
      default: 'CUSTOM_QUOTE'
    },
    price: { type: Number },
    deliveryTimeline: { type: String },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(ServiceListingStatus),
      default: ServiceListingStatus.APPROVED // approved listings are publicly discoverable
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ServiceListingModel = mongoose.model<IServiceListingDocument>('ServiceListing', ServiceListingSchema);

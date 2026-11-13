import mongoose, { Schema, Document } from 'mongoose';
import { ServiceListingStatusAdmin } from '@fic/shared-types';

export interface IAdminServiceListing extends Document {
  title: string;
  categoryId?: mongoose.Types.ObjectId;
  categoryName?: string;
  categorySlug?: string;
  subcategoryId?: mongoose.Types.ObjectId;
  subcategoryName?: string;
  description: string;
  providerId?: mongoose.Types.ObjectId;
  providerPrivateName?: string;
  providerEmail?: string;
  locationState?: string;
  pricingEstimate?: string;
  servicesOffered?: string[];
  skills?: string[];
  tags?: string[];
  coverageArea?: string;
  deliveryMode?: string;
  status: ServiceListingStatusAdmin;
  rejectionReason?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminServiceListingSchema = new Schema<IAdminServiceListing>(
  {
    title: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: false },
    categoryName: { type: String, required: false },
    categorySlug: { type: String, required: false },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'Subcategory', required: false },
    subcategoryName: { type: String, required: false },
    description: { type: String, required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Member', required: false },
    providerPrivateName: { type: String, required: false },
    providerEmail: { type: String, required: false },
    locationState: { type: String },
    pricingEstimate: { type: String },
    servicesOffered: [{ type: String }],
    skills: [{ type: String }],
    tags: [{ type: String }],
    coverageArea: { type: String },
    deliveryMode: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED', 'DELETED'],
      default: 'PENDING_APPROVAL',
      required: true,
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

export const ServiceListingModel =
  (mongoose.models.AdminServiceListing as mongoose.Model<IAdminServiceListing>) ||
  mongoose.model<IAdminServiceListing>('AdminServiceListing', AdminServiceListingSchema);

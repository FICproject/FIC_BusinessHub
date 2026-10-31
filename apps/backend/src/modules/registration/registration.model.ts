import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistrationSubmissionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  subcategoryIds: mongoose.Types.ObjectId[];
  configurationVersion: number;
  fieldsData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSubmissionSchema = new Schema<IRegistrationSubmissionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Subcategory' }],
    configurationVersion: { type: Number, default: 1 },
    fieldsData: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const RegistrationSubmissionModel = mongoose.model<IRegistrationSubmissionDocument>(
  'RegistrationSubmission',
  RegistrationSubmissionSchema
);

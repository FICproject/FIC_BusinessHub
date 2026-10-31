import mongoose, { Document, Schema } from 'mongoose';
import { MembershipStatus } from '@fic/shared-types';

export interface IMembershipDocument extends Document {
  userId: mongoose.Types.ObjectId;
  status: MembershipStatus;
  planType: 'FIRST_YEAR_INTRO' | 'ANNUAL_RENEWAL';
  amount: number;
  startDate: Date;
  endDate: Date;
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembershipDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.PENDING
    },
    planType: {
      type: String,
      enum: ['FIRST_YEAR_INTRO', 'ANNUAL_RENEWAL'],
      default: 'FIRST_YEAR_INTRO'
    },
    amount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' }
  },
  { timestamps: true }
);

export const MembershipModel = mongoose.model<IMembershipDocument>('Membership', MembershipSchema);


import mongoose, { Schema, Document } from 'mongoose';

export type CentralMeetingSourceModule =
  | 'BUSINESS_IDEA'
  | 'BUSINESS_SCALING'
  | 'SERVICE_REQUEST_STAGE_1'
  | 'SERVICE_REQUEST_STAGE_2'
  | 'FUNDING_REQUEST'
  | 'INVESTMENT_REQUEST'
  | 'SUPPORT_REQUEST'
  | 'DIRECT_ADMIN'
  | 'GENERAL_CONSULTATION'
  | string;

export interface IMeetingParticipantInfo {
  name: string;
  email: string;
  phone?: string;
  roleOrCompany?: string;
  badge?: string;
  memberId?: string;
}

export interface IMeeting extends Document {
  meetingId: string;
  title: string;
  description?: string;
  hostAdminId: mongoose.Types.ObjectId;
  hostAdminName?: string;
  participantMemberIds: mongoose.Types.ObjectId[];
  providerId?: mongoose.Types.ObjectId;
  externalParticipants: IMeetingParticipantInfo[];
  meetingType: string;
  sourceModule: CentralMeetingSourceModule;
  sourceRecordId?: string;
  sourceSubId?: string;
  relatedEntityId?: string;
  relatedFundingApplicationId?: mongoose.Types.ObjectId;
  scheduledAt: Date;
  meetingDate?: string;
  startTime?: string;
  durationMinutes: number;
  meetingMode: 'VIRTUAL' | 'IN_PERSON' | 'GOOGLE_MEET';
  meetingLink?: string;
  meetingLocation?: string;
  status: 'PENDING_COORDINATION' | 'SCHEDULED' | 'RESCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notificationSent: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    meetingId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    hostAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    hostAdminName: { type: String, trim: true },
    participantMemberIds: [{ type: Schema.Types.ObjectId, ref: 'Member', index: true }],
    providerId: { type: Schema.Types.ObjectId, ref: 'Member' },
    externalParticipants: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        roleOrCompany: { type: String },
        badge: { type: String },
        memberId: { type: String },
      },
    ],
    meetingType: {
      type: String,
      default: 'CONSULTATION',
      trim: true,
    },
    sourceModule: {
      type: String,
      default: 'DIRECT_ADMIN',
      index: true,
    },
    sourceRecordId: {
      type: String,
      index: true,
    },
    sourceSubId: {
      type: String,
      index: true,
    },
    relatedEntityId: {
      type: String,
      trim: true,
      index: true,
    },
    relatedFundingApplicationId: { type: Schema.Types.ObjectId, ref: 'FundingApplication' },
    scheduledAt: { type: Date, required: true, index: true },
    meetingDate: { type: String, trim: true },
    startTime: { type: String, trim: true },
    durationMinutes: { type: Number, default: 45 },
    meetingMode: {
      type: String,
      enum: ['VIRTUAL', 'IN_PERSON', 'GOOGLE_MEET'],
      default: 'VIRTUAL',
    },
    meetingLink: { type: String, trim: true },
    meetingLocation: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING_COORDINATION', 'SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      required: true,
      index: true,
    },
    notificationSent: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Helpful Compound Indexes
MeetingSchema.index({ sourceModule: 1, sourceRecordId: 1, sourceSubId: 1 });
MeetingSchema.index({ 'externalParticipants.email': 1 });

export const MeetingModel =
  (mongoose.models.Meeting as mongoose.Model<IMeeting>) ||
  mongoose.model<IMeeting>('Meeting', MeetingSchema);

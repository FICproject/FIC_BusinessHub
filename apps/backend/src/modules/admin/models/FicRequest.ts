import mongoose, { Schema, Document } from 'mongoose';
import { RequestStatus, RequestType } from '@fic/shared-types';

export interface IFicRequestActivityLog {
  actorId?: string;
  actorName?: string;
  actorRole: 'REQUESTOR' | 'PROVIDER' | 'ADMIN' | 'SYSTEM';
  action: string;
  message?: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: Date;
}

export interface IFicRequestMeetingDetails {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  meetingLink?: string;
  status?: string;
  bookedAt?: Date;
  bookedByAdminName?: string;
}

export interface IFicRequestStageMeeting {
  meetingId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  meetingMode?: 'GOOGLE_MEET' | 'IN_PERSON';
  meetingLink?: string;
  location?: string;
  googleCalendarEventId?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: Date;
  scheduledByAdminId?: string;
  scheduledByAdminName?: string;
  completedAt?: Date;
  completedByAdminId?: string;
  completedByAdminName?: string;
  notes?: string;
}

export interface IFicOfficialResponse {
  _id?: string;
  adminId?: string;
  adminName?: string;
  message: string;
  createdAt: Date;
}

export interface IFicRequest extends Document {
  requestId?: string;
  type: string;
  sourceModule?: string;
  sourceRefId?: mongoose.Types.ObjectId;
  title: string;
  projectTitle?: string;
  description: string;
  projectRequirements?: string;
  requesterId: mongoose.Types.ObjectId;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCategory?: string;
  targetServiceId?: mongoose.Types.ObjectId;
  targetProviderId?: mongoose.Types.ObjectId;
  status: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  adminId?: mongoose.Types.ObjectId;
  adminName?: string;
  adminResponse?: string;
  adminRespondedAt?: Date;
  adminResponseSentAt?: Date;
  adminRespondedByName?: string;
  officialResponses?: IFicOfficialResponse[];
  projectInfoSentAt?: Date;
  providerNotifiedAt?: Date;
  providerDecision?: 'AWAITING' | 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'DECLINED';
  providerResponse?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  providerResponseMessage?: string;
  providerRejectionReason?: string;
  providerRespondedAt?: Date;
  providerResponseAt?: Date;
  scheduledMeetingId?: mongoose.Types.ObjectId;
  meetingDetails?: IFicRequestMeetingDetails;
  stage1Meeting?: IFicRequestStageMeeting;
  stage2Meeting?: IFicRequestStageMeeting;
  activityTimeline: IFicRequestActivityLog[];
  internalNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FicRequestActivityLogSchema = new Schema<IFicRequestActivityLog>(
  {
    actorId: { type: String },
    actorName: { type: String },
    actorRole: {
      type: String,
      enum: ['REQUESTOR', 'PROVIDER', 'ADMIN', 'SYSTEM'],
      required: true,
      default: 'SYSTEM',
    },
    action: { type: String, required: true },
    message: { type: String },
    previousStatus: { type: String },
    newStatus: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FicRequestMeetingDetailsSchema = new Schema<IFicRequestMeetingDetails>(
  {
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    durationMinutes: { type: Number, default: 45 },
    meetingLink: { type: String },
    status: { type: String, default: 'CONFIRMED' },
    bookedAt: { type: Date, default: Date.now },
    bookedByAdminName: { type: String },
  },
  { _id: false }
);

const FicRequestStageMeetingSchema = new Schema<IFicRequestStageMeeting>(
  {
    meetingId: { type: String },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    durationMinutes: { type: Number, default: 45 },
    meetingMode: { type: String, enum: ['GOOGLE_MEET', 'IN_PERSON'], default: 'GOOGLE_MEET' },
    meetingLink: { type: String },
    location: { type: String },
    googleCalendarEventId: { type: String },
    status: { type: String, enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
    scheduledAt: { type: Date, default: Date.now },
    scheduledByAdminId: { type: String },
    scheduledByAdminName: { type: String },
    completedAt: { type: Date },
    completedByAdminId: { type: String },
    completedByAdminName: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const FicRequestSchema = new Schema<IFicRequest>(
  {
    requestId: { type: String, index: true },
    type: {
      type: String,
      enum: [
        'SERVICE_INQUIRY',
        'SERVICE_REQUEST',
        'BUSINESS_IDEAS',
        'SCALING_SUPPORT',
        'BUSINESS_DEVELOPMENT',
        'INVESTMENT_INTEREST',
        'PARTNERSHIP',
      ],
      default: 'SERVICE_INQUIRY',
      required: true,
    },
    sourceModule: {
      type: String,
      enum: ['MARKETPLACE', 'BUSINESS_IDEAS', 'SCALING_SUPPORT', 'CUSTOM'],
      default: 'MARKETPLACE',
    },
    sourceRefId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true },
    projectTitle: { type: String },
    description: { type: String, required: true },
    projectRequirements: { type: String },
    requesterId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    requesterPhone: { type: String },
    requesterCategory: { type: String },
    targetServiceId: { type: Schema.Types.ObjectId, ref: 'ServiceListing' },
    targetProviderId: { type: Schema.Types.ObjectId, ref: 'Member' },
    status: {
      type: String,
      enum: [
        'NEW',
        'SUBMITTED',
        'UNDER_ADMIN_REVIEW',
        'ADMIN_REVIEW',
        'UNDER_REVIEW',
        'ASSIGNED',
        'SENT_TO_PROVIDER',
        'AWAITING_PROVIDER_RESPONSE',
        'PROVIDER_CONTACTED',
        'PROVIDER_ACCEPTED',
        'PROVIDER_REJECTED',
        'ADMIN_RESPONSE_PENDING',
        'ADMIN_RESPONSE_SENT',
        'ADMIN_PROVIDER_MEETING_PENDING',
        'ADMIN_PROVIDER_MEETING_SCHEDULED',
        'ADMIN_PROVIDER_MEETING_COMPLETED',
        'ADMIN_REQUESTOR_MEETING_PENDING',
        'ADMIN_REQUESTOR_MEETING_SCHEDULED',
        'ADMIN_REQUESTOR_MEETING_COMPLETED',
        'MEETING_PROPOSED',
        'MEETING_CONFIRMED',
        'MEETING_SCHEDULED',
        'IN_PROGRESS',
        'INFORMATION_REQUIRED',
        'RESPONDED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'SUBMITTED',
      required: true,
    },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    assignedStaffName: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    adminName: { type: String },
    adminResponse: { type: String },
    adminRespondedAt: { type: Date },
    adminResponseSentAt: { type: Date },
    adminRespondedByName: { type: String },
    officialResponses: [
      {
        adminId: { type: String },
        adminName: { type: String },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    projectInfoSentAt: { type: Date },
    providerNotifiedAt: { type: Date },
    providerDecision: {
      type: String,
      enum: ['AWAITING', 'ACCEPTED', 'REJECTED', 'PENDING', 'DECLINED'],
      default: 'AWAITING',
    },
    providerResponse: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
    providerResponseMessage: { type: String },
    providerRejectionReason: { type: String },
    providerRespondedAt: { type: Date },
    providerResponseAt: { type: Date },
    scheduledMeetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    meetingDetails: { type: FicRequestMeetingDetailsSchema },
    stage1Meeting: { type: FicRequestStageMeetingSchema },
    stage2Meeting: { type: FicRequestStageMeetingSchema },
    activityTimeline: { type: [FicRequestActivityLogSchema], default: [] },
    internalNotes: [{ type: String }],
  },
  { timestamps: true }
);

// Pre-save synchronization hook
FicRequestSchema.pre('save', function (next) {
  if (!this.requestId) {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    this.requestId = this.type === 'SERVICE_INQUIRY' || this.type === 'SERVICE_REQUEST'
      ? `SR-${year}-${rand}`
      : `REQ-${year}-${rand}`;
  }
  if (!this.projectTitle && this.title) {
    this.projectTitle = this.title;
  }
  if (!this.projectRequirements && this.description) {
    this.projectRequirements = this.description;
  }
  if (this.providerDecision === 'ACCEPTED') {
    this.providerResponse = 'ACCEPTED';
  } else if (this.providerDecision === 'REJECTED') {
    this.providerResponse = 'DECLINED';
  } else if (this.providerResponse === 'ACCEPTED' && !this.providerDecision) {
    this.providerDecision = 'ACCEPTED';
  } else if (this.providerResponse === 'DECLINED' && !this.providerDecision) {
    this.providerDecision = 'REJECTED';
  }
  if (this.providerRespondedAt && !this.providerResponseAt) {
    this.providerResponseAt = this.providerRespondedAt;
  } else if (this.providerResponseAt && !this.providerRespondedAt) {
    this.providerRespondedAt = this.providerResponseAt;
  }
  if (this.adminRespondedAt && !this.adminResponseSentAt) {
    this.adminResponseSentAt = this.adminRespondedAt;
  } else if (this.adminResponseSentAt && !this.adminRespondedAt) {
    this.adminRespondedAt = this.adminResponseSentAt;
  }
  if (this.providerNotifiedAt && !this.projectInfoSentAt) {
    this.projectInfoSentAt = this.providerNotifiedAt;
  } else if (this.projectInfoSentAt && !this.providerNotifiedAt) {
    this.providerNotifiedAt = this.projectInfoSentAt;
  }
  next();
});

export const FicRequestModel =
  (mongoose.models.FicRequest as mongoose.Model<IFicRequest>) ||
  mongoose.model<IFicRequest>('FicRequest', FicRequestSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IMentorshipRequestDocument extends Document {
  requestId: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail?: string;
  mentorId: mongoose.Types.ObjectId;
  mentorName: string;
  purpose: string;
  title: string;
  reason: string;
  studentLevel: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  meetingMode: 'ONLINE' | 'OFFLINE';
  locationOrUrl?: string;
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'SCHEDULED'
    | 'RESCHEDULE_REQUESTED'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
  mentorNotes?: string;
  sessionSummary?: string;
  recommendedMaterials?: string[];
  followUpInstructions?: string;
  rejectionReason?: string;
  rescheduleProposal?: {
    proposedDate: string;
    proposedTime: string;
    proposedMode?: string;
    proposedNotes?: string;
    proposedBy: 'MENTOR' | 'STUDENT';
  };
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequestDocument>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentorName: { type: String, required: true, trim: true },
    purpose: {
      type: String,
      required: true,
      enum: [
        'Career Guidance',
        'Subject Doubt Clarification',
        'Project Guidance',
        'Skill Development',
        'Startup Guidance',
        'Academic Mentorship',
        'Other'
      ],
      default: 'Career Guidance'
    },
    title: { type: String, required: true, trim: true },
    reason: { type: String, required: true },
    studentLevel: { type: String, default: 'Undergraduate' },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    confirmedDate: { type: String },
    confirmedTime: { type: String },
    meetingMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      default: 'ONLINE'
    },
    locationOrUrl: { type: String },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACCEPTED',
        'SCHEDULED',
        'RESCHEDULE_REQUESTED',
        'CONFIRMED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED'
      ],
      default: 'PENDING'
    },
    mentorNotes: { type: String },
    sessionSummary: { type: String },
    recommendedMaterials: [{ type: String }],
    followUpInstructions: { type: String },
    rejectionReason: { type: String },
    rescheduleProposal: {
      proposedDate: { type: String },
      proposedTime: { type: String },
      proposedMode: { type: String },
      proposedNotes: { type: String },
      proposedBy: { type: String, enum: ['MENTOR', 'STUDENT'] }
    }
  },
  { timestamps: true }
);

export const MentorshipRequestModel = mongoose.model<IMentorshipRequestDocument>(
  'MentorshipRequest',
  MentorshipRequestSchema
);


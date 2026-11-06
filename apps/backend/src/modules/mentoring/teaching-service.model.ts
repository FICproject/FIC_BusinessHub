import mongoose, { Document, Schema } from 'mongoose';

export interface ITeachingServiceDocument extends Document {
  mentorId: mongoose.Types.ObjectId;
  mentorName: string;
  title: string;
  subject: string;
  shortDescription?: string;
  detailedDescription: string;
  subjectCategory: string;
  studentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  teachingLanguage: string;
  teachingMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  relevantExperience: string;
  qualifications?: string;
  topicsCovered: string[];
  learningOutcomes: string[];
  availability: string;
  sessionDuration: string;
  thumbnailUrl?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED';
  enrolledCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeachingServiceSchema = new Schema<ITeachingServiceDocument>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentorName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    detailedDescription: { type: String, required: true },
    subjectCategory: { type: String, default: 'Technology & Digital' },
    studentLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'],
      default: 'ALL_LEVELS'
    },
    teachingLanguage: { type: String, default: 'English & Tamil' },
    teachingMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BOTH'],
      default: 'ONLINE'
    },
    relevantExperience: { type: String, required: true },
    qualifications: { type: String },
    topicsCovered: [{ type: String }],
    learningOutcomes: [{ type: String }],
    availability: { type: String, default: 'Weekdays & Weekends (Flexible)' },
    sessionDuration: { type: String, default: '45 mins' },
    thumbnailUrl: { type: String },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'UNPUBLISHED'],
      default: 'PUBLISHED'
    },
    enrolledCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const TeachingServiceModel = mongoose.model<ITeachingServiceDocument>(
  'TeachingService',
  TeachingServiceSchema
);


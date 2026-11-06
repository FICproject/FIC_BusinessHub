import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningVideoDocument extends Document {
  mentorId: mongoose.Types.ObjectId;
  mentorName: string;
  teachingServiceId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  studentLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  language: string;
  videoUrl: string;
  videoStorageKey?: string;
  thumbnailUrl?: string;
  thumbnailStorageKey?: string;
  duration: string;
  durationSeconds?: number;
  fileSize?: number;
  originalFilename?: string;
  mimeType?: string;
  learningObjectives?: string[];
  status: 'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED' | 'PENDING_REVIEW';
  publicationStatus?: string;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LearningVideoSchema = new Schema<ILearningVideoDocument>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentorName: { type: String, required: true, trim: true },
    teachingServiceId: { type: Schema.Types.ObjectId, ref: 'TeachingService' },
    title: { type: String, trim: true, default: '' },
    description: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    studentLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'],
      default: 'ALL_LEVELS'
    },
    language: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true },
    videoStorageKey: { type: String },
    thumbnailUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
    },
    thumbnailStorageKey: { type: String },
    duration: { type: String, required: true, default: '00:00' },
    durationSeconds: { type: Number, default: 0 },
    fileSize: { type: Number },
    originalFilename: { type: String },
    mimeType: { type: String },
    learningObjectives: [{ type: String }],
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'UNPUBLISHED', 'PENDING_REVIEW'],
      default: 'PUBLISHED'
    },
    viewsCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

LearningVideoSchema.virtual('publicationStatus').get(function () {
  return this.status;
});

export const LearningVideoModel = mongoose.model<ILearningVideoDocument>(
  'LearningVideo',
  LearningVideoSchema
);

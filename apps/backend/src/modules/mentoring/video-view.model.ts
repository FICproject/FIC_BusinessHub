import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoViewDocument extends Document {
  videoId: mongoose.Types.ObjectId;
  studentMemberId: mongoose.Types.ObjectId;
  mentorId?: mongoose.Types.ObjectId;
  totalViews: number;
  firstViewedAt: Date;
  lastViewedAt: Date;
}

const VideoViewSchema = new Schema<IVideoViewDocument>(
  {
    videoId: { type: Schema.Types.ObjectId, ref: 'LearningVideo', required: true, index: true },
    studentMemberId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    totalViews: { type: Number, default: 1 },
    firstViewedAt: { type: Date, default: Date.now },
    lastViewedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

VideoViewSchema.index({ videoId: 1, studentMemberId: 1 }, { unique: true });

export const VideoViewModel = mongoose.model<IVideoViewDocument>('VideoView', VideoViewSchema);


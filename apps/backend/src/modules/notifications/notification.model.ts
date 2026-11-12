import mongoose, { Document, Schema } from 'mongoose';

export type NotificationRecipientType = 'MEMBER' | 'ADMIN';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface INotification extends Document {
  recipientType: NotificationRecipientType;
  recipientId?: mongoose.Types.ObjectId | null;
  eventType: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
  priority: NotificationPriority;
  isRead: boolean;
  readByAdminIds: mongoose.Types.ObjectId[];
  readAt?: Date;
  sourceKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientType: {
      type: String,
      enum: ['MEMBER', 'ADMIN'],
      required: true,
      index: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    link: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    isRead: { type: Boolean, default: false, index: true },
    readByAdminIds: [{ type: Schema.Types.ObjectId, ref: 'AdminUser' }],
    readAt: { type: Date },
    sourceKey: { type: String, trim: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });
NotificationSchema.index({ sourceKey: 1 }, { unique: true, sparse: true });

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);


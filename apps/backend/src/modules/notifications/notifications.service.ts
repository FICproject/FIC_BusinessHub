import mongoose from 'mongoose';
import { NotificationModel, NotificationPriority } from './notification.model';

interface CreateNotificationInput {
  recipientType: 'MEMBER' | 'ADMIN';
  recipientId?: string | mongoose.Types.ObjectId | null;
  eventType: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
  priority?: NotificationPriority;
  sourceKey?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const recipientObjId =
    input.recipientId && mongoose.isValidObjectId(input.recipientId)
      ? new mongoose.Types.ObjectId(input.recipientId)
      : null;

  if (input.sourceKey) {
    return NotificationModel.findOneAndUpdate(
      { sourceKey: input.sourceKey },
      {
        $setOnInsert: {
          recipientType: input.recipientType,
          recipientId: recipientObjId,
          eventType: input.eventType,
          title: input.title,
          message: input.message,
          metadata: input.metadata || {},
          link: input.link,
          priority: input.priority || 'MEDIUM',
          isRead: false,
          readByAdminIds: [],
          sourceKey: input.sourceKey
        }
      },
      { upsert: true, new: true }
    );
  }

  return NotificationModel.create({
    recipientType: input.recipientType,
    recipientId: recipientObjId,
    eventType: input.eventType,
    title: input.title,
    message: input.message,
    metadata: input.metadata || {},
    link: input.link,
    priority: input.priority || 'MEDIUM',
    isRead: false,
    readByAdminIds: []
  });
}

export async function notifyMember(params: {
  userId: string | mongoose.Types.ObjectId;
  eventType: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
  priority?: NotificationPriority;
}) {
  try {
    return await createNotification({
      recipientType: 'MEMBER',
      recipientId: params.userId,
      eventType: params.eventType,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
      link: params.link || '/kyc-pending',
      priority: params.priority || 'HIGH'
    });
  } catch (err) {
    console.warn('Member notification error:', err);
    return null;
  }
}

export async function notifyAdmins(params: {
  eventType: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
  priority?: NotificationPriority;
  sourceKey?: string;
}) {
  try {
    return await createNotification({
      recipientType: 'ADMIN',
      recipientId: null,
      eventType: params.eventType,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
      link: params.link || '/kyc',
      priority: params.priority || 'HIGH',
      sourceKey: params.sourceKey
    });
  } catch (err) {
    console.warn('Admin notification error:', err);
    return null;
  }
}

export async function listMemberNotifications(userId: string, limit = 50) {
  if (!mongoose.isValidObjectId(userId)) {
    return { notifications: [], unreadCount: 0 };
  }
  const objId = new mongoose.Types.ObjectId(userId);
  const docs = await NotificationModel.find({
    recipientType: 'MEMBER',
    recipientId: objId
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const notifications = docs.map((d: any) => ({
    id: d._id.toString(),
    _id: d._id.toString(),
    type: d.eventType,
    eventType: d.eventType,
    title: d.title,
    message: d.message,
    metadata: d.metadata || {},
    link: d.link || '/kyc-pending',
    priority: d.priority || 'MEDIUM',
    isRead: Boolean(d.isRead),
    readAt: d.readAt ? new Date(d.readAt).toISOString() : undefined,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString()
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return { notifications, unreadCount };
}

export async function markMemberNotificationRead(userId: string, notificationId: string) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(notificationId)) {
    return null;
  }
  return NotificationModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(notificationId),
      recipientType: 'MEMBER',
      recipientId: new mongoose.Types.ObjectId(userId)
    },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
}

export async function markAllMemberNotificationsRead(userId: string) {
  if (!mongoose.isValidObjectId(userId)) {
    return { modifiedCount: 0 };
  }
  return NotificationModel.updateMany(
    {
      recipientType: 'MEMBER',
      recipientId: new mongoose.Types.ObjectId(userId),
      isRead: { $ne: true }
    },
    { $set: { isRead: true, readAt: new Date() } }
  );
}


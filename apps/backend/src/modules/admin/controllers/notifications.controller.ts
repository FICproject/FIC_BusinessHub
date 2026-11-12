import mongoose from 'mongoose';
import { Router, Response } from 'express';
import { MemberModel } from '../models/Member';
import { SupportTicketModel } from '../models/SupportTicket';
import { MeetingModel } from '../models/Meeting';
import { KycSubmissionModel } from '../models/KycSubmission';
import { ServiceListingModel } from '../models/ServiceListing';
import { FicRequestModel } from '../models/FicRequest';
import { NotificationModel } from '../../notifications/notification.model';
import { createNotification } from '../../notifications/notifications.service';
import { authenticateAdmin, AuthenticatedAdminRequest } from '../middleware/admin-auth.middleware';

const router = Router();

export interface AdminNotification {
  id: string;
  type: string;
  eventType?: string;
  title: string;
  message: string;
  timestamp: string;
  link: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  metadata?: Record<string, any>;
}

/**
 * Sync idempotent source-keyed operational alerts into NotificationModel
 * so Admin read status persists across refreshes and sessions in MongoDB.
 */
async function syncOperationalAdminAlerts() {
  const now = new Date();
  const [recentMembers, openTickets, pendingKyc, pendingServices, pendingRequests] = await Promise.all([
    MemberModel.find().sort({ registeredAt: -1 }).limit(6).lean(),
    SupportTicketModel.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
      .populate('memberId', 'name')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    KycSubmissionModel.find({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } })
      .sort({ submittedAt: -1 })
      .limit(6)
      .lean(),
    ServiceListingModel.find({ status: 'PENDING_APPROVAL' }).sort({ createdAt: -1 }).limit(6).lean(),
    FicRequestModel.find({ status: { $in: ['NEW', 'UNDER_REVIEW'] } }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const ops: Promise<any>[] = [];

  for (const m of recentMembers as any[]) {
    ops.push(
      createNotification({
        recipientType: 'ADMIN',
        recipientId: null,
        sourceKey: `admin_member_${m._id}`,
        eventType: 'NEW_MEMBER',
        title: 'New Member Registered',
        message: `${m.name} registered under ${m.primaryCategoryName || 'Ecosystem'}.`,
        link: '/kyc',
        priority: 'MEDIUM',
        metadata: { memberId: String(m._id), memberEmail: m.email }
      })
    );
  }

  for (const t of openTickets as any[]) {
    ops.push(
      createNotification({
        recipientType: 'ADMIN',
        recipientId: null,
        sourceKey: `admin_ticket_${t._id}`,
        eventType: 'NEW_TICKET',
        title: `Support Ticket Raised: #${t.ticketNumber}`,
        message: `${t.subject} (From: ${(t.memberId as any)?.name || t.memberName || 'Member'})`,
        link: '/support',
        priority: t.priority === 'URGENT' || t.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        metadata: { ticketId: String(t._id) }
      })
    );
  }

  for (const k of pendingKyc as any[]) {
    ops.push(
      createNotification({
        recipientType: 'ADMIN',
        recipientId: null,
        sourceKey: `admin_kyc_${k._id}`,
        eventType: 'NEW_KYC',
        title: 'KYC Verification Submitted',
        message: `${k.memberName || 'Member'} (${k.categoryName || 'Member'}) submitted documents for review.`,
        link: '/kyc',
        priority: 'HIGH',
        metadata: { kycSubmissionId: String(k._id), memberId: String(k.memberId) }
      })
    );
  }

  for (const s of pendingServices as any[]) {
    ops.push(
      createNotification({
        recipientType: 'ADMIN',
        recipientId: null,
        sourceKey: `admin_service_${s._id}`,
        eventType: 'NEW_SERVICE',
        title: 'New Service Listing in Queue',
        message: `"${s.title}" submitted by ${s.providerPrivateName || 'Member'} awaiting approval.`,
        link: '/services',
        priority: 'MEDIUM',
        metadata: { serviceId: String(s._id) }
      })
    );
  }

  for (const r of pendingRequests as any[]) {
    ops.push(
      createNotification({
        recipientType: 'ADMIN',
        recipientId: null,
        sourceKey: `admin_req_${r._id}`,
        eventType: 'NEW_REQUEST',
        title: 'New FIC Request Received',
        message: `${r.title || 'Inquiry'} requires intermediary coordination.`,
        link: '/requests',
        priority: 'HIGH',
        metadata: { requestId: String(r._id) }
      })
    );
  }

  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const upcomingMeetings = await MeetingModel.find({
    status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
    scheduledAt: { $gte: thirtyMinutesAgo, $lte: tenMinutesFromNow },
  })
    .populate('participantMemberIds', 'name')
    .sort({ scheduledAt: 1 })
    .lean();

  for (const meet of upcomingMeetings as any[]) {
    const scheduledTime = new Date(meet.scheduledAt);
    const diffMinutes = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
    const timingText =
      diffMinutes > 0
        ? `starts in ${diffMinutes} min`
        : diffMinutes === 0
        ? 'starts now'
        : `started ${Math.abs(diffMinutes)} min ago`;
    ops.push(
      createNotification({
        recipientType: 'ADMIN',
        recipientId: null,
        sourceKey: `admin_meet_${meet._id}`,
        eventType: 'MEETING_UPCOMING',
        title: 'Meeting Alert: Starts in <=10 Mins',
        message: `"${meet.title}" ${timingText}. Link: ${meet.meetingLink || 'Ready'}`,
        link: '/meetings',
        priority: 'HIGH',
        metadata: { meetingId: String(meet._id) }
      })
    );
  }

  if (ops.length > 0) {
    await Promise.allSettled(ops);
  }
}

// GET /api/admin/notifications
router.get('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    await syncOperationalAdminAlerts();

    const adminId = req.admin?.id;
    const adminObjId = adminId && mongoose.isValidObjectId(adminId) ? new mongoose.Types.ObjectId(adminId) : null;

    const filter: Record<string, any> = {
      recipientType: 'ADMIN',
      $or: [{ recipientId: null }, ...(adminObjId ? [{ recipientId: adminObjId }] : [])]
    };

    const docs = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications: AdminNotification[] = docs.map((d: any) => {
      const readByAdmin = adminId
        ? Array.isArray(d.readByAdminIds) && d.readByAdminIds.some((id: any) => String(id) === adminId)
        : false;
      const isRead = Boolean(d.isRead || readByAdmin);

      return {
        id: d._id.toString(),
        type: d.eventType,
        eventType: d.eventType,
        title: d.title,
        message: d.message,
        timestamp: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        link: d.link || '/kyc',
        priority: d.priority || 'MEDIUM',
        isRead,
        metadata: d.metadata || {}
      };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/notifications/read-all
router.patch('/read-all', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.admin?.id;
    if (!adminId || !mongoose.isValidObjectId(adminId)) {
      res.status(401).json({ success: false, error: 'Invalid admin session' });
      return;
    }

    const adminObjId = new mongoose.Types.ObjectId(adminId);
    await NotificationModel.updateMany(
      {
        recipientType: 'ADMIN',
        $or: [{ recipientId: null }, { recipientId: adminObjId }]
      },
      {
        $addToSet: { readByAdminIds: adminObjId }
      }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/notifications/:id/read
router.patch('/:id/read', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.admin?.id;
    const { id } = req.params;
    if (!adminId || !mongoose.isValidObjectId(adminId) || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, error: 'Invalid notification or admin ID' });
      return;
    }

    const adminObjId = new mongoose.Types.ObjectId(adminId);
    const updated = await NotificationModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        recipientType: 'ADMIN'
      },
      {
        $addToSet: { readByAdminIds: adminObjId }
      },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

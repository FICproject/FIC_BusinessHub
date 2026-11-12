import { Router } from 'express';
import { MemberModel } from '../models/Member';
import { SupportTicketModel } from '../models/SupportTicket';
import { MeetingModel } from '../models/Meeting';
import { KycSubmissionModel } from '../models/KycSubmission';
import { ServiceListingModel } from '../models/ServiceListing';
import { FicRequestModel } from '../models/FicRequest';
import { authenticateAdmin } from '../middleware/admin-auth.middleware';

const router = Router();

export interface AdminNotification {
  id: string;
  type: 'NEW_TICKET' | 'NEW_MEMBER' | 'MEETING_UPCOMING' | 'NEW_KYC' | 'NEW_SERVICE' | 'NEW_REQUEST';
  title: string;
  message: string;
  timestamp: string;
  link: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
}

// GET /api/admin/notifications
router.get('/', authenticateAdmin, async (_req, res) => {
  try {
    const notifications: AdminNotification[] = [];
    const now = new Date();

    // 1. Check for newly registered members
    const recentMembers = await MemberModel.find()
      .sort({ registeredAt: -1 })
      .limit(6);

    recentMembers.forEach((m) => {
      notifications.push({
        id: `notif_member_${m._id}`,
        type: 'NEW_MEMBER',
        title: 'New Member Registered',
        message: `${m.name} registered under ${m.primaryCategoryName || 'Ecosystem'}.`,
        timestamp: m.registeredAt ? m.registeredAt.toISOString() : now.toISOString(),
        link: '/members',
        priority: 'MEDIUM',
        isRead: false,
      });
    });

    // 2. Check for raised Support Tickets (OPEN or IN_PROGRESS)
    const openTickets = await SupportTicketModel.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
      .populate('memberId', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    openTickets.forEach((t) => {
      notifications.push({
        id: `notif_ticket_${t._id}`,
        type: 'NEW_TICKET',
        title: `Support Ticket Raised: #${t.ticketNumber}`,
        message: `${t.subject} (From: ${(t.memberId as any)?.name || t.memberName || 'Member'})`,
        timestamp: t.createdAt ? t.createdAt.toISOString() : now.toISOString(),
        link: '/support',
        priority: t.priority === 'URGENT' || t.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        isRead: false,
      });
    });

    // 3. Check for Pending KYC Submissions
    const pendingKyc = await KycSubmissionModel.find({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } })
      .sort({ submittedAt: -1 })
      .limit(6);

    pendingKyc.forEach((k) => {
      notifications.push({
        id: `notif_kyc_${k._id}`,
        type: 'NEW_KYC',
        title: 'KYC Verification Submitted',
        message: `${k.memberName || 'Member'} (${k.categoryName || 'Member'}) submitted documents for review.`,
        timestamp: k.submittedAt ? k.submittedAt.toISOString() : now.toISOString(),
        link: '/kyc',
        priority: 'HIGH',
        isRead: false,
      });
    });

    // 4. Check for Pending Service Listings in Moderation Queue
    const pendingServices = await ServiceListingModel.find({ status: 'PENDING_APPROVAL' })
      .sort({ createdAt: -1 })
      .limit(6);

    pendingServices.forEach((s) => {
      notifications.push({
        id: `notif_service_${s._id}`,
        type: 'NEW_SERVICE',
        title: 'New Service Listing in Queue',
        message: `"${s.title}" submitted by ${s.providerPrivateName || 'Member'} awaiting approval.`,
        timestamp: s.createdAt ? s.createdAt.toISOString() : now.toISOString(),
        link: '/services',
        priority: 'MEDIUM',
        isRead: false,
      });
    });

    // 5. Check for Active FIC Requests
    const pendingRequests = await FicRequestModel.find({ status: { $in: ['NEW', 'UNDER_REVIEW'] } })
      .sort({ createdAt: -1 })
      .limit(6);

    pendingRequests.forEach((r) => {
      notifications.push({
        id: `notif_req_${r._id}`,
        type: 'NEW_REQUEST',
        title: 'New FIC Request Received',
        message: `${r.title || 'Inquiry'} requires intermediary coordination.`,
        timestamp: r.createdAt ? r.createdAt.toISOString() : now.toISOString(),
        link: '/requests',
        priority: 'HIGH',
        isRead: false,
      });
    });
      notifications.push({
        id: `notif_ticket_${t._id}`,
        type: 'NEW_TICKET',
        title: `Support Ticket Raised: #${t.ticketNumber}`,
        message: `${t.subject} (From: ${(t.memberId as any)?.name || 'Member'})`,
        timestamp: t.createdAt ? t.createdAt.toISOString() : now.toISOString(),
        link: '/support',
        priority: t.priority === 'URGENT' || t.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        isRead: false,
      });
    });

    // 3. Check for Meetings scheduled to start within 10 minutes (or upcoming today)
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const upcomingMeetings = await MeetingModel.find({
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      scheduledAt: { $gte: thirtyMinutesAgo, $lte: tenMinutesFromNow },
    })
      .populate('participantMemberIds', 'name')
      .sort({ scheduledAt: 1 });

    upcomingMeetings.forEach((meet) => {
      const scheduledTime = new Date(meet.scheduledAt);
      const diffMinutes = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
      const timingText =
        diffMinutes > 0
          ? `starts in ${diffMinutes} min`
          : diffMinutes === 0
          ? 'starts now'
          : `started ${Math.abs(diffMinutes)} min ago`;

      notifications.push({
        id: `notif_meet_${meet._id}`,
        type: 'MEETING_UPCOMING',
        title: 'Meeting Alert: Starts in ≤10 Mins',
        message: `"${meet.title}" ${timingText}. Link: ${meet.meetingLink || 'Ready'}`,
        timestamp: meet.scheduledAt.toISOString(),
        link: '/meetings',
        priority: 'HIGH',
        isRead: false,
      });
    });

    // If upcoming meetings count is 0, also show the next scheduled upcoming meeting as high priority reminder
    if (upcomingMeetings.length === 0) {
      const nextMeeting = await MeetingModel.findOne({
        status: 'SCHEDULED',
        scheduledAt: { $gte: now },
      })
        .populate('participantMemberIds', 'name')
        .sort({ scheduledAt: 1 });

      if (nextMeeting) {
        notifications.push({
          id: `notif_meet_${nextMeeting._id}`,
          type: 'MEETING_UPCOMING',
          title: 'Upcoming Scheduled Meeting',
          message: `"${nextMeeting.title}" with ${(nextMeeting.participantMemberIds[0] as any)?.name || 'Member'} on ${new Date(nextMeeting.scheduledAt).toLocaleDateString()}.`,
          timestamp: nextMeeting.scheduledAt.toISOString(),
          link: '/meetings',
          priority: 'MEDIUM',
          isRead: false,
        });
      }
    }

    // Sort all by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


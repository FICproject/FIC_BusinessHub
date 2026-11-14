import { Router, Response } from 'express';
import { FicRequestModel } from '../models/FicRequest';
import { ServiceListingModel } from '../models/ServiceListing';
import { MemberModel } from '../models/Member';
import { MeetingModel } from '../models/Meeting';
import { BusinessIdeaModel } from '../../business-ideas/business-ideas.model';
import { BusinessDevRequestModel } from '../../business-development/business-development.model';
import { UserModel } from '../../users/users.model';
import { notifyMember } from '../../notifications/notifications.service';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/requests - List FIC-mediated requests
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter: any = {};
    if (type && type !== 'ALL') filter.type = type;
    if (status === 'ACTIVE') {
      filter.status = { $nin: ['COMPLETED', 'REJECTED', 'CANCELLED'] };
    } else if (status && status !== 'ALL') {
      filter.status = status;
    }

    let requests = await FicRequestModel.find(filter)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('assignedStaffId', 'name email')
      .populate('scheduledMeetingId')
      .sort({ createdAt: -1 });

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      requests = requests.filter(
        (r: any) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.requesterName?.toLowerCase().includes(q) ||
          r.requesterEmail?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/requests/providers/list - Get active verified service providers with their listings
router.get('/providers/list', authenticateAdmin, async (req, res) => {
  try {
    const { categoryId, search } = req.query;

    const filter: any = {
      status: { $in: ['APPROVED', 'PENDING_APPROVAL'] },
    };
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    let listings = await ServiceListingModel.find(filter)
      .populate('providerId', 'name email phone primaryCategoryName status kycStatus')
      .sort({ createdAt: -1 });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      listings = listings.filter(
        (l: any) =>
          l.title.toLowerCase().includes(q) ||
          l.providerPrivateName?.toLowerCase().includes(q) ||
          l.categoryName?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: listings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/select-provider - Select/assign a service provider to this request
router.patch('/:id/select-provider', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { providerId, serviceListingId } = req.body;

    const ficReq = await FicRequestModel.findById(id);
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    const provider = await MemberModel.findById(providerId);
    if (!provider) {
      res.status(404).json({ success: false, error: 'Selected provider not found' });
      return;
    }

    ficReq.targetProviderId = provider._id as any;
    if (serviceListingId) {
      ficReq.targetServiceId = serviceListingId;
    }
    ficReq.status = 'UNDER_REVIEW';
    // Reset notification & response status for the new provider assignment
    ficReq.providerNotifiedAt = undefined;
    ficReq.providerResponse = 'PENDING';
    ficReq.providerResponseAt = undefined;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    ficReq.internalNotes.push(`[${timestamp} by ${author}]: Matched and assigned service provider "${provider.name}" (${provider.email}).`);

    await ficReq.save();
    await logAdminAction(req, 'ASSIGN_PROVIDER_FIC_REQUEST', 'FicRequest', id, { providerId, serviceListingId });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Service provider selected', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/cancel - Close or cancel request with a recorded reason
router.post('/:id/cancel', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason?.trim()) {
      res.status(400).json({ success: false, error: 'A cancellation reason is required.' });
      return;
    }
    const ficReq = await FicRequestModel.findById(id);
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    const prevStatus = ficReq.status;
    ficReq.status = 'CANCELLED';
    const now = new Date();
    const author = req.admin ? req.admin.name : 'FIC Admin';
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    ficReq.internalNotes.push(`[${timestamp} by ${author}]: Request cancelled / closed. Reason: ${reason.trim()}`);
    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'REQUEST_CANCELLED',
      message: reason.trim(),
      previousStatus: prevStatus,
      newStatus: 'CANCELLED',
      timestamp: now,
    });
    await ficReq.save();

    // Notify requester
    try {
      let recipientUserId: any = ficReq.requesterId;
      if (ficReq.requesterEmail) {
        const u = await UserModel.findOne({ email: ficReq.requesterEmail.toLowerCase().trim() });
        if (u) recipientUserId = u._id;
      }
      if (recipientUserId) {
        await notifyMember({
          userId: recipientUserId,
          eventType: 'REQUEST_UPDATE',
          title: `Request Closed: ${ficReq.title}`,
          message: `Your service request "${ficReq.title}" was closed by FIC. Reason: ${reason.trim()}`,
          link: '/requests',
          priority: 'HIGH',
        });
      }
    } catch {}

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');
    res.json({ success: true, message: 'Request cancelled with recorded reason', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/notify-provider - Inform provider about the client inquiry
router.post('/:id/notify-provider', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dispatchChannel, customMessage } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (!ficReq.targetProviderId) {
      res.status(400).json({ success: false, error: 'Cannot send project brief without an assigned provider.' });
      return;
    }

    const provider: any = ficReq.targetProviderId;
    const requester: any = ficReq.requesterId;
    const prevStatus = ficReq.status;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';

    ficReq.status = 'AWAITING_PROVIDER_RESPONSE';
    ficReq.providerNotifiedAt = now;
    ficReq.projectInfoSentAt = now;
    ficReq.providerDecision = 'AWAITING';
    ficReq.providerResponse = 'PENDING';
    ficReq.adminId = req.admin?.id as any;
    ficReq.adminName = author;

    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Dispatched anonymous project brief to provider "${provider.name}". Client identity confidential. Awaiting provider acceptance.`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'PROJECT_INFO_SENT',
      message: customMessage || `Project brief sent to provider ${provider.name}. Client identity shielded.`,
      previousStatus: prevStatus,
      newStatus: 'AWAITING_PROVIDER_RESPONSE',
      timestamp: now,
    });

    await ficReq.save();
    await logAdminAction(req, 'NOTIFY_PROVIDER_FIC_REQUEST', 'FicRequest', id, {
      providerId: provider._id,
      providerEmail: provider.email,
    });

    // Notify Provider in their Member dashboard
    try {
      const providerUser = await UserModel.findOne({
        $or: [{ _id: provider._id }, { email: (provider.email || '').toLowerCase().trim() }],
      });
      if (providerUser) {
        await notifyMember({
          userId: providerUser._id as any,
          eventType: 'NEW_REQUEST',
          title: `New Service Request: ${ficReq.title}`,
          message: `FIC Admin shared new project requirements for "${ficReq.title}". Please review and submit your decision in My Services.`,
          link: '/my-services',
          priority: 'HIGH',
        });
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch provider notification:', notifErr);
    }

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: `Notification dispatched to ${provider.name}`, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/provider-response - Provider manual mark by Admin (Blocked per 3-party compliance)
router.post('/:id/provider-response', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  res.status(403).json({
    success: false,
    error: 'Admin cannot manually record provider decision. The assigned service provider must accept or reject the project from their Member Website.',
  });
});

// POST /api/admin/requests/:id/schedule-meeting - Schedule a 3-way/coordination meeting for client and provider
router.post('/:id/schedule-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes, title, description, meetingLink } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (!ficReq.targetProviderId) {
      res.status(400).json({ success: false, error: 'Cannot schedule meeting without an assigned provider.' });
      return;
    }

    // STRICT GOVERNANCE: Provider must accept before meeting booking
    if (ficReq.providerDecision !== 'ACCEPTED' && ficReq.providerResponse !== 'ACCEPTED') {
      res.status(400).json({
        success: false,
        error: 'Cannot schedule meeting before provider acceptance. The provider must accept the request first.',
      });
      return;
    }

    if (!scheduledAt) {
      res.status(400).json({ success: false, error: 'Scheduled date & time is required.' });
      return;
    }

    const hostAdminId = req.admin!.id;
    const provider: any = ficReq.targetProviderId;
    const requester: any = ficReq.requesterId;

    const finalMeetingLink =
      meetingLink?.trim() || `https://meet.google.com/fic-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    const meetingTitle = title || `FIC Intro: ${requester?.name || ficReq.requesterName} & ${provider.name}`;
    const meetingDescription =
      description || `Facilitated 1-on-1 meeting for request "${ficReq.title}". Client: ${requester?.name || ficReq.requesterName} (${requester?.email || ficReq.requesterEmail}), Provider: ${provider.name} (${provider.email}).`;

    // Participant IDs: client + provider
    const participantMemberIds = [ficReq.requesterId];
    if (provider._id) {
      participantMemberIds.push(provider._id);
    }

    const meeting = await MeetingModel.create({
      title: meetingTitle,
      description: meetingDescription,
      hostAdminId,
      participantMemberIds,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: finalMeetingLink,
      status: 'SCHEDULED',
      meetingType: 'CONSULTATION',
      notificationSent: true,
    });

    console.log(`[MEETING DISPATCH] Scheduled meeting "${meetingTitle}" between client (${ficReq.requesterEmail}) and provider (${provider.email}). Link: ${finalMeetingLink}`);

    const prevStatus = ficReq.status;
    const sDate = new Date(scheduledAt);
    ficReq.scheduledMeetingId = meeting._id as any;
    ficReq.status = 'MEETING_CONFIRMED';
    ficReq.meetingDetails = {
      scheduledDate: sDate.toISOString().split('T')[0],
      scheduledTime: sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: finalMeetingLink,
      status: 'CONFIRMED',
      bookedAt: new Date(),
      bookedByAdminName: req.admin ? req.admin.name : 'FIC Administrator',
    };

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Scheduled consultation meeting for ${new Date(scheduledAt).toLocaleString()}. Meeting Link: ${finalMeetingLink}`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'MEETING_CONFIRMED',
      message: `Scheduled coordination meeting for ${new Date(scheduledAt).toLocaleString()}. Link: ${finalMeetingLink}`,
      previousStatus: prevStatus,
      newStatus: 'MEETING_CONFIRMED',
      timestamp: new Date(),
    });

    await ficReq.save();
    await logAdminAction(req, 'SCHEDULE_MEETING_FOR_FIC_REQUEST', 'FicRequest', id, {
      meetingId: meeting._id,
      meetingTitle,
      scheduledAt,
    });

    // Notify Requester
    try {
      let recipientUserId: any = ficReq.requesterId;
      if (ficReq.requesterEmail) {
        const u = await UserModel.findOne({ email: ficReq.requesterEmail.toLowerCase().trim() });
        if (u) recipientUserId = u._id;
      }
      if (recipientUserId) {
        await notifyMember({
          userId: recipientUserId,
          eventType: 'MEETING_SCHEDULED',
          title: `Introductory Call Scheduled: ${ficReq.title}`,
          message: `Your consultation call with provider ${provider.name} is scheduled for ${new Date(scheduledAt).toLocaleString()}. Video link: ${finalMeetingLink}`,
          link: '/meetings',
          priority: 'HIGH',
        });
      }
    } catch {}

    // Notify Provider
    try {
      const providerUser = await UserModel.findOne({
        $or: [{ _id: provider._id }, { email: (provider.email || '').toLowerCase().trim() }],
      });
      if (providerUser) {
        await notifyMember({
          userId: providerUser._id as any,
          eventType: 'MEETING_SCHEDULED',
          title: `Introductory Call Scheduled: ${ficReq.title}`,
          message: `Consultation call scheduled for "${ficReq.title}" on ${new Date(scheduledAt).toLocaleString()}. Video link: ${finalMeetingLink}`,
          link: '/meetings',
          priority: 'HIGH',
        });
      }
    } catch {}

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Meeting scheduled successfully', data: populated, meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/requests/:id/reschedule-meeting - Edit/reschedule meeting time (Provider / Admin proposed availability)
router.patch('/:id/reschedule-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes, updatedByRole, note } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId')
      .populate('scheduledMeetingId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (!ficReq.scheduledMeetingId) {
      res.status(400).json({ success: false, error: 'No scheduled meeting exists to reschedule.' });
      return;
    }

    if (!scheduledAt) {
      res.status(400).json({ success: false, error: 'New scheduled date & time is required.' });
      return;
    }

    const meeting: any = await MeetingModel.findById(ficReq.scheduledMeetingId);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting record not found.' });
      return;
    }

    meeting.scheduledAt = new Date(scheduledAt);
    if (durationMinutes) meeting.durationMinutes = Number(durationMinutes);
    await meeting.save();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const actor = updatedByRole === 'PROVIDER' ? `Provider (${(ficReq.targetProviderId as any)?.name})` : (req.admin?.name || 'Admin');
    ficReq.internalNotes.push(
      `[${timestamp} by ${actor}]: Updated/Adjusted meeting slot to ${new Date(scheduledAt).toLocaleString()}.${note ? ` Reason: ${note}` : ''}`
    );

    await ficReq.save();
    await logAdminAction(req, 'RESCHEDULE_FIC_MEETING', 'Meeting', meeting._id.toString(), {
      scheduledAt,
      actor,
    });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Meeting timing updated successfully', data: populated, meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/requests/:id - Update status, assign staff, add response or internal note
router.patch('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assignedStaffId, assignedStaffName, adminResponse, note } = req.body;

    const ficReq = await FicRequestModel.findById(id);
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'FIC Administrator';

    const prevStatus = ficReq.status;
    if (status) ficReq.status = status;
    if (assignedStaffId) {
      ficReq.assignedStaffId = assignedStaffId;
      if (assignedStaffName) ficReq.assignedStaffName = assignedStaffName;
    }
    if (adminResponse && adminResponse.trim()) {
      ficReq.adminResponse = adminResponse.trim();
      ficReq.adminRespondedAt = new Date();
      ficReq.adminResponseSentAt = new Date();
      ficReq.adminRespondedByName = author;
      ficReq.adminId = req.admin?.id as any;
      ficReq.adminName = author;
      if (!status) {
        ficReq.status = 'ADMIN_RESPONSE_SENT';
      }
      ficReq.internalNotes.push(`[${timestamp} by ${author}]: Sent member response: "${adminResponse.trim()}"`);

      if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
      ficReq.activityTimeline.push({
        actorId: req.admin?.id,
        actorName: author,
        actorRole: 'ADMIN',
        action: 'ADMIN_RESPONSE_SENT',
        message: adminResponse.trim(),
        previousStatus: prevStatus,
        newStatus: ficReq.status,
        timestamp: new Date(),
      });
    }

    if (note && note.trim()) {
      ficReq.internalNotes.push(`[${timestamp} by ${author}]: ${note.trim()}`);
    }

    await ficReq.save();

    // Synchronize to underlying models if sourceRefId is present
    if (ficReq.sourceRefId) {
      const updateMsg = adminResponse?.trim() || note?.trim() || `Status updated to ${ficReq.status}`;
      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      if (ficReq.sourceModule === 'BUSINESS_IDEAS' || ficReq.type === 'BUSINESS_IDEAS') {
        await BusinessIdeaModel.findByIdAndUpdate(ficReq.sourceRefId, {
          latestFicUpdate: updateMsg,
          status: ficReq.status === 'COMPLETED' ? 'APPROVED' : (ficReq.status === 'REJECTED' ? 'CLOSED' : 'UNDER_REVIEW'),
          $push: {
            updateHistory: {
              date: nowStr,
              status: ficReq.status,
              update: updateMsg,
              updatedBy: author
            }
          }
        });
      } else if (ficReq.sourceModule === 'SCALING_SUPPORT' || ficReq.type === 'SCALING_SUPPORT') {
        await BusinessDevRequestModel.findByIdAndUpdate(ficReq.sourceRefId, {
          latestFicUpdate: updateMsg,
          status: ficReq.status === 'COMPLETED' ? 'COMPLETED' : 'UNDER_REVIEW',
          $push: {
            updateHistory: {
              date: nowStr,
              status: ficReq.status,
              update: updateMsg,
              updatedBy: author
            }
          }
        });
      }
    }

    // Notify member
    try {
      let recipientUserId = null;
      if (ficReq.requesterEmail) {
        const u = await UserModel.findOne({ email: ficReq.requesterEmail.toLowerCase().trim() });
        if (u) recipientUserId = u._id;
      }
      if (!recipientUserId && ficReq.requesterId) {
        recipientUserId = ficReq.requesterId;
      }

      if (recipientUserId) {
        await notifyMember({
          userId: recipientUserId,
          eventType: 'REQUEST_UPDATE',
          title: `Update on Request: ${ficReq.title}`,
          message: adminResponse?.trim() || `Your request "${ficReq.title}" status is now ${ficReq.status}.`,
          link: '/requests',
          priority: 'HIGH'
        });
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch member notification:', notifErr);
    }

    await logAdminAction(req, 'UPDATE_FIC_REQUEST', 'FicRequest', id, { status, assignedStaffId, adminResponse });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('assignedStaffId', 'name email')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'FIC request updated', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

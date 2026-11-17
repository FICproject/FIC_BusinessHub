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

// GET /api/admin/requests - List FIC-mediated service requests only (Dedicated Service Requests page)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    // Strict filter for Service Requests only: exclude Business Ideas, Scaling, Funding, and Investment requests
    const filter: any = {
      $and: [
        {
          $or: [
            { type: { $in: ['SERVICE_INQUIRY', 'SERVICE_REQUEST'] } },
            { sourceModule: 'MARKETPLACE' },
            { targetServiceId: { $exists: true, $ne: null } }
          ]
        },
        {
          type: { $nin: ['SCALING_SUPPORT', 'BUSINESS_IDEAS', 'BUSINESS_DEVELOPMENT', 'INVESTMENT_INTEREST', 'FUNDING_REQUEST'] }
        },
        {
          sourceModule: { $nin: ['BUSINESS_IDEAS', 'SCALING_SUPPORT', 'FUNDING_DESK'] }
        }
      ]
    };

    if (status === 'ACTIVE') {
      filter.$and.push({ status: { $nin: ['COMPLETED', 'REJECTED', 'CANCELLED'] } });
    } else if (status && status !== 'ALL') {
      filter.$and.push({ status });
    }

    let requests: any[] = await FicRequestModel.find(filter)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState providerId providerName providerEmail')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('assignedStaffId', 'name email')
      .populate('scheduledMeetingId')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-resolve provider details from targetServiceId if targetProviderId is unlinked
    for (const r of requests) {
      if (!r.targetProviderId && r.targetServiceId && (r.targetServiceId as any).providerId) {
        const sProviderId = (r.targetServiceId as any).providerId;
        const pMember = await MemberModel.findOne({
          $or: [{ _id: sProviderId }, { email: (r.targetServiceId as any).providerEmail }]
        }).select('name email phone primaryCategoryName').lean();
        if (pMember) {
          r.targetProviderId = pMember;
        } else {
          r.targetProviderId = {
            _id: sProviderId,
            name: (r.targetServiceId as any).providerName || 'Service Provider',
            email: (r.targetServiceId as any).providerEmail || '',
            phone: '',
            primaryCategoryName: (r.targetServiceId as any).categoryName || ''
          };
        }
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      requests = requests.filter(
        (r: any) =>
          r.title?.toLowerCase().includes(q) ||
          r.requestId?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.requesterName?.toLowerCase().includes(q) ||
          r.requesterEmail?.toLowerCase().includes(q) ||
          (r.targetProviderId as any)?.name?.toLowerCase().includes(q) ||
          (r.targetServiceId as any)?.title?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/requests/:id - Single service request details
router.get('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let request: any = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState providerId providerName providerEmail description keyDeliverables')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('assignedStaffId', 'name email')
      .populate('scheduledMeetingId')
      .lean();

    if (!request) {
      res.status(404).json({ success: false, error: 'Service request not found' });
      return;
    }

    // Auto-resolve provider details from targetServiceId if targetProviderId is unlinked
    if (!request.targetProviderId && request.targetServiceId && (request.targetServiceId as any).providerId) {
      const sProviderId = (request.targetServiceId as any).providerId;
      const pMember = await MemberModel.findOne({
        $or: [{ _id: sProviderId }, { email: (request.targetServiceId as any).providerEmail }]
      }).select('name email phone primaryCategoryName').lean();
      if (pMember) {
        request.targetProviderId = pMember;
      } else {
        request.targetProviderId = {
          _id: sProviderId,
          name: (request.targetServiceId as any).providerName || 'Service Provider',
          email: (request.targetServiceId as any).providerEmail || '',
          phone: '',
          primaryCategoryName: (request.targetServiceId as any).categoryName || ''
        };
      }
    }

    res.json({ success: true, data: request });
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

// POST /api/admin/requests/:id/notify-provider or /send-to-provider - Send project information to actual service provider
const handleSendToProvider = async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customMessage } = req.body;

    let ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('targetServiceId')
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Service request not found' });
      return;
    }

    // Auto-resolve provider from service listing if unlinked
    if (!ficReq.targetProviderId && ficReq.targetServiceId && (ficReq.targetServiceId as any).providerId) {
      const sProviderId = (ficReq.targetServiceId as any).providerId;
      const pMember = await MemberModel.findOne({
        $or: [{ _id: sProviderId }, { email: (ficReq.targetServiceId as any).providerEmail }]
      });
      if (pMember) {
        ficReq.targetProviderId = pMember._id as any;
      }
    }

    if (!ficReq.targetProviderId) {
      res.status(400).json({ success: false, error: 'Service listing owner (provider) could not be identified.' });
      return;
    }

    const provider: any = ficReq.targetProviderId;
    const prevStatus = ficReq.status;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'FIC Administrator';

    ficReq.status = 'SENT_TO_PROVIDER';
    ficReq.providerNotifiedAt = now;
    ficReq.projectInfoSentAt = now;
    ficReq.providerDecision = 'AWAITING';
    ficReq.providerResponse = 'PENDING';
    ficReq.adminId = req.admin?.id as any;
    ficReq.adminName = author;

    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Dispatched confidential project brief to service owner "${provider.name || 'Provider'}". Client identity shielded. Status changed to SENT_TO_PROVIDER.`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'SENT_TO_PROVIDER',
      message: customMessage || `Project brief dispatched to service provider ${provider.name}. Requestor private contact shielded.`,
      previousStatus: prevStatus,
      newStatus: 'SENT_TO_PROVIDER',
      timestamp: now,
    });

    await ficReq.save();
    await logAdminAction(req, 'SEND_PROJECT_INFO_TO_PROVIDER', 'FicRequest', id, {
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
          message: `FIC Admin has sent you a new client project brief for "${ficReq.title}". Please review and submit your decision in My Services.`,
          link: '/my-services',
          priority: 'HIGH',
        });
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch provider notification:', notifErr);
    }

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({
      success: true,
      message: `Project information dispatched to ${provider.name}. Status updated to SENT_TO_PROVIDER.`,
      data: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

router.post('/:id/notify-provider', authenticateAdmin, handleSendToProvider);
router.post('/:id/send-to-provider', authenticateAdmin, handleSendToProvider);

// =========================================================================
// PHASE 5: TWO-STAGE BOOK INTRODUCTION CALL
// =========================================================================

// Helper to validate or generate Google Meet links
const resolveMeetingLink = (link?: string, mode?: string): string => {
  if (mode === 'IN_PERSON') return '';
  if (link && link.trim()) {
    const clean = link.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return `https://${clean}`;
    }
    return clean;
  }
  const code1 = Math.random().toString(36).substring(2, 5);
  const code2 = Math.random().toString(36).substring(2, 6);
  const code3 = Math.random().toString(36).substring(2, 5);
  return `https://meet.google.com/fic-${code1}-${code2}`;
};

// 1. STAGE 1: Schedule Admin & Service Provider Meeting
router.post('/:id/schedule-stage1-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, durationMinutes, meetingMode, meetingLink, location, notes } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Service request not found' });
      return;
    }

    // Provider MUST have accepted first
    if (ficReq.providerDecision !== 'ACCEPTED' && ficReq.providerResponse !== 'ACCEPTED' && ficReq.status !== 'PROVIDER_ACCEPTED') {
      res.status(400).json({
        success: false,
        error: 'Stage 1 meeting requires provider acceptance first. The service provider must accept the request before scheduling.'
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      res.status(400).json({ success: false, error: 'Meeting Date and Time are mandatory.' });
      return;
    }

    const hostAdminId = req.admin!.id;
    const author = req.admin?.name || 'FIC Administrator';
    const provider: any = ficReq.targetProviderId;
    const mode = meetingMode === 'IN_PERSON' ? 'IN_PERSON' : 'GOOGLE_MEET';

    if (mode === 'IN_PERSON' && !location?.trim()) {
      res.status(400).json({ success: false, error: 'Meeting location/address is required for In-Person meetings.' });
      return;
    }

    const finalMeetingLink = mode === 'GOOGLE_MEET' ? resolveMeetingLink(meetingLink, mode) : undefined;
    const meetingDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);

    // Create Meeting record for Admin + Provider only
    const meeting = await MeetingModel.create({
      meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      title: `Stage 1 Intro: Admin & Provider (${provider?.name || 'Provider'}) - ${ficReq.title}`,
      description: `Stage 1 alignment meeting between FIC Admin and service provider for request ${ficReq.requestId || ficReq._id}. Requestor is excluded from this stage.`,
      hostAdminId,
      hostAdminName: author,
      participantMemberIds: provider?._id ? [provider._id] : [],
      providerId: provider?._id,
      sourceModule: 'SERVICE_REQUEST_STAGE_1',
      sourceRecordId: ficReq._id.toString(),
      relatedEntityId: ficReq.requestId,
      meetingDate: scheduledDate,
      startTime: scheduledTime,
      scheduledAt: isNaN(meetingDateTime.getTime()) ? new Date() : meetingDateTime,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: finalMeetingLink,
      meetingLocation: mode === 'IN_PERSON' ? location?.trim() : undefined,
      status: 'SCHEDULED',
      meetingType: 'CONSULTATION',
      notificationSent: true,
    });

    const prevStatus = ficReq.status;
    ficReq.status = 'ADMIN_PROVIDER_MEETING_SCHEDULED';
    ficReq.stage1Meeting = {
      meetingId: meeting._id.toString(),
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingMode: mode,
      meetingLink: finalMeetingLink,
      location: mode === 'IN_PERSON' ? location?.trim() : undefined,
      googleCalendarEventId: `CAL-STG1-${Date.now().toString().slice(-6)}`,
      status: 'SCHEDULED',
      scheduledAt: new Date(),
      scheduledByAdminId: hostAdminId,
      scheduledByAdminName: author,
      notes: notes?.trim()
    };

    // Update legacy meetingDetails for backward compatibility
    ficReq.meetingDetails = {
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: finalMeetingLink || location,
      status: 'CONFIRMED',
      bookedAt: new Date(),
      bookedByAdminName: author
    };

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Scheduled Stage 1 meeting with provider ${provider?.name} for ${scheduledDate} at ${scheduledTime}. Mode: ${mode}. Link/Location: ${finalMeetingLink || location}`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: hostAdminId,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'ADMIN_PROVIDER_MEETING_SCHEDULED',
      message: `Stage 1 meeting scheduled with provider ${provider?.name}. Date: ${scheduledDate} ${scheduledTime}.`,
      previousStatus: prevStatus,
      newStatus: 'ADMIN_PROVIDER_MEETING_SCHEDULED',
      timestamp: new Date()
    });

    await ficReq.save();
    await logAdminAction(req, 'SCHEDULE_STAGE1_MEETING', 'FicRequest', id, {
      meetingId: meeting._id,
      stage: 'STAGE_1_ADMIN_PROVIDER',
      scheduledDate,
      scheduledTime
    });

    // Notify Provider only (Requestor is NOT notified about Stage 1 provider call)
    try {
      const providerUser = await UserModel.findOne({
        $or: [{ _id: provider?._id }, { email: (provider?.email || '').toLowerCase().trim() }]
      });
      if (providerUser) {
        await notifyMember({
          userId: providerUser._id as any,
          eventType: 'MEETING_SCHEDULED',
          title: `Stage 1 Meeting Scheduled: ${ficReq.title}`,
          message: `FIC Admin has scheduled a preparation meeting with you on ${scheduledDate} at ${scheduledTime}. Link/Details: ${finalMeetingLink || location}`,
          link: '/meetings',
          priority: 'HIGH'
        });
      }
    } catch {}

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({
      success: true,
      message: `Stage 1 Admin & Provider meeting scheduled for ${scheduledDate} at ${scheduledTime}.`,
      data: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. STAGE 1: Mark Admin & Provider Meeting Completed
router.post('/:id/complete-stage1-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Service request not found' });
      return;
    }

    if (!ficReq.stage1Meeting || ficReq.stage1Meeting.status !== 'SCHEDULED') {
      res.status(400).json({ success: false, error: 'No active scheduled Stage 1 meeting found to mark completed.' });
      return;
    }

    const author = req.admin?.name || 'FIC Administrator';
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const prevStatus = ficReq.status;

    ficReq.stage1Meeting.status = 'COMPLETED';
    ficReq.stage1Meeting.completedAt = now;
    ficReq.stage1Meeting.completedByAdminId = req.admin?.id;
    ficReq.stage1Meeting.completedByAdminName = author;
    if (completionNotes) ficReq.stage1Meeting.notes = (ficReq.stage1Meeting.notes ? ficReq.stage1Meeting.notes + ' | ' : '') + completionNotes.trim();

    ficReq.status = 'ADMIN_PROVIDER_MEETING_COMPLETED';

    // Synchronize MeetingModel status if linked
    if (ficReq.stage1Meeting?.meetingId) {
      try {
        await MeetingModel.findByIdAndUpdate(ficReq.stage1Meeting.meetingId, { status: 'COMPLETED' });
      } catch (meetSyncErr) {
        console.warn('Failed to sync MeetingModel status on complete-stage1:', meetSyncErr);
      }
    }

    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Stage 1 Admin & Provider meeting marked COMPLETED. Stage 2 (Admin & Requestor Meeting) is now UNLOCKED.`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'ADMIN_PROVIDER_MEETING_COMPLETED',
      message: 'Stage 1 meeting completed. Ready for Stage 2 with original service requestor.',
      previousStatus: prevStatus,
      newStatus: 'ADMIN_PROVIDER_MEETING_COMPLETED',
      timestamp: now
    });

    await ficReq.save();
    await logAdminAction(req, 'COMPLETE_STAGE1_MEETING', 'FicRequest', id, { completionNotes });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({
      success: true,
      message: 'Stage 1 meeting marked COMPLETED! Stage 2 with the original service requestor is now unlocked.',
      data: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. STAGE 2: Schedule Admin & Original Service Requestor Meeting
router.post('/:id/schedule-stage2-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, durationMinutes, meetingMode, meetingLink, location, notes } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('requesterId')
      .populate('targetProviderId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Service request not found' });
      return;
    }

    // STRICT GOVERNANCE: Stage 1 must be COMPLETED, unless provider has declined the request
    const isProviderDeclined = Boolean(
      ficReq.providerDecision === 'REJECTED' ||
      ficReq.providerResponse === 'DECLINED' ||
      ficReq.status === 'PROVIDER_REJECTED'
    );

    if (!isProviderDeclined && (!ficReq.stage1Meeting || ficReq.stage1Meeting.status !== 'COMPLETED')) {
      res.status(400).json({
        success: false,
        error: 'Stage 1 (Admin & Provider Meeting) must be completed before Stage 2 can be scheduled.'
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      res.status(400).json({ success: false, error: 'Meeting Date and Time are mandatory.' });
      return;
    }

    const hostAdminId = req.admin!.id;
    const author = req.admin?.name || 'FIC Administrator';
    const requester: any = ficReq.requesterId;
    const mode = meetingMode === 'IN_PERSON' ? 'IN_PERSON' : 'GOOGLE_MEET';

    if (mode === 'IN_PERSON' && !location?.trim()) {
      res.status(400).json({ success: false, error: 'Meeting location/address is required for In-Person meetings.' });
      return;
    }

    const finalMeetingLink = mode === 'GOOGLE_MEET' ? resolveMeetingLink(meetingLink, mode) : undefined;
    const meetingDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);

    // Create Meeting record for Admin + Original Requestor only (Provider excluded)
    const meeting = await MeetingModel.create({
      meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      title: `Stage 2 Briefing: Admin & Requestor (${requester?.name || ficReq.requesterName}) - ${ficReq.title}`,
      description: `Stage 2 debrief meeting between FIC Admin and original service requestor for request ${ficReq.requestId || ficReq._id}. Provider is excluded from this stage.`,
      hostAdminId,
      hostAdminName: author,
      participantMemberIds: requester?._id ? [requester._id] : [],
      sourceModule: 'SERVICE_REQUEST_STAGE_2',
      sourceRecordId: ficReq._id.toString(),
      relatedEntityId: ficReq.requestId,
      meetingDate: scheduledDate,
      startTime: scheduledTime,
      scheduledAt: isNaN(meetingDateTime.getTime()) ? new Date() : meetingDateTime,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: finalMeetingLink,
      meetingLocation: mode === 'IN_PERSON' ? location?.trim() : undefined,
      status: 'SCHEDULED',
      meetingType: 'CONSULTATION',
      notificationSent: true,
    });

    const prevStatus = ficReq.status;
    ficReq.status = 'ADMIN_REQUESTOR_MEETING_SCHEDULED';
    ficReq.stage2Meeting = {
      meetingId: meeting._id.toString(),
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingMode: mode,
      meetingLink: finalMeetingLink,
      location: mode === 'IN_PERSON' ? location?.trim() : undefined,
      googleCalendarEventId: `CAL-STG2-${Date.now().toString().slice(-6)}`,
      status: 'SCHEDULED',
      scheduledAt: new Date(),
      scheduledByAdminId: hostAdminId,
      scheduledByAdminName: author,
      notes: notes?.trim()
    };

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Scheduled Stage 2 meeting with requestor ${requester?.name || ficReq.requesterName} for ${scheduledDate} at ${scheduledTime}. Mode: ${mode}. Link/Location: ${finalMeetingLink || location}`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: hostAdminId,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'ADMIN_REQUESTOR_MEETING_SCHEDULED',
      message: `Stage 2 meeting scheduled with service requestor ${requester?.name || ficReq.requesterName}. Date: ${scheduledDate} ${scheduledTime}.`,
      previousStatus: prevStatus,
      newStatus: 'ADMIN_REQUESTOR_MEETING_SCHEDULED',
      timestamp: new Date()
    });

    await ficReq.save();
    await logAdminAction(req, 'SCHEDULE_STAGE2_MEETING', 'FicRequest', id, {
      meetingId: meeting._id,
      stage: 'STAGE_2_ADMIN_REQUESTOR',
      scheduledDate,
      scheduledTime
    });

    // Notify Original Requestor only (Provider is NOT notified about Stage 2 client call)
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
          title: `FIC Consultation Scheduled: ${ficReq.title}`,
          message: `FIC Admin has scheduled your Stage 2 project consultation call for ${scheduledDate} at ${scheduledTime}. Video link/Location: ${finalMeetingLink || location}`,
          link: '/meetings',
          priority: 'HIGH'
        });
      }
    } catch {}

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({
      success: true,
      message: `Stage 2 Admin & Requestor meeting scheduled for ${scheduledDate} at ${scheduledTime}.`,
      data: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. STAGE 2: Mark Admin & Requestor Meeting Completed (Closes the entire Service Request workflow)
router.post('/:id/complete-stage2-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Service request not found' });
      return;
    }

    if (!ficReq.stage2Meeting || ficReq.stage2Meeting.status !== 'SCHEDULED') {
      res.status(400).json({ success: false, error: 'No active scheduled Stage 2 meeting found to mark completed.' });
      return;
    }

    const author = req.admin?.name || 'FIC Administrator';
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const prevStatus = ficReq.status;

    ficReq.stage2Meeting.status = 'COMPLETED';
    ficReq.stage2Meeting.completedAt = now;
    ficReq.stage2Meeting.completedByAdminId = req.admin?.id;
    ficReq.stage2Meeting.completedByAdminName = author;
    if (completionNotes) ficReq.stage2Meeting.notes = (ficReq.stage2Meeting.notes ? ficReq.stage2Meeting.notes + ' | ' : '') + completionNotes.trim();

    // Mark entire workflow COMPLETED
    ficReq.status = 'COMPLETED';

    // Synchronize MeetingModel status if linked
    if (ficReq.stage2Meeting?.meetingId) {
      try {
        await MeetingModel.findByIdAndUpdate(ficReq.stage2Meeting.meetingId, { status: 'COMPLETED' });
      } catch (meetSyncErr) {
        console.warn('Failed to sync MeetingModel status on complete-stage2:', meetSyncErr);
      }
    }

    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Stage 2 Admin & Requestor meeting marked COMPLETED. Entire Service Request workflow successfully fulfilled and marked COMPLETED.`
    );

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'SERVICE_REQUEST_COMPLETED',
      message: 'Both Stage 1 and Stage 2 meetings successfully completed. Service request closed.',
      previousStatus: prevStatus,
      newStatus: 'COMPLETED',
      timestamp: now
    });

    await ficReq.save();
    await logAdminAction(req, 'COMPLETE_STAGE2_MEETING_AND_CLOSE_REQUEST', 'FicRequest', id, { completionNotes });

    // Notify Original Requestor
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
          title: `Service Request Completed: ${ficReq.title}`,
          message: `Your service request consultation for "${ficReq.title}" has been successfully completed and fulfilled by FIC.`,
          link: '/requests',
          priority: 'HIGH'
        });
      }
    } catch {}

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({
      success: true,
      message: 'Stage 2 meeting completed! The Service Request has been successfully closed and marked COMPLETED.',
      data: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/official-response - Send official message/update to original requestor
router.post('/:id/official-response', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Official response message cannot be empty.' });
      return;
    }

    const ficReq = await FicRequestModel.findById(id)
      .populate('requesterId')
      .populate('targetServiceId')
      .populate('targetProviderId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Service request not found.' });
      return;
    }

    const author = req.admin?.name || 'FIC Administrator';
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const prevStatus = ficReq.status;

    ficReq.adminResponse = message.trim();
    ficReq.adminRespondedAt = now;
    ficReq.adminResponseSentAt = now;
    ficReq.adminRespondedByName = author;
    ficReq.adminId = req.admin?.id as any;
    ficReq.adminName = author;

    if (!ficReq.officialResponses) ficReq.officialResponses = [];
    ficReq.officialResponses.push({
      adminId: req.admin?.id?.toString() || '',
      adminName: author,
      message: message.trim(),
      createdAt: now,
    });

    ficReq.internalNotes.push(`[${timestamp} by ${author}]: Dispatched official client update: "${message.trim()}"`);

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: req.admin?.id,
      actorName: author,
      actorRole: 'ADMIN',
      action: 'ADMIN_RESPONSE_SENT',
      message: message.trim(),
      previousStatus: prevStatus,
      newStatus: ficReq.status,
      timestamp: now,
    });

    await ficReq.save();
    await logAdminAction(req, 'SEND_OFFICIAL_RESPONSE_TO_REQUESTOR', 'FicRequest', id, { message: message.trim() });

    // Notify Member
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
          title: `Official Update: ${ficReq.title}`,
          message: `FIC Administration has sent an official update: "${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
          link: '/my-requests',
          priority: 'HIGH',
        });
      }
    } catch (notifErr) {
      console.warn('Failed to notify member of official response:', notifErr);
    }

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName subCategoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({
      success: true,
      message: 'Official response dispatched to original requestor successfully!',
      data: populated,
    });
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

      if (!ficReq.officialResponses) ficReq.officialResponses = [];
      ficReq.officialResponses.push({
        adminId: req.admin?.id?.toString() || '',
        adminName: author,
        message: adminResponse.trim(),
        createdAt: new Date(),
      });

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

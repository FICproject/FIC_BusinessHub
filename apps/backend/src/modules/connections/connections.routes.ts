import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ServiceRequestModel } from './connections.model';
import { ServiceListingModel } from '../services/services.model';
import { FicRequestModel } from '../admin/models/FicRequest';
import { MemberModel } from '../admin/models/Member';
import { UserModel } from '../users/users.model';
import { notifyAdmins } from '../notifications/notifications.service';
import { authenticate, requireActiveVerifiedMember, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { ServiceRequestStatus } from '@fic/shared-types';

export const connectionsRouter = Router();

// Member submits a service request routed to FIC
connectionsRouter.post('/', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { serviceId, providerUserId, requirementNotes, serviceTitle, categoryName } = req.body;

    if (!requirementNotes || (!serviceId && !serviceTitle)) {
      throw new AppError('Service identifier and requirement notes are required.', 400);
    }

    // Lookup service if serviceId provided
    let service: any = null;
    if (serviceId && mongoose.isValidObjectId(serviceId)) {
      service = await ServiceListingModel.findById(serviceId);
    }

    // Lookup user details
    const user = await UserModel.findById(req.user.userId);
    const requesterEmail = (user?.email || req.user.email || '').toLowerCase().trim();
    const requesterName = user?.fullName || 'FIC Member';

    // Prevent provider from creating a service request for their own service
    if (service) {
      const isOwner = (service.providerId && service.providerId.toString() === req.user.userId.toString()) ||
        (service.providerEmail && service.providerEmail.toLowerCase().trim() === requesterEmail);
      if (isOwner) {
        throw new AppError('You cannot create a service request for your own service listing.', 400, 'SELF_REQUEST_NOT_PERMITTED');
      }
    } else if (providerUserId && providerUserId.toString() === req.user.userId.toString()) {
      throw new AppError('You cannot create a service request for your own service listing.', 400, 'SELF_REQUEST_NOT_PERMITTED');
    }

    // Ensure corresponding Member record exists for requester
    let member = await MemberModel.findOne({
      $or: [{ _id: req.user.userId }, { email: requesterEmail }]
    });

    if (!member) {
      member = await MemberModel.create({
        name: requesterName,
        email: requesterEmail,
        phone: user?.phoneNumber || '9876543210',
        primaryCategory: user?.primaryCategoryId || new mongoose.Types.ObjectId(),
        primaryCategoryName: user?.primaryCategoryName || categoryName || 'Business & Entrepreneurship',
        subcategories: user?.subCategory ? [user.subCategory] : [],
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        membershipPlan: 'FIRST_YEAR_INTRO',
        membershipFeePaid: 99,
        paymentStatus: 'PAID'
      });
    }

    const title = service?.title || serviceTitle || 'Enterprise Service Requirement';
    const resolvedCategory = service?.categoryName || categoryName || 'Universal Marketplace';

    // 1. Create or link FicRequest document for FIC Client Service Desk in Admin Console
    const targetServiceId = service?._id || (serviceId && mongoose.isValidObjectId(serviceId) ? new mongoose.Types.ObjectId(serviceId) : undefined);
    
    // Check if target provider is available and resolve to member record
    let targetProviderId: any = undefined;
    if (service?.providerId && mongoose.isValidObjectId(service.providerId)) {
      const pMember = await MemberModel.findOne({
        $or: [{ _id: service.providerId }, { email: service.providerEmail }]
      });
      targetProviderId = pMember ? pMember._id : service.providerId;
    } else if (providerUserId && mongoose.isValidObjectId(providerUserId)) {
      const pMember = await MemberModel.findOne({ _id: providerUserId });
      targetProviderId = pMember ? pMember._id : providerUserId;
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const generatedReqId = `REQ-${year}-${rand}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const ficRequest = await FicRequestModel.create({
      requestId: generatedReqId,
      type: 'SERVICE_INQUIRY',
      title,
      projectTitle: title,
      description: requirementNotes,
      projectRequirements: requirementNotes,
      requesterId: member._id,
      requesterName,
      requesterEmail,
      requesterPhone: user?.phoneNumber || '',
      requesterCategory: user?.primaryCategoryName || categoryName,
      targetServiceId,
      targetProviderId,
      status: 'SUBMITTED',
      providerDecision: 'AWAITING',
      providerResponse: 'PENDING',
      activityTimeline: [
        {
          actorId: req.user.userId,
          actorName: requesterName,
          actorRole: 'REQUESTOR',
          action: 'REQUEST_SUBMITTED',
          message: `Requirement registered for "${title}". Routed to FIC Desk.`,
          newStatus: 'SUBMITTED',
          timestamp: new Date()
        }
      ],
      internalNotes: [
        `[${timestamp} by System]: New marketplace requirement registered by member ${requesterName} (${requesterEmail}). Category: ${resolvedCategory}. Provider auto-bound to service listing owner.`
      ]
    });

    try {
      await notifyAdmins({
        eventType: 'NEW_REQUEST',
        title: `New Service Request: ${title}`,
        message: `Member ${requesterName} submitted a service inquiry for "${title}".`,
        link: '/requests',
        priority: 'HIGH'
      });
    } catch {}

    // 2. Also keep ServiceRequestModel updated for legacy backward compatibility
    let legacyRequest: any = null;
    try {
      legacyRequest = await ServiceRequestModel.create({
        serviceId: targetServiceId || new mongoose.Types.ObjectId(),
        requesterId: req.user.userId,
        providerId: targetProviderId || req.user.userId,
        requirementNotes,
        status: ServiceRequestStatus.SUBMITTED,
        ficNotes: 'Request received. Assigned to FIC Coordinator for requirement validation.'
      });
    } catch {
      // Ignored if legacy validation differs
    }

    res.status(201).json({
      success: true,
      message: 'Your service request has been received by FIC. Our coordinator will review and contact you shortly.',
      data: {
        id: ficRequest._id.toString(),
        ficRequestId: ficRequest._id.toString(),
        title: ficRequest.title,
        status: ficRequest.status,
        requirementNotes: ficRequest.description,
        legacyRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

// Member views all their submitted requests (combines FicRequests & ServiceRequests)
connectionsRouter.get('/me', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const user = await UserModel.findById(req.user.userId);
    const userEmail = (user?.email || req.user.email || '').toLowerCase().trim();

    // Query all FicRequests submitted by this member
    const ficRequests = await FicRequestModel.find({
      $or: [
        { requesterEmail: userEmail },
        { requesterId: req.user.userId }
      ]
    })
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId')
      .sort({ createdAt: -1 })
      .lean();

    // Format for customer portal consumption
    const formatted = ficRequests.map((r: any) => {
      let statusLabel = 'Under FIC Review';
      let status = 'SUBMITTED';
      let nextAction = 'FIC Desk is coordinating with the service provider';

      switch (r.status) {
        case 'NEW':
        case 'SUBMITTED':
          status = 'SUBMITTED';
          statusLabel = 'Under FIC Review';
          nextAction = 'FIC Desk is evaluating requirement specifications';
          break;
        case 'ADMIN_REVIEW':
        case 'UNDER_REVIEW':
          status = 'UNDER_REVIEW';
          statusLabel = 'Evaluating Scope & Providers';
          nextAction = 'FIC Desk is reviewing technical scope';
          break;
        case 'SENT_TO_PROVIDER':
        case 'AWAITING_PROVIDER_RESPONSE':
        case 'PROVIDER_CONTACTED':
          status = 'AWAITING_PROVIDER_RESPONSE';
          statusLabel = 'Awaiting Provider Acceptance';
          nextAction = 'Provider is reviewing the project brief';
          break;
        case 'PROVIDER_ACCEPTED':
          status = 'PROVIDER_ACCEPTED';
          statusLabel = 'Provider Accepted';
          nextAction = 'FIC is coordinating next steps & meeting';
          break;
        case 'PROVIDER_REJECTED':
          status = 'PROVIDER_REJECTED';
          statusLabel = 'Provider Unavailable';
          nextAction = 'FIC will advise on alternative options';
          break;
        case 'ADMIN_RESPONSE_SENT':
        case 'RESPONDED':
          status = 'ADMIN_RESPONSE_SENT';
          statusLabel = 'FIC Response Sent';
          nextAction = 'Check official FIC response in details';
          break;
        case 'MEETING_PROPOSED':
        case 'MEETING_CONFIRMED':
        case 'MEETING_SCHEDULED':
          status = 'MEETING_CONFIRMED';
          statusLabel = 'Consultation Call Scheduled';
          nextAction = 'Join scheduled video conference';
          break;
        case 'IN_PROGRESS':
          status = 'IN_PROGRESS';
          statusLabel = 'In Progress';
          nextAction = 'Project execution in progress';
          break;
        case 'COMPLETED':
          status = 'COMPLETED';
          statusLabel = 'Service Completed';
          nextAction = 'Workflow completed';
          break;
        case 'CANCELLED':
        case 'REJECTED':
          status = 'CANCELLED';
          statusLabel = 'Request Cancelled';
          nextAction = 'No further action required';
          break;
        default:
          status = r.status;
          statusLabel = r.status ? r.status.replace(/_/g, ' ') : 'Under Review';
      }

      // Latest coordinator remark from direct admin response or internal notes
      const notes = r.adminResponse || (
        Array.isArray(r.internalNotes) && r.internalNotes.length > 0
          ? r.internalNotes[r.internalNotes.length - 1]
          : 'FIC Coordinator assigned. Evaluating verified providers and preparing confidential proposals.'
      );

      return {
        id: r._id.toString(),
        _id: r._id.toString(),
        requestId: r.requestId || ('REQ-' + r._id.toString().slice(-6).toUpperCase()),
        title: r.title,
        status,
        statusLabel,
        adminStatus: r.status,
        nextAction,
        latestUpdate: notes,
        notes: r.description,
        requirementNotes: r.description,
        ficRemark: notes,
        adminResponse: r.adminResponse,
        adminRespondedAt: r.adminRespondedAt || r.adminResponseSentAt,
        adminRespondedByName: r.adminRespondedByName,
        providerOutcome: (r.providerDecision === 'ACCEPTED' || r.providerResponse === 'ACCEPTED')
          ? 'ACCEPTED'
          : ((r.providerDecision === 'REJECTED' || r.providerResponse === 'DECLINED') ? 'REJECTED' : 'PENDING'),
        assignedStaffName: r.assignedStaffName,
        targetProvider: r.targetProviderId ? {
          name: r.targetProviderId.name,
          category: r.targetProviderId.primaryCategoryName
        } : null,
        scheduledMeeting: r.scheduledMeetingId ? {
          title: r.scheduledMeetingId.title,
          scheduledAt: r.scheduledMeetingId.scheduledAt,
          meetingLink: r.scheduledMeetingId.meetingLink,
          status: r.scheduledMeetingId.status
        } : (r.meetingDetails?.meetingLink ? {
          title: 'FIC Introduction Call',
          scheduledAt: `${r.meetingDetails.scheduledDate}T${r.meetingDetails.scheduledTime}`,
          meetingLink: r.meetingDetails.meetingLink,
          status: r.meetingDetails.status
        } : null),
        meetingDetails: r.meetingDetails,
        activityTimeline: r.activityTimeline || [],
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
        createdAt: r.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
});

// Provider views all incoming service requests dispatched to them (Strictly anonymized client identity)
connectionsRouter.get('/incoming', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const userId = req.user.userId;
    const user = await UserModel.findById(userId);
    const userEmail = (user?.email || req.user.email || '').toLowerCase().trim();

    // Find services owned by this provider
    const myServices = await ServiceListingModel.find({
      $or: [{ providerId: userId }, { providerEmail: userEmail }]
    }).select('_id title categoryName').lean();
    const myServiceIds = myServices.map((s: any) => s._id);

    // Find Member record
    const member = await MemberModel.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });

    const targetProviderOr = [
      { targetProviderId: userId },
      ...(member ? [{ targetProviderId: member._id }] : []),
      { targetServiceId: { $in: myServiceIds } }
    ];

    const ficRequests = await FicRequestModel.find({ $or: targetProviderOr })
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = ficRequests.map((r: any) => {
      const responseStatus = r.providerDecision === 'ACCEPTED' || r.providerResponse === 'ACCEPTED'
        ? 'ACCEPTED'
        : (r.providerDecision === 'REJECTED' || r.providerResponse === 'DECLINED' ? 'DECLINED' : 'PENDING');

      return {
        id: r._id.toString(),
        _id: r._id.toString(),
        requestId: r.requestId || ('REQ-' + r._id.toString().slice(-6).toUpperCase()),
        title: r.title,
        description: r.description,
        requirementNotes: r.description,
        serviceTitle: (r.targetServiceId as any)?.title || r.title,
        serviceCategory: (r.targetServiceId as any)?.categoryName || 'Marketplace Capability',
        // Client identity strictly shielded from provider per FIC Intermediary Governance
        requesterName: 'Confidential FIC Member (Protected)',
        requesterCategory: r.requesterCategory || 'FIC Business Member',
        requesterEmail: '',
        requesterPhone: '',
        clientShielded: true,
        status: responseStatus,
        providerDecision: r.providerDecision || (responseStatus === 'ACCEPTED' ? 'ACCEPTED' : (responseStatus === 'DECLINED' ? 'REJECTED' : 'AWAITING')),
        providerResponse: responseStatus,
        providerResponseMessage: r.providerResponseMessage || '',
        providerRejectionReason: r.providerRejectionReason || '',
        providerResponseAt: r.providerResponseAt || r.providerRespondedAt,
        providerRespondedAt: r.providerRespondedAt || r.providerResponseAt,
        adminStatus: r.status,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
        createdAt: r.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
});

// Helper for provider response handling
const handleProviderDecision = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { id } = req.params;
    const { decision, reason, message } = req.body; // decision: 'ACCEPTED' | 'DECLINED' | 'REJECTED'

    const normalizedDecision = (decision || '').toUpperCase();
    if (!['ACCEPTED', 'DECLINED', 'REJECTED'].includes(normalizedDecision)) {
      throw new AppError('Valid decision ("ACCEPTED" or "DECLINED" / "REJECTED") is required.', 400);
    }

    const isAccepted = normalizedDecision === 'ACCEPTED';
    if (!isAccepted && !reason?.trim() && !message?.trim()) {
      throw new AppError('A clear rejection reason is required when declining a service request.', 400);
    }

    const userId = req.user.userId;
    const user = await UserModel.findById(userId);
    const userEmail = (user?.email || req.user.email || '').toLowerCase().trim();
    const member = await MemberModel.findOne({ $or: [{ _id: userId }, { email: userEmail }] });

    const ficReq = await FicRequestModel.findById(id).populate('targetServiceId');
    if (!ficReq) {
      throw new AppError('Service request not found.', 404);
    }

    // Verify provider authorization
    const isTargetProvider =
      (ficReq.targetProviderId && (ficReq.targetProviderId.toString() === userId.toString() || (member && ficReq.targetProviderId.toString() === member._id.toString()))) ||
      ((ficReq.targetServiceId as any)?.providerId && (ficReq.targetServiceId as any).providerId.toString() === userId.toString());

    if (!isTargetProvider) {
      const myServices = await ServiceListingModel.find({
        $or: [{ providerId: userId }, { providerEmail: userEmail }]
      }).select('_id');
      const isOwnerOfTarget = myServices.some((s) => ficReq.targetServiceId && s._id.toString() === ficReq.targetServiceId.toString());
      if (!isOwnerOfTarget) {
        throw new AppError('You are not authorized to respond to this service request.', 403);
      }
    }

    const prevStatus = ficReq.status;
    const now = new Date();
    ficReq.providerResponse = isAccepted ? 'ACCEPTED' : 'DECLINED';
    ficReq.providerDecision = isAccepted ? 'ACCEPTED' : 'REJECTED';
    ficReq.providerResponseAt = now;
    ficReq.providerRespondedAt = now;

    if (isAccepted) {
      ficReq.providerResponseMessage = (message || reason || '').trim();
      ficReq.status = 'PROVIDER_ACCEPTED';
    } else {
      ficReq.providerRejectionReason = (reason || message || '').trim();
      ficReq.status = 'PROVIDER_REJECTED';
    }

    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const providerName = user?.fullName || member?.name || 'Assigned Provider';
    const actionNote = isAccepted
      ? `Provider accepted service inquiry.${ficReq.providerResponseMessage ? ` Clarification: "${ficReq.providerResponseMessage}"` : ''}`
      : `Provider declined service inquiry. Reason: "${ficReq.providerRejectionReason}"`;

    ficReq.internalNotes.push(`[${timestamp} by ${providerName}]: ${actionNote}`);

    if (!ficReq.activityTimeline) ficReq.activityTimeline = [];
    ficReq.activityTimeline.push({
      actorId: userId.toString(),
      actorName: providerName,
      actorRole: 'PROVIDER',
      action: isAccepted ? 'PROVIDER_ACCEPTED' : 'PROVIDER_REJECTED',
      message: isAccepted ? (ficReq.providerResponseMessage || 'Accepted project assignment') : ficReq.providerRejectionReason,
      previousStatus: prevStatus,
      newStatus: ficReq.status,
      timestamp: now,
    });

    await ficReq.save();

    // Sync to legacy ServiceRequestModel if present
    try {
      await ServiceRequestModel.updateMany(
        { $or: [{ serviceId: ficReq.targetServiceId }, { providerId: userId }] },
        {
          status: isAccepted ? ServiceRequestStatus.IN_PROGRESS : ServiceRequestStatus.CANCELLED,
          ficNotes: actionNote
        }
      );
    } catch {}

    // Notify Admins immediately
    try {
      await notifyAdmins({
        eventType: isAccepted ? 'PROVIDER_ACCEPTED' : 'PROVIDER_REJECTED',
        title: `Provider ${isAccepted ? 'Accepted' : 'Declined'}: ${ficReq.title}`,
        message: `Provider ${providerName} has ${isAccepted ? 'ACCEPTED' : 'DECLINED'} "${ficReq.title}".${isAccepted ? '' : ` Reason: ${ficReq.providerRejectionReason}`}`,
        link: '/requests',
        priority: 'HIGH'
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: `Service request has been successfully ${isAccepted ? 'accepted' : 'declined'}.`,
      data: {
        id: ficReq._id.toString(),
        providerResponse: ficReq.providerResponse,
        providerDecision: ficReq.providerDecision,
        providerResponseAt: ficReq.providerResponseAt,
        status: ficReq.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Provider responds to incoming service request (Accept or Decline)
connectionsRouter.patch('/incoming/:id/respond', authenticate, requireActiveVerifiedMember, handleProviderDecision);
connectionsRouter.post('/incoming/:id/respond', authenticate, requireActiveVerifiedMember, handleProviderDecision);



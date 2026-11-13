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
    
    // Check if target provider is available
    let targetProviderId: any = undefined;
    if (service?.providerId && mongoose.isValidObjectId(service.providerId)) {
      targetProviderId = service.providerId;
    } else if (providerUserId && mongoose.isValidObjectId(providerUserId)) {
      targetProviderId = providerUserId;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const ficRequest = await FicRequestModel.create({
      type: 'SERVICE_INQUIRY',
      title,
      description: requirementNotes,
      requesterId: member._id,
      requesterName,
      requesterEmail,
      targetServiceId,
      targetProviderId,
      status: 'NEW',
      internalNotes: [
        `[${timestamp} by System]: New marketplace requirement registered by member ${requesterName} (${requesterEmail}). Category: ${resolvedCategory}.`
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
      // Map FIC Request status to display status and label
      let statusLabel = 'Under FIC Review';
      let status = 'SUBMITTED';

      switch (r.status) {
        case 'NEW':
          status = 'SUBMITTED';
          statusLabel = 'Under FIC Review';
          break;
        case 'UNDER_REVIEW':
          status = 'IN_PROGRESS';
          statusLabel = 'Evaluating Providers';
          break;
        case 'PROVIDER_CONTACTED':
          status = 'IN_PROGRESS';
          statusLabel = 'Provider Contacted';
          break;
        case 'MEETING_SCHEDULED':
          status = 'IN_PROGRESS';
          statusLabel = 'Consultation Call Scheduled';
          break;
        case 'COMPLETED':
          status = 'COMPLETED';
          statusLabel = 'Service Completed';
          break;
        case 'CANCELLED':
          status = 'CANCELLED';
          statusLabel = 'Request Cancelled';
          break;
        default:
          status = r.status;
          statusLabel = r.status;
      }

      // Latest coordinator remark from internal notes or direct admin response
      const notes = r.adminResponse || (
        Array.isArray(r.internalNotes) && r.internalNotes.length > 0
          ? r.internalNotes[r.internalNotes.length - 1]
          : 'FIC Coordinator assigned. Evaluating verified providers and preparing confidential proposals.'
      );

      return {
        adminResponse: r.adminResponse,
        adminRespondedAt: r.adminRespondedAt,
        adminRespondedByName: r.adminRespondedByName,
        id: r._id.toString(),
        _id: r._id.toString(),
        title: r.title,
        status,
        statusLabel,
        adminStatus: r.status,
        notes: r.description,
        requirementNotes: r.description,
        ficRemark: notes,
        internalNotes: r.internalNotes || [],
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
        } : null,
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



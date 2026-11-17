import mongoose from 'mongoose';
import { MeetingModel, IMeeting, CentralMeetingSourceModule, IMeetingParticipantInfo } from '../models/Meeting';
import { AdminUserModel } from '../models/AdminUser';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { notifyMember } from '../../notifications/notifications.service';

export interface ISyncMeetingPayload {
  meetingId?: string;
  sourceModule: CentralMeetingSourceModule;
  sourceRecordId: string;
  sourceSubId?: string;
  relatedEntityId?: string;
  title: string;
  description?: string;
  hostAdminId?: mongoose.Types.ObjectId | string;
  hostAdminName?: string;
  participantMemberIds?: (mongoose.Types.ObjectId | string)[];
  providerId?: mongoose.Types.ObjectId | string;
  externalParticipants?: IMeetingParticipantInfo[];
  meetingDate: string;
  startTime: string;
  durationMinutes?: number;
  meetingMode?: 'VIRTUAL' | 'IN_PERSON' | 'GOOGLE_MEET';
  meetingLink?: string;
  meetingLocation?: string;
  meetingType?: string;
  status?: 'PENDING_COORDINATION' | 'SCHEDULED' | 'RESCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  metadata?: Record<string, any>;
}

export class CentralMeetingsService {
  /**
   * Helper to resolve a valid Admin ObjectId for hostAdminId
   */
  private static async resolveHostAdmin(hostAdminId?: mongoose.Types.ObjectId | string): Promise<{ adminId: mongoose.Types.ObjectId; adminName: string }> {
    if (hostAdminId && mongoose.isValidObjectId(hostAdminId)) {
      const admin = await AdminUserModel.findById(hostAdminId);
      if (admin) {
        return { adminId: admin._id, adminName: admin.name || 'FIC Administrator' };
      }
    }
    const superAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());
    if (superAdmin) {
      return { adminId: superAdmin._id, adminName: superAdmin.name || 'FIC Super Administrator' };
    }
    const fallbackId = new mongoose.Types.ObjectId();
    return { adminId: fallbackId, adminName: 'FIC Super Administrator' };
  }

  /**
   * Helper to parse date and time into a reliable Date object
   */
  private static parseScheduledAt(dateStr?: string, timeStr?: string): Date {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.trim();
    const cleanTime = (timeStr || '11:00').trim();
    const d = new Date(`${cleanDate}T${cleanTime}:00`);
    return isNaN(d.getTime()) ? new Date(`${cleanDate} ${cleanTime}`) : d;
  }

  /**
   * Centralized Meeting Creator & Synchronizer:
   * Prevents duplicate meetings by finding any existing meeting for the sourceModule + sourceRecordId (+ sourceSubId).
   */
  public static async syncOrCreateMeeting(payload: ISyncMeetingPayload): Promise<IMeeting> {
    const {
      meetingId,
      sourceModule,
      sourceRecordId,
      sourceSubId,
      relatedEntityId,
      title,
      description,
      hostAdminId,
      hostAdminName,
      participantMemberIds = [],
      providerId,
      externalParticipants = [],
      meetingDate,
      startTime,
      durationMinutes = 45,
      meetingMode = 'VIRTUAL',
      meetingLink,
      meetingLocation,
      meetingType = 'CONSULTATION',
      status = 'SCHEDULED',
      metadata = {}
    } = payload;

    const scheduledAt = this.parseScheduledAt(meetingDate, startTime);
    const { adminId: resolvedAdminId, adminName: resolvedAdminName } = await this.resolveHostAdmin(hostAdminId);

    // Sanitize Member ObjectIds
    const validMemberIds: mongoose.Types.ObjectId[] = participantMemberIds
      .filter((id) => id && mongoose.isValidObjectId(id))
      .map((id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id));

    const validProviderId = providerId && mongoose.isValidObjectId(providerId)
      ? (typeof providerId === 'string' ? new mongoose.Types.ObjectId(providerId) : providerId)
      : undefined;

    // Deduplicate and filter external participants
    const cleanExternal: IMeetingParticipantInfo[] = [];
    const seenEmails = new Set<string>();
    for (const ep of externalParticipants) {
      if (!ep || !ep.email) continue;
      const em = ep.email.toLowerCase().trim();
      if (!seenEmails.has(em)) {
        seenEmails.add(em);
        cleanExternal.push({
          name: ep.name ? ep.name.trim() : 'Participant',
          email: em,
          phone: ep.phone ? ep.phone.trim() : '',
          roleOrCompany: ep.roleOrCompany ? ep.roleOrCompany.trim() : '',
          badge: ep.badge ? ep.badge.trim() : '',
          memberId: ep.memberId ? String(ep.memberId) : undefined
        });
      }
    }

    // 1. Check if meeting already exists
    let existingMeeting: IMeeting | null = null;
    if (meetingId && mongoose.isValidObjectId(meetingId)) {
      existingMeeting = await MeetingModel.findById(meetingId);
    }
    if (!existingMeeting && meetingId) {
      existingMeeting = await MeetingModel.findOne({ meetingId });
    }
    if (!existingMeeting && sourceModule && sourceRecordId) {
      const query: any = { sourceModule, sourceRecordId };
      if (sourceSubId) {
        query.sourceSubId = sourceSubId;
      }
      existingMeeting = await MeetingModel.findOne(query);
    }

    let savedMeeting: IMeeting;

    if (existingMeeting) {
      // Update existing meeting without creating duplicates
      existingMeeting.title = title.trim();
      if (description !== undefined) existingMeeting.description = description.trim();
      existingMeeting.hostAdminId = resolvedAdminId;
      existingMeeting.hostAdminName = hostAdminName || resolvedAdminName;
      existingMeeting.participantMemberIds = validMemberIds;
      if (validProviderId) existingMeeting.providerId = validProviderId;
      existingMeeting.externalParticipants = cleanExternal;
      existingMeeting.scheduledAt = scheduledAt;
      existingMeeting.meetingDate = meetingDate;
      existingMeeting.startTime = startTime;
      existingMeeting.durationMinutes = Number(durationMinutes) || 45;
      existingMeeting.meetingMode = meetingMode;
      if (meetingLink !== undefined) existingMeeting.meetingLink = meetingLink?.trim();
      if (meetingLocation !== undefined) existingMeeting.meetingLocation = meetingLocation?.trim();
      existingMeeting.meetingType = meetingType;
      existingMeeting.status = status;
      if (relatedEntityId) existingMeeting.relatedEntityId = relatedEntityId;
      if (metadata) existingMeeting.metadata = { ...(existingMeeting.metadata || {}), ...metadata };
      existingMeeting.notificationSent = true;

      savedMeeting = await existingMeeting.save();
    } else {
      // Create new canonical Meeting
      const newMeetingId = `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      savedMeeting = await MeetingModel.create({
        meetingId: newMeetingId,
        title: title.trim(),
        description: description?.trim(),
        hostAdminId: resolvedAdminId,
        hostAdminName: hostAdminName || resolvedAdminName,
        participantMemberIds: validMemberIds,
        providerId: validProviderId,
        externalParticipants: cleanExternal,
        meetingType,
        sourceModule,
        sourceRecordId,
        sourceSubId,
        relatedEntityId,
        scheduledAt,
        meetingDate,
        startTime,
        durationMinutes: Number(durationMinutes) || 45,
        meetingMode,
        meetingLink: meetingLink?.trim(),
        meetingLocation: meetingLocation?.trim(),
        status,
        notificationSent: true,
        metadata
      });
    }

    // 2. Dispatch Live Notifications to all participants
    try {
      await this.notifyParticipants(savedMeeting, 'SCHEDULED');
    } catch (notifErr) {
      console.warn('CentralMeetingsService: Notification warning:', notifErr);
    }

    return savedMeeting;
  }

  /**
   * Reschedule an existing meeting across all views
   */
  public static async rescheduleMeeting(
    meetingIdOrQuery: string | { id?: string; sourceModule?: string; sourceRecordId?: string; sourceSubId?: string },
    updateData: {
      date: string;
      time: string;
      durationMinutes?: number;
      meetingLink?: string;
      meetingLocation?: string;
      notes?: string;
      adminName?: string;
    }
  ): Promise<IMeeting | null> {
    let meeting: IMeeting | null = null;

    if (typeof meetingIdOrQuery === 'string') {
      if (mongoose.isValidObjectId(meetingIdOrQuery)) {
        meeting = await MeetingModel.findById(meetingIdOrQuery);
      }
      if (!meeting) {
        meeting = await MeetingModel.findOne({ meetingId: meetingIdOrQuery });
      }
    } else {
      if (meetingIdOrQuery.id && mongoose.isValidObjectId(meetingIdOrQuery.id)) {
        meeting = await MeetingModel.findById(meetingIdOrQuery.id);
      }
      if (!meeting && meetingIdOrQuery.sourceModule && meetingIdOrQuery.sourceRecordId) {
        const q: any = {
          sourceModule: meetingIdOrQuery.sourceModule,
          sourceRecordId: meetingIdOrQuery.sourceRecordId
        };
        if (meetingIdOrQuery.sourceSubId) q.sourceSubId = meetingIdOrQuery.sourceSubId;
        meeting = await MeetingModel.findOne(q);
      }
    }

    if (!meeting) return null;

    const scheduledAt = this.parseScheduledAt(updateData.date, updateData.time);
    meeting.scheduledAt = scheduledAt;
    meeting.meetingDate = updateData.date;
    meeting.startTime = updateData.time;
    if (updateData.durationMinutes) meeting.durationMinutes = Number(updateData.durationMinutes);
    if (updateData.meetingLink) meeting.meetingLink = updateData.meetingLink.trim();
    if (updateData.meetingLocation) meeting.meetingLocation = updateData.meetingLocation.trim();
    if (updateData.notes) meeting.description = updateData.notes.trim();
    meeting.status = 'RESCHEDULED';
    await meeting.save();

    // Sync back to original module document in MongoDB
    await this.syncBackToSource(meeting, 'RESCHEDULED', updateData);

    // Notify participants
    try {
      await this.notifyParticipants(meeting, 'RESCHEDULED');
    } catch (notifErr) {
      console.warn('CentralMeetingsService: Reschedule notification warning:', notifErr);
    }

    return meeting;
  }

  /**
   * Cancel an existing meeting across all views
   */
  public static async cancelMeeting(
    meetingIdOrQuery: string | { id?: string; sourceModule?: string; sourceRecordId?: string; sourceSubId?: string },
    cancelReason?: string
  ): Promise<IMeeting | null> {
    let meeting: IMeeting | null = null;

    if (typeof meetingIdOrQuery === 'string') {
      if (mongoose.isValidObjectId(meetingIdOrQuery)) {
        meeting = await MeetingModel.findById(meetingIdOrQuery);
      }
      if (!meeting) {
        meeting = await MeetingModel.findOne({ meetingId: meetingIdOrQuery });
      }
    } else {
      if (meetingIdOrQuery.id && mongoose.isValidObjectId(meetingIdOrQuery.id)) {
        meeting = await MeetingModel.findById(meetingIdOrQuery.id);
      }
      if (!meeting && meetingIdOrQuery.sourceModule && meetingIdOrQuery.sourceRecordId) {
        const q: any = {
          sourceModule: meetingIdOrQuery.sourceModule,
          sourceRecordId: meetingIdOrQuery.sourceRecordId
        };
        if (meetingIdOrQuery.sourceSubId) q.sourceSubId = meetingIdOrQuery.sourceSubId;
        meeting = await MeetingModel.findOne(q);
      }
    }

    if (!meeting) return null;

    meeting.status = 'CANCELLED';
    if (cancelReason) {
      meeting.description = (meeting.description ? meeting.description + ' | ' : '') + `Cancelled: ${cancelReason}`;
    }
    await meeting.save();

    // Sync back to original module document in MongoDB
    await this.syncBackToSource(meeting, 'CANCELLED', { notes: cancelReason });

    // Notify participants
    try {
      await this.notifyParticipants(meeting, 'CANCELLED');
    } catch (notifErr) {
      console.warn('CentralMeetingsService: Cancel notification warning:', notifErr);
    }

    return meeting;
  }

  /**
   * Complete an existing meeting across all views
   */
  public static async completeMeeting(
    meetingIdOrQuery: string | { id?: string; sourceModule?: string; sourceRecordId?: string; sourceSubId?: string },
    completionSummary?: string
  ): Promise<IMeeting | null> {
    let meeting: IMeeting | null = null;

    if (typeof meetingIdOrQuery === 'string') {
      if (mongoose.isValidObjectId(meetingIdOrQuery)) {
        meeting = await MeetingModel.findById(meetingIdOrQuery);
      }
      if (!meeting) {
        meeting = await MeetingModel.findOne({ meetingId: meetingIdOrQuery });
      }
    } else {
      if (meetingIdOrQuery.id && mongoose.isValidObjectId(meetingIdOrQuery.id)) {
        meeting = await MeetingModel.findById(meetingIdOrQuery.id);
      }
      if (!meeting && meetingIdOrQuery.sourceModule && meetingIdOrQuery.sourceRecordId) {
        const q: any = {
          sourceModule: meetingIdOrQuery.sourceModule,
          sourceRecordId: meetingIdOrQuery.sourceRecordId
        };
        if (meetingIdOrQuery.sourceSubId) q.sourceSubId = meetingIdOrQuery.sourceSubId;
        meeting = await MeetingModel.findOne(q);
      }
    }

    if (!meeting) return null;

    meeting.status = 'COMPLETED';
    if (completionSummary) {
      meeting.description = (meeting.description ? meeting.description + ' | ' : '') + `Completed: ${completionSummary}`;
    }
    await meeting.save();

    // Sync back to original module document in MongoDB
    await this.syncBackToSource(meeting, 'COMPLETED', { notes: completionSummary });

    // Notify participants
    try {
      await this.notifyParticipants(meeting, 'COMPLETED');
    } catch (notifErr) {
      console.warn('CentralMeetingsService: Completion notification warning:', notifErr);
    }

    return meeting;
  }

  /**
   * Sync updates back to the original module document in MongoDB
   */
  private static async syncBackToSource(
    meeting: IMeeting,
    newStatus: 'SCHEDULED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED',
    details: any = {}
  ): Promise<void> {
    try {
      const { sourceModule, sourceRecordId, sourceSubId } = meeting;
      if (!sourceModule || !sourceRecordId) return;

      // 1. Business Idea Submitter Consultation
      if (sourceModule === 'BUSINESS_IDEA' && !sourceSubId) {
        const { BusinessIdeaModel } = await import('../../business-ideas/business-ideas.model');
        const idea = await BusinessIdeaModel.findById(sourceRecordId);
        if (idea) {
          if (newStatus === 'COMPLETED') {
            idea.status = 'MEETING_COMPLETED';
            idea.adminReviewStatus = 'APPROVED';
            idea.meetingDetails = {
              ...(idea.meetingDetails || {}),
              isCompleted: true,
              completedAt: new Date(),
              completionSummary: details.notes || 'Meeting completed by Admin.'
            };
          } else if (newStatus === 'CANCELLED') {
            idea.status = 'UNDER_REVIEW';
            idea.adminReviewStatus = 'UNDER_REVIEW';
            idea.meetingDetails = undefined;
          } else if (newStatus === 'RESCHEDULED') {
            idea.meetingDetails = {
              ...(idea.meetingDetails || {}),
              date: meeting.meetingDate || details.date,
              time: meeting.startTime || details.time,
              durationMinutes: meeting.durationMinutes,
              linkOrLocation: meeting.meetingLink || meeting.meetingLocation,
              notes: details.notes || meeting.description
            };
          }
          await idea.save();
        }
      }

      // 2. Business Idea Interested Member Meeting
      if (sourceModule === 'BUSINESS_IDEA' && sourceSubId) {
        const { BusinessIdeaInterestModel } = await import('../../business-ideas/business-ideas.model');
        const interest = await BusinessIdeaInterestModel.findById(sourceSubId);
        if (interest) {
          if (newStatus === 'COMPLETED') {
            interest.reviewStatus = 'MEETING_COMPLETED';
            if (interest.meetingDetails) {
              interest.meetingDetails.status = 'COMPLETED';
            }
          } else if (newStatus === 'CANCELLED') {
            interest.reviewStatus = 'INTEREST_SUBMITTED';
            interest.meetingDetails = undefined;
          } else if (newStatus === 'RESCHEDULED') {
            interest.reviewStatus = 'MEETING_SCHEDULED';
            interest.meetingDetails = {
              ...(interest.meetingDetails || {}),
              date: meeting.meetingDate || details.date,
              time: meeting.startTime || details.time,
              durationMinutes: meeting.durationMinutes,
              linkOrLocation: meeting.meetingLink || meeting.meetingLocation,
              notes: details.notes || meeting.description,
              status: 'RESCHEDULED'
            };
          }
          await interest.save();
        }
      }

      // 3. Business Scaling Request
      if (sourceModule === 'BUSINESS_SCALING') {
        const { BusinessDevRequestModel } = await import('../../business-development/business-development.model');
        const scaling = await BusinessDevRequestModel.findById(sourceRecordId);
        if (scaling) {
          if (newStatus === 'COMPLETED') {
            scaling.status = 'MEETING_COMPLETED';
            scaling.meetingDetails = {
              ...(scaling.meetingDetails || {}),
              isCompleted: true,
              completedAt: new Date(),
              completionSummary: details.notes || 'Meeting completed by Admin.'
            };
          } else if (newStatus === 'CANCELLED') {
            scaling.status = 'UNDER_REVIEW';
            scaling.meetingDetails = undefined;
          } else if (newStatus === 'RESCHEDULED') {
            scaling.status = 'MEETING_SCHEDULED';
            scaling.meetingDetails = {
              ...(scaling.meetingDetails || {}),
              date: meeting.meetingDate || details.date,
              time: meeting.startTime || details.time,
              durationMinutes: meeting.durationMinutes,
              linkOrLocation: meeting.meetingLink || meeting.meetingLocation,
              notes: details.notes || meeting.description,
              scheduledAt: meeting.scheduledAt
            };
          }
          await scaling.save();
        }
      }

      // 4. Service Request Stage 1 (Provider Meeting)
      if (sourceModule === 'SERVICE_REQUEST_STAGE_1') {
        const { FicRequestModel } = await import('../models/FicRequest');
        const ficReq = await FicRequestModel.findById(sourceRecordId);
        if (ficReq && ficReq.stage1Meeting) {
          if (newStatus === 'COMPLETED') {
            ficReq.stage1Meeting.status = 'COMPLETED';
            ficReq.stage1Meeting.completedAt = new Date();
          } else if (newStatus === 'CANCELLED') {
            ficReq.stage1Meeting.status = 'CANCELLED';
          } else if (newStatus === 'RESCHEDULED') {
            ficReq.stage1Meeting.scheduledDate = meeting.meetingDate || details.date;
            ficReq.stage1Meeting.scheduledTime = meeting.startTime || details.time;
            ficReq.stage1Meeting.durationMinutes = meeting.durationMinutes;
            ficReq.stage1Meeting.meetingLink = meeting.meetingLink;
            ficReq.stage1Meeting.location = meeting.meetingLocation;
            ficReq.stage1Meeting.status = 'SCHEDULED';
          }
          await ficReq.save();
        }
      }

      // 5. Service Request Stage 2 (Requester Meeting)
      if (sourceModule === 'SERVICE_REQUEST_STAGE_2') {
        const { FicRequestModel } = await import('../models/FicRequest');
        const ficReq = await FicRequestModel.findById(sourceRecordId);
        if (ficReq && ficReq.stage2Meeting) {
          if (newStatus === 'COMPLETED') {
            ficReq.stage2Meeting.status = 'COMPLETED';
            ficReq.stage2Meeting.completedAt = new Date();
          } else if (newStatus === 'CANCELLED') {
            ficReq.stage2Meeting.status = 'CANCELLED';
          } else if (newStatus === 'RESCHEDULED') {
            ficReq.stage2Meeting.scheduledDate = meeting.meetingDate || details.date;
            ficReq.stage2Meeting.scheduledTime = meeting.startTime || details.time;
            ficReq.stage2Meeting.durationMinutes = meeting.durationMinutes;
            ficReq.stage2Meeting.meetingLink = meeting.meetingLink;
            ficReq.stage2Meeting.location = meeting.meetingLocation;
            ficReq.stage2Meeting.status = 'SCHEDULED';
          }
          await ficReq.save();
        }
      }
    } catch (syncBackErr) {
      console.warn('CentralMeetingsService: syncBackToSource warning:', syncBackErr);
    }
  }

  /**
   * Helper to dispatch notifications to all participants
   */
  private static async notifyParticipants(
    meeting: IMeeting,
    action: 'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED'
  ): Promise<void> {
    const titleText =
      action === 'SCHEDULED'
        ? `New Meeting Scheduled: ${meeting.title}`
        : action === 'RESCHEDULED'
        ? `Meeting Rescheduled: ${meeting.title}`
        : action === 'COMPLETED'
        ? `Meeting Completed: ${meeting.title}`
        : `Meeting Cancelled: ${meeting.title}`;

    const dateStr = meeting.meetingDate && meeting.startTime
      ? `${meeting.meetingDate} at ${meeting.startTime}`
      : new Date(meeting.scheduledAt).toLocaleString();

    const messageText =
      action === 'SCHEDULED'
        ? `Your consultation "${meeting.title}" is scheduled for ${dateStr}. Access link is available in your Meetings desk.`
        : action === 'RESCHEDULED'
        ? `Your meeting "${meeting.title}" has been rescheduled to ${dateStr}.`
        : action === 'COMPLETED'
        ? `Your consultation "${meeting.title}" has been marked completed.`
        : `Your scheduled consultation "${meeting.title}" has been cancelled.`;

    // 1. Participant Member IDs
    if (Array.isArray(meeting.participantMemberIds) && meeting.participantMemberIds.length > 0) {
      const members = await MemberModel.find({ _id: { $in: meeting.participantMemberIds } });
      for (const m of members) {
        let u = await UserModel.findOne({ email: m.email.toLowerCase().trim() });
        const targetUserId = u?._id || (m as any).userId || m._id;
        await notifyMember({
          userId: targetUserId,
          eventType: `MEETING_${action}`,
          title: titleText,
          message: messageText,
          link: '/meetings',
          priority: action === 'CANCELLED' ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    // 2. External Participants matched to registered users
    if (Array.isArray(meeting.externalParticipants) && meeting.externalParticipants.length > 0) {
      for (const ep of meeting.externalParticipants) {
        if (!ep.email) continue;
        const u = await UserModel.findOne({ email: ep.email.toLowerCase().trim() });
        if (u) {
          await notifyMember({
            userId: u._id,
            eventType: `MEETING_${action}`,
            title: titleText,
            message: messageText,
            link: '/meetings',
            priority: action === 'CANCELLED' ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }
  }

  /**
   * Sync all existing module meetings into MeetingModel ensuring zero duplicates
   */
  public static async syncAllLegacyMeetings(): Promise<void> {
    try {
      const defaultAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

      // 1. Business Ideas - Submitter Meetings
      try {
        const { BusinessIdeaModel, BusinessIdeaInterestModel } = await import('../../business-ideas/business-ideas.model');
        const ideasWithMeetings = await BusinessIdeaModel.find({
          $or: [
            { 'meetingDetails.date': { $exists: true, $ne: '' } },
            { 'meetingDetails.scheduledAt': { $exists: true, $ne: null } },
            { status: 'MEETING_SCHEDULED' }
          ]
        });

        for (const idea of ideasWithMeetings) {
          if (!idea.meetingDetails?.date && !idea.meetingDetails?.scheduledAt) continue;
          const mDate = idea.meetingDetails.date || new Date(idea.meetingDetails.scheduledAt || idea.createdAt).toISOString().split('T')[0];
          const mTime = idea.meetingDetails.time || '11:00';
          const pMemberId = idea.submitterMemberId || (mongoose.isValidObjectId(idea.userId) ? idea.userId : undefined);
          const isComp = idea.status === 'MEETING_COMPLETED' || idea.meetingDetails.isCompleted;

          const existing = await MeetingModel.findOne({
            $or: [
              ...(idea.meetingDetails.meetingId && mongoose.isValidObjectId(idea.meetingDetails.meetingId)
                ? [{ _id: idea.meetingDetails.meetingId }]
                : []),
              { sourceModule: 'BUSINESS_IDEA', sourceRecordId: idea._id.toString(), sourceSubId: { $in: [null, undefined, ''] } },
              { title: `Business Idea Consultation: ${idea.title}` }
            ]
          });

          if (!existing) {
            const created = await MeetingModel.create({
              meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              title: `Business Idea Consultation: ${idea.title}`,
              description: idea.meetingDetails.notes || `FIC Incubation & Market Advisory consultation for idea "${idea.title}". [${idea.ideaRequestId || idea.refNumber || idea._id}]`,
              hostAdminId: defaultAdmin?._id,
              hostAdminName: defaultAdmin?.name || 'FIC Super Administrator',
              participantMemberIds: pMemberId ? [pMemberId] : [],
              externalParticipants: [
                {
                  name: idea.submitterName || 'Member',
                  email: idea.submitterEmail || 'member@fic.com',
                  phone: idea.submitterPhone || '',
                  roleOrCompany: idea.title,
                  badge: 'Idea Requester'
                }
              ],
              meetingType: 'CONSULTATION',
              sourceModule: 'BUSINESS_IDEA',
              sourceRecordId: idea._id.toString(),
              relatedEntityId: idea.ideaRequestId || idea.refNumber,
              scheduledAt: this.parseScheduledAt(mDate, mTime),
              meetingDate: mDate,
              startTime: mTime,
              durationMinutes: idea.meetingDetails.durationMinutes || 45,
              meetingMode: idea.meetingDetails.mode === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL',
              meetingLink: idea.meetingDetails.linkOrLocation,
              status: isComp ? 'COMPLETED' : 'SCHEDULED',
              notificationSent: true
            });
            idea.meetingDetails.meetingId = created._id.toString();
            await idea.save();
          } else {
            let chg = false;
            if (!existing.sourceModule) { existing.sourceModule = 'BUSINESS_IDEA'; chg = true; }
            if (!existing.sourceRecordId) { existing.sourceRecordId = idea._id.toString(); chg = true; }
            if (!existing.relatedEntityId) { existing.relatedEntityId = idea.ideaRequestId || idea.refNumber; chg = true; }
            if (isComp && existing.status !== 'COMPLETED') { existing.status = 'COMPLETED'; chg = true; }
            if (chg) await existing.save();
          }
        }

        // 1b. Business Ideas - Interested Members Collaboration Meetings
        const interestsWithMeetings = await BusinessIdeaInterestModel.find({
          $or: [
            { 'meetingDetails.date': { $exists: true, $ne: '' } },
            { 'meetingDetails.scheduledAt': { $exists: true, $ne: null } },
            { reviewStatus: 'MEETING_SCHEDULED' }
          ]
        });

        for (const interest of interestsWithMeetings) {
          if (!interest.meetingDetails?.date && !interest.meetingDetails?.scheduledAt) continue;
          const idea = await BusinessIdeaModel.findById(interest.ideaId);
          const mDate = interest.meetingDetails.date || new Date(interest.meetingDetails.scheduledAt || interest.createdAt).toISOString().split('T')[0];
          const mTime = interest.meetingDetails.time || '15:00';
          const pIds = [idea?.submitterMemberId, interest.interestedMemberId].filter((id) => id && mongoose.isValidObjectId(id));

          const existing = await MeetingModel.findOne({
            $or: [
              ...(interest.meetingDetails.meetingId && mongoose.isValidObjectId(interest.meetingDetails.meetingId)
                ? [{ _id: interest.meetingDetails.meetingId }]
                : []),
              { sourceModule: 'BUSINESS_IDEA', sourceRecordId: interest.ideaId?.toString(), sourceSubId: interest._id.toString() },
              { title: `Business Idea Collaboration: ${idea?.title || 'Idea'} - ${interest.interestedMemberName}` }
            ]
          });

          if (!existing) {
            const created = await MeetingModel.create({
              meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              title: `Business Idea Collaboration: ${idea?.title || 'Idea'} - ${interest.interestedMemberName}`,
              description: interest.meetingDetails.notes || `FIC multi-party intermediary call between idea submitter (${idea?.submitterName}) and interested collaborator (${interest.interestedMemberName}).`,
              hostAdminId: defaultAdmin?._id,
              hostAdminName: defaultAdmin?.name || 'FIC Super Administrator',
              participantMemberIds: pIds,
              externalParticipants: [
                {
                  name: idea?.submitterName || 'Idea Submitter',
                  email: idea?.submitterEmail || 'submitter@fic.com',
                  phone: idea?.submitterPhone || '',
                  roleOrCompany: 'Idea Submitter',
                  badge: 'Requester'
                },
                {
                  name: interest.interestedMemberName,
                  email: interest.interestedMemberEmail || 'collaborator@fic.com',
                  phone: interest.interestedMemberPhone || '',
                  roleOrCompany: interest.contributionType || 'Interested Collaborator',
                  badge: 'Interested Member'
                }
              ],
              meetingType: 'CONSULTATION',
              sourceModule: 'BUSINESS_IDEA',
              sourceRecordId: interest.ideaId?.toString(),
              sourceSubId: interest._id.toString(),
              relatedEntityId: idea?.ideaRequestId || idea?.refNumber,
              scheduledAt: this.parseScheduledAt(mDate, mTime),
              meetingDate: mDate,
              startTime: mTime,
              durationMinutes: interest.meetingDetails.durationMinutes || 45,
              meetingMode: interest.meetingDetails.mode === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL',
              meetingLink: interest.meetingDetails.linkOrLocation,
              status: interest.reviewStatus === 'MEETING_COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
              notificationSent: true
            });
            interest.meetingDetails.meetingId = created._id.toString();
            await interest.save();
          }
        }
      } catch (ideaErr) {
        console.warn('CentralMeetingsService legacy sync warning (Ideas):', ideaErr);
      }

      // 2. Business Scaling Requests
      try {
        const { BusinessDevRequestModel } = await import('../../business-development/business-development.model');
        const scalingWithMeetings = await BusinessDevRequestModel.find({
          $or: [
            { status: { $in: ['MEETING_SCHEDULED', 'MEETING_COMPLETED'] } },
            { 'meetingDetails.scheduledAt': { $exists: true, $ne: null } },
            { 'meetingDetails.date': { $exists: true, $ne: '' } }
          ]
        });

        for (const sReq of scalingWithMeetings) {
          const mDate = sReq.meetingDetails?.date || new Date(sReq.meetingDetails?.scheduledAt || sReq.createdAt).toISOString().split('T')[0];
          const mTime = sReq.meetingDetails?.time || '11:00';
          const isCompleted = sReq.status === 'MEETING_COMPLETED' || sReq.meetingDetails?.isCompleted;

          const member = await MemberModel.findOne({
            $or: [
              ...(mongoose.isValidObjectId(sReq.userId) ? [{ userId: sReq.userId }, { _id: sReq.userId }] : []),
              ...(sReq.submitterEmail ? [{ email: sReq.submitterEmail }] : [])
            ]
          });

          const pIds = member?._id ? [member._id] : (mongoose.isValidObjectId(sReq.userId) ? [sReq.userId] : []);

          const existing = await MeetingModel.findOne({
            $or: [
              ...(sReq.meetingDetails?.meetingId && mongoose.isValidObjectId(sReq.meetingDetails.meetingId)
                ? [{ _id: sReq.meetingDetails.meetingId }]
                : []),
              { sourceModule: 'BUSINESS_SCALING', sourceRecordId: sReq._id.toString() },
              { title: `Business Scaling Advisory: ${sReq.businessName}` }
            ]
          });

          if (!existing) {
            const created = await MeetingModel.create({
              meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              title: `Business Scaling Advisory: ${sReq.businessName || 'Scaling'}`,
              description: sReq.meetingDetails?.notes || `FIC scaling consultation for ${sReq.scalingSupportType || 'Business Scaling'}. [${sReq.requestId || sReq._id}]`,
              hostAdminId: defaultAdmin?._id,
              hostAdminName: defaultAdmin?.name || 'FIC Super Administrator',
              participantMemberIds: pIds,
              externalParticipants: [
                {
                  name: sReq.submitterName || member?.name || 'Member',
                  email: sReq.submitterEmail || member?.email || 'member@fic.com',
                  phone: sReq.submitterPhone || member?.phone || '',
                  roleOrCompany: sReq.businessName || 'Business Owner',
                  badge: 'Scaling Requester'
                }
              ],
              meetingType: 'CONSULTATION',
              sourceModule: 'BUSINESS_SCALING',
              sourceRecordId: sReq._id.toString(),
              relatedEntityId: sReq.requestId,
              scheduledAt: this.parseScheduledAt(mDate, mTime),
              meetingDate: mDate,
              startTime: mTime,
              durationMinutes: sReq.meetingDetails?.durationMinutes || 45,
              meetingLink: sReq.meetingDetails?.linkOrLocation || 'https://meet.google.com/fic-scaling-session',
              status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
              notificationSent: true
            });
            if (!sReq.meetingDetails) {
              (sReq as any).meetingDetails = { meetingId: created._id.toString() };
            } else {
              sReq.meetingDetails.meetingId = created._id.toString();
            }
            await sReq.save();
          } else {
            let chg = false;
            if (!existing.sourceModule) { existing.sourceModule = 'BUSINESS_SCALING'; chg = true; }
            if (!existing.sourceRecordId) { existing.sourceRecordId = sReq._id.toString(); chg = true; }
            if (!existing.relatedEntityId) { existing.relatedEntityId = sReq.requestId; chg = true; }
            if (isCompleted && existing.status !== 'COMPLETED') { existing.status = 'COMPLETED'; chg = true; }
            if (chg) await existing.save();
          }
        }
      } catch (scalingErr) {
        console.warn('CentralMeetingsService legacy sync warning (Scaling):', scalingErr);
      }

      // 3. Service Requests Stage 1 and Stage 2
      try {
        const { FicRequestModel } = await import('../models/FicRequest');
        const srvRequests = await FicRequestModel.find({
          $or: [
            { 'stage1Meeting.status': { $in: ['SCHEDULED', 'COMPLETED'] } },
            { 'stage2Meeting.status': { $in: ['SCHEDULED', 'COMPLETED'] } }
          ]
        }).populate('requesterId targetProviderId');

        for (const r of srvRequests) {
          // Stage 1
          if (r.stage1Meeting?.status && ['SCHEDULED', 'COMPLETED'].includes(r.stage1Meeting.status)) {
            const pName = (r.targetProviderId as any)?.name || 'Provider';
            const pEmail = (r.targetProviderId as any)?.email || '';
            const mDate = r.stage1Meeting.scheduledDate || new Date().toISOString().split('T')[0];
            const mTime = r.stage1Meeting.scheduledTime || '11:00';

            const existing = await MeetingModel.findOne({
              $or: [
                ...(r.stage1Meeting.meetingId && mongoose.isValidObjectId(r.stage1Meeting.meetingId)
                  ? [{ _id: r.stage1Meeting.meetingId }]
                  : []),
                { sourceModule: 'SERVICE_REQUEST_STAGE_1', sourceRecordId: r._id.toString() }
              ]
            });

            if (!existing) {
              const created = await MeetingModel.create({
                meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
                title: `Stage 1 Intro: Admin & Provider (${pName}) - ${r.title}`,
                description: `Stage 1 alignment meeting between FIC Admin and service provider for request ${r.requestId || r._id}. Requestor is excluded from this stage.`,
                hostAdminId: r.stage1Meeting.scheduledByAdminId || defaultAdmin?._id,
                hostAdminName: r.stage1Meeting.scheduledByAdminName || defaultAdmin?.name || 'FIC Super Administrator',
                participantMemberIds: (r.targetProviderId as any)?._id ? [(r.targetProviderId as any)._id] : [],
                providerId: (r.targetProviderId as any)?._id,
                externalParticipants: [{ name: pName, email: pEmail, roleOrCompany: 'Service Provider', badge: 'Provider' }],
                meetingType: 'CONSULTATION',
                sourceModule: 'SERVICE_REQUEST_STAGE_1',
                sourceRecordId: r._id.toString(),
                relatedEntityId: r.requestId,
                scheduledAt: this.parseScheduledAt(mDate, mTime),
                meetingDate: mDate,
                startTime: mTime,
                durationMinutes: r.stage1Meeting.durationMinutes || 45,
                meetingLink: r.stage1Meeting.meetingLink,
                meetingLocation: r.stage1Meeting.location,
                status: r.stage1Meeting.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
                notificationSent: true
              });
              r.stage1Meeting.meetingId = created._id.toString();
              await r.save();
            } else {
              let chg = false;
              if (!existing.sourceModule) { existing.sourceModule = 'SERVICE_REQUEST_STAGE_1'; chg = true; }
              if (!existing.sourceRecordId) { existing.sourceRecordId = r._id.toString(); chg = true; }
              if (!existing.relatedEntityId) { existing.relatedEntityId = r.requestId; chg = true; }
              if (r.stage1Meeting.status === 'COMPLETED' && existing.status !== 'COMPLETED') { existing.status = 'COMPLETED'; chg = true; }
              if (chg) await existing.save();
            }
          }

          // Stage 2
          if (r.stage2Meeting?.status && ['SCHEDULED', 'COMPLETED'].includes(r.stage2Meeting.status)) {
            const reqName = (r.requesterId as any)?.name || r.requesterName || 'Client';
            const reqEmail = (r.requesterId as any)?.email || r.requesterEmail || '';
            const mDate = r.stage2Meeting.scheduledDate || new Date().toISOString().split('T')[0];
            const mTime = r.stage2Meeting.scheduledTime || '11:00';

            const existing = await MeetingModel.findOne({
              $or: [
                ...(r.stage2Meeting.meetingId && mongoose.isValidObjectId(r.stage2Meeting.meetingId)
                  ? [{ _id: r.stage2Meeting.meetingId }]
                  : []),
                { sourceModule: 'SERVICE_REQUEST_STAGE_2', sourceRecordId: r._id.toString() }
              ]
            });

            if (!existing) {
              const created = await MeetingModel.create({
                meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
                title: `Stage 2 Briefing: Admin & Requestor (${reqName}) - ${r.title}`,
                description: `Stage 2 debrief meeting between FIC Admin and original service requestor for request ${r.requestId || r._id}. Provider is excluded from this stage.`,
                hostAdminId: r.stage2Meeting.scheduledByAdminId || defaultAdmin?._id,
                hostAdminName: r.stage2Meeting.scheduledByAdminName || defaultAdmin?.name || 'FIC Super Administrator',
                participantMemberIds: (r.requesterId as any)?._id ? [(r.requesterId as any)._id] : [],
                externalParticipants: [{ name: reqName, email: reqEmail, roleOrCompany: 'Service Requestor', badge: 'Requestor' }],
                meetingType: 'CONSULTATION',
                sourceModule: 'SERVICE_REQUEST_STAGE_2',
                sourceRecordId: r._id.toString(),
                relatedEntityId: r.requestId,
                scheduledAt: this.parseScheduledAt(mDate, mTime),
                meetingDate: mDate,
                startTime: mTime,
                durationMinutes: r.stage2Meeting.durationMinutes || 45,
                meetingLink: r.stage2Meeting.meetingLink,
                meetingLocation: r.stage2Meeting.location,
                status: r.stage2Meeting.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
                notificationSent: true
              });
              r.stage2Meeting.meetingId = created._id.toString();
              await r.save();
            } else {
              let chg = false;
              if (!existing.sourceModule) { existing.sourceModule = 'SERVICE_REQUEST_STAGE_2'; chg = true; }
              if (!existing.sourceRecordId) { existing.sourceRecordId = r._id.toString(); chg = true; }
              if (!existing.relatedEntityId) { existing.relatedEntityId = r.requestId; chg = true; }
              if (r.stage2Meeting.status === 'COMPLETED' && existing.status !== 'COMPLETED') { existing.status = 'COMPLETED'; chg = true; }
              if (chg) await existing.save();
            }
          }
        }
      } catch (srvErr) {
        console.warn('CentralMeetingsService legacy sync warning (Service Requests):', srvErr);
      }

      // 4. Funding Applications
      try {
        const { FundingApplicationModel } = await import('../models/FundingApplication');
        const fundingAppsWithMeetings = await FundingApplicationModel.find({
          meetingScheduledAt: { $exists: true, $ne: null }
        });

        for (const fApp of fundingAppsWithMeetings) {
          const mDate = new Date(fApp.meetingScheduledAt!).toISOString().split('T')[0];
          const mTime = new Date(fApp.meetingScheduledAt!).toTimeString().substring(0, 5);

          const existing = await MeetingModel.findOne({
            $or: [
              { relatedFundingApplicationId: fApp._id },
              { sourceModule: 'FUNDING_REQUEST', sourceRecordId: fApp._id.toString() }
            ]
          });

          if (!existing) {
            await MeetingModel.create({
              meetingId: `MTG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              title: `FIC Funding Pitch: ${fApp.businessName}`,
              description: `Venture capital investment pitch with ${fApp.applicantName} (${fApp.applicantEmail}). Requested: ₹${fApp.requestedAmount?.toLocaleString('en-IN')}. Notes: ${fApp.diligenceNotes || ''}`,
              hostAdminId: defaultAdmin?._id,
              hostAdminName: defaultAdmin?.name || 'FIC Super Administrator',
              participantMemberIds: [],
              externalParticipants: [
                {
                  name: fApp.applicantName,
                  email: fApp.applicantEmail,
                  phone: fApp.applicantPhone,
                  roleOrCompany: fApp.businessName,
                  badge: 'Funding Applicant'
                }
              ],
              meetingType: 'FUNDING_PITCH',
              sourceModule: 'FUNDING_REQUEST',
              sourceRecordId: fApp._id.toString(),
              relatedFundingApplicationId: fApp._id,
              scheduledAt: fApp.meetingScheduledAt!,
              meetingDate: mDate,
              startTime: mTime,
              durationMinutes: 45,
              meetingLink: fApp.meetingLink || 'https://meet.google.com/fic-pitch-session',
              status: fApp.stage === 'FUNDED' || fApp.stage === 'REPAID' ? 'COMPLETED' : 'SCHEDULED',
              notificationSent: true
            });
          }
        }
      } catch (fundingErr) {
        console.warn('CentralMeetingsService legacy sync warning (Funding):', fundingErr);
      }
    } catch (globalLegacyErr) {
      console.warn('CentralMeetingsService: Global legacy sync error:', globalLegacyErr);
    }
  }

  /**
   * Retrieve list of meetings for Admin Portal central Meetings & Calls desk
   */
  public static async getAdminMeetings(query: {
    status?: string;
    sourceModule?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    // Ensure all legacy module meetings are indexed into MeetingModel
    await this.syncAllLegacyMeetings();

    const filter: any = {};

    if (query.status && query.status !== 'ALL') {
      if (query.status === 'UPCOMING') {
        filter.status = { $in: ['SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS'] };
        filter.scheduledAt = { $gte: new Date() };
      } else if (query.status === 'TODAY') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        filter.scheduledAt = { $gte: start, $lte: end };
      } else {
        filter.status = query.status;
      }
    }

    if (query.sourceModule && query.sourceModule !== 'ALL') {
      filter.sourceModule = query.sourceModule;
    }

    if (query.startDate || query.endDate) {
      filter.scheduledAt = {};
      if (query.startDate) filter.scheduledAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.scheduledAt.$lte = end;
      }
    }

    const defaultAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

    let meetings = await MeetingModel.find(filter)
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('providerId', 'name email phone primaryCategoryName')
      .sort({ scheduledAt: -1 })
      .lean();

    // Map and normalize hostAdminId and deduplicate external participants
    meetings = meetings.map((m: any) => {
      if (!m.hostAdminId || !m.hostAdminId.name) {
        m.hostAdminId = {
          _id: defaultAdmin?._id,
          name: m.hostAdminName || defaultAdmin?.name || 'FIC Super Administrator',
          email: defaultAdmin?.email || 'admin@fic.com',
          role: defaultAdmin?.role || 'SUPER_ADMIN'
        };
      }

      // Deduplicate externalParticipants against participantMemberIds by email, phone, or name
      if (Array.isArray(m.participantMemberIds) && Array.isArray(m.externalParticipants)) {
        const memberEmails = new Set(
          m.participantMemberIds
            .map((p: any) => (p?.email || '').toLowerCase().trim())
            .filter(Boolean)
        );
        const memberPhones = new Set(
          m.participantMemberIds
            .map((p: any) => (p?.phone || p?.phoneNumber || '').trim())
            .filter(Boolean)
        );
        const memberNames = new Set(
          m.participantMemberIds
            .map((p: any) => (p?.name || p?.fullName || '').toLowerCase().trim())
            .filter((n: string) => n && n !== 'member')
        );

        m.externalParticipants = m.externalParticipants.filter((e: any) => {
          const eEmail = (e?.email || '').toLowerCase().trim();
          const ePhone = (e?.phone || '').trim();
          const eName = (e?.name || '').toLowerCase().trim();
          if (eEmail && memberEmails.has(eEmail)) return false;
          if (ePhone && memberPhones.has(ePhone)) return false;
          if (eName && memberNames.has(eName)) return false;
          return true;
        });
      }

      return m;
    });

    if (query.search && typeof query.search === 'string') {
      const q = query.search.toLowerCase().trim();
      meetings = meetings.filter((m: any) => {
        const matchTitle = m.title?.toLowerCase().includes(q);
        const matchRef = m.relatedEntityId?.toLowerCase().includes(q) || m.meetingId?.toLowerCase().includes(q);
        const matchModule = m.sourceModule?.toLowerCase().includes(q);
        const matchMembers = m.participantMemberIds?.some(
          (p: any) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
        );
        const matchExternal = m.externalParticipants?.some(
          (e: any) => e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.roleOrCompany?.toLowerCase().includes(q)
        );
        return matchTitle || matchRef || matchModule || matchMembers || matchExternal;
      });
    }

    return meetings;
  }

  /**
   * Retrieve list of authorized meetings for Member Portal
   */
  public static async getMemberMeetings(userId: string, userEmail?: string, userPhone?: string): Promise<any[]> {
    // Ensure all module meetings are indexed into MeetingModel
    await this.syncAllLegacyMeetings();

    const member = await MemberModel.findOne({
      $or: [
        { userId: userId },
        ...(userEmail ? [{ email: new RegExp(`^${userEmail.trim()}$`, 'i') }] : []),
        ...(mongoose.isValidObjectId(userId) ? [{ _id: userId }] : [])
      ]
    }).lean();

    const userIds = [userId, (member as any)?.userId, member?._id]
      .filter((id) => id && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const emailRegex = userEmail ? new RegExp(`^${userEmail.trim()}$`, 'i') : null;
    const phone = (userPhone || member?.phone || '').trim();

    const orConditions: any[] = [];
    if (userIds.length > 0) {
      orConditions.push({ participantMemberIds: { $in: userIds } });
      orConditions.push({ providerId: { $in: userIds } });
    }
    if (emailRegex) {
      orConditions.push({ 'externalParticipants.email': emailRegex });
    }
    if (phone) {
      orConditions.push({ 'externalParticipants.phone': phone });
    }

    if (orConditions.length === 0) return [];

    const defaultAdmin = (await AdminUserModel.findOne({ role: 'SUPER_ADMIN' })) || (await AdminUserModel.findOne());

    const meetings = await MeetingModel.find({ $or: orConditions })
      .populate('hostAdminId', 'name email role')
      .populate('participantMemberIds', 'name email phone primaryCategoryName')
      .populate('providerId', 'name email phone primaryCategoryName')
      .sort({ scheduledAt: -1 })
      .lean();

    return meetings.map((m: any) => {
      if (!m.hostAdminId || !m.hostAdminId.name) {
        m.hostAdminId = {
          _id: defaultAdmin?._id,
          name: m.hostAdminName || defaultAdmin?.name || 'FIC Super Administrator',
          email: defaultAdmin?.email || 'admin@fic.com',
          role: defaultAdmin?.role || 'SUPER_ADMIN'
        };
      }
      return m;
    });
  }
}

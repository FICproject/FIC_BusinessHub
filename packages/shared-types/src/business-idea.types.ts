export type BusinessIdeaStage =
  | 'Just an Idea'
  | 'Research & Planning'
  | 'Business Model Prepared'
  | 'Prototype / MVP Stage'
  | 'Already Started';

export type BusinessIdeaSupportOption =
  | 'Business Idea Validation'
  | 'Business Plan & Strategy'
  | 'Mentorship & Expert Guidance'
  | 'Technical / Product Development'
  | 'Business Connections & Partnerships'
  | 'Market Research & Customer Connections'
  | 'Other – Specify Your Requirement';

export type BusinessIdeaStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFORMATION_REQUESTED'
  | 'APPROVED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'REJECTED'
  | 'SHARED_ON_MARKETPLACE'
  | 'INTEREST_RECEIVED'
  | 'MEMBER_SELECTION_PENDING'
  | 'MATCHED'
  | 'COMPLETED'
  | 'CLOSED';

export type CollaborationContributionType =
  | 'Business collaboration'
  | 'Technical expertise'
  | 'Mentorship'
  | 'Market access'
  | 'Manufacturing capability'
  | 'Business connections'
  | 'Other';

export type CollaborationInterestStatus =
  | 'INTEREST_SUBMITTED'
  | 'UNDER_ADMIN_REVIEW'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'NOT_SELECTED';

export interface IBusinessIdeaSupportingDocument {
  name: string;
  fileUrl: string;
  fileType?: string;
  uploadedAt: string;
  documentId?: string;
}

export interface IBusinessIdeaActivityLog {
  action: string;
  actorType: 'MEMBER' | 'ADMIN' | 'SYSTEM' | 'INTERESTED_MEMBER';
  actorId?: string;
  actorName?: string;
  notes?: string;
  timestamp: string;
}

export interface IBusinessIdea {
  _id: string;
  ideaRequestId: string; // e.g. IDEA-2026-00123
  refNumber?: string;
  submitterMemberId: string;
  userId: string;
  submitterName: string;
  submitterEmail?: string;
  submitterPhone?: string;
  title: string;
  mainCategoryId: string;
  mainCategoryName: string;
  mainCategorySlug?: string;
  subcategoryId?: string;
  subcategoryName: string;
  description: string;
  targetMarket?: string;
  targetLocation?: string;
  developmentStage: BusinessIdeaStage;
  supportRequirements: BusinessIdeaSupportOption[];
  customSupportRequirement?: string;
  additionalMessage?: string;
  supportingDocuments?: IBusinessIdeaSupportingDocument[];
  adminReviewStatus: BusinessIdeaStatus;
  status: BusinessIdeaStatus;
  adminNotes?: string;
  adminFeedbackToSubmitter?: string;
  rejectionReason?: string;
  informationRequestNotes?: string;
  marketplacePublished: boolean;
  marketplacePublishedAt?: string;
  interestedMembersCount: number;
  collaborationStatus?: string;
  fundingAsked: boolean;
  fundingRequired?: boolean | null;
  fundingRequestId?: string;
  fundingRequestRef?: string;
  meetingDetails?: {
    meetingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    mode?: 'VIRTUAL' | 'IN_PERSON';
    linkOrLocation?: string;
    notes?: string;
    scheduledAt?: string | Date;
    scheduledBy?: string;
    isCompleted?: boolean;
    completedAt?: string | Date;
    completionSummary?: string;
  };
  activityTimeline: IBusinessIdeaActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessIdeaInterest {
  _id: string;
  ideaRequestId: string;
  ideaId: string;
  ideaTitle?: string;
  interestedMemberId: string;
  interestedUserId?: string;
  interestedMemberName: string;
  interestedMemberEmail?: string;
  interestedMemberPhone?: string;
  interestedCategoryName?: string;
  interestedSubcategoryName?: string;
  contributionType: CollaborationContributionType;
  interestReason: string;
  contributionOffer?: string;
  experience?: string;
  additionalMessage?: string;
  reviewStatus: CollaborationInterestStatus;
  meetingDetails?: {
    meetingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    mode?: 'VIRTUAL' | 'IN_PERSON';
    linkOrLocation?: string;
    notes?: string;
    scheduledAt?: string | Date;
    scheduledBy?: string;
    status?: string;
  };
  adminNotes?: string;
  selectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}


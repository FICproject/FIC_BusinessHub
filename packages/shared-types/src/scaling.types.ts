export type ScalingSupportType =
  | 'Business Growth & Expansion Support'
  | 'Marketing & Customer Acquisition Support'
  | 'Funding Support'
  | 'Mentorship & Expert Guidance Support';

export type BusinessStage =
  | 'Startup'
  | 'Early Stage'
  | 'Running Business'
  | 'Established Business'
  | 'Expansion Stage';

export type ScalingSupportRequired =
  | 'Business Expansion & New Branches'
  | 'Marketing & Customer Growth'
  | 'Technology & Automation'
  | 'Funding & Financial Planning'
  | 'Partnerships & Distribution'
  | 'Business Strategy & Mentorship'
  | 'Other – Specify Your Requirement';

export type ScalingStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'CANCELLED';

export interface IScalingSupportingDocument {
  name: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface IScalingMeetingDetails {
  meetingId?: string;
  date: string;
  time: string;
  durationMinutes?: number;
  mode: 'VIRTUAL' | 'IN_PERSON';
  linkOrLocation: string;
  notes?: string;
  scheduledAt?: string;
  scheduledBy?: string;
  isCompleted?: boolean;
  completedAt?: string;
  completionSummary?: string;
}

export interface IScalingActivityLog {
  action: string;
  actorType: 'MEMBER' | 'ADMIN' | 'SYSTEM';
  actorId?: string;
  actorName?: string;
  notes?: string;
  timestamp: string | Date;
}

export interface IScalingRequest {
  _id: string;
  requestId: string;
  refNumber?: string;
  userId: string;
  memberId?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  businessName: string;
  mainCategoryId: string;
  mainCategoryName: string;
  subcategoryId?: string;
  subcategoryName: string;
  scalingSupportType: ScalingSupportType;
  currentBusinessStage: BusinessStage;
  businessDescription: string;
  currentBusinessLocation: string;
  targetExpansionLocation?: string;
  mainChallenge: string;
  supportRequired: ScalingSupportRequired;
  customSupportRequired?: string;
  additionalDetails?: string;
  supportingDocuments?: IScalingSupportingDocument[];
  status: ScalingStatus;
  meetingDetails?: IScalingMeetingDetails;
  meetingCompletedAt?: string;
  completionSummary?: string;
  adminNotes?: string;
  activityTimeline: IScalingActivityLog[];
  createdAt: string;
  updatedAt: string;
}


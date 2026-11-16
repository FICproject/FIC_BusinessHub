import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal } from '../motion';
import {
  RocketIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClockIcon,
  FileTextIcon,
  PlusIcon,
  AlertCircleIcon
} from '../components/Icons';
import { Video, MapPin, Calendar, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';
import {
  apiRequest,
  getStoredUser,
  uploadDocumentFile,
  UploadedDocumentAsset
} from '../services/api';

export interface ScalingSupportingDocument {
  name: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface ScalingMeetingDetails {
  meetingId?: string;
  date?: string;
  time?: string;
  durationMinutes?: number;
  mode?: 'VIRTUAL' | 'IN_PERSON';
  linkOrLocation?: string;
  notes?: string;
  scheduledAt?: string;
  scheduledBy?: string;
  isCompleted?: boolean;
  completedAt?: string;
  completionSummary?: string;
}

export interface ScalingRequestItem {
  _id: string;
  requestId: string;
  refNumber?: string;
  userId: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  businessName: string;
  mainCategoryId?: string;
  mainCategoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  scalingSupportType: string;
  currentBusinessStage: string;
  businessDescription?: string;
  currentBusinessLocation: string;
  targetExpansionLocation?: string;
  mainChallenge: string;
  supportRequired: string;
  customSupportRequired?: string;
  additionalDetails?: string;
  supportingDocuments?: ScalingSupportingDocument[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'MEETING_SCHEDULED' | 'MEETING_COMPLETED' | 'CANCELLED';
  meetingDetails?: ScalingMeetingDetails;
  meetingCompletedAt?: string;
  completionSummary?: string;
  activityTimeline?: {
    action: string;
    actorType: string;
    actorName?: string;
    notes?: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const ScalingPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // State
  const [scalingRequests, setScalingRequests] = useState<ScalingRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ScalingRequestItem | null>(null);

  // Submission Modal & Form State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string>('');

  // Form Fields
  const [scalingSupportType, setScalingSupportType] = useState<string>('Business Growth & Expansion Support');
  const [businessName, setBusinessName] = useState<string>('');
  const [currentBusinessStage, setCurrentBusinessStage] = useState<string>('Running Business');
  const [businessDescription, setBusinessDescription] = useState<string>('');
  const [currentBusinessLocation, setCurrentBusinessLocation] = useState<string>('');
  const [targetExpansionLocation, setTargetExpansionLocation] = useState<string>('');
  const [mainChallenge, setMainChallenge] = useState<string>('');
  const [supportRequired, setSupportRequired] = useState<string>('Business Expansion & New Branches');
  const [customSupportRequired, setCustomSupportRequired] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');

  // Document Upload State
  const [uploadedDocs, setUploadedDocs] = useState<ScalingSupportingDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  // Auto-populated Category & Subcategory from Member Profile
  const registeredCategory =
    user?.primaryCategoryName ||
    (user as any)?.categoryName ||
    'Business & Entrepreneurship';
  const registeredSubcategory =
    user?.subCategory ||
    (user as any)?.primarySubcategoryName ||
    'Business Owner';

  // Load member's scaling requests strictly from API
  const loadScalingRequests = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/scaling/me');
      if (res?.success && Array.isArray(res.data)) {
        setScalingRequests(res.data);
      } else {
        setScalingRequests([]);
      }
    } catch (err: any) {
      console.warn('Failed to load scaling requests:', err);
      setScalingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScalingRequests();
  }, [userId]);

  // Handle Document Upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Type (PDF, JPG, JPEG, PNG)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFormError('Only PDF, JPG, JPEG, and PNG formats are supported for document upload.');
      return;
    }

    // Validate File Size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds the 10MB maximum limit.');
      return;
    }

    setFormError('');
    setIsUploadingDoc(true);
    try {
      const uploadRes: any = await uploadDocumentFile(file, {
        documentCategory: 'SCALING_SUPPORT',
        documentLabel: 'Scaling Supporting Document'
      });

      if (uploadRes) {
        const docAsset = uploadRes.document || uploadRes;
        const newDoc: ScalingSupportingDocument = {
          name: docAsset.originalFileName || file.name,
          fileUrl: docAsset.viewUrl || docAsset.fileUrl || '',
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString()
        };
        setUploadedDocs([...uploadedDocs, newDoc]);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload supporting document.');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  // Remove Uploaded Document
  const handleRemoveDoc = (index: number) => {
    setUploadedDocs(uploadedDocs.filter((_, idx) => idx !== index));
  };

  // Submit Scaling Request Form
  const handleSubmitScaling = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Field Validations
    if (!scalingSupportType.trim()) {
      setFormError('Please select a Scaling Support Type.');
      return;
    }
    if (!businessName.trim()) {
      setFormError('Business Name is required.');
      return;
    }
    if (!currentBusinessLocation.trim()) {
      setFormError('Current Business Location is required.');
      return;
    }
    if (!mainChallenge.trim()) {
      setFormError('Please describe the main challenge facing your business.');
      return;
    }
    if (supportRequired === 'Other – Specify Your Requirement' && !customSupportRequired.trim()) {
      setFormError('Please specify your requirement in the custom requirement field.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        scalingSupportType,
        businessName: businessName.trim(),
        mainCategoryId: user?.primaryCategoryId || '',
        mainCategoryName: registeredCategory,
        subcategoryId: '',
        subcategoryName: registeredSubcategory,
        currentBusinessStage,
        businessDescription: businessDescription.trim(),
        currentBusinessLocation: currentBusinessLocation.trim(),
        targetExpansionLocation: targetExpansionLocation.trim(),
        mainChallenge: mainChallenge.trim(),
        supportRequired,
        customSupportRequired:
          supportRequired === 'Other – Specify Your Requirement'
            ? customSupportRequired.trim()
            : undefined,
        additionalDetails: additionalDetails.trim(),
        supportingDocuments: uploadedDocs
      };

      const res = await apiRequest('/scaling', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        setSubmitSuccessMsg(
          `Your scaling request for "${businessName}" has been successfully submitted! Request ID: ${res.data.requestId || res.data.refNumber}. FIC Admin will review your requirements and arrange a consultation.`
        );
        // Reset form
        setBusinessName('');
        setBusinessDescription('');
        setCurrentBusinessLocation('');
        setTargetExpansionLocation('');
        setMainChallenge('');
        setCustomSupportRequired('');
        setAdditionalDetails('');
        setUploadedDocs([]);
        loadScalingRequests();
      } else {
        setFormError(res?.error || 'Failed to submit scaling request. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while submitting your scaling request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requests
  const filteredRequests = scalingRequests.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.businessName?.toLowerCase().includes(q) ||
      item.requestId?.toLowerCase().includes(q) ||
      item.refNumber?.toLowerCase().includes(q) ||
      item.scalingSupportType?.toLowerCase().includes(q) ||
      item.currentBusinessLocation?.toLowerCase().includes(q)
    );
  });

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <WorkspaceBadge variant="pending">Submitted</WorkspaceBadge>;
      case 'UNDER_REVIEW':
        return <WorkspaceBadge variant="luxury">Under Review</WorkspaceBadge>;
      case 'MEETING_SCHEDULED':
        return <WorkspaceBadge variant="proposal">Meeting Scheduled</WorkspaceBadge>;
      case 'MEETING_COMPLETED':
        return <WorkspaceBadge variant="active">Meeting Completed</WorkspaceBadge>;
      case 'CANCELLED':
        return <WorkspaceBadge variant="neutral">Cancelled</WorkspaceBadge>;
      default:
        return <WorkspaceBadge variant="neutral">{status}</WorkspaceBadge>;
    }
  };

  return (
    <WorkspaceShell>
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        badge="ENTERPRISE SCALING & ADVISORY"
        title="Business Scaling & Growth Hub"
        subtitle="Accelerate your enterprise with bespoke scaling support from FIC sector coordinators. Submit your scaling requirements to arrange an exploratory strategic consultation."
        rightActions={
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceButton
              variant="primary"
              size="lg"
              icon={<PlusIcon size={16} />}
              onClick={() => {
                setFormError('');
                setSubmitSuccessMsg('');
                setIsSubmitModalOpen(true);
              }}
            >
              Submit Scaling Request
            </WorkspaceButton>
          </div>
        }
      />

      {/* ========================================================
          2. SEARCH & LISTING BAR
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search your scaling requests by business name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F] placeholder-[#5A4F47]/70 font-medium shadow-2xs"
            />
            <div className="absolute left-3 top-2.5 text-[#8064B1]">
              <SearchIcon size={17} />
            </div>
          </div>

          <div className="text-xs font-bold text-[#82776E] self-end sm:self-auto flex items-center gap-2">
            <span>Total Requests: {scalingRequests.length}</span>
            <button
              onClick={loadScalingRequests}
              className="p-1.5 rounded-lg border border-[#EDE2D7] bg-white hover:bg-[#FAF7F2] text-[#8064B1] transition-all cursor-pointer"
              title="Refresh Requests"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </WorkspaceCard>

      {/* ========================================================
          3. MY SCALING REQUESTS LISTING
         ======================================================== */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#82776E] bg-white rounded-2xl border border-[#EDE2D7]">
          Loading your scaling requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <WorkspaceEmptyState
          icon={<RocketIcon size={28} />}
          title={searchQuery ? 'No matching scaling requests found' : 'No Scaling Requests Submitted Yet'}
          description={
            searchQuery
              ? 'Try modifying your search keywords or clear the search input to see all requests.'
              : 'Submit a scaling request to connect with FIC coordinators for strategic growth, marketing expansion, funding preparation, and expert mentorship.'
          }
          actionText={searchQuery ? 'Clear Search' : 'Submit Scaling Request'}
          onAction={() => {
            if (searchQuery) {
              setSearchQuery('');
            } else {
              setFormError('');
              setSubmitSuccessMsg('');
              setIsSubmitModalOpen(true);
            }
          }}
          accent="violet"
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <motion.div
              key={req._id || req.requestId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl border border-[#EDE2D7] hover:border-[#8064B1]/40 shadow-xs p-5 transition-all space-y-4">
                {/* Header row: Request ID, Title, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE2D7]/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#8064B1] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      {req.requestId || req.refNumber}
                    </span>
                    <h3 className="text-base font-black text-[#51463F]">{req.businessName}</h3>
                  </div>
                  <div className="flex items-center gap-2">{renderStatusBadge(req.status)}</div>
                </div>

                {/* Body row: Key Attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EDE2D7]">
                  <div>
                    <span className="text-[#82776E] font-medium block">Scaling Support Type:</span>
                    <span className="font-bold text-[#51463F]">{req.scalingSupportType}</span>
                  </div>
                  <div>
                    <span className="text-[#82776E] font-medium block">Industry Sector:</span>
                    <span className="font-semibold text-[#51463F]">
                      {req.mainCategoryName} • {req.subcategoryName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#82776E] font-medium block">Stage & Location:</span>
                    <span className="font-semibold text-[#51463F]">
                      {req.currentBusinessStage} ({req.currentBusinessLocation})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#82776E] font-medium block">Submitted Date:</span>
                    <span className="font-semibold text-[#51463F]">
                      {new Date(req.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Challenge & Support details */}
                <div className="text-xs space-y-1.5">
                  <div>
                    <span className="font-bold text-[#51463F]">Core Business Challenge: </span>
                    <span className="text-[#5A4F47]">{req.mainChallenge}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#8064B1]">Required Support Area: </span>
                    <span className="text-[#51463F] font-semibold">{req.supportRequired}</span>
                    {req.customSupportRequired && (
                      <span className="text-[#82776E]"> — "{req.customSupportRequired}"</span>
                    )}
                  </div>
                </div>

                {/* Scheduled Meeting Box (Visible when MEETING_SCHEDULED or meeting details exist) */}
                {req.meetingDetails && req.meetingDetails.date && (
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#8064B1] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Calendar size={14} />
                        FIC Consultation Meeting Scheduled
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-200/70 text-[#6A4D9C]">
                        {req.meetingDetails.mode === 'IN_PERSON' ? 'In-Person Session' : 'Virtual Session'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-semibold text-[#51463F]">
                      <div>
                        <span className="text-[#82776E] font-normal">Date & Time: </span>
                        {req.meetingDetails.date} at {req.meetingDetails.time} (
                        {req.meetingDetails.durationMinutes || 45} mins)
                      </div>
                      <div>
                        <span className="text-[#82776E] font-normal">
                          {req.meetingDetails.mode === 'IN_PERSON' ? 'Venue Location: ' : 'Meeting Link: '}
                        </span>
                        {req.meetingDetails.mode === 'VIRTUAL' && req.meetingDetails.linkOrLocation ? (
                          <a
                            href={
                              req.meetingDetails.linkOrLocation.startsWith('http')
                                ? req.meetingDetails.linkOrLocation
                                : `https://${req.meetingDetails.linkOrLocation}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8064B1] underline hover:text-[#6A4D9C] inline-flex items-center gap-1"
                          >
                            Join Online Meeting &rarr;
                          </a>
                        ) : (
                          <span>{req.meetingDetails.linkOrLocation || 'Coordinated by FIC'}</span>
                        )}
                      </div>
                    </div>

                    {req.meetingDetails.notes && (
                      <div className="text-[11px] text-[#5A4F47] italic border-t border-purple-200/50 pt-1.5">
                        Note: "{req.meetingDetails.notes}"
                      </div>
                    )}
                  </div>
                )}

                {/* Meeting Completed Banner */}
                {req.status === 'MEETING_COMPLETED' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircleIcon size={15} className="text-emerald-600" />
                      Consultation Meeting Completed
                    </div>
                    {req.completionSummary && (
                      <p className="text-[11px] text-emerald-700 leading-relaxed">
                        Summary: {req.completionSummary}
                      </p>
                    )}
                    <p className="text-[10px] text-emerald-600 font-semibold pt-1">
                      The scaling request advisory cycle has concluded. If you require standalone funding support, you may independently submit an application in the Investment tab.
                    </p>
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EDE2D7]">
                  <span className="text-[11px] text-[#82776E] flex items-center gap-1">
                    <ShieldCheckIcon size={14} className="text-[#3B9C91]" />
                    FIC Confidential Scaling Advisory
                  </span>
                  <WorkspaceButton
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(req)}
                    icon={<ArrowRightIcon size={12} />}
                  >
                    View Request Details
                  </WorkspaceButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ========================================================
          4. SUBMIT SCALING REQUEST MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsSubmitModalOpen(false);
            setFormError('');
            setSubmitSuccessMsg('');
          }
        }}
        title="Submit Business Scaling Request"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {submitSuccessMsg ? (
            <div className="py-6 text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-14 h-14 rounded-2xl bg-purple-100 text-[#8064B1] border border-purple-300 flex items-center justify-center mx-auto shadow-sm"
              >
                <CheckCircleIcon size={28} />
              </motion.div>
              <h4 className="text-base font-black text-[#51463F]">Scaling Request Registered!</h4>
              <p className="text-xs text-[#5A4F47] leading-relaxed max-w-md mx-auto font-medium">
                {submitSuccessMsg}
              </p>
              <div className="pt-3">
                <WorkspaceButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    setSubmitSuccessMsg('');
                  }}
                >
                  Close & View Requests
                </WorkspaceButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitScaling} className="space-y-4">
              {/* Privacy Notice Banner */}
              <div className="p-3 bg-purple-50/70 border border-[#8064B1]/30 rounded-xl text-xs space-y-1">
                <div className="font-bold text-[#8064B1] flex items-center gap-1.5">
                  <ShieldCheckIcon size={14} />
                  Private FIC Intermediary Advisory:
                </div>
                <p className="text-[11px] text-[#5A4F47] leading-relaxed">
                  Your business scaling details are handled strictly under FIC Non-Disclosure Governance. This request will be reviewed by FIC Admin and will <strong>not</strong> be published to the public marketplace.
                </p>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircleIcon size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION A: SCALING SUPPORT TYPE (MANDATORY DROPDOWN) */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1.5">
                <label className="text-xs font-black text-[#51463F] block">
                  A. Select Primary Scaling Support Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={scalingSupportType}
                  onChange={(e) => setScalingSupportType(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#51463F] font-bold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                  required
                >
                  <option value="Business Growth & Expansion Support">
                    1. Business Growth & Expansion Support
                  </option>
                  <option value="Marketing & Customer Acquisition Support">
                    2. Marketing & Customer Acquisition Support
                  </option>
                  <option value="Funding Support">3. Funding Support</option>
                  <option value="Mentorship & Expert Guidance Support">
                    4. Mentorship & Expert Guidance Support
                  </option>
                </select>
              </div>

              {/* SECTION B: BUSINESS INFORMATION */}
              <div className="space-y-3.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#8064B1]">
                  B. Business Credentials & Parameters
                </div>

                {/* 1. Business Name */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#51463F] block">
                    1. Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter legal or commercial business name..."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                  />
                </div>

                {/* 2 & 3. Main Category and Subcategory (Auto-populated from registration, Read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#82776E] block">
                      2. Main Category <span className="text-[10px] text-[#8064B1]">(Auto-populated)</span>
                    </label>
                    <input
                      type="text"
                      value={registeredCategory}
                      readOnly
                      disabled
                      className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl bg-slate-100 text-[#51463F] font-semibold cursor-not-allowed select-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#82776E] block">
                      3. Subcategory <span className="text-[10px] text-[#8064B1]">(Auto-populated)</span>
                    </label>
                    <input
                      type="text"
                      value={registeredSubcategory}
                      readOnly
                      disabled
                      className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl bg-slate-100 text-[#51463F] font-semibold cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* 4. Current Business Stage */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#51463F] block">
                    4. Current Business Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentBusinessStage}
                    onChange={(e) => setCurrentBusinessStage(e.target.value)}
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#51463F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                    required
                  >
                    <option value="Startup">Startup</option>
                    <option value="Early Stage">Early Stage</option>
                    <option value="Running Business">Running Business</option>
                    <option value="Established Business">Established Business</option>
                    <option value="Expansion Stage">Expansion Stage</option>
                  </select>
                </div>

                {/* 5. Business Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#51463F] block">
                    5. Business Description & Overview
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly explain your business model, products, or core services..."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                  />
                </div>

                {/* 6 & 7. Current Location & Target Expansion Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#51463F] block">
                      6. Current Business Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Coimbatore, Tamil Nadu"
                      value={currentBusinessLocation}
                      onChange={(e) => setCurrentBusinessLocation(e.target.value)}
                      required
                      className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#51463F] block">
                      7. Target Expansion Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai, Bangalore, Pan-South India"
                      value={targetExpansionLocation}
                      onChange={(e) => setTargetExpansionLocation(e.target.value)}
                      className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                    />
                  </div>
                </div>

                {/* 8. Main Challenge */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#51463F] block">
                    8. Main Challenge Facing Your Business <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the current operational, market, financial, or technical hurdle..."
                    value={mainChallenge}
                    onChange={(e) => setMainChallenge(e.target.value)}
                    required
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                  />
                </div>

                {/* 9. Support Required (Dropdown) */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#51463F] block">
                    9. Support Required <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={supportRequired}
                    onChange={(e) => setSupportRequired(e.target.value)}
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#51463F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                    required
                  >
                    <option value="Business Expansion & New Branches">
                      Business Expansion & New Branches
                    </option>
                    <option value="Marketing & Customer Growth">Marketing & Customer Growth</option>
                    <option value="Technology & Automation">Technology & Automation</option>
                    <option value="Funding & Financial Planning">Funding & Financial Planning</option>
                    <option value="Partnerships & Distribution">Partnerships & Distribution</option>
                    <option value="Business Strategy & Mentorship">
                      Business Strategy & Mentorship
                    </option>
                    <option value="Other – Specify Your Requirement">
                      Other – Specify Your Requirement
                    </option>
                  </select>
                </div>

                {/* Dynamic Custom Requirement Field if "Other" */}
                {supportRequired === 'Other – Specify Your Requirement' && (
                  <div className="space-y-1 p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <label className="text-xs font-black text-[#8064B1] block">
                      Specify Your Custom Requirement <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Please clearly describe your specific requirement..."
                      value={customSupportRequired}
                      onChange={(e) => setCustomSupportRequired(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                    />
                  </div>
                )}

                {/* 10. Additional Details */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#51463F] block">
                    10. Additional Details <span className="text-[#82776E] text-[11px]">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any specific targets, timelines, or notes for the FIC review team..."
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F]"
                  />
                </div>

                {/* 11. Supporting Documents Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#51463F] block">
                    11. Supporting Documents <span className="text-[#82776E] text-[11px]">(PDF, JPG, PNG up to 10MB)</span>
                  </label>

                  {/* Document List */}
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {uploadedDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-[#51463F]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileTextIcon size={14} className="text-[#8064B1] shrink-0" />
                            <span className="truncate font-semibold">{doc.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(idx)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer shrink-0 ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-dashed border-[#8064B1] text-[#8064B1] hover:bg-purple-50 cursor-pointer transition-all">
                    <FileTextIcon size={14} />
                    <span>{isUploadingDoc ? 'Uploading Document...' : 'Upload Document'}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      disabled={isUploadingDoc}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-[#EDE2D7]">
                <WorkspaceButton
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </WorkspaceButton>
                <WorkspaceButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={isSubmitting}
                  icon={<RocketIcon size={14} />}
                >
                  Submit Scaling Request
                </WorkspaceButton>
              </div>
            </form>
          )}
        </div>
      </AnimatedModal>

      {/* ========================================================
          5. VIEW REQUEST DETAILS MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Scaling Request Specifications"
      >
        {selectedRequest && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
            {/* Header info */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#8064B1]">
                  {selectedRequest.requestId || selectedRequest.refNumber}
                </span>
                {renderStatusBadge(selectedRequest.status)}
              </div>
              <h3 className="text-base font-black text-[#51463F]">{selectedRequest.businessName}</h3>
              <div className="text-[#82776E] font-medium">
                Scaling Type: <strong className="text-[#51463F]">{selectedRequest.scalingSupportType}</strong>
              </div>
            </div>

            {/* Exact 4-Step Status Progress Tracker */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#EDE2D7] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#82776E] block">
                Workflow Progress
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div
                  className={`p-2 rounded-lg font-bold ${
                    ['SUBMITTED', 'UNDER_REVIEW', 'MEETING_SCHEDULED', 'MEETING_COMPLETED'].includes(
                      selectedRequest.status
                    )
                      ? 'bg-purple-100 text-[#8064B1] border border-purple-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  1. Submitted
                </div>
                <div
                  className={`p-2 rounded-lg font-bold ${
                    ['UNDER_REVIEW', 'MEETING_SCHEDULED', 'MEETING_COMPLETED'].includes(
                      selectedRequest.status
                    )
                      ? 'bg-purple-100 text-[#8064B1] border border-purple-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  2. Under Review
                </div>
                <div
                  className={`p-2 rounded-lg font-bold ${
                    ['MEETING_SCHEDULED', 'MEETING_COMPLETED'].includes(selectedRequest.status)
                      ? 'bg-purple-100 text-[#8064B1] border border-purple-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  3. Meeting Scheduled
                </div>
                <div
                  className={`p-2 rounded-lg font-bold ${
                    selectedRequest.status === 'MEETING_COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  4. Completed
                </div>
              </div>
            </div>

            {/* Scheduled Meeting Box */}
            {selectedRequest.meetingDetails && selectedRequest.meetingDetails.date && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#8064B1] flex items-center gap-1.5 text-xs">
                    <Calendar size={14} />
                    Consultation Details
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-[#6A4D9C]">
                    {selectedRequest.meetingDetails.mode === 'IN_PERSON' ? 'In-Person' : 'Virtual'}
                  </span>
                </div>
                <div className="space-y-1 font-semibold text-[#51463F]">
                  <div>
                    <span className="text-[#82776E] font-normal">Date & Time: </span>
                    {selectedRequest.meetingDetails.date} at {selectedRequest.meetingDetails.time} (
                    {selectedRequest.meetingDetails.durationMinutes || 45} mins)
                  </div>
                  <div>
                    <span className="text-[#82776E] font-normal">
                      {selectedRequest.meetingDetails.mode === 'IN_PERSON'
                        ? 'Meeting Location: '
                        : 'Google Meet Link: '}
                    </span>
                    {selectedRequest.meetingDetails.mode === 'VIRTUAL' &&
                    selectedRequest.meetingDetails.linkOrLocation ? (
                      <a
                        href={
                          selectedRequest.meetingDetails.linkOrLocation.startsWith('http')
                            ? selectedRequest.meetingDetails.linkOrLocation
                            : `https://${selectedRequest.meetingDetails.linkOrLocation}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8064B1] underline hover:text-[#6A4D9C]"
                      >
                        {selectedRequest.meetingDetails.linkOrLocation}
                      </a>
                    ) : (
                      <span>{selectedRequest.meetingDetails.linkOrLocation || 'Coordinated by FIC'}</span>
                    )}
                  </div>
                  {selectedRequest.meetingDetails.notes && (
                    <div className="text-[11px] text-[#5A4F47] italic pt-1">
                      Note: "{selectedRequest.meetingDetails.notes}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completed summary */}
            {selectedRequest.status === 'MEETING_COMPLETED' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-bold text-emerald-900">Consultation Finished</div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  {selectedRequest.completionSummary ||
                    'The advisory meeting has concluded and your scaling request is marked as completed.'}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1.5">
                <div>
                  <span className="text-[#82776E] font-medium block">Category & Subcategory:</span>
                  <span className="font-bold text-[#51463F]">
                    {selectedRequest.mainCategoryName} • {selectedRequest.subcategoryName}
                  </span>
                </div>
                <div>
                  <span className="text-[#82776E] font-medium block">Current Stage:</span>
                  <span className="font-bold text-[#51463F]">{selectedRequest.currentBusinessStage}</span>
                </div>
                <div>
                  <span className="text-[#82776E] font-medium block">Current & Expansion Locations:</span>
                  <span className="font-bold text-[#51463F]">
                    {selectedRequest.currentBusinessLocation}
                    {selectedRequest.targetExpansionLocation
                      ? ` → Target: ${selectedRequest.targetExpansionLocation}`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[#82776E] font-medium block">Main Challenge:</span>
                  <span className="font-medium text-[#51463F]">{selectedRequest.mainChallenge}</span>
                </div>
                <div>
                  <span className="text-[#82776E] font-medium block">Support Required:</span>
                  <span className="font-bold text-[#8064B1]">{selectedRequest.supportRequired}</span>
                  {selectedRequest.customSupportRequired && (
                    <div className="text-[#51463F] font-semibold mt-0.5">
                      "{selectedRequest.customSupportRequired}"
                    </div>
                  )}
                </div>
                {selectedRequest.businessDescription && (
                  <div>
                    <span className="text-[#82776E] font-medium block">Description:</span>
                    <span className="text-[#51463F]">{selectedRequest.businessDescription}</span>
                  </div>
                )}
                {selectedRequest.additionalDetails && (
                  <div>
                    <span className="text-[#82776E] font-medium block">Additional Details:</span>
                    <span className="text-[#51463F] italic">"{selectedRequest.additionalDetails}"</span>
                  </div>
                )}
              </div>

              {/* Supporting Documents */}
              {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[#82776E] font-bold block">Uploaded Documents:</span>
                  <div className="space-y-1">
                    {selectedRequest.supportingDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-200"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileTextIcon size={14} className="text-[#8064B1] shrink-0" />
                          <span className="font-semibold text-[#51463F] truncate">{doc.name}</span>
                        </div>
                        {doc.fileUrl && doc.fileUrl !== '#' && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#8064B1] hover:underline shrink-0 ml-2"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default ScalingPage;

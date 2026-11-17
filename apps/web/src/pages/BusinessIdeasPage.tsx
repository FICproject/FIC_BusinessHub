import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LightbulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClockIcon,
  FileTextIcon,
  AlertCircleIcon,
  PlusIcon,
  UploadIcon,
  EyeIcon,
  BriefcaseIcon,
  CalendarIcon
} from '../components/Icons';
import {
  apiRequest,
  getStoredUser,
  uploadDocumentFile
} from '../services/api';
import {
  BusinessIdeaStage,
  BusinessIdeaSupportOption,
  IBusinessIdea
} from '@fic/shared-types';

export const IDEA_STAGES: BusinessIdeaStage[] = [
  'Just an Idea',
  'Research & Planning',
  'Business Model Prepared',
  'Prototype / MVP Stage',
  'Already Started'
];

export const SUPPORT_OPTIONS: BusinessIdeaSupportOption[] = [
  'Business Idea Validation',
  'Business Plan & Strategy',
  'Mentorship & Expert Guidance',
  'Technical / Product Development',
  'Business Connections & Partnerships',
  'Market Research & Customer Connections',
  'Other – Specify Your Requirement'
];

export const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; variant: 'pending' | 'proposal' | 'active' | 'luxury' | 'urgent' | 'neutral' }
> = {
  SUBMITTED: { label: 'Submitted', variant: 'pending' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'pending' },
  INFORMATION_REQUESTED: { label: 'Info Required', variant: 'urgent' },
  APPROVED: { label: 'Approved by FIC', variant: 'active' },
  REJECTED: { label: 'Rejected', variant: 'urgent' },
  SHARED_ON_MARKETPLACE: { label: 'Live on Marketplace', variant: 'proposal' },
  INTEREST_RECEIVED: { label: 'Interest Received', variant: 'luxury' },
  MEMBER_SELECTION_PENDING: { label: 'Admin Selection', variant: 'luxury' },
  MATCHED: { label: 'Collaborator Matched', variant: 'active' },
  CLOSED: { label: 'Closed', variant: 'neutral' }
};

export const BusinessIdeasPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'my_ideas' | 'my_interests'>('my_ideas');

  // Ideas state
  const [ideasList, setIdeasList] = useState<IBusinessIdea[]>([]);
  const [myInterests, setMyInterests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedIdea, setSelectedIdea] = useState<IBusinessIdea | null>(null);

  // Submission Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [targetMarket, setTargetMarket] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [developmentStage, setDevelopmentStage] = useState<BusinessIdeaStage>('Just an Idea');
  const [selectedSupports, setSelectedSupports] = useState<BusinessIdeaSupportOption[]>([]);
  const [customSupportRequirement, setCustomSupportRequirement] = useState<string>('');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [additionalMessage, setAdditionalMessage] = useState<string>('');
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; fileUrl: string; fileType?: string; fileSize?: number; uploadedAt: string }[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string>('');

  // Clarification response state
  const [additionalInfoInput, setAdditionalInfoInput] = useState<string>('');
  const [isSubmittingInfo, setIsSubmittingInfo] = useState<boolean>(false);

  // Auto-populated categories from user profile
  const registeredCategory =
    user?.primaryCategoryName ||
    user?.primaryCategory ||
    'Business & Entrepreneurship';
  const registeredSubcategory =
    user?.subCategory ||
    user?.primarySubcategoryName ||
    (user?.subcategories && user?.subcategories[0]) ||
    'Entrepreneur';

  // Load member's business ideas
  const loadIdeas = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/business-ideas/me');
      if (res && res.success && Array.isArray(res.data)) {
        setIdeasList(res.data);
      }
    } catch (err) {
      console.error('Failed to load business ideas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load member's collaboration interests
  const loadInterests = async () => {
    try {
      const res = await apiRequest('/marketplace/my-interests');
      if (res && res.success && Array.isArray(res.data)) {
        setMyInterests(res.data);
      }
    } catch (_err) {
      setMyInterests([]);
    }
  };

  useEffect(() => {
    loadIdeas();
    loadInterests();
  }, []);

  // Handle support options checkbox toggle
  const toggleSupportOption = (opt: BusinessIdeaSupportOption) => {
    if (selectedSupports.includes(opt)) {
      setSelectedSupports(selectedSupports.filter((s) => s !== opt));
    } else {
      setSelectedSupports([...selectedSupports, opt]);
    }
  };

  // Handle Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setFormError(`File size exceeds 6 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a file up to 6 MB.`);
      e.target.value = '';
      return;
    }

    setFormError('');
    setIsUploadingDoc(true);
    try {
      const uploadRes = await uploadDocumentFile(file, {
        documentCategory: 'BUSINESS_IDEA',
        documentLabel: 'Idea Supporting Document',
        maxBytes: 6 * 1024 * 1024
      });

      if (uploadRes) {
        const docAsset = (uploadRes as any).document || uploadRes;
        const newDoc = {
          name: docAsset.originalFileName || file.name,
          fileUrl: docAsset.viewUrl || docAsset.fileUrl || '',
          fileType: file.type || docAsset.originalFileExtension || 'Document',
          fileSize: file.size,
          uploadedAt: new Date().toISOString()
        };
        setUploadedDocs([...uploadedDocs, newDoc]);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload document. Maximum file size is 6 MB.');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  // Handle Idea Submission
  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter the Business Idea Title.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please enter a description of your business idea and the problem it solves.');
      return;
    }

    if (!supportDescription.trim()) {
      setFormError('Please enter what support you need from FIC.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/business-ideas', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetMarket: targetMarket.trim(),
          targetLocation: targetLocation.trim(),
          developmentStage,
          supportRequirements: [supportDescription.trim()],
          customSupportRequirement: supportDescription.trim(),
          additionalMessage: additionalMessage.trim(),
          supportingDocuments: uploadedDocs
        })
      });

      if (res && res.success) {
        setSubmitSuccessMsg(
          res.message ||
            'Your business idea has been successfully submitted. FIC will review your idea and notify you about the next steps.'
        );
        // Reset form
        setTitle('');
        setDescription('');
        setTargetMarket('');
        setTargetLocation('');
        setDevelopmentStage('Just an Idea');
        setSelectedSupports([]);
        setCustomSupportRequirement('');
        setSupportDescription('');
        setAdditionalMessage('');
        setUploadedDocs([]);

        await loadIdeas();
        setTimeout(() => {
          setIsSubmitModalOpen(false);
          setSubmitSuccessMsg('');
        }, 3500);
      } else {
        setFormError(res?.error || 'Failed to submit business idea.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Funding Response (Yes/No)
  const handleFundingResponse = async (idea: IBusinessIdea, needFunding: boolean) => {
    if (needFunding) {
      // Redirect to Funding Request page with pre-filled fields & idea reference
      navigate(
        `/investment?tab=seek&action=from-idea&ideaId=${encodeURIComponent(
          idea.ideaRequestId || idea._id
        )}&title=${encodeURIComponent(idea.title)}&category=${encodeURIComponent(
          idea.mainCategoryName
        )}&description=${encodeURIComponent(idea.description)}&location=${encodeURIComponent(
          idea.targetLocation || ''
        )}`
      );
      return;
    }

    try {
      const res = await apiRequest(`/business-ideas/${idea.ideaRequestId || idea._id}/funding-response`, {
        method: 'POST',
        body: JSON.stringify({ fundingRequired: false })
      });

      if (res && res.success) {
        setSelectedIdea(res.data);
        await loadIdeas();
      }
    } catch (err) {
      console.error('Failed to save funding response:', err);
    }
  };

  // Handle Submitting Additional Info Requested by Admin
  const handleSubmitAdditionalInfo = async (ideaId: string) => {
    if (!additionalInfoInput.trim()) return;

    setIsSubmittingInfo(true);
    try {
      const res = await apiRequest(`/business-ideas/${ideaId}/additional-info`, {
        method: 'PUT',
        body: JSON.stringify({ additionalInfo: additionalInfoInput.trim() })
      });

      if (res && res.success) {
        setSelectedIdea(res.data);
        setAdditionalInfoInput('');
        await loadIdeas();
      }
    } catch (err) {
      console.error('Failed to submit additional info:', err);
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  // Filtered ideas list
  const filteredIdeas = ideasList.filter((idea) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (idea.title && idea.title.toLowerCase().includes(q)) ||
      (idea.ideaRequestId && idea.ideaRequestId.toLowerCase().includes(q)) ||
      (idea.mainCategoryName && idea.mainCategoryName.toLowerCase().includes(q)) ||
      (idea.targetLocation && idea.targetLocation.toLowerCase().includes(q))
    );
  });

  return (
    <WorkspaceShell>
      {/* Hero Section */}
      <WorkspaceHero
        accent="violet"
        badge="INNOVATION & NETWORK COLLABORATION"
        title="Business Ideas & Innovation Hub"
        subtitle="Share your business idea with FIC, get it reviewed, and connect with interested members across our business network."
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
              Submit a Business Idea
            </WorkspaceButton>
            <WorkspaceButton
              variant="outline"
              size="lg"
              icon={<BriefcaseIcon size={16} />}
              onClick={() => navigate('/marketplace?tab=ideas')}
            >
              Explore Idea Requests
            </WorkspaceButton>
          </div>
        }
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE2D7] pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('my_ideas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'my_ideas'
                  ? 'bg-gradient-to-r from-[#8064B1] to-[#6E529F] text-white shadow-xs'
                  : 'bg-white text-[#82776E] border border-[#EDE2D7] hover:bg-[#FAF7F2]'
              }`}
            >
              My Business Ideas ({ideasList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my_interests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'my_interests'
                  ? 'bg-gradient-to-r from-[#8064B1] to-[#6E529F] text-white shadow-xs'
                  : 'bg-white text-[#82776E] border border-[#EDE2D7] hover:bg-[#FAF7F2]'
              }`}
            >
              My Collaboration Offers ({myInterests.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <SearchIcon size={15} className="absolute left-3 top-3 text-[#82776E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, ID, category..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40"
            />
          </div>
        </div>

        {/* ========================================================
            TAB 1: MY BUSINESS IDEAS
           ======================================================== */}
        {activeTab === 'my_ideas' && (
          <div>
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[#82776E]">
                Loading your business ideas...
              </div>
            ) : filteredIdeas.length === 0 ? (
              <WorkspaceEmptyState
                icon={<LightbulbIcon size={32} className="text-[#8064B1]" />}
                title={searchQuery ? 'No matching business ideas' : 'No Business Ideas Submitted Yet'}
                description={
                  searchQuery
                    ? `No ideas match "${searchQuery}". Clear your search query to see all ideas.`
                    : 'Submit your innovative concept to get expert incubation feedback and collaborative member matching from FIC.'
                }
                actionText="Submit Your First Idea"
                onAction={() => {
                  setFormError('');
                  setSubmitSuccessMsg('');
                  setIsSubmitModalOpen(true);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredIdeas.map((idea) => {
                  const statusConf = STATUS_BADGE_CONFIG[idea.status || idea.adminReviewStatus] || {
                    label: idea.status || 'Submitted',
                    variant: 'pending' as const
                  };

                  return (
                    <motion.div
                      key={idea._id}
                      whileHover={{ y: -3, transition: { duration: 0.15 } }}
                      className="bg-white rounded-2xl border border-[#EDE2D7] p-5 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      {/* Card Header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#8064B1]/10 text-[#8064B1] border border-[#8064B1]/20">
                            {idea.ideaRequestId || idea.refNumber}
                          </span>
                          <span className="text-[11px] text-[#82776E]">
                            {new Date(idea.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-[#51463F] line-clamp-1">
                          {idea.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <WorkspaceBadge variant={statusConf.variant}>
                            {statusConf.label}
                          </WorkspaceBadge>
                          {idea.marketplacePublished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircleIcon size={11} /> Live on Marketplace
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                              Private Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Idea Specs */}
                      <div className="space-y-2 text-xs">
                        <p className="text-[#82776E] line-clamp-2 leading-relaxed">
                          {idea.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE2D7]/70">
                            <span className="text-[10px] text-[#82776E] uppercase font-bold block">Category</span>
                            <span className="font-bold text-[#51463F] truncate block">
                              {idea.mainCategoryName}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE2D7]/70">
                            <span className="text-[10px] text-[#82776E] uppercase font-bold block">Stage</span>
                            <span className="font-bold text-[#51463F] truncate block">
                              {idea.developmentStage || 'Just an Idea'}
                            </span>
                          </div>
                        </div>

                        {/* Interested Members Pill */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4EEFB] border border-[#8064B1]/30">
                          <span className="text-[11px] font-bold text-[#8064B1]">Interested Network Members</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#8064B1] text-white">
                            {idea.interestedMembersCount || 0}
                          </span>
                        </div>

                        {/* Latest Update from FIC */}
                        {(idea as any).latestFicUpdate && (
                          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-[11.5px] text-[#51463F]">
                            <strong className="text-[#8064B1] block text-[10px] uppercase font-bold mb-0.5">
                              Latest FIC Update:
                            </strong>
                            <span className="line-clamp-2 leading-relaxed">{(idea as any).latestFicUpdate}</span>
                          </div>
                        )}

                        {/* Consultation Meeting Scheduled Banner */}
                        {(idea as any).meetingDetails?.date && (
                          <div className="p-2.5 rounded-xl bg-purple-50/80 border border-[#8064B1]/30 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-[#8064B1] flex items-center gap-1.5 uppercase tracking-wider text-[10.5px]">
                                <CalendarIcon size={12} />
                                {(idea as any).meetingDetails.isCompleted ? 'FIC Consultation Completed' : 'FIC Consultation Meeting Scheduled'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-200/70 text-[#6A4D9C]">
                                {(idea as any).meetingDetails.mode === 'IN_PERSON' ? 'In-Person Session' : 'Virtual Session'}
                              </span>
                            </div>
                            <div className="text-[11px] font-medium text-[#51463F]">
                              {(idea as any).meetingDetails.date} at {(idea as any).meetingDetails.time} ({(idea as any).meetingDetails.durationMinutes || 45} mins)
                            </div>
                            {!(idea as any).meetingDetails.isCompleted && (idea as any).meetingDetails.linkOrLocation && (
                              <a
                                href={(idea as any).meetingDetails.linkOrLocation}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-[#8064B1] hover:underline inline-block mt-0.5"
                              >
                                Join Online Meeting &rarr;
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-[#EDE2D7] flex items-center justify-between">
                        <span className="text-[11px] text-[#82776E] font-medium">
                          {idea.fundingRequired === true
                            ? 'Funding: Required'
                            : idea.fundingRequired === false
                            ? 'Funding: Not Required'
                            : 'Funding: Pending'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedIdea(idea)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8064B1] to-[#6E529F] hover:from-[#6E529F] hover:to-[#5E448D] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>View Details</span>
                          <ArrowRightIcon size={12} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: MY COLLABORATION OFFERS
           ======================================================== */}
        {activeTab === 'my_interests' && (
          <div>
            {myInterests.length === 0 ? (
              <WorkspaceEmptyState
                icon={<BriefcaseIcon size={32} className="text-[#8064B1]" />}
                title="No Collaboration Offers Yet"
                description="Browse active business ideas shared by verified entrepreneurs on the Universal Marketplace and express your interest to collaborate."
                actionText="Explore Marketplace Ideas"
                onAction={() => navigate('/marketplace?tab=ideas')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myInterests.map((interest) => (
                  <div
                    key={interest._id}
                    className="bg-white rounded-2xl border border-[#EDE2D7] p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#8064B1]/10 text-[#8064B1]">
                        {interest.ideaRequestId}
                      </span>
                      <span className="text-[11px] text-[#82776E]">
                        {new Date(interest.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <h4 className="font-bold text-[#51463F] text-sm">
                      {interest.ideaTitle || 'Business Collaboration'}
                    </h4>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-xs space-y-1">
                      <div className="text-[10.5px] uppercase font-bold text-[#82776E]">Your Offered Contribution:</div>
                      <div className="font-bold text-[#8064B1]">{interest.contributionType}</div>
                      <p className="text-[#51463F] text-[11px] mt-1 line-clamp-2">{interest.interestReason}</p>
                    </div>

                    {/* Collaboration Meeting Scheduled Banner */}
                    {interest.meetingDetails?.date && (
                      <div className="p-2.5 rounded-xl bg-purple-50/80 border border-[#8064B1]/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[#8064B1] flex items-center gap-1.5 uppercase tracking-wider text-[10.5px]">
                            <CalendarIcon size={12} />
                            Intro Meeting Scheduled
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-200/70 text-[#6A4D9C]">
                            {interest.meetingDetails.mode === 'IN_PERSON' ? 'In-Person' : 'Virtual'}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-[#51463F]">
                          {interest.meetingDetails.date} at {interest.meetingDetails.time} ({interest.meetingDetails.durationMinutes || 45} mins)
                        </div>
                        {interest.meetingDetails.linkOrLocation && (
                          <a
                            href={interest.meetingDetails.linkOrLocation}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-[#8064B1] hover:underline inline-block mt-0.5"
                          >
                            Join Online Meeting &rarr;
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#82776E] uppercase font-bold">Admin Review:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          interest.reviewStatus === 'SELECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : interest.reviewStatus === 'SHORTLISTED'
                            ? 'bg-sky-100 text-sky-800'
                            : interest.reviewStatus === 'NOT_SELECTED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {interest.reviewStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: SUBMIT A BUSINESS IDEA
         ======================================================== */}
      <AnimatedModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit a Business Idea"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitIdea} className="space-y-4 text-xs sm:text-sm">
          {submitSuccessMsg ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
              <CheckCircleIcon size={28} className="mx-auto text-emerald-600" />
              <h4 className="font-black text-sm">Idea Submitted Successfully!</h4>
              <p className="text-xs leading-relaxed">{submitSuccessMsg}</p>
            </div>
          ) : (
            <>
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircleIcon size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Title */}
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Business Idea Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Cold Chain Logistics Platform"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40"
                />
              </div>

              {/* 2 & 3: Auto-populated Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#82776E] mb-1">
                    Main Category (Auto-populated)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={registeredCategory}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE2D7] rounded-xl text-[#82776E] font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#82776E] mb-1">
                    Subcategory (Auto-populated)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={registeredSubcategory}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE2D7] rounded-xl text-[#82776E] font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 4. Description */}
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Business Idea Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain your idea, the core problem it solves, market need, and how the business model functions..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40"
                />
              </div>

              {/* 5 & 6: Target Market & Target Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#51463F] mb-1">
                    Target Customers / Market
                  </label>
                  <input
                    type="text"
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    placeholder="e.g. Tier-2 Hospital Networks, Dairy Farmers"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#51463F] mb-1">
                    Target Location
                  </label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. Tamil Nadu, Pan-India, Bangalore"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40"
                  />
                </div>
              </div>

              {/* 7. Current Idea Stage */}
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Current Idea Stage *
                </label>
                <select
                  value={developmentStage}
                  onChange={(e) => setDevelopmentStage(e.target.value as BusinessIdeaStage)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40"
                >
                  {IDEA_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Support Needed from FIC */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#51463F]">
                  What support do you need from FIC? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={supportDescription}
                  onChange={(e) => setSupportDescription(e.target.value)}
                  placeholder="Describe the exact support, mentoring, technical validation, funding, or business connections you require from FIC..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40 text-xs sm:text-sm"
                />

                {/* Additional Message */}
                <div className="pt-1">
                  <label className="block text-xs font-black text-[#82776E] mb-1">
                    Additional Message
                  </label>
                  <textarea
                    rows={2}
                    value={additionalMessage}
                    onChange={(e) => setAdditionalMessage(e.target.value)}
                    placeholder="Any specific questions, partner preferences, or expectations from FIC..."
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/40 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* 9. Supporting Documents */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#51463F]">
                  Supporting Documents (Optional — Pitch deck, executive summary, product diagram)
                </label>
                <div className="p-3 border-2 border-dashed border-[#EDE2D7] rounded-xl bg-[#FAF7F2] flex flex-col items-center justify-center gap-1.5 text-center">
                  <UploadIcon size={20} className="text-[#8064B1]" />
                  <label className="text-xs font-bold text-[#8064B1] hover:underline cursor-pointer">
                    <span>{isUploadingDoc ? 'Uploading & Optimizing...' : 'Click to Upload Document'}</span>
                    <input
                      type="file"
                      disabled={isUploadingDoc}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                    />
                  </label>
                  <span className="text-[10.5px] text-[#82776E]">
                    PDF, PPT, DOC, PNG &bull; Maximum upload size: 6 MB per file
                  </span>
                </div>

                {uploadedDocs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {uploadedDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EDE2D7] text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileTextIcon size={14} className="text-[#8064B1] shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-[#51463F] truncate block">{doc.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-[#82776E]">
                              {doc.fileSize && (
                                <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                              )}
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                ✓ Uploaded
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedDocs(uploadedDocs.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EDE2D7]">
                <WorkspaceButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Cancel
                </WorkspaceButton>
                <WorkspaceButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || isUploadingDoc}
                >
                  {isSubmitting ? 'Submitting Idea...' : 'Submit Business Idea'}
                </WorkspaceButton>
              </div>
            </>
          )}
        </form>
      </AnimatedModal>

      {/* ========================================================
          MODAL: VIEW DETAILS & 8-STAGE TIMELINE
         ======================================================== */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#EDE2D7] overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EDE2D7] bg-gradient-to-r from-[#FAF7F2] to-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#8064B1]/10 text-[#8064B1] border border-[#8064B1]/20">
                    {selectedIdea.ideaRequestId || selectedIdea.refNumber}
                  </span>
                  <span className="text-xs text-[#82776E]">
                    Submitted {new Date(selectedIdea.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#51463F] mt-1.5">
                  {selectedIdea.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIdea(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE2D7] flex items-center justify-center text-[#82776E] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Rejection Banner & Feedback (Phase 8) */}
              {(selectedIdea.status === 'REJECTED' || selectedIdea.adminReviewStatus === 'REJECTED') && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                    <AlertCircleIcon size={14} className="text-rose-700" />
                    Business Idea Status: Rejected
                  </div>
                  {selectedIdea.rejectionReason ? (
                    <p className="text-xs text-rose-900 leading-relaxed font-medium">
                      Feedback from FIC Admin: "{selectedIdea.rejectionReason}"
                    </p>
                  ) : (
                    <p className="text-xs text-rose-900 leading-relaxed font-medium">
                      This business idea was reviewed by FIC Admin and not approved for marketplace sharing at this time.
                    </p>
                  )}
                </div>
              )}
              {/* 8-Stage Dynamic Timeline */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#F4EEFB]/50 border border-[#8064B1]/20 space-y-3">
                <span className="text-[11px] font-bold text-[#8064B1] uppercase tracking-wider block">
                  Workflow Lifecycle & Progress Timeline
                </span>

                {/* Calculate Dynamic Active Stages */}
                {(() => {
                  const s = selectedIdea.status || selectedIdea.adminReviewStatus;
                  const isSubmittedDone = true;
                  const isFicReviewDone = s !== 'SUBMITTED';
                  const isApprovedDone = ['APPROVED', 'SHARED_ON_MARKETPLACE', 'INTEREST_RECEIVED', 'MEMBER_SELECTION_PENDING', 'MATCHED'].includes(s);
                  const isMarketplaceDone = selectedIdea.marketplacePublished || ['SHARED_ON_MARKETPLACE', 'INTEREST_RECEIVED', 'MEMBER_SELECTION_PENDING', 'MATCHED'].includes(s);
                  const isInterestReceivedDone = (selectedIdea.interestedMembersCount || 0) > 0 || ['INTEREST_RECEIVED', 'MEMBER_SELECTION_PENDING', 'MATCHED'].includes(s);
                  const isMemberSelectionDone = ['MEMBER_SELECTION_PENDING', 'MATCHED'].includes(s) || selectedIdea.collaborationStatus === 'COLLABORATORS_SELECTED';
                  const isUpdateSentDone = Boolean(selectedIdea.adminFeedbackToSubmitter) || s === 'MATCHED';
                  const isFundingDone = selectedIdea.fundingAsked || selectedIdea.fundingRequired !== null || Boolean(selectedIdea.fundingRequestId);

                  const stages = [
                    { num: 1, label: 'Idea Submitted', done: isSubmittedDone },
                    { num: 2, label: 'FIC Review', done: isFicReviewDone },
                    { num: 3, label: 'Idea Approved', done: isApprovedDone },
                    { num: 4, label: 'Shared on Marketplace', done: isMarketplaceDone },
                    { num: 5, label: 'Interested Members Received', done: isInterestReceivedDone },
                    { num: 6, label: 'FIC Member Selection', done: isMemberSelectionDone },
                    { num: 7, label: 'Update Sent to Submitter', done: isUpdateSentDone },
                    {
                      num: 8,
                      label: selectedIdea.fundingRequestId
                        ? 'Funding Request Linked'
                        : selectedIdea.fundingRequired === true
                        ? 'Funding Required'
                        : selectedIdea.fundingRequired === false
                        ? 'Funding Not Required'
                        : 'Funding Assessment',
                      done: isFundingDone
                    }
                  ];

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {stages.map((stg) => (
                        <div
                          key={stg.num}
                          className={`p-2 rounded-xl border flex items-center gap-2 ${
                            stg.done
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white/70 border-slate-200 text-slate-400 font-normal'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              stg.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {stg.done ? '✓' : stg.num}
                          </div>
                          <span className="text-[11px] leading-tight">{stg.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Official Update from FIC Admin (if present) */}
              {selectedIdea.adminFeedbackToSubmitter && (
                <div className="p-4 rounded-xl bg-[#F4EEFB] border border-[#8064B1]/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#8064B1] text-xs">
                    <ShieldCheckIcon size={14} className="text-[#8064B1]" />
                    Official FIC Coordination Update:
                  </div>
                  <p className="text-xs text-[#51463F] leading-relaxed whitespace-pre-line font-medium">
                    {selectedIdea.adminFeedbackToSubmitter}
                  </p>
                </div>
              )}

              {/* Information Request Responder (if action required) */}
              {selectedIdea.status === 'INFORMATION_REQUESTED' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                    <AlertCircleIcon size={14} className="text-amber-700" />
                    Additional Information Requested by Admin:
                  </div>
                  <p className="text-xs text-amber-950">
                    {selectedIdea.informationRequestNotes || 'Please provide further clarification.'}
                  </p>
                  <div className="pt-1 space-y-2">
                    <textarea
                      rows={2}
                      value={additionalInfoInput}
                      onChange={(e) => setAdditionalInfoInput(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#51463F] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isSubmittingInfo || !additionalInfoInput.trim()}
                      onClick={() => handleSubmitAdditionalInfo(selectedIdea.ideaRequestId || selectedIdea._id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                    >
                      {isSubmittingInfo ? 'Sending...' : 'Send Clarification to FIC'}
                    </button>
                  </div>
                </div>
              )}

              {/* Consultation Meeting Scheduled Banner */}
              {(selectedIdea as any).meetingDetails?.date && (
                <div className="p-4 rounded-xl bg-purple-50/80 border border-[#8064B1]/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#8064B1] flex items-center gap-1.5 uppercase tracking-wider text-xs">
                      <CalendarIcon size={14} />
                      {(selectedIdea as any).meetingDetails.isCompleted ? 'FIC Consultation Completed' : 'FIC Consultation Meeting Scheduled'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-200/70 text-[#6A4D9C]">
                      {(selectedIdea as any).meetingDetails.mode === 'IN_PERSON' ? 'In-Person Session' : 'Virtual Session'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-[#51463F]">
                    <div>
                      <span className="text-[#82776E] font-normal">Date & Time: </span>
                      {(selectedIdea as any).meetingDetails.date} at {(selectedIdea as any).meetingDetails.time} ({(selectedIdea as any).meetingDetails.durationMinutes || 45} mins)
                    </div>
                    {!(selectedIdea as any).meetingDetails.isCompleted && (selectedIdea as any).meetingDetails.linkOrLocation && (
                      <div>
                        <span className="text-[#82776E] font-normal">Meeting Access: </span>
                        <a
                          href={(selectedIdea as any).meetingDetails.linkOrLocation}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8064B1] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Join Online Meeting &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                  {(selectedIdea as any).meetingDetails.notes && (
                    <p className="text-[11.5px] text-[#51463F] bg-white/80 p-2.5 rounded-lg border border-[#8064B1]/20">
                      <strong>FIC Notes: </strong>
                      {(selectedIdea as any).meetingDetails.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Idea Specifications */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-2.5">
                <span className="text-[11px] font-bold text-[#8064B1] uppercase tracking-wider block">
                  Idea Specifications
                </span>
                <p className="text-xs text-[#51463F] leading-relaxed whitespace-pre-line">
                  {selectedIdea.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#EDE2D7]">
                    <span className="text-[10px] text-[#82776E] uppercase font-bold block">Target Market</span>
                    <span className="font-bold text-[#51463F] block truncate">{selectedIdea.targetMarket || 'All'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#EDE2D7]">
                    <span className="text-[10px] text-[#82776E] uppercase font-bold block">Location</span>
                    <span className="font-bold text-[#51463F] block truncate">{selectedIdea.targetLocation || 'India'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#EDE2D7]">
                    <span className="text-[10px] text-[#82776E] uppercase font-bold block">Current Stage</span>
                    <span className="font-bold text-[#51463F] block truncate">{selectedIdea.developmentStage || 'Idea'}</span>
                  </div>
                </div>

                {/* Requested Supports */}
                {selectedIdea.supportRequirements && selectedIdea.supportRequirements.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10.5px] uppercase font-bold text-[#82776E] block mb-1">
                      Requested Support from FIC:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIdea.supportRequirements.map((s, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#8064B1] border border-[#8064B1]/30 shadow-2xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIdea.customSupportRequirement && (
                  <div className="pt-1 text-xs">
                    <span className="text-[10.5px] font-bold text-[#82776E]">Custom Support Note:</span>
                    <p className="text-[#51463F] mt-0.5">{selectedIdea.customSupportRequirement}</p>
                  </div>
                )}
              </div>

              {/* Section 8: Funding Support Prompt */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#FAF8FD] border border-[#8064B1]/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#8064B1]/15 text-[#8064B1] flex items-center justify-center font-bold text-sm">
                    ₹
                  </div>
                  <div>
                    <h4 className="font-black text-[#51463F] text-xs sm:text-sm">
                      Do you also need funding support for this business idea?
                    </h4>
                    <p className="text-[11.5px] text-[#82776E] mt-0.5">
                      If your business idea requires financial support, you can submit a separate funding request through FIC.
                    </p>
                  </div>
                </div>

                {selectedIdea.fundingRequestId ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between gap-2">
                    <span className="text-emerald-800 font-bold">
                      Linked Funding Request: {selectedIdea.fundingRequestRef || selectedIdea.fundingRequestId}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/investment?tab=history')}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                    >
                      Track Funding Request &rarr;
                    </button>
                  </div>
                ) : selectedIdea.fundingRequired === false ? (
                  <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#EDE2D7] text-xs flex items-center justify-between">
                    <span className="text-[#82776E] font-medium">
                      You confirmed funding is not currently required for this idea.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFundingResponse(selectedIdea, true)}
                      className="text-[#8064B1] font-bold hover:underline cursor-pointer"
                    >
                      Change to Need Funding
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFundingResponse(selectedIdea, true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-xs cursor-pointer"
                    >
                      Yes, I Need Funding
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFundingResponse(selectedIdea, false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#51463F] bg-white border border-[#EDE2D7] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      No, Not Required
                    </button>
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              {selectedIdea.activityTimeline && selectedIdea.activityTimeline.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-[#82776E] uppercase tracking-wider block">
                    Coordination History
                  </span>
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EDE2D7]">
                    {selectedIdea.activityTimeline.map((item, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#8064B1] border-2 border-white shadow-2xs" />
                        <div className="flex items-center justify-between text-[#82776E] text-[10.5px]">
                          <span className="font-bold text-[#51463F]">{item.action}</span>
                          <span>{new Date(item.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[#51463F]/90 mt-0.5 leading-relaxed bg-[#FAF7F2] p-2 rounded-lg border border-[#EDE2D7]/60">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EDE2D7] bg-[#FAF7F2] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedIdea(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#51463F] bg-white border border-[#EDE2D7] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </WorkspaceShell>
  );
};

export default BusinessIdeasPage;

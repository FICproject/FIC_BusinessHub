import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CATEGORIES_DATA } from '../services/mockData';
import {
  getStoredUser,
  getMemberServices,
  createMemberService,
  updateMemberService,
  submitServiceForApproval,
  simulateAdminApproveService,
  simulateAdminRejectService,
  deleteMemberService,
  ServiceListing
} from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceKpi,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import {
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ArrowRightIcon,
  LockIcon,
  FileTextIcon,
  SparklesIcon
} from '../components/Icons';
import { motionSprings, staggerContainer, staggerItem, AnimatedCounter, AnimatedModal } from '../motion';

export const MyServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [services, setServices] = useState<ServiceListing[]>([]);
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'APPROVED' | 'PENDING_APPROVAL' | 'DRAFT' | 'REJECTED'
  >('ALL');

  // Modal State for Add / Edit Service
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(user?.primaryCategoryId || 'cat-1');
  const [categoryName, setCategoryName] = useState(user?.categoryName || 'Business & Entrepreneurship');
  const [categorySlug, setCategorySlug] = useState('business-entrepreneurship');
  const [subcategoryName, setSubcategoryName] = useState(user?.subCategory || '');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [servicesOfferedInput, setServicesOfferedInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [targetCustomersInput, setTargetCustomersInput] = useState('');
  const [coverageArea, setCoverageArea] = useState('Pan India');
  const [deliveryMode, setDeliveryMode] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('ONLINE');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [supportingDocument, setSupportingDocument] = useState('');
  const [confirmGovernance, setConfirmGovernance] = useState(false);

  // Simulation Rejection Modal State
  const [rejectingServiceId, setRejectingServiceId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(
    null
  );

  const loadUserServices = () => {
    if (!user) return;
    const list = getMemberServices(user.id || user.userId);
    setServices(list);
  };

  useEffect(() => {
    loadUserServices();
  }, [user?.id, user?.userId]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // KPI Calculations
  const totalCount = services.length;
  const approvedCount = services.filter((s) => s.status === 'APPROVED').length;
  const pendingCount = services.filter((s) => s.status === 'PENDING_APPROVAL').length;
  const draftCount = services.filter((s) => s.status === 'DRAFT').length;
  const rejectedCount = services.filter((s) => s.status === 'REJECTED').length;

  const filteredServices = services.filter((service) => {
    if (activeTab === 'ALL') return true;
    return service.status === activeTab;
  });

  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setTitle('');
    const defaultCat =
      INITIAL_CATEGORIES_DATA.find((c) => c.name === user?.categoryName) ||
      INITIAL_CATEGORIES_DATA[0];
    setCategoryId(defaultCat.id);
    setCategoryName(defaultCat.name);
    setCategorySlug(defaultCat.slug);
    setSubcategoryName(user?.subCategory || '');
    setShortDescription('');
    setDescription('');
    setServicesOfferedInput('');
    setSkillsInput(user?.professionalInfo?.skills?.join(', ') || '');
    setTagsInput('');
    setTargetCustomersInput('');
    setCoverageArea('Pan India');
    setDeliveryMode('ONLINE');
    setPortfolioUrl(user?.professionalInfo?.portfolioUrl || '');
    setSupportingDocument('');
    setConfirmGovernance(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (service: ServiceListing) => {
    setEditingServiceId(service.id);
    setTitle(service.title);
    setCategoryId(service.categoryId);
    setCategoryName(service.categoryName);
    setCategorySlug(service.categorySlug);
    setSubcategoryName(service.subcategoryName || '');
    setShortDescription(service.shortDescription || '');
    setDescription(service.description);
    setServicesOfferedInput(service.servicesOffered?.join('\n') || '');
    setSkillsInput(service.skills?.join(', ') || '');
    setTagsInput(service.tags?.join(', ') || '');
    setTargetCustomersInput(service.targetCustomers?.join(', ') || '');
    setCoverageArea(service.coverageArea || 'Pan India');
    setDeliveryMode(service.deliveryMode || 'ONLINE');
    setPortfolioUrl(service.portfolioUrl || '');
    setSupportingDocument(service.supportingDocument || '');
    setConfirmGovernance(true);
    setIsFormModalOpen(true);
  };

  const handleCategorySelect = (catId: string) => {
    const selected = INITIAL_CATEGORIES_DATA.find((c) => c.id === catId);
    if (selected) {
      setCategoryId(selected.id);
      setCategoryName(selected.name);
      setCategorySlug(selected.slug);
    }
  };

  const parseLinesOrCommas = (text: string): string[] => {
    return text
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleSaveService = (submitForApproval: boolean) => {
    if (!title.trim()) {
      alert('Please enter a service title.');
      return;
    }
    if (!description.trim()) {
      alert('Please describe your service capabilities.');
      return;
    }
    if (submitForApproval && !confirmGovernance) {
      alert('Please confirm that you accept FIC Intermediary Governance and confidentiality.');
      return;
    }

    const payload: Partial<ServiceListing> = {
      title: title.trim(),
      categoryId,
      categoryName,
      categorySlug,
      subcategoryName: subcategoryName.trim(),
      shortDescription: shortDescription.trim() || description.substring(0, 140),
      description: description.trim(),
      servicesOffered: parseLinesOrCommas(servicesOfferedInput),
      skills: parseLinesOrCommas(skillsInput),
      tags: parseLinesOrCommas(tagsInput),
      targetCustomers: parseLinesOrCommas(targetCustomersInput),
      coverageArea,
      deliveryMode,
      portfolioUrl: portfolioUrl.trim(),
      supportingDocument: supportingDocument.trim(),
      status: submitForApproval ? 'PENDING_APPROVAL' : 'DRAFT'
    };

    if (editingServiceId) {
      updateMemberService(editingServiceId, payload);
      showToast(
        submitForApproval
          ? 'Service updated and submitted for FIC Admin review!'
          : 'Service draft updated successfully.'
      );
    } else {
      if (!user) return;
      createMemberService(user.id || user.userId, payload);
      showToast(
        submitForApproval
          ? 'Service submitted to FIC Admin! Once verified, it will be published on the Universal Marketplace.'
          : 'Service saved as draft in your workspace.'
      );
    }

    setIsFormModalOpen(false);
    loadUserServices();
  };

  const handleSubmitForApproval = (serviceId: string) => {
    submitServiceForApproval(serviceId);
    showToast('Service submitted for FIC review. Our coordinator will verify details.');
    loadUserServices();
  };

  const handleSimulateApprove = (serviceId: string) => {
    simulateAdminApproveService(serviceId);
    showToast('Service APPROVED! It is now live in the Universal Marketplace for all members.');
    loadUserServices();
  };

  const handleOpenRejectModal = (serviceId: string) => {
    setRejectingServiceId(serviceId);
    setRejectionFeedback('Please specify more deliverables and details regarding operational capabilities.');
  };

  const handleConfirmReject = () => {
    if (!rejectingServiceId) return;
    simulateAdminRejectService(rejectingServiceId, rejectionFeedback);
    showToast('Service marked as requiring revision. Admin feedback recorded.', 'info');
    setRejectingServiceId(null);
    setRejectionFeedback('');
    loadUserServices();
  };

  const handleDelete = (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service listing?')) {
      deleteMemberService(serviceId);
      showToast('Service listing deleted.', 'info');
      loadUserServices();
    }
  };

  return (
    <WorkspaceShell maxWidth="7xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={motionSprings.snappy}
            className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-[#FCFAF6] px-5 py-3.5 rounded-2xl shadow-2xl border border-[#D99B43]/40 flex items-center justify-between gap-3 max-w-md"
          >
            <div className="flex items-center gap-3">
              <CheckCircleIcon size={20} className="text-[#2E7D32]" />
              <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="coral"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#C66B52]" />
              Service Capability Console
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#C66B52] bg-white/80 border border-[#E58C72]/30 px-2.5 py-0.5 rounded-lg">
              Universal Marketplace Creator
            </span>
          </div>
        }
        title="My Services & Capabilities"
        subtitle="List and manage your enterprise and professional capabilities. Approved services are published directly into the Universal Marketplace across all 10 business sectors with FIC intermediary privacy safeguards."
        rightActions={
          <div className="flex items-center gap-3">
            <Link to="/marketplace">
              <WorkspaceButton variant="outline" size="md">
                View Marketplace
              </WorkspaceButton>
            </Link>
            <WorkspaceButton
              variant="primary"
              size="md"
              icon={<PlusIcon size={16} />}
              onClick={handleOpenAddModal}
            >
              Add New Service
            </WorkspaceButton>
          </div>
        }
      />

      {/* ========================================================
          2. 5 KPI SUMMARY CARDS
         ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <WorkspaceKpi
          title="Total Services"
          value={<AnimatedCounter value={totalCount} />}
          subtitle="In your account"
          icon={<BriefcaseIcon size={18} />}
          accent="coral"
        />
        <WorkspaceKpi
          title="Active (Approved)"
          value={<AnimatedCounter value={approvedCount} />}
          subtitle="Live on Marketplace"
          icon={<CheckCircleIcon size={18} />}
          accent="emerald"
        />
        <WorkspaceKpi
          title="Under Review"
          value={<AnimatedCounter value={pendingCount} />}
          subtitle="Awaiting FIC Review"
          icon={<ClockIcon size={18} />}
          accent="amber"
        />
        <WorkspaceKpi
          title="Drafts"
          value={<AnimatedCounter value={draftCount} />}
          subtitle="Not submitted yet"
          icon={<FileTextIcon size={18} />}
          accent="violet"
        />
        <WorkspaceKpi
          title="Needs Revision"
          value={<AnimatedCounter value={rejectedCount} />}
          subtitle="Check feedback"
          icon={<AlertCircleIcon size={18} />}
          accent="rose"
        />
      </div>

      {/* ========================================================
          3. STATUS FILTER TABS
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-2 sm:p-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
          {[
            { key: 'ALL', label: 'All Services', count: totalCount },
            { key: 'APPROVED', label: 'Active & Live', count: approvedCount },
            { key: 'PENDING_APPROVAL', label: 'Under Review', count: pendingCount },
            { key: 'DRAFT', label: 'Drafts', count: draftCount },
            { key: 'REJECTED', label: 'Needs Revision', count: rejectedCount }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="relative px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shrink-0 cursor-pointer transition-colors duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="servicesActiveTabIndicator"
                    className="absolute inset-0 bg-[#29302D] rounded-2xl shadow-sm z-0"
                    transition={motionSprings.snappy}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-2 ${
                    isActive ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EADFCF]/70 text-[#29302D]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </WorkspaceCard>

      {/* ========================================================
          4. SERVICES LISTINGS GRID
         ======================================================== */}
      <div className="space-y-5">
        {filteredServices.length === 0 ? (
          <WorkspaceEmptyState
            icon={<BriefcaseIcon size={28} />}
            title={
              activeTab === 'ALL'
                ? 'You have not added any services yet'
                : `No services found in "${activeTab}" status`
            }
            description="Add your business capabilities, manufacturing lines, software competencies, or professional advisory offerings so other members can discover them in the Universal Marketplace."
            actionText="Add Your First Service"
            onAction={handleOpenAddModal}
            accent="coral"
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                layout
                variants={staggerItem}
                whileHover={{ y: -3, transition: motionSprings.cardHover }}
                transition={motionSprings.gentle}
              >
              <div className="bg-white/95 rounded-3xl border border-[#EADFCF] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] hover:border-[#C66B52]/40 transition-all flex flex-col justify-between gap-5">
                <div className="space-y-3.5">
                  {/* Top Bar: Sector + Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-[#FFF4F0] text-[#C66B52] border border-[#E58C72]/30">
                        {service.categoryName}
                      </span>
                      {service.subcategoryName && (
                        <span className="text-xs text-[#8064A9] font-bold">
                          • {service.subcategoryName}
                        </span>
                      )}
                    </div>

                    <div>
                      {service.status === 'APPROVED' && (
                        <WorkspaceBadge variant="active">
                          <CheckCircleIcon size={13} />
                          Live on Marketplace
                        </WorkspaceBadge>
                      )}
                      {service.status === 'PENDING_APPROVAL' && (
                        <WorkspaceBadge variant="pending">
                          <ClockIcon size={13} />
                          Pending FIC Admin Review
                        </WorkspaceBadge>
                      )}
                      {service.status === 'DRAFT' && (
                        <WorkspaceBadge variant="neutral">
                          <FileTextIcon size={13} />
                          Draft (Not Submitted)
                        </WorkspaceBadge>
                      )}
                      {service.status === 'REJECTED' && (
                        <WorkspaceBadge variant="urgent">
                          <AlertCircleIcon size={13} />
                          Needs Revision
                        </WorkspaceBadge>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#29302D] leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#77786E] mt-1.5 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Deliverables */}
                  {service.servicesOffered && service.servicesOffered.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#77786E] block mb-2">
                        Offered Deliverables:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {service.servicesOffered.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-3 py-1 rounded-xl bg-[#FAF7F2] text-[#29302D] border border-[#EADFCF] font-bold"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#77786E]">
                    <span className="font-bold text-[#29302D]">
                      Coverage: <strong className="text-[#C66B52]">{service.coverageArea}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-[#29302D]">
                      Mode:{' '}
                      <strong className="text-[#8064A9]">
                        {service.deliveryMode === 'ONLINE'
                          ? 'Remote / Online'
                          : service.deliveryMode === 'IN_PERSON'
                          ? 'On-Site / Plant'
                          : 'Online & On-Site'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>Created: {service.createdAt}</span>
                  </div>

                  {/* Rejection Feedback Note */}
                  {service.status === 'REJECTED' && service.adminFeedback && (
                    <div className="p-4 rounded-2xl bg-[#FFF4F0] border border-[#E58C72]/40 text-xs text-[#29302D] space-y-1">
                      <div className="font-black text-[#C66B52] flex items-center gap-1.5">
                        <AlertCircleIcon size={16} />
                        FIC Coordinator Feedback for Revision:
                      </div>
                      <p className="text-xs leading-relaxed text-[#77786E]">
                        {service.adminFeedback}
                      </p>
                    </div>
                  )}

                  {/* SIMULATED ADMIN REVIEW BAR */}
                  {service.status === 'PENDING_APPROVAL' && (
                    <div className="p-4 rounded-2xl bg-[#FDF6E9] border border-[#D99B43]/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-black text-[#9C6818] flex items-center gap-1.5">
                          <ShieldCheckIcon size={16} />
                          FIC Admin Approval Simulation:
                        </div>
                        <p className="text-[11px] text-[#77786E]">
                          Test the full workflow: Approve this service to publish it live to the Universal Marketplace, or Reject it with revision notes.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSimulateApprove(service.id)}
                          className="px-3.5 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-black transition-colors shadow-xs cursor-pointer"
                        >
                          Simulate Approval & Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(service.id)}
                          className="px-3.5 py-2 bg-[#C66B52] hover:bg-[#A34A32] text-white rounded-xl text-xs font-black transition-colors shadow-xs cursor-pointer"
                        >
                          Simulate Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="pt-4 border-t border-[#EADFCF] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {service.status === 'APPROVED' && (
                      <Link to="/marketplace">
                        <WorkspaceButton
                          variant="outline"
                          size="sm"
                          icon={<ArrowRightIcon size={13} />}
                        >
                          View in Universal Marketplace
                        </WorkspaceButton>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {service.status === 'DRAFT' && (
                      <WorkspaceButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubmitForApproval(service.id)}
                      >
                        Submit for FIC Approval
                      </WorkspaceButton>
                    )}

                    {(service.status === 'DRAFT' || service.status === 'REJECTED') && (
                      <WorkspaceButton
                        variant="outline"
                        size="sm"
                        icon={<EditIcon size={14} />}
                        onClick={() => handleOpenEditModal(service)}
                      >
                        Edit
                      </WorkspaceButton>
                    )}

                    {service.status === 'APPROVED' && (
                      <WorkspaceButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateMemberService(service.id, { status: 'DRAFT' });
                          showToast('Service unpublished and moved to Drafts.', 'info');
                          loadUserServices();
                        }}
                      >
                        Move to Draft
                      </WorkspaceButton>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-[#77786E] hover:text-[#C66B52] rounded-xl hover:bg-[#FFF4F0] transition-colors cursor-pointer"
                      title="Delete Service"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </div>

      {/* ========================================================
          5. ADD / EDIT SERVICE MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingServiceId ? 'Edit Capability Listing' : 'Add New Service / Capability'}
        maxWidth="3xl"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#8064A9] uppercase tracking-wider">
              1. Basic Information
            </h4>

            <div>
              <label className="text-xs font-black text-[#29302D] block mb-1">
                Service Title <span className="text-[#C66B52]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bulk Cotton Garment & Uniform Manufacturing or Cloud Native Microservices"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Primary Sector <span className="text-[#C66B52]">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D] font-semibold"
                >
                  {INITIAL_CATEGORIES_DATA.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Subcategory / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Textile OEM Manufacturing or Cloud Architecture"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-[#29302D] block mb-1">
                Short Card Summary (1-2 sentences)
              </label>
              <input
                type="text"
                placeholder="Brief summary shown on the marketplace card preview..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-[#29302D] block mb-1">
                Full Description & Scope of Capability <span className="text-[#C66B52]">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe your facilities, team capabilities, quality standards, infrastructure, and commercial readiness in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                required
              ></textarea>
            </div>
          </div>

          {/* Section 2: Scope, Deliverables & Delivery */}
          <div className="space-y-3 pt-3 border-t border-[#EADFCF]">
            <h4 className="text-xs font-black text-[#8064A9] uppercase tracking-wider">
              2. Scope, Deliverables & Delivery
            </h4>

            <div>
              <label className="text-xs font-black text-[#29302D] block mb-1">
                Key Services Offered / Deliverables (Enter one per line or comma-separated)
              </label>
              <textarea
                rows={3}
                placeholder="e.g.&#10;Institutional Uniform Stitching&#10;Corporate Workwear&#10;Quality Assurance & Packaging"
                value={servicesOfferedInput}
                onChange={(e) => setServicesOfferedInput(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Core Skills & Competencies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fabric Processing, OEM Stitching, Supply Chain"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Marketplace Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. Textiles, Export Quality, Bulk Orders"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Coverage Area
                </label>
                <select
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D] font-semibold"
                >
                  <option value="Pan India">Pan India</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="South India">South India</option>
                  <option value="Regional / Local">Regional / Local</option>
                  <option value="Global / International">Global / International</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Delivery Mode
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as any)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D] font-semibold"
                >
                  <option value="ONLINE">Online / Remote Delivery</option>
                  <option value="IN_PERSON">In-Person / On-Site / Factory</option>
                  <option value="BOTH">Both (Online & On-Site)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Supporting Details */}
          <div className="space-y-3 pt-3 border-t border-[#EADFCF]">
            <h4 className="text-xs font-black text-[#8064A9] uppercase tracking-wider">
              3. Portfolio & Supporting Proof (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Portfolio / Website Link
                </label>
                <input
                  type="text"
                  placeholder="https://yourwebsite.com or github/portfolio"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#29302D] block mb-1">
                  Certification / Supporting Doc Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. ISO 9001:2015, MSME Registered, Trade License"
                  value={supportingDocument}
                  onChange={(e) => setSupportingDocument(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: FIC Intermediary Notice & Declaration */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] text-xs text-[#29302D] space-y-2">
            <div className="font-black text-[#C66B52] flex items-center gap-1.5">
              <ShieldCheckIcon size={16} />
              FIC Intermediary Governance Protocol:
            </div>
            <p className="text-[11px] leading-relaxed text-[#77786E]">
              Timeline and Pricing are not required upfront. When members request your service via FIC, our coordinator will validate requirements and reach out to collect your tailored commercial quote. Direct personal contact details are kept strictly confidential.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmGovernance}
                onChange={(e) => setConfirmGovernance(e.target.checked)}
                className="mt-0.5 rounded text-[#C66B52] focus:ring-[#C66B52]"
              />
              <span className="text-[11px] font-bold text-[#29302D]">
                I declare that this capability listing is authentic and agree to FIC Intermediary Proposal Coordination.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#EADFCF] flex flex-wrap items-center justify-end gap-3">
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </WorkspaceButton>
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleSaveService(false)}
            >
              Save as Draft
            </WorkspaceButton>
            <WorkspaceButton
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleSaveService(true)}
            >
              Submit for FIC Approval
            </WorkspaceButton>
          </div>
        </div>
      </AnimatedModal>

      {/* ========================================================
          6. SIMULATED REJECTION MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!rejectingServiceId}
        onClose={() => setRejectingServiceId(null)}
        title="Simulate FIC Reviewer Feedback (Needs Revision)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#77786E] leading-relaxed">
            Provide feedback explaining why this service listing requires modification before publication on the Universal Marketplace:
          </p>
          <textarea
            rows={4}
            value={rejectionFeedback}
            onChange={(e) => setRejectionFeedback(e.target.value)}
            className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] text-[#29302D]"
            placeholder="Enter reason or requested adjustments..."
          ></textarea>
          <div className="flex justify-end gap-3 pt-2">
            <WorkspaceButton variant="outline" size="sm" onClick={() => setRejectingServiceId(null)}>
              Cancel
            </WorkspaceButton>
            <WorkspaceButton
              variant="primary"
              size="sm"
              onClick={handleConfirmReject}
            >
              Confirm Rejection Feedback
            </WorkspaceButton>
          </div>
        </div>
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default MyServicesPage;

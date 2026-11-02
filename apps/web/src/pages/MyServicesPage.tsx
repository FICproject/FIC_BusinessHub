import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '@fic/ui';
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
  FileTextIcon
} from '../components/Icons';

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
    <div className="bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-[#29302D] text-white shadow-lg flex items-center justify-between border border-[#D99B43]/50 transition-all">
            <div className="flex items-center gap-3">
              <CheckCircleIcon size={20} className="text-[#D99B43]" />
              <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#C66B52] uppercase tracking-wider">
              <span>Member Workspace</span>
              <span>/</span>
              <span>My Services & Capabilities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29302D] tracking-tight">
              My Services & Offerings
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              List and manage your enterprise and professional capabilities. Approved services are published directly into the Universal Marketplace across all 10 business sectors with FIC intermediary privacy safeguards.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/marketplace">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
              >
                View Marketplace
              </button>
            </Link>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#29302D] hover:bg-[#8064A9] text-white transition-colors flex items-center gap-2 shadow-xs"
            >
              <PlusIcon size={16} />
              <span>Add New Service</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              Total Services
            </span>
            <div className="text-2xl font-black text-[#29302D] mt-1">{totalCount}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">In your account</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200/90 shadow-xs bg-emerald-50/20">
            <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider block flex items-center gap-1">
              <CheckCircleIcon size={13} /> Active (Approved)
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{approvedCount}</div>
            <span className="text-[11px] text-emerald-600 mt-1 block">Live on Marketplace</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-xs bg-amber-50/20">
            <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider block flex items-center gap-1">
              <ClockIcon size={13} /> Under Review
            </span>
            <div className="text-2xl font-black text-amber-800 mt-1">{pendingCount}</div>
            <span className="text-[11px] text-amber-600 mt-1 block">Awaiting FIC Review</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
              Drafts
            </span>
            <div className="text-2xl font-black text-slate-700 mt-1">{draftCount}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Not submitted</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200/90 shadow-xs bg-rose-50/20">
            <span className="text-[11px] font-bold uppercase text-rose-700 tracking-wider block flex items-center gap-1">
              <AlertCircleIcon size={13} /> Needs Revision
            </span>
            <div className="text-2xl font-black text-rose-800 mt-1">{rejectedCount}</div>
            <span className="text-[11px] text-rose-600 mt-1 block">Check feedback</span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-200/80">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              activeTab === 'ALL'
                ? 'bg-[#29302D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            All Services ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-emerald-700'
            }`}
          >
            Active & Live ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              activeTab === 'PENDING_APPROVAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-amber-700'
            }`}
          >
            Under Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('DRAFT')}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              activeTab === 'DRAFT'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            Drafts ({draftCount})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              activeTab === 'REJECTED'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-rose-700'
            }`}
          >
            Needs Revision ({rejectedCount})
          </button>
        </div>

        {/* Services Listings Grid */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <BriefcaseIcon size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  {activeTab === 'ALL'
                    ? 'You have not added any services yet'
                    : `No services found in "${activeTab}" status`}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add your business capabilities, manufacturing lines, software competencies, or professional advisory offerings so other members can discover them in the Universal Marketplace.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-[#29302D] hover:bg-[#8064A9] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon size={15} />
                <span>Add Your First Service</span>
              </button>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  {/* Top Bar: Sector + Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {service.categoryName}
                      </span>
                      {service.subcategoryName && (
                        <span className="text-[11px] text-slate-500 font-semibold">
                          • {service.subcategoryName}
                        </span>
                      )}
                    </div>

                    <div>
                      {service.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <CheckCircleIcon size={14} className="text-emerald-600" />
                          Live on Marketplace
                        </span>
                      )}
                      {service.status === 'PENDING_APPROVAL' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                          <ClockIcon size={14} className="text-amber-600" />
                          Pending FIC Admin Review
                        </span>
                      )}
                      {service.status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                          <FileTextIcon size={14} className="text-slate-500" />
                          Draft (Not Submitted)
                        </span>
                      )}
                      {service.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                          <AlertCircleIcon size={14} className="text-rose-600" />
                          Needs Revision
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{service.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Capabilities / Services Offered */}
                  {service.servicesOffered && service.servicesOffered.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Offered Deliverables:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {service.servicesOffered.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags & Meta */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Coverage: <strong className="text-slate-900">{service.coverageArea}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      Mode:{' '}
                      <strong className="text-slate-900">
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

                  {/* Rejection Feedback Note if applicable */}
                  {service.status === 'REJECTED' && service.adminFeedback && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircleIcon size={15} className="text-rose-700" />
                        FIC Coordinator Feedback for Revision:
                      </div>
                      <p className="text-[12px] leading-relaxed text-rose-800">
                        {service.adminFeedback}
                      </p>
                    </div>
                  )}

                  {/* SIMULATED ADMIN REVIEW BAR (For PENDING_APPROVAL services) */}
                  {service.status === 'PENDING_APPROVAL' && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <ShieldCheckIcon size={14} className="text-amber-700" />
                          FIC Admin Approval Simulation:
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Test the full workflow: Approve this service to publish it live to the Universal Marketplace, or Reject it with revision notes.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSimulateApprove(service.id)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Simulate Approval & Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(service.id)}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Simulate Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {service.status === 'APPROVED' && (
                      <Link to="/marketplace">
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <span>View in Universal Marketplace</span>
                          <ArrowRightIcon size={13} />
                        </button>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {service.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleSubmitForApproval(service.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        Submit for FIC Approval
                      </button>
                    )}

                    {(service.status === 'DRAFT' || service.status === 'REJECTED') && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(service)}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <EditIcon size={14} />
                        <span>Edit</span>
                      </button>
                    )}

                    {service.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateMemberService(service.id, { status: 'DRAFT' });
                          showToast('Service unpublished and moved to Drafts.', 'info');
                          loadUserServices();
                        }}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Move to Draft
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Service"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingServiceId ? 'Edit Capability Listing' : 'Add New Service / Capability'}
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Basic Information
            </h4>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bulk Cotton Garment & Uniform Manufacturing or Cloud Native Microservices"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Primary Sector <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {INITIAL_CATEGORIES_DATA.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Subcategory / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Textile OEM Manufacturing or Cloud Architecture"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Short Card Summary (1-2 sentences)
              </label>
              <input
                type="text"
                placeholder="Brief summary shown on the marketplace card preview..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Full Description & Scope of Capability <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe your facilities, team capabilities, quality standards, infrastructure, and commercial readiness in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>
          </div>

          {/* Section 2: Capabilities & Deliverables */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Scope, Deliverables & Delivery
            </h4>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Key Services Offered / Deliverables (Enter one per line or comma-separated)
              </label>
              <textarea
                rows={3}
                placeholder="e.g.&#10;Institutional Uniform Stitching&#10;Corporate Workwear&#10;Quality Assurance & Packaging"
                value={servicesOfferedInput}
                onChange={(e) => setServicesOfferedInput(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Core Skills & Competencies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fabric Processing, OEM Stitching, Supply Chain"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Marketplace Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. Textiles, Export Quality, Bulk Orders"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Coverage Area
                </label>
                <select
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Pan India">Pan India</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="South India">South India</option>
                  <option value="Regional / Local">Regional / Local</option>
                  <option value="Global / International">Global / International</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Delivery Mode
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as any)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ONLINE">Online / Remote Delivery</option>
                  <option value="IN_PERSON">In-Person / On-Site / Factory</option>
                  <option value="BOTH">Both (Online & On-Site)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Supporting Details */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Portfolio & Supporting Proof (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Portfolio / Website Link
                </label>
                <input
                  type="text"
                  placeholder="https://yourwebsite.com or github/portfolio"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Certification / Supporting Doc Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. ISO 9001:2015, MSME Registered, Trade License"
                  value={supportingDocument}
                  onChange={(e) => setSupportingDocument(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: FIC Intermediary Notice & Declaration */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheckIcon size={15} className="text-blue-700" />
              FIC Intermediary Governance Protocol:
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800">
              Timeline and Pricing are not required upfront. When members request your service via FIC, our coordinator will validate requirements and reach out to collect your tailored commercial quote. Direct personal contact details are kept strictly confidential.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmGovernance}
                onChange={(e) => setConfirmGovernance(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-semibold text-blue-950">
                I declare that this capability listing is authentic and agree to FIC Intermediary Proposal Coordination.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => handleSaveService(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveService(true)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Submit for FIC Approval
            </button>
          </div>
        </div>
      </Modal>

      {/* SIMULATED REJECTION MODAL */}
      <Modal
        isOpen={!!rejectingServiceId}
        onClose={() => setRejectingServiceId(null)}
        title="Simulate FIC Reviewer Feedback (Needs Revision)"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Provide feedback explaining why this service listing requires modification before publication on the Universal Marketplace:
          </p>
          <textarea
            rows={4}
            value={rejectionFeedback}
            onChange={(e) => setRejectionFeedback(e.target.value)}
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Enter reason or requested adjustments..."
          ></textarea>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectingServiceId(null)}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Confirm Rejection Feedback
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CATEGORIES_DATA } from '../services/categoriesData';
import {
  apiRequest,
  getStoredUser,
  ServiceListing
} from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal } from '../motion';
import {
  ShieldCheckIcon,
  SearchIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  LightbulbIcon,
  SparklesIcon,
  EyeIcon
} from '../components/Icons';

export const MarketplacePage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Navigation Mode: 'SERVICES' (All Sectors) or 'BUSINESS_IDEAS' (Business Idea Requests)
  const [marketplaceMode, setMarketplaceMode] = useState<'SERVICES' | 'BUSINESS_IDEAS'>('SERVICES');

  const [services, setServices] = useState<ServiceListing[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>(INITIAL_CATEGORIES_DATA);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State for FIC Service Details View
  const [selectedServiceForView, setSelectedServiceForView] = useState<ServiceListing | null>(null);
  const [submittedInterestIdeaIds, setSubmittedInterestIdeaIds] = useState<Set<string>>(new Set());

  // Modal State for FIC Service Request
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [requirementNotes, setRequirementNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal State for Business Idea Collaboration Interest ("I'm Interested")
  const [selectedIdeaForInterest, setSelectedIdeaForInterest] = useState<any | null>(null);
  const [interestReason, setInterestReason] = useState<string>('');
  const [contributionType, setContributionType] = useState<string>('Business collaboration');
  const [experience, setExperience] = useState<string>('');
  const [additionalMessage, setAdditionalMessage] = useState<string>('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState<boolean>(false);
  const [interestSuccessMessage, setInterestSuccessMessage] = useState<string>('');
  const [interestErrorMessage, setInterestErrorMessage] = useState<string>('');

  // Load approved marketplace services strictly from backend API
  const loadServices = async () => {
    try {
      const res = await apiRequest('/marketplace/services');
      if (res?.success && res?.data?.items && Array.isArray(res.data.items)) {
        const remoteApproved: ServiceListing[] = res.data.items.map((item: any) => ({
          id: item._id,
          ownerUserId: String(item.providerId || item.providerEmail || ''),
          providerId: item.providerId,
          ownerName: item.providerPrivateName || 'FIC Verified Provider',
          ownerEmail: item.providerEmail,
          categoryId: typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId,
          categoryName: item.categoryName || (typeof item.categoryId === 'object' ? item.categoryId?.name : 'Business & Entrepreneurship'),
          categorySlug: item.categorySlug || (typeof item.categoryId === 'object' ? item.categoryId?.slug : 'business-entrepreneurship'),
          subcategoryId: typeof item.subcategoryId === 'object' ? item.subcategoryId?._id : item.subcategoryId,
          subcategoryName: item.subcategoryName || (typeof item.subcategoryId === 'object' ? item.subcategoryId?.name : 'Business Owner'),
          title: item.title,
          shortDescription: item.shortDescription || item.description?.substring(0, 140) || '',
          description: item.description,
          servicesOffered: item.servicesOffered || [],
          skills: item.skills || [],
          tags: item.tags || [],
          coverageArea: item.coverageArea || 'Pan India',
          deliveryMode: item.deliveryMode || 'IN_PERSON',
          pricingType: item.pricingType,
          price: item.price,
          deliveryTimeline: item.deliveryTimeline,
          portfolioUrl: item.portfolioUrl,
          supportingDocument: item.supportingDocument,
          status: 'APPROVED',
          createdAt: new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB'),
          updatedAt: new Date(item.updatedAt || Date.now()).toLocaleDateString('en-GB')
        }));
        setServices(remoteApproved);
        return;
      }
    } catch (_err) {
      setServices([]);
    }
  };


  // Load current member's submitted collaboration interests to prevent duplicate submissions
  const loadMyInterests = async () => {
    try {
      const res = await apiRequest('/marketplace/my-interests');
      if (res?.success && Array.isArray(res.data)) {
        const ids = new Set<string>(res.data.map((i: any) => String(i.ideaId || i.id)));
        setSubmittedInterestIdeaIds(ids);
      }
    } catch (_err) {
      // Ignored if unauthenticated
    }
  };
  // Load approved & published business ideas from backend API
  const loadBusinessIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const res = await apiRequest('/marketplace/business-ideas');
      if (res?.success && res?.data?.items && Array.isArray(res.data.items)) {
        setIdeas(res.data.items);
      } else {
        setIdeas([]);
      }
    } catch (_err) {
      setIdeas([]);
    } finally {
      setLoadingIdeas(false);
    }
  };

  // Load dynamic categories from Categories & Config module in backend
  const loadCategories = async () => {
    try {
      const res = await apiRequest('/categories');
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (_err) {
      // Gracefully falls back to INITIAL_CATEGORIES_DATA
    }
  };

  useEffect(() => {
    loadServices();
    loadBusinessIdeas();
    loadCategories();
    loadMyInterests();

    const tab = searchParams.get('tab');
    if (tab === 'ideas' || tab === 'business-ideas') {
      setMarketplaceMode('BUSINESS_IDEAS');
    }

    window.addEventListener('storage', loadServices);
    return () => window.removeEventListener('storage', loadServices);
  }, [searchParams]);


  // Dynamic accurate category counts for Services and Business Ideas
  const serviceCategoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach((s) => {
      if (s.categorySlug) {
        counts[s.categorySlug] = (counts[s.categorySlug] || 0) + 1;
      }
    });
    return counts;
  }, [services]);

  const ideaCategoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    ideas.forEach((i) => {
      if (i.mainCategorySlug) {
        counts[i.mainCategorySlug] = (counts[i.mainCategorySlug] || 0) + 1;
      }
    });
    return counts;
  }, [ideas]);

  // Filter Services
  const filteredServices = services.filter((srv) => {
    const matchCategory =
      selectedCategorySlug === 'all' || srv.categorySlug === selectedCategorySlug;
    const matchSearch =
      searchTerm.trim() === '' ||
      srv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (srv.subcategoryName && srv.subcategoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (srv.tags && srv.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchCategory && matchSearch;
  });

  // Filter Business Ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchCategory =
      selectedCategorySlug === 'all' ||
      idea.mainCategorySlug === selectedCategorySlug ||
      idea.mainCategoryId === selectedCategorySlug;
    const matchSearch =
      searchTerm.trim() === '' ||
      idea.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.mainCategoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.subcategoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.targetMarket?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.targetLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.ideaRequestId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id || currentUser?.userId || '';
  const currentUserEmail = (currentUser?.email || '').toLowerCase().trim();

  const isOwnService = (service: ServiceListing) => {
    if (!currentUser) return false;
    const sOwnerId = String(service.ownerUserId || (service as any).providerId || '').trim();
    const sOwnerEmail = String((service as any).ownerEmail || (service as any).providerEmail || '').toLowerCase().trim();
    if (currentUserId && sOwnerId && (sOwnerId === currentUserId || sOwnerId === currentUser.id || sOwnerId === currentUser.userId)) return true;
    if (currentUserEmail && sOwnerEmail && sOwnerEmail === currentUserEmail) return true;
    return false;
  };

  const isOwnIdea = (idea: any) => {
    if (!currentUser) return false;
    const submitterId = String(idea.userId || idea.submitterMemberId || '').trim();
    if (currentUserId && submitterId && (submitterId === currentUserId || submitterId === currentUser.id || submitterId === currentUser.userId)) return true;
    return false;
  };

  // Service Request Modal Handlers
  const handleOpenRequestModal = (service: ServiceListing) => {
    if (isOwnService(service)) return;
    setSelectedService(service);
    setRequirementNotes('');
    setSuccessMessage('');
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setRequirementNotes('');
    setSuccessMessage('');
  };

  const handleConfirmRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !requirementNotes.trim()) return;

    setIsSubmitting(true);

    try {
      await apiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          providerUserId: selectedService.ownerUserId || 'FIC_OFFICER',
          requirementNotes,
          serviceTitle: selectedService.title,
          categoryName: selectedService.categoryName
        })
      });

      setSuccessMessage(
        'Your service requirement has been routed directly to the FIC Intermediary Desk. Our coordinator will evaluate specifications and prepare compliant proposals within 24 hours.'
      );
      setRequirementNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit service request. Please ensure you are an active member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Business Idea "I'm Interested" Modal Handlers
  const handleOpenInterestModal = (idea: any) => {
    if (isOwnIdea(idea)) return;
    setSelectedIdeaForInterest(idea);
    setInterestReason("I'm interested. Let's discuss more about this business idea in meeting.");
    setContributionType('Business collaboration');
    setExperience('');
    setAdditionalMessage('');
    setInterestSuccessMessage('');
    setInterestErrorMessage('');
  };

  const handleCloseInterestModal = () => {
    setSelectedIdeaForInterest(null);
    setInterestReason('');
    setContributionType('Business collaboration');
    setExperience('');
    setAdditionalMessage('');
    setInterestSuccessMessage('');
    setInterestErrorMessage('');
  };

  const handleConfirmInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdeaForInterest) return;
    if (!interestReason.trim()) {
      setInterestErrorMessage('Please explain why you are interested in this idea.');
      return;
    }

    setIsSubmittingInterest(true);
    setInterestErrorMessage('');

    try {
      const res = await apiRequest(`/marketplace/business-ideas/${selectedIdeaForInterest._id || selectedIdeaForInterest.ideaRequestId}/interest`, {
        method: 'POST',
        body: JSON.stringify({
          contributionType,
          interestReason: interestReason.trim(),
          contributionOffer: contributionType,
          experience: experience.trim(),
          additionalMessage: additionalMessage.trim()
        })
      });

      if (res?.success) {
        setInterestSuccessMessage(
          'Your interest has been submitted to FIC. Our team will review your profile and connect you if there is a mutual fit.'
        );
        const submittedId = String(selectedIdeaForInterest.id || selectedIdeaForInterest._id);
        setSubmittedInterestIdeaIds((prev) => new Set([...prev, submittedId]));
        loadBusinessIdeas();
      } else {
        setInterestErrorMessage(res?.error || 'Failed to submit collaboration interest. Please try again.');
      }
    } catch (err: any) {
      setInterestErrorMessage(err.message || 'Failed to submit collaboration interest. Please ensure you are an active member.');
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  return (
    <WorkspaceShell>
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent={marketplaceMode === 'SERVICES' ? 'coral' : 'violet'}
        title="Universal Ecosystem Marketplace"
        subtitle="Discover verified business capabilities and collaboration opportunities across all 10 economic sectors. FIC strictly protects member privacy: all technical proposals and idea introductions are governed directly by FIC coordinators to eliminate spam."
        rightActions={
          <div className="p-3 bg-white/90 border border-[#8064B1]/30 rounded-xl shadow-xs text-xs space-y-0.5 max-w-xs">
            <div className="flex items-center gap-1.5 font-black text-xs text-[#51463F]">
              <ShieldCheckIcon size={14} className="text-[#3B9C91]" />
              Intermediary Privacy Safeguard
            </div>
            <p className="text-[10.5px] text-[#5A4F47] font-medium leading-relaxed">
              No unsolicited direct marketing. Private, curated introductions governed by FIC.
            </p>
          </div>
        }
      />

      {/* ========================================================
          2. MARKETPLACE TAB NAVIGATION & FILTERS
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-3.5 sm:p-4 space-y-3.5">
        {/* Marketplace Mode Tabs: Services vs Business Ideas */}
        <div className="flex flex-wrap items-center gap-2.5 pb-1 border-b border-[#EDE2D7]">
          <button
            onClick={() => setMarketplaceMode('SERVICES')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              marketplaceMode === 'SERVICES'
                ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white shadow-[0_2px_8px_rgba(232,121,91,0.25)]'
                : 'bg-white text-[#51463F] border border-[#EDE2D7] hover:border-[#E8795B]/40 hover:bg-[#FAF7F2]'
            }`}
          >
            <BriefcaseIcon size={16} />
            All Sectors (Services) ({services.length})
          </button>

          <button
            onClick={() => setMarketplaceMode('BUSINESS_IDEAS')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              marketplaceMode === 'BUSINESS_IDEAS'
                ? 'bg-gradient-to-r from-[#8064B1] to-[#6A4D9C] text-white shadow-[0_2px_8px_rgba(128,100,177,0.25)]'
                : 'bg-white text-[#51463F] border border-[#EDE2D7] hover:border-[#8064B1]/40 hover:bg-[#FAF7F2]'
            }`}
          >
            <LightbulbIcon size={16} />
            Business Idea Requests ({ideas.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={
              marketplaceMode === 'SERVICES'
                ? "Search services by keyword, skill, or industry tag (e.g. Textiles, GST, Cloud Architecture)..."
                : "Search business ideas by title, sector, market, or required support (e.g. Mentorship, Tech, Distribution)..."
            }
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white/90 hover:bg-white transition-all text-[#51463F] placeholder-[#5A4F47]/70 font-medium shadow-2xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-[#E8795B]">
            <SearchIcon size={17} />
          </div>
        </div>

        {/* Dynamic Sector Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedCategorySlug('all')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold transition-all duration-200 cursor-pointer ${
              selectedCategorySlug === 'all'
                ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white shadow-[0_2px_6px_rgba(232,121,91,0.2)]'
                : 'bg-white text-[#453A33] border border-[#EDE2D7] hover:border-[#E8795B]/40 hover:bg-[#FAF7F2] hover:text-[#51463F] font-bold'
            }`}
          >
            All Sectors ({marketplaceMode === 'SERVICES' ? services.length : ideas.length})
          </motion.button>
          {categories.map((cat) => {
            const count = marketplaceMode === 'SERVICES'
              ? (serviceCategoryCounts[cat.slug] || 0)
              : (ideaCategoryCounts[cat.slug] || 0);
            return (
              <motion.button
                key={cat.id || cat._id || cat.slug}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-all duration-200 cursor-pointer ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white font-bold shadow-[0_2px_6px_rgba(232,121,91,0.2)]'
                    : 'bg-white text-[#453A33] border border-[#EDE2D7] hover:border-[#E8795B]/40 hover:bg-[#FAF7F2] hover:text-[#51463F] font-semibold'
                }`}
              >
                {cat.name.split('&')[0].trim()} ({count})
              </motion.button>
            );
          })}
        </div>
      </WorkspaceCard>

      {/* ========================================================
          3A. SERVICES GRID (When Mode === 'SERVICES')
         ======================================================== */}
      {marketplaceMode === 'SERVICES' && (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredServices.length === 0 ? (
              <motion.div
                key="empty-services"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-full"
              >
                <WorkspaceEmptyState
                  icon={<BriefcaseIcon size={26} />}
                  title="No services found"
                  description="No active service listings matched your sector or search criteria. Try choosing another sector or clearing the search filter."
                  actionText="Reset All Filters"
                  onAction={() => {
                    setSelectedCategorySlug('all');
                    setSearchTerm('');
                  }}
                  accent="coral"
                />
              </motion.div>
            ) : (
              filteredServices.map((service) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="h-full"
                >
                  <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] shadow-[0_2px_12px_-2px_rgba(81,70,63,0.04)] hover:border-[#E8795B]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full p-4 sm:p-5 group">
                    <div>
                      {/* Category Pill */}
                      <div className="flex items-center justify-between mb-2.5 gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#FFF0EB] text-[#E8795B] border border-[#E8795B]/30">
                          {service.categoryName.split('&')[0]}
                        </span>
                      </div>

                      {/* Subcategory Label */}
                      {service.subcategoryName && (
                        <div className="text-[9.5px] uppercase font-bold text-[#8064B1] tracking-wider mb-1">
                          {service.subcategoryName}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-sm sm:text-[15px] font-black text-[#51463F] mb-1.5 leading-snug group-hover:text-[#E8795B] transition-colors">
                        {service.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#5A4F47] font-medium leading-relaxed mb-3 line-clamp-2">
                        {service.shortDescription || service.description}
                      </p>

                      {/* Key Capabilities / Deliverables */}
                      {service.servicesOffered && service.servicesOffered.length > 0 && (
                        <div className="mb-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-[#5A4F47] block mb-1.5">
                            Key Deliverables
                          </span>
                          <ul className="space-y-1">
                            {service.servicesOffered.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-xs text-[#51463F] flex items-start gap-1.5">
                                <span className="text-[#E8795B] font-bold text-xs shrink-0">✓</span>
                                <span className="line-clamp-1">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tags */}
                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {service.tags.slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-[#FAF7F2] text-[#453A33] px-2 py-0.5 rounded-md border border-[#EDE2D7] font-bold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom CTA */}
                    <div className="pt-3 border-t border-[#EDE2D7] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedServiceForView(service)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#51463F] bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#EDE2D7] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <EyeIcon size={13} className="text-[#8064B1]" />
                        View
                      </button>
                      {isOwnService(service) ? (
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 select-none">
                          Your Listing
                        </span>
                      ) : (
                        <WorkspaceButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenRequestModal(service)}
                          icon={<ArrowRightIcon size={12} />}
                        >
                          Request via FIC
                        </WorkspaceButton>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ========================================================
          3B. BUSINESS IDEAS GRID (When Mode === 'BUSINESS_IDEAS')
         ======================================================== */}
      {marketplaceMode === 'BUSINESS_IDEAS' && (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredIdeas.length === 0 ? (
              <motion.div
                key="empty-ideas"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-full"
              >
                <WorkspaceEmptyState
                  icon={<LightbulbIcon size={26} />}
                  title="No business ideas open for collaboration"
                  description="No approved business ideas matched your filter criteria at this time. Check back soon or submit your own business idea to connect with the network."
                  actionText="Reset All Filters"
                  onAction={() => {
                    setSelectedCategorySlug('all');
                    setSearchTerm('');
                  }}
                  accent="violet"
                />
              </motion.div>
            ) : (
              filteredIdeas.map((idea) => (
                <motion.div
                  key={idea._id || idea.ideaRequestId}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="h-full"
                >
                  <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] shadow-[0_2px_12px_-2px_rgba(81,70,63,0.04)] hover:border-[#8064B1]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full p-4 sm:p-5 group">
                    <div>
                      {/* Top Badges: Category & FIC Verified */}
                      <div className="flex items-center justify-between mb-2.5 gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-50 text-[#8064B1] border border-[#8064B1]/30">
                          {idea.mainCategoryName?.split('&')[0] || 'General'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheckIcon size={12} className="text-emerald-600" />
                          FIC Verified & Shared
                        </span>
                      </div>

                      {/* Subcategory & Ref Tag */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[9.5px] uppercase font-bold text-[#8064B1] tracking-wider">
                          {idea.subcategoryName || 'Industry Opportunity'}
                        </div>
                        <span className="text-[9.5px] font-mono text-[#82776E] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {idea.ideaRequestId || idea.refNumber}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-[15px] font-black text-[#51463F] mb-1.5 leading-snug group-hover:text-[#8064B1] transition-colors">
                        {idea.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-[#5A4F47] font-medium leading-relaxed mb-3 line-clamp-3">
                        {idea.shortSummary || idea.description}
                      </p>

                      {/* Key Attributes Box: Stage, Market & Location */}
                      <div className="mb-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#82776E] font-semibold">Stage:</span>
                          <span className="font-bold text-[#51463F] bg-white px-2 py-0.5 rounded border border-[#EDE2D7]">
                            {idea.developmentStage}
                          </span>
                        </div>
                        {idea.targetMarket && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#82776E] font-semibold">Target Market:</span>
                            <span className="font-semibold text-[#51463F] truncate max-w-[140px]">
                              {idea.targetMarket}
                            </span>
                          </div>
                        )}
                        {idea.targetLocation && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#82776E] font-semibold">Target Location:</span>
                            <span className="font-semibold text-[#51463F] truncate max-w-[140px]">
                              {idea.targetLocation}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Support Requirements Pills */}
                      {idea.supportRequirements && idea.supportRequirements.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-[#82776E] block mb-1">
                            Collaboration Needed:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {idea.supportRequirements.map((req: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-purple-50/70 text-[#6A4D9C] px-2 py-0.5 rounded-md border border-[#8064B1]/20 font-bold"
                              >
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom CTA */}
                    <div className="pt-3 border-t border-[#EDE2D7] flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#82776E]">
                        Published {idea.publishedAt ? new Date(idea.publishedAt).toLocaleDateString('en-GB') : (idea.publishedDate || 'Recently')}
                      </span>
                      {isOwnIdea(idea) ? (
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 select-none flex items-center gap-1">
                          Your Idea Listing
                        </span>
                      ) : submittedInterestIdeaIds.has(String(idea.id)) ? (
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 select-none flex items-center gap-1">
                          <CheckCircleIcon size={13} className="text-emerald-600" />
                          Interest Submitted
                        </span>
                      ) : (
                        <WorkspaceButton
                          variant="violet"
                          size="sm"
                          onClick={() => handleOpenInterestModal(idea)}
                          icon={<SparklesIcon size={13} />}
                        >
                          I'm Interested
                        </WorkspaceButton>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ========================================================
          4. MODAL: SUBMIT SERVICE REQUIREMENT TO FIC
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedService}
        onClose={handleCloseModal}
        title="Submit Service Requirement to FIC"
      >
        {selectedService && (
          <div className="space-y-4">
            {successMessage ? (
              <div className="py-6 text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-14 h-14 rounded-2xl bg-[#3B9C91]/15 text-[#3B9C91] border border-[#3B9C91]/30 flex items-center justify-center mx-auto shadow-sm"
                >
                  <CheckCircleIcon size={28} />
                </motion.div>
                <h4 className="text-base font-black text-[#51463F]">Requirement Registered!</h4>
                <p className="text-xs text-[#82776E] leading-relaxed max-w-md mx-auto">
                  {successMessage}
                </p>
                <div className="pt-3">
                  <WorkspaceButton variant="outline" size="sm" onClick={handleCloseModal}>
                    Back to Marketplace
                  </WorkspaceButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmRequest} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1">
                  <span className="text-[10px] text-[#82776E] block uppercase font-black tracking-wider">
                    Selected Service
                  </span>
                  <div className="text-sm font-black text-[#51463F]">{selectedService.title}</div>
                  <div className="text-xs text-[#E8795B] font-bold">
                    {selectedService.categoryName}
                    {selectedService.subcategoryName ? ` • ${selectedService.subcategoryName}` : ''}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#51463F] block">
                    Describe Your Requirement & Specifications <span className="text-[#E8795B]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F] placeholder-[#82776E]/60 shadow-2xs"
                    placeholder="Provide details such as requirement scope, volumes, expected outcomes, and technical parameters..."
                    value={requirementNotes}
                    onChange={(e) => setRequirementNotes(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF0EB] border border-[#E8795B]/30 text-xs text-[#51463F] space-y-1">
                  <div className="font-black text-[#E8795B] flex items-center gap-1.5">
                    <ShieldCheckIcon size={16} />
                    FIC Intermediary Governance:
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#82776E]">
                    FIC protects member privacy and prevents unsolicited marketing. Our team verifies technical parameters and arranges bespoke quotation proposals directly.
                  </p>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <WorkspaceButton variant="outline" size="sm" type="button" onClick={handleCloseModal}>
                    Cancel
                  </WorkspaceButton>
                  <WorkspaceButton variant="primary" size="sm" type="submit" loading={isSubmitting}>
                    Submit Request to FIC
                  </WorkspaceButton>
                </div>
              </form>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          5. MODAL: "I'M INTERESTED" (COLLABORATION OFFER)
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedIdeaForInterest}
        onClose={handleCloseInterestModal}
        title="Express Collaboration Interest"
      >
        {selectedIdeaForInterest && (
          <div className="space-y-4">
            {interestSuccessMessage ? (
              <div className="py-6 text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-14 h-14 rounded-2xl bg-purple-100 text-[#8064B1] border border-[#8064B1]/30 flex items-center justify-center mx-auto shadow-sm"
                >
                  <CheckCircleIcon size={28} />
                </motion.div>
                <h4 className="text-base font-black text-[#51463F]">Interest Submitted!</h4>
                <p className="text-xs text-[#5A4F47] leading-relaxed max-w-md mx-auto font-medium">
                  {interestSuccessMessage}
                </p>
                <div className="pt-3">
                  <WorkspaceButton variant="outline" size="sm" onClick={handleCloseInterestModal}>
                    Close & Return to Marketplace
                  </WorkspaceButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmInterest} className="space-y-4">
                {/* User Requested Interest Headline */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F4EEFB] to-[#FAF8FD] border-2 border-[#8064B1]/40 text-center space-y-1 shadow-2xs">
                  <div className="text-base sm:text-lg font-black text-[#8064B1]">
                    I'm interested
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#51463F]">
                    Let's discuss more about this business idea in meeting
                  </div>
                </div>

                {/* Privacy Safeguard Alert */}
                <div className="p-3 bg-purple-50/70 border border-[#8064B1]/30 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-[#8064B1] flex items-center gap-1.5">
                    <ShieldCheckIcon size={14} />
                    FIC Intermediary Privacy Guard:
                  </div>
                  <p className="text-[11px] text-[#5A4F47] leading-relaxed">
                    Submitter contact details remain confidential. Your interest and profile credentials will be reviewed by FIC Admin, who coordinates official introductions.
                  </p>
                </div>

                {/* Selected Idea Summary (Privacy Protected) */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#82776E] uppercase font-bold tracking-wider">
                      Business Idea Reference
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#8064B1]">
                      {selectedIdeaForInterest.ideaRequestId || selectedIdeaForInterest.refNumber}
                    </span>
                  </div>
                  <div className="text-sm font-black text-[#51463F]">{selectedIdeaForInterest.title}</div>
                  <div className="text-xs text-[#8064B1] font-semibold">
                    {selectedIdeaForInterest.mainCategoryName} • {selectedIdeaForInterest.subcategoryName}
                  </div>
                </div>

                {/* Error Banner */}
                {interestErrorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                    {interestErrorMessage}
                  </div>
                )}

                {/* 1. Contribution Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#51463F] block">
                    What contribution can you offer? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={contributionType}
                    onChange={(e) => setContributionType(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#EDE2D7] rounded-xl bg-white text-[#51463F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                  >
                    <option value="Business collaboration">Business collaboration</option>
                    <option value="Technical expertise">Technical expertise</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Market access">Market access</option>
                    <option value="Manufacturing capability">Manufacturing capability</option>
                    <option value="Business connections">Business connections</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 2. Why are you interested? */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#51463F] block">
                    Why are you interested in this idea? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F] placeholder-[#82776E]/60 shadow-2xs"
                    placeholder="Explain why this opportunity caught your interest and how you align with the vision..."
                    value={interestReason}
                    onChange={(e) => setInterestReason(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Relevant experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#51463F] block">
                    Relevant experience or expertise <span className="text-[#82776E] text-[11px]">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F] placeholder-[#82776E]/60 shadow-2xs"
                    placeholder="Briefly describe your track record, enterprise capabilities, or related past achievements..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>

                {/* 4. Additional message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#51463F] block">
                    Additional message for FIC Admin <span className="text-[#82776E] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="w-full text-xs p-2.5 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#51463F] placeholder-[#82776E]/60"
                    placeholder="Any specific coordination notes or timeline preferences..."
                    value={additionalMessage}
                    onChange={(e) => setAdditionalMessage(e.target.value)}
                  />
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex justify-end gap-3">
                  <WorkspaceButton
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleCloseInterestModal}
                  >
                    Cancel
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="violet"
                    size="sm"
                    type="submit"
                    loading={isSubmittingInterest}
                    icon={<SparklesIcon size={13} />}
                  >
                    Submit Interest to FIC
                  </WorkspaceButton>
                </div>
              </form>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          6. MODAL: VIEW SERVICE DETAILS
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedServiceForView}
        onClose={() => setSelectedServiceForView(null)}
        title={selectedServiceForView?.title || 'Service Details'}
      >
        {selectedServiceForView && (
          <div className="space-y-4 text-xs">
            {/* Header tags & badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#FFF0EB] text-[#E8795B] border border-[#E8795B]/30">
                {selectedServiceForView.categoryName}
              </span>
              {selectedServiceForView.subcategoryName && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {selectedServiceForView.subcategoryName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheckIcon size={13} className="text-emerald-600" />
                FIC Verified Provider
              </span>
            </div>

            {/* Scope / Metadata cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7]">
              <div>
                <span className="text-[10px] text-[#82776E] uppercase font-bold block">Delivery Mode</span>
                <span className="font-bold text-[#51463F] text-xs">
                  {selectedServiceForView.deliveryMode === 'ONLINE'
                    ? 'Remote / Online'
                    : selectedServiceForView.deliveryMode === 'IN_PERSON'
                    ? 'In-Person'
                    : 'Hybrid (Online & In-Person)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#82776E] uppercase font-bold block">Coverage Area</span>
                <span className="font-bold text-[#51463F] text-xs">
                  {selectedServiceForView.coverageArea || 'Pan-India'}
                </span>
              </div>
              {selectedServiceForView.pricingType && (
                <div>
                  <span className="text-[10px] text-[#82776E] uppercase font-bold block">Pricing</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    {selectedServiceForView.pricingType === 'FIXED'
                      ? `Fixed ₹${selectedServiceForView.price?.toLocaleString('en-IN') || 'Quoted'}`
                      : selectedServiceForView.pricingType === 'STARTING_FROM'
                      ? `Starting from ₹${selectedServiceForView.price?.toLocaleString('en-IN') || 'Quoted'}`
                      : 'Custom Quote via FIC'}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#51463F] block">
                Service Description
              </span>
              <p className="text-xs text-[#5A4F47] leading-relaxed whitespace-pre-line p-3 rounded-xl bg-white border border-[#EDE2D7]">
                {selectedServiceForView.description}
              </p>
            </div>

            {/* Key Deliverables */}
            {selectedServiceForView.servicesOffered && selectedServiceForView.servicesOffered.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#51463F] block">
                  Key Deliverables & Scope of Work
                </span>
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
                  <ul className="space-y-1.5">
                    {selectedServiceForView.servicesOffered.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#51463F] flex items-start gap-2">
                        <span className="text-[#E8795B] font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedServiceForView.tags && selectedServiceForView.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#51463F] block">
                  Service Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedServiceForView.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-[#FAF7F2] text-[#453A33] px-2.5 py-1 rounded-md border border-[#EDE2D7] font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="pt-3 border-t border-[#EDE2D7] flex items-center justify-between gap-3">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedServiceForView(null)}
              >
                Close
              </WorkspaceButton>
              {isOwnService(selectedServiceForView) ? (
                <span className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
                  This is your listing
                </span>
              ) : (
                <WorkspaceButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const s = selectedServiceForView;
                    setSelectedServiceForView(null);
                    handleOpenRequestModal(s);
                  }}
                  icon={<ArrowRightIcon size={12} />}
                >
                  Request via FIC
                </WorkspaceButton>
              )}
            </div>
          </div>
        )}
      </AnimatedModal>

    </WorkspaceShell>
  );
};

export default MarketplacePage;

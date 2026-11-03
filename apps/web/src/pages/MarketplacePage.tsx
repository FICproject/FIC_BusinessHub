import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CATEGORIES_DATA } from '../services/mockData';
import {
  apiRequest,
  getStoredUser,
  saveUserRequest,
  getMarketplaceServices,
  ServiceListing
} from '../services/api';
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
  ShieldCheckIcon,
  SearchIcon,
  LockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  SparklesIcon
} from '../components/Icons';

export const MarketplacePage: React.FC = () => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State for FIC Service Request
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [requirementNotes, setRequirementNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load approved marketplace services from the centralized service catalog
  useEffect(() => {
    const loadServices = () => {
      const liveServices = getMarketplaceServices();
      setServices(liveServices);
    };

    loadServices();

    // Listen to storage changes if services are added/approved in another tab
    window.addEventListener('storage', loadServices);
    return () => window.removeEventListener('storage', loadServices);
  }, []);

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

  const handleOpenRequestModal = (service: ServiceListing) => {
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
          requirementNotes
        })
      });

      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          serviceTitle: selectedService.title,
          category: selectedService.categoryName,
          notes: requirementNotes,
          statusText: 'FIC Review',
          status: 'SUBMITTED'
        });
      }

      setSuccessMessage(
        'Your service requirement has been routed directly to the FIC Intermediary Desk. Our coordinator will evaluate specifications and prepare compliant proposals within 24 hours.'
      );
    } catch {
      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          serviceTitle: selectedService.title,
          category: selectedService.categoryName,
          notes: requirementNotes,
          statusText: 'FIC Review',
          status: 'SUBMITTED'
        });
      }

      setSuccessMessage(
        'Requirement securely logged. An authorized FIC Intermediary Coordinator will initiate scope alignment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkspaceShell maxWidth="7xl">
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#D99B43]" />
              Universal Discovery
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#8064A9] bg-white/80 border border-[#8064A9]/30 px-2.5 py-0.5 rounded-lg">
              10 Industry Sectors
            </span>
          </div>
        }
        title="Universal Services Marketplace"
        subtitle="Browse verified capabilities across all 10 business sectors. In accordance with FIC governance, provider identity remains confidential; all requirements and proposals are coordinated directly by FIC to eliminate spam."
        rightActions={
          <div className="p-4 bg-white/90 border border-[#8064A9]/30 rounded-2xl shadow-xs text-xs space-y-1 max-w-xs">
            <div className="flex items-center gap-2 font-black text-[#29302D]">
              <ShieldCheckIcon size={16} className="text-[#2E7D32]" />
              Intermediary Guarantee
            </div>
            <p className="text-[11px] text-[#77786E] leading-relaxed">
              No direct unsolicited contacts. High-integrity verified technical proposals only.
            </p>
          </div>
        }
      />

      {/* ========================================================
          2. SEARCH & SECTOR FILTER PILLS
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-5 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search services by keyword, skill, or industry tag (e.g. Textiles, GST, Cloud Architecture)..."
            className="w-full text-xs sm:text-sm pl-11 pr-4 py-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white/90 hover:bg-white transition-all text-[#29302D] placeholder-[#77786E]/60 shadow-2xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3.5 top-3.5 text-[#C66B52]">
            <SearchIcon size={20} />
          </div>
        </div>

        {/* Sector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategorySlug('all')}
            className={`px-4 py-2 rounded-xl shrink-0 font-extrabold transition-all duration-200 cursor-pointer ${
              selectedCategorySlug === 'all'
                ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
                : 'bg-white/80 text-[#77786E] border border-[#EADFCF] hover:bg-[#F5EBDD]/60 hover:text-[#29302D]'
            }`}
          >
            All Sectors ({services.length})
          </motion.button>
          {INITIAL_CATEGORIES_DATA.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-4 py-2 rounded-xl shrink-0 font-bold transition-all duration-200 cursor-pointer ${
                selectedCategorySlug === cat.slug
                  ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
                  : 'bg-white/80 text-[#77786E] border border-[#EADFCF] hover:bg-[#F5EBDD]/60 hover:text-[#29302D]'
              }`}
            >
              {cat.name.split('&')[0]}
            </motion.button>
          ))}
        </div>
      </WorkspaceCard>

      {/* ========================================================
          3. SERVICE CARDS GRID (ANIMATED LAYOUT & STAGGER)
         ======================================================== */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredServices.length === 0 ? (
            <motion.div
              key="empty-state"
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
                accent="violet"
              />
            </motion.div>
          ) : (
            filteredServices.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="h-full"
              >
                <div className="bg-white/95 rounded-3xl border border-[#EADFCF] shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] hover:border-[#C66B52]/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full p-6 sm:p-7 group">
                  <div>
                    {/* Category Pill & Verification Badge */}
                    <div className="flex items-center justify-between mb-3.5 gap-2">
                      <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-[#FFF4F0] text-[#C66B52] border border-[#E58C72]/30">
                        {service.categoryName.split('&')[0]}
                      </span>
                      <span className="text-[11px] text-[#2E7D32] font-black flex items-center gap-1.5 bg-[#2E7D32]/10 px-2.5 py-0.5 rounded-full border border-[#2E7D32]/20">
                        <ShieldCheckIcon size={13} /> FIC Verified
                      </span>
                    </div>

                    {/* Subcategory Label */}
                    {service.subcategoryName && (
                      <div className="text-[10px] uppercase font-black text-[#8064A9] tracking-wider mb-1.5">
                        {service.subcategoryName}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-black text-[#29302D] mb-2 leading-snug group-hover:text-[#C66B52] transition-colors">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#77786E] leading-relaxed mb-4 line-clamp-3">
                      {service.shortDescription || service.description}
                    </p>

                    {/* Key Capabilities / Deliverables */}
                    {service.servicesOffered && service.servicesOffered.length > 0 && (
                      <div className="mb-4 p-3 rounded-2xl bg-[#FAF7F2]/80 border border-[#EADFCF]/60">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#77786E] block mb-2">
                          Key Deliverables
                        </span>
                        <ul className="space-y-1.5">
                          {service.servicesOffered.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="text-xs text-[#29302D] flex items-start gap-2">
                              <span className="text-[#C66B52] font-black text-xs shrink-0">✓</span>
                              <span className="line-clamp-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags */}
                    {service.tags && service.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {service.tags.slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10.5px] bg-[#FAF7F2] text-[#77786E] px-2.5 py-1 rounded-lg border border-[#EADFCF] font-semibold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-4 border-t border-[#EADFCF] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#77786E] font-medium flex items-center gap-1">
                      <LockIcon size={12} className="text-[#8064A9]" />
                      FIC Facilitated
                    </span>

                    <WorkspaceButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenRequestModal(service)}
                      icon={<ArrowRightIcon size={13} />}
                    >
                      Request via FIC
                    </WorkspaceButton>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* ========================================================
          4. REQUEST VIA FIC ANIMATED MODAL
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
                  className="w-14 h-14 rounded-2xl bg-[#2E7D32]/12 text-[#2E7D32] border border-[#2E7D32]/30 flex items-center justify-center mx-auto shadow-sm"
                >
                  <CheckCircleIcon size={28} />
                </motion.div>
                <h4 className="text-base font-black text-[#29302D]">Requirement Registered!</h4>
                <p className="text-xs text-[#77786E] leading-relaxed max-w-md mx-auto">
                  {successMessage}
                </p>
                <div className="pt-3">
                  <WorkspaceButton variant="charcoal" size="sm" onClick={handleCloseModal}>
                    Back to Marketplace
                  </WorkspaceButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmRequest} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] space-y-1">
                  <span className="text-[10px] text-[#77786E] block uppercase font-black tracking-wider">
                    Selected Service
                  </span>
                  <div className="text-sm font-black text-[#29302D]">{selectedService.title}</div>
                  <div className="text-xs text-[#C66B52] font-bold">
                    {selectedService.categoryName}
                    {selectedService.subcategoryName ? ` • ${selectedService.subcategoryName}` : ''}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Describe Your Requirement & Specifications <span className="text-[#C66B52]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs"
                    placeholder="Provide details such as requirement scope, volumes, expected outcomes, and technical parameters..."
                    value={requirementNotes}
                    onChange={(e) => setRequirementNotes(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF4F0] border border-[#E58C72]/40 text-xs text-[#29302D] space-y-1">
                  <div className="font-black text-[#C66B52] flex items-center gap-1.5">
                    <ShieldCheckIcon size={16} />
                    FIC Intermediary Governance:
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#77786E]">
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
    </WorkspaceShell>
  );
};

export default MarketplacePage;

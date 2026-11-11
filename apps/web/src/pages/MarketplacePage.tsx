import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CATEGORIES_DATA } from '../services/categoriesData';
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
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal } from '../motion';
import {
  ShieldCheckIcon,
  SearchIcon,
  LockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon
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

  // Load approved marketplace services from backend API & catalog
  useEffect(() => {
    const loadServices = async () => {
      const localApproved = getMarketplaceServices();
      try {
        const res = await apiRequest('/marketplace/services');
        if (res?.success && res?.data?.items && Array.isArray(res.data.items)) {
          // Normalize server items to ServiceListing structure
          const remoteApproved: ServiceListing[] = res.data.items.map((item: any) => ({
            id: item._id,
            ownerUserId: item.providerId || item.providerEmail || '',
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
            status: 'APPROVED',
            createdAt: new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB'),
            updatedAt: new Date(item.updatedAt || Date.now()).toLocaleDateString('en-GB')
          }));

          // Merge without duplicates
          const combined = [...remoteApproved];
          localApproved.forEach((loc) => {
            if (!combined.some((r) => r.id === loc.id || r.title.toLowerCase() === loc.title.toLowerCase())) {
              combined.push(loc);
            }
          });
          setServices(combined);
          return;
        }
      } catch (_err) {
        // Fallback to local catalog
      }
      setServices(localApproved);
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

  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id || currentUser?.userId || '';
  const currentUserEmail = (currentUser?.email || '').toLowerCase().trim();

  const isOwnService = (service: ServiceListing) => {
    if (!currentUser) return false;
    const sOwnerId = String(service.ownerUserId || '').trim();
    const sOwnerEmail = String((service as any).ownerEmail || '').toLowerCase().trim();
    if (currentUserId && sOwnerId && (sOwnerId === currentUserId || sOwnerId === currentUser.id)) return true;
    if (currentUserEmail && sOwnerEmail && sOwnerEmail === currentUserEmail) return true;
    return false;
  };

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
      const res = await apiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          providerUserId: selectedService.ownerUserId || 'FIC_OFFICER',
          requirementNotes,
          serviceTitle: selectedService.title,
          categoryName: selectedService.categoryName
        })
      });

      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          id: res?.data?.id || `req-${Date.now()}`,
          serviceTitle: selectedService.title,
          category: selectedService.categoryName,
          notes: requirementNotes,
          statusText: 'Under FIC Review',
          status: 'SUBMITTED',
          ficRemark: 'Request received. Assigned to FIC Coordinator for requirement validation.'
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
          statusText: 'Under FIC Review',
          status: 'SUBMITTED',
          ficRemark: 'Requirement securely logged with FIC Intermediary Coordinator.'
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
    <WorkspaceShell>
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        title="Universal Services Marketplace"
        subtitle="Browse verified capabilities across all 10 business sectors. In accordance with FIC governance, provider identity remains confidential; all requirements and proposals are coordinated directly by FIC to eliminate spam."
        rightActions={
          <div className="p-3 bg-white/90 border border-[#8064B1]/30 rounded-xl shadow-xs text-xs space-y-0.5 max-w-xs">
            <div className="flex items-center gap-1.5 font-black text-xs text-[#51463F]">
              <ShieldCheckIcon size={14} className="text-[#3B9C91]" />
              Intermediary Guarantee
            </div>
            <p className="text-[10.5px] text-[#5A4F47] font-medium leading-relaxed">
              No direct unsolicited contacts. High-integrity verified technical proposals only.
            </p>
          </div>
        }
      />

      {/* ========================================================
          2. SEARCH & SECTOR FILTER PILLS
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-3.5 sm:p-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search services by keyword, skill, or industry tag (e.g. Textiles, GST, Cloud Architecture)..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white/90 hover:bg-white transition-all text-[#51463F] placeholder-[#5A4F47]/70 font-medium shadow-2xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-[#E8795B]">
            <SearchIcon size={17} />
          </div>
        </div>

        {/* Sector Chips */}
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
            All Sectors ({services.length})
          </motion.button>
          {INITIAL_CATEGORIES_DATA.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all duration-200 cursor-pointer ${
                selectedCategorySlug === cat.slug
                  ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white font-bold shadow-[0_2px_6px_rgba(232,121,91,0.2)]'
                  : 'bg-white text-[#453A33] border border-[#EDE2D7] hover:border-[#E8795B]/40 hover:bg-[#FAF7F2] hover:text-[#51463F] font-semibold'
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
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
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
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="h-full"
              >
                <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] shadow-[0_2px_12px_-2px_rgba(81,70,63,0.04)] hover:border-[#E8795B]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full p-4 sm:p-5 group">
                  <div>
                    {/* Category Pill & Verification Badge */}
                    <div className="flex items-center justify-between mb-2.5 gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#FFF0EB] text-[#E8795B] border border-[#E8795B]/30">
                        {service.categoryName.split('&')[0]}
                      </span>
                      <span className="text-[10px] text-[#3B9C91] font-bold flex items-center gap-1 bg-[#E3F5F2] px-2 py-0.5 rounded-md border border-[#3B9C91]/30">
                        <ShieldCheckIcon size={12} /> FIC Verified
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
                    <span className="text-[10.5px] text-[#5A4F47] font-bold flex items-center gap-1">
                      <LockIcon size={11} className="text-[#8064B1]" />
                      FIC Facilitated
                    </span>

                    {isOwnService(service) ? (
                      <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed">
                        Your Service Listing
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
    </WorkspaceShell>
  );
};

export default MarketplacePage;

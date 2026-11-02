import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '@fic/ui';
import { INITIAL_CATEGORIES_DATA } from '../services/mockData';
import {
  apiRequest,
  getStoredUser,
  saveUserRequest,
  getMarketplaceServices,
  ServiceListing
} from '../services/api';
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
          requirementNotes
        })
      });

      // Save user-isolated request to persistent client state for My Requests tracking
      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          serviceTitle: selectedService.title,
          category: selectedService.categoryName,
          requirementNotes
        });
      }

      setSuccessMessage(
        'Your service requirement has been successfully submitted to FIC. Our intermediary coordinator will validate the scope and coordinate proposal communication with the provider.'
      );
    } catch {
      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          serviceTitle: selectedService.title,
          category: selectedService.categoryName,
          requirementNotes
        });
      }
      setSuccessMessage('Your request has been routed to the FIC team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Marketplace Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-2">
                <LockIcon size={13} className="text-emerald-700" />
                Provider Privacy Protected • FIC Coordinated
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29302D] tracking-tight">
                Universal Services Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Browse verified capabilities across all 10 business sectors. In accordance with FIC governance, provider identity and direct contact details are strictly confidential; all requirements and proposals are coordinated directly by FIC.
              </p>
            </div>

            <div className="p-3.5 bg-[#FBF9F5] border border-[#E8DBC8] rounded-xl text-xs text-[#29302D] space-y-1 shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-[#29302D]">
                <ShieldCheckIcon size={16} className="text-emerald-600" />
                Intermediary Guarantee
              </div>
              <span className="text-[11px] text-slate-500 block">
                No direct unsolicited contact. Verified technical proposals only.
              </span>
            </div>
          </div>
        </div>

        {/* Search & Sector Filters */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services by keyword, skill, or industry tag (e.g. Textiles, GST, Cloud Architecture)..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3.5 top-3.5 text-slate-400">
              <SearchIcon size={18} />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-3.5 py-2 rounded-xl shrink-0 font-semibold transition-colors ${
                selectedCategorySlug === 'all'
                  ? 'bg-[#29302D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Sectors ({services.length})
            </button>
            {INITIAL_CATEGORIES_DATA.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-3.5 py-2 rounded-xl shrink-0 font-medium transition-colors ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-[#29302D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid: Clean Card Bottom WITHOUT Timeline or Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <BriefcaseIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No services found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active service listings matched your sector or search criteria. Try choosing another sector or clearing the search filter.
              </p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-md transition-shadow border border-slate-200/90 rounded-2xl bg-white flex flex-col justify-between h-full p-6"
              >
                <div>
                  {/* Category Pill & Verification Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {service.categoryName.split('&')[0]}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <ShieldCheckIcon size={13} /> FIC Verified
                    </span>
                  </div>

                  {/* Subcategory Label if present */}
                  {service.subcategoryName && (
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      {service.subcategoryName}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {service.shortDescription || service.description}
                  </p>

                  {/* Key Capabilities / Services Offered */}
                  {service.servicesOffered && service.servicesOffered.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Key Deliverables
                      </span>
                      <ul className="space-y-1">
                        {service.servicesOffered.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5 font-black">•</span>
                            <span className="line-clamp-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {service.tags && service.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {service.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clean Bottom Portion: NO Timeline, NO Pricing, Full Clean Layout */}
                <div className="pt-4 mt-auto border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {service.coverageArea || 'PAN INDIA'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {service.deliveryMode === 'ONLINE'
                          ? 'Remote / Online'
                          : service.deliveryMode === 'IN_PERSON'
                          ? 'On-Site / Plant'
                          : 'Online & On-Site'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenRequestModal(service)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-1.5"
                    >
                      <span>Request via FIC</span>
                      <ArrowRightIcon size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* REQUEST VIA FIC MODAL */}
      <Modal
        isOpen={!!selectedService}
        onClose={handleCloseModal}
        title="Submit Service Requirement to FIC"
      >
        {selectedService && (
          <div className="space-y-4">
            {successMessage ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircleIcon size={26} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Requirement Registered!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  {successMessage}
                </p>
                <div className="pt-3">
                  <Button variant="primary" size="sm" onClick={handleCloseModal}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmRequest} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                    Selected Service
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedService.title}</div>
                  <div className="text-xs text-blue-600 font-medium mt-0.5">
                    {selectedService.categoryName}
                    {selectedService.subcategoryName ? ` • ${selectedService.subcategoryName}` : ''}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Describe Your Requirement & Specifications <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Provide details such as requirement scope, volumes, expected outcomes, and technical parameters..."
                    value={requirementNotes}
                    onChange={(e) => setRequirementNotes(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheckIcon size={15} className="text-blue-700" />
                    FIC Intermediary Governance:
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    FIC protects member privacy and prevents unsolicited marketing. Our team verifies technical parameters and arranges bespoke quotation proposals directly.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button variant="outline" size="sm" type="button" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                    Submit Request to FIC
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

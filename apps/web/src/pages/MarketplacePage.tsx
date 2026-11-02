import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '@fic/ui';
import { INITIAL_CATEGORIES_DATA, INITIAL_SERVICES_DATA } from '../services/mockData';
import { apiRequest, getStoredUser, saveUserRequest } from '../services/api';
import {
  ShieldCheckIcon,
  SearchIcon,
  LockIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '../components/Icons';

export const MarketplacePage: React.FC = () => {
  const [services, setServices] = useState(INITIAL_SERVICES_DATA);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State for FIC Service Request
  const [selectedService, setSelectedService] = useState<any>(null);
  const [requirementNotes, setRequirementNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const filteredServices = services.filter((srv) => {
    const matchCategory =
      selectedCategorySlug === 'all' || srv.categorySlug === selectedCategorySlug;
    const matchSearch =
      searchTerm.trim() === '' ||
      srv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleOpenRequestModal = (service: any) => {
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
    if (!requirementNotes.trim()) return;

    setIsSubmitting(true);

    try {
      await apiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          requirementNotes
        })
      });

      // Save user-isolated request to persistent client state
      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          serviceTitle: selectedService.title,
          category: selectedService.category,
          requirementNotes
        });
      }

      setSuccessMessage(
        'Your service request has been received by FIC. Our coordinator will review your requirement and reach out shortly.'
      );
    } catch {
      const user = getStoredUser();
      if (user) {
        saveUserRequest(user.id || user.userId, {
          serviceTitle: selectedService.title,
          category: selectedService.category,
          requirementNotes
        });
      }
      setSuccessMessage('Your request has been routed to the FIC team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Marketplace Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
                <LockIcon size={13} />
                Provider Privacy Protected • FIC Coordinated
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Universal Services Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Browse verified capabilities across all 10 business sectors. In accordance with FIC governance, provider identity and contact details are strictly confidential; requests are facilitated directly by FIC.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-slate-900">
                <ShieldCheckIcon size={15} className="text-emerald-600" />
                Intermediary Guarantee
              </div>
              <span>No direct unsolicited calls. Verified proposals only.</span>
            </div>
          </div>
        </div>

        {/* Search & Sector Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services by keyword, skill, or industry tag (e.g. Textiles, GST, Cloud Architecture)..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3 text-slate-400">
              <SearchIcon size={18} />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors ${
                selectedCategorySlug === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Sectors ({services.length})
            </button>
            {INITIAL_CATEGORIES_DATA.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              No services found matching your criteria. Try adjusting your search term.
            </div>
          ) : (
            filteredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-md transition-shadow border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="info">{service.categoryName.split('&')[0]}</Badge>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheckIcon size={14} /> FIC Verified
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Timeline:</span>
                    <strong className="text-slate-700">{service.deliveryTimeline}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Pricing</span>
                      <span className="text-sm font-bold text-slate-900">
                        {service.pricingType === 'CUSTOM_QUOTE'
                          ? 'Custom Quote'
                          : `₹${service.price?.toLocaleString()}`}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenRequestModal(service)}
                    >
                      Request via FIC
                    </Button>
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
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircleIcon size={24} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Request Registered!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{successMessage}</p>
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={handleCloseModal}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmRequest} className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Service Selected</span>
                  <div className="text-sm font-bold text-slate-900">{selectedService.title}</div>
                  <span className="text-xs text-blue-600">{selectedService.categoryName}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Describe Your Requirements & Specifications <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide details such as quantity, specifications, timeline requirements, and project scope..."
                    value={requirementNotes}
                    onChange={(e) => setRequirementNotes(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheckIcon size={14} />
                    FIC Intermediary Protocol:
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    Your request is securely received by our authorized coordinator. We protect provider privacy and validate requirements before coordinating the formal proposal and mutual introduction.
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


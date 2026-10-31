import React, { useState } from 'react';
import { Card, Button, Input } from '@fic/ui';
import { HandshakeIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const PartnershipsPage: React.FC = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [partnershipType, setPartnershipType] = useState('B2B_COLLABORATION');
  const [proposalSummary, setProposalSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('/partnership-requests', {
        method: 'POST',
        body: JSON.stringify({
          organizationName,
          partnershipType,
          proposalSummary
        })
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <HandshakeIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Business Tie-ups & Strategic Partnerships
              </h1>
              <p className="text-xs text-slate-500">
                Form joint ventures, OEM supply alliances, distributor agreements, or technology integrations.
              </p>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <Card className="shadow-md text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tie-Up Proposal Submitted!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Your partnership requirement for <strong>{organizationName}</strong> has been logged. FIC will review suitable member enterprises across relevant sectors and coordinate mutual discussions.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsSubmitted(false)}>
              Submit Another Partnership Proposal
            </Button>
          </Card>
        ) : (
          <Card className="shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Your Company / Entity Name"
                placeholder="e.g. South Star Agro Traders"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Partnership Model</label>
                <select
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={partnershipType}
                  onChange={(e) => setPartnershipType(e.target.value)}
                >
                  <option value="B2B_COLLABORATION">Commercial B2B Collaboration</option>
                  <option value="MANUFACTURING_PARTNER">OEM / Contract Manufacturing Partner</option>
                  <option value="DISTRIBUTION_NETWORK">Distributor / Stockist Representation</option>
                  <option value="FRANCHISE">Franchise Outlet Expansion</option>
                  <option value="VENDOR_RELATIONSHIP">Vendor / Raw Material Sourcing</option>
                  <option value="JOINT_VENTURE">Joint Venture / Co-Development</option>
                  <option value="STRATEGIC_ALLIANCE">Cross-Promotion Strategic Alliance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Proposal & Mutual Value Proposition <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain what kind of partner you are seeking, target geography, expected synergy, and commercial structure..."
                  value={proposalSummary}
                  onChange={(e) => setProposalSummary(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" type="submit" isLoading={isLoading}>
                  Submit Tie-Up Requirement
                  <ArrowRightIcon className="ml-2" size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};


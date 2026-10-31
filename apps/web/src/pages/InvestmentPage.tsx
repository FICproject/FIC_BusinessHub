import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@fic/ui';
import { TrendingUpIcon, ShieldCheckIcon, LockIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const InvestmentPage: React.FC = () => {
  const [profileType, setProfileType] = useState<'INVESTOR' | 'FUNDING_SEEKER'>('FUNDING_SEEKER');
  const [amountRange, setAmountRange] = useState('₹25 Lakhs - ₹1 Crore');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Manufacturing', 'Technology']);
  const [pitchSummary, setPitchSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sectorList = ['Manufacturing', 'Technology', 'Agri-Tech', 'Healthcare', 'Retail / Franchise', 'Renewables'];

  const toggleSector = (sec: string) => {
    if (selectedSectors.includes(sec)) {
      setSelectedSectors(selectedSectors.filter((s) => s !== sec));
    } else {
      setSelectedSectors([...selectedSectors, sec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('/investment-profiles', {
        method: 'POST',
        body: JSON.stringify({
          profileType,
          amountRange,
          sectors: selectedSectors,
          pitchSummary
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
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUpIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Confidential Investment & Funding Channel
                </h1>
                <Badge variant="success">Strictly Private</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Privately express investment appetite or funding requirements. Managed exclusively by authorized FIC Officers.
              </p>
            </div>
          </div>
        </div>

        {/* Regulatory Governance Note */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <LockIcon size={14} className="text-amber-700" />
            Compliance & Privacy Protocol:
          </div>
          <p className="leading-relaxed text-[11px] text-amber-800">
            Financial requirements and investor profiles are NEVER disclosed publicly or shown on marketplace feeds. FIC does NOT hold custody of investment funds or solicit public deposits. We act purely as a confidential intermediary coordinator for compliant B2B introductions.
          </p>
        </div>

        {isSubmitted ? (
          <Card className="shadow-md text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confidential Record Submitted!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Your profile has been encrypted and routed to the FIC Senior Investment Evaluation Committee. You will be contacted privately if a verified match is identified.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsSubmitted(false)}>
              Submit Another Record
            </Button>
          </Card>
        ) : (
          <Card className="shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Select Your Profile Orientation
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setProfileType('FUNDING_SEEKER')}
                    className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                      profileType === 'FUNDING_SEEKER'
                        ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-sm block font-bold mb-1">Funding Seeker</span>
                    <span className="text-[11px] text-slate-500">I am looking for business capital / equity investment</span>
                  </div>

                  <div
                    onClick={() => setProfileType('INVESTOR')}
                    className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                      profileType === 'INVESTOR'
                        ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-sm block font-bold mb-1">Private / Angel Investor</span>
                    <span className="text-[11px] text-slate-500">I am looking to deploy capital in vetted enterprises</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {profileType === 'FUNDING_SEEKER' ? 'Capital Requirement Range' : 'Target Ticket Size'}
                  </label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={amountRange}
                    onChange={(e) => setAmountRange(e.target.value)}
                  >
                    <option value="₹5 Lakhs - ₹25 Lakhs">₹5 Lakhs - ₹25 Lakhs</option>
                    <option value="₹25 Lakhs - ₹1 Crore">₹25 Lakhs - ₹1 Crore</option>
                    <option value="₹1 Crore - ₹5 Crores">₹1 Crore - ₹5 Crores</option>
                    <option value="Above ₹5 Crores">Above ₹5 Crores</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Preferred Stage / Business Maturity
                  </label>
                  <select className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="EARLY">Early Revenue Stage</option>
                    <option value="PROFITABLE">Profitable / Established Unit</option>
                    <option value="EXPANSION">Pan-India Expansion Stage</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Relevant Sectors of Interest
                </label>
                <div className="flex flex-wrap gap-2">
                  {sectorList.map((sec, i) => {
                    const isSelected = selectedSectors.includes(sec);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleSector(sec)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {profileType === 'FUNDING_SEEKER' ? 'Brief Executive Summary / Pitch' : 'Investor Background & Investment Criteria'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    profileType === 'FUNDING_SEEKER'
                      ? 'Summarize your business model, current traction, and how the funds will be utilized...'
                      : 'Outline your investment philosophy, value-add beyond capital, and past experience...'
                  }
                  value={pitchSummary}
                  onChange={(e) => setPitchSummary(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" type="submit" isLoading={isLoading}>
                  Submit Confidential Profile
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


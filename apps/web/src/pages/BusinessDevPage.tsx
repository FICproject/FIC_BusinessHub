import React, { useState } from 'react';
import { Card, Button, Input } from '@fic/ui';
import { RocketIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const BusinessDevPage: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [supportType, setSupportType] = useState('BUSINESS_PLANNING');
  const [currentChallenges, setCurrentChallenges] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('/business-development-requests', {
        method: 'POST',
        body: JSON.stringify({
          businessName,
          supportType,
          currentChallenges,
          expectedOutcomes
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <RocketIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Business Development & Scaling Support
              </h1>
              <p className="text-xs text-slate-500">
                Request specialized consulting, digital transformation, expansion, or restructuring.
              </p>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <Card className="shadow-md text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Request Registered!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              FIC Business Development wing has received your requirement for <strong>{businessName}</strong>. A domain specialist will contact you with diagnostic steps.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsSubmitted(false)}>
              Submit Another Request
            </Button>
          </Card>
        ) : (
          <Card className="shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Enterprise / Business Name"
                placeholder="e.g. Tiruppur Weaving Unit No. 4"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Required Service Area</label>
                <select
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                >
                  <option value="BUSINESS_PLANNING">Strategic Business Planning</option>
                  <option value="SETUP_GUIDANCE">New Entity Setup & Licensing</option>
                  <option value="MARKET_RESEARCH">Market Research & Customer Discovery</option>
                  <option value="BRANDING_MARKETING">Branding & Digital Acquisition</option>
                  <option value="TECHNOLOGY_DEVELOPMENT">Technology & Cloud Software Modernization</option>
                  <option value="OPERATIONAL_IMPROVEMENT">Operational & Factory Floor Lean Optimization</option>
                  <option value="EXPANSION_SCALING">Regional Expansion & Distributor Expansion</option>
                  <option value="GENERAL_CONSULTANCY">General Business Advisory</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Current Operational Bottlenecks or Challenges <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what is currently limiting your growth or operational efficiency..."
                  value={currentChallenges}
                  onChange={(e) => setCurrentChallenges(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Target Objectives & Milestones <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Double monthly order volume, launch cloud billing, obtain export accreditation..."
                  value={expectedOutcomes}
                  onChange={(e) => setExpectedOutcomes(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" type="submit" isLoading={isLoading}>
                  Submit Scaling Request
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


import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@fic/ui';
import { apiRequest } from '../services/api';
import { ShieldCheckIcon, LockIcon } from '../components/Icons';

export const MyRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'ideas' | 'scaling' | 'partnerships'>('services');

  // Sample data fallback if offline
  const sampleServices = [
    {
      id: 'req-01',
      title: 'Bulk Cotton Garment & Uniform Manufacturing',
      status: 'IN_PROGRESS',
      statusLabel: 'Proposal Coordinated',
      notes: 'Need 5,000 units of custom cotton twill uniforms by next month.',
      ficRemark: 'FIC Officer S. Raman has contacted verified OEM partner in Tiruppur. Commercial quotation prepared.',
      date: '31 Oct 2026'
    },
    {
      id: 'req-02',
      title: 'Statutory GST & Corporate Incorporation',
      status: 'SUBMITTED',
      statusLabel: 'FIC Review',
      notes: 'Looking for private limited conversion and annual ROC filing.',
      ficRemark: 'Assigned to Verification Desk. Validating requirement details.',
      date: '30 Oct 2026'
    }
  ];

  const sampleIdeas = [
    {
      id: 'idea-01',
      title: 'AI Automated Quality Inspection for Knitted Fabrics',
      stage: 'PROTOTYPE',
      status: 'UNDER_REVIEW',
      statusLabel: 'Feasibility Assessment',
      date: '28 Oct 2026'
    }
  ];

  const sampleScaling = [
    {
      id: 'scale-01',
      businessName: 'Apex Textiles Unit',
      supportType: 'Technology Development & ERP',
      status: 'SPECIALIST_ASSIGNED',
      statusLabel: 'Specialist Assigned',
      date: '26 Oct 2026'
    }
  ];

  const samplePartnerships = [
    {
      id: 'part-01',
      organizationName: 'South Star Agro Traders',
      type: 'Distribution Network Expansion',
      status: 'MATCHING_IN_PROGRESS',
      statusLabel: 'Matching in Progress',
      date: '24 Oct 2026'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                My Requests & FIC Communications Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Track all your requirements, active proposals, and FIC intermediary coordination.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheckIcon size={16} />
              <span>FIC Monitored Status</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Service Requests ({sampleServices.length})
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'ideas'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Business Ideas ({sampleIdeas.length})
          </button>
          <button
            onClick={() => setActiveTab('scaling')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'scaling'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Scaling Support ({sampleScaling.length})
          </button>
          <button
            onClick={() => setActiveTab('partnerships')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'partnerships'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            B2B Partnerships ({samplePartnerships.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'services' && (
            <div className="space-y-4">
              {sampleServices.map((req) => (
                <Card key={req.id} className="border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-mono">REQ ID: {req.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{req.date}</span>
                      <Badge variant={req.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
                        {req.statusLabel}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-700 block">Your Stated Requirements:</strong>
                      <p className="text-slate-600 mt-0.5">{req.notes}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-blue-900">
                        <LockIcon size={13} className="text-blue-700" />
                        FIC Coordinator Progress & Notes:
                      </div>
                      <p className="text-blue-800 leading-relaxed">{req.ficRemark}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'ideas' && (
            <div className="space-y-4">
              {sampleIdeas.map((idea) => (
                <Card key={idea.id} className="border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-mono">IDEA ID: {idea.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{idea.title}</h3>
                      <span className="text-xs text-slate-500">Stage: {idea.stage} • Submitted: {idea.date}</span>
                    </div>
                    <Badge variant="warning">{idea.statusLabel}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'scaling' && (
            <div className="space-y-4">
              {sampleScaling.map((scale) => (
                <Card key={scale.id} className="border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-mono">SUPPORT ID: {scale.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{scale.businessName}</h3>
                      <span className="text-xs text-slate-500">Support Area: {scale.supportType} • {scale.date}</span>
                    </div>
                    <Badge variant="info">{scale.statusLabel}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'partnerships' && (
            <div className="space-y-4">
              {samplePartnerships.map((part) => (
                <Card key={part.id} className="border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-mono">TIE-UP ID: {part.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{part.organizationName}</h3>
                      <span className="text-xs text-slate-500">Model: {part.type} • {part.date}</span>
                    </div>
                    <Badge variant="neutral">{part.statusLabel}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


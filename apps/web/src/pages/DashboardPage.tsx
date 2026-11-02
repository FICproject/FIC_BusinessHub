import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@fic/ui';
import { getStoredUser, apiRequest, getUserRequests, AuthenticatedUser } from '../services/api';
import {
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  LightbulbIcon,
  RocketIcon,
  TrendingUpIcon,
  HandshakeIcon,
  ArrowRightIcon,
  LockIcon
} from '../components/Icons';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);

    // Load active requests strictly for the authenticated user
    const loadData = async () => {
      const res = await apiRequest('/connections/me');
      if (res?.data && Array.isArray(res.data)) {
        setActiveRequests(res.data);
      } else {
        // Fallback user-isolated requests
        const userSpecific = getUserRequests(stored.id || stored.userId);
        setActiveRequests(userSpecific);
      }
    };

    loadData();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="bg-slate-100/70 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome & Member Status Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {user.subcategories && user.subcategories.length > 0 ? (
                  user.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md"
                    >
                      {sub}
                    </span>
                  ))
                ) : user.subCategory ? (
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                    {user.subCategory}
                  </span>
                ) : (
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                    VERIFIED MEMBER
                  </span>
                )}
                <Badge variant={user.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>
                  {user.accountStatus || 'Active'} Account
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user.fullName || 'Member'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your FIC Business Hub ecosystem dashboard is fully active and verified.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <span className="text-amber-800 font-bold block">
                  {user.membershipPlan || '1st Year Membership'}
                </span>
                <span className="text-amber-600 text-[11px]">
                  {user.membershipExpiryDate || 'Valid for 365 Days (₹99)'}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2">
                <ShieldCheckIcon size={18} className="text-emerald-600" />
                <div>
                  <span className="text-emerald-900 font-bold block">
                    {user.isKycApproved ? 'KYC Verified' : 'KYC Under Review'}
                  </span>
                  <span className="text-emerald-600 text-[11px]">
                    {user.isKycApproved ? 'Sector Approved' : 'Submitted for Approval'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Active FIC Requests</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{activeRequests.length}</div>
            <span className="text-[11px] text-blue-600 font-medium mt-1 block">In FIC Coordination</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Submitted Ideas</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">1</div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Review Scheduled</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Scaling Support</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">Available</div>
            <span className="text-[11px] text-purple-600 font-medium mt-1 block">Specialists Ready</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Confidential Channel</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">Active</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Private Investments</span>
          </div>
        </div>

        {/* Quick Opportunity Launcher */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Opportunity Actions & Services
            </h3>
            <span className="text-xs text-slate-400">Moderated by FIC Intermediary</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Link to="/marketplace">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center space-y-2 cursor-pointer h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <BriefcaseIcon size={20} />
                </div>
                <strong className="text-xs text-slate-900 block font-semibold">Browse Marketplace</strong>
                <span className="text-[11px] text-slate-500 leading-tight">Universal verified services</span>
              </div>
            </Link>

            <Link to="/business-ideas">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all text-center space-y-2 cursor-pointer h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <LightbulbIcon size={20} />
                </div>
                <strong className="text-xs text-slate-900 block font-semibold">Submit Business Idea</strong>
                <span className="text-[11px] text-slate-500 leading-tight">Incubation & validation</span>
              </div>
            </Link>

            <Link to="/business-development">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all text-center space-y-2 cursor-pointer h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <RocketIcon size={20} />
                </div>
                <strong className="text-xs text-slate-900 block font-semibold">Business Scaling</strong>
                <span className="text-[11px] text-slate-500 leading-tight">Technology & expansion</span>
              </div>
            </Link>

            <Link to="/investment">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-center space-y-2 cursor-pointer h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUpIcon size={20} />
                </div>
                <strong className="text-xs text-slate-900 block font-semibold">Investment & Funding</strong>
                <span className="text-[11px] text-slate-500 leading-tight">Private syndicates</span>
              </div>
            </Link>

            <Link to="/partnerships">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition-all text-center space-y-2 cursor-pointer h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                  <HandshakeIcon size={20} />
                </div>
                <strong className="text-xs text-slate-900 block font-semibold">B2B Partnerships</strong>
                <span className="text-[11px] text-slate-500 leading-tight">Tie-ups & distributors</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Active Requests Tracker & FIC Bulletin */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Requests */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Active Service Requests & Coordination
                </h3>
                <span className="text-xs text-slate-500">Live tracker for your requirements</span>
              </div>
              <Link to="/my-requests">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {activeRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <p>No active service requests submitted yet for this account.</p>
                <Link to="/marketplace" className="text-blue-600 font-bold hover:underline inline-block">
                  Browse Marketplace to submit your first request &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeRequests.map((req, idx) => (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{req.serviceTitle || req.title}</h4>
                      <span className="text-xs text-slate-500">Requested: {req.date || 'Active'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={req.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
                        {req.statusText || req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <LockIcon size={14} className="text-blue-600 shrink-0" />
              <span>Provider communication is coordinated by FIC Officers to maintain privacy and agreement terms.</span>
            </div>
          </div>

          {/* FIC Opportunity Bulletin */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                FIC Opportunity Bulletin
              </h3>
              <Badge variant="success">Verified</Badge>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 block font-semibold">Universal Discovery Enabled</strong>
                <p className="text-slate-600 leading-relaxed">
                  As an approved member, you can browse listings across all 10 business sectors regardless of your primary category.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 block font-semibold">Tiruppur Textile OEM Tie-Up</strong>
                <p className="text-slate-600 leading-relaxed">
                  Export-grade uniform stitching capacity open for franchise chains and school suppliers through FIC.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 block font-semibold">Strict Regulatory Standards</strong>
                <p className="text-slate-600 leading-relaxed">
                  FIC does not hold custody of investment funds. Financial expressions are strictly confidential introduction requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

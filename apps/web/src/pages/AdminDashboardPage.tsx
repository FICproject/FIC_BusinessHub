import React, { useState, useEffect } from 'react';
import {
  getAdminWalletsData,
  adminApproveReferralReward,
  adminRejectReferralReward,
  adminAdjustWallet,
  apiRequest,
  fetchPlatformPricingConfig,
  IReferral,
  IMemberWallet,
  IWalletTransaction
} from '../services/api';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  SearchIcon,
  ArrowRightIcon,
  UserIcon,
  TrendingUpIcon
} from '../components/Icons';

export interface AdminFundingItem {
  _id?: string;
  id?: string;
  refNumber: string;
  userId: string;
  businessName: string;
  businessType: string;
  industry: string;
  location: {
    country: string;
    state: string;
    district?: string;
    city: string;
  };
  businessStage: string;
  fundingAmount: number;
  fundingPurpose: string[];
  useOfFundsExplanation: string;
  currentAnnualRevenue?: string;
  businessDescription: string;
  status: string;
  submittedDate?: string;
  createdAt?: string;
  latestFicUpdate: string;
  whatHappensNext: string;
  updateHistory: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  internalNotes?: {
    note: string;
    createdBy: string;
    createdAt: string | Date;
  }[];
}

export interface AdminInvestorItem {
  _id?: string;
  id?: string;
  refNumber: string;
  userId: string;
  investorType: string;
  investorName: string;
  country: string;
  stateCity: string;
  investorProfile: string;
  totalCapacity: string;
  preferredTicketSize: string;
  preferredSectors: string[];
  preferredStages: string[];
  investmentType: string;
  investmentExperience?: string;
  additionalPreferences?: string;
  status: string;
  submittedDate?: string;
  createdAt?: string;
  latestFicUpdate: string;
  whatHappensNext: string;
  updateHistory: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  internalNotes?: {
    note: string;
    createdBy: string;
    createdAt: string | Date;
  }[];
}

const FUNDING_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Request Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'INFO_REQUIRED', label: 'Information Required' },
  { value: 'VERIFICATION_IN_PROGRESS', label: 'Business Verification in Progress' },
  { value: 'ASSESSMENT_IN_PROGRESS', label: 'Assessment in Progress' },
  { value: 'REVIEW_COMPLETED', label: 'Review Completed' },
  { value: 'DISCUSSION_REQUESTED', label: 'Discussion Requested' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED', label: 'Closed' }
];

const INVESTOR_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Profile Submitted' },
  { value: 'VERIFICATION_IN_PROGRESS', label: 'Verification in Progress' },
  { value: 'INFO_REQUIRED', label: 'Information Required' },
  { value: 'VERIFICATION_COMPLETED', label: 'Verification Completed' },
  { value: 'UNDER_REVIEW', label: 'Profile Under Review' },
  { value: 'DISCUSSION_REQUESTED', label: 'Discussion Requested' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED', label: 'Closed' }
];

const formatINRShort = (amount: number): string => {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (amount >= 100000) {
    const lk = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lk} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const INITIAL_ADMIN_FUNDING: AdminFundingItem[] = [];

const INITIAL_ADMIN_INVESTORS: AdminInvestorItem[] = [];

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'referrals' | 'wallets' | 'renewals' | 'investment'>('referrals');
  const [renewalFee, setRenewalFee] = useState<number>(5999);

  useEffect(() => {
    fetchPlatformPricingConfig().then((cfg) => {
      if (cfg?.renewalMembershipFee) setRenewalFee(cfg.renewalMembershipFee);
    });
  }, []);

  // Live Admin Data
  const [wallets, setWallets] = useState<IMemberWallet[]>([]);
  const [transactions, setTransactions] = useState<IWalletTransaction[]>([]);
  const [referrals, setReferrals] = useState<IReferral[]>([]);

  // Investment State
  const [investSubTab, setInvestSubTab] = useState<'funding' | 'investor'>('funding');
  const [fundingRequests, setFundingRequests] = useState<AdminFundingItem[]>([]);
  const [investorProfiles, setInvestorProfiles] = useState<AdminInvestorItem[]>([]);
  const [fundingStatusFilter, setFundingStatusFilter] = useState<string>('ALL');
  const [fundingIndustryFilter, setFundingIndustryFilter] = useState<string>('ALL');
  const [fundingSearch, setFundingSearch] = useState<string>('');
  const [investorStatusFilter, setInvestorStatusFilter] = useState<string>('ALL');
  const [investorTypeFilter, setInvestorTypeFilter] = useState<string>('ALL');
  const [investorSearch, setInvestorSearch] = useState<string>('');

  // Editing Investment Item Modal
  const [editingInvestment, setEditingInvestment] = useState<{
    type: 'FUNDING' | 'INVESTOR';
    item: AdminFundingItem | AdminInvestorItem;
  } | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editLatestUpdate, setEditLatestUpdate] = useState<string>('');
  const [editWhatNext, setEditWhatNext] = useState<string>('');
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [isSavingInvestment, setIsSavingInvestment] = useState<boolean>(false);

  // Filters
  const [referralSourceFilter, setReferralSourceFilter] = useState<'ALL' | 'REFERRED' | 'ORGANIC'>('ALL');
  const [rewardStatusFilter, setRewardStatusFilter] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState<string>('');

  // Adjustment Modal
  const [adjustTarget, setAdjustTarget] = useState<IMemberWallet | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const reloadData = async () => {
    const data = getAdminWalletsData();
    setWallets(data.wallets);
    setTransactions(data.transactions);
    setReferrals(data.referrals);

    // Load Investment Data from Backend or localStorage
    try {
      const fundResp = await apiRequest('/investment/admin/funding');
      if (fundResp?.success && Array.isArray(fundResp.data) && fundResp.data.length > 0) {
        setFundingRequests(fundResp.data);
        localStorage.setItem('fic_admin_funding_requests', JSON.stringify(fundResp.data));
      } else {
        const local = localStorage.getItem('fic_admin_funding_requests');
        setFundingRequests(local ? JSON.parse(local) : INITIAL_ADMIN_FUNDING);
      }
    } catch {
      const local = localStorage.getItem('fic_admin_funding_requests');
      setFundingRequests(local ? JSON.parse(local) : INITIAL_ADMIN_FUNDING);
    }

    try {
      const invResp = await apiRequest('/investment/admin/investor');
      if (invResp?.success && Array.isArray(invResp.data) && invResp.data.length > 0) {
        setInvestorProfiles(invResp.data);
        localStorage.setItem('fic_admin_investor_profiles', JSON.stringify(invResp.data));
      } else {
        const local = localStorage.getItem('fic_admin_investor_profiles');
        setInvestorProfiles(local ? JSON.parse(local) : INITIAL_ADMIN_INVESTORS);
      }
    } catch {
      const local = localStorage.getItem('fic_admin_investor_profiles');
      setInvestorProfiles(local ? JSON.parse(local) : INITIAL_ADMIN_INVESTORS);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Filtered Referrals
  const filteredReferrals = referrals.filter((r) => {
    if (referralSourceFilter !== 'ALL' && r.referralSource !== referralSourceFilter) return false;
    if (rewardStatusFilter !== 'ALL' && r.rewardStatus !== rewardStatusFilter) return false;
    if (searchMember.trim()) {
      const q = searchMember.toLowerCase();
      const matchName = (r.referredName || '').toLowerCase().includes(q);
      const matchEmail = (r.referredEmail || '').toLowerCase().includes(q);
      const matchCode = (r.referralCode || '').toLowerCase().includes(q);
      const matchReferrer = (r.referrerName || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCode && !matchReferrer) return false;
    }
    return true;
  });

  // Filtered Wallets
  const filteredWallets = wallets.filter((w) => {
    if (searchMember.trim()) {
      const q = searchMember.toLowerCase();
      return w.userId.toLowerCase().includes(q) || w.walletId.toLowerCase().includes(q);
    }
    return true;
  });

  // Handle Approve Reward
  const handleApproveReward = (refId: string) => {
    const ok = adminApproveReferralReward(refId);
    if (ok) {
      reloadData();
      showToast('Referral reward of ₹500 approved and credited to referrer wallet.');
    }
  };

  // Handle Reject Reward
  const handleRejectReward = (refId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Ineligible referral requirements.';
    const ok = adminRejectReferralReward(refId, reason);
    if (ok) {
      reloadData();
      showToast('Referral reward rejected.');
    }
  };

  // Handle Wallet Adjustment Submit
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget || !adjustAmount || !adjustReason) return;
    const num = Number(adjustAmount);
    if (!num || num <= 0) return;

    const ok = adminAdjustWallet(adjustTarget.userId, adjustDirection, num, adjustReason);
    if (ok) {
      setAdjustTarget(null);
      setAdjustAmount('');
      setAdjustReason('');
      reloadData();
      showToast(`Wallet adjusted: ${adjustDirection} ₹${num.toLocaleString('en-IN')}`);
    } else {
      alert('Adjustment failed. Insufficient balance for debit.');
    }
  };

  // Renewals calculation
  const renewalTransactions = transactions.filter(
    (t) => t.transactionType === 'MEMBERSHIP_RENEWAL'
  );

  // Investment Handlers
  const handleOpenInvestmentModal = (
    type: 'FUNDING' | 'INVESTOR',
    item: AdminFundingItem | AdminInvestorItem
  ) => {
    setEditingInvestment({ type, item });
    setEditStatus(item.status);
    setEditLatestUpdate(item.latestFicUpdate || '');
    setEditWhatNext(item.whatHappensNext || '');
    setNewInternalNote('');
  };

  const handleSaveInvestmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment) return;
    setIsSavingInvestment(true);

    const { type, item } = editingInvestment;
    const targetId = item._id || item.refNumber;
    const endpoint =
      type === 'FUNDING'
        ? `/investment/admin/funding/${targetId}/status`
        : `/investment/admin/investor/${targetId}/status`;

    const payload = {
      status: editStatus,
      latestFicUpdate: editLatestUpdate,
      whatHappensNext: editWhatNext,
      internalNote: newInternalNote.trim() ? newInternalNote.trim() : undefined
    };

    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    try {
      await apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch {
      // offline fallback
    }

    if (type === 'FUNDING') {
      const updated = fundingRequests.map((f) => {
        if (f.refNumber === item.refNumber || f._id === item._id) {
          const notes = [...(f.internalNotes || [])];
          if (newInternalNote.trim()) {
            notes.push({
              note: newInternalNote.trim(),
              createdBy: 'FIC Admin Staff',
              createdAt: new Date().toISOString()
            });
          }
          const history = [...(f.updateHistory || [])];
          if (editLatestUpdate || editStatus !== f.status) {
            history.unshift({
              date: todayFormatted,
              status: editStatus,
              update: editLatestUpdate || f.latestFicUpdate,
              updatedBy: 'FIC Deal Desk'
            });
          }
          return {
            ...f,
            status: editStatus,
            latestFicUpdate: editLatestUpdate || f.latestFicUpdate,
            whatHappensNext: editWhatNext || f.whatHappensNext,
            updateHistory: history,
            internalNotes: notes
          };
        }
        return f;
      });
      setFundingRequests(updated);
      localStorage.setItem('fic_admin_funding_requests', JSON.stringify(updated));
    } else {
      const updated = investorProfiles.map((inv) => {
        if (inv.refNumber === item.refNumber || inv._id === item._id) {
          const notes = [...(inv.internalNotes || [])];
          if (newInternalNote.trim()) {
            notes.push({
              note: newInternalNote.trim(),
              createdBy: 'FIC Admin Staff',
              createdAt: new Date().toISOString()
            });
          }
          const history = [...(inv.updateHistory || [])];
          if (editLatestUpdate || editStatus !== inv.status) {
            history.unshift({
              date: todayFormatted,
              status: editStatus,
              update: editLatestUpdate || inv.latestFicUpdate,
              updatedBy: 'FIC Investment Desk'
            });
          }
          return {
            ...inv,
            status: editStatus,
            latestFicUpdate: editLatestUpdate || inv.latestFicUpdate,
            whatHappensNext: editWhatNext || inv.whatHappensNext,
            updateHistory: history,
            internalNotes: notes
          };
        }
        return inv;
      });
      setInvestorProfiles(updated);
      localStorage.setItem('fic_admin_investor_profiles', JSON.stringify(updated));
    }

    setIsSavingInvestment(false);
    setEditingInvestment(null);
    showToast(
      type === 'FUNDING'
        ? `Funding request ${item.refNumber} status updated.`
        : `Investor profile ${item.refNumber} status updated.`
    );
  };

  // Filtered Funding Requests
  const filteredFundingRequests = fundingRequests.filter((f) => {
    if (fundingStatusFilter !== 'ALL' && f.status !== fundingStatusFilter) return false;
    if (fundingIndustryFilter !== 'ALL' && f.industry !== fundingIndustryFilter) return false;
    if (fundingSearch.trim()) {
      const q = fundingSearch.toLowerCase();
      const matchRef = f.refNumber.toLowerCase().includes(q);
      const matchName = f.businessName.toLowerCase().includes(q);
      const matchCity = (f.location?.city || '').toLowerCase().includes(q);
      if (!matchRef && !matchName && !matchCity) return false;
    }
    return true;
  });

  // Filtered Investor Profiles
  const filteredInvestorProfiles = investorProfiles.filter((inv) => {
    if (investorStatusFilter !== 'ALL' && inv.status !== investorStatusFilter) return false;
    if (investorTypeFilter !== 'ALL' && inv.investorType !== investorTypeFilter) return false;
    if (investorSearch.trim()) {
      const q = investorSearch.toLowerCase();
      const matchRef = inv.refNumber.toLowerCase().includes(q);
      const matchName = inv.investorName.toLowerCase().includes(q);
      const matchCity = (inv.stateCity || '').toLowerCase().includes(q);
      if (!matchRef && !matchName && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto text-[#FCFAF6]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-[#FCFAF6] px-5 py-3.5 rounded-xl shadow-2xl border border-[#D99B43] flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircleIcon size={20} className="text-[#27AE60] shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#29302D] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#D99B43]/15 text-[#D99B43] text-xs font-bold uppercase tracking-wider mb-1">
            <span>FIC Executive Oversight Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FCFAF6]">
            Governance, KYC & Universal Wallet Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Audit platform financial transactions, review referral attributions, approve rewards, and monitor membership renewal revenue.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-[#1E2421] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'referrals'
                ? 'bg-[#D99B43] text-[#1E2421]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            KYC & Referrals
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'wallets'
                ? 'bg-[#D99B43] text-[#1E2421]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Wallet Management
          </button>
          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'renewals'
                ? 'bg-[#D99B43] text-[#1E2421]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Membership Renewals
          </button>
          <button
            onClick={() => setActiveTab('investment')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'investment'
                ? 'bg-[#D99B43] text-[#1E2421]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Investment & Funding
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: KYC & REFERRAL ATTRIBUTION (SECTION 11)
         ======================================================== */}
      {activeTab === 'referrals' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-[#29302D] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {[
                { key: 'ALL', label: 'All Registrations' },
                { key: 'REFERRED', label: 'Referred Members' },
                { key: 'ORGANIC', label: 'Organic Members' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setReferralSourceFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    referralSourceFilter === f.key
                      ? 'bg-[#D99B43] text-[#1E2421]'
                      : 'bg-[#1E2421] text-slate-300 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <select
                value={rewardStatusFilter}
                onChange={(e) => setRewardStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E2421] text-slate-300 border border-white/10"
              >
                <option value="ALL">All Reward Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="CREDITED">Credited</option>
                <option value="PENDING_ELIGIBILITY">Pending Eligibility</option>
                <option value="REJECTED">Ineligible / Rejected</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member, email, code..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#1E2421] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#D99B43]"
              />
            </div>
          </div>

          {/* Referrals & KYC Table */}
          <div className="bg-[#29302D] border border-white/10 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-200">
                <thead className="bg-[#1E2421] border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="px-4 py-3.5">Referred Member</th>
                    <th className="px-4 py-3.5">Source</th>
                    <th className="px-4 py-3.5">Referral Code</th>
                    <th className="px-4 py-3.5">Referrer Details</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">KYC Status</th>
                    <th className="px-4 py-3.5">Reward</th>
                    <th className="px-4 py-3.5">Reward Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No records match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((r) => (
                      <tr key={r.referralId} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-white block">{r.referredName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{r.referredEmail}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              r.referralSource === 'REFERRED'
                                ? 'bg-[#8064A9]/20 text-[#D99B43] border border-[#D99B43]/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {r.referralSource}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          {r.referralCode || 'N/A'}
                        </td>
                        <td className="px-4 py-3.5">
                          {r.referrerName ? (
                            <div>
                              <span className="font-bold text-white block">{r.referrerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{r.referrerUserId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">None (Organic)</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              r.paymentStatus === 'PAID'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-amber-900/50 text-amber-300'
                            }`}
                          >
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              r.kycStatus === 'VERIFIED'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-amber-900/50 text-amber-300'
                            }`}
                          >
                            {r.kycStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          ₹{r.rewardAmount}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              r.rewardStatus === 'CREDITED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : r.rewardStatus === 'PENDING_APPROVAL'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {r.rewardStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {r.rewardStatus === 'PENDING_APPROVAL' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveReward(r.referralId)}
                                className="px-2.5 py-1 rounded bg-[#27AE60] hover:bg-[#219653] text-white font-bold text-[11px] transition-colors"
                              >
                                Approve Reward
                              </button>
                              <button
                                onClick={() => handleRejectReward(r.referralId)}
                                className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {r.rewardStatus === 'CREDITED' && (
                            <span className="text-[11px] text-emerald-400 font-bold">✓ Credited</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: WALLET MANAGEMENT (SECTION 12)
         ======================================================== */}
      {activeTab === 'wallets' && (
        <div className="space-y-5">
          {/* Wallet Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Active Wallets</span>
              <span className="text-2xl font-black text-white block mt-1">{wallets.length}</span>
            </div>
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Total Funds In System</span>
              <span className="text-2xl font-black text-[#D99B43] block mt-1">
                ₹{wallets.reduce((s, w) => s + (w.availableBalance || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Total Added By Members</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">
                ₹{wallets.reduce((s, w) => s + (w.totalAdded || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Total Referral Rewards</span>
              <span className="text-2xl font-black text-purple-400 block mt-1">
                ₹{wallets.reduce((s, w) => s + (w.totalReferralEarnings || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Wallets Table */}
          <div className="bg-[#29302D] border border-white/10 rounded-2xl overflow-hidden shadow-md">
            <div className="px-4 py-3 bg-[#1E2421] border-b border-white/10 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-300">Member Wallet Ledgers</span>
              <input
                type="text"
                placeholder="Search member user ID..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#29302D] border border-white/10 rounded-lg text-white w-56 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-200">
                <thead className="bg-[#1E2421] border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="px-4 py-3">Member User ID</th>
                    <th className="px-4 py-3">Wallet ID</th>
                    <th className="px-4 py-3 text-right">Available Balance</th>
                    <th className="px-4 py-3 text-right">Pending Amount</th>
                    <th className="px-4 py-3 text-right">Total Added</th>
                    <th className="px-4 py-3 text-right">Total Withdrawn</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredWallets.map((w) => (
                    <tr key={w.walletId} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono font-bold text-white">{w.userId}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{w.walletId}</td>
                      <td className="px-4 py-3 text-right font-black text-[#D99B43] text-sm">
                        ₹{w.availableBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-400">
                        ₹{w.pendingBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400">
                        ₹{w.totalAdded.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        ₹{w.totalWithdrawn.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-900/40 text-emerald-300">
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setAdjustTarget(w)}
                          className="px-3 py-1 rounded bg-[#1E2421] hover:bg-[#D99B43] hover:text-[#1E2421] text-[#D99B43] border border-[#D99B43]/30 text-xs font-bold transition-all"
                        >
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: MEMBERSHIP RENEWALS (SECTION 13)
         ======================================================== */}
      {activeTab === 'renewals' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Renewed Members</span>
              <span className="text-2xl font-black text-white block mt-1">
                {renewalTransactions.length > 0 ? renewalTransactions.length : 1}
              </span>
            </div>
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Renewal Pricing Policy</span>
              <span className="text-2xl font-black text-[#D99B43] block mt-1">₹{renewalFee.toLocaleString('en-IN')}/yr</span>
            </div>
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Wallet-Based Renewals</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">
                {renewalTransactions.length}
              </span>
            </div>
            <div className="bg-[#29302D] border border-white/10 rounded-2xl p-5">
              <span className="text-xs text-slate-400 uppercase font-bold block">Total Renewal Revenue</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">
                ₹{(renewalTransactions.length * renewalFee).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-[#29302D] border border-white/10 rounded-2xl overflow-hidden shadow-md">
            <div className="px-4 py-3 bg-[#1E2421] border-b border-white/10">
              <span className="font-bold text-xs text-slate-300">Renewal Transactions Audit Log</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-200">
                <thead className="bg-[#1E2421] border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Member ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment Source</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {renewalTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No renewals processed via wallet yet.
                      </td>
                    </tr>
                  ) : (
                    renewalTransactions.map((rTx) => (
                      <tr key={rTx.transactionId} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-mono font-bold text-white">{rTx.transactionId}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{rTx.userId}</td>
                        <td className="px-4 py-3 text-slate-400">{rTx.createdAt}</td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          ₹{rTx.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-[#8064A9]/20 text-[#D99B43] font-bold text-[10.5px]">
                            FIC_WALLET
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-emerald-300 bg-emerald-950 text-[10.5px] font-bold">
                            {rTx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: INVESTMENT & FUNDING MANAGEMENT
         ======================================================== */}
      {activeTab === 'investment' && (
        <div className="space-y-5">
          {/* Sub-view switcher & KPI pills */}
          <div className="bg-[#29302D] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInvestSubTab('funding')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  investSubTab === 'funding'
                    ? 'bg-[#1C6960] text-white shadow-sm'
                    : 'bg-[#1E2421] text-slate-300 hover:text-white'
                }`}
              >
                <span>Funding Requests (Seekers)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-black">
                  {fundingRequests.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInvestSubTab('investor')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  investSubTab === 'investor'
                    ? 'bg-[#8064A9] text-white shadow-sm'
                    : 'bg-[#1E2421] text-slate-300 hover:text-white'
                }`}
              >
                <span>Investor Profiles</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-black">
                  {investorProfiles.length}
                </span>
              </button>
            </div>

            {/* Quick summary notes */}
            <div className="text-xs text-slate-400 text-right hidden lg:block">
              <span className="text-[#D99B43] font-bold">Intermediary Governance:</span> All status updates are directly published to member tracking with confidential internal notes preserved.
            </div>
          </div>

          {/* Sub-view 1: Funding Requests */}
          {investSubTab === 'funding' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-[#29302D] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <select
                    value={fundingStatusFilter}
                    onChange={(e) => setFundingStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E2421] text-slate-200 border border-white/10"
                  >
                    <option value="ALL">All Statuses ({fundingRequests.length})</option>
                    {FUNDING_STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={fundingIndustryFilter}
                    onChange={(e) => setFundingIndustryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E2421] text-slate-200 border border-white/10"
                  >
                    <option value="ALL">All Industries</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Technology">Technology</option>
                    <option value="Agri-Tech">Agri-Tech</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Retail & Franchise">Retail & Franchise</option>
                    <option value="Renewables">Renewables</option>
                    <option value="Logistics & Warehousing">Logistics & Warehousing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="relative w-full md:w-80">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ref, business name, city..."
                    value={fundingSearch}
                    onChange={(e) => setFundingSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#1E2421] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#D99B43]"
                  />
                </div>
              </div>

              {/* Funding Requests Table */}
              <div className="bg-[#29302D] border border-white/10 rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-200">
                    <thead className="bg-[#1E2421] border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <tr>
                        <th className="px-4 py-3.5">Reference & Date</th>
                        <th className="px-4 py-3.5">Business & Stage</th>
                        <th className="px-4 py-3.5">Industry & Location</th>
                        <th className="px-4 py-3.5">Funding Required</th>
                        <th className="px-4 py-3.5">Current Status</th>
                        <th className="px-4 py-3.5">Latest Member Update</th>
                        <th className="px-4 py-3.5 text-center">Internal Notes</th>
                        <th className="px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredFundingRequests.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                            No funding requests match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredFundingRequests.map((f) => {
                          const statusMatch = FUNDING_STATUS_OPTIONS.find((s) => s.value === f.status);
                          const statusLabel = statusMatch ? statusMatch.label : f.status;
                          const notesCount = f.internalNotes?.length || 0;

                          return (
                            <tr key={f.refNumber} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3.5 font-mono">
                                <div className="font-bold text-[#FCFAF6]">{f.refNumber}</div>
                                <div className="text-[10.5px] text-slate-400">{f.submittedDate || 'Today'}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-white text-[13px]">{f.businessName}</div>
                                <div className="text-[11px] text-slate-400">{f.businessType} • {f.businessStage}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-white font-medium">{f.industry}</div>
                                <div className="text-[11px] text-slate-400">{f.location?.city}, {f.location?.state}</div>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-emerald-400 text-sm">
                                {formatINRShort(f.fundingAmount)}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-block px-2.5 py-1 rounded-md text-[10.5px] font-bold border bg-teal-950/70 text-teal-300 border-teal-500/30">
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 max-w-[240px]">
                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                  {f.latestFicUpdate}
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                  notesCount > 0 ? 'bg-[#D99B43]/20 text-[#D99B43]' : 'bg-white/5 text-slate-400'
                                }`}>
                                  {notesCount} {notesCount === 1 ? 'Note' : 'Notes'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvestmentModal('FUNDING', f)}
                                  className="px-3 py-1.5 rounded-lg bg-[#1C6960] hover:bg-[#15544d] text-white font-bold text-xs transition-colors"
                                >
                                  Review & Update
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view 2: Investor Profiles */}
          {investSubTab === 'investor' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-[#29302D] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <select
                    value={investorStatusFilter}
                    onChange={(e) => setInvestorStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E2421] text-slate-200 border border-white/10"
                  >
                    <option value="ALL">All Statuses ({investorProfiles.length})</option>
                    {INVESTOR_STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={investorTypeFilter}
                    onChange={(e) => setInvestorTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E2421] text-slate-200 border border-white/10"
                  >
                    <option value="ALL">All Investor Types</option>
                    <option value="Individual Investor">Individual Investor</option>
                    <option value="Company / Corporate Investor">Company / Corporate Investor</option>
                    <option value="Investment Firm">Investment Firm</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="relative w-full md:w-80">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ref, investor name, city..."
                    value={investorSearch}
                    onChange={(e) => setInvestorSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#1E2421] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#D99B43]"
                  />
                </div>
              </div>

              {/* Investor Profiles Table */}
              <div className="bg-[#29302D] border border-white/10 rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-200">
                    <thead className="bg-[#1E2421] border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <tr>
                        <th className="px-4 py-3.5">Reference & Date</th>
                        <th className="px-4 py-3.5">Investor / Firm & Type</th>
                        <th className="px-4 py-3.5">Location</th>
                        <th className="px-4 py-3.5">Capacity & Preferred Ticket</th>
                        <th className="px-4 py-3.5">Preferred Sectors</th>
                        <th className="px-4 py-3.5">Current Status</th>
                        <th className="px-4 py-3.5">Latest Member Update</th>
                        <th className="px-4 py-3.5 text-center">Internal Notes</th>
                        <th className="px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredInvestorProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                            No investor profiles match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredInvestorProfiles.map((inv) => {
                          const statusMatch = INVESTOR_STATUS_OPTIONS.find((s) => s.value === inv.status);
                          const statusLabel = statusMatch ? statusMatch.label : inv.status;
                          const notesCount = inv.internalNotes?.length || 0;

                          return (
                            <tr key={inv.refNumber} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3.5 font-mono">
                                <div className="font-bold text-[#FCFAF6]">{inv.refNumber}</div>
                                <div className="text-[10.5px] text-slate-400">{inv.submittedDate || 'Today'}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-white text-[13px]">{inv.investorName}</div>
                                <div className="text-[11px] text-[#D99B43]">{inv.investorType}</div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-300">
                                {inv.stateCity}, {inv.country}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-purple-300">{inv.totalCapacity}</div>
                                <div className="text-[11px] text-slate-400">Ticket: {inv.preferredTicketSize}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {inv.preferredSectors?.slice(0, 2).map((s) => (
                                    <span key={s} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300">
                                      {s}
                                    </span>
                                  ))}
                                  {(inv.preferredSectors?.length || 0) > 2 && (
                                    <span className="text-[10px] text-slate-400">
                                      +{(inv.preferredSectors?.length || 0) - 2} more
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-block px-2.5 py-1 rounded-md text-[10.5px] font-bold border bg-purple-950/70 text-purple-300 border-purple-500/30">
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 max-w-[200px]">
                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                  {inv.latestFicUpdate}
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                  notesCount > 0 ? 'bg-[#D99B43]/20 text-[#D99B43]' : 'bg-white/5 text-slate-400'
                                }`}>
                                  {notesCount} {notesCount === 1 ? 'Note' : 'Notes'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvestmentModal('INVESTOR', inv)}
                                  className="px-3 py-1.5 rounded-lg bg-[#8064A9] hover:bg-[#6c5490] text-white font-bold text-xs transition-colors"
                                >
                                  Review & Update
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: MANUAL WALLET ADJUSTMENT (SECTION 12)
         ======================================================== */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-[#29302D]">
          <div className="bg-[#FFF9F0] border border-[#D99B43] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-[#29302D] mb-1">Manual Wallet Ledger Adjustment</h3>
            <p className="text-xs text-[#77786E] mb-4">
              Member ID: <strong>{adjustTarget.userId}</strong> (Current Balance: ₹{adjustTarget.availableBalance.toLocaleString('en-IN')})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#29302D] mb-1">Adjustment Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('CREDIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      adjustDirection === 'CREDIT'
                        ? 'bg-[#27AE60] text-white border-[#27AE60]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Credit (+) Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('DEBIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      adjustDirection === 'DEBIT'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Debit (-) Wallet
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#29302D] mb-1">Adjustment Amount (INR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#29302D] mb-1">Mandatory Audit Reason *</label>
                <textarea
                  rows={3}
                  placeholder="Mandatory administrative justification for financial ledger audit..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DBC8]">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-3.5 py-2 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#29302D] hover:bg-[#8064A9] text-white font-bold rounded-xl"
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INVESTMENT STATUS & GOVERNANCE NOTES UPDATE
         ======================================================== */}
      {editingInvestment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-[#29302D]">
          <div className="bg-[#FFF9F0] border-2 border-[#D99B43] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8DBC8]">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#29302D] text-[#D99B43] text-[10.5px] font-black uppercase tracking-wider mb-1">
                  <span>
                    {editingInvestment.type === 'FUNDING' ? 'Funding Request Review' : 'Investor Profile Verification'}
                  </span>
                  <span>•</span>
                  <span>{editingInvestment.item.refNumber}</span>
                </div>
                <h3 className="text-lg font-black text-[#29302D]">
                  {editingInvestment.type === 'FUNDING'
                    ? (editingInvestment.item as AdminFundingItem).businessName
                    : (editingInvestment.item as AdminInvestorItem).investorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvestment(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveInvestmentUpdate} className="space-y-4 pt-4 text-xs sm:text-sm">
              {/* Status Select */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1">
                  Change Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D] font-bold focus:outline-none focus:border-[#D99B43]"
                >
                  {editingInvestment.type === 'FUNDING'
                    ? FUNDING_STATUS_OPTIONS.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label} ({st.value})
                        </option>
                      ))
                    : INVESTOR_STATUS_OPTIONS.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label} ({st.value})
                        </option>
                      ))}
                </select>
              </div>

              {/* Latest FIC Update (Member Visible) */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1">
                  Latest FIC Update (Visible to Member) *
                </label>
                <textarea
                  rows={2}
                  value={editLatestUpdate}
                  onChange={(e) => setEditLatestUpdate(e.target.value)}
                  placeholder="Explain current progress directly to the member in simple words..."
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D] focus:outline-none focus:border-[#D99B43]"
                />
                <p className="text-[11px] text-[#77786E] mt-0.5">
                  This message appears on the member's portal under <strong>Latest FIC Update</strong> and in their Update History.
                </p>
              </div>

              {/* What Happens Next (Member Visible) */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1">
                  What Happens Next? (Visible to Member) *
                </label>
                <textarea
                  rows={2}
                  value={editWhatNext}
                  onChange={(e) => setEditWhatNext(e.target.value)}
                  placeholder="Explain the immediate next step or action required..."
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D] focus:outline-none focus:border-[#D99B43]"
                />
                <p className="text-[11px] text-[#77786E] mt-0.5">
                  Displayed in the member's View Details modal under Section 4.
                </p>
              </div>

              {/* Confidential Internal Notes (Admin-Only) */}
              <div className="bg-[#FAF3E7] p-3.5 rounded-xl border border-[#D99B43]/40">
                <label className="block font-bold text-[#29302D] mb-1 flex items-center justify-between">
                  <span>Add Confidential Internal Note (Admin Staff Only)</span>
                  <span className="text-[10px] uppercase font-black tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                    Strictly Confidential
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  placeholder="Internal evaluation notes, financial cross-checks, risk observations (never shown to member)..."
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D] focus:outline-none focus:border-[#D99B43]"
                />
                <p className="text-[11px] text-[#77786E] mt-1">
                  🔒 Stripped by the backend API and NEVER exposed to members. Used only for internal coordination and deal review.
                </p>
              </div>

              {/* Existing Internal Notes Log */}
              {editingInvestment.item.internalNotes && editingInvestment.item.internalNotes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-xs font-black uppercase text-[#77786E] tracking-wider">
                    Internal Notes History ({editingInvestment.item.internalNotes.length})
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {editingInvestment.item.internalNotes.map((noteItem, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-[#E8DBC8] text-xs">
                        <div className="flex items-center justify-between text-[10.5px] text-[#77786E] mb-1 font-bold">
                          <span>{noteItem.createdBy || 'FIC Staff'}</span>
                          <span>
                            {noteItem.createdAt
                              ? new Date(noteItem.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'Earlier'}
                          </span>
                        </div>
                        <p className="text-[#29302D] font-medium leading-relaxed">{noteItem.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8DBC8]">
                <button
                  type="button"
                  onClick={() => setEditingInvestment(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingInvestment}
                  className="px-5 py-2.5 bg-[#29302D] hover:bg-[#1E2421] text-[#D99B43] hover:text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isSavingInvestment ? 'Saving...' : 'Save & Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;


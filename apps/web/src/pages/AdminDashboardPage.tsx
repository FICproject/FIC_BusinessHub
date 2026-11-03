import React, { useState, useEffect } from 'react';
import {
  getAdminWalletsData,
  adminApproveReferralReward,
  adminRejectReferralReward,
  adminAdjustWallet,
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
  UserIcon
} from '../components/Icons';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'referrals' | 'wallets' | 'renewals'>('referrals');

  // Live Admin Data
  const [wallets, setWallets] = useState<IMemberWallet[]>([]);
  const [transactions, setTransactions] = useState<IWalletTransaction[]>([]);
  const [referrals, setReferrals] = useState<IReferral[]>([]);

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

  const reloadData = () => {
    const data = getAdminWalletsData();
    setWallets(data.wallets);
    setTransactions(data.transactions);
    setReferrals(data.referrals);
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
              <span className="text-2xl font-black text-[#D99B43] block mt-1">₹5,999/yr</span>
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
                ₹{(renewalTransactions.length * 5999).toLocaleString('en-IN')}
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
    </div>
  );
};

export default AdminDashboardPage;


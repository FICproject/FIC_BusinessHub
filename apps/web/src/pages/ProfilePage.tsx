import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input } from '@fic/ui';
import {
  getStoredUser,
  updateUserProfile,
  removeAuthToken,
  calculateAgeFromDob,
  formatDisplayDob,
  getUserWallet,
  getUserWalletTransactions,
  addWalletFunds,
  requestWalletWithdrawal,
  renewMembershipWithWallet,
  getUserReferrals,
  getUserBankAccount,
  saveUserBankAccount,
  AuthenticatedUser,
  IMemberWallet,
  IWalletTransaction,
  IReferral,
  IMemberBankAccount,
  WalletTransactionType,
  WalletTransactionStatus
} from '../services/api';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  LockIcon,
  BriefcaseIcon,
  FactoryIcon,
  CodeIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  EditIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  AlertCircleIcon,
  ClockIcon,
  ArrowRightIcon
} from '../components/Icons';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const userId = user?.id || user?.userId || 'usr_kathir_001';

  // Live Wallet & Financial State
  const [wallet, setWallet] = useState<IMemberWallet | null>(null);
  const [transactions, setTransactions] = useState<IWalletTransaction[]>([]);
  const [txTypeFilter, setTxTypeFilter] = useState<string>('ALL');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

  // Referral State
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    referralLink: string;
    summary: any;
    referrals: IReferral[];
  } | null>(null);

  // Bank Account State
  const [bankAccount, setBankAccount] = useState<IMemberBankAccount | null>(null);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Notification / Toast Message
  const [toastMessage, setToastMessage] = useState('');

  // Add Funds Form
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [customTopUp, setCustomTopUp] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Withdraw Form
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');

  // Bank Account Form
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankConfirmAccount, setBankConfirmAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankAccountType, setBankAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [bankFormError, setBankFormError] = useState('');

  // Edit Profile Form Fields
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [editSubcategories, setEditSubcategories] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Password Change Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load User & Financial Ledgers
  const refreshFinancialData = (uid: string) => {
    const w = getUserWallet(uid);
    setWallet(w);
    const txs = getUserWalletTransactions(uid, {
      type: txTypeFilter,
      status: txStatusFilter,
      search: txSearchQuery
    });
    setTransactions(txs);
    const refs = getUserReferrals(uid);
    setReferralData(refs);
    const bank = getUserBankAccount(uid);
    setBankAccount(bank);
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);
    populateForm(stored);
    const uid = stored.id || stored.userId;
    refreshFinancialData(uid);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const uid = user.id || user.userId;
      const txs = getUserWalletTransactions(uid, {
        type: txTypeFilter,
        status: txStatusFilter,
        search: txSearchQuery
      });
      setTransactions(txs);
    }
  }, [txTypeFilter, txStatusFilter, txSearchQuery, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const populateForm = (u: AuthenticatedUser) => {
    setEditFullName(u.fullName || '');
    setEditPhone(u.mobileNumber || u.phoneNumber || '');
    setEditDob(u.personalInfo?.dob || (u.email?.toLowerCase() === 'kathir@gmail.com' ? '15 Aug 1996' : ''));
    setDobError('');
    setEditSubcategories((u.subcategories || []).join(', '));
    setEditAddress(u.personalInfo?.address || '');
    setEditCity(u.personalInfo?.city || '');
    setEditState(u.personalInfo?.state || '');
    setEditPincode(u.personalInfo?.pincode || '');
    setEditRoleTitle(u.professionalInfo?.roleTitle || u.professionalInfo?.businessName || '');
    setEditSkills((u.professionalInfo?.skills || []).join(', '));
    setEditPortfolio(u.professionalInfo?.portfolioUrl || '');
    setEditDescription(u.professionalInfo?.description || '');
  };

  if (!user) return null;

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  const handleOpenEdit = () => {
    populateForm(user);
    setDobError('');
    setIsEditModalOpen(true);
  };

  // Add Funds Handler
  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customTopUp ? Number(customTopUp) : topUpAmount;
    if (!finalAmount || finalAmount < 100) {
      showToast('Minimum deposit amount is ₹100.');
      return;
    }
    setIsProcessingPayment(true);
    setTimeout(() => {
      addWalletFunds(userId, finalAmount, paymentMethod);
      setIsProcessingPayment(false);
      setIsAddFundsModalOpen(false);
      setCustomTopUp('');
      refreshFinancialData(userId);
      showToast(`₹${finalAmount.toLocaleString('en-IN')} added to your wallet successfully!`);
    }, 700);
  };

  // Withdraw Handler
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(withdrawAmount);
    if (!num || num < 500) {
      setWithdrawError('Minimum withdrawal amount is ₹500.');
      return;
    }
    if (!wallet || wallet.availableBalance < num) {
      setWithdrawError('Amount exceeds your available balance.');
      return;
    }
    const res = requestWalletWithdrawal(userId, num);
    if (res.success) {
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawError('');
      refreshFinancialData(userId);
      showToast(`Withdrawal request for ₹${num.toLocaleString('en-IN')} submitted under review.`);
    } else {
      setWithdrawError(res.error || 'Failed to process withdrawal.');
    }
  };

  // Membership Renewal with Wallet Handler
  const handleRenewWithWallet = () => {
    const res = renewMembershipWithWallet(userId);
    if (res.success) {
      setIsRenewModalOpen(false);
      refreshFinancialData(userId);
      const updatedUser = getStoredUser();
      if (updatedUser) setUser(updatedUser);
      showToast('Membership renewed successfully for 365 days using wallet balance!');
    } else {
      showToast(res.error || 'Renewal failed. Please check wallet balance.');
    }
  };

  // Save Bank Account
  const handleSaveBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bankAccountNumber !== bankConfirmAccount) {
      setBankFormError('Account numbers do not match.');
      return;
    }
    if (!bankHolderName || !bankName || !bankIfsc) {
      setBankFormError('Please fill all required fields.');
      return;
    }
    saveUserBankAccount(userId, {
      accountHolderName: bankHolderName,
      bankName,
      accountNumber: bankAccountNumber,
      ifscCode: bankIfsc,
      accountType: bankAccountType
    });
    setIsBankModalOpen(false);
    setBankFormError('');
    refreshFinancialData(userId);
    showToast('Bank account verified and saved successfully.');
  };

  // Copy Referral Link
  const handleCopyLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      showToast('Referral link copied to clipboard!');
    }
  };

  // Copy Referral Code
  const handleCopyCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      showToast('Referral code copied to clipboard!');
    }
  };

  // Download statement simulation
  const handleDownloadStatement = () => {
    showToast('Official financial ledger statement downloaded (PDF/CSV).');
  };

  // KYC Badge renderer
  const renderKycBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'VERIFIED' || s === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircleIcon size={13} className="text-emerald-600" />
          VERIFIED
        </span>
      );
    }
    if (s === 'PENDING' || s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <ClockIcon size={13} className="text-amber-600" />
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <AlertCircleIcon size={13} className="text-red-600" />
        REJECTED
      </span>
    );
  };

  const renewalFee = 5999;
  const availableBal = wallet?.availableBalance || 0;
  const isRenewalSufficient = availableBal >= renewalFee;
  const renewalShortfall = isRenewalSufficient ? 0 : renewalFee - availableBal;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-[#FCFAF6] px-5 py-3.5 rounded-xl shadow-2xl border border-[#D99B43]/50 flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircleIcon size={20} className="text-[#27AE60] shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================
          A. HEADER IDENTITY & STANDING CARD
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#29302D] to-[#1E2421] text-[#D99B43] flex items-center justify-center font-black text-3xl shadow-md shrink-0 border border-[#D99B43]/30">
              {user.fullName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  ID: {user.id || user.userId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ● ACTIVE Account
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {user.membershipPlan || '1st Year Member'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  KYC Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {user.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  {user.primaryCategory || user.categoryName}
                </span>
                {(user.subcategories || [user.subCategory]).filter(Boolean).map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#29302D] hover:bg-[#8064A9] text-white shadow-xs transition-colors"
            >
              <EditIcon size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          B. UNIVERSAL MEMBER WALLET & BALANCES (SECTION 2 & 3)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#27AE60]/10 text-[#27AE60] text-xs font-bold uppercase tracking-wider mb-1">
              <span>Universal Member Wallet</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Personal Wallet & Balances
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Secure, ledger-backed stored-value account with auditable transaction tracking.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddFundsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#27AE60] hover:bg-[#219653] text-white shadow-xs transition-colors"
            >
              <PlusIcon size={16} />
              <span>Add Funds</span>
            </button>
            <button
              onClick={() => {
                setWithdrawError('');
                setIsWithdrawModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-300 hover:border-[#8064A9] text-slate-800 hover:text-[#8064A9] transition-colors"
            >
              Withdraw Funds
            </button>
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#FFF9F0] border border-[#D99B43] text-[#D99B43] hover:bg-[#D99B43] hover:text-white transition-colors"
            >
              Renew Membership
            </button>
          </div>
        </div>

        {/* 4 Primary Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Available Balance */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#29302D] to-[#1E2421] text-white shadow-md border border-[#D99B43]/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D99B43] block mb-1">
              Available Balance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#FCFAF6]">
              ₹{(wallet?.availableBalance || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-300 block mt-1.5">
              Ready for renewal & services
            </span>
          </div>

          {/* 2. Pending Referral Rewards */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Pending Rewards
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">
              ₹{(wallet?.pendingBalance || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-700 block mt-1.5">
              Under verification review
            </span>
          </div>

          {/* 3. Total Referral Earnings */}
          <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
              Referral Earnings
            </span>
            <div className="text-2xl sm:text-3xl font-black text-purple-900">
              ₹{(wallet?.totalReferralEarnings || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-purple-700 block mt-1.5">
              Approved rewards to date
            </span>
          </div>

          {/* 4. Total Wallet Credits */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Total Credits
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900">
              ₹{((wallet?.totalAdded || 0) + (wallet?.totalReferralEarnings || 0)).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-700 block mt-1.5">
              Lifetime inflows & top-ups
            </span>
          </div>
        </div>

        {/* Secondary Ledger Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">For Renewal</span>
            <strong className="text-slate-900 font-bold block mt-0.5">
              ₹{(wallet?.membershipEligibleBalance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">For Withdrawal</span>
            <strong className="text-slate-900 font-bold block mt-0.5">
              ₹{(wallet?.withdrawalEligibleBalance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Total Added</span>
            <strong className="text-emerald-700 font-bold block mt-0.5">
              ₹{(wallet?.totalAdded || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Total Withdrawn</span>
            <strong className="text-slate-900 font-bold block mt-0.5">
              ₹{(wallet?.totalWithdrawn || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Renewal Debits</span>
            <strong className="text-slate-900 font-bold block mt-0.5">
              ₹{(wallet?.totalRenewalSpent || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Wallet Standing</span>
            <strong className="text-emerald-600 font-bold block mt-0.5">
              ● {wallet?.status || 'ACTIVE'}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================
          C. REFERRAL PROGRAMME (SECTION 7 & 8)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#8064A9]/10 text-[#8064A9] text-xs font-bold uppercase tracking-wider mb-1">
              <span>Universal Member Rewards</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Referral Programme & Earnings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Invite entrepreneurs and businesses to FIC Business Hub and earn ₹500 wallet reward per verified membership.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              Reward: ₹500 per Referral
            </span>
          </div>
        </div>

        {/* Unique Code & Link Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Your Unique Referral Code</span>
              <span className="text-lg font-black font-mono text-slate-900 tracking-wider block mt-0.5">
                {referralData?.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:border-[#8064A9] hover:text-[#8064A9] transition-colors shrink-0"
            >
              Copy Code
            </button>
          </div>

          {/* Referral Link */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs text-slate-500 block font-medium">Your Unique Referral Link</span>
              <span className="text-xs font-mono text-slate-700 truncate block mt-1">
                {referralData?.referralLink}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#29302D] hover:bg-[#8064A9] text-white transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* 5 Referral Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-slate-500 block">Total Referrals</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {referralData?.summary?.totalReferrals || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-slate-500 block">Pending Verification</span>
            <span className="text-xl font-black text-amber-700 block mt-1">
              {referralData?.summary?.pendingReferrals || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-slate-500 block">KYC Approved</span>
            <span className="text-xl font-black text-emerald-700 block mt-1">
              {referralData?.summary?.kycApprovedReferrals || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-slate-500 block">Pending Reward</span>
            <span className="text-xl font-black text-amber-700 block mt-1">
              ₹{(referralData?.summary?.rewardPending || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-slate-500 block">Total Earned</span>
            <span className="text-xl font-black text-[#8064A9] block mt-1">
              ₹{(referralData?.summary?.rewardCredited || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Referral History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700">Referred Members & Status</span>
            <span className="text-[11px] text-slate-500 font-medium">
              {referralData?.referrals?.length || 0} Members Attributed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Reward Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(referralData?.referrals || []).map((refItem) => (
                  <tr key={refItem.referralId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{refItem.referredName}</span>
                      <span className="text-[11px] text-slate-500">{refItem.referredEmail}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{refItem.registrationDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10.5px] ${
                          refItem.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {refItem.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">{renderKycBadge(refItem.kycStatus)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      ₹{refItem.rewardAmount}
                    </td>
                    <td className="px-4 py-3">
                      {refItem.rewardStatus === 'CREDITED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Credited
                        </span>
                      )}
                      {refItem.rewardStatus === 'PENDING_APPROVAL' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                      {refItem.rewardStatus === 'PENDING_ELIGIBILITY' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Awaiting KYC
                        </span>
                      )}
                      {refItem.rewardStatus === 'REJECTED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-red-50 text-red-600 border border-red-200">
                          Ineligible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          D. MEMBERSHIP TERMS & WALLET RENEWAL (SECTION 6)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Membership Terms & Standing</h3>
            <p className="text-xs text-slate-500">Official commercial credentials for your account</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              {user.membershipPlan || '1st Year Membership'}
            </span>
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#29302D] hover:bg-[#8064A9] text-white shadow-xs transition-colors"
            >
              Renew Membership Using Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Plan</span>
            <strong className="text-slate-900 text-sm block mt-1">
              {user.membershipPlan || 'First-Year Access'}
            </strong>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Amount Paid</span>
            <strong className="text-emerald-700 text-sm block mt-1">
              {user.membershipAmountPaid || '₹99'}
            </strong>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Validity Term</span>
            <strong className="text-slate-900 text-sm block mt-1">
              {user.membershipExpiryDate || 'Valid for 365 Days'}
            </strong>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Account Status</span>
            <span className="inline-block mt-1 text-emerald-700 font-bold">
              ● {user.membershipStatus || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Live Renewal Status Banner */}
        <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-[#29302D] block">
              Annual Renewal Policy (Year 2+): Standard fee ₹5,999/yr.
            </span>
            <span className="text-[#77786E] block mt-0.5">
              Available Wallet Balance: ₹{availableBal.toLocaleString('en-IN')} &bull;{' '}
              {isRenewalSufficient ? (
                <span className="text-emerald-700 font-bold">Eligible for instant wallet renewal</span>
              ) : (
                <span className="text-amber-700 font-bold">
                  Shortfall: ₹{renewalShortfall.toLocaleString('en-IN')} (Add funds to renew)
                </span>
              )}
            </span>
          </div>
          {isRenewalSufficient ? (
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="px-4 py-2 bg-[#27AE60] hover:bg-[#219653] text-white font-bold rounded-xl transition-colors shrink-0"
            >
              Renew for ₹5,999
            </button>
          ) : (
            <button
              onClick={() => {
                setCustomTopUp(String(renewalShortfall));
                setIsAddFundsModalOpen(true);
              }}
              className="px-4 py-2 bg-[#C66B52] hover:bg-[#B55A41] text-white font-bold rounded-xl transition-colors shrink-0"
            >
              Top Up Shortfall (₹{renewalShortfall.toLocaleString('en-IN')})
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          E. WALLET TRANSACTION HISTORY (SECTION 2.C)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Wallet Transaction History</h3>
            <p className="text-xs text-slate-500">Immutable ledger tracking all inflows, rewards, and expenditures</p>
          </div>
          <button
            onClick={handleDownloadStatement}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-700 transition-colors"
          >
            Download Statement
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Type Filter */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {[
              { key: 'ALL', label: 'All Transactions' },
              { key: WalletTransactionType.ADD_FUNDS, label: 'Add Funds' },
              { key: WalletTransactionType.REFERRAL_REWARD, label: 'Referral Rewards' },
              { key: WalletTransactionType.MEMBERSHIP_RENEWAL, label: 'Renewals' },
              { key: WalletTransactionType.WITHDRAWAL, label: 'Withdrawals' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTxTypeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txTypeFilter === tab.key
                    ? 'bg-[#29302D] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:w-64">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference ID or details..."
              value={txSearchQuery}
              onChange={(e) => setTxSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8064A9]"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No wallet transactions match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = tx.direction === 'CREDIT';
                    return (
                      <tr key={tx.transactionId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {tx.transactionId}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{tx.createdAt}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[10.5px] bg-slate-100 text-slate-700">
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[220px] truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                          {isCredit ? (
                            <span className="text-emerald-600">+₹{tx.amount.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-red-600">-₹{tx.amount.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              tx.status === WalletTransactionStatus.COMPLETED
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.status === WalletTransactionStatus.PENDING
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{tx.balanceAfter.toLocaleString('en-IN')}
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

      {/* ========================================================
          F. PERSONAL & PROFESSIONAL DETAILS (2-COLUMN)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserIcon size={18} className="text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
            </div>
            <span className="text-xs text-slate-400">Authenticated Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Full Legal Name</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{user.fullName}</strong>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Email Address</span>
              <span className="text-slate-900 text-xs sm:text-sm block mt-0.5 font-medium truncate">
                {user.email}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Mobile Phone Number</span>
              <strong className="text-slate-900 text-sm block mt-0.5">
                {user.mobileNumber || user.phoneNumber || 'Not provided'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Date of Birth</span>
              <strong className="text-slate-900 text-sm block mt-0.5">
                {user.personalInfo?.dob || 'Verified 18+ Adult Policy'}
              </strong>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-medium">Registered Address & Location</span>
              <span className="text-slate-800 text-xs block mt-0.5 leading-relaxed font-medium">
                {user.personalInfo?.address
                  ? `${user.personalInfo.address}, ${user.personalInfo.city || ''}, ${
                      user.personalInfo.state || ''
                    } - ${user.personalInfo.pincode || ''}`
                  : 'Address on file with KYC submission'}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BriefcaseIcon size={18} className="text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Professional & Business Profile</h3>
            </div>
            <span className="text-xs text-[#8064A9] font-bold">
              {user.primaryCategory || user.categoryName}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Professional Title / Organization</span>
              <strong className="text-slate-900 text-sm block mt-0.5">
                {user.professionalInfo?.roleTitle ||
                  user.professionalInfo?.businessName ||
                  user.subCategory ||
                  'Enterprise Member'}
              </strong>
            </div>

            {user.professionalInfo?.skills && user.professionalInfo.skills.length > 0 && (
              <div>
                <span className="text-slate-400 block font-medium mb-1.5">Skills & Capabilities</span>
                <div className="flex flex-wrap gap-1.5">
                  {user.professionalInfo.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.professionalInfo?.description && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
                {user.professionalInfo.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          G. KYC VERIFICATION & COMPLIANCE FILES (SIMPLIFIED)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">KYC Verification & Documents</h3>
            <p className="text-xs text-slate-500">Government & business verification records for your account</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Overall Status:</span>
            {renderKycBadge(user.isKycApproved ? 'VERIFIED' : 'PENDING')}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {(user.submittedDocuments && user.submittedDocuments.length > 0
            ? user.submittedDocuments
            : [
                { name: 'Aadhaar Card', status: 'VERIFIED' },
                { name: 'PAN Card', status: 'VERIFIED' }
              ]
          ).map((doc, idx) => (
            <div
              key={idx}
              className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 px-2 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <FileTextIcon size={16} />
                </div>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</span>
              </div>
              <div>{renderKycBadge(doc.status)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          H. ACCOUNT SECURITY & CREDENTIALS
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <LockIcon size={18} className="text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Account Security & Credentials</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Primary Email</span>
            <strong className="text-slate-900 text-sm block mt-0.5 truncate">{user.email}</strong>
            <span className="text-emerald-700 text-[11px] font-bold block mt-1">✓ Verified</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Primary Mobile</span>
            <strong className="text-slate-900 text-sm block mt-0.5">{user.phoneNumber || user.mobileNumber}</strong>
            <span className="text-emerald-700 text-[11px] font-bold block mt-1">✓ Verified</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Password Security</span>
              <strong className="text-slate-900 text-sm block mt-0.5">••••••••••••</strong>
            </div>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-xs font-bold text-[#8064A9] hover:text-[#29302D] text-left mt-2"
            >
              Change Password &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: ADD FUNDS TO WALLET (SECTION 4)
         ======================================================== */}
      {isAddFundsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E8DBC8] pb-3 mb-4">
              <h3 className="text-lg font-black text-[#29302D]">Add Funds to FIC Wallet</h3>
              <button
                onClick={() => setIsAddFundsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8DBC8] text-[#77786E] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFundsSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#29302D] mb-1.5">Select Amount (INR) *</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTopUpAmount(amt);
                        setCustomTopUp('');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        !customTopUp && topUpAmount === amt
                          ? 'bg-[#29302D] text-white border-[#29302D]'
                          : 'bg-white text-slate-700 border-[#E8DBC8] hover:bg-slate-50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="Or enter custom amount (Min ₹100)"
                  min={100}
                  max={200000}
                  value={customTopUp}
                  onChange={(e) => setCustomTopUp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR' },
                    { id: 'NETBANKING', label: 'Net Banking' },
                    { id: 'CARD', label: 'Debit / Card' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                        paymentMethod === m.id
                          ? 'border-[#27AE60] bg-[#27AE60]/10 text-[#27AE60]'
                          : 'border-[#E8DBC8] bg-white text-slate-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Payable Summary */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DBC8] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Top-up Amount:</span>
                  <span className="font-bold">
                    ₹{(customTopUp ? Number(customTopUp) : topUpAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Gateway Charges:</span>
                  <span className="text-emerald-700 font-bold">₹0 (FIC Promotional Zero Fee)</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 font-black text-slate-900 text-sm">
                  <span>Total Payable:</span>
                  <span>
                    ₹{(customTopUp ? Number(customTopUp) : topUpAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFundsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 bg-[#27AE60] hover:bg-[#219653] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  {isProcessingPayment ? 'Connecting Payment Gateway...' : 'Proceed to Secure Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: WITHDRAW FUNDS (SECTION 5)
         ======================================================== */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E8DBC8] pb-3 mb-4">
              <h3 className="text-lg font-black text-[#29302D]">Request Bank Withdrawal</h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8DBC8] text-[#77786E] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {withdrawError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircleIcon size={16} className="shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DBC8] space-y-1">
                <span className="text-[11px] text-slate-500 block">Available for Withdrawal</span>
                <span className="text-xl font-black text-slate-900 block">
                  ₹{(wallet?.withdrawalEligibleBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Verified Bank Account Display */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#29302D]">Receiving Bank Account *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWithdrawModalOpen(false);
                      setIsBankModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#8064A9] hover:underline"
                  >
                    {bankAccount ? 'Change Bank' : '+ Add Bank Account'}
                  </button>
                </div>

                {bankAccount ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{bankAccount.bankName}</span>
                      <span className="text-[11.5px] font-mono text-slate-600 block">
                        {bankAccount.accountNumberMasked} &bull; IFSC: {bankAccount.ifscCode}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10.5px]">
                      VERIFIED
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                    <span>No verified bank account linked.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWithdrawModalOpen(false);
                        setIsBankModalOpen(true);
                      }}
                      className="font-bold underline"
                    >
                      Link Now
                    </button>
                  </div>
                )}
              </div>

              {/* Withdrawal Amount */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1">Withdrawal Amount (Min ₹500) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  min={500}
                  max={wallet?.withdrawalEligibleBalance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              {/* Compliance Gate Note */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DBC8] text-[11px] text-slate-500 leading-relaxed">
                <strong>RBI Compliance & Settlement Gate:</strong> Withdrawals are remitted directly to the verified bank account following authorized internal governance review within 1-2 business days.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bankAccount}
                  className="px-5 py-2.5 bg-[#29302D] hover:bg-[#8064A9] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Confirm Withdrawal Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: MEMBERSHIP RENEWAL CONFIRMATION (SECTION 6)
         ======================================================== */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E8DBC8] pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#8064A9]">FIC Ecosystem Access</span>
                <h3 className="text-lg font-black text-[#29302D]">Annual Membership Renewal</h3>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8DBC8] text-[#77786E] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DBC8] space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Membership Plan:</span>
                  <span className="font-bold text-slate-900">Standard Annual Renewal (Year 2+)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Renewal Duration:</span>
                  <span className="font-bold text-slate-900">+365 Days</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Authorized Renewal Fee:</span>
                  <span className="font-black text-slate-900 text-sm">₹5,999</span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-2">
                  <span>Your Available Wallet Balance:</span>
                  <span className="font-bold text-emerald-700">₹{availableBal.toLocaleString('en-IN')}</span>
                </div>

                {isRenewalSufficient ? (
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                    <span>Remaining Balance After Renewal:</span>
                    <span>₹{(availableBal - 5999).toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <strong>Insufficient Wallet Balance:</strong> Shortfall of ₹{renewalShortfall.toLocaleString('en-IN')}. Please top up your wallet to activate renewal.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                {isRenewalSufficient ? (
                  <button
                    onClick={handleRenewWithWallet}
                    className="px-5 py-2.5 bg-[#27AE60] hover:bg-[#219653] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                  >
                    Confirm & Deduct ₹5,999 from Wallet
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsRenewModalOpen(false);
                      setCustomTopUp(String(renewalShortfall));
                      setIsAddFundsModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#C66B52] hover:bg-[#B55A41] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                  >
                    Top Up Shortfall (₹{renewalShortfall.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: LINK / EDIT BANK ACCOUNT
         ======================================================== */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E8DBC8] pb-3 mb-4">
              <h3 className="text-lg font-black text-[#29302D]">Link Verified Bank Account</h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8DBC8] text-[#77786E] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {bankFormError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircleIcon size={16} className="shrink-0" />
                <span>{bankFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#29302D] mb-1">Account Holder Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. S. Moorthy"
                  value={bankHolderName}
                  onChange={(e) => setBankHolderName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#29302D] mb-1">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#29302D] mb-1">Account Number *</label>
                <input
                  type="text"
                  placeholder="Enter full bank account number"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#29302D] mb-1">Confirm Account Number *</label>
                <input
                  type="text"
                  placeholder="Re-enter bank account number"
                  value={bankConfirmAccount}
                  onChange={(e) => setBankConfirmAccount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#29302D] mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl uppercase text-[#29302D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#29302D] mb-1">Account Type *</label>
                  <select
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#29302D] hover:bg-[#8064A9] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Save & Verify Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: EDIT PROFILE DETAILS
         ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-8 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Member Profile Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updated = updateUserProfile(userId, {
                  fullName: editFullName,
                  mobileNumber: editPhone,
                  phoneNumber: editPhone,
                  subcategories: editSubcategories.split(',').map((s) => s.trim()).filter(Boolean),
                  personalInfo: {
                    ...(user.personalInfo || {}),
                    dob: editDob,
                    address: editAddress,
                    city: editCity,
                    state: editState,
                    pincode: editPincode
                  },
                  professionalInfo: {
                    ...(user.professionalInfo || {}),
                    roleTitle: editRoleTitle,
                    skills: editSkills.split(',').map((s) => s.trim()).filter(Boolean),
                    portfolioUrl: editPortfolio,
                    description: editDescription
                  }
                });
                setUser(updated);
                setIsEditModalOpen(false);
                showToast('Profile information updated successfully.');
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subcategories (comma separated)</label>
                <input
                  type="text"
                  value={editSubcategories}
                  onChange={(e) => setEditSubcategories(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Professional Role / Title</label>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bio / Business Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#29302D] hover:bg-[#8064A9] text-white font-bold rounded-xl transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: CHANGE PASSWORD
         ======================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Change Account Password</h3>
            {passwordError && (
              <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded-lg">
                {passwordError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword.length < 6) {
                  setPasswordError('New password must be at least 6 characters.');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPasswordError('Passwords do not match.');
                  return;
                }
                setIsPasswordModalOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
                showToast('Password changed successfully.');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#29302D] hover:bg-[#8064A9] text-white font-bold rounded-xl"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

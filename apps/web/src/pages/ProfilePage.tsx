import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Input } from '@fic/ui';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceKpi,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
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
  ArrowRightIcon,
  SparklesIcon
} from '../components/Icons';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(() => getStoredUser());
  const userId = user?.id || user?.userId || 'usr_kathir_001';

  // Live Wallet & Financial State
  const [wallet, setWallet] = useState<IMemberWallet | null>(null);
  const [transactions, setTransactions] = useState<IWalletTransaction[]>([]);
  const [allUserTransactions, setAllUserTransactions] = useState<IWalletTransaction[]>([]);
  const [txTypeFilter, setTxTypeFilter] = useState<string>('ALL');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  
  // Wallet Activity Modal State (Opened by "View Details" popup button)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [txFlowFilter, setTxFlowFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [txCurrentPage, setTxCurrentPage] = useState<number>(1);
  const txPerPage = 6;

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
    const allTxs = getUserWalletTransactions(uid);
    setAllUserTransactions(allTxs);
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
      const allTxs = getUserWalletTransactions(uid);
      setAllUserTransactions(allTxs);
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

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  const handleOpenEdit = () => {
    if (user) {
      populateForm(user);
    }
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

  // User's transactions calculation for inline wallet ledger & statistics
  const totalTxCount = allUserTransactions.length;
  const totalCreditsAmount = allUserTransactions
    .filter((t) => t.direction === 'CREDIT' && t.status === WalletTransactionStatus.COMPLETED)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebitsAmount = allUserTransactions
    .filter((t) => t.direction === 'DEBIT' && t.status === WalletTransactionStatus.COMPLETED)
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingTxCount = allUserTransactions.filter((t) => t.status === WalletTransactionStatus.PENDING).length;
  const completedTxCount = allUserTransactions.filter((t) => t.status === WalletTransactionStatus.COMPLETED).length;

  // Filtered transactions for inline activity view
  const filteredTransactions = React.useMemo(() => {
    return allUserTransactions.filter((tx) => {
      // Type filter
      if (txTypeFilter !== 'ALL' && tx.transactionType !== txTypeFilter) {
        return false;
      }
      // Flow filter
      if (txFlowFilter !== 'ALL' && tx.direction !== txFlowFilter) {
        return false;
      }
      // Status filter
      if (txStatusFilter !== 'ALL' && tx.status !== txStatusFilter) {
        return false;
      }
      // Search query
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const matchesId = tx.transactionId.toLowerCase().includes(q);
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesAmount = String(tx.amount).includes(q);
        if (!matchesId && !matchesDesc && !matchesAmount) return false;
      }
      return true;
    });
  }, [allUserTransactions, txTypeFilter, txFlowFilter, txStatusFilter, txSearchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / txPerPage) || 1;
  const currentSafePage = Math.min(Math.max(1, txCurrentPage), totalPages);
  const startIdx = (currentSafePage - 1) * txPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIdx, startIdx + txPerPage);

  const getTxTypeBadge = (type: WalletTransactionType) => {
    switch (type) {
      case WalletTransactionType.ADD_FUNDS:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#2E7D32]/10 text-[#1B5E20] border border-[#2E7D32]/20">
            <PlusIcon size={11} />
            <span>Add Funds</span>
          </span>
        );
      case WalletTransactionType.REFERRAL_REWARD:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#8064A9]/10 text-[#8064A9] border border-[#8064A9]/20">
            <SparklesIcon size={11} />
            <span>Referral Reward</span>
          </span>
        );
      case WalletTransactionType.MEMBERSHIP_RENEWAL:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#D99B43]/15 text-[#9C6818] border border-[#D99B43]/30">
            <ClockIcon size={11} />
            <span>Renewal</span>
          </span>
        );
      case WalletTransactionType.WITHDRAWAL:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#C66B52]/10 text-[#C66B52] border border-[#C66B52]/20">
            <span>Withdrawal</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FAF7F2] text-[#77786E] border border-[#EADFCF]">
            <span>{String(type).replace('_', ' ')}</span>
          </span>
        );
    }
  };

  const getTxStatusBadge = (status: WalletTransactionStatus) => {
    switch (status) {
      case WalletTransactionStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#2E7D32]/10 text-[#1B5E20] border border-[#2E7D32]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span>
            <span>Completed</span>
          </span>
        );
      case WalletTransactionStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#D99B43]/15 text-[#9C6818] border border-[#D99B43]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D99B43] animate-pulse"></span>
            <span>Pending</span>
          </span>
        );
      case WalletTransactionStatus.FAILED:
      case WalletTransactionStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#C66B52]/10 text-[#C66B52] border border-[#C66B52]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C66B52]"></span>
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F2] text-[#77786E]">
            {status}
          </span>
        );
    }
  };

  const renewalFee = 5999;
  const availableBal = wallet?.availableBalance || 0;
  const isRenewalSufficient = availableBal >= renewalFee;
  const renewalShortfall = isRenewalSufficient ? 0 : renewalFee - availableBal;

  if (!user) {
    return (
      <WorkspaceShell maxWidth="7xl">
        <div className="py-24 text-center">
          <p className="text-base font-bold text-[#29302D]">Loading Member Profile...</p>
          <p className="text-xs text-[#77786E] mt-1">Authenticating and retrieving member workspace credentials</p>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell maxWidth="7xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-[#FCFAF6] px-5 py-3.5 rounded-2xl shadow-2xl border border-[#D99B43]/50 flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircleIcon size={20} className="text-[#2E7D32] shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================
          A. HEADER IDENTITY & STANDING CARD
         ======================================================== */}
      <div className="bg-white/95 rounded-3xl border border-[#EADFCF] p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(41,48,45,0.06)] backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#29302D] via-[#222725] to-[#1E2421] text-[#D99B43] flex items-center justify-center font-black text-3xl shadow-lg shrink-0 border border-[#D99B43]/40">
              {user.fullName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-[#77786E] bg-[#FAF7F2] border border-[#EADFCF] px-2.5 py-0.5 rounded-lg">
                  ID: {user.id || user.userId}
                </span>
                <WorkspaceBadge variant="active" size="sm">
                  ● ACTIVE Account
                </WorkspaceBadge>
                <WorkspaceBadge variant="luxury" size="sm">
                  {user.membershipPlan || '1st Year Member'}
                </WorkspaceBadge>
                <WorkspaceBadge variant="proposal" size="sm">
                  KYC Verified
                </WorkspaceBadge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#29302D] tracking-tight">
                {user.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-3 py-1 rounded-xl bg-[#FFF4F0] text-[#C66B52] border border-[#E58C72]/30 text-xs font-black">
                  {user.primaryCategory || user.categoryName}
                </span>
                {(user.subcategories || [user.subCategory]).filter(Boolean).map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-white text-[#77786E] text-xs font-bold border border-[#EADFCF]"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <WorkspaceButton
              variant="charcoal"
              size="md"
              icon={<EditIcon size={16} />}
              onClick={handleOpenEdit}
            >
              Edit Profile
            </WorkspaceButton>
          </div>
        </div>
      </div>

      {/* ========================================================
          B. UNIVERSAL MEMBER WALLET & BALANCES (SECTION 2 & 3)
         ======================================================== */}
      <div className="bg-white/95 rounded-3xl border border-[#EADFCF] p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(41,48,45,0.05)] space-y-6">
        <div className="border-b border-[#EADFCF] pb-5 space-y-3">
          {/* Top Row: Category Badge on Left, View Details / Hide Details Toggle on Right */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-black uppercase tracking-wider">
              <span>Universal Member Wallet</span>
            </div>

            {/* View Details Popup Button */}
            <button
              type="button"
              onClick={() => {
                setIsTransactionModalOpen(true);
                setTxCurrentPage(1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs border bg-white text-[#D99B43] hover:text-[#B87A28] border-[#D99B43]/50 hover:border-[#D99B43] hover:bg-[#FCFAF6]"
              title="Open wallet transaction history & audit ledger in a popup"
            >
              <span>View Details</span>
              <span className="font-bold text-base leading-none">→</span>
            </button>
          </div>

          {/* Main Title Row: Heading & Description on Left, Financial Action Buttons on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#29302D] tracking-tight">
                Personal Wallet & Balances
              </h2>
              <p className="text-xs sm:text-sm text-[#77786E] mt-0.5">
                Secure, ledger-backed stored-value account with auditable transaction tracking.
              </p>
            </div>

            {/* Action Buttons: Add Funds, Withdraw Funds, Renew Membership */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsAddFundsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#2E7D32] to-[#388E3C] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white shadow-md transition-all cursor-pointer"
              >
                <PlusIcon size={16} />
                <span>Add Funds</span>
              </button>
              <button
                onClick={() => {
                  setWithdrawError('');
                  setIsWithdrawModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white border border-[#EADFCF] hover:border-[#8064A9] text-[#29302D] hover:text-[#8064A9] transition-all cursor-pointer shadow-2xs"
              >
                Withdraw Funds
              </button>
              <button
                onClick={() => setIsRenewModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#D99B43] to-[#B87A28] text-white shadow-md hover:from-[#C88A32] hover:to-[#9C6818] transition-all cursor-pointer"
              >
                Renew Membership
              </button>
            </div>
          </div>
        </div>

        {/* 4 Primary Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Available Balance */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#29302D] via-[#222725] to-[#1E2421] text-white shadow-lg border border-[#D99B43]/30">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#D99B43] block mb-1">
              Available Balance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#FCFAF6]">
              ₹{(wallet?.availableBalance || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-white/70 block mt-1.5">
              Ready for renewal & services
            </span>
          </div>

          {/* 2. Pending Referral Rewards */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-[#FCFAF6] to-[#FDF6E9] border border-[#D99B43]/30 shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#9C6818] block mb-1">
              Pending Rewards
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#9C6818]">
              ₹{(wallet?.pendingBalance || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-[#B87A28] block mt-1.5 font-medium">
              Under verification review
            </span>
          </div>

          {/* 3. Total Referral Earnings */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-[#FAF8FD] to-[#F4EEFB] border border-[#8064A9]/30 shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8064A9] block mb-1">
              Referral Earnings
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#8064A9]">
              ₹{(wallet?.totalReferralEarnings || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-[#8064A9]/80 block mt-1.5 font-medium">
              Approved rewards to date
            </span>
          </div>

          {/* 4. Total Wallet Credits */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-[#F6FBF7] to-[#E8F5E9] border border-[#2E7D32]/30 shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1B5E20] block mb-1">
              Total Credits
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#1B5E20]">
              ₹{((wallet?.totalAdded || 0) + (wallet?.totalReferralEarnings || 0)).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-[#2E7D32] block mt-1.5 font-medium">
              Lifetime inflows & top-ups
            </span>
          </div>
        </div>

        {/* Secondary Ledger Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
            <span className="text-[#77786E] block font-bold">For Renewal</span>
            <strong className="text-[#29302D] font-black block mt-0.5">
              ₹{(wallet?.membershipEligibleBalance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
            <span className="text-[#77786E] block font-bold">For Withdrawal</span>
            <strong className="text-[#29302D] font-black block mt-0.5">
              ₹{(wallet?.withdrawalEligibleBalance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
            <span className="text-[#77786E] block font-bold">Total Added</span>
            <strong className="text-[#2E7D32] font-black block mt-0.5">
              ₹{(wallet?.totalAdded || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
            <span className="text-[#77786E] block font-bold">Total Withdrawn</span>
            <strong className="text-[#29302D] font-black block mt-0.5">
              ₹{(wallet?.totalWithdrawn || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
            <span className="text-[#77786E] block font-bold">Renewal Debits</span>
            <strong className="text-[#29302D] font-black block mt-0.5">
              ₹{(wallet?.totalRenewalSpent || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
            <span className="text-[#77786E] block font-bold">Wallet Standing</span>
            <strong className="text-[#2E7D32] font-black block mt-0.5">
              ● {wallet?.status || 'ACTIVE'}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================
          C. REFERRAL PROGRAMME (SECTION 7 & 8)
         ======================================================== */}
      <div className="bg-white/95 rounded-3xl border border-[#EADFCF] p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(41,48,45,0.05)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF] pb-4 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8064A9]/10 text-[#8064A9] text-xs font-black uppercase tracking-wider mb-1">
              <span>Universal Member Rewards</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#29302D] tracking-tight">
              Referral Programme & Earnings
            </h2>
            <p className="text-xs sm:text-sm text-[#77786E] mt-0.5">
              Invite entrepreneurs and businesses to FIC Business Hub and earn ₹500 wallet reward per verified membership.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#2E7D32]/10 text-[#1B5E20] text-xs font-black border border-[#2E7D32]/30 shadow-2xs">
              Reward: ₹500 per Referral
            </span>
          </div>
        </div>

        {/* Unique Code & Link Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-xs text-[#77786E] block font-bold">Your Unique Referral Code</span>
              <span className="text-lg font-black font-mono text-[#29302D] tracking-wider block mt-0.5">
                {referralData?.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white border border-[#EADFCF] hover:border-[#8064A9] hover:text-[#8064A9] text-[#29302D] transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              Copy Code
            </button>
          </div>

          {/* Referral Link */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <span className="text-xs text-[#77786E] block font-bold">Your Unique Referral Link</span>
              <span className="text-xs font-mono text-[#29302D] truncate block mt-1 font-semibold">
                {referralData?.referralLink}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#29302D] hover:bg-[#8064A9] text-white transition-all cursor-pointer shadow-2xs"
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
          MODAL 0: WALLET TRANSACTION HISTORY & AUDIT LEDGER POPUP
         ======================================================== */}
      {isTransactionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
          onClick={() => setIsTransactionModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-[#EADFCF] space-y-6 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EADFCF] gap-3 shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8064A9]/10 text-[#8064A9] text-[11px] font-black uppercase tracking-wider mb-1">
                  <SparklesIcon size={12} />
                  <span>Real-Time Ledger Audit</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#29302D] tracking-tight">
                  Wallet Transaction History & Audit Ledger
                </h3>
                <p className="text-xs text-[#77786E]">
                  Immutable double-entry record of all credits, top-ups, referral bonuses, renewals and withdrawals.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleDownloadStatement}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#EADFCF] hover:border-[#8064A9] text-[#29302D] hover:text-[#8064A9] transition-all cursor-pointer shadow-2xs"
                >
                  <FileTextIcon size={14} />
                  <span>Download Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#FAF7F2] hover:bg-[#EADFCF] text-[#77786E] hover:text-[#29302D] flex items-center justify-center font-bold text-base transition-all cursor-pointer border border-[#EADFCF]"
                  title="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto space-y-6 pr-1 flex-1">
              {/* 5 Transaction Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Total Transactions */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#77786E] uppercase tracking-wider block">
                    Total Transactions
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#29302D] mt-1">
                    {totalTxCount}
                  </div>
                  <span className="text-[11px] text-[#77786E] font-medium block mt-0.5">
                    Recorded entries
                  </span>
                </div>

                {/* 2. Total Credits */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-[#F6FBF7] border border-[#2E7D32]/25 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#1B5E20] uppercase tracking-wider block">
                    Total Credits
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#2E7D32] mt-1">
                    +₹{totalCreditsAmount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-[#2E7D32]/80 font-medium block mt-0.5">
                    Total inflows & top-ups
                  </span>
                </div>

                {/* 3. Total Debits */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-[#FFF4F0] border border-[#C66B52]/25 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#C66B52] uppercase tracking-wider block">
                    Total Debits
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#C66B52] mt-1">
                    -₹{totalDebitsAmount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-[#C66B52]/80 font-medium block mt-0.5">
                    Renewals & withdrawals
                  </span>
                </div>

                {/* 4. Pending */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-[#FDF6E9] border border-[#D99B43]/25 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#9C6818] uppercase tracking-wider block">
                    Pending
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#9C6818] mt-1">
                    {pendingTxCount}
                  </div>
                  <span className="text-[11px] text-[#B87A28] font-medium block mt-0.5">
                    Under verification
                  </span>
                </div>

                {/* 5. Completed */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-[#FAF8FD] border border-[#8064A9]/25 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#8064A9] uppercase tracking-wider block">
                    Completed
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#8064A9] mt-1">
                    {completedTxCount}
                  </div>
                  <span className="text-[11px] text-[#8064A9]/80 font-medium block mt-0.5">
                    Settled ledger entries
                  </span>
                </div>
              </div>

              {/* Filters, Flow Selector & Search Toolbar */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] space-y-3.5">
                {/* Row 1: Category Filter Pills + Flow Selector */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Category Type Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#77786E] mr-1">
                      Type:
                    </span>
                    {[
                      { key: 'ALL', label: 'All Transactions' },
                      { key: WalletTransactionType.ADD_FUNDS, label: 'Add Funds' },
                      { key: WalletTransactionType.REFERRAL_REWARD, label: 'Referral Rewards' },
                      { key: WalletTransactionType.MEMBERSHIP_RENEWAL, label: 'Renewals' },
                      { key: WalletTransactionType.WITHDRAWAL, label: 'Withdrawals' },
                      { key: WalletTransactionType.ADJUSTMENT, label: 'Adjustments' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setTxTypeFilter(tab.key);
                          setTxCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          txTypeFilter === tab.key
                            ? 'bg-[#29302D] text-white shadow-xs'
                            : 'bg-white text-[#77786E] border border-[#EADFCF] hover:border-[#8064A9] hover:text-[#29302D]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Flow Toggle: All / Credit / Debit */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EADFCF] shrink-0 self-start lg:self-auto">
                    <span className="text-[11px] font-black text-[#77786E] px-2 uppercase tracking-wider">
                      Flow:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTxFlowFilter('ALL');
                        setTxCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        txFlowFilter === 'ALL'
                          ? 'bg-[#29302D] text-white shadow-xs'
                          : 'text-[#77786E] hover:text-[#29302D]'
                      }`}
                    >
                      All Flows
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxFlowFilter('CREDIT');
                        setTxCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        txFlowFilter === 'CREDIT'
                          ? 'bg-[#2E7D32] text-white shadow-xs'
                          : 'text-[#2E7D32] hover:bg-[#2E7D32]/10'
                      }`}
                    >
                      + Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxFlowFilter('DEBIT');
                        setTxCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        txFlowFilter === 'DEBIT'
                          ? 'bg-[#C66B52] text-white shadow-xs'
                          : 'text-[#C66B52] hover:bg-[#C66B52]/10'
                      }`}
                    >
                      - Debits
                    </button>
                  </div>
                </div>

                {/* Row 2: Status Filter + Search Input */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#EADFCF]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#77786E] uppercase tracking-wider">
                      Status:
                    </span>
                    <select
                      value={txStatusFilter}
                      onChange={(e) => {
                        setTxStatusFilter(e.target.value);
                        setTxCurrentPage(1);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-[#EADFCF] rounded-xl text-[#29302D] focus:outline-none focus:ring-1 focus:ring-[#8064A9] cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value={WalletTransactionStatus.COMPLETED}>Completed</option>
                      <option value={WalletTransactionStatus.PENDING}>Pending Verification</option>
                      <option value={WalletTransactionStatus.FAILED}>Failed</option>
                    </select>

                    {(txTypeFilter !== 'ALL' || txFlowFilter !== 'ALL' || txStatusFilter !== 'ALL' || txSearchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTxTypeFilter('ALL');
                          setTxFlowFilter('ALL');
                          setTxStatusFilter('ALL');
                          setTxSearchQuery('');
                          setTxCurrentPage(1);
                        }}
                        className="text-xs font-bold text-[#8064A9] hover:underline ml-2 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Search box */}
                  <div className="relative sm:w-72">
                    <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77786E]" />
                    <input
                      type="text"
                      placeholder="Search ref ID, description or ₹..."
                      value={txSearchQuery}
                      onChange={(e) => {
                        setTxSearchQuery(e.target.value);
                        setTxCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#EADFCF] rounded-xl text-[#29302D] placeholder-[#77786E]/70 focus:outline-none focus:ring-1 focus:ring-[#8064A9]"
                    />
                  </div>
                </div>
              </div>

              {/* Comprehensive 8-Column Transaction Table */}
              <div className="border border-[#EADFCF] rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-[#29302D]">
                    <thead className="bg-[#FAF7F2] border-b border-[#EADFCF] text-[11px] uppercase tracking-wider text-[#77786E] font-black">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">Reference ID</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Date & Time</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Transaction Type</th>
                        <th className="px-4 py-3.5">Description</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">Credit (+)</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">Debit (-)</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Transaction Status</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADFCF]/60">
                      {paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center">
                            <div className="max-w-xs mx-auto text-center space-y-2">
                              <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF7F2] border border-[#EADFCF] flex items-center justify-center text-[#77786E]">
                                <FileTextIcon size={18} />
                              </div>
                              <p className="text-sm font-bold text-[#29302D]">No transactions found</p>
                              <p className="text-xs text-[#77786E]">
                                No wallet transactions match your active filters or search keyword.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions.map((tx) => {
                          const isCredit = tx.direction === 'CREDIT';
                          return (
                            <tr key={tx.transactionId} className="hover:bg-[#FAF7F2]/60 transition-colors">
                              {/* 1. Reference ID */}
                              <td className="px-4 py-3.5 font-mono font-black text-[#29302D] whitespace-nowrap">
                                <span className="bg-[#FAF7F2] px-2 py-1 rounded-md border border-[#EADFCF] text-[11.5px]">
                                  {tx.transactionId}
                                </span>
                              </td>

                              {/* 2. Date & Time */}
                              <td className="px-4 py-3.5 text-[#77786E] whitespace-nowrap font-medium">
                                {tx.createdAt}
                              </td>

                              {/* 3. Transaction Type */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {getTxTypeBadge(tx.transactionType)}
                              </td>

                              {/* 4. Description */}
                              <td className="px-4 py-3.5 max-w-[240px] truncate font-medium text-[#29302D]" title={tx.description}>
                                {tx.description}
                              </td>

                              {/* 5. Credit (+) */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap font-black">
                                {isCredit ? (
                                  <span className="text-[#2E7D32] bg-[#E8F5E9]/60 border border-[#2E7D32]/20 px-2 py-0.5 rounded-lg">
                                    +₹{(tx.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[#77786E]/40 font-bold">—</span>
                                )}
                              </td>

                              {/* 6. Debit (-) */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap font-black">
                                {!isCredit ? (
                                  <span className="text-[#C66B52] bg-[#FFF4F0] border border-[#C66B52]/20 px-2 py-0.5 rounded-lg">
                                    -₹{(tx.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[#77786E]/40 font-bold">—</span>
                                )}
                              </td>

                              {/* 7. Status */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {getTxStatusBadge(tx.status)}
                              </td>

                              {/* 8. Balance After */}
                              <td className="px-4 py-3.5 text-right font-mono font-black text-[#29302D] whitespace-nowrap">
                                ₹{(tx.balanceAfter || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Toolbar */}
                {filteredTransactions.length > 0 && (
                  <div className="px-4 py-3 border-t border-[#EADFCF] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[#77786E] font-medium">
                      Showing{' '}
                      <strong className="text-[#29302D] font-black">
                        {startIdx + 1}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-[#29302D] font-black">
                        {Math.min(startIdx + txPerPage, filteredTransactions.length)}
                      </strong>{' '}
                      of{' '}
                      <strong className="text-[#29302D] font-black">
                        {filteredTransactions.length}
                      </strong>{' '}
                      transactions
                    </span>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={currentSafePage <= 1}
                        onClick={() => setTxCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#EADFCF] bg-white text-[#29302D] font-bold hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        ← Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setTxCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              currentSafePage === pageNum
                                ? 'bg-[#29302D] text-white shadow-xs'
                                : 'bg-white border border-[#EADFCF] text-[#77786E] hover:border-[#8064A9] hover:text-[#29302D]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={currentSafePage >= totalPages}
                        onClick={() => setTxCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#EADFCF] bg-white text-[#29302D] font-bold hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EADFCF] flex items-center justify-between text-xs text-[#77786E] shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheckIcon size={15} className="text-[#2E7D32]" />
                <span>Ledger cryptographically verified & audit compliant</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTransactionModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#29302D] hover:bg-[#1E2421] text-white font-bold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
    </WorkspaceShell>
  );
};

export default ProfilePage;

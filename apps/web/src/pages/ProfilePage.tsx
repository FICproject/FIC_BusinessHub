import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Badge, Button, Input } from '@fic/ui';
import { AnimatedCounter, motionSprings, modalBackdrop, modalEntrance } from '../motion';
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
  setStoredUser,
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
  apiRequest,
  AuthenticatedUser,
  UserAddress,
  IMemberWallet,
  IWalletTransaction,
  IReferral,
  IMemberBankAccount,
  WalletTransactionType,
  WalletTransactionStatus
,
  fetchMyKycStatus,
  downloadOriginalDocument,
  fetchLiveWalletSummary,
  fetchLiveWalletTransactions,
  getMyPaymentHistory,
  UploadedDocumentAsset
} from '../services/api';
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { getIndianStates, getDistrictsForState, validateIndianPinCode } from '../services/indianLocations';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<AuthenticatedUser | null>(() => getStoredUser());
  const userId = user?.id || user?.userId || 'usr_kathir_001';

  // Live Wallet & Financial State
  const [wallet, setWallet] = useState<IMemberWallet | null>(null);
  const [privateDocuments, setPrivateDocuments] = useState<UploadedDocumentAsset[]>([]);
  const [kycStatusSummary, setKycStatusSummary] = useState<{ status: string; isKycApproved: boolean } | null>(null);
  const [viewerDocument, setViewerDocument] = useState<UploadedDocumentAsset | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [razorpayModalConfig, setRazorpayModalConfig] = useState<{
    isOpen: boolean;
    purpose: 'WALLET_TOPUP' | 'MEMBERSHIP_RENEWAL';
    amount: number;
    title: string;
    subtitle: string;
  } | null>(null);
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

  // Referred Members Modal State (Opened by "View Details" button in Referral section)
  const [isReferralModalOpen, setIsReferralModalOpen] = useState<boolean>(false);
  const [referralPage, setReferralPage] = useState<number>(1);
  const referralPerPage = 5;

  // Referral State
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    referralLink: string;
    summary: any;
    referrals: IReferral[];
  } | null>(null);

  // Bank Account State
  const [bankAccount, setBankAccount] = useState<IMemberBankAccount | null>(null);

  // Community Pool Investments & Yield Returns State
  const [myInvestments, setMyInvestments] = useState<any[]>([]);

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
  const [editAddressLine1, setEditAddressLine1] = useState('');
  const [editAddressLine2, setEditAddressLine2] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('Tamil Nadu');
  const [editDistrict, setEditDistrict] = useState('Chennai');
  const [editPincode, setEditPincode] = useState('');
  const [editAddressType, setEditAddressType] = useState('Residential');
  const [editPinError, setEditPinError] = useState('');
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
  const refreshFinancialData = async (uid: string) => {
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
    const bnk = getUserBankAccount(uid);
    setBankAccount(bnk);

    // Sync real backend MongoDB wallet, strictly Admin-approved KYC documents, and Razorpay payment history
    try {
      const [liveWallet, liveTxs, kycData, payments] = await Promise.all([
        fetchLiveWalletSummary(),
        fetchLiveWalletTransactions(),
        fetchMyKycStatus(),
        getMyPaymentHistory()
      ]);
      if (liveWallet) setWallet(liveWallet);
      if (liveTxs && liveTxs.length > 0) {
        setAllUserTransactions(liveTxs);
        setTransactions(liveTxs);
      }
      if (kycData) {
        setKycStatusSummary({
          status: String(kycData.kycStatus || kycData.status || (kycData.isKycApproved ? 'APPROVED' : 'PENDING')),
          isKycApproved: Boolean(kycData.isKycApproved)
        });
        const approvedRaw = Array.isArray(kycData.approvedDocuments)
          ? kycData.approvedDocuments
          : (kycData.documents || []).filter((d: any) => {
              const s = String(d?.status || '').toUpperCase();
              return s === 'APPROVED' || s === 'VERIFIED';
            });
        const normalizedApproved: UploadedDocumentAsset[] = approvedRaw.map((doc: any, idx: number) => ({
          documentId: doc.documentId || `approved-${doc.docKey || idx}`,
          entityType: 'KYC',
          documentCategory: doc.documentCategory || doc.documentType || doc.docKey || 'KYC_DOCUMENT',
          documentLabel: doc.title || doc.documentLabel || 'Verified KYC Document',
          originalFileName: doc.originalFileName || doc.fileName || doc.title || 'verified-document',
          originalMimeType: doc.originalMimeType || 'application/octet-stream',
          originalFileExtension:
            doc.originalFileExtension || (doc.fileName ? String(doc.fileName).split('.').pop() || 'file' : 'file'),
          originalFileSize: Number(doc.originalFileSize || 0),
          checksum: doc.checksum || '',
          compressionRatio: 0,
          hasPreview: Boolean(doc.documentId),
          hasThumbnail: Boolean(doc.documentId),
          documentStatus: 'VERIFIED',
          createdAt: doc.reviewedAt || doc.uploadedAt || new Date().toISOString(),
          viewUrl: doc.viewUrl || (doc.documentId ? `/api/v1/documents/${doc.documentId}/view` : ''),
          previewUrl: doc.documentId ? `/api/v1/documents/${doc.documentId}/preview` : '',
          thumbnailUrl: doc.documentId ? `/api/v1/documents/${doc.documentId}/thumbnail` : '',
          downloadUrl: doc.documentId ? `/api/v1/documents/${doc.documentId}/download` : ''
        }));
        setPrivateDocuments(normalizedApproved);
      }
      if (payments) setPaymentHistory(payments);
    } catch {
      // Keep non-fatal fallback if user session has no backend JWT yet
    }
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
    if (searchParams.get('edit') === 'true') {
      const stored = getStoredUser();
      if (stored) {
        populateForm(stored);
      }
      setDobError('');
      setIsEditModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('edit');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  const isAnyModalOpen =
    isReferralModalOpen ||
    isTransactionModalOpen ||
    isEditModalOpen ||
    isAddFundsModalOpen ||
    isWithdrawModalOpen ||
    isRenewModalOpen ||
    isBankModalOpen;

  // Lock body scroll and handle Escape key for all modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsReferralModalOpen(false);
        setIsTransactionModalOpen(false);
        setIsEditModalOpen(false);
        setIsAddFundsModalOpen(false);
        setIsWithdrawModalOpen(false);
        setIsRenewModalOpen(false);
        setIsBankModalOpen(false);
      }
    };
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen]);

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
    setEditAddressLine1(u.address?.addressLine1 || u.personalInfo?.address || '');
    setEditAddressLine2(u.address?.addressLine2 || '');
    setEditLandmark(u.address?.landmark || '');
    const resolvedState = u.address?.state || u.personalInfo?.state || 'Tamil Nadu';
    setEditState(resolvedState);
    const districts = getDistrictsForState(resolvedState);
    setEditDistrict(u.address?.district || u.personalInfo?.district || districts[0] || 'Chennai');
    setEditCity(u.address?.city || u.personalInfo?.city || '');
    setEditPincode(u.address?.pinCode || u.personalInfo?.pincode || '');
    setEditAddressType(u.address?.addressType || 'Residential');
    setEditPinError('');
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
    const finalAmt = customTopUp ? Number(customTopUp) : topUpAmount;
    if (!finalAmt || finalAmt < 100 || finalAmt > 200000) {
      showToast('Please enter an amount between ₹100 and ₹2,00,000.');
      return;
    }

    setIsAddFundsModalOpen(false);
    setRazorpayModalConfig({
      isOpen: true,
      purpose: 'WALLET_TOPUP',
      amount: finalAmt,
      title: 'FIC WALLET TOP-UP',
      subtitle: `Wallet Credit · ₹${finalAmt.toLocaleString('en-IN')}`
    });
  };

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

  // Referred members pagination calculation for modal
  const allReferrals = referralData?.referrals || [];
  const totalReferralCount = allReferrals.length;
  const totalReferralPages = Math.max(1, Math.ceil(totalReferralCount / referralPerPage));
  const safeReferralPage = Math.min(Math.max(1, referralPage), totalReferralPages);
  const startRefIdx = (safeReferralPage - 1) * referralPerPage;
  const paginatedReferrals = allReferrals.slice(startRefIdx, startRefIdx + referralPerPage);

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
      <WorkspaceShell>
        <div className="py-24 text-center">
          <p className="text-base font-bold text-[#51463F]">Loading Member Profile...</p>
          <p className="text-xs text-[#82776E] mt-1">Authenticating and retrieving member workspace credentials</p>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#51463F] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#EDE2D7] flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircleIcon size={20} className="text-[#3B9C91] shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================
          A. HEADER IDENTITY & STANDING CARD
         ======================================================== */}
      <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 lg:p-6 shadow-[0_4px_24px_-4px_rgba(81,70,63,0.06)] backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#E8795B] via-[#E26D4D] to-[#D95F3F] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-[0_4px_16px_rgba(232,121,91,0.3)] shrink-0 border border-[#E8795B]/40">
              {user.fullName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-[#82776E] bg-[#FAF7F2] border border-[#EDE2D7] px-2 py-0.5 rounded-md">
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
              <h1 className="text-xl sm:text-2xl font-black text-[#51463F] tracking-tight">
                {user.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#FFF0EB] text-[#E8795B] border border-[#E8795B]/30 text-xs font-bold">
                  {user.primaryCategory || user.categoryName}
                </span>
                {(user.subcategories || [user.subCategory]).filter(Boolean).map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-white text-[#82776E] text-xs font-medium border border-[#EDE2D7]"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <WorkspaceButton
              variant="outline"
              size="md"
              icon={<EditIcon size={15} />}
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
      <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 lg:p-6 shadow-[0_4px_24px_-4px_rgba(81,70,63,0.05)] space-y-4 sm:space-y-5">
        <div className="border-b border-[#EDE2D7] pb-3.5 space-y-2">
          {/* Top Row: Category Badge on Left, View Details / Hide Details Toggle on Right */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B9C91]/15 text-[#3B9C91] text-[11px] font-black uppercase tracking-wider">
              <span>Universal Member Wallet</span>
            </div>

            {/* View Details Popup Button */}
            <button
              type="button"
              onClick={() => {
                setIsTransactionModalOpen(true);
                setTxCurrentPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer shadow-xs border bg-white text-[#E5A23B] hover:text-[#D08E27] border-[#E5A23B]/50 hover:border-[#E5A23B] hover:bg-[#FAF7F2]"
              title="Open wallet transaction history & audit ledger in a popup"
            >
              <span>View Details</span>
              <span className="font-bold text-sm leading-none">→</span>
            </button>
          </div>

          {/* Main Title Row: Heading & Description on Left, Financial Action Buttons on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#51463F] tracking-tight">
                Personal Wallet & Balances
              </h2>
              <p className="text-xs text-[#82776E] mt-0.5">
                Secure, ledger-backed stored-value account with auditable transaction tracking.
              </p>
            </div>

            {/* Action Buttons: Add Funds, Withdraw Funds, Renew Membership */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddFundsModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3B9C91] to-[#2E847A] hover:from-[#2E847A] hover:to-[#22675F] text-white shadow-xs transition-all cursor-pointer"
              >
                <PlusIcon size={14} />
                <span>Add Funds</span>
              </button>
              <button
                onClick={() => {
                  setWithdrawError('');
                  setIsWithdrawModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EDE2D7] hover:border-[#8064B1] text-[#51463F] hover:text-[#8064B1] transition-all cursor-pointer shadow-2xs"
              >
                Withdraw Funds
              </button>
              <button
                onClick={() => setIsRenewModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E5A23B] to-[#D08E27] text-white shadow-xs hover:from-[#D08E27] hover:to-[#BA7B1A] transition-all cursor-pointer"
              >
                Renew Membership
              </button>
            </div>
          </div>
        </div>

        {/* 4 Primary Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Available Balance */}
          <motion.div
            whileHover={{ y: -2, transition: motionSprings.cardHover }}
            className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-[#8064B1] via-[#6F52A3] to-[#593E8A] text-white shadow-md border border-[#8064B1]/40"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F8EBD0] block mb-0.5">
              Available Balance
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              <AnimatedCounter value={wallet?.availableBalance || 0} prefix="₹" />
            </div>
            <span className="text-[10.5px] text-white/80 block mt-1 font-medium">
              Ready for renewal & services
            </span>
          </motion.div>

          {/* 2. Pending Referral Rewards */}
          <motion.div
            whileHover={{ y: -2, transition: motionSprings.cardHover }}
            className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-white via-[#FCFAF6] to-[#FDF6E9] border border-[#D99B43]/30 shadow-2xs"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9C6818] block mb-0.5">
              Pending Rewards
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#9C6818]">
              <AnimatedCounter value={wallet?.pendingBalance || 0} prefix="₹" />
            </div>
            <span className="text-[10.5px] text-[#B87A28] block mt-1 font-medium">
              Under verification review
            </span>
          </motion.div>

          {/* 3. Total Referral Earnings */}
          <motion.div
            whileHover={{ y: -2, transition: motionSprings.cardHover }}
            className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-white via-[#FAF8FD] to-[#F4EEFB] border border-[#8064A9]/30 shadow-2xs"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8064A9] block mb-0.5">
              Referral Earnings
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#8064A9]">
              <AnimatedCounter value={wallet?.totalReferralEarnings || 0} prefix="₹" />
            </div>
            <span className="text-[10.5px] text-[#8064A9]/80 block mt-1 font-medium">
              Approved rewards to date
            </span>
          </motion.div>

          {/* 4. Total Wallet Credits */}
          <motion.div
            whileHover={{ y: -2, transition: motionSprings.cardHover }}
            className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-white via-[#F6FBF7] to-[#E8F5E9] border border-[#2E7D32]/30 shadow-2xs"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1B5E20] block mb-0.5">
              Total Credits
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1B5E20]">
              <AnimatedCounter value={(wallet?.totalAdded || 0) + (wallet?.totalReferralEarnings || 0)} prefix="₹" />
            </div>
            <span className="text-[10.5px] text-[#2E7D32] block mt-1 font-medium">
              Lifetime inflows & top-ups
            </span>
          </motion.div>
        </div>

        {/* Secondary Ledger Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#5A4F47] block font-bold text-[11px]">For Renewal</span>
            <strong className="text-[#51463F] font-black block mt-0.5 text-xs sm:text-sm">
              ₹{(wallet?.membershipEligibleBalance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#5A4F47] block font-bold text-[11px]">For Withdrawal</span>
            <strong className="text-[#51463F] font-black block mt-0.5 text-xs sm:text-sm">
              ₹{(wallet?.withdrawalEligibleBalance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#5A4F47] block font-bold text-[11px]">Total Added</span>
            <strong className="text-[#3B9C91] font-black block mt-0.5 text-xs sm:text-sm">
              ₹{(wallet?.totalAdded || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#5A4F47] block font-bold text-[11px]">Total Withdrawn</span>
            <strong className="text-[#51463F] font-black block mt-0.5 text-xs sm:text-sm">
              ₹{(wallet?.totalWithdrawn || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#5A4F47] block font-bold text-[11px]">Renewal Debits</span>
            <strong className="text-[#51463F] font-black block mt-0.5 text-xs sm:text-sm">
              ₹{(wallet?.totalRenewalSpent || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#5A4F47] block font-bold text-[11px]">Wallet Standing</span>
            <strong className="text-[#3B9C91] font-black block mt-0.5 text-xs sm:text-sm">
              ● {wallet?.status || 'ACTIVE'}
            </strong>
          </div>
        </div>

        {/* Community Investment Pools & Fixed Interest Returns Card */}
        {myInvestments.length > 0 && (
          <div className="pt-3 border-t border-[#EDE2D7] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUpIcon size={16} className="text-[#2C857B]" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#51463F]">
                  Community Investment Portfolio & Payouts
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#1C6960] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {myInvestments.length} Active Positions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myInvestments.map((inv, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#82776E]">{inv.poolCode}</span>
                      <h4 className="text-xs font-black text-[#51463F] line-clamp-1">{inv.poolTitle}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        inv.payoutStatus === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : inv.payoutStatus === 'DISBURSED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {inv.payoutStatus === 'COMPLETED' ? '✓ Yield Settled' : `Payout: ${inv.payoutStatus}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-white border border-[#EDE2D7]/80 text-center text-xs">
                    <div>
                      <span className="text-[9px] text-[#82776E] block font-semibold uppercase">Principal</span>
                      <span className="font-bold text-[#51463F]">₹{inv.investedAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#82776E] block font-semibold uppercase">Yield ({inv.annualYieldPercent}%)</span>
                      <span className="font-bold text-[#2C857B]">+₹{inv.expectedInterest?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#82776E] block font-semibold uppercase">Total Payout</span>
                      <span className="font-black text-[#1C6960]">₹{inv.totalMaturityAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-[#82776E] pt-1">
                    <span>Tenure: {inv.tenureMonths} Months</span>
                    <span className="font-mono">{inv.transactionReference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          C. REFERRAL PROGRAMME (SECTION 7 & 8)
         ======================================================== */}
      <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 lg:p-6 shadow-[0_4px_24px_-4px_rgba(81,70,63,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE2D7] pb-3 gap-2.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8064B1]/10 text-[#8064B1] text-[11px] font-black uppercase tracking-wider mb-0.5">
              <span>Universal Member Rewards</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#51463F] tracking-tight">
              Referral Programme & Earnings
            </h2>
            <p className="text-xs text-[#82776E] mt-0.5">
              Invite entrepreneurs and businesses to FIC Business Hub and earn ₹500 wallet reward per verified membership.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#3B9C91]/15 text-[#2E847A] text-xs font-bold border border-[#3B9C91]/30 shadow-2xs">
              Reward: ₹500 per Referral
            </span>
          </div>
        </div>

        {/* Unique Code & Link Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Referral Code */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[11px] text-[#82776E] block font-bold">Your Unique Referral Code</span>
              <span className="text-base font-black font-mono text-[#51463F] tracking-wider block mt-0.5">
                {referralData?.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#EDE2D7] hover:border-[#8064B1] hover:text-[#8064B1] text-[#51463F] transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              Copy Code
            </button>
          </div>

          {/* Referral Link */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <span className="text-[11px] text-[#82776E] block font-bold">Your Unique Referral Link</span>
              <span className="text-xs font-mono text-[#51463F] truncate block mt-0.5 font-semibold">
                {referralData?.referralLink}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#E8795B] to-[#D96B4E] hover:from-[#D96B4E] hover:to-[#C65D40] text-white transition-all cursor-pointer shadow-xs"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* View Details Button & Action Banner (Positioned ABOVE Summary Cards) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#FAF7F2] via-white to-[#F7F3FB] border border-[#EDE2D7] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8064B1]/10 text-[#8064B1] flex items-center justify-center shrink-0 border border-[#8064B1]/20 font-black text-sm">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-[#51463F]">
                  Referred Members & Registration Status
                </h4>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8064B1] bg-white px-2 py-0.5 rounded border border-[#8064B1]/20">
                  {referralData?.referrals?.length || 0} Members
                </span>
              </div>
              <p className="text-[11px] text-[#82776E] mt-0.5">
                View members who registered using your referral link.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsReferralModalOpen(true);
              setReferralPage(1);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold bg-gradient-to-r from-[#8064B1] to-[#6E529F] hover:from-[#6E529F] hover:to-[#5E448D] text-white transition-all cursor-pointer shadow-xs shrink-0"
          >
            <span>View Referred Members</span>
            <span className="text-xs">→</span>
          </button>
        </div>

        {/* 5 Referral Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <motion.div whileHover={{ y: -2, transition: motionSprings.cardHover }} className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-center">
            <span className="text-[#82776E] block font-medium text-[11px]">Total Referrals</span>
            <span className="text-lg font-black text-[#51463F] block mt-0.5">
              <AnimatedCounter value={referralData?.summary?.totalReferrals || 0} />
            </span>
          </motion.div>
          <motion.div whileHover={{ y: -2, transition: motionSprings.cardHover }} className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-center">
            <span className="text-[#82776E] block font-medium text-[11px]">Pending Verification</span>
            <span className="text-lg font-black text-[#E5A23B] block mt-0.5">
              <AnimatedCounter value={referralData?.summary?.pendingReferrals || 0} />
            </span>
          </motion.div>
          <motion.div whileHover={{ y: -2, transition: motionSprings.cardHover }} className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-center">
            <span className="text-[#82776E] block font-medium text-[11px]">KYC Approved</span>
            <span className="text-lg font-black text-[#3B9C91] block mt-0.5">
              <AnimatedCounter value={referralData?.summary?.kycApprovedReferrals || 0} />
            </span>
          </motion.div>
          <motion.div whileHover={{ y: -2, transition: motionSprings.cardHover }} className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-center">
            <span className="text-[#82776E] block font-medium text-[11px]">Pending Reward</span>
            <span className="text-lg font-black text-[#E5A23B] block mt-0.5">
              <AnimatedCounter value={referralData?.summary?.rewardPending || 0} prefix="₹" />
            </span>
          </motion.div>
          <motion.div whileHover={{ y: -2, transition: motionSprings.cardHover }} className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-center col-span-2 sm:col-span-1">
            <span className="text-[#82776E] block font-medium text-[11px]">Total Earned</span>
            <span className="text-lg font-black text-[#8064B1] block mt-0.5">
              <AnimatedCounter value={referralData?.summary?.rewardCredited || 0} prefix="₹" />
            </span>
          </motion.div>
        </div>
      </div>

      {/* ========================================================
          D. MEMBERSHIP TERMS & WALLET RENEWAL (SECTION 6)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE2D7] pb-3 gap-2.5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#51463F]">Membership Terms & Standing</h3>
            <p className="text-xs text-[#82776E]">Official commercial credentials for your account</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#E5A23B] bg-[#F8EBD0]/60 px-2.5 py-1 rounded-lg border border-[#E5A23B]/30">
              {user.membershipPlan || '1st Year Membership'}
            </span>
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#E5A23B] to-[#D08E27] hover:from-[#D08E27] hover:to-[#BA7B1A] text-white shadow-xs transition-colors"
            >
              Renew Membership Using Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#82776E] block font-medium">Plan</span>
            <strong className="text-[#51463F] text-xs sm:text-sm block mt-0.5">
              {user.membershipPlan || 'First-Year Access'}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#82776E] block font-medium">Amount Paid</span>
            <strong className="text-emerald-700 text-xs sm:text-sm block mt-0.5">
              {user.membershipAmountPaid || '₹99'}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#82776E] block font-medium">Validity Term</span>
            <strong className="text-[#51463F] text-xs sm:text-sm block mt-0.5">
              {user.membershipExpiryDate || 'Valid for 365 Days'}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#82776E] block font-medium">Account Status</span>
            <span className="inline-block mt-0.5 text-emerald-700 font-bold">
              ● {user.membershipStatus || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Live Renewal Status Banner */}
        <div className="p-3 rounded-xl bg-[#FFF9F0] border border-[#E5A23B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <span className="font-bold text-[#51463F] block">
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
              className="px-3.5 py-1.5 bg-[#27AE60] hover:bg-[#219653] text-white font-bold rounded-xl transition-colors shrink-0"
            >
              Renew for ₹5,999
            </button>
          ) : (
            <button
              onClick={() => {
                setCustomTopUp(String(renewalShortfall));
                setIsAddFundsModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#C66B52] hover:bg-[#B55A41] text-white font-bold rounded-xl transition-colors shrink-0"
            >
              Top Up Shortfall (₹{renewalShortfall.toLocaleString('en-IN')})
            </button>
          )}
        </div>
      </div>



      {/* ========================================================
          F. PERSONAL & PROFESSIONAL DETAILS (2-COLUMN)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-2.5">
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-[#8064B1]" />
              <h3 className="text-sm sm:text-base font-black text-[#51463F]">Personal Information</h3>
            </div>
            <span className="text-[11px] text-[#82776E]">Authenticated Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#82776E] block font-medium">Full Legal Name</span>
              <strong className="text-[#51463F] text-xs sm:text-sm block mt-0.5">{user.fullName}</strong>
            </div>

            <div>
              <span className="text-[#82776E] block font-medium">Email Address</span>
              <span className="text-[#51463F] text-xs sm:text-sm block mt-0.5 font-medium truncate">
                {user.email}
              </span>
            </div>

            <div>
              <span className="text-[#82776E] block font-medium">Mobile Phone Number</span>
              <strong className="text-[#51463F] text-xs sm:text-sm block mt-0.5">
                {user.mobileNumber || user.phoneNumber || 'Not provided'}
              </strong>
            </div>

            <div>
              <span className="text-[#82776E] block font-medium">Date of Birth</span>
              <strong className="text-[#51463F] text-xs sm:text-sm block mt-0.5">
                {user.personalInfo?.dob || (user as any).dob || '15 Aug 1996'}
              </strong>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[#82776E] block font-medium">Registered Address & Location</span>
              {(user.address?.addressLine1 || user.personalInfo?.address) ? (
                <div className="flex items-start justify-between gap-3 mt-1">
                  <span className="text-[#51463F] text-xs leading-relaxed font-medium">
                    {user.address
                      ? `${user.address.addressLine1}${user.address.addressLine2 ? ', ' + user.address.addressLine2 : ''}${user.address.landmark ? ', Landmark: ' + user.address.landmark : ''}, ${user.address.city}, ${user.address.district}, ${user.address.state} - ${user.address.pinCode}, ${user.address.country || 'India'}`
                      : `${user.personalInfo?.address || ''}${user.personalInfo?.city ? ', ' + user.personalInfo.city : ''}${user.personalInfo?.district ? ', ' + user.personalInfo.district : ''}${user.personalInfo?.state ? ', ' + user.personalInfo.state : ''}${user.personalInfo?.pincode ? ' - ' + user.personalInfo.pincode : ''}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="text-[11px] font-bold text-[#8064B1] hover:underline shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[#82776E] italic text-xs">Address Not Provided</span>
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#8064B1] bg-[#8064B1]/10 hover:bg-[#8064B1]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    + Add Address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-white rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-2.5">
            <div className="flex items-center gap-2">
              <BriefcaseIcon size={16} className="text-[#8064B1]" />
              <h3 className="text-sm sm:text-base font-black text-[#51463F]">Professional & Business Profile</h3>
            </div>
            <span className="text-xs text-[#8064B1] font-bold">
              {user.primaryCategory || user.categoryName}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[#82776E] block font-medium">Professional Title / Organization</span>
              <strong className="text-[#51463F] text-xs sm:text-sm block mt-0.5">
                {user.subCategory ||
                  user.professionalInfo?.roleTitle ||
                  user.professionalInfo?.businessName ||
                  'Enterprise Member'}
              </strong>
            </div>

            {user.professionalInfo?.skills && user.professionalInfo.skills.length > 0 && (
              <div>
                <span className="text-[#82776E] block font-medium mb-1">Skills & Capabilities</span>
                <div className="flex flex-wrap gap-1.5">
                  {user.professionalInfo.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#51463F] font-bold text-[11px] border border-[#EDE2D7]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.professionalInfo?.description && (
              <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EDE2D7] text-[#51463F] leading-relaxed text-xs">
                {user.professionalInfo.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {paymentHistory.length > 0 && (
        <div className="bg-white/95 rounded-2xl border border-[#EDE2D7] p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-3 mb-4">
            <h3 className="text-sm sm:text-base font-black text-[#51463F]">
              Verified Razorpay Payments
            </h3>
            <span className="text-[11px] font-bold text-[#3B9C91]">
              {paymentHistory.length} Record(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EDE2D7] text-[#82776E]">
                  <th className="py-2 pr-3">Payment / Razorpay ID</th>
                  <th className="py-2 pr-3">Purpose</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D7]/60">
                {paymentHistory.slice(0, 6).map((p: any) => (
                  <tr key={p.paymentId || p._id}>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-[#51463F]">
                      {p.razorpayPaymentId || p.internalOrderId || p.paymentId}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-[#51463F]">
                      {String(p.purpose || '').replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 pr-3 text-[#82776E]">
                      {p.paymentMethod || p.preferredMethod || 'RAZORPAY'}
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-[#51463F]">
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                        {p.signatureVerified ? ' ✓' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ========================================================
          G. KYC VERIFICATION & COMPLIANCE FILES (SIMPLIFIED)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE2D7] pb-2.5 gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#51463F]">KYC Verification & Documents</h3>
            <p className="text-xs text-[#82776E]">Government & business verification records for your account</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#82776E] font-medium">Overall Status:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {renderKycBadge(
                kycStatusSummary?.isKycApproved || user.isKycApproved
                  ? 'VERIFIED'
                  : kycStatusSummary?.status || 'PENDING'
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#EDE2D7]/70">
          {privateDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              {privateDocuments.map((doc) => {
                const hasStoredAsset = Boolean(doc.documentId && !String(doc.documentId).startsWith('approved-'));
                return (
                  <div
                    key={doc.documentId}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3B9C91]">
                          {doc.documentCategory.replace(/_/g, ' ')} · {doc.originalFileExtension.toUpperCase()}
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-[#51463F] truncate">
                          {doc.documentLabel || doc.originalFileName}
                        </div>
                        <div className="text-[11px] text-[#82776E] truncate">
                          {doc.originalFileName}
                          {doc.originalFileSize > 0 ? ` · ${(doc.originalFileSize / 1024).toFixed(1)} KB` : ''}
                        </div>
                      </div>
                      {renderKycBadge('APPROVED')}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EDE2D7]/70">
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Admin Approved · Verified Record
                      </span>
                      {hasStoredAsset && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewerDocument(doc)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE2D7] hover:border-[#3B9C91] text-[#51463F] text-xs font-bold cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadOriginalDocument(doc.documentId, doc.originalFileName)}
                            className="px-2.5 py-1 rounded-lg bg-[#0A1D37] hover:bg-[#132E52] text-white text-xs font-bold cursor-pointer"
                          >
                            Download Original
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-5 px-3 text-center text-xs text-[#82776E]">
              {kycStatusSummary?.isKycApproved || user.isKycApproved
                ? 'Your KYC verification is approved. No approved document files are attached to this record.'
                : 'Approved KYC documents will appear here once verified by the Admin compliance desk.'}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          H. ACCOUNT SECURITY & CREDENTIALS
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#EDE2D7] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-2.5">
          <div className="flex items-center gap-2">
            <LockIcon size={16} className="text-[#8064B1]" />
            <h3 className="text-sm sm:text-base font-black text-[#51463F]">Account Security & Credentials</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#82776E] block font-medium">Primary Email</span>
            <strong className="text-[#51463F] text-xs sm:text-[13px] block mt-0.5 truncate">{user.email}</strong>
            <span className="text-emerald-700 text-[10.5px] font-bold block mt-0.5">✓ Verified</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
            <span className="text-[#82776E] block font-medium">Primary Mobile</span>
            <strong className="text-[#51463F] text-xs sm:text-[13px] block mt-0.5">{user.phoneNumber || user.mobileNumber}</strong>
            <span className="text-emerald-700 text-[10.5px] font-bold block mt-0.5">✓ Verified</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] flex flex-col justify-between">
            <div>
              <span className="text-[#82776E] block font-medium">Password Security</span>
              <strong className="text-[#51463F] text-xs sm:text-[13px] block mt-0.5">••••••••••••</strong>
            </div>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-xs font-bold text-[#8064B1] hover:text-[#51463F] text-left mt-1.5 cursor-pointer"
            >
              Change Password &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL 0: WALLET TRANSACTION HISTORY & AUDIT LEDGER POPUP
         ======================================================== */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <motion.div
            key="tx-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setIsTransactionModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-5 lg:p-6 shadow-2xl relative my-auto border border-[#EDE2D7] space-y-4 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EDE2D7] gap-2.5 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#8064B1]/10 text-[#8064B1] text-[10.5px] font-black uppercase tracking-wider mb-0.5">
                    <SparklesIcon size={12} />
                    <span>Real-Time Ledger Audit</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#51463F] tracking-tight">
                    Wallet Transaction History & Audit Ledger
                  </h3>
                  <p className="text-xs text-[#82776E]">
                    Immutable double-entry record of all credits, top-ups, referral bonuses, renewals and withdrawals.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadStatement}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EDE2D7] hover:border-[#8064B1] text-[#51463F] hover:text-[#8064B1] transition-all cursor-pointer shadow-2xs"
                  >
                    <FileTextIcon size={13} />
                    <span>Download Statement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTransactionModalOpen(false)}
                    className="w-8 h-8 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] hover:text-[#51463F] flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-[#EDE2D7]"
                    title="Close modal"
                  >
                    ✕
                  </button>
                </div>
              </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* 5 Transaction Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {/* 1. Total Transactions */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] shadow-2xs">
                  <span className="text-[10.5px] font-bold text-[#82776E] uppercase tracking-wider block">
                    Total Transactions
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#51463F] mt-0.5">
                    {totalTxCount}
                  </div>
                  <span className="text-[10px] text-[#82776E] font-medium block mt-0.5">
                    Recorded entries
                  </span>
                </div>

                {/* 2. Total Credits */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-white to-[#F6FBF7] border border-[#3B9C91]/25 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-[#3B9C91] uppercase tracking-wider block">
                    Total Credits
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#3B9C91] mt-0.5">
                    +₹{totalCreditsAmount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-[#3B9C91]/80 font-medium block mt-0.5">
                    Total inflows & top-ups
                  </span>
                </div>

                {/* 3. Total Debits */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-white to-[#FFF0EB] border border-[#E8795B]/25 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-[#E8795B] uppercase tracking-wider block">
                    Total Debits
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#E8795B] mt-0.5">
                    -₹{totalDebitsAmount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-[#E8795B]/80 font-medium block mt-0.5">
                    Renewals & withdrawals
                  </span>
                </div>

                {/* 4. Pending */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-white to-[#F8EBD0] border border-[#E5A23B]/25 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-[#E5A23B] uppercase tracking-wider block">
                    Pending
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#E5A23B] mt-0.5">
                    {pendingTxCount}
                  </div>
                  <span className="text-[10px] text-[#E5A23B]/90 font-medium block mt-0.5">
                    Under verification
                  </span>
                </div>

                {/* 5. Completed */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-white to-[#FAF8FD] border border-[#8064B1]/25 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-[#8064B1] uppercase tracking-wider block">
                    Completed
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#8064B1] mt-0.5">
                    {completedTxCount}
                  </div>
                  <span className="text-[10px] text-[#8064B1]/80 font-medium block mt-0.5">
                    Settled ledger entries
                  </span>
                </div>
              </div>

              {/* Filters, Flow Selector & Search Toolbar */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-2.5">
                {/* Row 1: Category Filter Pills + Flow Selector */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Category Type Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#82776E] mr-1">
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
                            ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white shadow-[0_2px_8px_rgba(232,121,91,0.25)]'
                            : 'bg-white text-[#82776E] border border-[#EDE2D7] hover:border-[#8064B1] hover:text-[#51463F]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Flow Toggle: All / Credit / Debit */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EDE2D7] shrink-0 self-start lg:self-auto">
                    <span className="text-[11px] font-black text-[#82776E] px-2 uppercase tracking-wider">
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
                          ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white shadow-xs'
                          : 'text-[#82776E] hover:text-[#51463F]'
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
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] focus:outline-none focus:ring-1 focus:ring-[#8064B1] cursor-pointer"
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
                        className="text-xs font-bold text-[#8064B1] hover:underline ml-2 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Search box */}
                  <div className="relative sm:w-72">
                    <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82776E]" />
                    <input
                      type="text"
                      placeholder="Search ref ID, description or ₹..."
                      value={txSearchQuery}
                      onChange={(e) => {
                        setTxSearchQuery(e.target.value);
                        setTxCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#EDE2D7] rounded-xl text-[#51463F] placeholder-[#82776E]/70 focus:outline-none focus:ring-1 focus:ring-[#8064B1]"
                    />
                  </div>
                </div>
              </div>

              {/* Comprehensive 8-Column Transaction Table */}
              <div className="border border-[#EDE2D7] rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-[#51463F]">
                    <thead className="bg-[#FAF7F2] border-b border-[#EDE2D7] text-[11px] uppercase tracking-wider text-[#82776E] font-black">
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
                    <tbody className="divide-y divide-[#EDE2D7]/60">
                      {paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center">
                            <div className="max-w-xs mx-auto text-center space-y-2">
                              <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF7F2] border border-[#EDE2D7] flex items-center justify-center text-[#82776E]">
                                <FileTextIcon size={18} />
                              </div>
                              <p className="text-sm font-bold text-[#51463F]">No transactions found</p>
                              <p className="text-xs text-[#82776E]">
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
                              <td className="px-4 py-3.5 font-mono font-black text-[#51463F] whitespace-nowrap">
                                <span className="bg-[#FAF7F2] px-2 py-1 rounded-md border border-[#EDE2D7] text-[11.5px]">
                                  {tx.transactionId}
                                </span>
                              </td>

                              {/* 2. Date & Time */}
                              <td className="px-4 py-3.5 text-[#82776E] whitespace-nowrap font-medium">
                                {tx.createdAt}
                              </td>

                              {/* 3. Transaction Type */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {getTxTypeBadge(tx.transactionType)}
                              </td>

                              {/* 4. Description */}
                              <td className="px-4 py-3.5 max-w-[240px] truncate font-medium text-[#51463F]" title={tx.description}>
                                {tx.description}
                              </td>

                              {/* 5. Credit (+) */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap font-black">
                                {isCredit ? (
                                  <span className="text-[#3B9C91] bg-[#E3F5F2] border border-[#3B9C91]/20 px-2 py-0.5 rounded-lg">
                                    +₹{(tx.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[#82776E]/40 font-bold">—</span>
                                )}
                              </td>

                              {/* 6. Debit (-) */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap font-black">
                                {!isCredit ? (
                                  <span className="text-[#E8795B] bg-[#FFF0EB] border border-[#E8795B]/20 px-2 py-0.5 rounded-lg">
                                    -₹{(tx.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[#82776E]/40 font-bold">—</span>
                                )}
                              </td>

                              {/* 7. Status */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {getTxStatusBadge(tx.status)}
                              </td>

                              {/* 8. Balance After */}
                              <td className="px-4 py-3.5 text-right font-mono font-black text-[#51463F] whitespace-nowrap">
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
                  <div className="px-4 py-3 border-t border-[#EDE2D7] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[#82776E] font-medium">
                      Showing{' '}
                      <strong className="text-[#51463F] font-black">
                        {startIdx + 1}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-[#51463F] font-black">
                        {Math.min(startIdx + txPerPage, filteredTransactions.length)}
                      </strong>{' '}
                      of{' '}
                      <strong className="text-[#51463F] font-black">
                        {filteredTransactions.length}
                      </strong>{' '}
                      transactions
                    </span>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={currentSafePage <= 1}
                        onClick={() => setTxCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#EDE2D7] bg-white text-[#51463F] font-bold hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                                ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white shadow-xs'
                                : 'bg-white border border-[#EDE2D7] text-[#82776E] hover:border-[#8064B1] hover:text-[#51463F]'
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
                        className="px-3 py-1.5 rounded-xl border border-[#EDE2D7] bg-white text-[#51463F] font-bold hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EDE2D7] flex items-center justify-between text-xs text-[#82776E] shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheckIcon size={15} className="text-[#3B9C91]" />
                <span>Ledger cryptographically verified & audit compliant</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTransactionModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#51463F] hover:bg-[#3D332D] text-white font-bold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL: REFERRED MEMBERS & REGISTRATION STATUS POPUP
         ======================================================== */}
      <AnimatePresence>
        {isReferralModalOpen && (
          <motion.div
            key="referral-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setIsReferralModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-[#EDE2D7] space-y-6 max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EDE2D7] gap-3 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8064B1]/10 text-[#8064B1] text-xs font-black uppercase tracking-wider mb-1">
                    <span>Referral Programme Network</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#51463F] tracking-tight">
                    Referred Members & Registration Status
                  </h3>
                  <p className="text-xs sm:text-sm text-[#82776E] mt-0.5">
                    Track members who joined FIC Business Hub through your referral link.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] text-[#51463F] text-xs font-bold border border-[#EDE2D7]">
                  {totalReferralCount} Members Attributed
                </span>
                <button
                  type="button"
                  onClick={() => setIsReferralModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] hover:text-[#51463F] flex items-center justify-center font-bold text-base transition-all cursor-pointer border border-[#EDE2D7]"
                  title="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content - Table or Empty State */}
            <div className="overflow-y-auto flex-1 pr-1 -mr-1">
              {totalReferralCount === 0 ? (
                <div className="py-12 px-6 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EDE2D7] space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#EDE2D7] text-[#8064B1] flex items-center justify-center mx-auto text-2xl font-bold shadow-2xs">
                    👥
                  </div>
                  <h4 className="text-base font-bold text-[#51463F]">
                    No members have registered through your referral link yet.
                  </h4>
                  <p className="text-xs text-[#82776E] max-w-md mx-auto leading-relaxed">
                    Share your unique referral code <strong className="font-mono text-[#51463F]">{referralData?.referralCode}</strong> or referral link with business contacts. You will earn ₹500 in your personal wallet per verified member.
                  </p>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyLink();
                        showToast('Referral link copied to clipboard!');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E8795B] to-[#D96B4E] hover:from-[#D96B4E] hover:to-[#C65D40] text-white transition-all cursor-pointer shadow-[0_2px_8px_rgba(232,121,91,0.25)]"
                    >
                      Copy Referral Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-[#EDE2D7] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-[#51463F]">
                      <thead className="bg-[#FAF7F2] border-b border-[#EDE2D7] text-[11px] uppercase tracking-wider text-[#82776E] font-bold">
                        <tr>
                          <th className="px-4 py-3.5 whitespace-nowrap">Member Name</th>
                          <th className="px-4 py-3.5 whitespace-nowrap">Member ID</th>
                          <th className="px-4 py-3.5 whitespace-nowrap">Registration Date</th>
                          <th className="px-4 py-3.5 whitespace-nowrap">Category</th>
                          <th className="px-4 py-3.5 whitespace-nowrap">Subcategory</th>
                          <th className="px-4 py-3.5 whitespace-nowrap text-center">Payment Status</th>
                          <th className="px-4 py-3.5 whitespace-nowrap text-center">KYC Status</th>
                          <th className="px-4 py-3.5 whitespace-nowrap text-right">Reward Amount</th>
                          <th className="px-4 py-3.5 whitespace-nowrap text-center">Reward Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDE2D7]/60 bg-white">
                        {paginatedReferrals.map((refItem) => (
                          <tr key={refItem.referralId} className="hover:bg-[#FAF7F2]/70 transition-colors">
                            {/* Member Name */}
                            <td className="px-4 py-3.5 font-bold text-[#51463F] whitespace-nowrap">
                              {refItem.referredMemberName || refItem.referredName || 'Registered Member'}
                            </td>

                            {/* Member ID */}
                            <td className="px-4 py-3.5 font-mono text-[11px] text-[#82776E] whitespace-nowrap">
                              {refItem.referredMemberId || (refItem.referredUserId ? `FIC-${refItem.referredUserId.slice(-4).toUpperCase()}` : refItem.referralId)}
                            </td>

                            {/* Registration Date */}
                            <td className="px-4 py-3.5 whitespace-nowrap text-[#82776E]">
                              {refItem.registrationDate}
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3.5 whitespace-nowrap text-[#51463F] font-medium">
                              {refItem.categoryName || 'General'}
                            </td>

                            {/* Subcategory */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#82776E] font-semibold text-[11px] border border-[#EDE2D7]">
                                {refItem.subCategory || 'Member'}
                              </span>
                            </td>

                            {/* Payment Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] border ${
                                  refItem.paymentStatus === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {refItem.paymentStatus}
                              </span>
                            </td>

                            {/* KYC Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap text-center">
                              {renderKycBadge(refItem.kycStatus)}
                            </td>

                            {/* Reward Amount */}
                            <td className="px-4 py-3.5 whitespace-nowrap text-right font-black text-[#51463F]">
                              ₹{(refItem.rewardAmount || 500).toLocaleString('en-IN')}
                            </td>

                            {/* Reward Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap text-center">
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
              )}
            </div>

            {/* Modal Footer with Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#EDE2D7] gap-3 shrink-0 text-xs">
              <span className="text-[#82776E] font-medium">
                Showing {totalReferralCount > 0 ? (safeReferralPage - 1) * referralPerPage + 1 : 0} to{' '}
                {Math.min(safeReferralPage * referralPerPage, totalReferralCount)} of {totalReferralCount} members
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeReferralPage <= 1}
                  onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#EDE2D7] bg-white font-bold text-[#51463F] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  ← Previous
                </button>
                <span className="px-3 py-1 text-[#51463F] font-bold">
                  Page {safeReferralPage} of {totalReferralPages}
                </span>
                <button
                  type="button"
                  disabled={safeReferralPage >= totalReferralPages}
                  onClick={() => setReferralPage((p) => Math.min(totalReferralPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#EDE2D7] bg-white font-bold text-[#51463F] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  Next →
                </button>
                <button
                  type="button"
                  onClick={() => setIsReferralModalOpen(false)}
                  className="ml-2 px-4 py-1.5 rounded-xl bg-[#51463F] hover:bg-[#3D332D] text-white font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL 1: ADD FUNDS TO WALLET (SECTION 4)
         ======================================================== */}
      <AnimatePresence>
        {isAddFundsModalOpen && (
          <motion.div
            key="add-funds-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsAddFundsModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-[#FAF7F2] border border-[#EDE2D7] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-3 mb-4">
                <h3 className="text-lg font-black text-[#51463F]">Add Funds to FIC Wallet</h3>
                <button
                  onClick={() => setIsAddFundsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EDE2D7] text-[#82776E] flex items-center justify-center cursor-pointer hover:bg-[#EDE2D7]/50"
                >
                  ✕
                </button>
              </div>

            <form onSubmit={handleAddFundsSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#51463F] mb-1.5">Select Amount (INR) *</label>
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
                          ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white border-[#E8795B] shadow-xs'
                          : 'bg-white text-[#51463F] border-[#EDE2D7] hover:bg-slate-50'
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
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#E8795B]/30 text-[#51463F]"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-[#51463F] mb-1.5">Payment Method *</label>
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
                          ? 'border-[#3B9C91] bg-[#3B9C91]/15 text-[#2E847A]'
                          : 'border-[#EDE2D7] bg-white text-[#82776E]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Payable Summary */}
              <div className="p-3 bg-white rounded-xl border border-[#EDE2D7] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#82776E]">
                  <span>Top-up Amount:</span>
                  <span className="font-bold">
                    ₹{(customTopUp ? Number(customTopUp) : topUpAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#82776E]">
                  <span>Payment Gateway Charges:</span>
                  <span className="text-[#3B9C91] font-bold">₹0 (FIC Promotional Zero Fee)</span>
                </div>
                <div className="flex justify-between border-t border-[#EDE2D7] pt-1.5 font-black text-[#51463F] text-sm">
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
                  className="px-4 py-2 text-xs font-bold text-[#82776E] hover:text-[#51463F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#3B9C91] to-[#2E847A] hover:from-[#2E847A] hover:to-[#22675F] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  {isProcessingPayment ? 'Connecting Payment Gateway...' : 'Proceed to Secure Payment'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL 2: WITHDRAW FUNDS (SECTION 5)
         ======================================================== */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <motion.div
            key="withdraw-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsWithdrawModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-[#FAF7F2] border border-[#EDE2D7] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-3 mb-4">
                <h3 className="text-lg font-black text-[#51463F]">Request Bank Withdrawal</h3>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EDE2D7] text-[#82776E] flex items-center justify-center cursor-pointer hover:bg-[#EDE2D7]/50"
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
              <div className="p-3.5 bg-white rounded-xl border border-[#EDE2D7] space-y-1">
                <span className="text-[11px] text-[#82776E] block">Available for Withdrawal</span>
                <span className="text-xl font-black text-[#51463F] block">
                  ₹{(wallet?.withdrawalEligibleBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Verified Bank Account Display */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#51463F]">Receiving Bank Account *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWithdrawModalOpen(false);
                      setIsBankModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#8064B1] hover:underline"
                  >
                    {bankAccount ? 'Change Bank' : '+ Add Bank Account'}
                  </button>
                </div>

                {bankAccount ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#51463F] block">{bankAccount.bankName}</span>
                      <span className="text-[11.5px] font-mono text-[#82776E] block">
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
                <label className="block font-bold text-[#51463F] mb-1">Withdrawal Amount (Min ₹500) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  min={500}
                  max={wallet?.withdrawalEligibleBalance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              {/* Compliance Gate Note */}
              <div className="p-3 bg-white rounded-xl border border-[#EDE2D7] text-[11px] text-[#82776E] leading-relaxed">
                <strong>RBI Compliance & Settlement Gate:</strong> Withdrawals are remitted directly to the verified bank account following authorized internal governance review within 1-2 business days.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#82776E] hover:text-[#51463F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bankAccount}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#E8795B] to-[#D96B4E] hover:from-[#D96B4E] hover:to-[#C65D40] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Withdrawal Request
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL 3: MEMBERSHIP RENEWAL CONFIRMATION (SECTION 6)
         ======================================================== */}
      <AnimatePresence>
        {isRenewModalOpen && (
          <motion.div
            key="renew-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsRenewModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-[#FAF7F2] border border-[#EDE2D7] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-3 mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#8064B1]">FIC Ecosystem Access</span>
                  <h3 className="text-lg font-black text-[#51463F]">Annual Membership Renewal</h3>
                </div>
                <button
                  onClick={() => setIsRenewModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EDE2D7] text-[#82776E] flex items-center justify-center cursor-pointer hover:bg-[#EDE2D7]/50"
                >
                  ✕
                </button>
              </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 bg-white rounded-xl border border-[#EDE2D7] space-y-2">
                <div className="flex justify-between text-[#82776E]">
                  <span>Membership Plan:</span>
                  <span className="font-bold text-[#51463F]">Standard Annual Renewal (Year 2+)</span>
                </div>
                <div className="flex justify-between text-[#82776E]">
                  <span>Renewal Duration:</span>
                  <span className="font-bold text-[#51463F]">+365 Days</span>
                </div>
                <div className="flex justify-between text-[#82776E]">
                  <span>Authorized Renewal Fee:</span>
                  <span className="font-black text-[#51463F] text-sm">₹5,999</span>
                </div>
                <div className="flex justify-between text-[#82776E] border-t border-[#EDE2D7] pt-2">
                  <span>Your Available Wallet Balance:</span>
                  <span className="font-bold text-[#3B9C91]">₹{availableBal.toLocaleString('en-IN')}</span>
                </div>

                                {isRenewalSufficient ? (
                  <div className="flex justify-between border-t border-[#EDE2D7] pt-2 font-bold text-[#51463F]">
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
                  className="px-4 py-2 text-xs font-bold text-[#82776E] hover:text-[#51463F]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRenewModalOpen(false);
                    setRazorpayModalConfig({
                      isOpen: true,
                      purpose: 'MEMBERSHIP_RENEWAL',
                      amount: 5999,
                      title: 'ANNUAL MEMBERSHIP RENEWAL',
                      subtitle: 'FIC Business Hub · 1 Year Renewal Pass'
                    });
                  }}
                  className="px-4 py-2 bg-[#0A1D37] hover:bg-[#132E52] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Pay ₹5,999 via Razorpay
                </button>
                {isRenewalSufficient ? (
                  <button
                    onClick={handleRenewWithWallet}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#3B9C91] to-[#2E847A] hover:from-[#2E847A] hover:to-[#22675F] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
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
                    className="px-5 py-2.5 bg-gradient-to-r from-[#E8795B] to-[#D96B4E] hover:from-[#D96B4E] hover:to-[#C65D40] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    Top Up Shortfall (₹{renewalShortfall.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL 4: LINK / EDIT BANK ACCOUNT
         ======================================================== */}
      <AnimatePresence>
        {isBankModalOpen && (
          <motion.div
            key="bank-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsBankModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-[#FAF7F2] border border-[#EDE2D7] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-3 mb-4">
                <h3 className="text-lg font-black text-[#51463F]">Link Verified Bank Account</h3>
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EDE2D7] text-[#82776E] flex items-center justify-center cursor-pointer hover:bg-[#EDE2D7]/50"
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
                <label className="block font-bold text-[#51463F] mb-1">Account Holder Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. S. Moorthy"
                  value={bankHolderName}
                  onChange={(e) => setBankHolderName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#51463F] mb-1">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#51463F] mb-1">Account Number *</label>
                <input
                  type="text"
                  placeholder="Enter full bank account number"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#51463F] mb-1">Confirm Account Number *</label>
                <input
                  type="text"
                  placeholder="Re-enter bank account number"
                  value={bankConfirmAccount}
                  onChange={(e) => setBankConfirmAccount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#51463F] mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl uppercase text-[#51463F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#51463F] mb-1">Account Type *</label>
                  <select
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE2D7] rounded-xl text-[#51463F]"
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
                  className="px-4 py-2 text-xs font-bold text-[#82776E] hover:text-[#51463F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#8064B1] to-[#6E529F] hover:from-[#6E529F] hover:to-[#5E448D] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Save & Verify Bank Account
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL 5: EDIT PROFILE DETAILS
         ======================================================== */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            key="edit-profile-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto border border-[#EDE2D7]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-4 mb-4">
                <h3 className="text-lg font-bold text-[#51463F]">Edit Member Profile Details</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editPincode && !validateIndianPinCode(editPincode)) {
                  setEditPinError('Please enter a valid 6-digit PIN code.');
                  return;
                }
                setEditPinError('');

                const updatedAddress: UserAddress = {
                  addressLine1: editAddressLine1.trim(),
                  addressLine2: editAddressLine2.trim() || undefined,
                  landmark: editLandmark.trim() || undefined,
                  country: 'India',
                  state: editState.trim(),
                  district: editDistrict.trim(),
                  city: editCity.trim(),
                  pinCode: editPincode.trim(),
                  addressType: editAddressType
                };

                const updated = updateUserProfile(userId, {
                  fullName: editFullName,
                  mobileNumber: editPhone,
                  phoneNumber: editPhone,
                  subcategories: editSubcategories.split(',').map((s) => s.trim()).filter(Boolean),
                  address: updatedAddress,
                  personalInfo: {
                    ...(user?.personalInfo || {}),
                    dob: editDob,
                    address: `${updatedAddress.addressLine1}${updatedAddress.addressLine2 ? ', ' + updatedAddress.addressLine2 : ''}`,
                    city: updatedAddress.city,
                    district: updatedAddress.district,
                    state: updatedAddress.state,
                    pincode: updatedAddress.pinCode
                  },
                  professionalInfo: {
                    ...(user?.professionalInfo || {}),
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
                  <label className="block font-bold text-[#51463F] mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#51463F] mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#51463F] mb-1">Subcategories (comma separated)</label>
                <input
                  type="text"
                  value={editSubcategories}
                  onChange={(e) => setEditSubcategories(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              {/* Residential Address & Location Fields */}
              <div className="pt-3 border-t border-[#EDE2D7] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#51463F] text-xs uppercase tracking-wider">
                    Residential Address & Location
                  </h4>
                  <div className="flex items-center gap-1">
                    {(['Residential', 'Business', 'Other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditAddressType(t)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          editAddressType === t
                            ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white shadow-2xs'
                            : 'bg-[#FAF7F2] text-[#82776E] hover:text-[#51463F]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#51463F]">Address Line 1 (House No., Street)</label>
                  <input
                    type="text"
                    value={editAddressLine1}
                    onChange={(e) => setEditAddressLine1(e.target.value)}
                    placeholder="e.g., No. 42, Anna Salai"
                    className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#51463F] mb-1">Address Line 2 (Area, Sector)</label>
                    <input
                      type="text"
                      value={editAddressLine2}
                      onChange={(e) => setEditAddressLine2(e.target.value)}
                      placeholder="e.g., Teynampet"
                      className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#51463F] mb-1">Landmark</label>
                    <input
                      type="text"
                      value={editLandmark}
                      onChange={(e) => setEditLandmark(e.target.value)}
                      placeholder="e.g., Near Metro Station"
                      className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-[#51463F] mb-1">State</label>
                    <select
                      value={editState}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setEditState(newState);
                        const dists = getDistrictsForState(newState);
                        setEditDistrict(dists[0] || 'Other District');
                      }}
                      className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl bg-white text-[#51463F]"
                    >
                      {getIndianStates().map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#51463F] mb-1">District</label>
                    <select
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl bg-white text-[#51463F]"
                    >
                      {getDistrictsForState(editState).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#51463F] mb-1">City / Town</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g., Chennai"
                      className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#51463F] mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editPincode}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setEditPincode(clean);
                        if (clean.length === 6 && validateIndianPinCode(clean)) {
                          setEditPinError('');
                        }
                      }}
                      placeholder="e.g., 600028"
                      className={`w-full px-3.5 py-2 border rounded-xl text-[#51463F] ${
                        editPinError ? 'border-red-400 bg-red-50/20' : 'border-[#EDE2D7]'
                      }`}
                    />
                    {editPinError && <p className="text-[10px] text-red-600 mt-0.5">{editPinError}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#51463F] mb-1">Professional Role / Title</label>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#51463F] mb-1">Bio / Business Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDE2D7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#82776E] hover:text-[#51463F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#E8795B] to-[#D96B4E] hover:from-[#D96B4E] hover:to-[#C65D40] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-[0_2px_8px_rgba(232,121,91,0.25)]"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================
          MODAL 6: CHANGE PASSWORD
         ======================================================== */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div
            key="password-modal"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsPasswordModalOpen(false)}
          >
            <motion.div
              variants={modalEntrance}
              className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative border border-[#EDE2D7] max-h-[90vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#51463F]">Change Account Password</h3>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
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
                  <label className="block font-bold text-[#51463F] mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#51463F] mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#51463F] mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#EDE2D7] rounded-xl text-[#51463F]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-3 py-1.5 font-bold text-[#82776E] hover:text-[#51463F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-[#8064B1] to-[#6E529F] hover:from-[#6E529F] hover:to-[#5E448D] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-[0_2px_8px_rgba(128,100,177,0.25)]"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {razorpayModalConfig && (
        <RazorpayCheckoutModal
          isOpen={razorpayModalConfig.isOpen}
          amount={razorpayModalConfig.amount}
          purpose={razorpayModalConfig.purpose}
          orderLabel={razorpayModalConfig.title}
          orderSubtitle={razorpayModalConfig.subtitle}
          userName={user?.fullName || 'FIC Member'}
          userEmail={user?.email || ''}
          userPhone={user?.phoneNumber || ''}
          onSuccess={async (verified) => {
            setRazorpayModalConfig(null);
            await refreshFinancialData(userId);
            if (verified.purpose === 'MEMBERSHIP_RENEWAL') {
              if (user) { const updated = { ...user, isMembershipActive: true };
              setStoredUser(updated);
              setUser(updated); }
            }
            showToast(`Payment verified (${verified.razorpayPaymentId})! ₹${verified.amount.toLocaleString('en-IN')} processed successfully.`);
          }}
          onClose={() => setRazorpayModalConfig(null)}
        />
      )}

      {viewerDocument && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setViewerDocument(null)}
          documentId={viewerDocument.documentId}
          documentLabel={viewerDocument.documentLabel}
          originalFileName={viewerDocument.originalFileName}
          originalMimeType={viewerDocument.originalMimeType}
          originalFileSize={viewerDocument.originalFileSize}
          checksum={viewerDocument.checksum}
        />
      )}
    </WorkspaceShell>
  );
};

export default ProfilePage;

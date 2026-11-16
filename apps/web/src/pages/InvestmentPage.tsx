import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal } from '../motion';
import {
  TrendingUpIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SearchIcon,
  ClockIcon,
  FileTextIcon,
  AlertCircleIcon,
  PlusIcon
} from '../components/Icons';
import {
  apiRequest,
  getStoredUser,
  uploadDocumentFile,
  downloadOriginalDocument,
  UploadedDocumentAsset
} from '../services/api';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

// Currency formatter for INR
export const formatCurrencyINR = (amount: number): string => {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Crore${Number(cr) > 1 ? 's' : ''}`;
  }
  if (amount >= 100000) {
    const lk = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lk} Lakh${Number(lk) > 1 ? 's' : ''}`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const InvestmentPage: React.FC = () => {
  const user = getStoredUser();

  // Primary top-level navigation: 'investment' vs 'funding'
  const [mainNav, setMainNav] = useState<'investment' | 'funding'>('investment');

  // Investment sub-tabs: 'need_funding' vs 'my_investments' vs 'pools'
  const [investSubTab, setInvestSubTab] = useState<'need_funding' | 'my_investments' | 'pools'>('need_funding');

  // Loading & Global notification states
  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ========================================================
  // PHASE 1: FUNDING REQUEST FORM STATE
  // ========================================================
  const [showFundingForm, setShowFundingForm] = useState<boolean>(false);
  const [fundingStep, setFundingStep] = useState<'form' | 'review'>('form');

  // 8 Mandatory Fields
  const [formCompany, setFormCompany] = useState<string>('');
  const [formDuration, setFormDuration] = useState<string>('12 Months');
  const [formDurationMonths, setFormDurationMonths] = useState<number>(12);
  const [formFundingAmount, setFormFundingAmount] = useState<string>('');
  const [formMinInvestment, setFormMinInvestment] = useState<string>('25000');
  const [formMaxInvestment, setFormMaxInvestment] = useState<string>('200000');
  const [formReturnRate, setFormReturnRate] = useState<string>('15');
  const [formReturnFrequency, setFormReturnFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'MATURITY'>('YEARLY');
  const [formPurpose, setFormPurpose] = useState<string>('');
  const [formDocuments, setFormDocuments] = useState<any[]>([]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingFunding, setIsSubmittingFunding] = useState<boolean>(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  // My Funding Requests list
  const [myFundingRequests, setMyFundingRequests] = useState<any[]>([]);
  const [selectedFundingDetail, setSelectedFundingDetail] = useState<any | null>(null);

  // Resubmission Modal State (Phase 2 Member Resubmission)
  const [resubmitTarget, setResubmitTarget] = useState<any | null>(null);
  const [resubmitCompany, setResubmitCompany] = useState<string>('');
  const [resubmitFundingAmount, setResubmitFundingAmount] = useState<string>('');
  const [resubmitMinInvestment, setResubmitMinInvestment] = useState<string>('');
  const [resubmitMaxInvestment, setResubmitMaxInvestment] = useState<string>('');
  const [resubmitPurpose, setResubmitPurpose] = useState<string>('');
  const [resubmitNotes, setResubmitNotes] = useState<string>('');
  const [resubmitDocs, setResubmitDocs] = useState<any[]>([]);
  const [resubmitReqDocs, setResubmitReqDocs] = useState<any[]>([]);
  const [isResubmitting, setIsResubmitting] = useState<boolean>(false);

  // ========================================================
  // PHASE 3: NEED FUNDING & INVEST NOW STATE
  // ========================================================
  const [approvedDeals, setApprovedDeals] = useState<any[]>([]);
  const [searchNeedFunding, setSearchNeedFunding] = useState<string>('');

  // Invest Now Modal
  const [investTargetDeal, setInvestTargetDeal] = useState<any | null>(null);
  const [investAmountInput, setInvestAmountInput] = useState<string>('');
  const [investError, setInvestError] = useState<string>('');
  const [isSubmittingInvest, setIsSubmittingInvest] = useState<boolean>(false);

  // Investment Submission Overview Modal (Phase 3.3)
  const [investOverviewData, setInvestOverviewData] = useState<any | null>(null);

  // ========================================================
  // PHASE 4: MY INVESTMENTS STATE
  // ========================================================
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [selectedInvestmentDetail, setSelectedInvestmentDetail] = useState<any | null>(null);

  // Phase 6: Pay Amount Modal
  const [payTargetInvestment, setPayTargetInvestment] = useState<any | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Phase 9: Maturity Settlement Modal (for funding requestor)
  const [maturityTargetInvestment, setMaturityTargetInvestment] = useState<any | null>(null);
  const [isSettlingMaturity, setIsSettlingMaturity] = useState<boolean>(false);

  // Preserved Community Pools state
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<any | null>(null);
  const [poolInvestAmount, setPoolInvestAmount] = useState<string>('');

  // Viewer Modal
  const [viewerDoc, setViewerDoc] = useState<{ id?: string; name: string; url: string; fileType?: string } | null>(null);

  // ========================================================
  // DATA LOADERS
  // ========================================================
  useEffect(() => {
    loadAllData();
  }, [mainNav, investSubTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Load approved funding proposals (Need Funding)
      const needRes = await apiRequest('/investment/need-funding');
      if (needRes?.success && Array.isArray(needRes.data)) {
        setApprovedDeals(needRes.data);
      }

      // 2. Load member's own funding applications
      const myFundRes = await apiRequest('/investment/funding/me');
      if (myFundRes?.success && Array.isArray(myFundRes.data)) {
        setMyFundingRequests(myFundRes.data);
      }

      // 3. Load investor's own investments
      const myInvRes = await apiRequest('/investment/my-investments');
      if (myInvRes?.success && Array.isArray(myInvRes.data)) {
        setMyInvestments(myInvRes.data);
      }

      // 4. Load community pools
      const poolsRes = await apiRequest('/investment/pools');
      if (poolsRes?.success && Array.isArray(poolsRes.data)) {
        setPools(poolsRes.data);
      }
    } catch (err: any) {
      console.warn('Failed to load investment data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss alert feedback
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // ========================================================
  // PHASE 1: FORM VALIDATION & SUBMISSION
  // ========================================================
  const validateFundingForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formCompany.trim()) errs.company = 'Project / Company Name is mandatory.';
    if (!formDuration.trim()) errs.duration = 'Funding Duration is mandatory.';

    const reqAmt = Number(formFundingAmount);
    if (!formFundingAmount || isNaN(reqAmt) || reqAmt <= 0) {
      errs.fundingAmount = 'Please enter a valid positive Required Funding Amount.';
    }

    const minAmt = Number(formMinInvestment);
    if (!formMinInvestment || isNaN(minAmt) || minAmt <= 0) {
      errs.minInvestment = 'Please enter a valid positive Minimum Investment Amount.';
    }

    const maxAmt = Number(formMaxInvestment);
    if (!formMaxInvestment || isNaN(maxAmt) || maxAmt <= 0) {
      errs.maxInvestment = 'Please enter a valid positive Maximum Investment Amount.';
    }

    if (minAmt && maxAmt && minAmt > maxAmt) {
      errs.minInvestment = 'Minimum Investment Amount cannot exceed Maximum Investment Amount.';
    }

    if (maxAmt && reqAmt && maxAmt > reqAmt) {
      errs.maxInvestment = 'Maximum Investment Amount cannot exceed Required Funding Amount.';
    }

    const retRate = Number(formReturnRate);
    if (!formReturnRate || isNaN(retRate) || retRate <= 0) {
      errs.returns = 'Expected Returns percentage is mandatory.';
    }

    if (!formPurpose.trim() || formPurpose.trim().length < 10) {
      errs.purpose = 'Funding Purpose must be at least 10 characters describing the capital deployment.';
    }

    if (!formDocuments || formDocuments.length === 0) {
      errs.documents = 'At least one pitch deck or statutory document must be uploaded.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateFundingForm()) {
      setFundingStep('review');
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validMimes.includes(file.type)) {
      setFeedbackMsg({ type: 'error', text: 'Only PDF, JPG, and PNG files are allowed.' });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFeedbackMsg({ type: 'error', text: 'File size exceeds maximum limit of 15MB.' });
      return;
    }

    setIsUploadingDoc(true);
    try {
      const asset = await uploadDocumentFile(file, {
        documentCategory: 'INVESTMENT',
        documentLabel: 'Funding Proposal Document'
      });
      if (asset) {
        setFormDocuments((prev) => [
          ...prev,
          {
            documentId: asset.documentId,
            name: asset.originalFileName || file.name,
            fileUrl: asset.viewUrl || `/api/v1/documents/${asset.documentId}/view`,
            fileType: asset.originalFileExtension || 'pdf',
            originalFileSize: asset.originalFileSize || file.size,
            uploadedAt: new Date().toISOString()
          }
        ]);
        setFeedbackMsg({ type: 'success', text: `Uploaded ${file.name} successfully.` });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to upload document.' });
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleFinalSubmitFunding = async () => {
    setIsSubmittingFunding(true);
    try {
      const payload = {
        companyName: formCompany.trim(),
        fundingDuration: formDuration,
        durationMonths: formDurationMonths,
        requiredFundingAmount: Number(formFundingAmount),
        minInvestmentAmount: Number(formMinInvestment),
        maxInvestmentAmount: Number(formMaxInvestment),
        expectedReturns: `${formReturnRate}% p.a.`,
        returnRatePercent: Number(formReturnRate),
        returnFrequency: formReturnFrequency,
        fundingPurpose: formPurpose.trim(),
        documents: formDocuments
      };

      const res = await apiRequest('/investment/funding', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: 'Funding Proposal Submitted! Unique ID generated and sent to FIC Admin for Review.'
        });
        setShowFundingForm(false);
        setFundingStep('form');
        // Reset form
        setFormCompany('');
        setFormFundingAmount('');
        setFormPurpose('');
        setFormDocuments([]);
        loadAllData();
      } else {
        throw new Error(res?.error || 'Failed to submit funding proposal');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setIsSubmittingFunding(false);
    }
  };

  // Open Resubmit Modal
  const handleOpenResubmit = (reqItem: any) => {
    setResubmitTarget(reqItem);
    setResubmitCompany(reqItem.companyName || reqItem.businessName || '');
    setResubmitFundingAmount(String(reqItem.requiredFundingAmount || reqItem.fundingAmount || ''));
    setResubmitMinInvestment(String(reqItem.minInvestmentAmount || ''));
    setResubmitMaxInvestment(String(reqItem.maxInvestmentAmount || ''));
    setResubmitPurpose(typeof reqItem.fundingPurpose === 'string' ? reqItem.fundingPurpose : (reqItem.fundingPurpose?.[0] || ''));
    setResubmitDocs(reqItem.documents || []);

    const latestCr = reqItem.changeRequests?.[reqItem.changeRequests.length - 1];
    setResubmitReqDocs(latestCr?.requestedDocuments || []);
    setResubmitNotes('');
  };

  const handleConfirmResubmit = async () => {
    if (!resubmitTarget) return;
    setIsResubmitting(true);
    try {
      const payload = {
        companyName: resubmitCompany.trim(),
        requiredFundingAmount: Number(resubmitFundingAmount),
        minInvestmentAmount: Number(resubmitMinInvestment),
        maxInvestmentAmount: Number(resubmitMaxInvestment),
        fundingPurpose: resubmitPurpose.trim(),
        documents: resubmitDocs,
        uploadedRequestedDocuments: resubmitReqDocs.filter((d) => d.isUploaded),
        resubmissionNotes: resubmitNotes.trim()
      };

      const res = await apiRequest(`/investment/funding/${resubmitTarget.fundingRequestId || resubmitTarget._id}/resubmit`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: 'Revised funding application and requested documents resubmitted successfully to FIC Admin!'
        });
        setResubmitTarget(null);
        loadAllData();
      } else {
        throw new Error(res?.error || 'Failed to resubmit application.');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Resubmission failed.' });
    } finally {
      setIsResubmitting(false);
    }
  };

  // ========================================================
  // PHASE 3: INVEST NOW & SUBMISSION OVERVIEW
  // ========================================================
  const handleOpenInvestModal = (deal: any) => {
    setInvestTargetDeal(deal);
    setInvestAmountInput(String(deal.minInvestmentAmount || 25000));
    setInvestError('');
  };

  const handleConfirmInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investTargetDeal) return;

    const amt = Number(investAmountInput);
    const min = investTargetDeal.minInvestmentAmount || 10000;
    const max = investTargetDeal.maxInvestmentAmount || investTargetDeal.requiredFundingAmount;
    const remaining = investTargetDeal.remainingFundingAmount ?? (investTargetDeal.requiredFundingAmount - (investTargetDeal.totalInvested || 0));

    if (!amt || isNaN(amt) || amt <= 0) {
      setInvestError('Please enter a valid investment amount.');
      return;
    }
    if (amt < min) {
      setInvestError(`Amount cannot be less than the minimum ticket of ₹${min.toLocaleString('en-IN')}.`);
      return;
    }
    if (amt > max) {
      setInvestError(`Amount cannot exceed the maximum permitted ticket of ₹${max.toLocaleString('en-IN')}.`);
      return;
    }
    if (amt > remaining) {
      setInvestError(`Amount cannot exceed remaining required funding of ₹${remaining.toLocaleString('en-IN')}.`);
      return;
    }

    setIsSubmittingInvest(true);
    try {
      const res = await apiRequest('/investment/invest', {
        method: 'POST',
        body: JSON.stringify({
          fundingRequestId: investTargetDeal.fundingRequestId || investTargetDeal._id,
          amount: amt
        })
      });

      if (res?.success && res.data) {
        setInvestTargetDeal(null);
        setInvestOverviewData(res.data);
        loadAllData();
      } else {
        throw new Error(res?.error || 'Failed to submit investment commitment.');
      }
    } catch (err: any) {
      setInvestError(err.message || 'Investment submission failed.');
    } finally {
      setIsSubmittingInvest(false);
    }
  };

  // ========================================================
  // PHASE 6: INVESTOR PAYMENT COLLECTION
  // ========================================================
  const handleOpenPayModal = (inv: any) => {
    setPayTargetInvestment(inv);
    const payable = inv.pendingPaymentAmount || (inv.approvedAmount || inv.requestedAmount) - (inv.paidAmount || 0);
    setPayAmountInput(String(payable));
  };

  const handleProcessPayment = async () => {
    if (!payTargetInvestment) return;
    setIsProcessingPayment(true);
    try {
      // 1. Create Order
      const orderRes = await apiRequest(`/investment/investments/${payTargetInvestment.investmentId || payTargetInvestment._id}/create-order`, {
        method: 'POST'
      });

      if (!orderRes?.success) {
        throw new Error(orderRes?.error || 'Order creation failed.');
      }

      // 2. Gateway Verification simulation / real payment check
      const verifyRes = await apiRequest(`/investment/investments/${payTargetInvestment.investmentId || payTargetInvestment._id}/verify-payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentId: `PAY-${Date.now()}`,
          orderId: orderRes.data?.orderId,
          paidAmount: Number(payAmountInput)
        })
      });

      if (verifyRes?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Payment of ₹${Number(payAmountInput).toLocaleString('en-IN')} confirmed successfully! Capital is queued for Fund Release disbursement.`
        });
        setPayTargetInvestment(null);
        loadAllData();
      } else {
        throw new Error(verifyRes?.error || 'Payment verification failed.');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Payment processing failed.' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ========================================================
  // PHASE 9: MATURITY REPAYMENT (FUNDING REQUESTOR)
  // ========================================================
  const handleOpenMaturitySettlement = (inv: any) => {
    setMaturityTargetInvestment(inv);
  };

  const handleConfirmMaturityPayment = async () => {
    if (!maturityTargetInvestment) return;
    setIsSettlingMaturity(true);
    try {
      const res = await apiRequest(`/investment/investments/${maturityTargetInvestment.investmentId || maturityTargetInvestment._id}/pay-maturity`, {
        method: 'POST',
        body: JSON.stringify({
          amount: maturityTargetInvestment.maturityAmountDue,
          paymentReference: `REF-MAT-${Date.now()}`
        })
      });

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Maturity settlement of ₹${maturityTargetInvestment.maturityAmountDue.toLocaleString('en-IN')} paid successfully! FIC Admin will release funds to the investor.`
        });
        setMaturityTargetInvestment(null);
        loadAllData();
      } else {
        throw new Error(res?.error || 'Maturity payment failed.');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Maturity payment failed.' });
    } finally {
      setIsSettlingMaturity(false);
    }
  };

  return (
    <WorkspaceShell>
      {/* Top Hero Banner */}
      <WorkspaceHero
        title="Funding & Investment Management"
        subtitle="Connect capital seekers with network investors under secure, legally structured FIC oversight."
        badge={<span>FIC Direct Capital Desk</span>}
      />

      {/* Global Feedback Alert */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? <CheckCircleIcon size={18} /> : <AlertCircleIcon size={18} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ========================================================
          TOP LEVEL TABS: INVESTMENT vs FUNDING
         ======================================================== */}
      <div className="flex items-center justify-between border-b border-[#EDE2D7] dark:border-slate-800 pb-3 mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {/* Tab 1: Investment */}
          <button
            type="button"
            onClick={() => setMainNav('investment')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              mainNav === 'investment'
                ? 'bg-gradient-to-r from-[#2C857B] to-[#1C6960] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            <TrendingUpIcon size={16} />
            <span>Investment</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {approvedDeals.length}
            </span>
          </button>

          {/* Tab 2: Funding */}
          <button
            type="button"
            onClick={() => setMainNav('funding')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              mainNav === 'funding'
                ? 'bg-gradient-to-r from-[#2C857B] to-[#1C6960] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            <FileTextIcon size={16} />
            <span>Funding</span>
            {myFundingRequests.some((r) => r.status === 'CHANGES_REQUESTED') && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Action Button for Funding tab */}
        {mainNav === 'funding' && !showFundingForm && (
          <button
            type="button"
            onClick={() => {
              setShowFundingForm(true);
              setFundingStep('form');
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2C857B] to-[#1C6960] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <PlusIcon size={14} />
            <span>Submit a Funding Request</span>
          </button>
        )}
      </div>

      {/* ========================================================
          MAIN NAV 1: INVESTMENT VIEW
         ======================================================== */}
      {mainNav === 'investment' && (
        <div className="space-y-6">
          {/* Sub-Tabs: Need Funding | My Investments | Community Pools */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setInvestSubTab('need_funding')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                investSubTab === 'need_funding'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Need Funding ({approvedDeals.length})
            </button>
            <button
              type="button"
              onClick={() => setInvestSubTab('my_investments')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                investSubTab === 'my_investments'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              My Investments ({myInvestments.length})
            </button>
            <button
              type="button"
              onClick={() => setInvestSubTab('pools')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                investSubTab === 'pools'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Community Pools ({pools.length})
            </button>
          </div>

          {/* SUB-TAB 1: NEED FUNDING LISTING (PHASE 3) */}
          {investSubTab === 'need_funding' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Verified Opportunities (Admin Approved)
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-viability enterprise proposals vetted and approved for investor commitments.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <SearchIcon size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchNeedFunding}
                    onChange={(e) => setSearchNeedFunding(e.target.value)}
                    placeholder="Search by company or purpose..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]"
                  />
                </div>
              </div>

              {approvedDeals.length === 0 ? (
                <WorkspaceEmptyState
                  title="No Approved Proposals Yet"
                  description="When FIC Admin approves submitted funding requests, they will appear here live for network investments."
                  icon={<ShieldCheckIcon size={40} className="text-slate-400" />}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {approvedDeals
                    .filter((d) =>
                      searchNeedFunding.trim()
                        ? d.companyName?.toLowerCase().includes(searchNeedFunding.toLowerCase()) ||
                          d.fundingPurpose?.toLowerCase().includes(searchNeedFunding.toLowerCase())
                        : true
                    )
                    .map((deal) => {
                      const reqAmt = deal.requiredFundingAmount || deal.fundingAmount || 1;
                      const invested = deal.totalInvested || 0;
                      const progressPct = Math.min(100, Math.round((invested / reqAmt) * 100));

                      return (
                        <div
                          key={deal._id || deal.fundingRequestId}
                          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {deal.fundingRequestId || deal.refNumber}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                {deal.status || 'APPROVED'}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">
                              {deal.companyName || deal.businessName}
                            </h4>

                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              {deal.fundingPurpose}
                            </p>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-mono">Target Amount</span>
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {formatCurrencyINR(reqAmt)}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-mono">Expected Return</span>
                                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {deal.expectedReturns} ({deal.returnFrequency})
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-mono">Duration</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                  {deal.fundingDuration || '12 Months'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-mono">Ticket Range</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                  {formatCurrencyINR(deal.minInvestmentAmount)} - {formatCurrencyINR(deal.maxInvestmentAmount)}
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                                <span>Committed: {formatCurrencyINR(invested)}</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenInvestModal(deal)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2C857B] to-[#1C6960] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-opacity"
                          >
                            <span>Invest Now</span>
                            <ArrowRightIcon size={14} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: MY INVESTMENTS (PHASE 4) */}
          {investSubTab === 'my_investments' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  My Investment Portfolio & Yield Desk
                </h3>
                <p className="text-xs text-slate-500">
                  Track your deployed commitments, review status, complete payments, and monitor returns.
                </p>
              </div>

              {myInvestments.length === 0 ? (
                <WorkspaceEmptyState
                  title="No Active Investments"
                  description="You haven't committed to any funding proposals yet. Explore the Need Funding tab to invest."
                  icon={<TrendingUpIcon size={40} className="text-slate-400" />}
                />
              ) : (
                <div className="space-y-4">
                  {myInvestments.map((inv) => (
                    <div
                      key={inv._id || inv.investmentId}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inv.investmentId}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Ref: {inv.fundingRequestRef}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              inv.status === 'APPROVED' || inv.status === 'PAYMENT_PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                                : inv.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : inv.status === 'COMPLETED'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {inv.projectName}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span>Committed: <b className="text-slate-900 dark:text-white">{formatCurrencyINR(inv.requestedAmount)}</b></span>
                          {inv.paidAmount > 0 && (
                            <span>Paid: <b className="text-emerald-600 dark:text-emerald-400">{formatCurrencyINR(inv.paidAmount)}</b></span>
                          )}
                          <span>Expected Return: <b className="text-emerald-600 dark:text-emerald-400">{inv.expectedReturns} ({inv.returnFrequency})</b></span>
                          <span>Tenure: {inv.fundingDuration}</span>
                        </div>

                        {/* Progress stage indicator */}
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 pt-1">
                          <ClockIcon size={12} />
                          <span>Timeline Stage: {inv.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* If Admin Approved -> Show "Pay Amount" */}
                        {(inv.status === 'APPROVED' || inv.status === 'PAYMENT_PENDING') && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(inv)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs"
                          >
                            Pay Amount ({formatCurrencyINR(inv.pendingPaymentAmount || inv.approvedAmount || inv.requestedAmount)})
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedInvestmentDetail(inv)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: COMMUNITY POOLS */}
          {investSubTab === 'pools' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Community Crowdfunding Pools
                </h3>
                <p className="text-xs text-slate-500">
                  Participate in collective micro-investments with fixed annual yields.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pools.map((pool) => (
                  <div
                    key={pool._id || pool.poolCode}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {pool.poolCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {pool.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {pool.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {pool.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400">Yield</span>
                          <p className="font-bold text-emerald-600">{pool.investorAnnualYieldPercent}% p.a.</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Target</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrencyINR(pool.targetAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MAIN NAV 2: FUNDING VIEW (PHASE 1 & 2)
         ======================================================== */}
      {mainNav === 'funding' && (
        <div className="space-y-6">
          {/* Submission Form / Review / Wizard */}
          {showFundingForm ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {fundingStep === 'form' ? 'Submit Funding Proposal' : 'Review & Confirm Funding Proposal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {fundingStep === 'form'
                      ? 'Please fill in all 8 mandatory fields with accurate business details.'
                      : 'Please verify all details before submitting to FIC Admin for verification.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFundingForm(false);
                    setFundingStep('form');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              {fundingStep === 'form' ? (
                <form onSubmit={handleProceedToReview} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Field 1: Project / Company Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                        1. Project / Company Name *
                      </label>
                      <input
                        type="text"
                        value={formCompany}
                        onChange={(e) => setFormCompany(e.target.value)}
                        placeholder="e.g. Acme Technologies Pvt Ltd"
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                          formErrors.company ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                        } focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]`}
                      />
                      {formErrors.company && <p className="text-[11px] text-rose-500 mt-1">{formErrors.company}</p>}
                    </div>

                    {/* Field 2: Funding Duration */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                        2. Funding Duration *
                      </label>
                      <select
                        value={formDuration}
                        onChange={(e) => {
                          setFormDuration(e.target.value);
                          setFormDurationMonths(parseInt(e.target.value, 10) || 12);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]"
                      >
                        <option value="6 Months">6 Months</option>
                        <option value="12 Months">12 Months (1 Year)</option>
                        <option value="18 Months">18 Months</option>
                        <option value="24 Months">24 Months (2 Years)</option>
                        <option value="36 Months">36 Months (3 Years)</option>
                      </select>
                    </div>

                    {/* Field 3: Required Funding Amount */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                        3. Required Funding Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min="1000"
                        value={formFundingAmount}
                        onChange={(e) => setFormFundingAmount(e.target.value)}
                        placeholder="e.g. 500000"
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                          formErrors.fundingAmount ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                        } focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]`}
                      />
                      {formErrors.fundingAmount && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.fundingAmount}</p>
                      )}
                      {formFundingAmount && !isNaN(Number(formFundingAmount)) && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          In Words: {formatCurrencyINR(Number(formFundingAmount))}
                        </p>
                      )}
                    </div>

                    {/* Field 4 & 5: Min & Max Ticket */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                          4. Min Ticket (₹) *
                        </label>
                        <input
                          type="number"
                          value={formMinInvestment}
                          onChange={(e) => setFormMinInvestment(e.target.value)}
                          placeholder="e.g. 25000"
                          className={`w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                            formErrors.minInvestment ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                          } focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                          5. Max Ticket (₹) *
                        </label>
                        <input
                          type="number"
                          value={formMaxInvestment}
                          onChange={(e) => setFormMaxInvestment(e.target.value)}
                          placeholder="e.g. 200000"
                          className={`w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                            formErrors.maxInvestment ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                          } focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 6: Expected Returns & Return Frequency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                        6. Expected Return Rate (% p.a.) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formReturnRate}
                        onChange={(e) => setFormReturnRate(e.target.value)}
                        placeholder="e.g. 15"
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                          formErrors.returns ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                        } focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                        Return Payout Frequency *
                      </label>
                      <select
                        value={formReturnFrequency}
                        onChange={(e: any) => setFormReturnFrequency(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]"
                      >
                        <option value="MONTHLY">Monthly Returns</option>
                        <option value="QUARTERLY">Quarterly Returns</option>
                        <option value="YEARLY">Yearly Returns</option>
                        <option value="MATURITY">One-Time at Maturity</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 7: Funding Purpose */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                      7. Funding Purpose *
                    </label>
                    <textarea
                      rows={3}
                      value={formPurpose}
                      onChange={(e) => setFormPurpose(e.target.value)}
                      placeholder="Explain how funds will be deployed (e.g. Working Capital, Equipment, Team Expansion, Marketing, Operations)..."
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                        formErrors.purpose ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                      } focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]`}
                    />
                    {formErrors.purpose && <p className="text-[11px] text-rose-500 mt-1">{formErrors.purpose}</p>}
                  </div>

                  {/* Field 8: Required Documents */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                      8. Required Supporting Documents (Pitch Deck, Statutory, Audited Financials) *
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2">
                        <PlusIcon size={14} />
                        <span>{isUploadingDoc ? 'Uploading...' : 'Upload Document (PDF, JPG, PNG)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleDocumentUpload}
                          disabled={isUploadingDoc}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Max 15MB</span>
                    </div>

                    {formDocuments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formDocuments.map((doc, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2"
                          >
                            <FileTextIcon size={12} />
                            <span className="truncate max-w-[200px]">{doc.name}</span>
                            <button
                              type="button"
                              onClick={() => setFormDocuments(formDocuments.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {formErrors.documents && <p className="text-[11px] text-rose-500 mt-1">{formErrors.documents}</p>}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2C857B] to-[#1C6960] hover:opacity-95 text-white font-bold text-xs shadow-sm flex items-center gap-2"
                    >
                      <span>Proceed to Review & Confirm</span>
                      <ArrowRightIcon size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                /* REVIEW & SUBMIT STEP */
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Company / Project</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{formCompany}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Funding Duration</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{formDuration}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Required Amount</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrencyINR(Number(formFundingAmount))}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Ticket Size Limits</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Min: {formatCurrencyINR(Number(formMinInvestment))} | Max: {formatCurrencyINR(Number(formMaxInvestment))}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Expected Returns</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formReturnRate}% p.a. ({formReturnFrequency})
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Attached Documents</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {formDocuments.length} document(s) attached
                      </p>
                    </div>
                    <div className="col-span-full">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Purpose of Funds</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{formPurpose}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setFundingStep('form')}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                    >
                      ← Back & Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmitFunding}
                      disabled={isSubmittingFunding}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center gap-2"
                    >
                      <span>{isSubmittingFunding ? 'Submitting to Admin...' : 'Confirm & Submit Application'}</span>
                      <CheckCircleIcon size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MY FUNDING REQUESTS LIST */
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  My Funding Requests & Capital Tracker
                </h3>
                <p className="text-xs text-slate-500">
                  Track verification status, respond to change requests, and review commitments.
                </p>
              </div>

              {myFundingRequests.length === 0 ? (
                <WorkspaceEmptyState
                  title="No Funding Proposals Submitted"
                  description="Click 'Submit a Funding Request' to seek growth capital for your venture."
                  icon={<FileTextIcon size={40} className="text-slate-400" />}
                />
              ) : (
                <div className="space-y-4">
                  {myFundingRequests.map((reqItem) => {
                    const isChangesReq = reqItem.status === 'CHANGES_REQUESTED';
                    const isApproved = reqItem.status === 'APPROVED' || reqItem.status === 'ACTIVE';

                    return (
                      <div
                        key={reqItem._id || reqItem.fundingRequestId}
                        className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                          isChangesReq
                            ? 'border-amber-400 bg-amber-50/20 dark:border-amber-700 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {reqItem.fundingRequestId || reqItem.refNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isChangesReq
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : isApproved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {reqItem.status}
                              </span>
                              {reqItem.versionHistory?.length > 1 && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  v{reqItem.versionHistory.length}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {reqItem.companyName || reqItem.businessName}
                            </h4>

                            <p className="text-xs text-slate-500 line-clamp-1">
                              {reqItem.fundingPurpose}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                              <span>Target: <b className="text-slate-900 dark:text-white">{formatCurrencyINR(reqItem.requiredFundingAmount || reqItem.fundingAmount)}</b></span>
                              <span>Returns: <b className="text-emerald-600 dark:text-emerald-400">{reqItem.expectedReturns} ({reqItem.returnFrequency})</b></span>
                              <span>Duration: {reqItem.fundingDuration}</span>
                              <span>Investors Committed: <b className="text-slate-900 dark:text-white">{reqItem.investorCount || 0}</b></span>
                            </div>

                            {/* Alert if changes requested */}
                            {isChangesReq && (
                              <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 mt-2 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-bold">FIC Admin requested modifications:</p>
                                  <p className="text-[11px] mt-0.5">
                                    {reqItem.changeRequests?.[reqItem.changeRequests.length - 1]?.message || 'Please upload specified documents.'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenResubmit(reqItem)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
                                >
                                  Review & Resubmit
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Maturity Settlement Action (Phase 9) */}
                            {reqItem.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleOpenMaturitySettlement(reqItem)}
                                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                              >
                                Settle Maturity Obligation
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedFundingDetail(reqItem)}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: INVEST NOW (PHASE 3.2)
         ======================================================== */}
      {investTargetDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {investTargetDeal.fundingRequestId || investTargetDeal.refNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invest in {investTargetDeal.companyName || investTargetDeal.businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInvestTargetDeal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Target Funding</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {formatCurrencyINR(investTargetDeal.requiredFundingAmount || investTargetDeal.fundingAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Expected Returns</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {investTargetDeal.expectedReturns} ({investTargetDeal.returnFrequency})
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Tenure</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {investTargetDeal.fundingDuration}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Allowed Ticket</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrencyINR(investTargetDeal.minInvestmentAmount)} - {formatCurrencyINR(investTargetDeal.maxInvestmentAmount)}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmInvest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                  Enter Investment Commitment Amount (INR) *
                </label>
                <input
                  type="number"
                  value={investAmountInput}
                  onChange={(e) => setInvestAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#2C857B]"
                  placeholder="Enter amount..."
                />
                {investAmountInput && !isNaN(Number(investAmountInput)) && (
                  <p className="text-[11px] text-emerald-600 font-mono mt-1">
                    In Words: {formatCurrencyINR(Number(investAmountInput))}
                  </p>
                )}
                {investError && <p className="text-xs text-rose-500 mt-1.5">{investError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInvestTargetDeal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvest}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#2C857B] to-[#1C6960] text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingInvest ? 'Submitting...' : 'Confirm Commitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INVESTMENT SUBMISSION OVERVIEW (PHASE 3.3)
         ======================================================== */}
      {investOverviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircleIcon size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Investment Commitment Submitted!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your investment request is registered under FIC oversight.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Investment ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {investOverviewData.investmentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{investOverviewData.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Committed Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyINR(investOverviewData.investmentAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Returns:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {investOverviewData.expectedReturns} ({investOverviewData.returnFrequency})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{investOverviewData.fundingDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-amber-600">{investOverviewData.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvestOverviewData(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvestOverviewData(null);
                  setMainNav('investment');
                  setInvestSubTab('my_investments');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-[#2C857B] to-[#1C6960] text-white font-bold text-xs shadow-md"
              >
                View My Investment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PAY AMOUNT (PHASE 6)
         ======================================================== */}
      {payTargetInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {payTargetInvestment.investmentId}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pay Investment Capital
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayTargetInvestment(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Project Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{payTargetInvestment.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved Amount:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrencyINR(payTargetInvestment.approvedAmount || payTargetInvestment.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrencyINR(payTargetInvestment.paidAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Payable:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(Number(payAmountInput))}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayTargetInvestment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md"
              >
                {isProcessingPayment ? 'Connecting Gateway...' : 'Pay Amount via Gateway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RESUBMISSION (PHASE 2 MEMBER RESUBMISSION)
         ======================================================== */}
      {resubmitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600">
                  CHANGES REQUESTED
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Revise & Resubmit: {resubmitCompany}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResubmitTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Admin instructions banner */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">FIC Admin Instructions:</span>
              <p className="mt-1">
                {resubmitTarget.changeRequests?.[resubmitTarget.changeRequests.length - 1]?.message}
              </p>
            </div>

            {/* Requested additional documents checklist */}
            {resubmitReqDocs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono">
                  Additional Required Documents:
                </span>
                {resubmitReqDocs.map((docItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{docItem.name}</p>
                      <p className="text-[11px] text-slate-400">{docItem.instructions}</p>
                    </div>
                    {docItem.isUploaded ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        ✓ Uploaded
                      </span>
                    ) : (
                      <label className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer">
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const asset = await uploadDocumentFile(f, {
                                documentCategory: 'INVESTMENT',
                                documentLabel: docItem.name
                              });
                              if (asset) {
                                docItem.isUploaded = true;
                                docItem.documentId = asset.documentId;
                                docItem.fileUrl = asset.viewUrl;
                                setResubmitReqDocs([...resubmitReqDocs]);
                              }
                            } catch {}
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={resubmitCompany}
                  onChange={(e) => setResubmitCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                  Required Amount (₹)
                </label>
                <input
                  type="number"
                  value={resubmitFundingAmount}
                  onChange={(e) => setResubmitFundingAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                Funding Purpose / Revisions Notes
              </label>
              <textarea
                rows={2}
                value={resubmitPurpose}
                onChange={(e) => setResubmitPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResubmitTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResubmit}
                disabled={isResubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md"
              >
                {isResubmitting ? 'Resubmitting...' : 'Confirm & Resubmit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={Boolean(viewerDoc)}
          onClose={() => setViewerDoc(null)}
          documentId={viewerDoc.id || ''}
          originalFileName={viewerDoc.name}
          documentLabel={viewerDoc.name}
        />
      )}
    </WorkspaceShell>
  );
};

export default InvestmentPage;

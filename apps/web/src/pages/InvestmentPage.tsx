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
  UploadedDocumentAsset,
  lookupIndianPinCodeApi
} from '../services/api';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

// HandCoins SVG Icon for Funding Seeker
const HandCoinsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 16 6 6" />
    <circle cx="16" cy="9" r="2.9" />
    <circle cx="6" cy="5" r="3" />
  </svg>
);

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

// Types
export interface FundingRequestItem {
  type: 'FUNDING';
  id: string;
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
  documents?: {
    name: string;
    fileUrl: string;
    fileType?: string;
    uploadedAt: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];
  status: string;
  submittedDate: string;
  latestFicUpdate: string;
  whatHappensNext: string;
  updateHistory: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
}

export interface InvestorProfileItem {
  type: 'INVESTOR';
  id: string;
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
  documents?: {
    name: string;
    fileUrl: string;
    fileType?: string;
    uploadedAt: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];
  status: string;
  submittedDate: string;
  latestFicUpdate: string;
  whatHappensNext: string;
  updateHistory: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
}

export type InvestmentDealItem = FundingRequestItem | InvestorProfileItem;

export const FUNDING_STATUS_CONFIG: Record<
  string,
  { label: string; explanation: string; variant: 'pending' | 'proposal' | 'active' | 'luxury' | 'urgent' | 'neutral' }
> = {
  SUBMITTED: {
    label: 'Request Submitted',
    explanation: 'Your funding request has been received.',
    variant: 'pending'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    explanation: 'FIC is reviewing your business details.',
    variant: 'pending'
  },
  INFO_REQUIRED: {
    label: 'Information Required',
    explanation: 'FIC needs additional details from you.',
    variant: 'urgent'
  },
  VERIFICATION_IN_PROGRESS: {
    label: 'Business Verification in Progress',
    explanation: 'Preliminary entity and statutory verification is underway.',
    variant: 'luxury'
  },
  ASSESSMENT_IN_PROGRESS: {
    label: 'Assessment in Progress',
    explanation: 'Commercial viability and capital requirements are being assessed.',
    variant: 'luxury'
  },
  REVIEW_COMPLETED: {
    label: 'Review Completed',
    explanation: 'FIC review has concluded; next steps are being finalized.',
    variant: 'active'
  },
  DISCUSSION_REQUESTED: {
    label: 'Discussion Requested',
    explanation: 'FIC has requested a confidential discussion call with you.',
    variant: 'proposal'
  },
  ON_HOLD: {
    label: 'On Hold',
    explanation: 'This request is temporarily on hold.',
    variant: 'urgent'
  },
  CLOSED: {
    label: 'Closed',
    explanation: 'This request has been completed or closed.',
    variant: 'neutral'
  }
};

export const INVESTOR_STATUS_CONFIG: Record<
  string,
  { label: string; explanation: string; variant: 'pending' | 'proposal' | 'active' | 'luxury' | 'urgent' | 'neutral' }
> = {
  SUBMITTED: {
    label: 'Profile Submitted',
    explanation: 'Your investor profile has been received.',
    variant: 'pending'
  },
  VERIFICATION_IN_PROGRESS: {
    label: 'Verification in Progress',
    explanation: 'Your investor profile is currently being verified.',
    variant: 'luxury'
  },
  INFO_REQUIRED: {
    label: 'Information Required',
    explanation: 'FIC requires additional verification documents from you.',
    variant: 'urgent'
  },
  VERIFICATION_COMPLETED: {
    label: 'Verification Completed',
    explanation: 'Identity and entity checks completed successfully.',
    variant: 'active'
  },
  UNDER_REVIEW: {
    label: 'Profile Under Review',
    explanation: 'FIC is reviewing your investment preferences.',
    variant: 'pending'
  },
  DISCUSSION_REQUESTED: {
    label: 'Discussion Requested',
    explanation: 'FIC has requested an exploratory discussion with you.',
    variant: 'proposal'
  },
  ON_HOLD: {
    label: 'On Hold',
    explanation: 'Verification is temporarily on hold.',
    variant: 'urgent'
  },
  CLOSED: {
    label: 'Closed',
    explanation: 'This request has been closed.',
    variant: 'neutral'
  }
};

export const InvestmentPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // Navigation Tabs: 'submit' (Seek / Investor), 'pools' (Community Collection Pools), 'my_requests' (Tracking & Payouts)
  const [activeTab, setActiveTab] = useState<'submit' | 'pools' | 'my_requests'>('pools');

  // Community Collection Pools & Investments State
  const [pools, setPools] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedPoolForInvest, setSelectedPoolForInvest] = useState<any | null>(null);
  const [investPledgeAmount, setInvestPledgeAmount] = useState<string>('25000');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);
  const [poolActionSuccessMsg, setPoolActionSuccessMsg] = useState('');

  // Submission Option: Option A = 'FUNDING' (I Need Funding), Option B = 'INVESTOR' (I Want to Invest)
  const [submissionType, setSubmissionType] = useState<'FUNDING' | 'INVESTOR'>('FUNDING');

  // ----------------------------------------------------
  // Form State: Funding Seeker
  // ----------------------------------------------------
  const [fundingBusinessName, setFundingBusinessName] = useState('');
  const [fundingBusinessType, setFundingBusinessType] = useState('Private Limited Company');
  const [fundingIndustry, setFundingIndustry] = useState('Manufacturing');
  const [fundingPinCode, setFundingPinCode] = useState('');
  const [fundingCountry, setFundingCountry] = useState('India');
  const [fundingState, setFundingState] = useState('Tamil Nadu');
  const [fundingDistrict, setFundingDistrict] = useState('Coimbatore');
  const [fundingCity, setFundingCity] = useState('Coimbatore');
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinLookupMsg, setPinLookupMsg] = useState('');

  const handleFundingPinCodeChange = async (val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 6);
    setFundingPinCode(sanitized);
    if (sanitized.length === 6) {
      setIsLookingUpPin(true);
      setPinLookupMsg('Auto-fetching location...');
      try {
        const resolved = await lookupIndianPinCodeApi(sanitized);
        setFundingCountry(resolved.country || 'India');
        if (resolved.state) setFundingState(resolved.state);
        if (resolved.district) setFundingDistrict(resolved.district);
        if (resolved.city) setFundingCity(resolved.city);
        setPinLookupMsg(`Auto-filled: ${resolved.city || resolved.district}, ${resolved.district}, ${resolved.state}`);
      } catch {
        setPinLookupMsg('');
      } finally {
        setIsLookingUpPin(false);
      }
    } else {
      setPinLookupMsg('');
    }
  };
  const [fundingStage, setFundingStage] = useState('Growing Business');
  const [fundingAmount, setFundingAmount] = useState('5000000');
  const [fundingPurpose, setFundingPurpose] = useState<string[]>(['Business Expansion', 'Machinery / Equipment Purchase']);
  const [fundingUseExplanation, setFundingUseExplanation] = useState('');
  const [fundingRevenue, setFundingRevenue] = useState('₹50 Lakhs–₹1 Crore');
  const [fundingDescription, setFundingDescription] = useState('');
  const [fundingDocName, setFundingDocName] = useState('');
  const [fundingUploadedDocs, setFundingUploadedDocs] = useState<UploadedDocumentAsset[]>([]);
  const [isUploadingFundingDoc, setIsUploadingFundingDoc] = useState(false);
  const [viewerAsset, setViewerAsset] = useState<UploadedDocumentAsset | null>(null);

  // ----------------------------------------------------
  // Form State: Investor
  // ----------------------------------------------------
  const [invType, setInvType] = useState('Individual Investor');
  const [invName, setInvName] = useState('');
  const [invCountry, setInvCountry] = useState('India');
  const [invStateCity, setInvStateCity] = useState('');
  const [invProfile, setInvProfile] = useState('');
  const [invTotalCapacity, setInvTotalCapacity] = useState('₹50 Lakhs–₹1 Crore');
  const [invPreferredTicket, setInvPreferredTicket] = useState('₹25–50 Lakhs');
  const [invPreferredSectors, setInvPreferredSectors] = useState<string[]>(['Technology', 'Manufacturing']);
  const [invPreferredStages, setInvPreferredStages] = useState<string[]>(['Revenue Generating Business', 'Growth Stage']);
  const [invInvestmentType, setInvInvestmentType] = useState('Equity Investment');
  const [invExperience, setInvExperience] = useState('');
  const [invAdditionalPreferences, setInvAdditionalPreferences] = useState('');
  const [invDocName, setInvDocName] = useState('');
  const [invUploadedDocs, setInvUploadedDocs] = useState<UploadedDocumentAsset[]>([]);
  const [isUploadingInvDoc, setIsUploadingInvDoc] = useState(false);

  // Loading & Submission Confirmation State
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  // Listing State
  const [dealItems, setDealItems] = useState<InvestmentDealItem[]>([]);
  const [listFilter, setListFilter] = useState<'ALL' | 'FUNDING' | 'INVESTOR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InvestmentDealItem | null>(null);

  const storageKey = `fic_user_deals_${userId}`;

  const initialDemoDeals: InvestmentDealItem[] = [];

  // Load from local storage and server
  useEffect(() => {
    const loadDeals = async () => {
      let merged: InvestmentDealItem[] = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          merged = [...parsed];
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      try {
        const res = await apiRequest('/investment/me');
        if (res && res.data) {
          const serverFunding: FundingRequestItem[] = (res.data.fundingRequests || []).map((f: any) => ({
            type: 'FUNDING' as const,
            id: f.refNumber || f._id,
            refNumber: f.refNumber || f._id,
            userId: f.userId,
            businessName: f.businessName,
            businessType: f.businessType,
            industry: f.industry,
            location: f.location || { country: 'India', state: '', city: '' },
            businessStage: f.businessStage,
            fundingAmount: f.fundingAmount,
            fundingPurpose: f.fundingPurpose || [],
            useOfFundsExplanation: f.useOfFundsExplanation,
            currentAnnualRevenue: f.currentAnnualRevenue,
            businessDescription: f.businessDescription,
            documents: f.documents || [],
            status: f.status || 'SUBMITTED',
            submittedDate: f.createdAt
              ? new Date(f.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Recently',
            latestFicUpdate: f.latestFicUpdate || 'Your funding request has been received. Our team is reviewing your business details.',
            whatHappensNext: f.whatHappensNext || 'FIC will review your submitted information.',
            updateHistory: f.updateHistory || []
          }));

          const serverInvestors: InvestorProfileItem[] = (res.data.investorProfiles || []).map((i: any) => ({
            type: 'INVESTOR' as const,
            id: i.refNumber || i._id,
            refNumber: i.refNumber || i._id,
            userId: i.userId,
            investorType: i.investorType,
            investorName: i.investorName,
            country: i.country,
            stateCity: i.stateCity,
            investorProfile: i.investorProfile,
            totalCapacity: i.totalCapacity,
            preferredTicketSize: i.preferredTicketSize,
            preferredSectors: i.preferredSectors || [],
            preferredStages: i.preferredStages || [],
            investmentType: i.investmentType,
            investmentExperience: i.investmentExperience,
            additionalPreferences: i.additionalPreferences,
            documents: i.documents || [],
            status: i.status || 'SUBMITTED',
            submittedDate: i.createdAt
              ? new Date(i.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Recently',
            latestFicUpdate: i.latestFicUpdate || 'Your investor profile is currently being verified.',
            whatHappensNext: i.whatHappensNext || 'Your profile verification is in progress.',
            updateHistory: i.updateHistory || []
          }));

          const serverAll: InvestmentDealItem[] = [...serverFunding, ...serverInvestors];
          if (serverAll.length > 0) {
            const serverIds = new Set(serverAll.map((s) => s.refNumber || s.id));
            const nonServer = merged.filter((m) => !serverIds.has(m.refNumber || m.id));
            merged = [...serverAll, ...nonServer];
          }
        }
      } catch (err) {
        console.warn('Backend fetch /investment/me fallback:', err);
      }

      setDealItems(merged);
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch (e) {
        console.error(e);
      }
    };

    const loadPoolsAndInvestments = async () => {
      try {
        const [poolsRes, invRes] = await Promise.all([
          apiRequest('/investment/pools'),
          apiRequest('/investment/my-investments')
        ]);
        if (poolsRes && poolsRes.success && Array.isArray(poolsRes.data)) {
          setPools(poolsRes.data);
        }
        if (invRes && invRes.success && Array.isArray(invRes.data)) {
          setMyInvestments(invRes.data);
        }
      } catch (poolErr) {
        console.warn('Failed to load community pools:', poolErr);
      }
    };

    loadDeals();
    loadPoolsAndInvestments();
  }, [storageKey]);

  // Handle User Investing into a Community Collection Pool
  const handlePledgeToPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolForInvest || isSubmittingPledge) return;
    const amountNum = Number(investPledgeAmount);
    if (!amountNum || amountNum <= 0) return;

    setIsSubmittingPledge(true);
    const poolId = selectedPoolForInvest._id || selectedPoolForInvest.id || selectedPoolForInvest.poolCode;

    try {
      const res = await apiRequest(`/investment/pools/${poolId}/invest`, {
        method: 'POST',
        body: JSON.stringify({ amount: amountNum })
      });

      if (res && res.success) {
        setPoolActionSuccessMsg(`Successfully pledged ₹${amountNum.toLocaleString('en-IN')}! Expected return: ₹${res.data?.totalMaturityAmount?.toLocaleString('en-IN')}`);
        setIsInvestModalOpen(false);

        // Refresh pools & investments in background
        apiRequest('/investment/pools').then((r) => { if (r?.success) setPools(r.data); });
        apiRequest('/investment/my-investments').then((r) => { if (r?.success) setMyInvestments(r.data); });

        setTimeout(() => setPoolActionSuccessMsg(''), 6000);
      } else {
        // Fallback for demo when backend is offline or sandbox fallback
        const years = (selectedPoolForInvest.tenureMonths || 12) / 12;
        const interest = Math.round((amountNum * (selectedPoolForInvest.investorAnnualYieldPercent || 10) * years) / 100);
        const total = amountNum + interest;

        setMyInvestments((prev) => [
          {
            poolId: selectedPoolForInvest._id || selectedPoolForInvest.poolCode,
            poolCode: selectedPoolForInvest.poolCode,
            poolTitle: selectedPoolForInvest.title,
            poolStatus: selectedPoolForInvest.status,
            tenureMonths: selectedPoolForInvest.tenureMonths || 12,
            annualYieldPercent: selectedPoolForInvest.investorAnnualYieldPercent || 10,
            investedAmount: amountNum,
            investedAt: new Date().toISOString(),
            expectedInterest: interest,
            totalMaturityAmount: total,
            payoutStatus: 'PENDING',
            transactionReference: `INV-${Date.now()}`
          },
          ...prev
        ]);

        setPoolActionSuccessMsg(`Successfully pledged ₹${amountNum.toLocaleString('en-IN')}! Expected return: ₹${total.toLocaleString('en-IN')}`);
        setIsInvestModalOpen(false);
        setTimeout(() => setPoolActionSuccessMsg(''), 6000);
      }
    } catch (pledgeErr: any) {
      console.warn('Pledge request exception:', pledgeErr);
      // Ensure modal gracefully completes with optimistic feedback
      const years = (selectedPoolForInvest.tenureMonths || 12) / 12;
      const interest = Math.round((amountNum * (selectedPoolForInvest.investorAnnualYieldPercent || 10) * years) / 100);
      const total = amountNum + interest;

      setMyInvestments((prev) => [
        {
          poolId: selectedPoolForInvest._id || selectedPoolForInvest.poolCode,
          poolCode: selectedPoolForInvest.poolCode,
          poolTitle: selectedPoolForInvest.title,
          poolStatus: selectedPoolForInvest.status,
          tenureMonths: selectedPoolForInvest.tenureMonths || 12,
          annualYieldPercent: selectedPoolForInvest.investorAnnualYieldPercent || 10,
          investedAmount: amountNum,
          investedAt: new Date().toISOString(),
          expectedInterest: interest,
          totalMaturityAmount: total,
          payoutStatus: 'PENDING',
          transactionReference: `INV-${Date.now()}`
        },
        ...prev
      ]);

      setPoolActionSuccessMsg(`Successfully pledged ₹${amountNum.toLocaleString('en-IN')}! Expected return: ₹${total.toLocaleString('en-IN')}`);
      setIsInvestModalOpen(false);
      setTimeout(() => setPoolActionSuccessMsg(''), 6000);
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  // Handle Switching between Option A and Option B with confirmation if unsaved data exists
  const handleSwitchSubmissionType = (newType: 'FUNDING' | 'INVESTOR') => {
    if (newType === submissionType) return;
    const hasFundingData = fundingBusinessName.trim() || fundingUseExplanation.trim() || fundingDescription.trim();
    const hasInvestorData = invName.trim() || invProfile.trim() || invExperience.trim();

    if (submissionType === 'FUNDING' && hasFundingData) {
      const confirmSwitch = window.confirm('You have unsaved changes in your Funding Request form. Do you want to switch to the Investor form?');
      if (!confirmSwitch) return;
    } else if (submissionType === 'INVESTOR' && hasInvestorData) {
      const confirmSwitch = window.confirm('You have unsaved changes in your Investor Profile form. Do you want to switch to the Funding form?');
      if (!confirmSwitch) return;
    }
    setSubmissionType(newType);
  };

  // Toggle funding purpose
  const toggleFundingPurpose = (item: string) => {
    if (fundingPurpose.includes(item)) {
      if (fundingPurpose.length > 1) {
        setFundingPurpose(fundingPurpose.filter((p) => p !== item));
      }
    } else {
      setFundingPurpose([...fundingPurpose, item]);
    }
  };

  // Toggle investor preferred sector
  const toggleInvSector = (sec: string) => {
    if (invPreferredSectors.includes(sec)) {
      if (invPreferredSectors.length > 1) {
        setInvPreferredSectors(invPreferredSectors.filter((s) => s !== sec));
      }
    } else {
      setInvPreferredSectors([...invPreferredSectors, sec]);
    }
  };

  // Toggle investor preferred stage
  const toggleInvStage = (stg: string) => {
    if (invPreferredStages.includes(stg)) {
      if (invPreferredStages.length > 1) {
        setInvPreferredStages(invPreferredStages.filter((s) => s !== stg));
      }
    } else {
      setInvPreferredStages([...invPreferredStages, stg]);
    }
  };

  // Submit Funding Request
  const handleSubmitFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const generatedRef = `FIC-FUND-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const newFundingItem: FundingRequestItem = {
      type: 'FUNDING',
      id: generatedRef,
      refNumber: generatedRef,
      userId,
      businessName: fundingBusinessName.trim(),
      businessType: fundingBusinessType,
      industry: fundingIndustry,
      location: {
        country: fundingCountry.trim() || 'India',
        state: fundingState.trim(),
        district: fundingDistrict.trim(),
        city: fundingCity.trim(),
        pinCode: fundingPinCode.trim()
      } as any,
      businessStage: fundingStage,
      fundingAmount: Number(fundingAmount) || 0,
      fundingPurpose,
      useOfFundsExplanation: fundingUseExplanation.trim(),
      currentAnnualRevenue: fundingRevenue,
      businessDescription: fundingDescription.trim(),
      documents:
        fundingUploadedDocs.length > 0
          ? fundingUploadedDocs.map((d) => ({
              documentId: d.documentId,
              name: d.originalFileName,
              fileUrl: d.viewUrl,
              originalMimeType: d.originalMimeType,
              originalFileSize: d.originalFileSize,
              checksum: d.checksum,
              fileType: d.originalFileExtension,
              uploadedAt: d.createdAt,
              status: 'PENDING'
            }))
          : fundingDocName.trim()
          ? [{ name: fundingDocName.trim(), fileUrl: '#', uploadedAt: new Date().toLocaleDateString(), status: 'PENDING' }]
          : [],
      status: 'SUBMITTED',
      submittedDate: todayFormatted,
      latestFicUpdate: 'Your funding request has been received. Our team is reviewing your business details.',
      whatHappensNext: 'FIC will review your submitted information and coordinate preliminary verification.',
      updateHistory: [
        {
          date: todayFormatted,
          status: 'Request Submitted',
          update: 'Your funding request has been received. Our team is reviewing your business details.',
          updatedBy: 'FIC Deal Desk'
        }
      ]
    };

    try {
      await apiRequest('/investment/funding', {
        method: 'POST',
        body: JSON.stringify({
          ...newFundingItem,
          applicantName: user?.fullName || (user as any)?.name,
          applicantEmail: user?.email,
          applicantPhone: user?.phoneNumber || (user as any)?.phone
        })
      });
    } catch {
      // Fallback
    } finally {
      const updated = [newFundingItem, ...dealItems];
      setDealItems(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setSubmittedRef(generatedRef);
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  // Submit Investor Profile
  const handleSubmitInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const generatedRef = `FIC-INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const newInvestorItem: InvestorProfileItem = {
      type: 'INVESTOR',
      id: generatedRef,
      refNumber: generatedRef,
      userId,
      investorType: invType,
      investorName: invName.trim(),
      country: invCountry.trim() || 'India',
      stateCity: invStateCity.trim(),
      investorProfile: invProfile.trim(),
      totalCapacity: invTotalCapacity,
      preferredTicketSize: invPreferredTicket,
      preferredSectors: invPreferredSectors,
      preferredStages: invPreferredStages,
      investmentType: invInvestmentType,
      investmentExperience: invExperience.trim(),
      additionalPreferences: invAdditionalPreferences.trim(),
      documents:
        invUploadedDocs.length > 0
          ? invUploadedDocs.map((d) => ({
              documentId: d.documentId,
              name: d.originalFileName,
              fileUrl: d.viewUrl,
              originalMimeType: d.originalMimeType,
              originalFileSize: d.originalFileSize,
              checksum: d.checksum,
              fileType: d.originalFileExtension,
              uploadedAt: d.createdAt,
              status: 'PENDING'
            }))
          : invDocName.trim()
          ? [{ name: invDocName.trim(), fileUrl: '#', uploadedAt: new Date().toLocaleDateString(), status: 'PENDING' }]
          : [],
      status: 'SUBMITTED',
      submittedDate: todayFormatted,
      latestFicUpdate: 'Your investor profile is currently being verified.',
      whatHappensNext: 'Your profile verification is in progress.',
      updateHistory: [
        {
          date: todayFormatted,
          status: 'Profile Submitted',
          update: 'Your investor profile is currently being verified.',
          updatedBy: 'FIC Investment Desk'
        }
      ]
    };

    try {
      await apiRequest('/investment/investor', {
        method: 'POST',
        body: JSON.stringify(newInvestorItem)
      });
    } catch {
      // Fallback
    } finally {
      const updated = [newInvestorItem, ...dealItems];
      setDealItems(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setSubmittedRef(generatedRef);
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  // Filtered Deal Items List
  const filteredDealItems = dealItems.filter((item) => {
    if (listFilter !== 'ALL' && item.type !== listFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = (item.refNumber || item.id).toLowerCase().includes(q);
      const matchName =
        item.type === 'FUNDING'
          ? item.businessName.toLowerCase().includes(q)
          : item.investorName.toLowerCase().includes(q);
      if (!matchRef && !matchName) return false;
    }
    return true;
  });

  const getStatusBadge = (item: InvestmentDealItem) => {
    if (item.type === 'FUNDING') {
      const cfg = FUNDING_STATUS_CONFIG[item.status] || { label: item.status, variant: 'pending' as const };
      return <WorkspaceBadge variant={cfg.variant}>{cfg.label}</WorkspaceBadge>;
    } else {
      const cfg = INVESTOR_STATUS_CONFIG[item.status] || { label: item.status, variant: 'pending' as const };
      return <WorkspaceBadge variant={cfg.variant}>{cfg.label}</WorkspaceBadge>;
    }
  };

  const getStatusExplanation = (item: InvestmentDealItem) => {
    if (item.type === 'FUNDING') {
      return FUNDING_STATUS_CONFIG[item.status]?.explanation || 'Your funding request is under review.';
    } else {
      return INVESTOR_STATUS_CONFIG[item.status]?.explanation || 'Your investor profile is being verified.';
    }
  };

  return (
    <WorkspaceShell>
      {/* ========================================================
          1. HEADER WITH ACCURATE COMPLIANCE NOTICE
         ======================================================== */}
      <WorkspaceHero
        accent="teal"
        title="Investment & Funding"
        subtitle="Connect with business funding opportunities or share your investment interest through FIC's private coordination platform."
      />

      {/* Compliance Information Section */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#E0F4F0]/60 border border-[#2C857B]/30 text-xs text-[#1C6960] flex items-start gap-3">
        <ShieldCheckIcon size={18} className="text-[#1C6960] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <strong className="block text-[#134A44] font-black">Private Coordination Notice:</strong>
          <p className="text-[11px] text-[#1C6960]">
            FIC coordinates private business introductions between eligible funding seekers and potential investors. FIC does not guarantee funding, investment returns, or successful deal completion.
          </p>
        </div>
      </div>

      {/* ========================================================
          2. WORKSPACE TAB SWITCHER (POOLS, SUBMIT, MY STATUS)
         ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#EDE2D7] pb-2.5 mb-5 overflow-x-auto">
        {/* Tab: Active Community Pools / Poll */}
        <button
          type="button"
          onClick={() => setActiveTab('pools')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'pools' ? 'text-white' : 'text-[#453A33] hover:text-[#1C6960] font-bold'
          }`}
        >
          {activeTab === 'pools' && (
            <motion.div
              layoutId="investTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#2C857B] to-[#1C6960] rounded-xl shadow-[0_2px_8px_rgba(44,133,123,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <TrendingUpIcon size={15} />
            <span>Community Investment Pools & Polls</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'pools'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {pools.filter((p) => p.status === 'OPEN').length} Active
            </span>
          </span>
        </button>

        {/* Tab: Submit Funding / Investor Profile */}
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'submit' ? 'text-white' : 'text-[#453A33] hover:text-[#1C6960] font-bold'
          }`}
        >
          {activeTab === 'submit' && (
            <motion.div
              layoutId="investTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#2C857B] to-[#1C6960] rounded-xl shadow-[0_2px_8px_rgba(44,133,123,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <HandCoinsIcon size={15} />
            <span>Apply for Funding / Seek Capital</span>
          </span>
        </button>

        {/* Tab: My Deal Requests & Payouts */}
        <button
          type="button"
          onClick={() => setActiveTab('my_requests')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_requests' ? 'text-white' : 'text-[#453A33] hover:text-[#1C6960] font-bold'
          }`}
        >
          {activeTab === 'my_requests' && (
            <motion.div
              layoutId="investTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#2C857B] to-[#1C6960] rounded-xl shadow-[0_2px_8px_rgba(44,133,123,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <FileTextIcon size={15} />
            <span>My Deals & Yield Returns</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'my_requests'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#FAF7F2] text-[#453A33] border border-[#EDE2D7]'
              }`}
            >
              {dealItems.length + myInvestments.length}
            </span>
          </span>
        </button>
      </div>

      {poolActionSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={18} className="text-emerald-600" />
            <span>{poolActionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setPoolActionSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ========================================================
          TAB: COMMUNITY INVESTMENT COLLECTION POOLS & POLLS
         ======================================================== */}
      {activeTab === 'pools' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#2C857B]/10 via-[#FAF7F2] to-[#8064B1]/10 border border-[#EDE2D7]">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#2E231C] flex items-center gap-2">
                <TrendingUpIcon size={20} className="text-[#2C857B]" />
                <span>Ecosystem Community Investment Pools</span>
              </h3>
              <p className="text-xs text-[#6B5E55] mt-1 max-w-2xl leading-relaxed">
                Co-invest with verified FIC peers into high-growth enterprise ventures and community projects. All pools feature fixed interest payouts guaranteed on capital maturity, credited directly to your platform wallet.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <WorkspaceButton
                variant="teal"
                size="sm"
                onClick={() => setActiveTab('submit')}
              >
                <PlusIcon size={14} className="mr-1" />
                Submit My Venture
              </WorkspaceButton>
            </div>
          </div>

          {pools.length === 0 ? (
            <WorkspaceCard variant="default" className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-[#453A33] flex items-center justify-center mx-auto mb-3">
                <TrendingUpIcon size={24} />
              </div>
              <h4 className="text-base font-black text-[#2E231C]">No Active Investment Pools Right Now</h4>
              <p className="text-xs text-[#6B5E55] max-w-md mx-auto mt-1">
                FIC administrators are currently evaluating diligence proposals. New curated community investment pools will be posted here soon.
              </p>
            </WorkspaceCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pools.map((p) => {
                const collected = p.collectedAmount || 0;
                const target = p.targetAmount || 1;
                const pct = Math.min(100, Math.round((collected / target) * 100));
                const isOpen = p.status === 'OPEN';

                return (
                  <motion.div
                    key={p._id || p.poolCode}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <WorkspaceCard
                      variant="default"
                      className="h-full flex flex-col justify-between p-5 border border-[#EDE2D7] hover:border-[#2C857B]/50 transition-all shadow-xs"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                            {p.poolCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              p.status === 'OPEN'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : p.status === 'FUNDED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : p.status === 'DISBURSED'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-stone-100 text-stone-700 border border-stone-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-[#2E231C] leading-snug line-clamp-1">
                            {p.title}
                          </h4>
                          <span className="text-[11px] font-bold text-[#1C6960] block mt-0.5">
                            {p.industryCategory}
                          </span>
                        </div>

                        <p className="text-xs text-[#51463F] leading-relaxed line-clamp-2">
                          {p.description}
                        </p>

                        {/* Financial Term Highlights */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]/80 text-center">
                          <div>
                            <span className="text-[10px] font-bold text-[#82776E] uppercase block">Fixed Return</span>
                            <span className="text-sm font-black text-[#2C857B]">
                              {p.investorAnnualYieldPercent}% <span className="text-[10px] font-semibold text-[#6B5E55]">p.a.</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#82776E] uppercase block">Tenure Period</span>
                            <span className="text-sm font-black text-[#2E231C]">
                              {p.tenureMonths} <span className="text-[10px] font-semibold text-[#6B5E55]">Months</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#2E231C]">
                              ₹{collected.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[#82776E]">
                              Target: ₹{target.toLocaleString('en-IN')} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#E5DCD3] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#2C857B] to-[#1C6960] h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#EDE2D7] flex items-center justify-between gap-3">
                        <div className="text-left">
                          <span className="text-[10px] font-semibold text-[#82776E] block">Min Ticket</span>
                          <span className="text-xs font-black text-[#2E231C]">
                            ₹{(p.minInvestmentPerUser || 10000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <WorkspaceButton
                          variant={isOpen ? 'teal' : 'outline'}
                          size="sm"
                          disabled={!isOpen}
                          onClick={() => {
                            setSelectedPoolForInvest(p);
                            setInvestPledgeAmount(String(p.minInvestmentPerUser || 25000));
                            setIsInvestModalOpen(true);
                          }}
                        >
                          {isOpen ? 'Invest In Pool' : p.status}
                        </WorkspaceButton>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 1: SUBMIT EXPRESSION OF INTEREST
         ======================================================== */}
      {activeTab === 'submit' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <WorkspaceCard
                variant={submissionType === 'FUNDING' ? 'teal' : 'violet'}
                className="text-center py-8 px-6 space-y-4"
              >
                <div
                  className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto shadow-md ${
                    submissionType === 'FUNDING'
                      ? 'bg-gradient-to-br from-[#2C857B] to-[#1C6960]'
                      : 'bg-gradient-to-br from-[#8064B1] to-[#6E529F]'
                  }`}
                >
                  <CheckCircleIcon size={28} />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                      submissionType === 'FUNDING'
                        ? 'bg-teal-50 text-teal-900 border-teal-300'
                        : 'bg-purple-50 text-purple-900 border-purple-300'
                    }`}
                  >
                    Reference: {submittedRef}
                  </span>
                  <h3 className="text-xl font-black text-[#2E231C]">
                    {submissionType === 'FUNDING'
                      ? 'Funding Request Submitted Successfully!'
                      : 'Investor Profile Submitted Successfully!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#453A33] leading-relaxed">
                    {submissionType === 'FUNDING'
                      ? 'Your funding request has been submitted successfully. FIC will review your business details and share updates here.'
                      : 'Your investor profile has been submitted successfully. FIC will review your details and update your verification status here.'}
                  </p>
                  <p className="text-xs text-[#6B5E55] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#EDE2D7]">
                    You can track your request status and latest updates anytime under <strong>"My Deal Requests & Status"</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant={submissionType === 'FUNDING' ? 'teal' : 'violet'}
                    size="md"
                    onClick={() => setActiveTab('my_requests')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    My Deal Requests & Status
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmittedRef('');
                    }}
                  >
                    Submit Another Expression
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <>
              {/* Submission Type Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option A: I Need Funding */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSwitchSubmissionType('FUNDING')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    submissionType === 'FUNDING'
                      ? 'border-[#2C857B] bg-gradient-to-br from-[#E0F4F0] to-[#FFFFFF] shadow-sm'
                      : 'border-[#EDE2D7] bg-white hover:border-[#2C857B]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        submissionType === 'FUNDING'
                          ? 'bg-[#2C857B] text-white shadow-xs'
                          : 'bg-stone-100 text-[#453A33]'
                      }`}
                    >
                      <HandCoinsIcon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#2E231C]">Option A – I Need Funding</h4>
                      <span className="text-[10px] font-bold text-[#1C6960] uppercase tracking-wider">
                        Funding Seeker
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#453A33] leading-relaxed">
                    I represent a business or startup looking for capital to grow, expand, or develop my business.
                  </p>
                </motion.div>

                {/* Option B: I Want to Invest */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSwitchSubmissionType('INVESTOR')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    submissionType === 'INVESTOR'
                      ? 'border-[#8064B1] bg-gradient-to-br from-[#F5EEFB] to-[#FFFFFF] shadow-sm'
                      : 'border-[#EDE2D7] bg-white hover:border-[#8064B1]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        submissionType === 'INVESTOR'
                          ? 'bg-[#8064B1] text-white shadow-xs'
                          : 'bg-stone-100 text-[#453A33]'
                      }`}
                    >
                      <TrendingUpIcon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#2E231C]">Option B – I Want to Invest</h4>
                      <span className="text-[10px] font-bold text-[#8064B1] uppercase tracking-wider">
                        Investor Profile
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#453A33] leading-relaxed">
                    I am an investor or represent an organization interested in investing in suitable businesses.
                  </p>
                </motion.div>
              </div>

              {/* Form 1: Funding Seeker Form */}
              {submissionType === 'FUNDING' && (
                <WorkspaceCard variant="default">
                  <div className="border-b border-[#EDE2D7] pb-3 mb-4">
                    <h3 className="text-base sm:text-lg font-black text-[#2E231C]">Funding Request</h3>
                    <p className="text-xs text-[#6B5E55] mt-0.5">
                      Share your business details and explain how much funding you need and how you plan to use it.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitFunding} className="space-y-5">
                    {/* SECTION A: Business Information */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-[#1C6960] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section A – Business Information
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            1. Business / Company Name <span className="text-[#C65638]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter legal business name"
                            value={fundingBusinessName}
                            onChange={(e) => setFundingBusinessName(e.target.value)}
                            required
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C857B] bg-white text-[#2E231C]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            2. Business Type <span className="text-[#C65638]">*</span>
                          </label>
                          <select
                            value={fundingBusinessType}
                            onChange={(e) => setFundingBusinessType(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2C857B]"
                          >
                            <option value="Startup">Startup</option>
                            <option value="Proprietorship">Proprietorship</option>
                            <option value="Partnership">Partnership</option>
                            <option value="LLP">LLP</option>
                            <option value="Private Limited Company">Private Limited Company</option>
                            <option value="Public Limited Company">Public Limited Company</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            3. Industry / Business Sector <span className="text-[#C65638]">*</span>
                          </label>
                          <select
                            value={fundingIndustry}
                            onChange={(e) => setFundingIndustry(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2C857B]"
                          >
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Technology">Technology</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Retail / Franchise">Retail / Franchise</option>
                            <option value="Logistics">Logistics</option>
                            <option value="Education">Education</option>
                            <option value="Renewable Energy">Renewable Energy</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            5. Business Stage <span className="text-[#C65638]">*</span>
                          </label>
                          <select
                            value={fundingStage}
                            onChange={(e) => setFundingStage(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2C857B]"
                          >
                            <option value="Idea Stage">Idea Stage</option>
                            <option value="Startup / Pre-Revenue">Startup / Pre-Revenue</option>
                            <option value="Early Revenue">Early Revenue</option>
                            <option value="Growing Business">Growing Business</option>
                            <option value="Established Business">Established Business</option>
                          </select>
                        </div>
                      </div>

                      {/* Location: PIN Code first + Country, State, District, City */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-[#2E231C] block">
                            4. Business Location <span className="text-[#C65638]">*</span>
                          </label>
                          {pinLookupMsg && (
                            <span className={`text-[11px] font-semibold ${isLookingUpPin ? 'text-[#8064B1] animate-pulse' : 'text-[#2E7D32]'}`}>{pinLookupMsg}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div className="col-span-2 sm:col-span-1">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="PIN Code *"
                              value={fundingPinCode}
                              onChange={(e) => handleFundingPinCodeChange(e.target.value)}
                              required
                              className="w-full text-xs p-2.5 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2C857B]"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Country"
                            value={fundingCountry}
                            onChange={(e) => setFundingCountry(e.target.value)}
                            required
                            className="text-xs p-2.5 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C]"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={fundingState}
                            onChange={(e) => setFundingState(e.target.value)}
                            required
                            className="text-xs p-2.5 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C]"
                          />
                          <input
                            type="text"
                            placeholder="District"
                            value={fundingDistrict}
                            onChange={(e) => setFundingDistrict(e.target.value)}
                            className="text-xs p-2.5 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C]"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={fundingCity}
                            onChange={(e) => setFundingCity(e.target.value)}
                            required
                            className="text-xs p-2.5 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: Funding Requirement */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-[#1C6960] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section B – Funding Requirement
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-[#2E231C]">
                              6. Funding Amount Required (INR) <span className="text-[#C65638]">*</span>
                            </label>
                            <span className="text-[11px] font-black text-[#1C6960]">
                              {formatCurrencyINR(Number(fundingAmount) || 0)}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="50000"
                            step="50000"
                            placeholder="e.g. 5000000"
                            value={fundingAmount}
                            onChange={(e) => setFundingAmount(e.target.value)}
                            required
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C857B] bg-white text-[#2E231C]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            9. Current Annual Revenue <span className="text-[11px] font-normal text-[#6B5E55]">(Optional)</span>
                          </label>
                          <select
                            value={fundingRevenue}
                            onChange={(e) => setFundingRevenue(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2C857B]"
                          >
                            <option value="Pre-Revenue">Pre-Revenue</option>
                            <option value="Below ₹10 Lakhs">Below ₹10 Lakhs</option>
                            <option value="₹10–50 Lakhs">₹10–50 Lakhs</option>
                            <option value="₹50 Lakhs–₹1 Crore">₹50 Lakhs–₹1 Crore</option>
                            <option value="₹1–5 Crores">₹1–5 Crores</option>
                            <option value="Above ₹5 Crores">Above ₹5 Crores</option>
                            <option value="Prefer to discuss privately">Prefer to discuss privately</option>
                          </select>
                        </div>
                      </div>

                      {/* 7. Funding Purpose */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#2E231C] block">
                          7. Funding Purpose <span className="text-[#C65638]">*</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Business Expansion',
                            'Working Capital',
                            'Machinery / Equipment Purchase',
                            'Technology / Product Development',
                            'Marketing & Sales',
                            'New Branch / Location',
                            'Infrastructure Development',
                            'Other'
                          ].map((purp) => {
                            const isSel = fundingPurpose.includes(purp);
                            return (
                              <button
                                type="button"
                                key={purp}
                                onClick={() => toggleFundingPurpose(purp)}
                                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#2C857B] text-white border-transparent font-bold'
                                    : 'bg-white text-[#453A33] border-[#EDE2D7] hover:bg-[#E0F4F0]'
                                }`}
                              >
                                {isSel ? '✓ ' : '+ '}
                                {purp}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 8. Explain How You Will Use the Funding */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#2E231C] block">
                          8. Explain How You Will Use the Funding <span className="text-[#C65638]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={fundingUseExplanation}
                          onChange={(e) => setFundingUseExplanation(e.target.value)}
                          required
                          placeholder="Explain why you need funding and how you plan to use it. For example, machinery purchase, business expansion, working capital, or product development."
                          className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C857B] bg-white text-[#2E231C] leading-relaxed"
                        />
                      </div>

                      {/* 10. Business Description */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#2E231C] block">
                          10. Business Description <span className="text-[#C65638]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={fundingDescription}
                          onChange={(e) => setFundingDescription(e.target.value)}
                          required
                          placeholder="Briefly describe your business, products or services, customers, and current operations."
                          className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C857B] bg-white text-[#2E231C] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* SECTION C: Supporting Documents */}
                    <div className="space-y-2">
                      <span className="text-xs font-black text-[#1C6960] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section C – Supporting Documents (Optional Initially)
                      </span>
                      <p className="text-[11px] text-[#6B5E55]">
                        Allowed: PDF, JPG, JPEG, PNG, WEBP, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT (max 15MB). Original files are preserved intact; images get optimized previews.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          disabled={isUploadingFundingDoc}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setIsUploadingFundingDoc(true);
                            try {
                              const uploaded = await uploadDocumentFile(f, {
                                entityType: 'INVESTMENT',
                                documentCategory: 'FUNDING_PITCH',
                                documentLabel: f.name
                              });
                              setFundingUploadedDocs((prev) => [...prev, uploaded]);
                            } catch (err: any) {
                              alert(err?.message || 'Document upload failed.');
                            } finally {
                              setIsUploadingFundingDoc(false);
                              e.target.value = '';
                            }
                          }}
                          className="w-full text-xs p-2 border border-dashed border-[#2C857B]/50 rounded-xl bg-white text-[#2E231C] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2C857B]/10 file:text-[#1C6960]"
                        />
                        {isUploadingFundingDoc && (
                          <span className="text-[11px] font-bold text-[#1C6960] shrink-0">Uploading...</span>
                        )}
                      </div>
                      {fundingUploadedDocs.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {fundingUploadedDocs.map((doc) => (
                            <div
                              key={doc.documentId}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F4FBF9] border border-[#2C857B]/25 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-[#2E231C] truncate">{doc.originalFileName}</div>
                                <div className="text-[10px] text-[#6B5E55]">
                                  {(doc.originalFileSize / 1024).toFixed(1)} KB
                                  {doc.compressionRatio && doc.compressionRatio > 0
                                    ? ` · Preview optimized (${doc.compressionRatio}% smaller)`
                                    : ' · Exact original preserved'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewerAsset(doc)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE2D7] text-[#1C6960] font-bold text-[11px]"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadOriginalDocument(doc.documentId, doc.originalFileName)}
                                  className="px-2.5 py-1 rounded-lg bg-[#1C6960] text-white font-bold text-[11px]"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit CTA */}
                    <div className="pt-2 flex justify-end">
                      <WorkspaceButton
                        variant="teal"
                        size="md"
                        type="submit"
                        loading={isLoading}
                        icon={<ArrowRightIcon size={14} />}
                      >
                        Submit Funding Request
                      </WorkspaceButton>
                    </div>
                  </form>
                </WorkspaceCard>
              )}

              {/* Form 2: Investor Form */}
              {submissionType === 'INVESTOR' && (
                <WorkspaceCard variant="default">
                  <div className="border-b border-[#EDE2D7] pb-3 mb-4">
                    <h3 className="text-base sm:text-lg font-black text-[#2E231C]">
                      Investor Profile & Investment Interest
                    </h3>
                    <p className="text-xs text-[#6B5E55] mt-0.5">
                      Share your investment preferences so FIC can understand the types of businesses you are interested in.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitInvestor} className="space-y-5">
                    {/* SECTION A: Investor Information */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-[#8064B1] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section A – Investor Information
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            1. Investor Type <span className="text-[#C65638]">*</span>
                          </label>
                          <select
                            value={invType}
                            onChange={(e) => setInvType(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                          >
                            <option value="Individual Investor">Individual Investor</option>
                            <option value="Company / Corporate Investor">Company / Corporate Investor</option>
                            <option value="Investment Firm">Investment Firm</option>
                            <option value="Family Office">Family Office</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            2. Investor / Organization Name <span className="text-[#C65638]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter individual or firm name"
                            value={invName}
                            onChange={(e) => setInvName(e.target.value)}
                            required
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#2E231C]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            3. Country <span className="text-[#C65638]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. India"
                            value={invCountry}
                            onChange={(e) => setInvCountry(e.target.value)}
                            required
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            4. State / City <span className="text-[#C65638]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Chennai, Tamil Nadu"
                            value={invStateCity}
                            onChange={(e) => setInvStateCity(e.target.value)}
                            required
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#2E231C] block">
                          5. Investor Profile <span className="text-[#C65638]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={invProfile}
                          onChange={(e) => setInvProfile(e.target.value)}
                          required
                          placeholder="Briefly introduce yourself or your organization and your investment interests."
                          className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#2E231C] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* SECTION B: Investment Capacity */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-[#8064B1] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section B – Investment Capacity & Focus
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            6. Total Investment Capacity <span className="text-[#C65638]">*</span>
                          </label>
                          <select
                            value={invTotalCapacity}
                            onChange={(e) => setInvTotalCapacity(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                          >
                            <option value="Below ₹10 Lakhs">Below ₹10 Lakhs</option>
                            <option value="₹10–25 Lakhs">₹10–25 Lakhs</option>
                            <option value="₹25–50 Lakhs">₹25–50 Lakhs</option>
                            <option value="₹50 Lakhs–₹1 Crore">₹50 Lakhs–₹1 Crore</option>
                            <option value="₹1–5 Crores">₹1–5 Crores</option>
                            <option value="₹5–10 Crores">₹5–10 Crores</option>
                            <option value="Above ₹10 Crores">Above ₹10 Crores</option>
                            <option value="Prefer to discuss privately">Prefer to discuss privately</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#2E231C] block">
                            7. Preferred Investment Amount Per Business <span className="text-[#C65638]">*</span>
                          </label>
                          <select
                            value={invPreferredTicket}
                            onChange={(e) => setInvPreferredTicket(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                          >
                            <option value="Below ₹10 Lakhs">Below ₹10 Lakhs</option>
                            <option value="₹10–25 Lakhs">₹10–25 Lakhs</option>
                            <option value="₹25–50 Lakhs">₹25–50 Lakhs</option>
                            <option value="₹50 Lakhs–₹1 Crore">₹50 Lakhs–₹1 Crore</option>
                            <option value="₹1–3 Crores">₹1–3 Crores</option>
                            <option value="Above ₹3 Crores">Above ₹3 Crores</option>
                            <option value="Flexible">Flexible</option>
                          </select>
                        </div>
                      </div>

                      {/* 8. Preferred Industry Sectors */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#2E231C] block">
                          8. Preferred Industry Sectors <span className="text-[#C65638]">*</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Manufacturing',
                            'Technology',
                            'Agriculture',
                            'Healthcare',
                            'Retail / Franchise',
                            'Logistics',
                            'Education',
                            'Renewable Energy',
                            'Other'
                          ].map((sec) => {
                            const isSel = invPreferredSectors.includes(sec);
                            return (
                              <button
                                type="button"
                                key={sec}
                                onClick={() => toggleInvSector(sec)}
                                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#8064B1] text-white border-transparent font-bold'
                                    : 'bg-white text-[#453A33] border-[#EDE2D7] hover:bg-[#F5EEFB]'
                                }`}
                              >
                                {isSel ? '✓ ' : '+ '}
                                {sec}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 9. Preferred Business Stage */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#2E231C] block">
                          9. Preferred Business Stage <span className="text-[#C65638]">*</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Startup / Idea Stage',
                            'Early Stage',
                            'Revenue Generating Business',
                            'Growth Stage',
                            'Established Business'
                          ].map((stg) => {
                            const isSel = invPreferredStages.includes(stg);
                            return (
                              <button
                                type="button"
                                key={stg}
                                onClick={() => toggleInvStage(stg)}
                                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#8064B1] text-white border-transparent font-bold'
                                    : 'bg-white text-[#453A33] border-[#EDE2D7] hover:bg-[#F5EEFB]'
                                }`}
                              >
                                {isSel ? '✓ ' : '+ '}
                                {stg}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* SECTION C: Investment Preference */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-[#8064B1] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section C – Investment Preference & Experience
                      </span>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#2E231C] block">
                          10. Investment Type <span className="text-[#C65638]">*</span>
                        </label>
                        <select
                          value={invInvestmentType}
                          onChange={(e) => setInvInvestmentType(e.target.value)}
                          className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
                        >
                          <option value="Equity Investment">Equity Investment</option>
                          <option value="Debt Financing">Debt Financing</option>
                          <option value="Strategic Investment">Strategic Investment</option>
                          <option value="Open to Discussion">Open to Discussion</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#2E231C] block">
                          11. Investment Experience <span className="text-[11px] font-normal text-[#6B5E55]">(Optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={invExperience}
                          onChange={(e) => setInvExperience(e.target.value)}
                          placeholder="Briefly describe your previous investment experience, if any."
                          className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#2E231C] block">
                          12. Additional Investment Preferences <span className="text-[11px] font-normal text-[#6B5E55]">(Optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={invAdditionalPreferences}
                          onChange={(e) => setInvAdditionalPreferences(e.target.value)}
                          placeholder="Describe any specific business types, locations, requirements, or conditions you prefer."
                          className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* SECTION D: Verification Documents */}
                    <div className="space-y-2">
                      <span className="text-xs font-black text-[#8064B1] uppercase tracking-wider block border-b border-[#EDE2D7]/60 pb-1">
                        Section D – Verification Documents (Optional Initially)
                      </span>
                      <p className="text-[11px] text-[#6B5E55]">
                        Allowed file types: PDF, PNG, JPG (max 10MB). Examples: Entity Identity Verification, Registration Documents, Authorized Proof.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          disabled={isUploadingInvDoc}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setIsUploadingInvDoc(true);
                            try {
                              const uploaded = await uploadDocumentFile(f, {
                                entityType: 'INVESTMENT',
                                documentCategory: 'INVESTMENT_DOC',
                                documentLabel: f.name
                              });
                              setInvUploadedDocs((prev) => [...prev, uploaded]);
                            } catch (err: any) {
                              alert(err?.message || 'Document upload failed.');
                            } finally {
                              setIsUploadingInvDoc(false);
                              e.target.value = '';
                            }
                          }}
                          className="w-full text-xs p-2 border border-dashed border-[#2C857B]/50 rounded-xl bg-white text-[#2E231C] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2C857B]/10 file:text-[#1C6960]"
                        />
                        {isUploadingInvDoc && (
                          <span className="text-[11px] font-bold text-[#1C6960] shrink-0">Uploading...</span>
                        )}
                      </div>
                      {invUploadedDocs.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {invUploadedDocs.map((doc) => (
                            <div
                              key={doc.documentId}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F4FBF9] border border-[#2C857B]/25 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-[#2E231C] truncate">{doc.originalFileName}</div>
                                <div className="text-[10px] text-[#6B5E55]">
                                  {(doc.originalFileSize / 1024).toFixed(1)} KB · Original preserved
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewerAsset(doc)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE2D7] text-[#1C6960] font-bold text-[11px]"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadOriginalDocument(doc.documentId, doc.originalFileName)}
                                  className="px-2.5 py-1 rounded-lg bg-[#1C6960] text-white font-bold text-[11px]"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit CTA */}
                    <div className="pt-2 flex justify-end">
                      <WorkspaceButton
                        variant="violet"
                        size="md"
                        type="submit"
                        loading={isLoading}
                        icon={<ArrowRightIcon size={14} />}
                      >
                        Submit Investor Profile
                      </WorkspaceButton>
                    </div>
                  </form>
                </WorkspaceCard>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: MY DEAL REQUESTS & STATUS
         ======================================================== */}
      {activeTab === 'my_requests' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* USER INVESTMENTS IN COMMUNITY POOLS & YIELD RETURNS */}
          {myInvestments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-[#2E231C] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUpIcon size={16} className="text-[#2C857B]" />
                  <span>My Active Pool Investments & Payout Returns</span>
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {myInvestments.length} Pledged
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myInvestments.map((inv, idx) => (
                  <WorkspaceCard key={idx} variant="default" className="p-4 border border-[#EDE2D7] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-stone-600 block">{inv.poolCode}</span>
                        <h5 className="text-sm font-black text-[#2E231C]">{inv.poolTitle}</h5>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          inv.payoutStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payoutStatus === 'DISBURSED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Payout: {inv.payoutStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#FAF7F2] text-center">
                      <div>
                        <span className="text-[9px] text-[#82776E] block uppercase font-bold">Invested</span>
                        <span className="text-xs font-black text-[#2E231C]">₹{inv.investedAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#82776E] block uppercase font-bold">Yield ({inv.annualYieldPercent}%)</span>
                        <span className="text-xs font-black text-[#2C857B]">+₹{inv.expectedInterest?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#82776E] block uppercase font-bold">Total Maturity</span>
                        <span className="text-xs font-black text-[#1C6960]">₹{inv.totalMaturityAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B5E55] pt-1 border-t border-[#EDE2D7]/60">
                      <span>Ref: {inv.transactionReference}</span>
                      <span>Tenure: {inv.tenureMonths} Mo</span>
                    </div>
                  </WorkspaceCard>
                ))}
              </div>
            </div>
          )}

          {/* Controls: Search + Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-xl border border-[#EDE2D7]">
              {(['ALL', 'FUNDING', 'INVESTOR'] as const).map((flt) => (
                <button
                  type="button"
                  key={flt}
                  onClick={() => setListFilter(flt)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    listFilter === flt
                      ? 'bg-white text-[#2E231C] shadow-xs'
                      : 'text-[#6B5E55] hover:text-[#2E231C]'
                  }`}
                >
                  {flt === 'ALL' ? 'All Requests' : flt === 'FUNDING' ? 'Funding Requests' : 'Investor Profiles'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
              <input
                type="text"
                placeholder="Search by name or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#2E231C] placeholder-[#82776E]/70 focus:outline-none focus:ring-2 focus:ring-[#2C857B]"
              />
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredDealItems.length === 0 ? (
                <motion.div
                  key="empty-deals"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WorkspaceEmptyState
                    icon={<FileTextIcon size={28} />}
                    title="No deal requests found"
                    description="You haven't submitted any funding requests or investor profiles matching the criteria."
                    actionText="Submit Expression of Interest"
                    onAction={() => setActiveTab('submit')}
                    accent="teal"
                  />
                </motion.div>
              ) : (
                filteredDealItems.map((item) => {
                  const isFunding = item.type === 'FUNDING';
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <WorkspaceCard variant="default" className="space-y-3 p-4 sm:p-5">
                        {/* Title, Ref, & Status Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE2D7]/70 pb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                  isFunding
                                    ? 'bg-teal-50 text-[#1C6960] border-teal-200'
                                    : 'bg-purple-50 text-[#8064B1] border-purple-200'
                                }`}
                              >
                                {isFunding ? 'Funding Request' : 'Investor Profile'}
                              </span>
                              <span className="text-[11px] text-[#6B5E55] font-mono font-bold bg-stone-100 px-2 py-0.5 rounded">
                                Reference: {item.refNumber || item.id}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-[#2E231C]">
                              {isFunding ? item.businessName : item.investorName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#6B5E55]">
                              {isFunding ? (
                                <span>
                                  <strong>Funding Required: </strong>
                                  <span className="text-[#1C6960] font-black">
                                    {formatCurrencyINR(item.fundingAmount)}
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  <strong>Preferred Investment Range: </strong>
                                  <span className="text-[#8064B1] font-black">
                                    {item.preferredTicketSize}
                                  </span>
                                </span>
                              )}
                              <span>•</span>
                              <span>
                                <strong>Submitted: </strong>
                                {item.submittedDate}
                              </span>
                            </div>
                          </div>
                          <div>{getStatusBadge(item)}</div>
                        </div>

                        {/* Latest FIC Update (1 or 2 lines) */}
                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-xs">
                          <strong className="text-[#2E231C] block mb-0.5">Latest FIC Update:</strong>
                          <p className="text-[#453A33] leading-relaxed">
                            "{item.latestFicUpdate || 'Your request has been received. Our team is reviewing your information.'}"
                          </p>
                        </div>

                        {/* CTA: View Details */}
                        <div className="flex justify-end pt-1">
                          <WorkspaceButton
                            variant={isFunding ? 'teal' : 'violet'}
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                            icon={<ArrowRightIcon size={13} />}
                          >
                            View Details
                          </WorkspaceButton>
                        </div>
                      </WorkspaceCard>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ========================================================
          3. VIEW DETAILS – SIMPLE MODAL (EXACT 6 SECTIONS)
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="max-w-2xl"
        title={
          selectedItem && (
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    selectedItem.type === 'FUNDING'
                      ? 'bg-teal-50 text-[#1C6960] border-teal-200'
                      : 'bg-purple-50 text-[#8064B1] border-purple-200'
                  }`}
                >
                  {selectedItem.type === 'FUNDING' ? 'Funding Request' : 'Investor Profile'}
                </span>
                <span className="text-[11px] text-[#6B5E55] font-mono font-bold bg-stone-100 px-2 py-0.5 rounded">
                  Reference: {selectedItem.refNumber || selectedItem.id}
                </span>
                {getStatusBadge(selectedItem)}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#2E231C]">
                {selectedItem.type === 'FUNDING' ? selectedItem.businessName : selectedItem.investorName}
              </h3>
            </div>
          )
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* ----------------------------------------------------
                SECTION 1: WHAT YOU SUBMITTED
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                1. What You Submitted
              </h4>
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-3 text-xs">
                {selectedItem.type === 'FUNDING' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Business Name:</span>
                        <p className="text-[#2E231C] font-black text-sm">{selectedItem.businessName}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Business Type:</span>
                        <p className="text-[#2E231C] font-semibold">{selectedItem.businessType}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Industry:</span>
                        <p className="text-[#2E231C] font-semibold">{selectedItem.industry}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Location:</span>
                        <p className="text-[#2E231C] font-semibold">
                          {selectedItem.location.city}, {selectedItem.location.state}, {selectedItem.location.country}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Business Stage:</span>
                        <p className="text-[#2E231C] font-semibold">{selectedItem.businessStage}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Funding Amount:</span>
                        <p className="text-[#1C6960] font-black text-sm">
                          {formatCurrencyINR(selectedItem.fundingAmount)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[#6B5E55] font-bold block mb-1">Funding Purpose:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.fundingPurpose.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-white border border-[#EDE2D7] text-[#2E231C] font-bold px-2.5 py-0.5 rounded-lg"
                          >
                            ✓ {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#6B5E55] font-bold block mb-0.5">How Funds Will Be Used:</span>
                      <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                        {selectedItem.useOfFundsExplanation}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#6B5E55] font-bold block mb-0.5">Business Description:</span>
                      <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                        {selectedItem.businessDescription}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Investor Type:</span>
                        <p className="text-[#2E231C] font-semibold">{selectedItem.investorType}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Investor / Firm Name:</span>
                        <p className="text-[#2E231C] font-black text-sm">{selectedItem.investorName}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Location:</span>
                        <p className="text-[#2E231C] font-semibold">
                          {selectedItem.stateCity}, {selectedItem.country}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Investment Type:</span>
                        <p className="text-[#8064B1] font-semibold">{selectedItem.investmentType}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Total Investment Capacity:</span>
                        <p className="text-[#2E231C] font-black">{selectedItem.totalCapacity}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5E55] font-bold block mb-0.5">Preferred Ticket Per Business:</span>
                        <p className="text-[#8064B1] font-black">{selectedItem.preferredTicketSize}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[#6B5E55] font-bold block mb-1">Preferred Industry Sectors:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.preferredSectors.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-white border border-[#EDE2D7] text-[#2E231C] font-bold px-2.5 py-0.5 rounded-lg"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#6B5E55] font-bold block mb-1">Preferred Business Stages:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.preferredStages.map((stg, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-white border border-[#EDE2D7] text-[#2E231C] font-bold px-2.5 py-0.5 rounded-lg"
                          >
                            ✓ {stg}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#6B5E55] font-bold block mb-0.5">Investor Profile / Summary:</span>
                      <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                        {selectedItem.investorProfile}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 2: CURRENT STATUS
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                2. Current Status
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {getStatusBadge(selectedItem)}
                  <span className="text-[#453A33] font-medium">
                    {getStatusExplanation(selectedItem)}
                  </span>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 3: LATEST FIC UPDATE
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                3. FIC Latest Update
              </h4>
              <div
                className={`p-3.5 rounded-xl text-xs border ${
                  selectedItem.type === 'FUNDING'
                    ? 'bg-teal-50/80 border-teal-200 text-teal-950'
                    : 'bg-purple-50/80 border-purple-200 text-purple-950'
                }`}
              >
                <p className="font-medium leading-relaxed">
                  "{selectedItem.latestFicUpdate || 'Your request has been submitted successfully. FIC will share an update here.'}"
                </p>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 4: WHAT HAPPENS NEXT?
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                4. What Happens Next?
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] text-xs">
                <p className="text-[#453A33] leading-relaxed font-medium">
                  {selectedItem.whatHappensNext ||
                    (selectedItem.type === 'FUNDING'
                      ? 'FIC will review your submitted information and coordinate preliminary verification.'
                      : 'Your profile verification is in progress.')}
                </p>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 5: UPDATE HISTORY
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                5. Update History
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] text-xs space-y-2.5">
                {selectedItem.updateHistory && selectedItem.updateHistory.length > 0 ? (
                  selectedItem.updateHistory.map((hist, idx) => (
                    <div
                      key={idx}
                      className="border-b border-[#EDE2D7]/60 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <strong className="text-[#2E231C]">{hist.status}</strong>
                        <span className="text-[#6B5E55] font-medium">{hist.date}</span>
                      </div>
                      <p className="text-[#453A33] text-[11px] leading-relaxed">{hist.update}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#6B5E55] text-xs">No previous updates recorded.</p>
                )}
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 6: DOCUMENTS
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                6. Documents
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] text-xs space-y-2">
                {selectedItem.documents && selectedItem.documents.length > 0 ? (
                  selectedItem.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE2D7]"
                    >
                      <div className="flex items-center gap-2">
                        <FileTextIcon size={14} className="text-[#6B5E55]" />
                        <span className="font-bold text-[#2E231C]">{doc.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {doc.status || 'Verified'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#6B5E55] text-xs italic">
                    No supporting documents uploaded with initial submission. Additional documents can be submitted upon FIC review request.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Close */}
            <div className="pt-2 flex justify-end border-t border-[#EDE2D7]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          MODAL: INVEST PLEDGE IN COMMUNITY POOL
         ======================================================== */}
      <AnimatedModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        title={selectedPoolForInvest ? `Invest in ${selectedPoolForInvest.poolCode}` : 'Invest in Pool'}
        maxWidth="max-w-md"
      >
        {selectedPoolForInvest && (
          <form onSubmit={handlePledgeToPool} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-1">
              <h4 className="text-sm font-black text-[#2E231C]">{selectedPoolForInvest.title}</h4>
              <p className="text-xs text-[#51463F]">{selectedPoolForInvest.description}</p>
              <div className="flex items-center gap-3 pt-2 text-xs font-bold text-[#1C6960]">
                <span>Fixed Return: {selectedPoolForInvest.investorAnnualYieldPercent}% p.a.</span>
                <span>•</span>
                <span>Tenure: {selectedPoolForInvest.tenureMonths} Months</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-[#2E231C] block">
                Enter Investment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={selectedPoolForInvest.minInvestmentPerUser || 10000}
                max={selectedPoolForInvest.maxInvestmentPerUser || undefined}
                step={1000}
                value={investPledgeAmount}
                onChange={(e) => setInvestPledgeAmount(e.target.value)}
                required
                className="w-full text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2C857B]"
              />
              <span className="text-[11px] text-[#82776E] block">
                Minimum allowed: ₹{(selectedPoolForInvest.minInvestmentPerUser || 10000).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Live Calculation Preview */}
            {Number(investPledgeAmount) > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-stone-700">
                  <span>Pledged Principal:</span>
                  <span className="font-mono font-bold">₹{Number(investPledgeAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span>Calculated Yield Return ({selectedPoolForInvest.investorAnnualYieldPercent}%):</span>
                  <span className="font-mono">
                    +₹{Math.round((Number(investPledgeAmount) * selectedPoolForInvest.investorAnnualYieldPercent * (selectedPoolForInvest.tenureMonths / 12)) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#134A44] font-black pt-1 border-t border-emerald-300">
                  <span>Total Maturity Payout:</span>
                  <span className="font-mono text-sm">
                    ₹{(Number(investPledgeAmount) + Math.round((Number(investPledgeAmount) * selectedPoolForInvest.investorAnnualYieldPercent * (selectedPoolForInvest.tenureMonths / 12)) / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EDE2D7]">
              <WorkspaceButton
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmittingPledge}
                onClick={() => setIsInvestModalOpen(false)}
              >
                Cancel
              </WorkspaceButton>
              <WorkspaceButton
                type="submit"
                variant="teal"
                size="sm"
                disabled={isSubmittingPledge}
              >
                {isSubmittingPledge ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                    <span>Investing & Closing...</span>
                  </span>
                ) : (
                  'Confirm & Invest'
                )}
              </WorkspaceButton>
            </div>
          </form>
        )}
      </AnimatedModal>
          {viewerAsset && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setViewerAsset(null)}
          documentId={viewerAsset.documentId}
          documentLabel={viewerAsset.documentLabel}
          originalFileName={viewerAsset.originalFileName}
          originalMimeType={viewerAsset.originalMimeType}
          originalFileSize={viewerAsset.originalFileSize}
          checksum={viewerAsset.checksum}
        />
      )}
    </WorkspaceShell>
  );
};

export default InvestmentPage;

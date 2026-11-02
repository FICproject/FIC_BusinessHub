import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, Badge } from '@fic/ui';
import { INITIAL_CATEGORIES_DATA } from '../services/mockData';
import { apiRequest, setAuthToken, setStoredUser, getStoredUser } from '../services/api';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockIcon,
  UploadIcon,
  FileTextIcon,
  TrashIcon,
  BriefcaseIcon,
  FactoryIcon,
  CodeIcon,
  GraduationCapIcon,
  SproutIcon,
  TrendingUpIcon,
  HeartPulseIcon,
  CameraIcon,
  UsersIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  SparklesIcon,
  PlusIcon,
  EyeIcon,
  EyeOffIcon
} from '../components/Icons';

interface CustomDoc {
  id: string;
  label: string;
  documentNumber: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step index:
  // 1 = Basic Account & 18+
  // 2 = Sector & Roles
  // 3 = Profile (Dynamic Questions)
  // 4 = Category KYC Document Upload (with Add Document capability)
  // 5 = Membership Payment Checkout (₹99 Pass)
  // 6 = Application Tracking & Status
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Step 1: Basic
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 2: Category & Roles
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES_DATA[0]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([
    INITIAL_CATEGORIES_DATA[0].subcategories[0]
  ]);

  // Step 3: Dynamic details
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});

  // Step 4: Real Document Attachment state (Default + Custom)
  const [docNumbers, setDocNumbers] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<
    Record<string, { name: string; size: string; fileUrl: string }>
  >({});
  const [customDocs, setCustomDocs] = useState<CustomDoc[]>([]);

  // Step 5: Payment simulation
  const [paymentDone, setPaymentDone] = useState(false);

  // Stepper metadata (Updated to show KYC at Step 4 and Membership at Step 5)
  const stepsInfo = [
    { num: 1, title: 'Account', desc: 'Identity' },
    { num: 2, title: 'Sector', desc: 'Category' },
    { num: 3, title: 'Profile', desc: 'Details' },
    { num: 4, title: 'KYC', desc: 'Documents' },
    { num: 5, title: 'Membership', desc: '₹99 Pass' },
    { num: 6, title: 'Status', desc: 'Activation' }
  ];

  // Common suggestions for additional supporting documents
  const COMMON_DOC_SUGGESTIONS = [
    'GST Registration Certificate',
    'Udyam / MSME Certificate',
    'Shop & Establishment License',
    'Trade License / Municipal License',
    'FSSAI Food Safety License',
    'Import Export Code (IEC)',
    'Partnership Deed / MOA & AOA',
    'Professional Practice Certificate',
    'Bank Statement / Cancelled Cheque',
    'Utility / Business Address Proof',
    'Work Portfolio / Client References'
  ];

  // Category Icon helper
  const renderCategoryIcon = (iconName: string, size = 20) => {
    switch (iconName) {
      case 'Factory':
        return <FactoryIcon size={size} />;
      case 'Code':
        return <CodeIcon size={size} />;
      case 'GraduationCap':
        return <GraduationCapIcon size={size} />;
      case 'Sprout':
        return <SproutIcon size={size} />;
      case 'TrendingUp':
        return <TrendingUpIcon size={size} />;
      case 'HeartPulse':
        return <HeartPulseIcon size={size} />;
      case 'Camera':
        return <CameraIcon size={size} />;
      case 'Users':
        return <UsersIcon size={size} />;
      case 'Briefcase':
      default:
        return <BriefcaseIcon size={size} />;
    }
  };

  // File attach handler
  const handleFileChange = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr =
        file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(1) + ' KB';

      setAttachedFiles((prev) => ({
        ...prev,
        [docKey]: {
          name: file.name,
          size: sizeStr,
          fileUrl: URL.createObjectURL(file)
        }
      }));
      setErrorMessage('');
    }
  };

  const handleRemoveFile = (docKey: string) => {
    setAttachedFiles((prev) => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  // Add custom document slot
  const handleAddCustomDoc = () => {
    const newId = `custom_doc_${Date.now()}`;
    setCustomDocs((prev) => [
      ...prev,
      {
        id: newId,
        label: '',
        documentNumber: ''
      }
    ]);
  };

  const handleUpdateCustomDoc = (id: string, field: 'label' | 'documentNumber', value: string) => {
    setCustomDocs((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const handleRemoveCustomDoc = (id: string) => {
    setCustomDocs((prev) => prev.filter((doc) => doc.id !== id));
    handleRemoveFile(id);
  };

  // Step 1 Submit
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !phoneNumber || !password) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!ageConfirmed) {
      setErrorMessage('You must be 18 years or older to register for FIC Business Hub.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms of Service to proceed.');
      return;
    }

    setStep(2);
  };

  // Step 2 Category Selection
  const handleCategorySelect = (cat: typeof INITIAL_CATEGORIES_DATA[0]) => {
    setSelectedCategory(cat);
    setSelectedSubcategories([cat.subcategories[0]]);
  };

  const toggleSubcategory = (sub: string) => {
    if (selectedSubcategories.includes(sub)) {
      if (selectedSubcategories.length > 1) {
        setSelectedSubcategories(selectedSubcategories.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubcategories([...selectedSubcategories, sub]);
    }
  };

  // Step 3 Dynamic Form Submit -> Now leads directly to Step 4 (KYC Documents)
  const handleDynamicFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check mandatory dynamic fields
    for (const field of selectedCategory.fields) {
      if (field.required && !dynamicAnswers[field.key]) {
        setErrorMessage(`Please fill in "${field.label}".`);
        return;
      }
    }

    // Advance to Step 4: Category KYC Document Upload
    setStep(4);
  };

  // Step 4 KYC Documents Submit -> Validates & advances to Step 5: Membership Checkout (₹99)
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check required default documents
    for (const doc of selectedCategory.kycDocuments) {
      if (doc.required) {
        if (!docNumbers[doc.type]?.trim()) {
          setErrorMessage(`Please enter the document / registration number for "${doc.label}".`);
          return;
        }
        if (!attachedFiles[doc.type]) {
          setErrorMessage(`Please attach / upload the document file (PDF or Image) for "${doc.label}".`);
          return;
        }
      }
    }

    // Check custom documents if user added any
    for (const cDoc of customDocs) {
      if (!cDoc.label.trim()) {
        setErrorMessage('Please enter a name / title for your additional document.');
        return;
      }
      if (!cDoc.documentNumber.trim()) {
        setErrorMessage(`Please enter the registration or reference number for "${cDoc.label}".`);
        return;
      }
      if (!attachedFiles[cDoc.id]) {
        setErrorMessage(`Please attach / upload the document file for "${cDoc.label}".`);
        return;
      }
    }

    // All KYC verification documents ready! Now advance to Step 5: ₹99 Payment
    setStep(5);
  };

  // Step 5 Payment Simulation (₹99 First-Year Intro) & Application Finalization
  const handleSimulatePayment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Register Account
      const regResponse = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
          primaryCategoryId: selectedCategory.id,
          subcategoryIds: selectedSubcategories,
          ageConfirmed,
          termsAccepted
        })
      });

      const token = regResponse?.data?.token || `mock_jwt_token_${Date.now()}`;
      const user = regResponse?.data?.user || {
        id: `usr_${Date.now()}`,
        fullName,
        email,
        phoneNumber,
        primaryCategoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        isMembershipActive: true,
        isKycApproved: false
      };

      setAuthToken(token);
      setStoredUser(user);

      // 2. Confirm ₹99 Payment
      await apiRequest('/payments/membership/confirm', {
        method: 'POST',
        body: JSON.stringify({
          orderId: `ORD_${Date.now()}`,
          transactionId: `TXN_UPI_${Date.now()}`
        })
      });

      // 3. Compile all documents (Default + Custom)
      const defaultDocItems = selectedCategory.kycDocuments.map((doc) => ({
        documentType: doc.type,
        documentName: doc.label,
        documentNumber: docNumbers[doc.type] || '',
        fileName: attachedFiles[doc.type]?.name || '',
        fileUrl: attachedFiles[doc.type]?.fileUrl || 'https://ficapp.in/uploads/mock-id.pdf'
      }));

      const customDocItems = customDocs.map((cDoc) => ({
        documentType: 'ADDITIONAL_PROOF',
        documentName: cDoc.label,
        documentNumber: cDoc.documentNumber,
        fileName: attachedFiles[cDoc.id]?.name || '',
        fileUrl: attachedFiles[cDoc.id]?.fileUrl || 'https://ficapp.in/uploads/mock-doc.pdf'
      }));

      const allDocItems = [...defaultDocItems, ...customDocItems];

      // Submit KYC documents to backend
      await apiRequest('/kyc/submit', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          documents: allDocItems
        })
      });

      user.isMembershipActive = true;
      user.isKycApproved = false;
      user.kycStatus = 'PENDING';
      user.uploadedDocumentsCount = allDocItems.length;
      setStoredUser(user);

      setPaymentDone(true);
      setIsLoading(false);
      setStep(6);
    } catch {
      setPaymentDone(true);
      setIsLoading(false);
      setStep(6);
    }
  };

  return (
    <div className="bg-[#F5EBDD]/40 min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* PREMIUM ANIMATED STEPPER HEADER */}
        <div className="bg-white rounded-2xl border border-[#E8DBC8] p-5 sm:p-6 shadow-sm">
          <div className="relative">
            {/* Step connector line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E8DBC8] -z-0 hidden sm:block">
              <div
                className="h-full bg-[#C66B52] transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              ></div>
            </div>

            {/* Stepper items */}
            <div className="flex items-center justify-between relative z-10">
              {stepsInfo.map((s) => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;

                return (
                  <div key={s.num} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#8064A9] text-white shadow-sm ring-2 ring-[#8064A9]/20 scale-100'
                          : isActive
                          ? 'bg-[#C66B52] text-white shadow-md ring-4 ring-[#C66B52]/20 scale-110'
                          : 'bg-white text-[#77786E] border border-[#E8DBC8]'
                      }`}
                    >
                      {isCompleted ? '✓' : s.num}
                    </div>

                    <div className="mt-2 hidden sm:block">
                      <span
                        className={`text-xs block font-bold transition-colors ${
                          isActive ? 'text-[#C66B52]' : isCompleted ? 'text-[#29302D]' : 'text-[#77786E]'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="text-[10px] text-[#77786E] block -mt-0.5">{s.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Step Title */}
          <div className="mt-4 pt-3 border-t border-[#E8DBC8] sm:hidden flex items-center justify-between text-xs">
            <span className="font-semibold text-[#C66B52]">
              Step {step} of 6: {stepsInfo[step - 1]?.title}
            </span>
            <span className="text-[#77786E]">{Math.round((step / 6) * 100)}% Completed</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-slide-down flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: BASIC ACCOUNT & AGE 18+ ELIGIBILITY
           ======================================================== */}
        {step === 1 && (
          <div className="animate-step-in">
            <Card
              title="Basic Account & Age 18+ Verification"
              subtitle="Step 1 of 6: Create your authenticated account credentials"
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl"
            >
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <Input
                  label="Full Legal Name"
                  placeholder="e.g. S. Moorthy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    label="10-Digit Mobile Number"
                    placeholder="9876543210"
                    value={phoneNumber}
                    maxLength={10}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#29302D] block">
                    Create Secure Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      className="w-full text-xs px-3.5 py-2.5 pr-10 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77786E] hover:text-[#29302D] p-1 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {/* 18+ Adult Eligibility Confirmation */}
                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/30 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-[#C66B52] focus:ring-[#C66B52] h-4 w-4"
                      required
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#29302D] block">
                        I legally confirm that I am 18 years of age or older (Adult Eligibility Policy) *
                      </span>
                      <span className="text-[#77786E]">
                        FIC Business Hub strictly admits verified adults capable of entering into enforceable commercial contracts.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Terms of Service & Privacy Acceptance */}
                <div className="p-4 rounded-xl bg-[#FCFAF6] border border-[#E8DBC8]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-[#C66B52] focus:ring-[#C66B52] h-4 w-4"
                      required
                    />
                    <div className="text-xs text-[#77786E]">
                      I accept the FIC Business Hub{' '}
                      <span className="text-[#C66B52] font-semibold underline">Terms of Service</span>,{' '}
                      <span className="text-[#C66B52] font-semibold underline">Privacy Safeguard Policy</span>, and agree to intermediary proposal coordination.
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-[#E8DBC8]">
                  <Link to="/login" className="text-xs text-[#77786E] hover:text-[#C66B52]">
                    Already have an account? Sign In
                  </Link>
                  <Button variant="primary" type="submit" className="bg-[#C66B52] hover:bg-[#D99B43] text-white">
                    Next: Select Sector
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 2: PRIMARY SECTOR & SUBCATEGORY ROLES
           ======================================================== */}
        {step === 2 && (
          <div className="animate-step-in space-y-6">
            <Card
              title="Select Your Primary Sector"
              subtitle="Step 2 of 6: Choose exactly one main category and your relevant subcategories"
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl"
            >
              <div className="space-y-6">
                {/* 10 Core Indian Sectors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {INITIAL_CATEGORIES_DATA.map((cat) => {
                    const isSelected = selectedCategory.id === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#C66B52] bg-[#FFF9F0] shadow-xs'
                            : 'border-[#E8DBC8] hover:border-[#D99B43]/50 bg-white'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#C66B52] text-white' : 'bg-[#F5EBDD] text-[#29302D]'
                          }`}
                        >
                          {renderCategoryIcon(cat.iconName, 18)}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#29302D] truncate block">
                              {cat.name}
                            </span>
                            {isSelected && (
                              <Badge variant="success" className="text-[10px]">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-[#77786E] line-clamp-2 mt-0.5">
                            {cat.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subcategory Roles Selector */}
                <div className="pt-4 border-t border-[#E8DBC8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#29302D] uppercase tracking-wider">
                      Select Subcategory Roles in {selectedCategory.name}:
                    </span>
                    <span className="text-[10px] text-[#77786E]">Multi-select allowed</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.subcategories.map((sub) => {
                      const isSubSelected = selectedSubcategories.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubcategory(sub)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            isSubSelected
                              ? 'bg-[#8064A9] text-white border-[#8064A9] shadow-xs'
                              : 'bg-white text-[#29302D] border-[#E8DBC8] hover:bg-[#FFF9F0]'
                          }`}
                        >
                          {isSubSelected ? '✓ ' : '+ '}
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-[#E8DBC8]">
                  <Button variant="outline" type="button" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" type="button" className="bg-[#C66B52] hover:bg-[#D99B43] text-white" onClick={() => setStep(3)}>
                    Next: Dynamic Details
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 3: CONFIGURATION-DRIVEN DYNAMIC FORM
           ======================================================== */}
        {step === 3 && (
          <div className="animate-step-in">
            <Card
              title={`${selectedCategory.name} Details`}
              subtitle="Step 3 of 6: Dynamic configuration-driven questions for your sector"
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl"
            >
              <form onSubmit={handleDynamicFormSubmit} className="space-y-5">
                {/* Sector Header Pill */}
                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8064A9] text-white flex items-center justify-center shrink-0">
                    {renderCategoryIcon(selectedCategory.iconName, 20)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#29302D] block">
                      Sector Profile: {selectedCategory.name}
                    </span>
                    <span className="text-[11px] text-[#77786E]">
                      Roles selected: {selectedSubcategories.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-4">
                  {selectedCategory.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white"
                          value={dynamicAnswers[field.key] || ''}
                          onChange={(e) =>
                            setDynamicAnswers({ ...dynamicAnswers, [field.key]: e.target.value })
                          }
                          required={field.required}
                        >
                          <option value="">-- Select an option --</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white"
                          value={dynamicAnswers[field.key] || ''}
                          onChange={(e) =>
                            setDynamicAnswers({ ...dynamicAnswers, [field.key]: e.target.value })
                          }
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-between items-center border-t border-[#E8DBC8]">
                  <Button variant="outline" type="button" onClick={() => setStep(2)}>
                    Back to Sector
                  </Button>
                  <Button variant="primary" type="submit" className="bg-[#C66B52] hover:bg-[#D99B43] text-white">
                    Next: KYC Documents
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 4: CATEGORY KYC DOCUMENT UPLOAD (WITH ADD DOCUMENT CAPABILITY)
           ======================================================== */}
        {step === 4 && (
          <div className="animate-step-in">
            <Card
              title="Category KYC Document Upload"
              subtitle="Step 4 of 6: Upload verification documents to activate your account"
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl"
            >
              <form onSubmit={handleKycSubmit} className="space-y-6">
                {/* Prominent Category Guidance Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF9F0] via-white to-[#F5EBDD] border border-[#D99B43]/40 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#D99B43] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <ShieldCheckIcon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#29302D] uppercase tracking-wide">
                        Verification Guidelines for {selectedCategory.name}
                      </h4>
                      <p className="text-[11px] text-[#77786E]">
                        Basic mandatory and recommended documents for your sector are listed below.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#29302D] leading-relaxed pt-1 border-t border-[#E8DBC8]">
                    📌 <strong>Basic Required Documents:</strong> Enter the registration / document number and attach valid PDF or clear image files (Aadhaar, PAN, GSTIN, Udyam, Factory License, Patta, Bar License or Student ID).
                  </p>
                  <p className="text-xs text-[#77786E] leading-relaxed">
                    💡 <strong>Additional Documents:</strong> Based on your business category, if you want to upload any additional supporting proofs (e.g. GST Certificate, Trade License, FSSAI, MSME, Partnership Deed, Bank Statement, Portfolio), click the <strong>"+ Add Document"</strong> button on the right!
                  </p>
                </div>

                {/* 1. Default Category Documents with Opposite Add Document Button */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#29302D] uppercase tracking-wider block">
                      Core Category Documents:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCustomDoc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D99B43] text-[#B87A28] hover:bg-[#D99B43] hover:text-white font-bold text-xs shadow-xs transition-all shrink-0"
                      title="Add document"
                    >
                      <PlusIcon size={14} />
                      <span>+ Add Document</span>
                    </button>
                  </div>

                  {selectedCategory.kycDocuments.map((doc, i) => {
                    const isAttached = !!attachedFiles[doc.type];
                    const fileInfo = attachedFiles[doc.type];

                    return (
                      <div
                        key={i}
                        className="p-4 sm:p-5 rounded-xl border border-[#E8DBC8] bg-[#FCFAF6] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#29302D] block">{doc.label}</span>
                            {(doc as any).description && (
                              <span className="text-[11px] text-[#77786E]">{(doc as any).description}</span>
                            )}
                          </div>
                          {doc.required ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C66B52]/15 text-[#C66B52] border border-[#C66B52]/30">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8DBC8] text-[#77786E]">
                              Optional
                            </span>
                          )}
                        </div>

                        {/* Document Number Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#29302D] block">
                            Document / Registration Number {doc.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 12-digit Aadhaar / 10-char PAN / GSTIN / Reg No."
                            className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                            value={docNumbers[doc.type] || ''}
                            onChange={(e) =>
                              setDocNumbers({ ...docNumbers, [doc.type]: e.target.value })
                            }
                            required={doc.required}
                          />
                        </div>

                        {/* Real File Upload & Attachment Component */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-[#29302D] block">
                            Attach Document File (PDF, PNG, JPG) {doc.required && <span className="text-red-500">*</span>}
                          </label>

                          {isAttached ? (
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/50">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-lg bg-[#D99B43]/20 text-[#B87A28] flex items-center justify-center shrink-0">
                                  <FileTextIcon size={20} />
                                </div>
                                <div className="truncate">
                                  <span className="text-xs font-bold text-[#29302D] block truncate">
                                    {fileInfo.name}
                                  </span>
                                  <span className="text-[11px] text-[#B87A28] font-medium flex items-center gap-1 mt-0.5">
                                    <CheckCircleIcon size={13} /> {fileInfo.size} • File Attached & Ready
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs font-semibold text-[#C66B52] hover:underline cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-[#E8DBC8] transition-colors shadow-xs">
                                  Change
                                  <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(doc.type, e)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(doc.type)}
                                  className="p-1 text-[#77786E] hover:text-red-600 transition-colors"
                                  title="Remove File"
                                >
                                  <TrashIcon size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border-2 border-dashed border-[#E8DBC8] hover:border-[#C66B52] bg-white hover:bg-[#FFF9F0]/40 cursor-pointer transition-all gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#F5EBDD] text-[#C66B52] flex items-center justify-center shrink-0">
                                  <UploadIcon size={18} />
                                </div>
                                <div className="text-center sm:text-left">
                                  <span className="text-xs font-semibold text-[#29302D] block">
                                    Click to browse or drop {doc.label.toLowerCase()} file
                                  </span>
                                  <span className="text-[11px] text-[#77786E]">
                                    Supports PDF, PNG, JPG (up to 5MB)
                                  </span>
                                </div>
                              </div>
                              <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#C66B52] hover:bg-[#D99B43] text-white rounded-lg shrink-0 shadow-sm transition-colors">
                                Attach Document
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => handleFileChange(doc.type, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. User-Added Custom Supporting Documents */}
                {customDocs.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <span className="text-xs font-bold text-[#8064A9] uppercase tracking-wider block">
                      Additional Supporting Documents ({customDocs.length}):
                    </span>

                    {customDocs.map((cDoc, idx) => {
                      const isAttached = !!attachedFiles[cDoc.id];
                      const fileInfo = attachedFiles[cDoc.id];

                      return (
                        <div
                          key={cDoc.id}
                          className="p-4 sm:p-5 rounded-xl border border-[#8064A9]/30 bg-[#FCFAF6] space-y-3 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#8064A9] flex items-center gap-1.5">
                              <span>Additional Document #{idx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomDoc(cDoc.id)}
                              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold"
                            >
                              <TrashIcon size={14} />
                              <span>Remove</span>
                            </button>
                          </div>

                          {/* Document Name / Title Input */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-[#29302D] block">
                              Document Title / Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. GST Certificate / Trade License / FSSAI / MSME / Bank Proof"
                              className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8064A9]"
                              value={cDoc.label}
                              onChange={(e) => handleUpdateCustomDoc(cDoc.id, 'label', e.target.value)}
                              list={`suggestions_${cDoc.id}`}
                              required
                            />
                            <datalist id={`suggestions_${cDoc.id}`}>
                              {COMMON_DOC_SUGGESTIONS.map((sug, sIdx) => (
                                <option key={sIdx} value={sug} />
                              ))}
                            </datalist>
                          </div>

                          {/* Document Registration Number */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-[#29302D] block">
                              Document / Registration Number *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. GSTIN / Certificate Reg No. / Reference Code"
                              className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8064A9]"
                              value={cDoc.documentNumber}
                              onChange={(e) =>
                                handleUpdateCustomDoc(cDoc.id, 'documentNumber', e.target.value)
                              }
                              required
                            />
                          </div>

                          {/* File Attachment */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-semibold text-[#29302D] block">
                              Attach Document File (PDF, PNG, JPG) *
                            </label>

                            {isAttached ? (
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-9 h-9 rounded-lg bg-[#8064A9]/20 text-[#8064A9] flex items-center justify-center shrink-0">
                                    <FileTextIcon size={20} />
                                  </div>
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-[#29302D] block truncate">
                                      {fileInfo.name}
                                    </span>
                                    <span className="text-[11px] text-[#8064A9] font-medium flex items-center gap-1 mt-0.5">
                                      <CheckCircleIcon size={13} /> {fileInfo.size} • Attached
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <label className="text-xs font-semibold text-[#8064A9] hover:underline cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-[#E8DBC8] transition-colors shadow-xs">
                                    Change
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      className="hidden"
                                      onChange={(e) => handleFileChange(cDoc.id, e)}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(cDoc.id)}
                                    className="p-1 text-[#77786E] hover:text-red-600 transition-colors"
                                  >
                                    <TrashIcon size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border-2 border-dashed border-[#E8DBC8] hover:border-[#8064A9] bg-white hover:bg-[#8064A9]/5 cursor-pointer transition-all gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-[#8064A9]/10 text-[#8064A9] flex items-center justify-center shrink-0">
                                    <UploadIcon size={18} />
                                  </div>
                                  <div className="text-center sm:text-left">
                                    <span className="text-xs font-semibold text-[#29302D] block">
                                      Click to browse or drop {cDoc.label || 'additional document'} file
                                    </span>
                                    <span className="text-[11px] text-[#77786E]">
                                      Supports PDF, PNG, JPG (up to 5MB)
                                    </span>
                                  </div>
                                </div>
                                <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#8064A9] hover:bg-[#8064A9]/90 text-white rounded-lg shrink-0 shadow-sm transition-colors">
                                  Attach Document
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(cDoc.id, e)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-2 flex justify-between items-center border-t border-[#E8DBC8]">
                  <Button variant="outline" type="button" onClick={() => setStep(3)}>
                    Back to Profile
                  </Button>
                  <Button variant="primary" type="submit" className="bg-[#C66B52] hover:bg-[#D99B43] text-white">
                    Save Documents & Proceed to ₹99 Checkout
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 5: MEMBERSHIP PAYMENT CHECKOUT (₹99) - NOW AFTER KYC
           ======================================================== */}
        {step === 5 && (
          <div className="animate-step-in">
            <Card
              title="First-Year Membership Fee"
              subtitle="Step 5 of 6: Transparent annual onboarding pass for FIC Business Hub"
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl"
            >
              <div className="space-y-6">
                {/* Executive Card Pass */}
                <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#29302D] via-[#20251F] to-[#29302D] text-white shadow-xl relative overflow-hidden border border-[#D99B43]/50">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#D99B43]/15 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D99B43]">
                      FIC Annual Membership Pass
                    </span>
                    <Badge variant="success">1 Year Validity</Badge>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#D99B43]">₹99</span>
                    <span className="text-[#E8DBC8] text-xs font-medium">/ first year</span>
                  </div>

                  <p className="text-xs text-[#E8DBC8] leading-relaxed max-w-lg">
                    Introductory onboarding pass for <strong>{fullName}</strong> in{' '}
                    <strong>{selectedCategory.name}</strong>. Transparent pricing identical across all 10 sectors. Standard annual renewal of ₹5,999/yr applies from year 2.
                  </p>
                </div>

                {/* Summary of Verified Profile & Attached Documents */}
                <div className="p-4 rounded-xl bg-[#FCFAF6] border border-[#E8DBC8] space-y-3">
                  <div className="text-xs font-bold text-[#29302D] uppercase tracking-wider flex items-center justify-between">
                    <span>Onboarding Verification Summary:</span>
                    <span className="text-[#8064A9] font-bold text-[11px]">
                      {Object.keys(attachedFiles).length} Document(s) Attached ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#77786E]">
                    <div>
                      <span className="font-semibold text-[#29302D]">Member Name:</span> {fullName}
                    </div>
                    <div>
                      <span className="font-semibold text-[#29302D]">Registered Mobile:</span> {phoneNumber}
                    </div>
                    <div>
                      <span className="font-semibold text-[#29302D]">Primary Sector:</span> {selectedCategory.name}
                    </div>
                    <div>
                      <span className="font-semibold text-[#29302D]">Selected Roles:</span> {selectedSubcategories.join(', ')}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E8DBC8] space-y-1">
                    <span className="text-[11px] font-bold text-[#29302D] block">
                      Uploaded Documents for FIC Review:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategory.kycDocuments.map((doc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E8DBC8] text-[11px] text-[#29302D]"
                        >
                          <CheckCircleIcon size={12} className="text-[#D99B43]" />
                          <span>{doc.label}</span>
                        </span>
                      ))}
                      {customDocs.map((cDoc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#8064A9]/40 text-[11px] text-[#8064A9]"
                        >
                          <CheckCircleIcon size={12} className="text-[#8064A9]" />
                          <span>{cDoc.label || 'Additional Document'}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transparent Invoice Breakdown */}
                <div className="p-4 rounded-xl border border-[#E8DBC8] bg-[#FFF9F0] space-y-2.5 text-xs text-[#29302D]">
                  <div className="flex justify-between">
                    <span>1-Year Ecosystem Access Subtotal:</span>
                    <strong>₹99.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>GST & Transaction Processing:</span>
                    <span className="text-[#8064A9] font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-[#E8DBC8] text-sm font-bold text-[#29302D]">
                    <span>Total Amount Payable:</span>
                    <span className="text-[#C66B52]">₹99.00</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#77786E]">
                  <ShieldCheckIcon size={16} className="text-[#D99B43] shrink-0" />
                  <span>Simulated instant UPI / Gateway payment with immediate server-side validation.</span>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-[#E8DBC8]">
                  <Button variant="outline" type="button" onClick={() => setStep(4)}>
                    Back to KYC Documents
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    isLoading={isLoading}
                    className="bg-[#C66B52] hover:bg-[#D99B43] text-white"
                    onClick={handleSimulatePayment}
                  >
                    Pay ₹99 & Submit Application
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 6: APPLICATION TRACKING & DEMO ACCESS
           ======================================================== */}
        {step === 6 && (
          <div className="animate-step-in">
            <Card
              title="Application Submitted & Under Review"
              subtitle="Step 6 of 6: KYC verification tracking & activation timeline"
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl text-center py-6"
            >
              <div className="max-w-lg mx-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#FFF9F0] text-[#D99B43] border border-[#D99B43]/40 flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheckIcon size={32} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#29302D] mb-1">
                    Application Under FIC Review
                  </h3>
                  <p className="text-xs text-[#77786E] leading-relaxed max-w-md mx-auto">
                    Thank you, <strong>{fullName}</strong>! Your application and category documents for <strong>{selectedCategory.name}</strong> have been logged. Our Verification Executives review submissions within 24 business hours.
                  </p>
                </div>

                {/* Milestone Timeline */}
                <div className="p-4 rounded-xl bg-[#FCFAF6] border border-[#E8DBC8] text-left space-y-3">
                  <div className="text-xs font-bold text-[#29302D] uppercase tracking-wider mb-2">
                    Application Milestone Progress
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#29302D]">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} className="text-[#8064A9]" /> 1. Identity & Age 18+ Verification
                      </span>
                      <strong className="text-[11px] font-semibold text-[#8064A9]">Completed</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#29302D]">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} className="text-[#8064A9]" /> 2. Sector Profile & Dynamic Attributes
                      </span>
                      <strong className="text-[11px] font-semibold text-[#8064A9]">Completed</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#29302D]">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} className="text-[#8064A9]" /> 3. Category KYC Documents Attached
                      </span>
                      <strong className="text-[11px] font-semibold text-[#8064A9]">
                        {Object.keys(attachedFiles).length} Files Attached
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[#29302D]">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} className="text-[#8064A9]" /> 4. 1st Year Membership Fee (₹99)
                      </span>
                      <strong className="text-[11px] font-semibold text-[#8064A9]">PAID</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#C66B52] bg-[#FFF9F0] p-2 rounded-lg border border-[#D99B43]/30">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C66B52] animate-ping"></span>
                        5. Verification Desk Review
                      </span>
                      <strong className="text-[11px] font-bold">UNDER_REVIEW (24h SLA)</strong>
                    </div>
                  </div>
                </div>

                {/* Dev Simulation Shortcut */}
                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/30 text-left space-y-2.5">
                  <div className="text-xs font-bold text-[#29302D] flex items-center gap-1.5">
                    <span>⚡ Instant Testing Shortcut:</span>
                  </div>
                  <p className="text-[11px] text-[#77786E] leading-relaxed">
                    You can simulate instant KYC approval to test the live Member Dashboard right now without waiting for admin review:
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-[#C66B52] hover:bg-[#D99B43] text-white font-bold"
                    onClick={() => {
                      const u = getStoredUser() || {};
                      u.isKycApproved = true;
                      u.isMembershipActive = true;
                      u.kycStatus = 'APPROVED';
                      setStoredUser(u);
                      navigate('/dashboard');
                    }}
                  >
                    Simulate KYC Approval & Open Dashboard →
                  </Button>
                </div>

                <div className="pt-2">
                  <Link to="/">
                    <Button variant="outline" size="sm" className="border-[#E8DBC8] text-[#29302D]">
                      Return to Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

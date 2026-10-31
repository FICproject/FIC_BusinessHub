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
  SparklesIcon
} from '../components/Icons';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step index: 1 = Basic Account, 2 = Sector & Roles, 3 = Dynamic Form, 4 = ₹99 Payment, 5 = KYC Upload, 6 = Status Tracker
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Step 1: Basic
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 2: Category & Roles
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES_DATA[0]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([
    INITIAL_CATEGORIES_DATA[0].subcategories[0]
  ]);

  // Step 3: Dynamic details
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});

  // Step 4: Payment simulation
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 5: Real Document Attachment state
  const [docNumbers, setDocNumbers] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<
    Record<string, { name: string; size: string; fileUrl: string }>
  >({});

  // Stepper metadata
  const stepsInfo = [
    { num: 1, title: 'Account', desc: 'Identity' },
    { num: 2, title: 'Sector', desc: 'Category' },
    { num: 3, title: 'Profile', desc: 'Details' },
    { num: 4, title: 'Membership', desc: '₹99 Pass' },
    { num: 5, title: 'KYC', desc: 'Verification' },
    { num: 6, title: 'Status', desc: 'Activation' }
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
  const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr =
        file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(1) + ' KB';

      setAttachedFiles((prev) => ({
        ...prev,
        [docType]: {
          name: file.name,
          size: sizeStr,
          fileUrl: URL.createObjectURL(file)
        }
      }));
      setErrorMessage('');
    }
  };

  const handleRemoveFile = (docType: string) => {
    setAttachedFiles((prev) => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });
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

  // Step 3 Dynamic Form Submit
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

    setStep(4);
  };

  // Step 4 Payment Simulation (₹99 First-Year Intro)
  const handleSimulatePayment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
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

      await apiRequest('/payments/membership/confirm', {
        method: 'POST',
        body: JSON.stringify({
          orderId: `ORD_${Date.now()}`,
          transactionId: `TXN_UPI_${Date.now()}`
        })
      });

      setPaymentDone(true);
      setIsLoading(false);
      setStep(5);
    } catch {
      setPaymentDone(true);
      setIsLoading(false);
      setStep(5);
    }
  };

  // Step 5 KYC Upload
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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

    setIsLoading(true);

    const docItems = selectedCategory.kycDocuments.map((doc) => ({
      documentType: doc.type,
      documentNumber: docNumbers[doc.type] || '',
      fileName: attachedFiles[doc.type]?.name || '',
      fileUrl: attachedFiles[doc.type]?.fileUrl || 'https://ficapp.in/uploads/mock-id.pdf'
    }));

    await apiRequest('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: selectedCategory.id,
        documents: docItems
      })
    });

    const user = getStoredUser() || {
      fullName,
      email,
      primaryCategoryId: selectedCategory.id,
      categoryName: selectedCategory.name
    };
    user.isMembershipActive = true;
    user.isKycApproved = false;
    user.kycStatus = 'PENDING';
    setStoredUser(user);

    setIsLoading(false);
    setStep(6);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* PREMIUM ANIMATED STEPPER HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="relative">
            {/* Step connector line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0 hidden sm:block">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
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
                          ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100 scale-100'
                          : isActive
                          ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100 scale-110 pulse-glow-ring'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? '✓' : s.num}
                    </div>

                    <div className="mt-2 hidden sm:block">
                      <span
                        className={`text-xs block font-bold transition-colors ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">{s.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Step Title */}
          <div className="mt-4 pt-3 border-t border-slate-100 sm:hidden flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-600">
              Step {step} of 6: {stepsInfo[step - 1]?.title}
            </span>
            <span className="text-slate-400">{Math.round((step / 6) * 100)}% Completed</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: BASIC ACCOUNT SETUP
           ======================================================== */}
        {step === 1 && (
          <div className="animate-step-in">
            <Card
              title="Create Your Member Account"
              subtitle="Step 1 of 6: Enter your primary contact details and confirm legal adult eligibility (18+)"
              className="shadow-sm border border-slate-200"
            >
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
                  <SparklesIcon size={14} className="text-blue-600" />
                  Official Ecosystem Onboarding
                </span>
              </div>
              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. S. Moorthy"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  <Input
                    label="Mobile Number (10 digits)"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="moorthy@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    label="Account Password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Age Verification Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                    />
                    <span>
                      I confirm that I am <strong>18 years of age or older</strong> and legally eligible to enter into commercial contracts and ecosystem activities.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer pt-2 border-t border-slate-200/60">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>
                      I accept the <a href="#terms" className="text-blue-600 underline font-medium">Terms of Service</a> and acknowledge the ₹99 first-year introductory membership fee.
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link to="/login" className="text-xs text-blue-600 hover:underline">
                    Already a registered member? Sign in
                  </Link>

                  <Button variant="primary" type="submit" size="md">
                    Continue to Sector Selection
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 2: REDESIGNED PROFESSIONAL SECTOR & ROLE ARCHITECTURE
           ======================================================== */}
        {step === 2 && (
          <div className="animate-step-in space-y-6">
            <Card
              title="Select Your Primary Business Sector"
              subtitle="Step 2 of 6: Choose the single core industry that defines your enterprise or professional activity"
              className="shadow-sm border border-slate-200"
            >
              <div className="space-y-6">
                {/* 10 Clean Sector Cards Grid (No ugly scrollbar!) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {INITIAL_CATEGORIES_DATA.map((cat) => {
                    const isSelected = selectedCategory.id === cat.id;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-100 scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Sector Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50'
                          }`}
                        >
                          {renderCategoryIcon(cat.iconName, 20)}
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 min-w-0 pr-6">
                          <h3
                            className={`text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {cat.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 leading-normal">
                            {cat.description}
                          </p>
                        </div>

                        {/* Radio Check Indicator */}
                        <div className="absolute top-4 right-4">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DEDICATED ROLES & SUBCATEGORIES SELECTION PANEL */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-blue-200/80 shadow-xs space-y-4 animate-slide-down">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                          Role Specialization
                        </span>
                        <Badge variant="info">{selectedCategory.name}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Select Your Specific Role(s) in {selectedCategory.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Choose all roles that define your business or skills. You can select multiple roles.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full shrink-0">
                      ✓ {selectedSubcategories.length} Selected
                    </span>
                  </div>

                  {/* Clean Role Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {selectedCategory.subcategories.map((sub, idx) => {
                      const isChecked = selectedSubcategories.includes(sub);

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSubcategory(sub)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                            isChecked
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs scale-[1.01]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 hover:-translate-y-0.5'
                          }`}
                        >
                          <span className="truncate">{sub}</span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                              isChecked
                                ? 'bg-white text-blue-600'
                                : 'border border-slate-300 text-slate-400'
                            }`}
                          >
                            {isChecked ? '✓' : '+'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="pt-2 flex justify-between items-center">
                  <Button variant="outline" type="button" onClick={() => setStep(1)}>
                    Back to Account
                  </Button>
                  <Button variant="primary" type="button" onClick={() => setStep(3)}>
                    Next: Dynamic Profile
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 3: DYNAMIC SECTOR DETAILS FORM
           ======================================================== */}
        {step === 3 && (
          <div className="animate-step-in">
            <Card
              title={`${selectedCategory.name} Details`}
              subtitle={`Step 3 of 6: Dynamic configuration-driven questions customized for ${selectedCategory.name}`}
              className="shadow-sm border border-slate-200"
            >
              <form onSubmit={handleDynamicFormSubmit} className="space-y-5">
                {/* Sector Header Pill */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    {renderCategoryIcon(selectedCategory.iconName, 20)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">
                      Sector Profile: {selectedCategory.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Roles selected: {selectedSubcategories.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-4">
                  {selectedCategory.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

                <div className="pt-3 flex justify-between items-center border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setStep(2)}>
                    Back to Sector
                  </Button>
                  <Button variant="primary" type="submit">
                    Proceed to ₹99 Checkout
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 4: MEMBERSHIP PAYMENT CHECKOUT (₹99)
           ======================================================== */}
        {step === 4 && (
          <div className="animate-step-in">
            <Card
              title="First-Year Membership Fee"
              subtitle="Step 4 of 6: Transparent annual onboarding pass for FIC Business Hub"
              className="shadow-sm border border-slate-200"
            >
              <div className="space-y-6">
                {/* Executive Card Pass */}
                <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                      FIC Annual Membership Pass
                    </span>
                    <Badge variant="success">1 Year Validity</Badge>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-amber-400">₹99</span>
                    <span className="text-slate-400 text-xs font-medium">/ first year</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    Introductory onboarding pass for <strong>{fullName}</strong> in{' '}
                    <strong>{selectedCategory.name}</strong>. Transparent pricing identical across all 10 sectors. Standard annual renewal of ₹5,999/yr applies from year 2.
                  </p>
                </div>

                {/* Transparent Invoice Breakdown */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>1-Year Ecosystem Access Subtotal:</span>
                    <strong>₹99.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>GST & Transaction Processing:</span>
                    <span className="text-emerald-600 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Total Amount Payable:</span>
                    <span>₹99.00</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheckIcon size={16} className="text-blue-600 shrink-0" />
                  <span>Simulated instant UPI / Gateway payment with immediate server-side validation.</span>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setStep(3)}>
                    Back to Profile
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    isLoading={isLoading}
                    onClick={handleSimulatePayment}
                  >
                    Pay ₹99 & Continue to KYC
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================
            STEP 5: REAL KYC DOCUMENT UPLOAD (WITH ATTACHMENT COMPONENT)
           ======================================================== */}
        {step === 5 && (
          <div className="animate-step-in">
            <Card
              title="Category KYC Document Upload"
              subtitle="Step 5 of 6: Upload verification documents to activate your account"
              className="shadow-sm border border-slate-200"
            >
              <form onSubmit={handleKycSubmit} className="space-y-6">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                  <CheckCircleIcon size={20} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>₹99 Payment Confirmed!</strong> Attach your sector verification documents below to complete KYC and activate full dashboard access.
                  </span>
                </div>

                <div className="space-y-5">
                  {selectedCategory.kycDocuments.map((doc, i) => {
                    const isAttached = !!attachedFiles[doc.type];
                    const fileInfo = attachedFiles[doc.type];

                    return (
                      <div
                        key={i}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{doc.label}</span>
                            {(doc as any).description && (
                              <span className="text-[11px] text-slate-500">{(doc as any).description}</span>
                            )}
                          </div>
                          {doc.required ? (
                            <Badge variant="warning">Required</Badge>
                          ) : (
                            <Badge variant="neutral">Optional</Badge>
                          )}
                        </div>

                        {/* Document Number Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 block">
                            Document / Registration Number {doc.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 12-digit Aadhaar / 10-char PAN / GSTIN / Reg No."
                            className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={docNumbers[doc.type] || ''}
                            onChange={(e) =>
                              setDocNumbers({ ...docNumbers, [doc.type]: e.target.value })
                            }
                            required={doc.required}
                          />
                        </div>

                        {/* Real File Upload & Attachment Component */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-slate-700 block">
                            Attach Document File (PDF, PNG, JPG) {doc.required && <span className="text-red-500">*</span>}
                          </label>

                          {isAttached ? (
                            <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <FileTextIcon size={20} />
                                </div>
                                <div className="truncate">
                                  <span className="text-xs font-bold text-slate-900 block truncate">
                                    {fileInfo.name}
                                  </span>
                                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                                    <CheckCircleIcon size={13} /> {fileInfo.size} • File Attached & Ready
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs">
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
                                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Remove File"
                                >
                                  <TrashIcon size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 cursor-pointer transition-all gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <UploadIcon size={18} />
                                </div>
                                <div className="text-center sm:text-left">
                                  <span className="text-xs font-semibold text-slate-900 block">
                                    Click to browse or drop {doc.label.toLowerCase()} file
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Supports PDF, PNG, JPG (up to 5MB)
                                  </span>
                                </div>
                              </div>
                              <span className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0 shadow-sm transition-colors">
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

                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setStep(4)}>
                    Back to Payment
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isLoading}>
                    Submit Application for FIC Review
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </div>
              </form>
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
              className="shadow-sm border border-slate-200 text-center py-6"
            >
              <div className="max-w-lg mx-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheckIcon size={32} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Application Under FIC Review
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                    Thank you, <strong>{fullName}</strong>! Your application for <strong>{selectedCategory.name}</strong> has been logged. Our Verification Executives review documents within 24 business hours.
                  </p>
                </div>

                {/* Milestone Timeline */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Application Milestone Progress
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} /> 1. Identity & Age 18+ Verification
                      </span>
                      <strong className="text-[11px] font-semibold">Completed</strong>
                    </div>

                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} /> 2. Sector Profile & Dynamic Attributes
                      </span>
                      <strong className="text-[11px] font-semibold">Completed</strong>
                    </div>

                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="flex items-center gap-2">
                        <CheckCircleIcon size={14} /> 3. 1st Year Membership Fee (₹99)
                      </span>
                      <strong className="text-[11px] font-semibold">PAID</strong>
                    </div>

                    <div className="flex items-center justify-between text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        4. Sector KYC Verification
                      </span>
                      <strong className="text-[11px] font-bold">UNDER_REVIEW</strong>
                    </div>
                  </div>
                </div>

                {/* Dev Simulation Shortcut */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-left space-y-2.5">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <span>⚡ Developer / Testing Shortcut:</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    You can simulate instant KYC approval to test the live Member Dashboard right now without waiting for admin review:
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
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
                    <Button variant="outline" size="sm">
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

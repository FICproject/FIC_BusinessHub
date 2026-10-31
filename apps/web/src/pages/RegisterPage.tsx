import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, Badge } from '@fic/ui';
import { INITIAL_CATEGORIES_DATA } from '../services/mockData';
import { apiRequest, setAuthToken, setStoredUser, getStoredUser } from '../services/api';
import { ShieldCheckIcon, CheckCircleIcon, ArrowRightIcon, LockIcon } from '../components/Icons';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step index: 1 = Basic Account, 2 = Category, 3 = Dynamic Form, 4 = ₹99 Payment, 5 = KYC Upload, 6 = Success/Tracking
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

  // Step 2: Category
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES_DATA[0]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([
    INITIAL_CATEGORIES_DATA[0].subcategories[0]
  ]);

  // Step 3: Dynamic details
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});

  // Step 4: Payment simulation
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 5: KYC document
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

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
      setErrorMessage('You must be 18 years or older to register.');
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
      // Register user through real API if available, or simulate locally
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

      // Confirm ₹99 payment
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
      // Fallback local simulation
      setPaymentDone(true);
      setIsLoading(false);
      setStep(5);
    }
  };

  // Step 5 KYC Upload
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const docItems = selectedCategory.kycDocuments.map((doc) => ({
      documentType: doc.type,
      fileUrl: uploadedDocs[doc.type] || 'https://ficapp.in/uploads/mock-id.pdf'
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
    user.isKycApproved = false; // waiting review
    user.kycStatus = 'PENDING';
    setStoredUser(user);

    setIsLoading(false);
    setStep(6);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span className={step >= 1 ? 'text-blue-600 font-bold' : ''}>1. Account</span>
            <span className={step >= 2 ? 'text-blue-600 font-bold' : ''}>2. Sector</span>
            <span className={step >= 3 ? 'text-blue-600 font-bold' : ''}>3. Details</span>
            <span className={step >= 4 ? 'text-blue-600 font-bold' : ''}>4. ₹99 Payment</span>
            <span className={step >= 5 ? 'text-blue-600 font-bold' : ''}>5. KYC</span>
            <span className={step >= 6 ? 'text-blue-600 font-bold' : ''}>6. Status</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: BASIC ACCOUNT */}
        {step === 1 && (
          <Card
            title="Create Your Member Account"
            subtitle="Step 1 of 6: Basic details & age verification"
            className="shadow-md"
          >
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. S. Moorthy"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="moorthy@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

              <Input
                label="Password (min 8 characters)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-blue-600"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                  />
                  <span>
                    I confirm that I am <strong>18 years of age or older</strong> and legally eligible to enter into commercial transactions.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-blue-600"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I accept the <a href="#terms" className="text-blue-600 underline">Terms of Service</a> and acknowledge the ₹99 first-year introductory membership fee.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Link to="/login" className="text-xs text-blue-600 hover:underline">
                  Already registered? Login
                </Link>
                <Button variant="primary" type="submit">
                  Next: Select Sector
                  <ArrowRightIcon className="ml-2" size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 2: CATEGORY SELECTION */}
        {step === 2 && (
          <Card
            title="Select Your Primary Sector"
            subtitle="Step 2 of 6: Choose exactly one main category and your relevant subcategories"
            className="shadow-md"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                {INITIAL_CATEGORIES_DATA.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                        {isSelected && <Badge variant="info">Selected</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{cat.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Select Subcategory Roles in {selectedCategory.name}:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subcategories.map((sub, idx) => {
                    const isChecked = selectedSubcategories.includes(sub);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleSubcategory(sub)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Button variant="outline" type="button" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" type="button" onClick={() => setStep(3)}>
                  Next: Dynamic Details
                  <ArrowRightIcon className="ml-2" size={16} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: DYNAMIC FORM */}
        {step === 3 && (
          <Card
            title={`${selectedCategory.name} Details`}
            subtitle="Step 3 of 6: Dynamic configuration-driven questions for your sector"
            className="shadow-md"
          >
            <form onSubmit={handleDynamicFormSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 mb-4">
                These questions are dynamically configured based on your sector (<strong>{selectedCategory.name}</strong>).
              </div>

              {selectedCategory.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={dynamicAnswers[field.key] || ''}
                      onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [field.key]: e.target.value })}
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
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={dynamicAnswers[field.key] || ''}
                      onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [field.key]: e.target.value })}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 flex justify-between items-center">
                <Button variant="outline" type="button" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="primary" type="submit">
                  Proceed to ₹99 Checkout
                  <ArrowRightIcon className="ml-2" size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 4: MEMBERSHIP PAYMENT (₹99) */}
        {step === 4 && (
          <Card
            title="First-Year Membership Fee"
            subtitle="Step 4 of 6: Transparent ₹99 annual onboarding checkout"
            className="shadow-md"
          >
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Introductory Access Pass
                  </span>
                  <Badge variant="success">1 Year Validity</Badge>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-white">₹99</span>
                  <span className="text-slate-400 text-xs">/ year 1</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Transparent introductory pricing for {fullName} in {selectedCategory.name}. Standard annual renewal of ₹5,999/yr applies from year 2.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Membership Subtotal:</span>
                  <strong>₹99.00</strong>
                </div>
                <div className="flex justify-between">
                  <span>GST / Platform Fee:</span>
                  <span className="text-emerald-600 font-semibold">Included</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Payable:</span>
                  <span>₹99.00</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheckIcon size={16} className="text-blue-600" />
                <span>Simulated instant UPI / Gateway payment with server-side activation.</span>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Button variant="outline" type="button" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  isLoading={isLoading}
                  onClick={handleSimulatePayment}
                >
                  Pay ₹99 & Continue to KYC
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 5: KYC DOCUMENT UPLOAD */}
        {step === 5 && (
          <Card
            title="Category KYC Document Upload"
            subtitle="Step 5 of 6: Upload verification documents to activate your account"
            className="shadow-md"
          >
            <form onSubmit={handleKycSubmit} className="space-y-6">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                ✅ ₹99 Payment confirmed! Complete your KYC verification below to activate full dashboard access.
              </div>

              <div className="space-y-4">
                {selectedCategory.kycDocuments.map((doc, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{doc.label}</span>
                      {doc.required && <Badge variant="warning">Required</Badge>}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Document / License Number (e.g. 1234-5678-9012)"
                        className="text-xs px-3 py-2 border border-slate-300 rounded-md flex-1 bg-white"
                        value={uploadedDocs[doc.type] || ''}
                        onChange={(e) => setUploadedDocs({ ...uploadedDocs, [doc.type]: e.target.value })}
                        required={doc.required}
                      />
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Document Attached
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" type="submit" isLoading={isLoading}>
                  Submit Application for FIC Review
                  <ArrowRightIcon className="ml-2" size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 6: APPLICATION TRACKING & DEMO ACCESS */}
        {step === 6 && (
          <Card
            title="Application Submitted & Under Review"
            subtitle="Step 6 of 6: KYC verification tracking"
            className="shadow-md text-center py-6"
          >
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldCheckIcon size={32} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Application Under FIC Review
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Thank you, <strong>{fullName}</strong>! Your application for <strong>{selectedCategory.name}</strong> has been submitted. Our Verification Executives review documents within 24 business hours.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Membership Fee:</span>
                  <span className="font-bold text-emerald-600">PAID (₹99 / 1 Year)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KYC Status:</span>
                  <span className="font-bold text-amber-600">UNDER_REVIEW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Sector:</span>
                  <span className="font-bold text-slate-900">{selectedCategory.name}</span>
                </div>
              </div>

              {/* Dev Simulation Button */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-left space-y-3">
                <div className="text-xs font-bold text-blue-900">
                  ⚡ Developer / Testing Shortcut:
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  You can simulate instant KYC approval to test the live Member Dashboard right now without waiting for admin review:
                </p>
                <Button
                  variant="primary"
                  size="sm"
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
        )}
      </div>
    </div>
  );
};


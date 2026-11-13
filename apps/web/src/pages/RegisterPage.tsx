import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button, Input, Card, Badge } from '@fic/ui';
import { INITIAL_CATEGORIES_DATA } from '../services/categoriesData';
import { getSubcategoryFormConfig } from '../services/subcategoryForms';
import {
  getIndianStates,
  getDistrictsForState,
  matchIndianStateName,
  validateIndianPinCode
} from '../services/indianLocations';
import {
  apiRequest,
  setAuthToken,
  setStoredUser,
  getStoredUser,
  validateDobAndAge,
  calculateAgeFromDob,
  formatDisplayDob,
  validateReferralCode,
  validateReferralCodeApi,
  saveRegisteredAccount,
  UserAddress,
  uploadDocumentFile,
  validateClientFileBeforeUpload,
  registerAccountStrict,
  submitKycApplicationStrict,
  extractApiErrorMessage,
  checkEmailAvailability,
  checkMobileAvailability,
  lookupIndianPinCodeApi,
  UploadedDocumentAsset
} from '../services/api';
import {
  MAX_KYC_FILE_BYTES,
  validateFullNameClient,
  validateEmailClient,
  validateMobileClient,
  evaluatePasswordStrength,
  validatePanClient,
  validateAadhaarClient,
  maskAadhaarDisplay,
  validateAlternativeGovtIdClient,
  validateDynamicFieldClient,
  validateCityClient,
  computeFileSha256
} from '../utils/registrationValidation';
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
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';

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
  const [searchParams] = useSearchParams();
  const urlRef = searchParams.get('ref');
  if (urlRef) {
    try { sessionStorage.setItem('fic_registration_ref', urlRef); } catch {}
  }
  const refParam = urlRef || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('fic_registration_ref') || '' : '');
  const [referralCode, setReferralCode] = useState(refParam);
  const [referrerInfo, setReferrerInfo] = useState<{ valid: boolean; referrerName?: string; referrerUserId?: string } | null>(null);

  useEffect(() => {
    if (refParam) {
      validateReferralCodeApi(refParam).then((res) => {
        setReferrerInfo(res);
        if (res.valid) {
          setReferralCode(refParam.toUpperCase());
        }
      });
    }
  }, [refParam]);

  const handleManualReferralCheck = (code: string) => {
    setReferralCode(code);
    if (code.trim()) {
      validateReferralCodeApi(code.trim()).then((res) => {
        setReferrerInfo(res);
      });
    } else {
      setReferrerInfo(null);
    }
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [dobAge, setDobAge] = useState<number | null>(null);
  const [dobValidationError, setDobValidationError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailAvail, setEmailAvail] = useState<{ status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'; message?: string }>({ status: 'idle' });
  const [mobileAvail, setMobileAvail] = useState<{ status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'; message?: string }>({ status: 'idle' });
  const emailCheckSeqRef = useRef(0);
  const mobileCheckSeqRef = useRef(0);

  const setFieldError = (key: string, msg: string | null) => {
    setFieldErrors((prev) => {
      if (!msg) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: msg };
    });
  };

  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailAvail({ status: 'idle' });
      setFieldError('email', null);
      return;
    }
    const fmtErr = validateEmailClient(trimmed);
    if (fmtErr) {
      setEmailAvail({ status: 'invalid', message: fmtErr });
      return;
    }
    const seq = ++emailCheckSeqRef.current;
    setEmailAvail({ status: 'checking' });
    const timer = setTimeout(async () => {
      try {
        const res = await checkEmailAvailability(trimmed);
        if (seq !== emailCheckSeqRef.current) return;
        if (res.available) {
          setEmailAvail({ status: 'available', message: 'Email address is available' });
          setFieldError('email', null);
        } else {
          const msg = res.message || 'This email address is already registered. Please use another email address.';
          setEmailAvail({ status: 'taken', message: msg });
          setFieldError('email', msg);
        }
      } catch {
        if (seq === emailCheckSeqRef.current) {
          setEmailAvail({ status: 'idle' });
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    const clean = phoneNumber.trim();
    if (!clean) {
      setMobileAvail({ status: 'idle' });
      setFieldError('phoneNumber', null);
      return;
    }
    if (clean.length < 10) {
      setMobileAvail({ status: 'invalid', message: 'Enter a valid 10-digit Indian mobile number.' });
      return;
    }
    const fmtErr = validateMobileClient(clean);
    if (fmtErr) {
      setMobileAvail({ status: 'invalid', message: fmtErr });
      setFieldError('phoneNumber', fmtErr);
      return;
    }
    const seq = ++mobileCheckSeqRef.current;
    setMobileAvail({ status: 'checking' });
    const timer = setTimeout(async () => {
      try {
        const res = await checkMobileAvailability(clean);
        if (seq !== mobileCheckSeqRef.current) return;
        if (res.available) {
          setMobileAvail({ status: 'available', message: 'Mobile number is available' });
          setFieldError('phoneNumber', null);
        } else {
          const msg = res.message || 'This mobile number is already registered. Please use another number.';
          setMobileAvail({ status: 'taken', message: msg });
          setFieldError('phoneNumber', msg);
        }
      } catch {
        if (seq === mobileCheckSeqRef.current) {
          setMobileAvail({ status: 'idle' });
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [phoneNumber]);

  // Maximum allowed Date of Birth is exactly 18 years ago from today
  const maxDobAllowed = new Date(
    new Date().setFullYear(new Date().getFullYear() - 18)
  )
    .toISOString()
    .split('T')[0];

  // Minimum allowed Date of Birth is 120 years ago (plausible birth year)
  const minDobAllowed = new Date(
    new Date().setFullYear(new Date().getFullYear() - 120)
  )
    .toISOString()
    .split('T')[0];

  const handleDobChange = (val: string) => {
    setDob(val);
    if (!val) {
      setDobAge(null);
      setDobValidationError('');
      return;
    }
    const res = validateDobAndAge(val);
    setDobAge(res.age);
    if (!res.valid) {
      setDobValidationError(res.error || 'Please enter a valid date of birth.');
    } else {
      setDobValidationError('');
    }
  };

  // Step 2: Category & Strictly Single Subcategory Role
  const [categoriesList, setCategoriesList] = useState<any[]>(INITIAL_CATEGORIES_DATA);
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES_DATA[0]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    INITIAL_CATEGORIES_DATA[0].subcategories[0]
  );

  // Load dynamically updated categories from the shared database
  useEffect(() => {
    const fetchLiveCategories = async () => {
      try {
        const res = await apiRequest('/categories');
        const categoriesData = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : null);
        if (categoriesData && categoriesData.length > 0) {
          const mapped = categoriesData.map((cat: any, index: number) => ({
            id: cat.id || cat._id || `cat-${index}`,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            iconName: cat.iconName || cat.icon || 'Briefcase',
            subcategories: (cat.subcategories || []).map((s: any) =>
              typeof s === 'string' ? s : (s.name || 'General')
            ).filter(Boolean),
            customFields: Array.isArray(cat.customFields) ? cat.customFields : [],
            kycRequirements: Array.isArray(cat.kycRequirements) ? cat.kycRequirements : []
          }));
          setCategoriesList(mapped);
          // Keep current category selection or fallback to first live category
          setSelectedCategory((prevSelected) => {
            const found = mapped.find(
              (m: any) => m.slug === prevSelected?.slug || m.name === prevSelected?.name || m.id === prevSelected?.id
            );
            const targetCat = found || mapped[0];
            if (targetCat.subcategories && targetCat.subcategories.length > 0) {
              setSelectedSubcategory((prevSub) =>
                targetCat.subcategories.includes(prevSub) ? prevSub : targetCat.subcategories[0]
              );
            }
            return targetCat;
          });
        }
      } catch (err) {
        // Fall back to INITIAL_CATEGORIES_DATA gracefully
        console.warn('Live categories lookup notice:', err);
      }
    };
    fetchLiveCategories();
  }, []);

  // Resolved dynamic configuration for the active subcategory merged with Admin customFields
  const subcategoryConfig = getSubcategoryFormConfig(selectedCategory.name, selectedSubcategory);
  const mergedDynamicFields = React.useMemo(() => {
    const base = [...subcategoryConfig.fields];
    const seenKeys = new Set(base.map((f) => f.key));
    const adminFields = Array.isArray((selectedCategory as any)?.customFields)
      ? (selectedCategory as any).customFields
      : [];
    for (const cf of adminFields) {
      const key = String(cf.fieldKey || cf.key || '').trim();
      if (!key || seenKeys.has(key)) continue;
      seenKeys.add(key);
      const rawType = String(cf.type || 'text').toLowerCase();
      base.push({
        key,
        label: cf.label || key,
        type: (rawType === 'select' || rawType === 'textarea' || rawType === 'number' ? rawType : 'text') as any,
        required: Boolean(cf.required),
        placeholder: cf.placeholder || `Enter ${cf.label || key}`,
        options: Array.isArray(cf.options) ? cf.options : undefined,
        helperText: cf.helperText
      });
    }
    return base;
  }, [subcategoryConfig.fields, selectedCategory]);

  // Category & Subcategory specific documents excluding Aadhaar & PAN (which have dedicated mandatory sections)
  const dynamicRoleDocs = React.useMemo(() => {
    const isIdentitySlot = (typeOrKey: string, label: string) => {
      const t = String(typeOrKey || '').toUpperCase();
      const l = String(label || '').toLowerCase();
      if (t === 'GOVT_ID' || t === 'AADHAAR' || t === 'AADHAAR_CARD' || t === 'PAN' || t === 'PAN_CARD') return true;
      if (l.includes('aadhaar') || / pan /.test(l) || l.includes('pan card')) return true;
      return false;
    };
    const isCollegeDoc = (typeOrKey: string, label: string) => {
      const t = String(typeOrKey || '').toUpperCase();
      const l = String(label || '').toLowerCase();
      return t === 'COLLEGE_ID' || t === 'STUDENT_ID' || t === 'STUDENT_OR_EMP_ID' || l.includes('college id');
    };
    const list: Array<{ type: string; label: string; required: boolean; description?: string; allowedExtensions?: string[]; maxSizeMB?: number; hideDocNumber?: boolean }> = [];
    const seenTypes = new Set<string>();
    let hasCollegeDoc = false;

    for (const doc of subcategoryConfig.kycDocuments) {
      if (isIdentitySlot(doc.type, doc.label)) continue;
      const isCollege = isCollegeDoc(doc.type, doc.label);
      if (isCollege && hasCollegeDoc) continue;
      if (isCollege) hasCollegeDoc = true;

      seenTypes.add(doc.type.toUpperCase());
      list.push({
        ...doc,
        type: isCollege ? 'COLLEGE_ID' : doc.type,
        label: isCollege ? 'College ID Card' : doc.label,
        description: isCollege ? 'Upload a clear image or PDF of your current college identity card.' : doc.description,
        hideDocNumber: isCollege ? true : Boolean((doc as any).hideDocNumber),
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMB: 2
      });
    }
    const adminKycReqs = Array.isArray((selectedCategory as any)?.kycRequirements)
      ? (selectedCategory as any).kycRequirements
      : [];
    for (const reqDoc of adminKycReqs) {
      const key = String(reqDoc.docKey || reqDoc.documentType || reqDoc.type || reqDoc.title || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      const label = String(reqDoc.title || reqDoc.label || reqDoc.documentType || 'Category Document').trim();
      if (!key || isIdentitySlot(key, label) || seenTypes.has(key)) continue;
      const isCollege = isCollegeDoc(key, label);
      if (isCollege && hasCollegeDoc) continue;
      if (isCollege) hasCollegeDoc = true;

      seenTypes.add(key);
      list.push({
        type: isCollege ? 'COLLEGE_ID' : key,
        label: isCollege ? 'College ID Card' : label,
        required: Boolean(reqDoc.required ?? true),
        description: isCollege ? 'Upload a clear image or PDF of your current college identity card.' : (reqDoc.description || 'Mandatory category compliance proof'),
        hideDocNumber: isCollege ? true : false,
        allowedExtensions: Array.isArray(reqDoc.allowedExtensions) && reqDoc.allowedExtensions.length > 0
          ? reqDoc.allowedExtensions.map((e: string) => e.toLowerCase()).filter((e: string) => ['pdf', 'jpg', 'jpeg', 'png'].includes(e))
          : ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMB: Math.min(Number(reqDoc.maxSizeMB || 2), 2)
      });
    }
    return list;
  }, [subcategoryConfig.kycDocuments, selectedCategory]);

  // Step 3: Dynamic details & Residential Address
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [country, setCountry] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [addressType, setAddressType] = useState('Residential');
  const [pinCodeError, setPinCodeError] = useState('');
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinLookupInfo, setPinLookupInfo] = useState('');
  const latestPinLookupRef = useRef('');

  const handleStateChange = (selectedState: string) => {
    setStateName(selectedState);
    const availableDistricts = getDistrictsForState(selectedState);
    setDistrict(availableDistricts[0] || '');
  };

  const handlePinCodeInput = async (rawValue: string) => {
    const hasNonDigits = /[^0-9]/.test(rawValue);
    const sanitized = rawValue.replace(/\D/g, '').slice(0, 6);
    setPinCode(hasNonDigits ? rawValue.slice(0, 6) : sanitized);

    if (!rawValue) {
      setCountry('');
      setStateName('');
      setDistrict('');
      setCity('');
      setPinCodeError('');
      setPinLookupInfo('');
      return;
    }

    if (hasNonDigits || (rawValue.length > 0 && rawValue.startsWith('0'))) {
      setCountry('');
      setStateName('');
      setDistrict('');
      setCity('');
      setPinLookupInfo('');
      setPinCodeError('Please enter a valid 6-digit Indian PIN Code.');
      return;
    }

    if (sanitized.length < 6) {
      setCountry('');
      setStateName('');
      setDistrict('');
      setCity('');
      setPinLookupInfo('');
      setPinCodeError('PIN Code must contain exactly 6 digits.');
      return;
    }

    latestPinLookupRef.current = sanitized;
    setPinCodeError('');
    setPinLookupInfo('');
    setIsLookingUpPin(true);
    try {
      const resolved = await lookupIndianPinCodeApi(sanitized);
      if (latestPinLookupRef.current !== sanitized) return;

      const normalizedState = matchIndianStateName(resolved.state);
      const stateDistricts = getDistrictsForState(normalizedState);
      const matchedDistrict =
        stateDistricts.find((d) => d.toLowerCase() === resolved.district.toLowerCase()) ||
        stateDistricts.find((d) => resolved.district.toLowerCase().includes(d.toLowerCase())) ||
        resolved.district;

      setCountry(resolved.country || 'India');
      setStateName(normalizedState);
      setDistrict(matchedDistrict);
      setCity(resolved.city || matchedDistrict);
      setFieldError('city', null);
      setPinCodeError('');
      setPinLookupInfo(
        `Auto-filled: ${resolved.city || matchedDistrict}, ${matchedDistrict}, ${normalizedState}, India`
      );
    } catch (err: any) {
      if (latestPinLookupRef.current !== sanitized) return;
      setCountry('');
      setStateName('');
      setDistrict('');
      setCity('');
      setPinLookupInfo('');
      setPinCodeError('This PIN Code is not recognised. Please verify and try again.');
    } finally {
      if (latestPinLookupRef.current === sanitized) {
        setIsLookingUpPin(false);
      }
    }
  };

  // Step 4: Real Document Attachment state (Aadhaar / Alt ID + PAN + Dynamic + Custom)
  const [identityMode, setIdentityMode] = useState<'AADHAAR' | 'ALT_GOVT_ID'>('AADHAAR');
  const [altGovtIdType, setAltGovtIdType] = useState<'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENCE'>('PASSPORT');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [docFieldErrors, setDocFieldErrors] = useState<Record<string, string>>({});
  const [docNumbers, setDocNumbers] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<
    Record<string, { file?: File; name: string; size: string; mimeType?: string; fileUrl: string; documentId?: string; sha256?: string }>
  >({});
  const registeredSessionRef = useRef<{ token: string; user: any } | null>(null);
  const uploadedAssetsRef = useRef<Record<string, UploadedDocumentAsset>>({});
  const fileHashesRef = useRef<Record<string, string>>({});
  const [customDocs, setCustomDocs] = useState<CustomDoc[]>([]);

  const setDocError = (key: string, msg: string | null) => {
    setDocFieldErrors((prev) => {
      if (!msg) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: msg };
    });
  };

  // Step 5: Payment
  const [paymentDone, setPaymentDone] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [membershipPrice, setMembershipPrice] = useState<number>(99);

  useEffect(() => {
    fetch('/api/v1/config/pricing')
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res.data?.firstYearMembershipFee) {
          setMembershipPrice(Number(res.data.firstYearMembershipFee));
        }
      })
      .catch((err) => console.warn('Could not load dynamic pricing, using default:', err));
  }, []);

  // Stepper metadata (Updated to show KYC at Step 4 and Membership at Step 5)
  const stepsInfo = [
    { num: 1, title: 'Account', desc: 'Identity' },
    { num: 2, title: 'Sector', desc: 'Category' },
    { num: 3, title: 'Profile', desc: 'Details' },
    { num: 4, title: 'KYC', desc: 'Documents' },
    { num: 5, title: 'Membership', desc: `₹${membershipPrice} Pass` },
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

  // File attach handler - validates strict 2 MB limit, allowed formats, and SHA-256 duplicates
  const handleFileChange = async (
    docKey: string,
    e: React.ChangeEvent<HTMLInputElement>,
    allowedExtensions: string[] = ['pdf', 'jpg', 'jpeg', 'png']
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocError(docKey, null);
    setErrorMessage('');

    try {
      validateClientFileBeforeUpload(file, MAX_KYC_FILE_BYTES, allowedExtensions);
    } catch (err: any) {
      const msg = err?.message || 'Unsupported or oversized file selected.';
      setDocError(docKey, msg);
      setErrorMessage(msg);
      e.target.value = '';
      return;
    }

    try {
      const sha256 = await computeFileSha256(file);
      const duplicateEntry = Object.entries(fileHashesRef.current).find(
        ([existingKey, existingHash]) => existingKey !== docKey && existingHash === sha256
      );
      if (duplicateEntry) {
        const dupMsg = 'This document has already been uploaded. Please select a different document.';
        setDocError(docKey, dupMsg);
        setErrorMessage(dupMsg);
        e.target.value = '';
        return;
      }
      fileHashesRef.current[docKey] = sha256;

      const sizeStr =
        file.size >= 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(1) + ' KB';

      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      delete uploadedAssetsRef.current[docKey];

      setAttachedFiles((prev) => ({
        ...prev,
        [docKey]: {
          file,
          name: file.name,
          size: sizeStr,
          mimeType: file.type,
          fileUrl: previewUrl,
          sha256
        }
      }));
    } catch (hashErr: any) {
      const msg = hashErr?.message || 'Unable to verify file integrity.';
      setDocError(docKey, msg);
      setErrorMessage(msg);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (docKey: string) => {
    delete fileHashesRef.current[docKey];
    delete uploadedAssetsRef.current[docKey];
    setDocError(docKey, null);
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

  // Step 1 Submit (Full validation + confirm password + live duplicate check)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const nameErr = validateFullNameClient(fullName);
    if (nameErr) {
      setFieldError('fullName', nameErr);
      setErrorMessage(nameErr);
      return;
    }
    setFieldError('fullName', null);

    const emailErr = validateEmailClient(email);
    if (emailErr) {
      setFieldError('email', emailErr);
      setErrorMessage(emailErr);
      return;
    }
    if (emailAvail.status === 'taken') {
      const msg = emailAvail.message || 'This email address is already registered. Please use another email address.';
      setFieldError('email', msg);
      setErrorMessage(msg);
      return;
    }

    const mobErr = validateMobileClient(phoneNumber);
    if (mobErr) {
      setFieldError('phoneNumber', mobErr);
      setErrorMessage(mobErr);
      return;
    }
    if (mobileAvail.status === 'taken') {
      const msg = mobileAvail.message || 'This mobile number is already registered. Please use another number.';
      setFieldError('phoneNumber', msg);
      setErrorMessage(msg);
      return;
    }

    if (!dob) {
      setErrorMessage('Please enter your Date of Birth.');
      return;
    }
    const dobResult = validateDobAndAge(dob);
    if (!dobResult.valid) {
      setDobValidationError(dobResult.error || 'Please enter a valid date of birth.');
      setErrorMessage(dobResult.error || 'Please enter a valid date of birth.');
      return;
    }

    const { error: pwdErr } = evaluatePasswordStrength(password);
    if (pwdErr) {
      setFieldError('password', pwdErr);
      setErrorMessage(pwdErr);
      return;
    }
    setFieldError('password', null);

    if (!confirmPassword || confirmPassword !== password) {
      const mismatch = 'Passwords do not match.';
      setFieldError('confirmPassword', mismatch);
      setErrorMessage(mismatch);
      return;
    }
    setFieldError('confirmPassword', null);

    if (!ageConfirmed) {
      setErrorMessage('Please legally confirm that you are 18 years of age or older.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms of Service to proceed.');
      return;
    }

    // Final synchronous check against backend availability if still idle/checking
    try {
      if (emailAvail.status !== 'available') {
        const res = await checkEmailAvailability(email.trim().toLowerCase());
        if (!res.available) {
          const msg = res.message || 'This email address is already registered. Please use another email address.';
          setEmailAvail({ status: 'taken', message: msg });
          setFieldError('email', msg);
          setErrorMessage(msg);
          return;
        }
        setEmailAvail({ status: 'available', message: 'Email address is available' });
      }
      if (mobileAvail.status !== 'available') {
        const res = await checkMobileAvailability(phoneNumber.trim());
        if (!res.available) {
          const msg = res.message || 'This mobile number is already registered. Please use another number.';
          setMobileAvail({ status: 'taken', message: msg });
          setFieldError('phoneNumber', msg);
          setErrorMessage(msg);
          return;
        }
        setMobileAvail({ status: 'available', message: 'Mobile number is available' });
      }
    } catch {
      // Backend register still enforces unique email & mobile strictly
    }

    setStep(2);
  };

  // Step 2 Category Selection & Single Subcategory Role
  const handleCategorySelect = (cat: any) => {
    setSelectedCategory(cat);
    if (cat.subcategories && cat.subcategories.length > 0) {
      setSelectedSubcategory(cat.subcategories[0]);
    }
    setDynamicAnswers({});
  };

  const handleSubcategorySelect = (sub: string) => {
    setSelectedSubcategory(sub);
    setDynamicAnswers({});
  };

  // Step 3 Dynamic Form Submit -> Audits every dynamic & address field
  const handleDynamicFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    for (const field of mergedDynamicFields) {
      const fErr = validateDynamicFieldClient(field, dynamicAnswers[field.key]);
      if (fErr) {
        setFieldError(`dyn_${field.key}`, fErr);
        setErrorMessage(fErr);
        return;
      }
      setFieldError(`dyn_${field.key}`, null);
    }

    const line1 = addressLine1.trim();
    if (line1.length < 5 || line1.length > 200) {
      const msg = 'Address Line 1 must be between 5 and 200 characters.';
      setFieldError('addressLine1', msg);
      setErrorMessage(msg);
      return;
    }
    setFieldError('addressLine1', null);

    if (addressLine2.trim().length > 200) {
      const msg = 'Address Line 2 cannot exceed 200 characters.';
      setFieldError('addressLine2', msg);
      setErrorMessage(msg);
      return;
    }
    setFieldError('addressLine2', null);

    if (landmark.trim().length > 120) {
      const msg = 'Landmark cannot exceed 120 characters.';
      setFieldError('landmark', msg);
      setErrorMessage(msg);
      return;
    }
    setFieldError('landmark', null);

    if (!pinCode.trim() || pinCode.trim().length < 6) {
      const msg = 'PIN Code must contain exactly 6 digits.';
      setPinCodeError(msg);
      setErrorMessage(msg);
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      const msg = 'Please enter a valid 6-digit Indian PIN Code.';
      setPinCodeError(msg);
      setErrorMessage(msg);
      return;
    }
    if (pinCodeError || country.trim().toLowerCase() !== 'india') {
      const msg = pinCodeError || 'This PIN Code is not recognised. Please verify and try again.';
      setPinCodeError(msg);
      setErrorMessage(msg);
      return;
    }
    setPinCodeError('');

    if (!stateName.trim()) {
      setErrorMessage('Please select your State.');
      return;
    }
    if (!district.trim()) {
      setErrorMessage('Please select your District.');
      return;
    }
    const cityErr = validateCityClient(city);
    if (cityErr) {
      setFieldError('city', cityErr);
      setErrorMessage(cityErr);
      return;
    }
    setFieldError('city', null);

    // Advance to Step 4: KYC Documents
    setStep(4);
  };

  // Step 4 KYC Documents Submit -> Validates Aadhaar/Alt ID, PAN, Category Docs & Custom Docs
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validate Primary Identity Section (Aadhaar Card)
    if (identityMode === 'AADHAAR') {
      const aadhaarErr = validateAadhaarClient(docNumbers['AADHAAR_CARD'] || '');
      if (aadhaarErr) {
        setDocError('AADHAAR_CARD_NUM', aadhaarErr);
        setErrorMessage(aadhaarErr);
        return;
      }
      setDocError('AADHAAR_CARD_NUM', null);
      if (!attachedFiles['AADHAAR_CARD']) {
        const msg = 'Please attach your Aadhaar Card copy (PDF, JPG, JPEG, or PNG up to 2 MB).';
        setDocError('AADHAAR_CARD', msg);
        setErrorMessage(msg);
        return;
      }
    } else {
      const altErr = validateAlternativeGovtIdClient(altGovtIdType, docNumbers['ALT_GOVT_ID'] || '');
      if (altErr) {
        setDocError('ALT_GOVT_ID_NUM', altErr);
        setErrorMessage(altErr);
        return;
      }
      setDocError('ALT_GOVT_ID_NUM', null);
      if (!attachedFiles['ALT_GOVT_ID']) {
        const msg = 'Please attach your Government Photo Identity copy (PDF, JPG, JPEG, or PNG up to 2 MB).';
        setDocError('ALT_GOVT_ID', msg);
        setErrorMessage(msg);
        return;
      }
    }

    // 2. Validate PAN Card Section (Mandatory)
    const panErr = validatePanClient(docNumbers['PAN_CARD'] || '');
    if (panErr) {
      setDocError('PAN_CARD_NUM', panErr);
      setErrorMessage(panErr);
      return;
    }
    setDocError('PAN_CARD_NUM', null);
    if (!attachedFiles['PAN_CARD']) {
      const msg = 'Please attach your PAN Card copy (PDF, JPG, JPEG, or PNG up to 2 MB).';
      setDocError('PAN_CARD', msg);
      setErrorMessage(msg);
      return;
    }

    // 3. Check Category / Role-Specific Dynamic Documents
    for (const doc of dynamicRoleDocs) {
      if (doc.required) {
        const isCollege = doc.hideDocNumber || doc.type === 'COLLEGE_ID' || doc.type.toLowerCase().includes('college') || doc.label.toLowerCase().includes('college id');
        if (!isCollege) {
          if (!docNumbers[doc.type]?.trim()) {
            const msg = `Please enter the document / registration number for "${doc.label}".`;
            setDocError(`${doc.type}_NUM`, msg);
            setErrorMessage(msg);
            return;
          }
          setDocError(`${doc.type}_NUM`, null);
        }
        if (!attachedFiles[doc.type]) {
          const msg = `Please attach the document file (max 2 MB) for "${doc.label}".`;
          setDocError(doc.type, msg);
          setErrorMessage(msg);
          return;
        }
      }
    }

    // 4. Check custom documents if user added any
    for (const cDoc of customDocs) {
      if (!cDoc.label.trim() || cDoc.label.trim().length < 2) {
        setErrorMessage('Please enter a valid document title (2+ characters) for your additional document.');
        return;
      }
      if (!cDoc.documentNumber.trim()) {
        setErrorMessage(`Please enter the registration or reference number for "${cDoc.label}".`);
        return;
      }
      if (!attachedFiles[cDoc.id]) {
        setErrorMessage(`Please attach the document file (max 2 MB) for "${cDoc.label}".`);
        return;
      }
    }

    setStep(5);
  };

  // Step 5 Trigger Razorpay Modal
  const handleInitiateRazorpay = () => {
    setShowRazorpayModal(true);
  };

  // Ensure account is registered and KYC documents are securely uploaded BEFORE Razorpay order creation
  const ensureRegistrationSessionAndUploadDocs = async (): Promise<string> => {
    const formattedDob = formatDisplayDob(dob);
    const userAddress: UserAddress = {
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      country: country.trim() || 'India',
      state: stateName.trim(),
      district: district.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      addressType: addressType || 'Residential'
    };

    if (!registeredSessionRef.current) {
      let token = '';
      let serverUser: any = null;

      try {
        const regResult = await registerAccountStrict({
          fullName: fullName.trim().replace(/\s+/g, ' '),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          dob: formattedDob || dob,
          password,
          confirmPassword,
          primaryCategoryId: selectedCategory.id,
          primaryCategoryName: selectedCategory.name,
          subCategory: selectedSubcategory,
          primarySubcategoryName: selectedSubcategory,
          subcategoryIds: [selectedSubcategory],
          dynamicProfile: dynamicAnswers,
          address: userAddress,
          ageConfirmed,
          termsAccepted
        });
        token = regResult.token;
        serverUser = regResult.user;
      } catch (regErr: any) {
        const msg = extractApiErrorMessage(regErr, '').toLowerCase();
        // Idempotent retry handling: if the account was created in a prior interrupted attempt,
        // authenticate with the supplied password instead of failing or duplicating records.
        if (msg.includes('already exists') || msg.includes('already registered')) {
          try {
            let loginRes = await apiRequest('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ identifier: email.trim(), password })
            });
            if (!(loginRes?.success && loginRes?.data?.token) && phoneNumber.trim()) {
              loginRes = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ identifier: phoneNumber.trim(), password })
              });
            }
            if (loginRes?.success && loginRes?.data?.token) {
              token = loginRes.data.token;
              serverUser = loginRes.data.user;
            } else {
              throw new Error('An account with this email or mobile number already exists. Please log in to continue.');
            }
          } catch {
            throw new Error(
              'An account with this email or mobile number already exists. Please sign in on the Login page or enter your existing password.'
            );
          }
        } else {
          throw new Error(extractApiErrorMessage(regErr, 'Unable to register account. Please review your details and retry.'));
        }
      }

      const isReferred = referrerInfo?.valid;
      const newRefCode = `FIC-${fullName.toUpperCase().replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const enrichedUser = {
        ...(serverUser || {}),
        primaryCategory: selectedCategory.name,
        categoryName: selectedCategory.name,
        subCategory: selectedSubcategory,
        primarySubcategoryName: selectedSubcategory,
        subcategories: [selectedSubcategory],
        subcategoryIds: [selectedSubcategory],
        dynamicProfile: dynamicAnswers,
        address: userAddress,
        personalInfo: {
          ...((serverUser && serverUser.personalInfo) || {}),
          dob: formattedDob || dob,
          address: `${userAddress.addressLine1}${userAddress.addressLine2 ? ', ' + userAddress.addressLine2 : ''}`,
          city: userAddress.city,
          district: userAddress.district,
          state: userAddress.state,
          pincode: userAddress.pinCode
        },
        professionalInfo: {
          ...((serverUser && serverUser.professionalInfo) || {}),
          roleTitle: selectedSubcategory
        },
        referralCode: newRefCode,
        referralSource: isReferred ? 'REFERRED' : 'ORGANIC',
        referredByCode: isReferred ? referralCode : undefined,
        referrerUserId: isReferred ? referrerInfo.referrerUserId : undefined
      };

      setAuthToken(token);
      setStoredUser(enrichedUser);
      saveRegisteredAccount(enrichedUser);
      registeredSessionRef.current = { token, user: enrichedUser };
    }

    const activeToken = registeredSessionRef.current.token;

    const primaryIdKey = identityMode === 'AADHAAR' ? 'AADHAAR_CARD' : 'ALT_GOVT_ID';
    const primaryIdLabel =
      identityMode === 'AADHAAR'
        ? 'Aadhaar Card'
        : altGovtIdType === 'PASSPORT'
        ? 'Passport (Govt Identity)'
        : altGovtIdType === 'VOTER_ID'
        ? 'Voter ID / EPIC (Govt Identity)'
        : 'Driving Licence (Govt Identity)';
    const primaryIdNumber =
      identityMode === 'AADHAAR'
        ? maskAadhaarDisplay(docNumbers['AADHAAR_CARD'] || '')
        : (docNumbers['ALT_GOVT_ID'] || '').trim().toUpperCase();

    const primaryIdSlot = attachedFiles[primaryIdKey];
    if (primaryIdSlot?.file && !uploadedAssetsRef.current[primaryIdKey]) {
      uploadedAssetsRef.current[primaryIdKey] = await uploadDocumentFile(primaryIdSlot.file, {
        entityType: 'KYC',
        documentCategory: 'KYC_IDENTITY',
        documentLabel: primaryIdLabel,
        documentNumber: primaryIdNumber,
        tokenOverride: activeToken
      });
    }

    const panSlot = attachedFiles['PAN_CARD'];
    if (panSlot?.file && !uploadedAssetsRef.current['PAN_CARD']) {
      uploadedAssetsRef.current['PAN_CARD'] = await uploadDocumentFile(panSlot.file, {
        entityType: 'KYC',
        documentCategory: 'KYC_IDENTITY',
        documentLabel: 'PAN Card',
        documentNumber: (docNumbers['PAN_CARD'] || '').trim().toUpperCase(),
        tokenOverride: activeToken
      });
    }

    for (const doc of dynamicRoleDocs) {
      const slot = attachedFiles[doc.type];
      if (slot?.file && !uploadedAssetsRef.current[doc.type]) {
        const asset = await uploadDocumentFile(slot.file, {
          entityType: 'KYC',
          documentCategory: 'KYC_BUSINESS',
          documentLabel: doc.label,
          documentNumber: docNumbers[doc.type] || '',
          tokenOverride: activeToken
        });
        uploadedAssetsRef.current[doc.type] = asset;
      }
    }

    for (const cDoc of customDocs) {
      const slot = attachedFiles[cDoc.id];
      if (slot?.file && !uploadedAssetsRef.current[cDoc.id]) {
        const asset = await uploadDocumentFile(slot.file, {
          entityType: 'KYC',
          documentCategory: 'KYC_BUSINESS',
          documentLabel: cDoc.label,
          documentNumber: cDoc.documentNumber || '',
          tokenOverride: activeToken
        });
        uploadedAssetsRef.current[cDoc.id] = asset;
      }
    }

    return activeToken;
  };

  // Executed ONLY after backend HMAC-SHA256 verification succeeds
  const handleRazorpaySuccess = async (paymentResult: {
    paymentId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    method: string;
  }) => {
    setShowRazorpayModal(false);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = registeredSessionRef.current;
      const token = session?.token;

      const primaryIdKey = identityMode === 'AADHAAR' ? 'AADHAAR_CARD' : altGovtIdType;
      const primarySlotKey = identityMode === 'AADHAAR' ? 'AADHAAR_CARD' : 'ALT_GOVT_ID';
      const primaryUploaded = uploadedAssetsRef.current[primarySlotKey];
      const panUploaded = uploadedAssetsRef.current['PAN_CARD'];

      const identityDocItems = [
        {
          docKey: primaryIdKey,
          documentId: primaryUploaded?.documentId,
          documentType: primaryIdKey,
          documentName:
            identityMode === 'AADHAAR'
              ? 'Aadhaar Card'
              : altGovtIdType === 'PASSPORT'
              ? 'Passport (Govt Identity)'
              : altGovtIdType === 'VOTER_ID'
              ? 'Voter ID / EPIC (Govt Identity)'
              : 'Driving Licence (Govt Identity)',
          documentNumber:
            identityMode === 'AADHAAR'
              ? maskAadhaarDisplay(docNumbers['AADHAAR_CARD'] || '')
              : (docNumbers['ALT_GOVT_ID'] || '').trim().toUpperCase(),
          fileName: primaryUploaded?.originalFileName || attachedFiles[primarySlotKey]?.name || '',
          fileUrl: primaryUploaded?.viewUrl || ''
        },
        {
          docKey: 'PAN_CARD',
          documentId: panUploaded?.documentId,
          documentType: 'PAN_CARD',
          documentName: 'PAN Card',
          documentNumber: (docNumbers['PAN_CARD'] || '').trim().toUpperCase(),
          fileName: panUploaded?.originalFileName || attachedFiles['PAN_CARD']?.name || '',
          fileUrl: panUploaded?.viewUrl || ''
        }
      ];

      const roleDocItems = dynamicRoleDocs
        .filter((doc) => Boolean(uploadedAssetsRef.current[doc.type] || attachedFiles[doc.type]))
        .map((doc) => {
          const uploaded = uploadedAssetsRef.current[doc.type];
          return {
            docKey: doc.type,
            documentId: uploaded?.documentId,
            documentType: doc.type,
            documentName: doc.label,
            documentNumber: docNumbers[doc.type] || '',
            fileName: uploaded?.originalFileName || attachedFiles[doc.type]?.name || '',
            fileUrl: uploaded?.viewUrl || ''
          };
        });

      const defaultDocItems = [...identityDocItems, ...roleDocItems];

      const customDocItems = customDocs.map((cDoc) => {
        const uploaded = uploadedAssetsRef.current[cDoc.id];
        return {
          documentId: uploaded?.documentId,
          documentType: 'ADDITIONAL_PROOF',
          documentName: cDoc.label,
          documentNumber: cDoc.documentNumber,
          fileName: uploaded?.originalFileName || attachedFiles[cDoc.id]?.name || '',
          fileUrl: uploaded?.viewUrl || ''
        };
      });

      const allDocItems = [...defaultDocItems, ...customDocItems];

      await submitKycApplicationStrict(
        {
          categoryId: selectedCategory.id,
          documents: allDocItems
        },
        token
      );

      if (session?.user) {
        const updatedUser = {
          ...session.user,
          isMembershipActive: true,
          isKycApproved: false,
          kycStatus: 'PENDING',
          uploadedDocumentsCount: allDocItems.length,
          paymentDetails: {
            paymentId: paymentResult.razorpayPaymentId || paymentResult.paymentId,
            orderId: paymentResult.razorpayOrderId,
            amount: 99,
            method: paymentResult.method
          },
          submittedDocuments: allDocItems.map((doc) => ({
            documentId: doc.documentId,
            type: doc.documentType,
            name: doc.documentName,
            fileName: doc.fileName,
            status: 'PENDING',
            uploadedAt: 'On Registration'
          }))
        };
        setStoredUser(updatedUser);
      }

      setPaymentDone(true);
      setIsLoading(false);
      setStep(6);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        extractApiErrorMessage(
          err,
          'Payment succeeded, but KYC submission encountered an error. Please retry submitting.'
        )
      );
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
                {/* Verified Referral Banner */}
                {referrerInfo?.valid && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <CheckCircleIcon size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">Referred by FIC Member</span>
                        <span className="text-[11px] text-emerald-700">
                          {referrerInfo.referrerName} (Referral Code: {referralCode})
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-200 text-emerald-800 font-bold text-[10.5px]">
                      Attribution Active
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <Input
                    label="Full Legal Name"
                    placeholder="e.g. S. Moorthy"
                    value={fullName}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setFullName(val);
                      if (val.trim()) setFieldError('fullName', validateFullNameClient(val));
                      else setFieldError('fullName', null);
                    }}
                    onBlur={() => setFieldError('fullName', validateFullNameClient(fullName))}
                    required
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      onBlur={() => {
                        const fmtErr = validateEmailClient(email);
                        if (fmtErr) setFieldError('email', fmtErr);
                      }}
                      required
                    />
                    {emailAvail.status === 'checking' && (
                      <p className="text-[11px] text-[#77786E]">Checking email availability...</p>
                    )}
                    {emailAvail.status === 'available' && (
                      <p className="text-[11px] text-emerald-700 font-semibold">✓ {emailAvail.message}</p>
                    )}
                    {(fieldErrors.email || emailAvail.status === 'taken' || (emailAvail.status === 'invalid' && email.length > 0)) && (
                      <p className="text-[11px] text-red-600 font-semibold">
                        {fieldErrors.email || emailAvail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      label="10-Digit Mobile Number"
                      placeholder="9876543210"
                      value={phoneNumber}
                      maxLength={10}
                      onChange={(e: any) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={() => {
                        const fmtErr = validateMobileClient(phoneNumber);
                        if (fmtErr) setFieldError('phoneNumber', fmtErr);
                      }}
                      required
                    />
                    {mobileAvail.status === 'checking' && (
                      <p className="text-[11px] text-[#77786E]">Checking mobile availability...</p>
                    )}
                    {mobileAvail.status === 'available' && (
                      <p className="text-[11px] text-emerald-700 font-semibold">✓ {mobileAvail.message}</p>
                    )}
                    {(fieldErrors.phoneNumber || mobileAvail.status === 'taken') && (
                      <p className="text-[11px] text-red-600 font-semibold">
                        {fieldErrors.phoneNumber || mobileAvail.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date of Birth & 18+ Adult Policy Validation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#29302D] block">
                      Date of Birth (DOB) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#77786E] font-medium">
                      Must be 18+ years old
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      min={minDobAllowed}
                      max={maxDobAllowed}
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white transition-colors ${
                        dobValidationError
                          ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                          : dobAge !== null && dobAge >= 18
                          ? 'border-emerald-400 focus:ring-emerald-500 bg-emerald-50/20'
                          : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                      }`}
                      required
                    />
                  </div>

                  {dobValidationError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold flex items-center gap-2 mt-1 animate-slide-down">
                      <span>⚠</span>
                      <span>{dobValidationError}</span>
                    </div>
                  )}

                  {dob && !dobValidationError && dobAge !== null && dobAge >= 18 && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 mt-1">
                      <CheckCircleIcon size={14} className="text-emerald-600" />
                      <span>Age Verified: {dobAge} Years Old (Adult 18+ Compliant)</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const { checks, error: pwdErr } = evaluatePasswordStrength(password);
                  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;
                  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password && !pwdErr;
                  return (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#29302D] block">
                          Create Secure Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Minimum 8 chars with A-Z, a-z, 0-9 & symbol"
                            className={`w-full text-xs px-3.5 py-2.5 pr-10 border rounded-xl focus:outline-none focus:ring-2 bg-white transition-colors ${
                              fieldErrors.password
                                ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                            value={password}
                            onChange={(e) => {
                              const nextPwd = e.target.value;
                              setPassword(nextPwd);
                              if (nextPwd) setFieldError('password', evaluatePasswordStrength(nextPwd).error);
                              else setFieldError('password', null);
                              if (confirmPassword) {
                                setFieldError('confirmPassword', nextPwd !== confirmPassword ? 'Passwords do not match.' : null);
                              }
                            }}
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
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            { ok: checks.minLength, label: '8+ chars' },
                            { ok: checks.hasUpper, label: 'Uppercase A–Z' },
                            { ok: checks.hasLower, label: 'Lowercase a–z' },
                            { ok: checks.hasDigit, label: 'Number 0–9' },
                            { ok: checks.hasSpecial, label: 'Special char (@#!)' }
                          ].map((rule) => (
                            <span
                              key={rule.label}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                                rule.ok
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-[#FAF7F2] text-[#77786E] border-[#E8DBC8]'
                              }`}
                            >
                              {rule.ok ? '✓ ' : ''}{rule.label}
                            </span>
                          ))}
                        </div>
                        {fieldErrors.password && (
                          <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.password}</p>
                        )}
                      </div>

                      {/* Confirm Password directly below Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#29302D] block">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            className={`w-full text-xs px-3.5 py-2.5 pr-10 border rounded-xl focus:outline-none focus:ring-2 bg-white transition-colors ${
                              passwordsMismatch || fieldErrors.confirmPassword
                                ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                : passwordsMatch
                                ? 'border-emerald-400 focus:ring-emerald-400 bg-emerald-50/20'
                                : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                            value={confirmPassword}
                            onChange={(e) => {
                              const nextConfirm = e.target.value;
                              setConfirmPassword(nextConfirm);
                              setFieldError(
                                'confirmPassword',
                                nextConfirm && nextConfirm !== password ? 'Passwords do not match.' : null
                              );
                            }}
                            onBlur={() => {
                              if (confirmPassword && confirmPassword !== password) {
                                setFieldError('confirmPassword', 'Passwords do not match.');
                              }
                            }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77786E] hover:text-[#29302D] p-1 transition-colors"
                            title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                        {(passwordsMismatch || fieldErrors.confirmPassword) && (
                          <p className="text-[11px] text-red-600 font-semibold">
                            {fieldErrors.confirmPassword || 'Passwords do not match.'}
                          </p>
                        )}
                        {passwordsMatch && (
                          <p className="text-[11px] text-emerald-700 font-semibold">✓ Passwords match.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Referral Code input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#29302D] block">
                      Referral Code {refParam ? '(Bound from Referral Link)' : '(Optional)'}
                    </label>
                    {referrerInfo?.valid && (
                      <span className="text-[11px] text-emerald-600 font-bold">✓ Active Referral</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. FIC-KATHIR-7782"
                    value={referralCode}
                    disabled={!!refParam}
                    onChange={(e) => handleManualReferralCheck(e.target.value)}
                    className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none transition-colors uppercase ${
                      referrerInfo?.valid
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 font-bold'
                        : 'border-[#E8DBC8] bg-white text-[#29302D]'
                    }`}
                  />
                  {referralCode && !referrerInfo?.valid && (
                    <span className="text-[11px] text-[#77786E] block">
                      No matching referrer found. Will be processed as organic registration.
                    </span>
                  )}
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
                  {categoriesList.map((cat) => {
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

                {/* Subcategory Roles Selector - Strictly Single Selection */}
                <div className="pt-4 border-t border-[#E8DBC8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#29302D] uppercase tracking-wider">
                      Select Primary Subcategory Role in {selectedCategory.name}:
                    </span>
                    <span className="text-[11px] text-[#C66B52] font-black">
                      Select exactly one primary role (Strictly 1)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {selectedCategory.subcategories.map((sub) => {
                      const isSubSelected = selectedSubcategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => handleSubcategorySelect(sub)}
                          className={`text-xs px-3.5 py-3 rounded-xl border font-bold transition-all flex items-center justify-between text-left cursor-pointer ${
                            isSubSelected
                              ? 'bg-[#8064A9] text-white border-[#8064A9] shadow-md scale-[1.01]'
                              : 'bg-white text-[#29302D] border-[#E8DBC8] hover:border-[#8064A9]/40 hover:bg-[#F9F5FD]'
                          }`}
                        >
                          <span className="truncate pr-2">{sub}</span>
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSubSelected ? 'border-white bg-white' : 'border-[#B8AABF] bg-white'
                            }`}
                          >
                            {isSubSelected && <span className="w-2 h-2 rounded-full bg-[#8064A9]" />}
                          </span>
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
            STEP 3: CONFIGURATION-DRIVEN DYNAMIC FORM (TAILORED TO SUBCATEGORY)
           ======================================================== */}
        {step === 3 && (
          <div className="animate-step-in">
            <Card
              title={`${subcategoryConfig.roleTitle}`}
              subtitle={`Step 3 of 6: Dynamic profile questions for ${selectedSubcategory}`}
              className="shadow-sm border border-[#E8DBC8] bg-white rounded-2xl"
            >
              <form onSubmit={handleDynamicFormSubmit} className="space-y-5">
                {/* Sector & Role Header Pill */}
                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8064A9] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {renderCategoryIcon(selectedCategory.iconName, 20)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#C66B52] bg-white px-2 py-0.5 rounded border border-[#E58C72]/30">
                        {subcategoryConfig.roleBadge}
                      </span>
                      <span className="text-xs font-bold text-[#29302D]">
                        {selectedCategory.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#77786E] block mt-0.5">
                      Selected Primary Role: <strong>{selectedSubcategory}</strong>
                    </span>
                  </div>
                </div>

                {/* Role-Specific Dynamic Fields (Subcategory + Live Category Custom Fields) */}
                <div className="space-y-4">
                  {mergedDynamicFields.map((field) => {
                    const errKey = `dyn_${field.key}`;
                    const hasErr = Boolean(fieldErrors[errKey]);
                    const handleDynChange = (val: string) => {
                      setDynamicAnswers({ ...dynamicAnswers, [field.key]: val });
                      setFieldError(errKey, val ? validateDynamicFieldClient(field, val) : null);
                    };
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-[#29302D] block">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.helperText && (
                            <span className="text-[10px] text-[#77786E]">{field.helperText}</span>
                          )}
                        </div>

                        {field.type === 'select' ? (
                          <select
                            className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                              hasErr ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                            value={dynamicAnswers[field.key] || ''}
                            onChange={(e) => handleDynChange(e.target.value)}
                            required={field.required}
                          >
                            <option value="">-- Select an option --</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            rows={3}
                            className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                              hasErr ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                            value={dynamicAnswers[field.key] || ''}
                            onChange={(e) => handleDynChange(e.target.value)}
                            onBlur={() => setFieldError(errKey, validateDynamicFieldClient(field, dynamicAnswers[field.key]))}
                            required={field.required}
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                              hasErr ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                            value={dynamicAnswers[field.key] || ''}
                            onChange={(e) => handleDynChange(e.target.value)}
                            onBlur={() => setFieldError(errKey, validateDynamicFieldClient(field, dynamicAnswers[field.key]))}
                            required={field.required}
                          />
                        )}
                        {hasErr && (
                          <p className="text-[11px] text-red-600 font-semibold">{fieldErrors[errKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ========================================================
                    RESIDENTIAL ADDRESS & LOCATION SECTION
                   ======================================================== */}
                <div className="pt-6 border-t border-[#E8DBC8] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#29302D] flex items-center gap-2">
                        <span>Residential Address & Location</span>
                      </h4>
                      <p className="text-[11px] text-[#77786E] mt-0.5">
                        Official contact address for member verification, KYC compliance and correspondence.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-wider text-[#8064A9] bg-[#8064A9]/10 px-2 py-0.5 rounded border border-[#8064A9]/20">
                      Verified Address
                    </span>
                  </div>

                  {/* Address Type Selection */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-[#29302D]">Address Type:</span>
                    {(['Residential', 'Business', 'Other'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          addressType === type
                            ? 'bg-[#29302D] text-white shadow-2xs'
                            : 'bg-white border border-[#E8DBC8] text-[#77786E] hover:text-[#29302D]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Address Line 1 */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#29302D] block">
                      Address Line 1 (Flat, House / Door No., Building, Street) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., No. 42, Anna Salai"
                      value={addressLine1}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddressLine1(val);
                        if (val.trim().length >= 5) setFieldError('addressLine1', null);
                      }}
                      onBlur={() => {
                        const len = addressLine1.trim().length;
                        setFieldError('addressLine1', len < 5 || len > 200 ? 'Address Line 1 must be between 5 and 200 characters.' : null);
                      }}
                      required
                      className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                        fieldErrors.addressLine1 ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                      }`}
                    />
                    {fieldErrors.addressLine1 && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.addressLine1}</p>
                    )}
                  </div>

                  {/* Address Line 2 & Landmark */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        Address Line 2 (Area, Locality, Sector) <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Teynampet"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Near DMS Metro Station"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white"
                      />
                    </div>
                  </div>

                  {/* PIN Code (6 Digits) - Directly below Address Line 2; auto-fills Country, State, District & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        PIN Code (6 Digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="e.g., 600028"
                        value={pinCode}
                        onChange={(e) => {
                          void handlePinCodeInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!pinCode.trim()) {
                            setPinCodeError('PIN Code must contain exactly 6 digits.');
                          } else if (/[^0-9]/.test(pinCode.trim()) || pinCode.trim().startsWith('0')) {
                            setPinCodeError('Please enter a valid 6-digit Indian PIN Code.');
                          } else if (pinCode.trim().length < 6) {
                            setPinCodeError('PIN Code must contain exactly 6 digits.');
                          }
                        }}
                        required
                        className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                          pinCodeError
                            ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                            : 'border-[#E8DBC8] focus:ring-[#C66B52] bg-white'
                        }`}
                      />
                      {isLookingUpPin && (
                        <p className="text-[11px] text-amber-700 font-medium">
                          Verifying Indian PIN code &amp; auto-filling location...
                        </p>
                      )}
                      {!isLookingUpPin && pinLookupInfo && !pinCodeError && (
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          ✓ {pinLookupInfo}
                        </p>
                      )}
                      {pinCodeError && (
                        <p className="text-[11px] text-red-600 font-semibold">{pinCodeError}</p>
                      )}
                    </div>
                  </div>

                  {/* Country, State, District & City (Auto-filled from PIN Code) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={country}
                        placeholder="Auto-filled from PIN"
                        readOnly
                        className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        State <span className="text-red-500">*</span>
                      </label>
                      {(() => {
                        const baseStates = getIndianStates();
                        const stateOptions =
                          stateName && !baseStates.includes(stateName) ? [stateName, ...baseStates] : baseStates;
                        return (
                          <select
                            value={stateName}
                            onChange={(e) => handleStateChange(e.target.value)}
                            required
                            className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white"
                          >
                            <option value="">-- Select State --</option>
                            {stateOptions.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        District <span className="text-red-500">*</span>
                      </label>
                      {(() => {
                        const baseDistricts = getDistrictsForState(stateName);
                        const districtOptions =
                          district && !baseDistricts.includes(district)
                            ? [district, ...baseDistricts]
                            : baseDistricts;
                        return (
                          <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            required
                            className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white"
                          >
                            <option value="">-- Select District --</option>
                            {districtOptions.map((dist) => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#29302D] block">
                        City / Town / Village <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Chennai"
                        value={city}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCity(val);
                          if (val.trim()) setFieldError('city', validateCityClient(val));
                        }}
                        onBlur={() => setFieldError('city', validateCityClient(city))}
                        required
                        className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                          fieldErrors.city ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                        }`}
                      />
                      {fieldErrors.city && (
                        <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.city}</p>
                      )}
                    </div>
                  </div>
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
              title={`KYC Documents for ${selectedSubcategory}`}
              subtitle={`Step 4 of 6: Upload verification documents to activate your ${selectedSubcategory} workspace`}
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
                        Verification Guidelines for {selectedSubcategory} ({selectedCategory.name})
                      </h4>
                      <p className="text-[11px] text-[#77786E]">
                        Basic mandatory and recommended documents for your role are listed below.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#29302D] leading-relaxed pt-1 border-t border-[#E8DBC8]">
                    📌 <strong>Mandatory Identity & Category Proofs:</strong> Upload separate files for <strong>Aadhaar Card</strong> (or an Alternative Govt ID), <strong>PAN Card</strong>, and your role-specific certificates. Accepted formats: <strong>PDF, JPG, JPEG, PNG</strong> (Strict limit: <strong>2 MB max per file</strong>). Duplicate files are automatically blocked.
                  </p>
                  <p className="text-xs text-[#77786E] leading-relaxed">
                    💡 <strong>Additional Documents:</strong> Need to attach extra supporting proofs (e.g. GST Certificate, Trade License, FSSAI, MSME)? Click <strong>"+ Add Document"</strong> on the right!
                  </p>
                </div>

                {/* 1. Separate Aadhaar & PAN Verification Sections + Category Role Docs */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#29302D] uppercase tracking-wider block">
                      Core Identity & Role KYC Verification ({selectedSubcategory}):
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

                  {/* SECTION A: AADHAAR CARD (WITH UIDAI COMPLIANT ALTERNATIVE GOVT ID TOGGLE) */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E8DBC8] bg-[#FCFAF6] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#29302D] block">
                          {identityMode === 'AADHAAR' ? '1. Aadhaar Card (Identity & 18+ Verification)' : '1. Alternative Government Photo Identity'}
                        </span>
                        <span className="text-[11px] text-[#77786E]">
                          {identityMode === 'AADHAAR'
                            ? 'Enter your 12-digit Aadhaar number (stored masked as XXXX-XXXX-NNNN per UIDAI guidelines).'
                            : 'UIDAI-compliant alternative KYC photo identity verification.'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextMode = identityMode === 'AADHAAR' ? 'ALT_GOVT_ID' : 'AADHAAR';
                            setIdentityMode(nextMode);
                            setErrorMessage('');
                          }}
                          className="text-[11px] font-bold text-[#8064A9] hover:underline px-2.5 py-1 rounded-lg bg-[#8064A9]/10 border border-[#8064A9]/20"
                        >
                          {identityMode === 'AADHAAR' ? 'Use Alternative Govt ID Instead' : 'Switch to Aadhaar Card'}
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C66B52]/15 text-[#C66B52] border border-[#C66B52]/30">
                          Required
                        </span>
                      </div>
                    </div>

                    {identityMode === 'AADHAAR' ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-[#29302D] block">
                              12-Digit Aadhaar Number <span className="text-red-500">*</span>
                            </label>
                            {!validateAadhaarClient(docNumbers['AADHAAR_CARD'] || '') && (
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Masked: {maskAadhaarDisplay(docNumbers['AADHAAR_CARD'] || '')}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={12}
                            placeholder="Enter 12-digit Aadhaar number (e.g., 987654321012)"
                            className={`w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 ${
                              docFieldErrors['AADHAAR_CARD_NUM'] ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                            value={docNumbers['AADHAAR_CARD'] || ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                              setDocNumbers({ ...docNumbers, AADHAAR_CARD: digits });
                              if (digits.length === 12) setDocError('AADHAAR_CARD_NUM', validateAadhaarClient(digits));
                              else setDocError('AADHAAR_CARD_NUM', null);
                            }}
                            onBlur={() => {
                              if (docNumbers['AADHAAR_CARD']) {
                                setDocError('AADHAAR_CARD_NUM', validateAadhaarClient(docNumbers['AADHAAR_CARD']));
                              }
                            }}
                          />
                          {docFieldErrors['AADHAAR_CARD_NUM'] && (
                            <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors['AADHAAR_CARD_NUM']}</p>
                          )}
                        </div>

                        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E8DBC8] cursor-pointer text-[11px] text-[#29302D]">
                          <input
                            type="checkbox"
                            checked={aadhaarConsent}
                            onChange={(e) => {
                              setAadhaarConsent(e.target.checked);
                              if (e.target.checked) setDocError('AADHAAR_CONSENT', null);
                            }}
                            className="mt-0.5 rounded text-[#C66B52] h-4 w-4"
                          />
                          <span>
                            I voluntarily submit my Aadhaar copy and masked last-4 digits for FIC identity & age verification in accordance with UIDAI guidelines.
                          </span>
                        </label>
                        {docFieldErrors['AADHAAR_CONSENT'] && (
                          <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors['AADHAAR_CONSENT']}</p>
                        )}
                      </>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#29302D] block">
                            Select Government ID Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={altGovtIdType}
                            onChange={(e) => setAltGovtIdType(e.target.value as any)}
                            className="w-full text-xs px-3.5 py-2.5 border border-[#E8DBC8] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                          >
                            <option value="PASSPORT">Indian Passport</option>
                            <option value="VOTER_ID">Voter ID (EPIC)</option>
                            <option value="DRIVING_LICENCE">Driving Licence</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#29302D] block">
                            ID Document Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder={altGovtIdType === 'PASSPORT' ? 'e.g. A1234567' : altGovtIdType === 'VOTER_ID' ? 'e.g. ABC1234567' : 'e.g. TN0120200012345'}
                            value={docNumbers['ALT_GOVT_ID'] || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setDocNumbers({ ...docNumbers, ALT_GOVT_ID: val });
                              if (val) setDocError('ALT_GOVT_ID_NUM', validateAlternativeGovtIdClient(altGovtIdType, val));
                            }}
                            className={`w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white uppercase focus:outline-none focus:ring-2 ${
                              docFieldErrors['ALT_GOVT_ID_NUM'] ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                            }`}
                          />
                          {docFieldErrors['ALT_GOVT_ID_NUM'] && (
                            <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors['ALT_GOVT_ID_NUM']}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {(() => {
                      const slotKey = identityMode === 'AADHAAR' ? 'AADHAAR_CARD' : 'ALT_GOVT_ID';
                      const isAttached = !!attachedFiles[slotKey];
                      const fileInfo = attachedFiles[slotKey];
                      return (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-[#29302D] block">
                            Attach {identityMode === 'AADHAAR' ? 'Aadhaar Card' : 'Government ID'} Copy (PDF, JPG, JPEG, PNG • Max 2 MB) <span className="text-red-500">*</span>
                          </label>
                          {isAttached ? (
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/50">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-lg bg-[#D99B43]/20 text-[#B87A28] flex items-center justify-center shrink-0">
                                  <FileTextIcon size={20} />
                                </div>
                                <div className="truncate">
                                  <span className="text-xs font-bold text-[#29302D] block truncate">{fileInfo.name}</span>
                                  <span className="text-[11px] text-[#B87A28] font-medium flex items-center gap-1 mt-0.5">
                                    <CheckCircleIcon size={13} /> {fileInfo.size} • File Attached & Ready
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs font-semibold text-[#C66B52] hover:underline cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-[#E8DBC8] shadow-xs">
                                  Change
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(slotKey, e, ['pdf', 'jpg', 'jpeg', 'png'])}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(slotKey)}
                                  className="p-1 text-[#77786E] hover:text-red-600"
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
                                    Upload {identityMode === 'AADHAAR' ? 'Aadhaar Card' : 'Govt ID'} file
                                  </span>
                                  <span className="text-[11px] text-[#77786E]">
                                    Supports PDF, JPG, JPEG, PNG (Max 2 MB)
                                  </span>
                                </div>
                              </div>
                              <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#C66B52] hover:bg-[#D99B43] text-white rounded-lg shrink-0 shadow-sm">
                                Attach Document
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => handleFileChange(slotKey, e, ['pdf', 'jpg', 'jpeg', 'png'])}
                              />
                            </label>
                          )}
                          {docFieldErrors[slotKey] && (
                            <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors[slotKey]}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION B: MANDATORY PAN CARD VERIFICATION (SEPARATE FROM AADHAAR) */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E8DBC8] bg-[#FCFAF6] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#29302D] block">2. PAN Card (Permanent Account Number)</span>
                        <span className="text-[11px] text-[#77786E]">
                          Required separately for statutory identity and tax compliance.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C66B52]/15 text-[#C66B52] border border-[#C66B52]/30">
                        Required
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#29302D] block">
                        10-Character PAN Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. ABCDE1234F"
                        className={`w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white uppercase font-mono focus:outline-none focus:ring-2 ${
                          docFieldErrors['PAN_CARD_NUM'] ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                        }`}
                        value={docNumbers['PAN_CARD'] || ''}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                          setDocNumbers({ ...docNumbers, PAN_CARD: val });
                          if (val.length === 10) setDocError('PAN_CARD_NUM', validatePanClient(val));
                          else setDocError('PAN_CARD_NUM', null);
                        }}
                        onBlur={() => {
                          if (docNumbers['PAN_CARD']) setDocError('PAN_CARD_NUM', validatePanClient(docNumbers['PAN_CARD']));
                        }}
                        required
                      />
                      {docFieldErrors['PAN_CARD_NUM'] && (
                        <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors['PAN_CARD_NUM']}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-[#29302D] block">
                        Attach PAN Card File (PDF, JPG, JPEG, PNG • Max 2 MB) <span className="text-red-500">*</span>
                      </label>
                      {attachedFiles['PAN_CARD'] ? (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/50">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-lg bg-[#D99B43]/20 text-[#B87A28] flex items-center justify-center shrink-0">
                              <FileTextIcon size={20} />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold text-[#29302D] block truncate">{attachedFiles['PAN_CARD'].name}</span>
                              <span className="text-[11px] text-[#B87A28] font-medium flex items-center gap-1 mt-0.5">
                                <CheckCircleIcon size={13} /> {attachedFiles['PAN_CARD'].size} • File Attached & Ready
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-xs font-semibold text-[#C66B52] hover:underline cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-[#E8DBC8] shadow-xs">
                              Change
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => handleFileChange('PAN_CARD', e, ['pdf', 'jpg', 'jpeg', 'png'])}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile('PAN_CARD')}
                              className="p-1 text-[#77786E] hover:text-red-600"
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
                                Click to browse or drop PAN card file
                              </span>
                              <span className="text-[11px] text-[#77786E]">
                                Supports PDF, JPG, JPEG, PNG (Max 2 MB)
                              </span>
                            </div>
                          </div>
                          <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#C66B52] hover:bg-[#D99B43] text-white rounded-lg shrink-0 shadow-sm">
                            Attach Document
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileChange('PAN_CARD', e, ['pdf', 'jpg', 'jpeg', 'png'])}
                          />
                        </label>
                      )}
                      {docFieldErrors['PAN_CARD'] && (
                        <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors['PAN_CARD']}</p>
                      )}
                    </div>
                  </div>

                  {/* SECTION C: CATEGORY & SUBCATEGORY SPECIFIC DYNAMIC DOCUMENTS */}
                  {dynamicRoleDocs.map((doc, i) => {
                    const isAttached = !!attachedFiles[doc.type];
                    const fileInfo = attachedFiles[doc.type];
                    const allowedExts = doc.allowedExtensions || ['pdf', 'jpg', 'jpeg', 'png'];
                    const acceptAttr = allowedExts.map((x) => `.${x}`).join(',');

                    return (
                      <div
                        key={doc.type || i}
                        className="p-4 sm:p-5 rounded-xl border border-[#E8DBC8] bg-[#FCFAF6] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#29302D] block">{i + 3}. {doc.label}</span>
                            {doc.description && (
                              <span className="text-[11px] text-[#77786E]">{doc.description}</span>
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

                        {!doc.hideDocNumber && !doc.type.toLowerCase().includes('college') && !doc.label.toLowerCase().includes('college id') && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-[#29302D] block">
                              Document / Registration Number {doc.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. GSTIN / Udyam / License / Certificate Reg No."
                              className={`w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 ${
                                docFieldErrors[`${doc.type}_NUM`] ? 'border-red-400 focus:ring-red-400' : 'border-[#E8DBC8] focus:ring-[#C66B52]'
                              }`}
                              value={docNumbers[doc.type] || ''}
                              onChange={(e) => {
                                setDocNumbers({ ...docNumbers, [doc.type]: e.target.value });
                                if (e.target.value.trim()) setDocError(`${doc.type}_NUM`, null);
                              }}
                              required={doc.required}
                            />
                            {docFieldErrors[`${doc.type}_NUM`] && (
                              <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors[`${doc.type}_NUM`]}</p>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-[#29302D] block">
                            Attach Document File ({allowedExts.join(', ').toUpperCase()} • Max 2 MB) {doc.required && <span className="text-red-500">*</span>}
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
                                    accept={acceptAttr}
                                    className="hidden"
                                    onChange={(e) => handleFileChange(doc.type, e, allowedExts)}
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
                                    Supports {allowedExts.join(', ').toUpperCase()} (Max 2 MB)
                                  </span>
                                </div>
                              </div>
                              <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#C66B52] hover:bg-[#D99B43] text-white rounded-lg shrink-0 shadow-sm transition-colors">
                                Attach Document
                              </span>
                              <input
                                type="file"
                                accept={acceptAttr}
                                className="hidden"
                                onChange={(e) => handleFileChange(doc.type, e, allowedExts)}
                              />
                            </label>
                          )}
                          {docFieldErrors[doc.type] && (
                            <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors[doc.type]}</p>
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
                              Attach Document File (PDF, JPG, JPEG, PNG • Max 2 MB) *
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
                                      accept=".pdf,.jpg,.jpeg,.png"
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
                                      Supports PDF, JPG, JPEG, PNG (Max 2 MB)
                                    </span>
                                  </div>
                                </div>
                                <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#8064A9] hover:bg-[#8064A9]/90 text-white rounded-lg shrink-0 shadow-sm transition-colors">
                                  Attach Document
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(cDoc.id, e)}
                                />
                              </label>
                            )}
                            {docFieldErrors[cDoc.id] && (
                              <p className="text-[11px] text-red-600 font-semibold">{docFieldErrors[cDoc.id]}</p>
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
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#D99B43]">₹{membershipPrice}</span>
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
                      <span className="font-semibold text-[#29302D]">Primary Role:</span> {selectedSubcategory}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E8DBC8] space-y-1">
                    <span className="text-[11px] font-bold text-[#29302D] block">
                      Uploaded Documents for FIC Review:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subcategoryConfig.kycDocuments.map((doc, i) => (
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
                    <strong>₹{membershipPrice}.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>GST & Transaction Processing:</span>
                    <span className="text-[#8064A9] font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-[#E8DBC8] text-sm font-bold text-[#29302D]">
                    <span>Total Amount Payable:</span>
                    <span className="text-[#C66B52]">₹{membershipPrice}.00</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#77786E]">
                  <ShieldCheckIcon size={16} className="text-[#D99B43] shrink-0" />
                  <span>Secured by Razorpay • Instant UPI, Cards, NetBanking with 256-bit encryption.</span>
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
                    onClick={handleInitiateRazorpay}
                  >
                    Pay ₹{membershipPrice} via Razorpay & Submit
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

                {/* Explicit Activation Status Breakdown */}
                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/40 text-left space-y-2.5">
                  <div className="text-xs font-bold text-[#8064A9] uppercase tracking-wider">
                    Activation Status Breakdown
                  </div>
                  <div className="space-y-1.5 text-xs text-[#29302D]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#77786E]">1. Registration Status:</span>
                      <strong className="text-emerald-700 font-semibold">Registration Submitted Successfully</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#77786E]">2. Payment Status:</span>
                      <strong className="text-emerald-700 font-semibold">1st Year Pass Paid (₹99)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#77786E]">3. KYC Status:</span>
                      <strong className="text-amber-700 font-semibold">Under Admin Verification</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#77786E]">4. Membership Status:</span>
                      <strong className="text-[#8064A9] font-semibold">Active</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#77786E]">5. Dashboard Access Status:</span>
                      <strong className="text-rose-600 font-semibold">Locked – Awaiting Admin KYC Verification</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#D99B43]/30 text-[11px] text-[#77786E] leading-relaxed">
                    <em>Your KYC documents are awaiting Admin verification. Your dashboard will be activated after all required verification and membership conditions are completed.</em>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/kyc-pending">
                    <Button variant="primary" size="sm" className="w-full bg-[#C66B52] hover:bg-[#D99B43] text-white font-bold mb-2">
                      View Verification Review Status →
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" size="sm" className="w-full border-[#E8DBC8] text-[#29302D]">
                      Return to Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Razorpay Payment Gateway Modal */}
      <RazorpayCheckoutModal
        isOpen={showRazorpayModal}
        amount={membershipPrice}
        purpose="MEMBERSHIP_FIRST_YEAR"
        orderLabel="MEMBERSHIP ACTIVATION"
        orderSubtitle={`1st Year FIC Business Pass · ${selectedCategory.name}`}
        userName={fullName || 'Applicant'}
        userEmail={email || ''}
        userPhone={phoneNumber || ''}
        ensureAuthToken={ensureRegistrationSessionAndUploadDocs}
        onSuccess={handleRazorpaySuccess}
        onClose={() => setShowRazorpayModal(false)}
      />
    </div>
  );
};

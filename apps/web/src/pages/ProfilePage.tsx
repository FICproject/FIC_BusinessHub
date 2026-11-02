import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input } from '@fic/ui';
import {
  getStoredUser,
  updateUserProfile,
  removeAuthToken,
  AuthenticatedUser
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
  FileTextIcon
} from '../components/Icons';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Editable Form Fields
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
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

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);
    populateForm(stored);
  }, [navigate]);

  const populateForm = (u: AuthenticatedUser) => {
    setEditFullName(u.fullName || '');
    setEditPhone(u.mobileNumber || u.phoneNumber || '');
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
    setIsEditModalOpen(true);
    setSuccessMessage('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedSubcategories = editSubcategories
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedSkills = editSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates: Partial<AuthenticatedUser> = {
      fullName: editFullName.trim() || user.fullName,
      mobileNumber: editPhone.trim() || user.mobileNumber,
      phoneNumber: editPhone.trim() || user.phoneNumber,
      subcategories: parsedSubcategories.length > 0 ? parsedSubcategories : user.subcategories,
      subCategory: parsedSubcategories.length > 0 ? parsedSubcategories[0] : user.subCategory,
      personalInfo: {
        ...(user.personalInfo || {}),
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        pincode: editPincode.trim()
      },
      professionalInfo: {
        ...(user.professionalInfo || {}),
        roleTitle: editRoleTitle.trim(),
        businessName: editRoleTitle.trim(),
        skills: parsedSkills,
        portfolioUrl: editPortfolio.trim(),
        description: editDescription.trim()
      }
    };

    const updated = updateUserProfile(user.userId || user.id, updates);
    setUser(updated);
    setIsEditModalOpen(false);
    setSuccessMessage('Profile details updated successfully!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('Password changed successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Helper: Category-specific icon
  const getCategoryIcon = () => {
    const cat = (user.categoryName || user.primaryCategory || '').toLowerCase();
    if (cat.includes('tech') || cat.includes('digital')) return <CodeIcon size={24} className="text-blue-600" />;
    if (cat.includes('manuf') || cat.includes('industr')) return <FactoryIcon size={24} className="text-amber-600" />;
    if (cat.includes('educat') || cat.includes('knowledg')) return <GraduationCapIcon size={24} className="text-purple-600" />;
    if (cat.includes('invest') || cat.includes('financ')) return <TrendingUpIcon size={24} className="text-emerald-600" />;
    return <BriefcaseIcon size={24} className="text-slate-700" />;
  };

  return (
    <div className="bg-slate-100/70 min-h-screen py-10 selection:bg-[#C66B52] selection:text-white">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircleIcon size={18} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================================
            A. PROFILE OVERVIEW BANNER
           ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar with Initials */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#29302D] text-[#FCFAF6] border-2 border-[#D99B43] flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md shrink-0">
                {user.fullName
                  ? user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'MB'}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    ID: {user.userId || user.id}
                  </span>
                  <Badge variant={user.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>
                    {user.accountStatus || 'Active'} Account
                  </Badge>
                  <Badge variant="info">
                    {user.isMembershipActive ? '1st Year Member' : 'Member'}
                  </Badge>
                  {user.isKycApproved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheckIcon size={14} />
                      KYC Verified
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {user.fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {user.categoryName || user.primaryCategory}
                  </span>
                  {user.subcategories &&
                    user.subcategories.map((sub, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg"
                      >
                        {sub}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleOpenEdit}
                className="bg-[#29302D] hover:bg-[#8064A9] text-white font-bold flex items-center gap-2 shadow-xs"
              >
                <EditIcon size={16} />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================
            2-COLUMN GRID: PERSONAL & PROFESSIONAL INFORMATION
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* B. PERSONAL INFORMATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
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
                <span className="text-slate-900 font-bold text-sm block mt-0.5">{user.fullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="text-slate-900 font-semibold block mt-0.5">{user.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Mobile Phone Number</span>
                <span className="text-slate-900 font-semibold block mt-0.5">
                  {user.mobileNumber || user.phoneNumber || 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Date of Birth</span>
                <span className="text-slate-900 font-semibold block mt-0.5">
                  {user.personalInfo?.dob || 'Verified 18+ Adult Policy'}
                </span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-medium">Registered Address & Location</span>
                <span className="text-slate-800 font-medium block mt-0.5">
                  {[
                    user.personalInfo?.address,
                    user.personalInfo?.city,
                    user.personalInfo?.district,
                    user.personalInfo?.state,
                    user.personalInfo?.pincode ? `PIN: ${user.personalInfo.pincode}` : null
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Address on file with KYC submission'}
                </span>
              </div>
            </div>
          </div>

          {/* C. PROFESSIONAL / BUSINESS INFORMATION (DYNAMIC BY CATEGORY) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon()}
                <h3 className="text-base font-bold text-slate-900">Professional & Business Profile</h3>
              </div>
              <span className="text-xs text-blue-600 font-semibold">{user.categoryName}</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role Title / Business Name */}
              <div>
                <span className="text-slate-400 block font-medium">
                  {user.professionalInfo?.businessName ? 'Business / Unit Name' : 'Professional Title'}
                </span>
                <span className="text-slate-900 font-bold text-sm block mt-0.5">
                  {user.professionalInfo?.roleTitle ||
                    user.professionalInfo?.businessName ||
                    user.subCategory ||
                    'Registered Professional Member'}
                </span>
              </div>

              {/* Business / Unit Type or Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.professionalInfo?.businessType && (
                  <div>
                    <span className="text-slate-400 block font-medium">Enterprise Entity Type</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {user.professionalInfo.businessType}
                    </span>
                  </div>
                )}

                {user.professionalInfo?.experience && (
                  <div>
                    <span className="text-slate-400 block font-medium">Experience & Track Record</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {user.professionalInfo.experience}
                    </span>
                  </div>
                )}

                {user.professionalInfo?.manufacturingType && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Manufacturing Specialization</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {user.professionalInfo.manufacturingType}
                    </span>
                  </div>
                )}

                {user.professionalInfo?.productionCapabilities && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Production Capabilities</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {user.professionalInfo.productionCapabilities}
                    </span>
                  </div>
                )}
              </div>

              {/* Skills or Capabilities (Chips) */}
              {user.professionalInfo?.skills && user.professionalInfo.skills.length > 0 && (
                <div>
                  <span className="text-slate-400 block font-medium mb-1.5">Core Competencies & Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.professionalInfo.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio URL */}
              {user.professionalInfo?.portfolioUrl && (
                <div>
                  <span className="text-slate-400 block font-medium">Verified Portfolio / Website</span>
                  <a
                    href={user.professionalInfo.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-mono text-xs block mt-0.5"
                  >
                    {user.professionalInfo.portfolioUrl} &rarr;
                  </a>
                </div>
              )}

              {/* Bio / Description */}
              {user.professionalInfo?.description && (
                <div>
                  <span className="text-slate-400 block font-medium">Executive Overview</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {user.professionalInfo.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            D. MEMBERSHIP & PAYMENT INFORMATION
           ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Membership Terms & Payment History</h3>
              <p className="text-xs text-slate-500">Official commercial credentials for your account</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              {user.membershipPlan || '1st Year Membership'}
            </span>
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
                {user.membershipExpiryDate || '365 Days'}
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-medium">Account Status</span>
              <span className="inline-block mt-1 text-emerald-700 font-bold">
                ● {user.membershipStatus || 'ACTIVE'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
            <strong>Renewal Terms:</strong> {user.renewalInfo || 'Annual renewal available at ₹5,999/yr for Year 2+.'}
          </div>

          {/* Payment Transactions Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payment Invoices & Records
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Transaction Reference</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {user.paymentHistory && user.paymentHistory.length > 0 ? (
                    user.paymentHistory.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">{p.orderId}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.transactionId}</td>
                        <td className="py-3 px-4 text-slate-600">{p.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.amount}</td>
                        <td className="py-3 px-4">
                          <Badge variant="success">{p.status}</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================
            E. KYC & VERIFICATION STATUS
           ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">KYC Verification & Compliance Files</h3>
              <p className="text-xs text-slate-500">Government credentials verified under FIC intermediary guidelines</p>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon size={18} className="text-emerald-600" />
              <Badge variant={user.isKycApproved ? 'success' : 'warning'}>
                {user.kycStatus || 'APPROVED'}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {user.submittedDocuments && user.submittedDocuments.length > 0 ? (
              user.submittedDocuments.map((doc, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <FileTextIcon size={18} />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-semibold">{doc.name}</strong>
                      <span className="text-slate-400 text-[11px] font-mono">
                        Number: {doc.documentNumber || 'Verified on Record'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{doc.uploadedAt}</span>
                    <Badge variant="success">{doc.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Documents submitted during registration are verified by compliance officers.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            F. ACCOUNT & SECURITY
           ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <LockIcon size={18} className="text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Account Security & Credentials</h3>
            </div>
            <span className="text-xs text-slate-400">Secure Gateway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <span className="text-slate-400 block font-medium">Registered Email ID</span>
              <span className="text-slate-900 font-semibold block mt-0.5">{user.email}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Registered Phone Number</span>
              <span className="text-slate-900 font-semibold block mt-0.5">
                {user.mobileNumber || user.phoneNumber || 'Not Specified'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Account Standing</span>
              <span className="text-emerald-600 font-bold block mt-0.5">Verified Commercial Identity</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
            >
              <span>Change Account Password</span>
              <span>&rarr;</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
            >
              Sign Out of Account
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          EDIT PROFILE MODAL
         ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Member Profile Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Your full legal name"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Phone Number</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Selected Subcategories (Comma-separated)
                </label>
                <Input
                  value={editSubcategories}
                  onChange={(e) => setEditSubcategories(e.target.value)}
                  placeholder="e.g. Freelance Software Developer, Cloud Architecture"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Professional Title / Business Unit Name
                </label>
                <Input
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer / Apex Textiles Unit"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Skills (Comma-separated)</label>
                <Input
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="e.g. React, Node.js, Python, AWS"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Portfolio or Website URL</label>
                <Input
                  value={editPortfolio}
                  onChange={(e) => setEditPortfolio(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <Input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <Input
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Professional Bio / Overview</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary of your professional capabilities or manufacturing facility..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-[#29302D] hover:bg-[#8064A9] text-white font-bold"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CHANGE PASSWORD MODAL
         ======================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-[#29302D] hover:bg-[#8064A9] text-white font-bold"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;

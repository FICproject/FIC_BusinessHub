import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  apiRequest,
  setAuthToken,
  setStoredUser,
  findRegisteredAccount,
  saveRegisteredAccount
} from '../services/api';
import { ShieldCheckIcon, EyeIcon, EyeOffIcon, UserIcon, LockIcon } from '../components/Icons';
import { KeyRound, Mail, Phone, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const targetPath = (location.state as any)?.from?.pathname || '/dashboard';
  const isRedirectedFromProtected = Boolean((location.state as any)?.from);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot Password Flow State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotDeliveryMethod, setForgotDeliveryMethod] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: any;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const openForgotModal = () => {
    setForgotError('');
    setForgotSuccessMsg('');
    setForgotOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep(1);
    if (identifier.trim()) {
      setForgotIdentifier(identifier.trim());
      setForgotDeliveryMethod(identifier.includes('@') ? 'EMAIL' : 'SMS');
    }
    setShowForgotModal(true);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email address or mobile number.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccessMsg('');

    try {
      const res = await apiRequest('/auth/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          deliveryMethod: forgotDeliveryMethod
        })
      });

      if (res?.success) {
        setForgotSuccessMsg(res.message || 'Verification code sent successfully.');
        setCooldownSeconds(res.data?.cooldownSeconds || 60);
        if (res.data?.debugOtp) {
          setForgotOtp(res.data.debugOtp);
        }
        setForgotStep(2);
      } else {
        setForgotError(res?.error || res?.message || 'Failed to send verification code. Please check your credential.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Network error occurred while sending verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the full 6-digit verification code.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await apiRequest('/auth/forgot-password/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: cleanOtp
        })
      });

      if (res?.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setForgotSuccessMsg('Code verified! Please create your new account password.');
        setForgotStep(3);
      } else {
        setForgotError(res?.error || res?.message || 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to verify code. Please check and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter matching passwords.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await apiRequest('/auth/forgot-password/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword
        })
      });

      if (res?.success) {
        setForgotStep(4);
        setPassword('');
      } else {
        setForgotError(res?.error || res?.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Error updating password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your registered email address or mobile number.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Attempt Real Backend API Authentication
      try {
        const response = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: cleanId, password })
        });

        if (response?.success && response?.data) {
          const authUser = response.data.user;
          setAuthToken(response.data.token);
          setStoredUser(authUser);

          const isApproved = Boolean(
            authUser.isKycApproved === true ||
            (authUser.status === 'ACTIVE' && authUser.kycStatus === 'APPROVED')
          );

          if (!isApproved) {
            navigate('/kyc-pending', { replace: true });
            return;
          }

          navigate(targetPath, { replace: true });
          return;
        }
      } catch (apiErr: any) {
        // If backend returned a definitive invalid credentials error, report it directly
        if (apiErr?.message && !apiErr?.message?.includes('Failed to fetch') && !apiErr?.message?.includes('NetworkError')) {
          setErrorMessage(apiErr.message || 'Invalid email/mobile or password.');
          setIsLoading(false);
          return;
        }
        // If backend is offline or unreachable, fall through to verified persistent local registry
      }

      // 2. Client-side Account Registry Authentication (offline/local fallback)
      let matched = findRegisteredAccount(cleanId);

      // If account was registered locally, strictly check password
      if (matched && password) {
        if (matched.password && matched.password !== password) {
          setErrorMessage('Invalid email/mobile or password.');
          setIsLoading(false);
          return;
        }
      }

      if (!matched) {
        setErrorMessage('Account not found. Please register first or verify your credentials.');
        setIsLoading(false);
        return;
      }

      // Strict KYC Check: If user KYC is not approved, block portal access
      const isApproved = Boolean(
        matched.isKycApproved === true ||
        (matched.accountStatus === 'ACTIVE' && matched.kycStatus === 'VERIFIED')
      );

      // Authenticate matched user
      setAuthToken(`fic_token_${matched.userId}`);
      setStoredUser(matched);

      if (!isApproved) {
        navigate('/kyc-pending', { replace: true });
        return;
      }

      navigate(targetPath, { replace: true });
    } catch {
      setErrorMessage('Authentication error. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center my-auto px-4 selection:bg-[#C66B52] selection:text-white">
      {/* Unified Portrait Member Portal Login Card */}
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[#E8DBC8] shadow-[0_20px_60px_rgba(42,24,68,0.14)] flex flex-col justify-between">
        {/* Card Header */}
        <div className="text-center mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#1C1824] border border-white/30 flex items-center justify-center text-[#FCFAF6] font-black text-lg mx-auto mb-2 shadow-md">
            FIC
          </div>
          <h1 className="text-2xl sm:text-[25px] font-black text-[#1E1728] tracking-tight">
            Member Portal Login
          </h1>
          <p className="text-xs text-[#77786E] font-medium mt-1">
            Access your category workspace & universal marketplace
          </p>
        </div>

        {isRedirectedFromProtected && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/50 text-xs text-[#8064A9] font-semibold flex items-center gap-2 shadow-2xs">
            <ShieldCheckIcon size={16} className="shrink-0 text-[#D99B43]" />
            <span>Please sign in or register to access the Universal Marketplace & Member Services.</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Email / Mobile Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1728] block">
              Email Address or Mobile Number
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E] pointer-events-none">
                <UserIcon size={16} />
              </div>
              <input
                type="text"
                placeholder="e.g. kathir@gmail.com or 9988776655"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 border border-[#DDD4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#1E1728] placeholder-[#9E95A8] transition-colors"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1728] block">
                Password *
              </label>
              <button
                type="button"
                onClick={openForgotModal}
                className="text-[11px] font-bold text-[#EA5A0C] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E] pointer-events-none">
                <LockIcon size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your account password"
                className="w-full text-xs pl-10 pr-10 py-2.5 border border-[#DDD4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#1E1728] placeholder-[#9E95A8] transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#77786E] hover:text-[#1E1728] p-1 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In Button with Purple-to-Orange Gradient */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#291338] via-[#5C1B3A] to-[#EA5A0C] hover:opacity-95 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-md transition-all cursor-pointer text-xs sm:text-sm tracking-wide mt-1.5"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Member Portal'}
          </button>
        </form>

        {/* Register text */}
        <div className="mt-3.5 pt-3 border-t border-[#E8DBC8] text-center">
          <p className="text-xs text-[#77786E]">
            Not a member yet?{' '}
            <Link to="/get-started" className="font-bold text-[#EA5A0C] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* PHASE 4: SECURE FORGOT PASSWORD MODAL (4-STEP OTP FLOW) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-[460px] my-auto bg-white rounded-3xl shadow-2xl border border-[#EDE2D7] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#291338] via-[#5C1B3A] to-[#EA5A0C] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Account Recovery</h3>
                  <p className="text-xs text-white/80">Reset your FIC Business Hub password securely</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="bg-[#FAF7F2] border-b border-[#EDE2D7] px-5 py-2.5 flex items-center justify-between text-[11px] font-bold">
              {[
                { num: 1, label: 'Identity' },
                { num: 2, label: 'Verify OTP' },
                { num: 3, label: 'New Password' },
                { num: 4, label: 'Done' }
              ].map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center gap-1.5 ${
                    forgotStep === s.num
                      ? 'text-[#EA5A0C]'
                      : forgotStep > s.num
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      forgotStep === s.num
                        ? 'bg-[#EA5A0C] text-white'
                        : forgotStep > s.num
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {forgotStep > s.num ? '✓' : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {forgotError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccessMsg && forgotStep !== 4 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              {/* STEP 1: Request OTP */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Registered Email Address or Mobile Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. member@example.com or 9876543210"
                      value={forgotIdentifier}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForgotIdentifier(val);
                        if (val.includes('@')) {
                          setForgotDeliveryMethod('EMAIL');
                        } else if (/^\d+$/.test(val.replace(/\s+/g, ''))) {
                          setForgotDeliveryMethod('SMS');
                        }
                      }}
                      required
                      className="w-full text-xs px-3.5 py-2.5 border border-[#DDD4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA5A0C] bg-white text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Preferred Verification Channel
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotDeliveryMethod('EMAIL')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          forgotDeliveryMethod === 'EMAIL'
                            ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                        <span>Email OTP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotDeliveryMethod('SMS')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          forgotDeliveryMethod === 'SMS'
                            ? 'bg-orange-50 border-orange-400 text-orange-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5 text-orange-600" />
                        <span>SMS OTP</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotIdentifier.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-[#291338] to-[#EA5A0C] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Verify OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-600">
                      We sent a 6-digit verification code to:
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-900 bg-slate-100 py-1 px-2.5 rounded-lg inline-block">
                      {forgotIdentifier}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="text-xs font-bold text-slate-800 block">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="w-48 mx-auto text-center font-mono text-xl tracking-[0.4em] font-black py-2 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA5A0C] bg-white text-slate-900"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {cooldownSeconds > 0 ? (
                      <span className="text-slate-400 font-medium">
                        Resend code in <strong className="font-mono text-slate-600">{cooldownSeconds}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={forgotLoading}
                        className="text-[#EA5A0C] font-bold hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Change Contact
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.trim().length !== 6}
                    className="w-full py-2.5 bg-gradient-to-r from-[#291338] to-[#EA5A0C] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: Create New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      New Password * (Min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        required
                        className="w-full text-xs pl-3.5 pr-10 py-2.5 border border-[#DDD4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA5A0C] bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        required
                        className="w-full text-xs pl-3.5 pr-10 py-2.5 border border-[#DDD4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA5A0C] bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full py-2.5 bg-gradient-to-r from-[#291338] to-[#EA5A0C] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Update Password Securely</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 4: Success & Return */}
              {forgotStep === 4 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Password Updated Successfully!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Your FIC Business Hub password has been updated. You can now log in with your new credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      if (forgotIdentifier) setIdentifier(forgotIdentifier);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-[#291338] to-[#EA5A0C] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

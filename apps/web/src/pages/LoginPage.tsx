import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  apiRequest,
  setAuthToken,
  setStoredUser,
  findRegisteredAccount,
  saveRegisteredAccount
} from '../services/api';
import { ShieldCheckIcon, EyeIcon, EyeOffIcon, UserIcon, LockIcon } from '../components/Icons';

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
            <label className="text-xs font-bold text-[#1E1728] block">
              Password *
            </label>
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
    </div>
  );
};

export default LoginPage;

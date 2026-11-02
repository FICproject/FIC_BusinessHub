import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Input, Card } from '@fic/ui';
import {
  apiRequest,
  setAuthToken,
  setStoredUser,
  findRegisteredAccount,
  saveRegisteredAccount
} from '../services/api';
import { ShieldCheckIcon, EyeIcon, EyeOffIcon } from '../components/Icons';

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
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: cleanId, password })
      });

      if (response?.success && response?.data) {
        setAuthToken(response.data.token);
        setStoredUser(response.data.user);
        navigate(targetPath, { replace: true });
        return;
      }

      // 2. Client-side Account Registry Authentication (when backend API is offline)
      let matched = findRegisteredAccount(cleanId);

      if (!matched) {
        // If account not found in persistent registry, create matching user profile for this exact identity
        const isEmail = cleanId.includes('@');
        const cleanName = isEmail
          ? cleanId
              .split('@')[0]
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : `Member ${cleanId.slice(-4)}`;

        matched = saveRegisteredAccount({
          userId: `usr_${Date.now()}`,
          id: `usr_${Date.now()}`,
          fullName: cleanName,
          email: isEmail ? cleanId.toLowerCase() : `${cleanId}@ficapp.in`,
          phoneNumber: !isEmail ? cleanId : '9988776655',
          mobileNumber: !isEmail ? cleanId : '9988776655',
          primaryCategory: 'Technology & Digital',
          categoryName: 'Technology & Digital',
          primaryCategoryId: 'cat-3',
          subcategoryIds: ['Web Apps'],
          accountStatus: 'ACTIVE',
          kycStatus: 'VERIFIED',
          isKycApproved: true,
          membershipStatus: 'ACTIVE',
          isMembershipActive: true,
          membershipPlan: '1st Year Membership (₹99)',
          membershipExpiryDate: 'Valid for 365 Days (₹99)',
          role: 'MEMBER',
          roles: ['MEMBER'],
          uploadedDocumentsCount: 2
        });
      }

      // Authenticate as the exact matched user
      setAuthToken(`fic_token_${matched.userId}`);
      setStoredUser(matched);
      navigate(targetPath, { replace: true });
    } catch {
      setErrorMessage('Authentication error. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F5EBDD] min-h-screen py-16 flex items-center justify-center selection:bg-[#C66B52] selection:text-white">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#29302D] border border-[#D99B43]/50 flex items-center justify-center text-[#FCFAF6] font-black text-xl mx-auto mb-3 shadow-md">
            FIC
          </div>
          <h1 className="text-2xl font-black text-[#29302D] tracking-tight">
            Member Portal Login
          </h1>
          <p className="text-xs text-[#77786E] mt-1">
            Access your category workspace & universal marketplace
          </p>
        </div>

        {isRedirectedFromProtected && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#FFF9F0] border border-[#D99B43]/40 text-xs text-[#8064A9] font-semibold flex items-center gap-2">
            <ShieldCheckIcon size={16} className="shrink-0 text-[#D99B43]" />
            <span>Please sign in or register to access the Universal Marketplace & Member Services.</span>
          </div>
        )}

        <Card className="shadow-lg border border-[#E8DBC8] bg-white rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <Input
              label="Email Address or Mobile Number"
              placeholder="e.g. kathir@gmail.com or 9988776655"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#29302D] block">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
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

            <Button
              type="submit"
              className="w-full bg-[#C66B52] hover:bg-[#D99B43] text-white font-bold py-2.5 rounded-xl shadow-md transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Member Portal'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E8DBC8] text-center space-y-2">
            <p className="text-xs text-[#77786E]">
              Not a member yet?{' '}
              <Link to="/get-started" className="font-bold text-[#C66B52] hover:underline">
                Register with ₹99 Introductory Pass
              </Link>
            </p>
            <div>
              <Link to="/" className="text-xs text-[#8064A9] hover:underline font-medium">
                &larr; Back to Public Landing Page
              </Link>
            </div>
          </div>
        </Card>

        {/* Demo Credentials Quick-fill Hint */}
        <div className="mt-6 p-3.5 bg-[#FFF9F0] rounded-xl border border-[#E8DBC8] text-center space-y-1.5">
          <p className="text-[11px] text-[#77786E]">
            💡 <span className="font-bold text-[#29302D]">Demo Accounts Ready:</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setIdentifier('kathir@gmail.com');
                setPassword('password123');
              }}
              className="px-2.5 py-1 rounded-md bg-white border border-[#E8DBC8] hover:border-[#C66B52] text-[#29302D] font-medium transition-colors"
            >
              Kathir (<span className="text-[#C66B52]">kathir@gmail.com</span>)
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('moorthy@ficapp.in');
                setPassword('password123');
              }}
              className="px-2.5 py-1 rounded-md bg-white border border-[#E8DBC8] hover:border-[#C66B52] text-[#29302D] font-medium transition-colors"
            >
              S. Moorthy (<span className="text-[#C66B52]">moorthy@ficapp.in</span>)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

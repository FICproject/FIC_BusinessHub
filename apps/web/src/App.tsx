import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 4 Distinct Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { MemberLayout } from './layouts/MemberLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Guard
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Informational Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { MembershipInfoPage } from './pages/MembershipInfoPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

// Auth Pages
import { GetStartedPage } from './pages/GetStartedPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';

// Member Portal Pages
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { BusinessIdeasPage } from './pages/BusinessIdeasPage';
import { BusinessDevPage } from './pages/BusinessDevPage';
import { InvestmentPage } from './pages/InvestmentPage';
import { PartnershipsPage } from './pages/PartnershipsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================================
            1. PUBLIC LAYOUT: Public marketing & informational pages
            (Includes Public Header + Public Navigation + Full Public Footer)
           ======================================================== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/membership" element={<MembershipInfoPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
        </Route>

        {/* ========================================================
            2. AUTH LAYOUT: Focused onboarding & credential flows
            (Includes Minimal Auth Header + Focused content + Minimal Footer)
           ======================================================== */}
        <Route element={<AuthLayout />}>
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ========================================================
            3. MEMBER LAYOUT: Authenticated member workspace
            (Includes Unified MemberHeader + Protected Content + Compact Member Footer)
            NEVER renders the full Public Marketing Footer
           ======================================================== */}
        <Route
          element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/business-ideas" element={<BusinessIdeasPage />} />
          <Route path="/business-development" element={<BusinessDevPage />} />
          <Route path="/investment" element={<InvestmentPage />} />
          <Route path="/partnerships" element={<PartnershipsPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* ========================================================
            4. ADMIN LAYOUT: Dedicated executive portal shell
           ======================================================== */}
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { GetStartedPage } from './pages/GetStartedPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { BusinessIdeasPage } from './pages/BusinessIdeasPage';
import { BusinessDevPage } from './pages/BusinessDevPage';
import { InvestmentPage } from './pages/InvestmentPage';
import { PartnershipsPage } from './pages/PartnershipsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/business-ideas" element={<BusinessIdeasPage />} />
            <Route path="/business-development" element={<BusinessDevPage />} />
            <Route path="/investment" element={<InvestmentPage />} />
            <Route path="/partnerships" element={<PartnershipsPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;

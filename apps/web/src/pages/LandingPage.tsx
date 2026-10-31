import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, Card } from '@fic/ui';
import {
  BriefcaseIcon,
  FactoryIcon,
  CodeIcon,
  GraduationCapIcon,
  SproutIcon,
  TrendingUpIcon,
  HeartPulseIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  LightbulbIcon,
  RocketIcon,
  HandshakeIcon,
  CheckCircleIcon,
  LockIcon
} from '../components/Icons';
import { INITIAL_CATEGORIES_DATA, INITIAL_SERVICES_DATA } from '../services/mockData';

export const LandingPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES_DATA[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is FIC Business Hub?',
      a: 'FIC Business Hub is a verified membership ecosystem for individuals, entrepreneurs, manufacturers, professionals, and students. FIC acts as the central intermediary coordinator to help you discover services, submit business ideas, explore funding, and form B2B partnerships.'
    },
    {
      q: 'How does the ₹99 membership work?',
      a: 'The first-year membership fee is an introductory ₹99. From the second year onwards, the annual renewal is ₹5,999 per year. The fee is identical across all business categories. There are no hidden charges or misleading countdown discounts.'
    },
    {
      q: 'Why are provider contact details hidden in the marketplace?',
      a: 'To guarantee quality, prevent unsolicited spam, and maintain trust, all member listings protect provider privacy. When you request a service, FIC personnel review your requirement and coordinate directly between you and the verified provider.'
    },
    {
      q: 'Can I join if I am a student or an aspiring entrepreneur?',
      a: 'Yes, anyone aged 18 and above is eligible. We have dedicated categories for Education & Knowledge and Business Idea Owners with mentoring and scaling support.'
    },
    {
      q: 'How does the KYC process work?',
      a: 'After selecting your category and paying the ₹99 membership fee, you upload category-specific verification documents (e.g. Aadhaar, GSTIN, Student ID). Once approved by our verification team, your full dynamic dashboard is activated.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white pt-20 pb-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            First-Year Membership Introductory Offer ₹99
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight mb-6">
            One Platform. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Unlimited Business Opportunities.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Connect with business opportunities, discover verified services, explore private investments, build strategic partnerships, and scale your venture with FIC.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/get-started">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold">
                Get Started
                <ArrowRightIcon className="ml-2" size={18} />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 text-white border-slate-600 hover:bg-slate-800 font-medium">
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Quick Stats / Trust Indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-white">10+</div>
              <div className="text-xs text-slate-400 mt-1">Core Business Sectors</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-amber-400">₹99</div>
              <div className="text-xs text-slate-400 mt-1">1st Year Membership</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">FIC Privacy Protection</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-blue-400">18+</div>
              <div className="text-xs text-slate-400 mt-1">Verified Adult Ecosystem</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT FIC BUSINESS HUB */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              The Ecosystem Concept
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              More than a Directory. A Trusted Intermediary Hub.
            </h3>
            <p className="mt-4 text-slate-600 leading-relaxed text-sm sm:text-base">
              Conventional portals publicly expose personal numbers to spam and leave users unguided. FIC Business Hub operates as the central coordinator: every connection, proposal, and introduction is professionally facilitated by FIC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheckIcon size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Verified Trust & KYC</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every member undergoes category-tailored KYC verification before accessing the active community. Unverified actors are kept out.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <LockIcon size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Privacy-Safe Marketplace</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provider contact numbers and emails are never exposed publicly. FIC receives requirements, validates specifications, and coordinates proposals.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <HandshakeIcon size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Universal Cross-Discovery</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                A textile manufacturer can discover software developers, chartered accountants, organic agri-suppliers, and distributors across all 10 sectors without barriers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 10 CORE SECTORS INTERACTIVE EXPLORER */}
      <section id="sectors" className="py-20 bg-slate-100/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              Who Can Join?
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              10 Dynamic Business & Professional Categories
            </h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Each member selects one primary main category with category-tailored onboarding, dynamic forms, and personalized dashboard widgets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Category selection list */}
            <div className="lg:col-span-5 space-y-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              {INITIAL_CATEGORIES_DATA.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <BriefcaseIcon size={16} />
                      </div>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <ArrowRightIcon size={16} className={`transition-transform ${isSelected ? 'translate-x-1' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </div>

            {/* Selected Category Detail Card */}
            <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Selected Sector Details</span>
                  <h4 className="text-2xl font-bold text-slate-900 mt-1">{selectedCategory.name}</h4>
                </div>
                <Badge variant="info">Category Configured</Badge>
              </div>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {selectedCategory.description}
              </p>

              <div className="mb-6">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Illustrative Subcategories & Roles
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-1">Dynamic Registration Fields</div>
                  <div className="text-xs text-slate-500">
                    {selectedCategory.fields.map(f => f.label).slice(0, 3).join(', ')}...
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-1">Tailored KYC Requirements</div>
                  <div className="text-xs text-slate-500">
                    {selectedCategory.kycDocuments.map(k => k.label).join(', ')}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Ready to join this sector?</span>
                <Link to={`/register?category=${selectedCategory.id}`}>
                  <Button variant="primary" size="sm">
                    Join under {selectedCategory.name.split(' ')[0]}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BUSINESS IDEAS & SCALING SECTION */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold mb-4">
                <LightbulbIcon size={14} />
                Opportunity Incubation
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Submit Business Ideas & Request Scaling Support
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Have a promising business concept or looking to expand your existing enterprise? FIC connects members with market validation, business planning, technology development, and operational scaling.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon size={16} />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">Idea Validation & Mentoring:</strong>
                    <span className="text-xs text-slate-600">Guidance on market readiness, customer validation, and financial viability.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon size={16} />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">Business Planning & Strategy:</strong>
                    <span className="text-xs text-slate-600">Assistance with structuring business plans and preparing institutional proposals.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon size={16} />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">Franchise & Distributor Expansion:</strong>
                    <span className="text-xs text-slate-600">Connect with regional partners to expand your sales and operational footprint.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link to="/get-started">
                  <Button variant="primary">Submit Your Idea / Scaling Request</Button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-8 rounded-2xl text-white shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="text-sm font-bold uppercase tracking-wider text-blue-400">
                  Scaling Pathways
                </div>
                <RocketIcon size={20} className="text-blue-400" />
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <div className="font-bold text-white text-sm mb-1">Technology & Digital Modernization</div>
                  <p className="text-slate-400 leading-relaxed">
                    Transform manual workflows into cloud platforms, mobile apps, or automated inventory control.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <div className="font-bold text-white text-sm mb-1">Statutory & Audit Compliance</div>
                  <p className="text-slate-400 leading-relaxed">
                    Get connected with verified Chartered Accountants and Advocates for seamless GST and company governance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <div className="font-bold text-white text-sm mb-1">Confidential Investment Readiness</div>
                  <p className="text-slate-400 leading-relaxed">
                    Privately record your funding appetite or investment interest without public exposure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. UNIVERSAL SERVICES MARKETPLACE PREVIEW */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-3">
                <LockIcon size={13} />
                Strict Privacy Safeguard
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                Universal Services Marketplace
              </h3>
              <p className="text-slate-600 text-sm mt-2 max-w-xl">
                Discover verified services across every category. Provider contact info is strictly protected—requests are securely routed through FIC.
              </p>
            </div>
            <Link to="/marketplace" className="mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                View All Marketplace Listings ({INITIAL_SERVICES_DATA.length}+)
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INITIAL_SERVICES_DATA.slice(0, 3).map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-all border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="info">{service.categoryName.split('&')[0]}</Badge>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheckIcon size={14} /> FIC Verified
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {service.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {service.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Pricing</span>
                    <span className="text-sm font-bold text-slate-900">
                      {service.pricingType === 'CUSTOM_QUOTE' ? 'Custom Quote' : `₹${service.price?.toLocaleString()}`}
                    </span>
                  </div>
                  <Link to="/marketplace">
                    <Button variant="primary" size="sm">
                      Request via FIC
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW FIC WORKS */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              Simple 4-Step Process
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              How FIC Facilitates Business Introductions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Register & Select Sector</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your primary main category and subcategory. Fill in dynamic details tailored to your domain.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">₹99 Fee & KYC Upload</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay the ₹99 first-year intro fee and submit category-specific verification documents to prevent fake accounts.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Discover Opportunities</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Access your personalized dashboard, explore approved universal services, and submit ideas or tie-up requests.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">FIC Moderated Coordination</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                FIC officers review each request, contact providers internally, facilitate proposals, and monitor delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRANSPARENT MEMBERSHIP PRICING */}
      <section id="pricing" className="py-20 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              Ecosystem Access
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              Transparent, Fair Membership Pricing
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              Same fee applies across all 10 categories. No fake crossed-out prices or countdown timers.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-blue-600 shadow-xl overflow-hidden">
            <div className="bg-blue-600 text-white text-center py-2 text-xs font-bold uppercase tracking-wider">
              First-Year Introductory Offer
            </div>

            <div className="p-8">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-4xl font-extrabold text-slate-900">₹99</span>
                  <span className="text-slate-500 text-sm font-medium"> / first year</span>
                </div>
                <Badge variant="success">Save on Onboarding</Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Complete 1-year access to the FIC Business Hub member ecosystem, category dashboard, universal marketplace, and FIC-coordinated introductions.
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-6 text-xs text-slate-700">
                <span className="font-semibold block">Renewal Policy:</span>
                ₹5,999/year starting from the second year onwards. Transparent annual renewal terms apply.
              </div>

              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  Full access to Universal Services Marketplace
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  Category-tailored dynamic dashboard & tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  Business idea submission & mentoring review
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  Confidential investment & funding readiness channel
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  B2B partnership and vendor introductions via FIC
                </li>
              </ul>

              <Link to="/get-started" className="block">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                  Join FIC for ₹99
                </Button>
              </Link>
              <span className="text-[11px] text-slate-400 text-center block mt-3">
                18+ Age verification & KYC submission required after payment.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQS ACCORDION */}
      <section id="faqs" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              Got Questions?
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-sm sm:text-base font-semibold text-slate-900"
                  >
                    <span>{faq.q}</span>
                    <span className="text-blue-600 font-bold text-lg ml-4">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. CALL TO ACTION */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Connect with Unlimited Business Opportunities?
          </h3>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            Become a verified member today for just ₹99 introductory fee and start exploring verified services and introductions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/get-started">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-700 hover:bg-slate-100 font-bold shadow-lg">
                Get Started Now
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-blue-400 hover:bg-blue-700">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};


# FIC Business Hub — Opportunity Ecosystem

Welcome to the **FIC Business Hub** platform repository. This enterprise platform is structured as a high-performance monorepo using **Turborepo** and **pnpm**, engineered with the **MERN** stack (MongoDB Atlas, Express.js, React 19 / Vite, Node.js 20+) and 100% **TypeScript**.

FIC Business Hub operates as an **intermediary-governed business ecosystem** developed for **Forge India Connect Pvt. Ltd.** to connect MSMEs, entrepreneurs, manufacturers, professionals, mentors, and students across India while ensuring all business interactions are verified, coordinated, and protected under strict FIC governance.

---

## 🏛 Monorepo Architecture Overview

The repository is organized into distinct applications and shared packages:

```text
fic-business-hub/
├── apps/
│   ├── web/                         # Website 1: Member Portal & Public Website (Port 5173)
│   ├── admin/                       # Website 2: FIC Admin & Operations Portal (Port 5174)
│   └── backend/                     # Shared Modular Monolith API (Port 5000)
├── packages/
│   ├── shared-types/                # Shared TypeScript definitions, enums & interfaces
│   ├── validators/                  # Shared Zod validation schemas
│   ├── ui/                          # Shared UI component library
│   ├── api-client/                  # Unified HTTP API client
│   ├── auth/                        # Shared authentication helpers and RBAC policies
│   ├── typescript-config/           # Centralized TypeScript configurations
│   ├── eslint-config/               # Centralized ESLint rules
│   └── tailwind-config/             # Shared Tailwind CSS presets
├── infrastructure/                  # Docker, AWS, and deployment configurations
└── docs/                            # Master Project Blueprint (FIC_BUSINESS_HUB_COMPLETE_PROJECT_BLUEPRINT.md)
```

---

## 🛡 Core Business Model: FIC Intermediary Governance

Unlike open directories or social networks, **FIC Business Hub strictly prohibits unmediated company-to-company bypass**:

1. **Intermediary Shield**: Provider identities and direct contact information are never published on open public feeds.
2. **Coordinated Inquiries**: When Company A requires services from Company B, or an investor seeks deal access, the request is moderated and vetted by FIC Officers.
3. **Removal of Direct "Partnerships"**: Standalone direct partnership connections have been permanently retired. All B2B trade, subcontracting, joint ventures, and distribution networks flow through the **Universal Marketplace**, **Scaling & Enterprise Advisory**, and **Centralized Meetings Desk**.
4. **Confidentiality & Non-Disclosure**: High-value transactions, incubation ideas, and investment deal rooms are governed by bilateral NDAs and verified compliance protocols.

---

## 🎨 Design System & Motion Architecture

### 1. Warm Ivory & Soft Sand Multi-Color Palette
The portal uses an enterprise-grade luxury multi-color theme designed for high readability and visual warmth:
* **Background Canvas**: Warm Ivory (`#FAF7F2`) with subtle ambient atmospheric mesh glows.
* **Text & Typography**: Deep Earth Brown (`#51463F` and `#453A33`) exceeding WCAG AAA contrast (> 7.5:1 ratio) on light backgrounds.
* **Brand Accents**:
  * **Royal Amethyst Violet** (`#6D28D9`, `#7C3AED`) — Header glow, executive operations.
  * **Terracotta / Coral** (`#E8795B`, `#C65638`) — Primary actions, marketplace highlights.
  * **Golden Amber** (`#E5A23B`, `#D99B43`) — Incubation ideas, membership badges.
  * **Forest Teal / Emerald** (`#059669`, `#1C6960`) — Private deal room, investment yields, verified KYC.
* **Surface Containers**: Frosted white glass cards (`bg-white/80` or `bg-white/95`) with delicate sand borders (`#EDE2D7`) and soft depth shadows.

### 2. Motion for React (`motion/react`)
Animations are powered by **Motion for React** (`motion/react` v12+):
* **Guaranteed Route Visibility**: Layout containers wrap active routes in non-blocking DOM shells to eliminate stuck zero-opacity transitions during navigation.
* **Micro-Interactions**: Spring-animated buttons, interactive tabs with shared layout transitions (`layoutId`), staggered lists, animated metric counters, and scroll reveals.

---

## 🧭 Dynamic Role-Based Member Navigation

Navigation is centralized in `apps/web/src/services/dashboardConfig.ts` (`getRoleNavigation`), dynamically tailoring header links and action cards based on user role and subcategory:

| User Role / Track | Core Navigation Modules |
| :--- | :--- |
| **Business / MSME / Manufacturer / Freelancer** | `Dashboard` • `Marketplace` • `Business Ideas` • `Scaling` • `Investment` • `Meetings` • `My Requests` • `My Services` |
| **Student** | `Dashboard` • `Marketplace` • `Business Ideas` • `Investment` • `Meetings` • `My Requests` • `Skill Development` |
| **Mentor / Trainer** | `Dashboard` • `Marketplace` • `Business Ideas` • `Investment` • `Meetings` • `My Requests` • `My Services` |
| **Professor / Faculty** | `Dashboard` • `Marketplace` • `Business Ideas` • `Investment` • `Meetings` • `My Requests` • `My Services` |

---

## 🚀 Key Functional Modules

### 1. Universal Services Marketplace (`/marketplace`)
* Privacy-safe catalog across **10 business sectors** (Manufacturing, IT, Agriculture, Healthcare, Retail, Education, Finance & Legal, Real Estate, Creative Media, Renewable Energy).
* Verified provider credentials with FIC intermediary badges.
* Integrated **Business Idea Requests** tab allowing members to browse approved business ideas and collaborate.

### 2. Business Ideas & Incubation Hub (`/business-ideas`) — *Stage 0 &rarr; 1*
* **Submission Form**: Concept title, detailed description, target market/geography, maturity stage, support requirements with dedicated custom description box (*"What support do you need from FIC?"*), and pitch deck/supporting documents.
* **Feasibility Scoring Engine**: Evaluates *Market Viability*, *Technical Feasibility*, and *Commercial Scalability* (out of 100).
* **End-to-End Collaboration**:
  - Admin schedules exploratory consultation meeting with submitter.
  - Upon validation, Admin approves and publishes idea to Universal Marketplace.
  - Ecosystem members submit interest: *"I'm interested. Let's discuss more about this business idea in meeting."*
  - Admin conducts meetings with interested parties directly from the detail modal.
  - Concluded ideas can be archived via Admin *"Remove Business Idea"* action.

### 3. Business Development & Enterprise Scaling (`/business-development` / `/scaling`) — *Stage 1 &rarr; 10*
* Dedicated to **operational turnaround and expansion for existing businesses**.
* Diagnoses operational bottlenecks: Cloud ERP modernization, factory floor lean manufacturing, regional distributor onboarding, and working capital advisory.
* **In-App Document Preview**: Integrated preview modal (`AuthenticatedDocumentPreview`) for reviewing balance sheets, compliance certificates, and pitch decks without unauthorized token errors.
* Phased diagnostic roadmaps and advisory consultation meetings synchronized with the Central Meetings Desk.

### 4. Complete Funding & Investment Lifecycle (`/investment`)
* **Borrower Funding Listings**: Pitch deck, funding parameters, min/max ticket, duration, return rate, payout frequency.
* **Investor Proposals**: Ticket submissions, yield expectations, and administrative review.
* **Double-Entry Escrow Ledger**: Verification of investor payments, escrow allocation, and fund release disbursement.
* **Active Yield Tracking**: Sub-document `repayments` schedule tracking incoming return installments and maturity payouts.

### 5. Centralized Customer Meetings Desk (`/meetings`)
* Universal desk aggregating all meetings scheduled across any module (Scaling, Business Ideas, Service Requests, Funding, and Custom consultations).
* Clean dual-participant visibility: shows requesting Member (e.g. *Rama*) and Host Admin (e.g. *FIC Super Administrator*).
* Status management: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED` with verified Google Meet virtual links, duration, notes, and invitation logging.

### 6. Student & Mentor Ecosystem (`/skill-development`, `/my-services`, `/my-requests`)
* **Skill Development Portal (`/skill-development`)**: Allows students to search and filter masterclasses by domain and language (Tamil, English, etc.), view syllabi, and book 1-on-1 consultations.
* **Mentor Video Masterclasses (`/my-services`)**: Streamlined masterclass upload workflow with topic domain selection, language choice, drag-and-drop video file upload, duration, and curriculum descriptions.
* **Mentorship Consultations Hub (`/my-requests`)**:
  * **Mentors**: View incoming bookings with full interactive actions (`Accept & Schedule`, `Reject with Reason`, `Propose Reschedule`, `Complete Session & Log Audit`).
  * **Students**: Track application statuses, view verified meeting links, and accept/decline mentor reschedule proposals.

---

## 🛠 Admin Portal — Five Standalone Capital Desk Modules

The Admin Portal features **five completely independent sidebar modules** for financial governance:
1. **Funding Requests (`/funding-requests`)**: Dedicated to borrower applications, in-app document preview, change requests, and approvals.
2. **Investment Requests (`/investment-requests`)**: Dedicated to investor proposals, ticket size checks, and payment pending activation.
3. **Fund Release (`/fund-release`)**: Dedicated to payment verification, escrow reconciliation, borrower disbursement, and disbursement receipts.
4. **Returns & Maturity (`/returns-maturity`)**: Dedicated to active funded projects, installment schedule tracking, and recording incoming returns.
5. **Maturity Release (`/maturity-release`)**: Dedicated to final investment settlement, borrower escrow reconciliation, and investor maturity payouts.

### Executive Dashboard Lifecycle KPIs
Backed by real-time MongoDB aggregations (`GET /api/admin/funding/lifecycle-kpis`):
1. Total Funding Requested
2. Total Funding Approved
3. Total Investment Proposals
4. Total Investment Approved
5. Verified Investor Payments
6. Total Funds Released
7. Total Active Funded Projects
8. Total Returns Received
9. Outstanding Returns
10. Total Maturity Due
11. Total Maturity Released

---

## 💻 Tech Stack & Getting Started

### Tech Stack Reference
* **Frontend Web (`@fic/web`)**: React 19, TypeScript 5, Vite 6, Tailwind CSS 3.4, Motion for React 12, Lucide Icons.
* **Admin Portal (`@fic/admin`)**: React 19, TypeScript 5, Vite 6, Tailwind CSS 3.4, Framer Motion.
* **Backend API (`@fic/backend`)**: Node.js 20+, Express.js 4.21, TypeScript, MongoDB Atlas, Mongoose 8, JWT, Helmet, CORS, Multer.
* **Monorepo Tools**: Turborepo 2.11, pnpm 9 workspaces.

### Quick Start
```bash
# 1. Install dependencies
pnpm install

# 2. Run all applications concurrently
pnpm dev

# Or run individually:
pnpm --filter @fic/web dev      # Member Web Portal (http://localhost:5173)
pnpm --filter @fic/admin dev    # Admin Operations Portal (http://localhost:5174)
pnpm --filter @fic/backend dev  # Shared REST API (http://localhost:5000)

# 3. Production build
pnpm build
```

---

## 📄 License & Governance

Copyright &copy; 2026 **Forge India Connect Pvt. Ltd. (FIC Business Hub)**. All rights reserved.  
Proprietary enterprise software governed by FIC Intermediary Business Governance.

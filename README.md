# FIC Business Hub — Opportunity Ecosystem

Welcome to the **FIC Business Hub** platform repository. This enterprise platform is structured as a high-performance monorepo using **Turborepo** and **pnpm**, engineered with the **MERN** stack (MongoDB, Express, React, Node.js) and 100% **TypeScript**.

FIC Business Hub operates as an **intermediary-governed business ecosystem** designed to connect MSMEs, entrepreneurs, manufacturers, professionals, mentors, and students across India while ensuring all business interactions are verified, coordinated, and protected under strict FIC governance.

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
└── docs/                            # Comprehensive Project Blueprint and technical specifications
```

---

## 🛡 Core Business Model: FIC Intermediary Governance

Unlike open directories or social networks, **FIC Business Hub strictly prohibits unmediated company-to-company bypass**:

1. **Intermediary Shield**: Provider identities and direct contact information are never published on open feeds.
2. **Coordinated Inquiries**: When Company A requires services from Company B, or an investor seeks deal access, the request is moderated and vetted by FIC Officers.
3. **Removal of Direct "Partnerships"**: Standalone direct partnership connections have been permanently retired. All B2B trade, subcontracting, joint ventures, and distribution networks flow through the **Universal Marketplace**, **Scaling & Enterprise Advisory**, and **Facilitated Meetings**.
4. **Confidentiality & Non-Disclosure**: High-value transactions, incubation ideas, and investment deal rooms are governed by bilateral NDAs and verified compliance protocols.

---

## 🎨 Design System & Motion Architecture

### 1. Warm Ivory & Soft Sand Multi-Color Palette
The portal uses an enterprise-grade luxury multi-color theme designed for high readability and visual warmth:
* **Background Canvas**: Warm Ivory (`#FAF7F2`) with subtle ambient atmospheric mesh glows.
* **Text & Typography**: Deep Earth Brown (`#51463F` and `#453A33`) exceeding WCAG AAA contrast (> 7.5:1 ratio) on light backgrounds.
* **Luxury Accents**:
  * **Terracotta / Coral** (`#E8795B`, `#C65638`) — Primary actions, marketplace highlights.
  * **Golden Amber** (`#E5A23B`, `#D99B43`) — Incubation ideas, membership badges.
  * **Forest Teal** (`#3B9C91`, `#1C6960`) — Private deal room, investment channels.
  * **Royal Violet** (`#8064B1`, `#6E529F`) — Enterprise scaling, mentorship desk.
* **Surface Containers**: Frosted white glass cards (`bg-white/80` or `bg-white/95`) with delicate sand borders (`#EDE2D7`) and soft depth shadows.

### 2. Motion for React (`motion/react`)
Animations are powered exclusively by **Motion for React** (current official `motion/react` v12+ package):
* **Guaranteed Route Visibility**: Layout containers wrap active routes in non-blocking DOM shells to eliminate stuck zero-opacity transitions during tab switching.
* **Micro-Interactions**: Spring-animated buttons, interactive tabs with shared layout transitions (`layoutId`), staggered lists (`StaggerContainer`), animated metric counters (`AnimatedCounter`), and scroll reveals (`ScrollReveal`).

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
* Privacy-safe catalog across **10 business sectors** (Textiles, Manufacturing, IT, Agro-Tech, Logistics, Professional Services, etc.).
* Verified provider credentials with FIC intermediary badges.
* Members discover verified capabilities without exposing sensitive provider contact data.

### 2. Business Ideas & Incubation Desk (`/business-ideas`) — *Stage 0 &rarr; 1*
* Dedicated to **new venture creation, patent incubation, and idea validation**.
* Submission form captures: Concept title, detailed problem/solution description, target geography, maturity stage (*Idea on Paper, Prototype/MVP, Early Traction, Growth*), and support needs.
* **Automated Feasibility Scoring**: Institutional scoring across **Market Viability**, **Technical Feasibility**, and **Commercial Scalability** (out of 100).
* Phased progression: `Under Review` &rarr; `Feasibility Analysis` &rarr; `Advisory Scheduled` &rarr; `Approved Incubation`.

### 3. Business Development & Enterprise Scaling (`/business-development`) — *Stage 1 &rarr; 10*
* Dedicated to **operational turnaround and expansion for existing businesses**.
* Diagnoses operational bottlenecks: Cloud ERP modernization, factory floor lean manufacturing, regional distributor onboarding, and working capital advisory.
* Phased diagnostic roadmaps prepared by assigned FIC Industry Domain Specialists.
* Phased progression: `Diagnostic Pending` &rarr; `Specialist Assigned` &rarr; `Roadmap Prepared` &rarr; `Execution in Progress`.

### 4. Confidential Investment & Funding Channel (`/investment`)
* Institutional private deal room governed by strict regulatory compliance protocols.
* **Expression of Interest (EOI)** submission for both capital seekers and accredited investors.
* Vetted commercial opportunities with bilateral NDAs, ticket sizes, convertible note structures, and verified due diligence scores.

### 5. Student & Mentor Ecosystem (`/skill-development`, `/my-services`, `/my-requests`)
* **Skill Development Portal (`/skill-development`)**: Allows students to search and filter masterclasses by domain and language (Tamil, English, etc.), view syllabi, and book 1-on-1 consultations.
* **Mentor Video Masterclasses (`/my-services`)**: Streamlined masterclass upload workflow with topic domain selection, language choice, drag-and-drop video file upload, duration, and curriculum descriptions.
* **Mentorship Consultations Hub (`/my-requests`)**:
  * **Mentors**: View incoming bookings with full interactive actions (`Accept & Schedule`, `Reject with Reason`, `Propose Reschedule`, `Complete Session & Log Audit`).
  * **Students**: Track application statuses, view verified meeting links, and accept/decline mentor reschedule proposals.

### 6. Facilitated Meetings Desk (`/meetings`)
* Structured consultation scheduling between members and FIC officers.
* Google Meet integration, agenda tracking, and post-session advisory minutes.

---

## 🛠 Tech Stack Reference

* **Frontend (`@fic/web`)**: React 18, TypeScript 5, Vite 6, Tailwind CSS 3.4, Motion for React 12, Lucide/Heroicons SVG Icons.
* **Admin Portal (`@fic/admin`)**: React 18, TypeScript 5, Vite 6, Tailwind CSS 3.4.
* **Backend (`@fic/backend`)**: Node.js, Express, TypeScript, MongoDB, Mongoose 8, JWT Authentication, Helmet, CORS, Multer.
* **Monorepo Tools**: Turborepo 2.11, pnpm 9 workspaces.

---

## 💻 Getting Started

### Prerequisites
* **Node.js**: v20+ or v22+
* **pnpm**: v9+
* **MongoDB**: v7+ (running locally or MongoDB Atlas)

### 1. Installation
```bash
pnpm install
```

### 2. Environment Configuration
Copy the example environment file for the backend:
```bash
cp .env.example apps/backend/.env
```
Ensure your `apps/backend/.env` points to your MongoDB instance:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fic_business_hub
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Database Seeding
Seed verified accounts, categories, sample masterclasses, and regional MSME listings:
```bash
pnpm --filter @fic/backend seed
```

### 4. Development Servers
Run all applications concurrently via Turborepo:
```bash
pnpm dev
```
Or run individually:
```bash
# Member Web Portal (http://localhost:5173)
pnpm --filter @fic/web dev

# Admin Operations Portal (http://localhost:5174)
pnpm --filter @fic/admin dev

# Backend API Service (http://localhost:5000)
pnpm --filter @fic/backend dev
```

---

## 📦 Monorepo Scripts Reference

* `pnpm dev` — Starts all development servers simultaneously.
* `pnpm build` — Compiles TypeScript and builds all web applications and backend services.
* `pnpm lint` — Executes ESLint across all workspaces.
* `pnpm typecheck` — Validates TypeScript types across all projects.
* `pnpm clean` — Cleans build caches, `dist/` folders, and temporary artifacts.

---

## 📄 License & Confidentiality

Copyright &copy; 2026 **FIC Business Hub**. All rights reserved.  
Proprietary software governed by FIC Enterprise Business Governance.

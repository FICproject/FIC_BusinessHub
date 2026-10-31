# FIC Business Hub Monorepo

Welcome to the **FIC Business Hub** platform repository. This project is structured as a high-performance monorepo using **Turborepo** and **pnpm**, built with the MERN stack and TypeScript.

---

## 🏛 Architecture Overview

FIC Business Hub consists of two primary frontend web applications and a unified backend service:

```text
fic-business-hub/
├── apps/
│   ├── web/                         # Website 1: Member Website & Public Landing (Port 5173)
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
├── infrastructure/                  # Docker, AWS and deployment configs
└── docs/                            # Blueprint specification and architecture guides
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ or v24+)
- pnpm (v9+)
- MongoDB (v7+)
- Redis (v7+)

### Installation
```bash
pnpm install
```

### Environment Setup
Copy the example environment file:
```bash
cp .env.example apps/backend/.env
```

### Development
Run all apps simultaneously using Turbo:
```bash
pnpm dev
```

Or run individual apps:
```bash
pnpm --filter @fic/web dev
pnpm --filter @fic/admin dev
pnpm --filter @fic/backend dev
```

---

## 📦 Scripts Reference

- `pnpm dev` - Start development servers across all packages and apps
- `pnpm build` - Build all packages and applications for production
- `pnpm lint` - Run ESLint across all projects
- `pnpm typecheck` - Run TypeScript typecheck across all projects
- `pnpm test` - Execute unit and integration tests
- `pnpm clean` - Clean build artifacts and caches


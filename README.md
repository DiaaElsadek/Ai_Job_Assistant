# JobFlow AI

JobFlow AI is a single-user personal job-search and networking dashboard designed for a software developer targeting **React.js / Next.js** opportunities in Egypt (and remote).

It combines a focused CRM with AI outreach generation, manual outreach tracking, and analytics — built with speed, clarity, and daily usability as core priorities.

---

## Architecture Overview (Phase 1)

JobFlow AI follows a modern Next.js App Router architecture with strict server/client boundary separation and zero separate backend services.

```
ai_job_assistant/
├── app/
│   ├── (dashboard)/             # Authenticated route group with App Shell
│   │   ├── layout.tsx           # Sidebar, TopBar, Theme provider wrapper
│   │   ├── page.tsx             # Dashboard overview with real metrics
│   │   └── companies/           # Companies CRM (Vertical Slice)
│   │       ├── page.tsx         # Server component with filtering & pagination
│   │       └── [id]/page.tsx    # Company detail with tech stack & notes
│   ├── api/auth/[...nextauth]/  # Auth.js route handler
│   ├── login/                   # Clean single-owner login portal
│   ├── globals.css              # Dark-first design tokens & Linear aesthetics
│   └── layout.tsx               # Root layout with Geist typography & Toaster
├── prisma/
│   ├── schema.prisma            # Database schema with full relational models
│   └── migrations/              # Committed PostgreSQL migrations
├── src/
│   ├── components/
│   │   ├── companies/           # Company Dialogs, Tables, and Detail views
│   │   ├── layout/              # Sidebar, TopBar, and Navigation drawers
│   │   └── ui/                  # Accessible design system components (Button, Input, Select, Dialog, Badge, EmptyState)
│   ├── lib/
│   │   ├── auth.ts              # Auth.js Credentials configuration
│   │   ├── utils.ts             # Tailwind class merging utility
│   │   └── validations.ts       # Shared Zod validation schemas
│   └── server/
│       ├── actions/             # Next.js Server Actions with Zod validation
│       ├── auth.ts              # Session verification helper (requireAuth)
│       ├── data/                # Data-access layer (Prisma queries)
│       └── db.ts                # PrismaClient singleton instance
├── docker-compose.yml           # Local PostgreSQL container configuration
└── vitest.config.ts             # Vitest test suite configuration
```

### Key Architectural Principles

1. **Server Components by Default**: Pages fetch data directly via the data-access layer (`src/server/data/*`). DB queries never reside directly inside component files.
2. **Mutations via Server Actions**: All data changes go through typed Server Actions (`src/server/actions/*`) which validate inputs via Zod, verify session authentication with `requireAuth()`, execute operations through the data layer, and trigger Next.js cache revalidation via `revalidatePath()`.
3. **Single-Owner Authentication**: Auth.js with a Credentials provider verifying `OWNER_EMAIL` and `OWNER_PASSWORD_HASH` (bcrypt). Protected with both Next.js edge middleware and server-side session checks in every action.
4. **Relational Data Integrity**: Built on PostgreSQL with Prisma ORM, utilizing foreign key constraints with cascade behaviors, indexed query columns, and UUID primary keys.
5. **Design System**: Tailored dark-first aesthetic inspired by Linear, with deep charcoal surfaces, subtle borders, restrained amber accents, persistent collapsible sidebar, mobile drawer, and RTL text support (`dir="auto"`).

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose (for local PostgreSQL)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your settings:
```env
DATABASE_URL="postgresql://jobflow:jobflow_dev@localhost:5432/jobflow?schema=public"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
OWNER_EMAIL="owner@example.com"
OWNER_PASSWORD_HASH="generate-with-bcrypt-hash-script"
```

### 3. Start Local PostgreSQL Database
```bash
docker compose up -d
```

### 4. Run Migrations & Generate Prisma Client
```bash
npx prisma migrate dev
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quality Checks

Run the test suite:
```bash
npm test
```

Run TypeScript type check:
```bash
npm run typecheck
```

Run ESLint:
```bash
npm run lint
```

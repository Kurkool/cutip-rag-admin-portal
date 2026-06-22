# VIRIYA Admin Portal

Web admin console for the **VIRIYA** multi-tenant RAG chatbot platform. Program staff use it to manage tenant configuration, upload curriculum documents, monitor LINE chat activity, and inspect analytics.

This repository ships only the frontend. The Python backend services (chat, ingest, admin APIs) live in the sibling repository `cutip-rag-chatbot` and are required for the portal to function.

## Features

| Area | Pages | Purpose |
|---|---|---|
| **Auth** | `/login` · `/register` · `/registrations` · `/onboarding` | Firebase email login, self-service registration with admin approval flow, first-time setup wizard |
| **Tenants** | `/tenants` · `/tenants/new` · `/tenants/[id]` | List, create, and edit faculty tenants (LINE OA credentials, persona, Pinecone namespace, Drive folder) |
| **Documents** | `/tenants/[id]/documents` | Upload curriculum documents to a tenant's Drive folder, trigger Smart Scan (NEW / RENAME / OVERWRITE / SKIP), monitor ingest jobs |
| **Chat Logs** | `/tenants/[id]/chat-logs` | Inspect per-tenant chat history with filters and search |
| **Analytics** | `/tenants/[id]/analytics` | Per-tenant usage charts (Recharts): message volume, token cost, response quality |
| **Users** | `/users` | Admin-side user management |
| **Billing** | `/billing` | Subscription tier and usage-based billing view |
| **Settings** | `/settings` | Account and workspace settings |

## Tech stack

- **Framework**: Next.js 16 (App Router, standalone output)
- **UI**: React 19 + shadcn/ui v4 + Tailwind CSS v4
- **Auth**: Firebase Authentication (email/password + Google)
- **Charts**: Recharts
- **Notifications**: sonner (toast)
- **Theming**: next-themes (light/dark)
- **Testing**: Vitest + React Testing Library + jsdom
- **Type system**: TypeScript 5

## Prerequisites

- **Node.js 22+** (or 20+) and `npm`
- **Firebase project** with Authentication enabled
- A running deployment of the backend services from `cutip-rag-chatbot` (the chat API and ingest worker URLs are required in environment variables)

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/Kurkool/admin-portal.git
cd admin-portal
npm install
```

### 2. Configure environment variables

Create `.env.local` at the project root. The shape (with placeholders) is:

```env
# Backend service URLs (Cloud Run endpoints from cutip-rag-chatbot)
NEXT_PUBLIC_API_URL=https://cutip-admin-api-<...>.run.app
NEXT_PUBLIC_INGEST_URL=https://cutip-ingest-worker-<...>.run.app
NEXT_PUBLIC_API_KEY=<admin-api-key>

# Firebase Auth (Firebase Console → Project Settings → Web app)
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-web-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
```

For production deployments, also set:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<oauth-client-id>.apps.googleusercontent.com
NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL=<service-account>@<project>.iam.gserviceaccount.com
```

### 3. Run the dev server

```bash
npm run dev
```

The portal will be available at [http://localhost:3000](http://localhost:3000).

### 4. Run the tests

```bash
npm test
```

Vitest runs the suite once. Use `npm run test:watch` for watch mode during development.

## Project structure

```
admin-portal/
├── README.md
├── package.json
├── next.config.ts            ← standalone output for Docker
├── Dockerfile                ← multi-stage build for Cloud Run
├── tsconfig.json
├── vitest.config.ts
├── components.json           ← shadcn config
├── public/                   ← static assets + VIRIYA logo
│   └── logo/                 ← viriya-icon-mark / horizontal / primary SVGs
└── src/
    ├── app/                  ← Next.js App Router pages
    │   ├── page.tsx          ← dashboard
    │   ├── login/, register/, onboarding/, registrations/
    │   ├── tenants/          ← list, new, [id] (detail, documents, chat-logs, analytics)
    │   ├── users/, billing/, settings/
    │   └── layout.tsx
    ├── components/           ← shared UI components
    │   └── ui/               ← shadcn primitives
    ├── lib/                  ← Firebase client, API client, utilities
    └── __tests__/            ← Vitest test files
```

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js in development mode on port 3000 |
| `npm run build` | Production build (standalone output for Docker) |
| `npm start` | Run the production build locally |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

## Deploy to Cloud Run

The Dockerfile uses a multi-stage build that bakes `NEXT_PUBLIC_*` variables into the static assets at build time. Pass them as build args:

```bash
gcloud run deploy cutip-admin-portal \
  --source=. \
  --region=asia-southeast1 \
  --project=<gcp-project> \
  --build-env-vars \
    NEXT_PUBLIC_API_URL=https://cutip-admin-api-<...>.run.app,\
    NEXT_PUBLIC_API_KEY=<admin-api-key>,\
    NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-key>,\
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com,\
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id> \
  --quiet
```

`.gcloudignore` excludes `node_modules/`, `.next/`, and test artifacts so the build context stays small.

## ⚠️ Important: Next.js 16

This project runs on **Next.js 16**, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from older Next.js training material and tutorials. Before changing any framework-level code, consult the official Next.js 16 documentation rather than older guides.

## Related repository

The backend (Python FastAPI services for chat, ingest, admin APIs) lives in the sibling repository `cutip-rag-chatbot`. The portal will not function without those services deployed and reachable via the URLs configured in `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_INGEST_URL`.

## Contributing

Conventions:

- **Type-safety**: TypeScript strict mode is on. Avoid `any`.
- **Components**: Prefer shadcn primitives from `src/components/ui/`. Add a new primitive with the shadcn CLI rather than hand-rolling.
- **Styling**: Tailwind utility classes; reserve custom CSS for animations and complex layouts.
- **Tests**: Vitest + React Testing Library. Write tests for non-trivial logic and critical user flows.
- **Linting**: Run `npm run lint` before pushing.
- **Format**: ESLint config follows `eslint-config-next`. No Prettier — let ESLint and editor defaults handle formatting.

## License

Released under the MIT License. See `LICENSE` for the full text.

## Contact

For questions about the project, open an issue on GitHub or contact the maintainers directly.

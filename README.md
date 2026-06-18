# SpendSense Web

Next.js 14 frontend for SpendSense — an income-first personal budgeting app.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node |
| buf CLI | latest | `npm install -g @bufbuild/buf` — needed to regenerate proto types |

The backend must be running locally for API calls to work. See [SpendSense-backend](../SpendSense-backend/).

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run generate
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment variables

`.env.local` is gitignored. Copy from `.env.local.example`:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend ConnectRPC base URL |
| `NEXT_PUBLIC_FEATURE_GOOGLE_AUTH` | `false` | Set to `true` to enable the Google sign-in button |

## Commands

```bash
npm run dev          # dev server on http://localhost:3000 (with hot reload)
npm run build        # production build
npm run start        # start production build
npm run lint         # ESLint
npm run generate     # regenerate TypeScript types from BSR proto
```

## Architecture

```
src/
  app/
    (auth)/          # login, register — no auth guard
    (app)/           # authenticated pages — redirects to /login if no token
      budgets/       # budget list + budget detail pages
    api/auth/        # Next.js API routes for setting/clearing the JWT cookie
  components/
    auth/            # LoginForm, RegisterForm
    budget/          # BudgetList, BudgetView, IncomePanel, PaymentMethodsPanel, TransactionsPanel
    budget/modals/   # AddIncomeModal, AddPeopleModal, AddTransactionModal, AddCategoryModal
    ui/              # ErrorSnackbar, FeatureFlag, ThemeRegistry
  context/
    AuthContext.tsx  # creates ConnectRPC transport with Bearer interceptor
  gen/               # generated proto types (do not edit — run npm run generate)
  hooks/
    useClient.ts     # creates a typed ConnectRPC client from the active transport
    useViewPreference.ts  # persists tabbed/split view mode to localStorage
  lib/
    api/client.ts    # transport factory + unauthenticated public transport
    auth/token.ts    # cookie name and options
    config/features.ts   # feature flag helpers
    logger/index.ts  # structured logger (logger.info / logger.error)
```

### Auth flow

1. User submits credentials → `createClient(AuthService, publicTransport).login()`
2. JWT returned as `access_token` → POST to `/api/auth/set-token` which writes an `httpOnly` cookie
3. `(app)/layout.tsx` (server component) reads the cookie; redirects to `/login` if absent
4. Cookie value passed as prop to `AuthProvider` → creates ConnectRPC transport with `Authorization: Bearer` header
5. All API calls use this transport via the `useClient(ServiceType)` hook

### Making API calls

Use the `useClient` hook with `useQuery` / `useMutation` from `@tanstack/react-query`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'

function MyComponent() {
  const client = useClient(BudgetService)

  const { data } = useQuery({
    queryKey: ['budgets', 'list'],
    queryFn: () => client.listBudgets({}),
  })

  const { mutateAsync } = useMutation({
    mutationFn: (name: string) => client.createBudget({ name }),
  })
}
```

> `@connectrpc/connect-query`'s own `useQuery`/`useMutation` hooks are intentionally bypassed. They require protobuf v2 method descriptors; the current BSR-generated code is protobuf v1. The `useClient` + TanStack Query pattern is equivalent and version-stable.

### Feature flags

```typescript
import { isEnabled } from '@/lib/config/features'

if (isEnabled('googleAuth')) { ... }
```

Flags read from `NEXT_PUBLIC_FEATURE_*` env vars. Add new flags to `src/lib/config/features.ts`.

### Logging

```typescript
import { logger } from '@/lib/logger'

logger.info('budget.create', { budgetId, name })
logger.error('auth.login.failed', { email, error: message })
```

### Proto type generation

Types in `src/gen/` come from the BSR module `buf.build/xpendsense/spendsense`:

```bash
npm run generate
```

Never edit files in `src/gen/` manually. Re-run after any proto change is published to BSR.

## Backend CORS

The backend must allow `http://localhost:3000`. Start it with `make run` from `SpendSense-backend/`.

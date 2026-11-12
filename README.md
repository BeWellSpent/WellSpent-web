# WellSpent Web

The marketing site for WellSpent, an income-first budgeting app for iPhone (Android next). There is no web app: this repo is the one-page site at bewellspent.com plus the pages email and sign-in links land on.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev        # http://localhost:3000
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | The C# backend; only used to redeem email-verification links |
| `NEXT_PUBLIC_APP_STORE_URL` | The App Store listing. Empty shows "Coming soon" |

## Commands

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint
npm test
```

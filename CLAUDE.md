# CLAUDE.md — WellSpent-web

The marketing site for WellSpent (bewellspent.com). **WellSpent is a mobile app; there is no web app.** The parked budgeting app was removed on 2026-11-12, leaving:

- `/[locale]` — the one-page site (`src/components/landing/`), designed on the canvas's Website page in the iOS app's design language.
- `/[locale]/verify-email/[token]` — redeems the link in the verification email (the site's only backend call, `src/lib/api.ts`).
- `/[locale]/invite/[token]` — where an invite link lands without the app installed; with it, iOS opens the app via `public/.well-known/apple-app-site-association`.
- `/auth/callback` — Google sign-in's redirect URI, shared with iOS. Keep it: the iOS sign-in session intercepts it.

`public/.well-known/apple-app-site-association` must stay: it is how invite links, Plaid's OAuth redirect and the Google callback open the iOS app.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm test
```

## Conventions

- **next-intl, `en` and `es`.** Every string lives in `messages/en.json` and `messages/es.json` with identical keys. `src/i18n/__tests__/translationKeys.test.ts` checks literal `t('…')` keys and locale parity; keys built from data (feature groups, pricing rows) are checked by `src/components/landing/__tests__/landingKeys.test.ts`.
- **Free and Pro tags must match what the app enforces.** `features/featureGroups.ts` and `pricing/plans.ts` hold them; when a limit changes in the backend, change it here too.
- **The app's palette** is in `src/components/ui/ThemeRegistry.tsx` (light and dark). Use theme tokens (`background.paper`, `text.secondary`, `primary.main`), not hex, except inside the phone mockup, which draws the app as it looks.
- **One concern per file**, pure data in `.ts`, no dead code: run `npx knip` before finishing.
- **Every change works at phone width.** Layouts wrap with flex/grid `auto-fit`; nothing scrolls sideways except the comparison table, in its own box.
- `NEXT_PUBLIC_APP_STORE_URL` flips every App Store button from "Coming soon" to a download link.

## Version bump (required for every change)

`package.json`: patch for fixes and copy, minor for new sections, major for a redesign. Write the release note in `changelog/web-<version>.json` (see `changelog/README.md`); never publish it from a feature.

## Git workflow

`main` is production (Vercel). Never commit to `main`; never add AI attribution to commits.

```bash
git checkout develop && git pull origin develop
npm run build && npm run lint && npm test
git add <files>
git commit -m "feat: ..."
git push origin develop
gh pr create --base main --head develop --title "..." --body "..."
gh pr merge develop --auto --merge
```

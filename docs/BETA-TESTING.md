# Adams Eden Beta Readiness and Test Plan

This checklist and guide covers preparing the website and mobile app for a closed beta, what to test, and how to report issues.

## 1) What’s shipping in this beta

- Tracker stability fix (web): crash resolved; page renders and updates milestones
- Stage label standardization: “vegetative growth/flowering” across web and mobile
- UI normalization: legacy data displays consistently without requiring a backend migration
- Optional data normalization (self-serve): `/tools/normalize-tracker` page lets a signed-in user preview/apply fixes
- Outside-click-to-close for the user menu in the top navigation (plus Escape key and auto-close on route changes)
- Planner defaults updated to the new stage label
- Mobile (modern tracker + context) updated to new label and normalization

Known items not in scope for this beta:
- Classic mobile tracker screen has unrelated TypeScript issues (screen likely not in use)
- Socials pages display <img> warnings; non-blocking, can be refactored later to Next `<Image>`

## 2) Website beta: prepare and deploy

Prerequisites:
- Node 18+ (project uses Next.js 14)
- Firebase project created with a Web App (collect Web API config)
- NOAA token (optional features): create at https://www.ncdc.noaa.gov/cdo-web/token

Environment variables:
- Copy `adams-eden-website/.env.example` to `.env.local` and fill values.
- Optionally copy `adams-eden-website/.env.local.example` to `.env.local` to add `NEXT_PUBLIC_NOAA_TOKEN`.

Local verification (already validated here):
- Production build passes: `npm run build` in `adams-eden-website/`.
- Known non-blocking warnings remain (Next `<Image>` suggestions in socials pages).

Deploy (Vercel recommended):
- Import the `adams-eden-website` project in Vercel
- Environment Variables (Production/Preview):
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
  - NEXT_PUBLIC_NOAA_TOKEN (optional)
  - STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (optional)
- Build command: `next build`; Node: 18+
- After deploy, smoke test the site root, login, planner, tracker, socials/messages, profile

Firestore rules and data:
- Confirm Firestore rules are up to date (see `firebase-security-rules.txt` and `DEPLOY-RULES-NOW.md` at repo root if applicable)
- For broad data normalization (optional), run the admin script from `adams-eden-website/`:
  - `npm run migrate:tracker-stages -- --dry-run --output changes.json` (requires Admin creds)
  - Add `--creds <service-account.json>` if not using application default credentials
  - Then run without `--dry-run` to apply
- Alternatively, ask testers to use the in-app tool at `/tools/normalize-tracker` after sign-in

## 3) Website beta test checklist

Functional
- Auth
  - Sign up and sign in, sign out; session persistence is session-only (expected)
- Navigation
  - User avatar menu opens; clicking outside or pressing Escape closes it
  - Menu closes automatically after navigation
- Tracker
  - Stage shows as “vegetative growth/flowering” where applicable
  - Milestones toggle correctly; sorting and rendering stable
  - In-app normalization tool previews and applies changes for the current user
- Planner
  - Default milestones include “vegetative growth/flowering”
- Socials
  - Messages page loads; wrapper Suspense avoids build-time issues; composing CTA routes correctly
- Shop/cart (if enabled)
  - Cart icon renders and opens

Non-functional
- Layout and styling consistent across viewport sizes
- No console errors in critical paths (Home, Login, Planner, Tracker, Messages)

Known warnings
- `<img>` usage in some Socials pages; acceptable for beta

## 4) Mobile app beta (Expo)

Prerequisites:
- Expo account set up with EAS
- Apple Developer and Google Play accounts for TestFlight/Internal testing

Suggested steps:
- Ensure `app.json` has correct bundle identifiers (iOS) and package name (Android)
- Initialize EAS if not already:
  - `npm i -g eas-cli`
  - `eas login`
  - `eas build:configure` (creates `eas.json`)
- Start internal builds:
  - iOS: `eas build -p ios --profile preview`
  - Android: `eas build -p android --profile preview`
- Distribute via TestFlight / Play Internal Test

Mobile beta checklist
- Tracker modern screen shows and uses the “vegetative growth/flowering” label
- Any legacy entries display normalized labels
- Core navigation and auth flows run without crashes

## 5) Issue reporting

- Collect repro steps, screenshots, and expected vs actual behavior
- Note platform, browser/OS, and URL/screen
- File issues in the project tracker or send to the team channel

## 6) Rollback and safety

- No destructive migrations were run by default; the UI normalizes data at display time
- If the admin script is used to normalize data, it supports a dry-run and change log output
- You can revert specific docs using the recorded changeset if necessary

---

Questions or want me to handle the deploy setup (Vercel/EAS) directly? Ping me and I’ll wire it up.

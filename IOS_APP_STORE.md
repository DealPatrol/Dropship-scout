# Dropship Scout for iPhone — App Store checklist

The iPhone app is a **hybrid Capacitor 8 app**. It ships an offline **Scout Kit** inside the binary (watchlist, margin calculator, supplier notes, backups, reminders, Face ID lock) and opens the signed-in **online workspace** at `https://getdropshipscout.com` in the same native shell. The website is unchanged for browsers: every iOS-only behavior is keyed off the `DropshipScoutiOS/1.0` user-agent token (server) or `isNativeIos()` (client).

## Identity

| Field | Value |
|---|---|
| App name | Dropship Scout: Product Research (30 chars max) |
| Subtitle | Margins, suppliers, launch plans |
| Bundle ID | `com.colecollins.dropshipscout` |
| SKU | `dropshipscout-ios-001` |
| Version / build | 1.0.0 / 1 (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`) |
| Category | Business · secondary: Productivity |
| Devices | iPhone, portrait, iOS 15+ |
| Age rating | 4+ (questionnaire: no UGC shown to others in-app, unrestricted web access **No** — off-domain links open in Safari) |
| Price | Free, with an auto-renewable subscription |
| Subscription group | `Dropship Scout Pro` (`DROPSHIPSCOUTPRO`) |
| Products | `com.colecollins.dropshipscout.pro.monthly` (1 month, suggested $29.99) · `com.colecollins.dropshipscout.pro.yearly` (1 year, suggested $299.99) |
| Encryption export | `ITSAppUsesNonExemptEncryption = NO` (Info.plist) |
| URL scheme | `dropshipscout://` |

## Architecture

```
iOS binary (Capacitor 8, Swift Package Manager)
├── capacitor://localhost  → native-app/ (Vite, bundled, works offline)
│     Scout Kit tabs: Watchlist · Calculator · Suppliers · Workspace · Settings
│     Storage: @capacitor/preferences (UserDefaults), never WebView-only storage
├── https://getdropshipscout.com (server.allowNavigation) → Next.js workspace
│     Capacitor bridge is injected, so the same native plugins work there
│     Other hosts open in Safari; server.errorPath → offline.html
└── DropshipScoutNativePlugin.swift
      StoreKit 2 (products, purchase with appAccountToken, restore, entitlements,
      Transaction.updates listener, manage subscriptions) + Face ID / Touch ID
```

Server side (same Next.js app, deployed by the normal Vercel pipeline after merge):

| Route | Purpose |
|---|---|
| `POST /api/billing/apple` | Verifies StoreKit 2 JWS (x5c chain pinned to Apple Root CA G3, Apple OIDs, ES256), checks bundle id / product id / `appAccountToken` = user id, stores the subscription, sets plan |
| `POST /api/apple/notifications` | App Store Server Notifications V2 (renewals, expirations, refunds, revocations), idempotent by `notificationUUID` |
| `POST /api/account/delete` | In-app account deletion (password + typed `DELETE`) |
| `GET /api/billing/status` | Returns `source: 'apple' | 'stripe' | null`; expires lapsed Apple subscriptions after a 3-day grace window |
| `POST /api/billing/checkout`, `/portal` | Return **403** to the iOS app (Stripe stays web-only) |

Schema changes are additive (`apple_*` columns on `users`, `apple_notifications` table) and run automatically through `lib/database.ts` on first request after deploy. `schema.sql` documents them.

## Why this passes App Review

| Guideline | How Dropship Scout meets it |
|---|---|
| **4.2 Minimum functionality** | Not a website wrapper: the app **launches into bundled native-app code** (no `server.url`) and the Scout Kit works in airplane mode. Native features: offline product watchlist + margin calculator + supplier notes in native Preferences; iOS share sheet for CSV/JSON backups, research cards and supplier briefs, and for exports from the online workspace (launch plans, store CSVs); weekly local-notification review reminders with tap-to-open deep links; Face ID / Touch ID / passcode app lock; haptics; native status bar; app-switcher privacy cover; `dropshipscout://` deep links (`watchlist`, `calculator`, `suppliers/<id>`, `settings`, and allow-listed `dashboard/*` paths); “Save to Scout Kit” from any product in the workspace. Web-only elements (pricing pages, ad pixels, sister-site banners, Stripe copy) are hidden in the app. |
| **2.1 App completeness** | Fixed in this PR: AI search used retired Anthropic model ids and failed for every user (now current models, env-overridable, friendly 503 if no key); the production build was broken by an unused import; “coming soon” sales channels are hidden in the app. See *Known gaps* below. |
| **3.1.1 In-app purchase** | Pro in the app is sold only through StoreKit 2 (own Swift plugin, no third-party SDK). **Restore Purchases** and **Manage subscription** buttons in Settings → Pro. No Stripe checkout, portal, price or external purchase link is reachable in the app (UI hidden + middleware redirects `/pricing` → `/dashboard/settings#pro` + API returns 403). Accounts that already pay on the web see “Pro is active” with no link out (allowed by 3.1.3(b) multiplatform). |
| **3.1.2 Subscriptions** | Panel shows title, length, price per period, auto-renew disclosure, and links to Terms of Use (Apple standard EULA referenced in `/terms`) and Privacy Policy. Add the same links to the App Store description. |
| **5.1.1(v) Account deletion** | Settings → **Delete account** (bottom of the page). Requires password + typing `DELETE`; cancels any Stripe subscription, deletes the user and owned data (saved products, catalogs, launches, store, listings, orders, credentials, supplier profile, watch-list email). Tells the user to cancel an App Store subscription in iOS Settings (Apple does not allow apps to cancel it). Blocked only while a live paid order is still being fulfilled, with a support path. |
| **4.8 Sign in with Apple** | **Not required:** the app has email + password accounts only, no Google/Facebook/other third-party login. If social login is ever added, Sign in with Apple must be added at the same time. |
| **5.1.2 / ATT** | No tracking in the app: Google Ads / Meta pixels are not rendered for the iOS user agent; no IDFA, no ATT prompt needed. |
| **2.3 Metadata** | Screenshots must be taken from the iPhone build. Do not mention Android, “web app” or web prices in metadata. |

## App Privacy (“nutrition label”) answers

Data **collected** and **linked to the user**, used for **App Functionality** only, **not used for tracking**:

- Contact info → Email address (account login)
- User content → Other user content (saved products, launch plans, store listings, supplier notes you sync)
- Identifiers → User ID (account id, also sent as StoreKit `appAccountToken`)
- Purchases → Purchase history (subscription status)

Not collected: location, contacts, health, browsing history, device ID, advertising data, diagnostics (no crash/analytics SDK in the app). Scout Kit data stays on the device unless the user shares or backs it up.

`PrivacyInfo.xcprivacy` is included (no tracking; required-reason APIs: UserDefaults `CA92.1`, file timestamps `C617.1`).

- Privacy Policy URL: `https://getdropshipscout.com/privacy` (iOS section added in this PR; goes live after merge + deploy)
- Terms / EULA: `https://getdropshipscout.com/terms`
- Support URL: `https://getdropshipscout.com/contact`
- Marketing URL: `https://getdropshipscout.com`

## Metadata draft

**Promotional text:** Check margins before you test a product. Keep a private watchlist, supplier notes and a launch plan in your pocket — even offline.

**Description:**
> Dropship Scout helps you decide which products are worth testing, before you spend on ads.
>
> • **Scout Kit (works offline)** — a product watchlist with live margin math, a profit calculator with fees, shipping, returns and ad cost per order, and supplier notes with shipping times and ratings.
> • **Share anywhere** — send research cards, supplier briefs and CSV exports to Files, AirDrop, Mail or Notes.
> • **Weekly review reminders** and **Face ID lock** for your research.
> • **Online workspace** — AI product research, saved products, launch plans, and a hosted store.
>
> **Dropship Scout Pro** (auto-renewing subscription, monthly or yearly): more saved launch workspaces and higher limits. Payment is charged to your Apple ID and renews automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel in Settings → Apple ID → Subscriptions.
> Terms of Use: https://getdropshipscout.com/terms · Privacy: https://getdropshipscout.com/privacy
>
> Dropship Scout gives estimates for planning; it does not guarantee sales or profits.

**Keywords (100):** `dropshipping,product research,profit calculator,margin,supplier,ecommerce,shopify,winning products`

**Screenshots (6.9", 1320×2868, from the Simulator):** Watchlist, Calculator, Suppliers, Workspace dashboard, Settings → Pro, Settings (Face ID + reminders). Simulator-free previews of the bundled hub are in the PR description for layout reference only.

## App Review notes (paste into App Store Connect)

> Demo account: **reviewer@getdropshipscout.com / (set a password)** — create this account on production before submitting.
> The app opens to Scout Kit, which works offline: add a product in Watchlist, see live margins, tap Share to send a research card (iOS share sheet). Calculator and Suppliers tabs work the same way. Settings → Face ID lock and Weekly review reminder are native features.
> Workspace tab → Sign in with the demo account to open the online workspace. Product pages have “Save to Scout Kit”. Exports open the iOS share sheet.
> Pro is sold only with in-app purchase: Workspace → Settings → Pro (Subscribe / Restore Purchases / Manage). Use a Sandbox tester.
> Account deletion: Workspace → Settings → Delete account (bottom).
> The app has no third-party sign-in, so Sign in with Apple is not offered.

## Build & ship (free path)

1. **Identifiers:** Certificates, IDs & Profiles → App ID `com.colecollins.dropshipscout` (In-App Purchase is on by default; nothing else needed — no push, no associated domains).
2. **App Store Connect → + New App** → iOS, name, Bundle ID, SKU above.
3. **Monetization → Subscriptions:** group `Dropship Scout Pro`; add `com.colecollins.dropshipscout.pro.monthly` and `.yearly` (same level), prices, localized name/description, review screenshot (Settings → Pro). Submit them **with** the first binary.
4. **App Information → App Store Server Notifications:** Production and Sandbox URL `https://getdropshipscout.com/api/apple/notifications`, **Version 2**.
5. **Agreements, Tax and Banking:** accept the **Paid Apps agreement**, add bank + tax info. Apply for the **App Store Small Business Program** (15%).
6. **Deploy the web changes first** (merge this PR → Vercel). The app depends on `/api/billing/apple`, `/api/account/delete`, the native user-agent middleware and the updated privacy policy being live. No new env vars are required; optional `ANTHROPIC_SEARCH_MODEL` / `ANTHROPIC_FAST_MODEL`.
7. **Xcode Cloud** (25 free hours/month): connect `DealPatrol/Dropship-scout`, workflow on `main`, scheme `App`, action **Archive – iOS**, post-action **TestFlight (Internal)**. `ios/App/ci_scripts/ci_post_clone.sh` installs Node 22 if missing, runs `pnpm@10.33.3 install --frozen-lockfile` and `build:ios` (Scout Kit build + `cap sync ios`). No secrets needed.
   - On a Mac: `npx pnpm@10.33.3 install && npx pnpm@10.33.3 build:ios && npx pnpm@10.33.3 ios:open`, set the Team, Product → Archive.
8. **Local StoreKit testing:** the shared `App` scheme points at `App/DropshipScout.storekit` (Edit Scheme → Run → Options → StoreKit Configuration; re-select it there if Xcode shows it as missing). Purchases made with the local file are signed by Xcode, not Apple, so the server sync rejects them by design — use TestFlight + a Sandbox tester to test end-to-end entitlement sync.
9. **TestFlight checklist:** subscribe (Sandbox), restore on a second install, cancel in Sandbox settings → plan returns to Free after expiry; Face ID lock; reminder permission + tap opens Watchlist; share sheet for card, CSV, backup, workspace export; airplane mode → Scout Kit works, Workspace shows offline page; deep link `dropshipscout://calculator` from Notes; delete a test account.
10. Create the reviewer demo account, then submit with the notes above.

## Known gaps / risks (honest)

- **Swift was not compiled in CI** (no macOS here). `DropshipScoutNativePlugin.swift` was checked by hand against Capacitor 8 and StoreKit 2 APIs; expect possibly small fixes on the first Xcode build.
- **2.1 risk — online workspace content:** the AI search needs `ANTHROPIC_API_KEY` on Vercel and the model ids above. Verify a real search works on production before submitting. The sample discovery catalog is labelled demo data.
- **Stripe Connect onboarding** (for sellers getting paid from the hosted store) opens in Safari. This is payouts to the user, not a purchase, so 3.1.1 does not apply, but expect a reviewer question; the review notes can mention it.
- Marketing guide articles on the website still mention Stripe in body copy; they are not linked from the app's navigation.
- Sandbox transactions are accepted by the server (required for App Review and TestFlight). Each transaction must still be Apple-signed and carry the user's `appAccountToken`.
- Apple subscriptions cannot be cancelled by the server on account deletion; the app tells the user how to cancel.

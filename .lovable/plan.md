# Plan: Client Onboarding → Quote → Payment → Playlist

This is a big change so let me lay it out clearly. I'll ship it in one pass but split into focused pieces.

## 1. AI & Special Features — tabbed page
Replace the vague "AI & Special Features" tile with a real page (`/client?section=ai-features`) that shows a **tab bar** where each tab is one feature, with short description + CTA:
- Wedding / Event Coordinator (AI chat)
- Invitation Creator
- AI Event Planner (existing)
- Timeline Builder
- Humor Assistant
- Virtual Rehearsal
- Voice Console
- Avatar Concierge
Each tab renders the existing component (already in `src/components/planner/…`, `humor/…`, `avatar/…`, etc.), so no new AI logic — just presentation.

## 2. Post-signup event questionnaire (auto-redirect)
When a user signs up (email OR Google), if they have no `event_intake` row → redirect to **`/client/intake`** before the portal loads.

Form fields:
- Full name (prefilled)
- Event type (dropdown)
- Event date, start time, end time
- Venue name (Google-Places autocomplete-style suggestions)
- Venue address
- Guest count (rough)
- Indoor / outdoor
- Notes

Venue autocomplete uses OpenStreetMap Nominatim (already used in `src/lib/distanceCalculator.ts`, no API key). On selection we store lat/lng + computed distance from Hatfield Square using the existing `calculateDistanceFromBase()` and apply the R7.50/km rule (first 33km free) via existing pricing utilities.

Saved to a new table `event_intakes` (client_id, all fields above, distance_km, travel_fee_cents).

## 3. Quote path — package or custom
After intake the portal home shows two buttons:

**A. "Choose a package"** — package grid. On click:
1. Read the package's included items from `packages` (already in schema).
2. Auto-build a `quote_requests` row with: package_id, all intake data (date/venue/etc.), guest_count.
3. Show a **line-item preview** — every item in the package listed with unit price, quantity, subtotal, plus travel fee + any active discount from `useActiveDiscount`.
4. "Accept & Continue" → shows T&C (from existing `TermsUploader` content) → checkbox + timestamp → creates the `quote` row (status `accepted`) → routes to payment.

**B. "Request custom quote"** — extended questionnaire:
- Indoor/outdoor
- Sound: our system / venue system (with short explainer)
- Microphones (how many, wired/wireless)
- Lighting? (yes/no + type: uplighting, moving heads, par cans — each with 1-line explanation)
- Special effects? (yes/no + which: smoke, low-fog, cold spark, lasers — each with explainer + safety note)
- Additional notes
On submit → `quote_requests` insert (status `pending`) → admin real-time notification (already wired via `admin_notifications` trigger, but I'll add a toast on admin dashboard).

## 4. Payment — Stripe (Lovable-managed)
Enable **Seamless Stripe Payments** (built-in, no keys). After T&C acceptance user lands on `/client/pay/:quoteId`:
- Two buttons: **Pay 30% deposit (secures booking)** / **Pay full amount now**
- Creates Stripe Checkout Session via edge function `create-checkout`
- Webhook `stripe-webhook` updates `quotes.deposit_paid` / `quotes.full_paid`, inserts `admin_notifications` row, sends admin toast via realtime.

I'll call `payments--recommend_payment_provider` then `payments--enable_stripe_payments` at the start of implementation — the user needs to fill the onboarding form once.

## 5. Post-payment: Music Planning unlocks
Existing `MusicPlanningForm.tsx` already handles must-play/do-not-play/wedding-moment songs/timeline/MC notes. I'll:
- Surface it as a **dedicated highlighted card** on the portal home once `deposit_paid=true`
- Add cue-moment timing fields (song X at HH:MM) — small extension to existing form
- Route to `/client?section=playlist` from a new "🎧 Build your playlist" hero card

## 6. Admin notifications
DB triggers already exist for `quote_requests`, `quote_messages`, `event_plans`. I'll add:
- Trigger for `quotes` payment status change
- A toast on `AdminDashboard` that fires on realtime insert into `admin_notifications` where `type` starts with `payment_`.

## Files to add / edit

**New:**
- `src/pages/ClientIntake.tsx` (post-signup questionnaire)
- `src/pages/CheckoutPay.tsx` (Stripe deposit/full choice)
- `src/pages/CheckoutSuccess.tsx`
- `src/components/client/AiFeaturesTabs.tsx`
- `src/components/client/VenueAutocomplete.tsx`
- `src/components/client/CustomQuoteWizard.tsx`
- `src/components/client/PackageQuoteBuilder.tsx`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Edit:**
- `src/pages/ClientPortal.tsx` — replace AI tile with route to tabbed page, add intake redirect gate, add payment/playlist gates
- `src/pages/Auth.tsx` — after signup, redirect to `/client/intake`
- `src/App.tsx` — new routes
- DB migration — `event_intakes` table + payment trigger

## Technical notes
- Venue geocoding uses existing Nominatim helper — no new API keys.
- Package auto-quote reads `packages.included_items` (JSONB) already in schema; if the field is empty for a package I'll show a "Package details missing — request custom quote instead" fallback rather than crash.
- Distance charged = `max(0, distance_km - 33) * 7.50` per existing rule.
- All new tables get GRANT + RLS per project conventions.

## Testing after build
Playwright script: sign up → intake → pick package → accept T&C → Stripe test checkout → verify webhook flips `deposit_paid` → verify playlist card appears → verify admin notification row created.

Shall I proceed? This will enable Stripe (you'll get a one-time onboarding form to fill).

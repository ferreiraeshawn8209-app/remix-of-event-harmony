## Landing Page Restructure

New section order on `/` (signed-out and as a teaser for signed-in clients):

1. **AI Event Coordinator hero** — a chat widget pinned at the top with a friendly persona (working name: **"Kulture"**). Auto-greets the visitor, introduces 4 features (Custom Quotes, Event Planner, QR Song Requests, AI Coordinator) and nudges them to pick a package. Backed by a new `chat-coordinator` edge function using Lovable AI (`google/gemini-3-flash-preview`), system-prompted with current packages, active special, and contact info.
2. **Upcoming Events / Bookings ticker** — horizontally scrolling strip of upcoming events (date • event type • city) from the `events` table, anonymised (no client names).
3. **Specials banner** — existing `SpecialsManager` image carousel.
4. **Packages** — in this exact order, each card admin-editable:
   1. **Customized Quote** (expanded description + "Build my quote" CTA → `/auth?tab=signup`)
   2. **Wedding Package**
   3. **Corporate Package**
   4. **Party Package**
   - **Auto-discount**: if an active special with a numeric `discount_percent` exists, each package shows **strikethrough original** → **discounted price** + a small "SPECIAL −X%" pill. AI Coordinator is told about the active discount so it can mention it in chat.
5. **Testimonials** — new `testimonials` table (name, event type, rating, quote, optional photo, sort_order, is_live). Admin tab to manage; landing renders a 3-up carousel.
6. **YouTube Showcase** — existing component.
7. **Mixcloud Rotator** — already random per visit; ensure Prev / Surprise / Next buttons are visible, and add session-level "don't repeat" memory.
8. **Competitions banner** — moved to bottom, above footer.

`PageBackground pageKey="bg_landing"` already provides the admin-uploaded backdrop — no change.

## Wave 4 — Song Requests + Human Jukebox

- **Review gate**: `/request/:eventId` shows the existing 5-star review form first; only a **4★ or 5★** review unlocks the song-request form. Stored in new `client_reviews` table with `posted_to_facebook` / `posted_to_bark` admin checkboxes and a "WhatsApp this review" share button (uses your `+27 65 528 5528`).
- **Admin notification trigger** on `client_reviews` insert → admin bell + (later) WhatsApp push when Twilio is connected.
- **Human Jukebox add-on**: new package add-on flag in `service_settings` (`human_jukebox_rate` default `R250.00/hr`). Quote calculator adds a "🎙️ Human Jukebox (R250/hr × hours)" optional line item, discountable=true (counts as DJ service). On the event's song-request page, when the booking has `human_jukebox=true`, the QR page shows a "Human Jukebox active — your request is guaranteed within the next track" badge.

## Database changes (single migration)

- `testimonials` table + RLS (public read where is_live, admin write) + GRANTs.
- `client_reviews` table + RLS (anon insert allowed for the event's QR page, admin read) + GRANTs + notification trigger.
- `quotes.human_jukebox boolean default false`, `quotes.human_jukebox_hours numeric default 0`.
- `service_settings` row: `human_jukebox_rate = 250`.
- `specials.discount_percent numeric null` (nullable so existing image-only specials still work).

## Edge function

- `chat-coordinator` — streams Lovable AI replies, given live package/special context from the DB. Public (no JWT). Surfaces 429/402 errors as toasts client-side.

## Files

**New**: `supabase/functions/chat-coordinator/index.ts`, `src/components/landing/CoordinatorChat.tsx`, `src/components/landing/UpcomingEventsTicker.tsx`, `src/components/landing/PackagesShowcase.tsx`, `src/components/landing/TestimonialsCarousel.tsx`, `src/components/admin/TestimonialsManager.tsx`, `src/components/admin/ReviewsManager.tsx`, `src/hooks/useTestimonials.tsx`, `src/hooks/useClientReviews.tsx`, `src/lib/activeDiscount.ts`, plus the migration.

**Edited**: `src/pages/Index.tsx` (new section order), `src/pages/SongRequest.tsx` (review-gate), `src/pages/Admin.tsx` (Testimonials + Reviews tabs), `src/components/QuoteCalculator.tsx` + `src/lib/pricing.ts` (Human Jukebox add-on), `src/components/MixcloudRotator.tsx` (no-repeat memory), `src/hooks/useSpecials.tsx` + `src/components/admin/SpecialsManager.tsx` (discount_percent field), `src/integrations/supabase/types.ts`.

## Out of scope (deferred)

- Twilio WhatsApp push (still waiting for connector approval).
- Auto-post reviews to Facebook / Bark.com — needs OAuth setup; for now reviews land in admin + WhatsApp-share button.

Shall I proceed?
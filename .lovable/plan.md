# BeatKulture Production Upgrade Plan

Scope is large — split into 5 sequenced phases so each ships stable. All work reuses existing tables, design tokens (neon purple/orange/chrome gold), Space Grotesk, and current Supabase schema. No duplicate pages or tables.

---

## Phase 1 — Client Dashboard IA & Redesign

Replace the long-scroll `ClientPortal.tsx` with a hub layout using a persistent left sidebar (shadcn `Sidebar`, collapsible) + top summary cards.

**Sidebar sections (routes under `/client/*`, reusing existing pages where possible):**
- Dashboard (`/client`) — new overview
- Quotes (`/client/event-hub` existing)
- Event Details (new tab in Event Hub — reuses profile + event_plans data)
- Music Planner (`/client/planner` — promoted from tab)
- Payments (`/client/payments` — new page reading `quotes.deposit_paid`, `balance_paid`, `payment_schedule`)
- Documents (`/client/documents` — reuses `plan_attachments` + `documents` bucket)
- AI Companion (`/client/ai` — folds in Jokes, Guardian Angels, Wedding Q&A, Vow Designer, Dress Fitter)
- Event Tools (`/client/tools` — Photo Gallery, Wedding Ideas, Venues, Expos)
- Downloads (`/client/downloads` — BeatKulture Mixes, invoices, T&Cs)

**Dashboard overview cards:**
1. Event countdown (days/hours to `event_date`)
2. Status pill (quote status → payment status → planning status)
3. Completion progress bar (weighted: quote accepted 25% + deposit 25% + planner submitted 30% + songs ≥50 20%)
4. Outstanding tasks list (derived from `alarms` + missing planner fields)
5. Upcoming reminders (from `alarms` where `due_at > now()` limit 3)
6. Weather forecast card — new edge function `event-weather` calling Open-Meteo (free, no key) using geocoded `venue_address` from profile; cached in memory
7. Quick actions grid (Accept quote, Pay deposit, Open planner, Upload song)

**Cleanup:** remove `JokePopup` from global, move into AI Companion page. Remove duplicated banners from main dash; keep specials + winner spotlight collapsed under "What's New".

---

## Phase 2 — Smart Music Planner

Single planner page driven by `event_plans.event_type`. Reuse existing table + `plan_attachments` + `documents` bucket.

**Auto-activate:** when quote status flips to `accepted`, create/upsert `event_plans` row for that quote and show a persistent nudge until `status='submitted'`.

**Sections dynamically shown per event type** (config map in `src/lib/plannerSections.ts`):
- Wedding: timeline, first dance, father/daughter, mother/son, cake cutting, bouquet, MC notes, colour scheme
- Birthday/Party/Matric: timeline, entrance, must-play, do-not-play, dedications
- Corporate/School/Year-End: timeline, announcements, brand colours, MC notes
- Baby Shower/Kitchen Tea: timeline, games music, do-not-play
- Festival/Private: timeline, genre mix, headline moments
- Other: full custom

**Common to all:** Timeline builder (drag-drop with `@dnd-kit`), Must Play list, Do Not Play list, Special Requests, Announcements, MP3 uploads, Save Draft, Submit.

**Song library UI:** playlist view w/ search, filter by moment, drag reorder, artwork column (nullable), progress ring showing songs vs 50 min. Uses existing `event_playlist_items`.

**AI recommendations:** reuse `suggest-songs` edge function; add "Suggest based on my picks" button that seeds prompt with current picks + event type.

**BeatKulture Mixes:** new admin flag `music_tracks.downloadable boolean default false` (single column add). Client sees stream-only by default; download button only when flag true. Reuse `MusicPlayer` for streaming.

**On submit/update:** trigger existing `notify_admin_on_event_plan_submitted` (already exists) + invoke `notify-admin-quote-request` with `source: "planner_submitted"` for WhatsApp.

---

## Phase 3 — QR Event Song Request System

Reuse existing `events` + `song_requests` tables.

**Admin:** Event Manager gains "Show QR" button → renders QR (via `qrcode` npm) pointing to `/e/{event_id}/review`.

**Guest flow (public, no auth):**
1. `/e/:eventId/review` — star rating + platform buttons (Google/Facebook/Bark links from `events.google_review_url` etc.); "Skip → request song"
2. `/e/:eventId/request` — form (name optional, title, artist, dedication) → inserts into `song_requests`

**DJ live dashboard (`/dj/:eventId`):** realtime subscription on `song_requests`. Add columns via one migration:
- `status text default 'pending'` (already exists)
- `duplicate_of uuid null` + count aggregation view

Merge logic: on insert trigger, if same `lower(song_title)+lower(artist)` exists for event, set `duplicate_of` to original; UI shows original with vote count. Status buttons: Pending / Playing Next / Played / Declined.

**Notification:** trigger on `song_requests` insert → `admin_notifications` + edge function fan-out to WhatsApp.

---

## Phase 4 — WhatsApp Notification Hardening

Existing `notify-admin-quote-request` function already handles WhatsApp best-effort. Extend to a generic dispatcher and wire every event.

- Rename internal function router: keep function name for compatibility, add `source` switch: `quote_request | quote_accepted | planner_submitted | playlist_upload | client_message | song_request | client_activity`
- Each source formats a compact message with client name, event date, and a deep link `https://beatkulture.co.za/admin?focus={type}:{id}`
- DB triggers already exist for most events; add triggers for `quote_accepted` (done) and `song_requests` insert
- Add HTTP call from each trigger via `pg_net` if available, else keep client-side invoke as fallback
- Add retry table `whatsapp_outbox(id, payload jsonb, status, attempts, last_error, next_retry_at)` + cron edge function `whatsapp-retry` running every 5 min

---

## Phase 5 — Voice Assistant Fix

Current "Voice playback failed" likely from browser autoplay policy + provider decode issues.

- Switch TTS to Lovable AI Gateway `google/gemini-2.5-flash-tts` (server-side edge function `tts-speak` returning audio/mpeg)
- Client: play via a single reusable `<audio>` element created inside a user-gesture handler; unlock on first click
- Add clear error UI with retry + fallback to browser SpeechSynthesis
- Test matrix: Chrome/Safari desktop + iOS Safari + Android Chrome

---

## Technical notes

- New route entries added to `src/App.tsx` under existing lazy pattern
- New tables: none. New columns: `music_tracks.downloadable`, `song_requests.duplicate_of`. New tables only if unavoidable: `whatsapp_outbox` (phase 4)
- All new edge functions: `event-weather`, `tts-speak`, `whatsapp-retry`
- No design token changes; extend `Sidebar` styling to match neon/chrome theme
- Progressive rollout: each phase ships behind no flag, verified via Playwright screenshots before moving on

---

## Delivery order & rough size

1. Phase 1 (dashboard IA) — large, ~1 turn
2. Phase 2 (planner) — large, ~1 turn
3. Phase 3 (QR) — medium, ~1 turn
4. Phase 4 (WhatsApp) — medium, ~1 turn
5. Phase 5 (voice) — small, ~1 turn

Approve to start Phase 1, or tell me to re-order / drop a phase.

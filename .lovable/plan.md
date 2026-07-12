## Wave 5 Plan

### 1. Backgrounds & GIFs
- Create `page-backgrounds` public bucket (allow `image/*` including `image/gif`).
- Fix `PageBackground.tsx` so GIFs animate (currently the linear-gradient overlay is fine but images occasionally fail because of missing bucket / CORS). Add fallback + `img` element for GIFs so animation is preserved and preloaded.
- Ensure `Admin → Branding` uploads to the correct bucket with correct content-type.

### 2. Music library (admin uploads + client playback)
- New `music_tracks` table: `title, artist, file_url, mime_type, duration_seconds, sort_order, active`.
- New public bucket `music-library` allowing `audio/mpeg`, `audio/wav`, `audio/mp3`.
- Admin tab **Music Library**: upload MP3/WAV, list/delete, toggle active.
- Global `<MusicPlayer/>` mounted in authenticated layout (ClientPortal + Admin): loads active tracks, shuffles, autoplays on login (muted-by-default with a "Tap to play" prompt for browser autoplay policies), continuous playback, next/prev/shuffle controls, floating mini-player replacing/augmenting `BackgroundAudio`.

### 3. Branding: BeatKulture Entertainment + admin logo upload
- Add `brand_logo_url` to `business_settings`.
- Admin → Branding: upload logo (accepts GIF). Shown in header on all pages, PDFs, invoices (fallback to bundled `logo.png`).
- Update all "BEATKULTURE" wordmarks → "BeatKulture Entertainment".

### 4. Post-acceptance playlist system
- New tables:
  - `event_playlists` (quote_id, name, notes).
  - `event_playlist_items` (playlist_id, moment, song_title, artist, cue_time_seconds, notes, sort_order).
- Moments enum: `arrival, ceremony, first_dance, cake_cut, party, last_song, custom`.
- Unlock condition: quote status = `accepted` (or deposit paid).
- Client UI `/planner` → new **Music Planner** panel: add songs per moment with cue points, drag-reorder.
- AI assist: `plan-playlist` edge function using Gemini → suggests songs & cue points per moment given event details.

### 5. Landing intro
- New `LandingIntro` section (below hero, above events ticker): 2-3 short paragraphs describing BeatKulture Entertainment, services (weddings, corporate, private, kids), and app features (AI coordinator, quotes, planner, QR requests, competitions, YouTube reel).

### 6. Animated / interactive AI ("Kulture")
- Add animated avatar (pulse ring, gradient blob, typing dots) to CoordinatorChat.
- Floating chat bubble available on all pages (not only landing).
- Quick-reply chips ("Get a Quote", "See Packages", "Book a Date", "Song Requests").
- Sparkle/emoji reactions on assistant messages.

### Files
**Create:** `src/components/MusicPlayer.tsx`, `src/components/admin/MusicLibraryManager.tsx`, `src/hooks/useMusicTracks.tsx`, `src/hooks/useEventPlaylist.tsx`, `src/components/planner/MusicPlaylistPlanner.tsx`, `src/components/landing/LandingIntro.tsx`, `src/components/KultureBubble.tsx`, `supabase/functions/plan-playlist/index.ts`, migration.

**Edit:** `Admin.tsx`, `ClientPortal.tsx`, `EventPlanner.tsx`, `Index.tsx`, `Header.tsx`/logo usage, `BusinessSettingsManager.tsx`, `PageBackground.tsx`, `CoordinatorChat.tsx`, `generateInvoicePdf.ts`, `useBusinessSettings.tsx`.

Proceed?

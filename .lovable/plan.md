## Problem

Submitting the "Custom Quote Request" from the client dashboard fails because the insert payload references columns that don't exist in the `quote_requests` table.

The DB table only has these boolean flags: `is_outdoor, needs_sound, needs_lighting, needs_special_effects, needs_mic` — and no `city / area / province / requires_* / venue_provides_sound` columns.

But we're sending extras from two places:

1. **`src/hooks/useQuoteRequests.tsx`** (`createRequest`) spreads the input and then adds four non-existent columns:
   - `venue_provides_sound`, `requires_microphones`, `requires_lighting`, `requires_smoke_machine`
2. **`src/pages/ClientPortal.tsx`** (`Questionnaire.submit`) sends `city` (and the `QuoteRequest` TS interface also lists `area / province / payment_preference / terms_accepted / terms_accepted_at / requires_*` which don't exist).

PostgREST rejects the insert with `column "..." of relation "quote_requests" does not exist`, so the request never lands and the client sees an error toast.

## Fix

Keep it a pure frontend/hook fix — no DB migration.

### 1. `src/hooks/useQuoteRequests.tsx`
- Drop the mapping block that injects `venue_provides_sound / requires_microphones / requires_lighting / requires_smoke_machine`. Insert the input as-is (the DB already has `needs_sound / needs_lighting / needs_special_effects / needs_mic`).
- Trim the `QuoteRequest` TypeScript interface to match the real schema: remove `venue_provides_sound, requires_microphones, requires_lighting, requires_laser_effects, requires_smoke_machine, requires_fog_machine, requires_low_fog_machine, requires_cold_spark_machines, city, area, province, payment_preference, terms_accepted, terms_accepted_at`. Update the `Omit<...>` on `createRequest` accordingly.

### 2. `src/pages/ClientPortal.tsx`
- In `Questionnaire.submit`, stop sending `city` in the payload. `area / city / province` are already appended into `combinedNotes`, so no data is lost.

### 3. Verify
- Re-check `QuoteRequestsManager` and `AlarmsManager` for reads of the removed fields (they only read the base columns already, so nothing else should break — will confirm during implementation and adjust if needed).

## Out of scope

- No schema migration. If you later want structured `city / area / province / requires_*` columns on `quote_requests`, that's a separate change I can do next.
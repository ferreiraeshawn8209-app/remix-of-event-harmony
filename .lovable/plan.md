

## Plan: Equipment Images, Package-to-Quote, QR Review Link, and PDF Logo

### What you asked for (summary)

1. **Equipment image management** -- You can't upload/edit images for inventory items in Admin
2. **Package-to-quote flow** -- Selecting a package should auto-create a quote pre-filled with that package's details, so the client just enters personal info
3. **QR code review redirect** -- Change the review URL from Google to your Bark.com account
4. **Logo on PDF quotes/invoices** -- Embed the actual BeatKulture logo image in PDFs (currently text-only header), and ensure sharing attaches the PDF properly

---

### 1. Equipment Image Upload (Admin)

**Problem:** The `equipment_catalog` table has an `image_url` column, but the Admin EquipmentManager only shows a plain text input for it. The public `EquipmentShowcase` component still reads images from the hardcoded `EQUIPMENT_CATALOG` in `pricing.ts`, not from the database.

**Changes:**
- Create a **storage bucket** (`equipment-images`) for uploading equipment photos
- Add an **image upload widget** in the EquipmentManager edit form (file picker + preview) that uploads to storage and saves the URL to `image_url`
- Update `EquipmentShowcase.tsx` to read from the database (`useEquipmentCatalog`) instead of the hardcoded `EQUIPMENT_CATALOG`
- Update `generateInvoicePdf.ts` and `generateQuotePdf.ts` to look up equipment names from DB catalog data (currently uses `EQUIPMENT_CATALOG.find`)

---

### 2. Package-to-Quote Auto-Fill

**Problem:** Clicking "Get Quote" on a package just scrolls to the quote calculator. It doesn't pre-populate anything.

**Changes:**
- When a package is selected, pass the package data (name, price, included items) to the `QuoteCalculator` via state or URL params
- In `QuoteCalculator`, detect the selected package and pre-fill: event type from category, equipment selections matching the package includes, and base price
- Add a "Selected Package" badge/banner at the top of the calculator showing which package is active, with an option to clear it
- The client then only needs to fill in: name, email, contact, venue, date/time

---

### 3. QR Code Review URL → Bark.com

**Problem:** The `events` table has a `google_review_url` column (defaulting to a Google review link). The SongRequest page uses this to gate song requests.

**Changes:**
- Rename the field label in the EventManager from "Google Review URL" to "Review URL" (keep column name for compatibility)
- Update the default value in the database to point to your Bark.com review page
- Update the SongRequest page copy from "Google review" / "Facebook review" to generic "Leave a review" language, since it now points to Bark
- Admin can set the review URL per event

---

### 4. Logo Image on PDF Quotes & Invoices

**Problem:** The PDF currently uses plain text "BEATKULTURE ENTERTAINMENT" as header. No actual logo image is embedded.

**Changes:**
- Convert the logo PNG to a base64 string and embed it in `generateInvoicePdf.ts` / `generateQuotePdf.ts` using jsPDF's `addImage()` method
- Place the logo (approx 40x40px) at top-left of both Invoice and Quote PDFs, with company name and tagline beside it
- This creates a professional letterhead appearance

---

### Technical Details

| Area | Files to modify |
|------|----------------|
| Storage bucket | New migration for `equipment-images` bucket + RLS |
| Equipment images | `EquipmentManager.tsx`, `EquipmentShowcase.tsx`, `useEquipmentCatalog.tsx` |
| Package-to-quote | `PackagesSection.tsx`, `QuoteCalculator.tsx`, `pricing.ts` |
| QR/review URL | `EventManager.tsx`, `SongRequest.tsx`, DB default update |
| PDF logo | `generateInvoicePdf.ts` (both functions) |


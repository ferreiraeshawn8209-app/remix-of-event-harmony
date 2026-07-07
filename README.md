# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## MP3 upload hardening notes

- The admin track uploader accepts MP3 files only (`.mp3` + `audio/mpeg`/`audio/mp3`).
- Configure max upload size with `VITE_MAX_TRACK_UPLOAD_MB` (defaults to `50` MB when unset).
- If uploads fail with a missing bucket error, create the Supabase storage bucket named `tracks` (legacy `track` is also supported) and verify storage permissions for admin users.
- Admins can still keep the player usable by adding a direct public `.mp3` URL in the fallback field inside **Tracks Manager** (`Add by URL`) when storage uploads are unavailable.

## Premium AI Companion experience

- The client portal now includes a **Premium AI Companion** panel on dashboard entry, with animated avatar, dynamic suggestions, and event-aware reactions.
- A configurable **AI personality layer** (assistant/planner/MC/wedding expert/friend) is wired into assistant requests and humor generation policies.
- Voice playback uses persisted per-user preferences and drives lip-sync style avatar mouth animation.
- The MC joke system supports wedding/crowd/reception/ice-breaker/family/entertainment/adult-humour categories with appropriateness gating.
- Rotating animated AI showcase cards present core companion capabilities (timelines, invitations, music, jokes, seating, schedules, speeches, bookings, reminders).

## Quote alert channels (Email + WhatsApp)

- Quote requests always create in-app admin notifications.
- Email notifications are sent by Supabase edge function `notify-admin-quote-request` (Resend).
- Optional WhatsApp notifications are sent when `ADMIN_WHATSAPP_WEBHOOK_URL` is configured in edge-function secrets.
- Admin dashboard fallback recipients can be configured in **Business Settings → Admin Alert Channels**:
  - `admin_notification_emails` (comma-separated)
  - `admin_notification_whatsapp_to` (comma-separated international phone numbers)

### Required server-side secrets for alerts

- `RESEND_API_KEY`
- `ADMIN_NOTIFY_FROM_EMAIL` (optional, defaults to onboarding sender)
- `ADMIN_NOTIFICATION_EMAILS` (optional env fallback)
- `ADMIN_WHATSAPP_WEBHOOK_URL` (required for WhatsApp dispatch)
- `ADMIN_NOTIFICATION_WHATSAPP_TO` (optional env fallback)

import type { ExtraFeature } from "@/hooks/useExtraFeatures";

export const DEFAULT_EXTRA_FEATURES: ExtraFeature[] = [
  {
    id: "default-kids-corner",
    title: "Kids Corner — R300 / hour",
    description:
      "Dedicated caregiver looking after kids up to 15 years old. Interactive activities, games and kiddie snacks so parents can relax and enjoy the party. Perfect for weddings where little ones are on the guest list.",
    image_url: null,
    price: 300,
    sort_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "default-human-jukebox",
    title: "Human Jukebox",
    description:
      "Your DJ becomes a virtual jukebox — guests scan a QR code, leave a Google or Facebook review (unlocks the request page), then submit their song. Requests flow straight to the DJ queue in real time and we source tracks on the fly.",
    image_url: null,
    price: 1200,
    sort_order: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "default-qr-song-requests",
    title: "QR Song Requests (Review-Gated)",
    description:
      "Custom QR code for your event. Guests must leave a 4★+ Google/Facebook review first — then the request page unlocks and their song lands directly in the DJ's queue.",
    image_url: null,
    price: 650,
    sort_order: 3,
    is_active: true,
    created_at: "",
    updated_at: "",
  },

  {
    id: "default-event-planning",
    title: "Event Planning & Organising",
    description: "Planning support from timeline and vendors to full event coordination.",
    image_url: null,
    price: 2500,
    sort_order: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "default-live-performances",
    title: "Live Performances",
    description: "Live vocalists, sax, percussion & MCs layered over the DJ set for that unforgettable wow moment.",
    image_url: null,
    price: 3500,
    sort_order: 5,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "default-wedding-coordination",
    title: "Wedding Coordination",
    description: "On-the-day coordination and full-service planning — timeline, vendors, run sheet, all handled.",
    image_url: null,
    price: 4500,
    sort_order: 6,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

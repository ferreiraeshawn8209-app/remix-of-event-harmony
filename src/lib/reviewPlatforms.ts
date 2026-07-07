export type ReviewPlatform = "google" | "facebook" | "bark";

export interface ReviewLink {
  label: string;
  platform: ReviewPlatform;
  url: string;
  color: string;
  textColor: string;
  emoji: string;
}

export const REVIEW_LINKS: ReviewLink[] = [
  {
    label: "Bark",
    platform: "bark",
    url: "https://barkau.onelink.me/nmLC/t1hw8m1i",
    color: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60",
    textColor: "text-orange-500",
    emoji: "🐾",
  },
  {
    label: "Facebook",
    platform: "facebook",
    url: "https://www.facebook.com/share/177R4KRrtz/",
    color: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60",
    textColor: "text-blue-500",
    emoji: "👍",
  },
  {
    label: "Google",
    platform: "google",
    url: "https://g.page/r/CW_CXvpVqjtbEBE/review",
    color: "bg-green-500/10 border-green-500/30 hover:border-green-500/60",
    textColor: "text-green-500",
    emoji: "⭐",
  },
];

export function inferReviewPlatform(url: string): ReviewPlatform | null {
  const lower = url.toLowerCase();
  if (lower.includes("google.") || lower.includes("g.page") || lower.includes("maps.")) return "google";
  if (lower.includes("facebook.") || lower.includes("fb.")) return "facebook";
  if (lower.includes("bark.")) return "bark";
  return null;
}

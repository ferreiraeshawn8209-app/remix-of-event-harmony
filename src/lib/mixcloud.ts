export const DEFAULT_MIXCLOUD_PROFILE_URL = "https://www.mixcloud.com/Beatkulture/uploads/";

export function resolveMixcloudProfileUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_MIXCLOUD_PROFILE_URL;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Fall through to default URL when invalid.
  }
  return DEFAULT_MIXCLOUD_PROFILE_URL;
}

export function buildMixcloudEmbedSrc(feed: string) {
  const encoded = encodeURIComponent(feed);
  return `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=${encoded}`;
}

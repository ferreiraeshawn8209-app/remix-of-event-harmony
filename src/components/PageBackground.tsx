import { useBusinessSettings, BusinessSettingKey } from "@/hooks/useBusinessSettings";

/**
 * Fixed full-screen background image behind the page content.
 * Uses an <img> element so animated GIFs animate reliably on every browser.
 */
export function PageBackground({
  pageKey,
  opacity = 0.35,
}: { pageKey: BusinessSettingKey; opacity?: number }) {
  const { get } = useBusinessSettings();
  const url = get(pageKey);
  if (!url) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <img
        src={url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `hsl(var(--background) / ${1 - opacity})` }}
      />
    </div>
  );
}

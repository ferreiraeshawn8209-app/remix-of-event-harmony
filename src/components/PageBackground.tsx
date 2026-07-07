import { useMemo, useState } from "react";
import { useBusinessSettings, BusinessSettingKey } from "@/hooks/useBusinessSettings";

/**
 * Renders a fixed full-screen background image behind the page content.
 * Admin uploads the image per page key in Admin → Branding & Banking → Page Backgrounds.
 */
export function PageBackground({ pageKey, opacity = 0.25 }: { pageKey: BusinessSettingKey; opacity?: number }) {
  const { get } = useBusinessSettings();
  const primary = get(pageKey);
  const fallback = get("site_background_url") || get("hero_image_url");
  const sanitizedPrimary = useMemo(() => primary?.trim().replace(/\s/g, "%20") || "", [primary]);
  const sanitizedFallback = useMemo(() => fallback?.trim().replace(/\s/g, "%20") || "", [fallback]);
  const [failedPrimary, setFailedPrimary] = useState(false);

  const url = !failedPrimary && sanitizedPrimary ? sanitizedPrimary : sanitizedFallback;
  if (!url) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
        onError={() => setFailedPrimary(true)}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `hsl(var(--background) / ${Math.max(0.2, 1 - opacity - 0.3)})`,
        }}
      />
    </div>
  );
}

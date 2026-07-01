import { useBusinessSettings, BusinessSettingKey } from "@/hooks/useBusinessSettings";

/**
 * Renders a fixed full-screen background image behind the page content.
 * Admin uploads the image per page key in Admin → Branding & Banking → Page Backgrounds.
 */
export function PageBackground({ pageKey, opacity = 0.25 }: { pageKey: BusinessSettingKey; opacity?: number }) {
  const { get } = useBusinessSettings();
  const url = get(pageKey) || get("site_background_url");
  if (!url) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
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

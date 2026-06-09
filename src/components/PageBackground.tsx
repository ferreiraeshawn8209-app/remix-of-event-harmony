import { useBusinessSettings, BusinessSettingKey } from "@/hooks/useBusinessSettings";

/**
 * Renders a fixed full-screen background image behind the page content.
 * Admin uploads the image per page key in Admin → Branding & Banking → Page Backgrounds.
 */
export function PageBackground({ pageKey, opacity = 0.25 }: { pageKey: BusinessSettingKey; opacity?: number }) {
  const { get } = useBusinessSettings();
  const url = get(pageKey);
  if (!url) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--background) / ${1 - opacity}), hsl(var(--background) / ${1 - opacity})), url(${url})`,
      }}
    />
  );
}

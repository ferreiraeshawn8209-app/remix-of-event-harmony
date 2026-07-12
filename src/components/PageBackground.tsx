import { useEffect, useMemo, useState } from "react";
import { useBusinessSettings, BusinessSettingKey } from "@/hooks/useBusinessSettings";

/**
 * Renders a fixed full-screen background image behind the page content.
 *
 * If a rotation setting is present (newline-separated URLs stored under
 * `<pageKey>_rotation`, e.g. `bg_client_portal_rotation`), the background
 * cross-fades through the list every `rotateMs` (default 7s). Otherwise it
 * falls back to the single-image `pageKey` setting, and then to the global
 * fallbacks.
 *
 * Admin uploads live per key in Admin → Branding & Banking → Page Backgrounds
 * and Admin → Rotating Backgrounds.
 */
export function PageBackground({
  pageKey,
  opacity = 0.25,
  rotateMs = 7000,
}: {
  pageKey: BusinessSettingKey;
  opacity?: number;
  rotateMs?: number;
}) {
  const { get } = useBusinessSettings();
  const single = get(pageKey);
  const rotationRaw = get(`${pageKey}_rotation` as BusinessSettingKey);
  const fallback = get("site_background_url") || get("hero_image_url");

  const rotationList = useMemo(() => {
    if (!rotationRaw) return [] as string[];
    return rotationRaw
      .split(/\r?\n/)
      .map((s) => s.trim().replace(/\s/g, "%20"))
      .filter(Boolean);
  }, [rotationRaw]);

  const sanitizedSingle = useMemo(
    () => single?.trim().replace(/\s/g, "%20") || "",
    [single],
  );
  const sanitizedFallback = useMemo(
    () => fallback?.trim().replace(/\s/g, "%20") || "",
    [fallback],
  );

  // Build the effective playlist: rotation list wins if it has 1+ images.
  const playlist = useMemo<string[]>(() => {
    if (rotationList.length >= 1) return rotationList;
    if (sanitizedSingle) return [sanitizedSingle];
    if (sanitizedFallback) return [sanitizedFallback];
    return [];
  }, [rotationList, sanitizedSingle, sanitizedFallback]);

  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (playlist.length < 2) return;
    const t = setInterval(() => {
      setIdx((n) => (n + 1) % playlist.length);
    }, rotateMs);
    return () => clearInterval(t);
  }, [playlist.length, rotateMs]);

  // Reset on playlist change
  useEffect(() => {
    setIdx(0);
    setFailed({});
  }, [playlist.join("|")]);

  if (playlist.length === 0) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {playlist.map((url, i) => {
        if (failed[i]) return null;
        return (
          <img
            key={`${url}-${i}`}
            src={url}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailed((f) => ({ ...f, [i]: true }))}
          />
        );
      })}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `hsl(var(--background) / ${Math.max(0.2, 1 - opacity - 0.3)})`,
        }}
      />
      <div className="absolute inset-0 premium-grid opacity-70" />
      <div className="absolute -inset-[24%] bg-[radial-gradient(circle_at_20%_20%,hsl(280_95%_60%_/_0.22),transparent_34%),radial-gradient(circle_at_80%_20%,hsl(40_96%_58%_/_0.18),transparent_36%),radial-gradient(circle_at_55%_80%,hsl(28_98%_58%_/_0.16),transparent_34%)] blur-2xl animate-gradient pointer-events-none" />
    </div>
  );
}

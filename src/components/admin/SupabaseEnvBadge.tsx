import { useEffect } from "react";
import { Database } from "lucide-react";

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const MISSING_LABEL = "(VITE_SUPABASE_URL not set — check env vars)";

function getProjectRef(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Supabase project URLs are formatted as <project-ref>.supabase.co
    return hostname.split(".")[0] || hostname;
  } catch {
    return "(unknown)";
  }
}

/**
 * Admin-only debug badge that shows which Supabase project this build is
 * pointed at.  Helps quickly spot preview-environment mismatches where the
 * frontend is talking to the wrong project.
 *
 * Only rendered inside the admin-gated Admin page — never shown to regular
 * users.  The full URL is also logged to the browser console on mount so it
 * is easy to copy from DevTools.
 *
 * Never displays the publishable key or any private credentials.
 */
export function SupabaseEnvBadge() {
  const projectRef = SUPABASE_URL ? getProjectRef(SUPABASE_URL) : "(unknown)";
  const displayLabel = SUPABASE_URL || MISSING_LABEL;

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[Admin] Active Supabase project URL:", displayLabel);
  }, [displayLabel]);

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground/70 border border-border/40 rounded px-1.5 py-0.5 select-all"
      title={displayLabel}
    >
      <Database className="w-3 h-3 shrink-0" />
      {projectRef}
    </span>
  );
}

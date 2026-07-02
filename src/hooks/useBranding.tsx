import defaultLogo from "@/assets/logo.png";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { supabase } from "@/integrations/supabase/client";

export function useBrandingLogo() {
  const { get } = useBusinessSettings();
  return get("logo_url") || defaultLogo;
}

export async function fetchBrandingLogoUrl(): Promise<string> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("value")
    .eq("key", "logo_url")
    .maybeSingle();

  if (error) throw error;
  return data?.value || defaultLogo;
}

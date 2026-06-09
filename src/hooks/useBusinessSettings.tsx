import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BusinessSettingKey =
  | "bank_name"
  | "bank_account_name"
  | "bank_account_number"
  | "bank_branch_code"
  | "bank_account_type"
  | "hero_image_url"
  | "site_background_url"
  | "bg_landing"
  | "bg_client_portal"
  | "bg_admin"
  | "bg_planner"
  | "bg_auth"
  | "bg_song_request";

export function useBusinessSettings() {
  const qc = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["business_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_settings").select("key,value");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value || ""; });
      return map;
    },
  });

  const setSetting = async (key: BusinessSettingKey, value: string) => {
    const { error } = await supabase
      .from("business_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["business_settings"] });
  };

  const get = (key: BusinessSettingKey) => settings[key] || "";

  return { settings: settings as Record<BusinessSettingKey, string>, isLoading, get, setSetting };
}

/** Upload a file to the public site-images bucket and return the public URL. */
export async function uploadSiteImage(file: File, prefix = "general"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

/** Fetch banking details synchronously-ish for PDF generation. */
export async function fetchBankingDetails(): Promise<string[]> {
  const { data } = await supabase
    .from("business_settings")
    .select("key,value")
    .in("key", ["bank_name", "bank_account_name", "bank_account_number", "bank_branch_code", "bank_account_type"]);
  const m: Record<string, string> = {};
  (data || []).forEach((r: any) => { m[r.key] = r.value || ""; });
  const lines: string[] = [];
  if (m.bank_name) lines.push(`Bank: ${m.bank_name}`);
  if (m.bank_account_name) lines.push(`Account: ${m.bank_account_name}`);
  if (m.bank_account_number) lines.push(`Account No: ${m.bank_account_number}`);
  if (m.bank_branch_code) lines.push(`Branch Code: ${m.bank_branch_code}`);
  if (m.bank_account_type) lines.push(`Account Type: ${m.bank_account_type}`);
  if (lines.length) lines.push("Please use your name as reference.");
  return lines;
}

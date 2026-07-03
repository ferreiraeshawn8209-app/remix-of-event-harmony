import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceSettings {
  dj_hourly_rate: number;
  kids_corner_hourly_rate: number;
  travel_rate_per_km: number;
  free_travel_km: number;
  overtime_multiplier: number;
  deposit_percent: number;
  human_jukebox_rate: number;
}

const DEFAULTS: ServiceSettings = {
  dj_hourly_rate: 800,
  kids_corner_hourly_rate: 500,
  travel_rate_per_km: 7.5,
  free_travel_km: 30,
  overtime_multiplier: 1.5,
  deposit_percent: 30,
  human_jukebox_rate: 250,
};

export function useServiceSettings() {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULTS, isLoading } = useQuery({
    queryKey: ["service-settings"],
    queryFn: async () => {
      const result = { ...DEFAULTS };

      // Try admin direct read first
      const admin = await supabase.from("service_settings").select("setting_key, setting_value");
      if (!admin.error && admin.data) {
        admin.data.forEach((row: any) => {
          if (row.setting_key in result) {
            (result as any)[row.setting_key] = Number(row.setting_value);
          }
        });
        return result;
      }

      // Fallback for authenticated non-admin clients
      const rpc = await supabase.rpc("get_service_settings" as any);
      if (!rpc.error && rpc.data) {
        (rpc.data as any[]).forEach((row: any) => {
          if (row.setting_key in result) {
            (result as any)[row.setting_key] = Number(row.setting_value);
          }
        });
      }
      return result;
    },
  });

  const updateSetting = async (key: string, value: number) => {
    const { error } = await supabase
      .from("service_settings")
      .update({ setting_value: value })
      .eq("setting_key", key);

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["service-settings"] });
  };

  return { settings, isLoading, updateSetting };
}

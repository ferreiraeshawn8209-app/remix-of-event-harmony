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
      const { data, error } = await supabase
        .from("service_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const result = { ...DEFAULTS };
      data?.forEach((row: { setting_key: string; setting_value: number }) => {
        if (row.setting_key in result) {
          (result as any)[row.setting_key] = Number(row.setting_value);
        }
      });
      // Keep the published 30% policy authoritative even if legacy database settings differ.
      result.deposit_percent = DEFAULTS.deposit_percent;
      return result;
    },
  });

  const updateSetting = async (key: string, value: number) => {
    if (key === "deposit_percent" && value !== DEFAULTS.deposit_percent) {
      throw new Error("The booking deposit is fixed at 30%.");
    }
    const { error } = await supabase
      .from("service_settings")
      .update({ setting_value: value })
      .eq("setting_key", key);

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["service-settings"] });
  };

  return { settings, isLoading, updateSetting };
}

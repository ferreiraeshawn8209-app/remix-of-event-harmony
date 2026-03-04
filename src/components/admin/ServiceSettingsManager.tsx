import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";

const SETTING_META: Record<string, { label: string; prefix?: string; suffix?: string; step?: string }> = {
  dj_hourly_rate: { label: "DJ Hourly Rate", prefix: "R", step: "50" },
  kids_corner_hourly_rate: { label: "Kids Corner Hourly Rate", prefix: "R", step: "50" },
  travel_rate_per_km: { label: "Travel Rate per KM", prefix: "R", step: "0.5" },
  free_travel_km: { label: "Free Travel Distance", suffix: "km", step: "5" },
  overtime_multiplier: { label: "Overtime Multiplier", suffix: "×", step: "0.1" },
  deposit_percent: { label: "Deposit Percentage", suffix: "%", step: "5" },
};

export function ServiceSettingsManager() {
  const { settings, isLoading, updateSetting } = useServiceSettings();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async (key: string) => {
    const value = Number(localValues[key] ?? (settings as any)[key]);
    if (isNaN(value)) return;
    setSaving(key);
    try {
      await updateSetting(key, value);
      toast({ title: "Saved", description: `${SETTING_META[key]?.label} updated.` });
      setLocalValues(prev => { const n = { ...prev }; delete n[key]; return n; });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
    setSaving(null);
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Service Pricing & Rates</CardTitle>
        <CardDescription>Edit the core rates used for all quote calculations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-6">
          {Object.entries(SETTING_META).map(([key, meta]) => {
            const currentValue = localValues[key] ?? String((settings as any)[key]);
            const isDirty = key in localValues && localValues[key] !== String((settings as any)[key]);

            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium">{meta.label}</Label>
                <div className="flex items-center gap-2">
                  {meta.prefix && <span className="text-sm text-muted-foreground">{meta.prefix}</span>}
                  <Input
                    type="number"
                    step={meta.step}
                    min={0}
                    value={currentValue}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1"
                  />
                  {meta.suffix && <span className="text-sm text-muted-foreground">{meta.suffix}</span>}
                  {isDirty && (
                    <Button
                      size="icon"
                      variant="default"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleSave(key)}
                      disabled={saving === key}
                    >
                      {saving === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

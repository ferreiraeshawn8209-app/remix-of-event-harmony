import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Upload, Image as ImageIcon, Banknote } from "lucide-react";
import { useBusinessSettings, uploadSiteImage, BusinessSettingKey } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/ImageCropDialog";

function ImageSettingRow({
  label,
  description,
  settingKey,
}: {
  label: string;
  description: string;
  settingKey: BusinessSettingKey;
}) {
  const { get, setSetting } = useBusinessSettings();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(get(settingKey));
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrl(get(settingKey)); }, [get(settingKey)]);

  const handleUpload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) { toast({ title: "Choose a file first", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const publicUrl = await uploadSiteImage(f, settingKey);
      await setSetting(settingKey, publicUrl);
      setUrl(publicUrl);
      toast({ title: "Image updated" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await setSetting(settingKey, "");
      setUrl("");
      toast({ title: "Image cleared" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  return (
    <div className="p-4 border border-border/50 rounded-lg space-y-3">
      <div>
        <Label className="text-base">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {url ? (
        <img src={url} alt={label} className="w-full max-h-40 object-cover rounded" />
      ) : (
        <div className="w-full h-24 rounded bg-muted/30 flex items-center justify-center text-muted-foreground">
          <ImageIcon className="w-6 h-6" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="text-xs flex-1" />
        <Button size="sm" onClick={handleUpload} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload
        </Button>
        {url && (
          <Button size="sm" variant="ghost" onClick={handleClear} disabled={busy}>Clear</Button>
        )}
      </div>
    </div>
  );
}

function BankingForm() {
  const { settings, setSetting, isLoading } = useBusinessSettings();
  const [form, setForm] = useState({
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_branch_code: "",
    bank_account_type: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      bank_name: settings.bank_name || "",
      bank_account_name: settings.bank_account_name || "",
      bank_account_number: settings.bank_account_number || "",
      bank_branch_code: settings.bank_branch_code || "",
      bank_account_type: settings.bank_account_type || "",
    });
  }, [settings.bank_name, settings.bank_account_name, settings.bank_account_number, settings.bank_branch_code, settings.bank_account_type]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all((Object.keys(form) as (keyof typeof form)[]).map(k =>
        setSetting(k as BusinessSettingKey, form[k])
      ));
      toast({ title: "Banking details saved", description: "Quotes & invoices will use these details." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;

  const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
    { key: "bank_name", label: "Bank Name", placeholder: "e.g. First National Bank" },
    { key: "bank_account_name", label: "Account Name", placeholder: "e.g. BEATKULTURE (PTY) LTD" },
    { key: "bank_account_number", label: "Account Number", placeholder: "e.g. 1234567890" },
    { key: "bank_branch_code", label: "Branch Code", placeholder: "e.g. 250655" },
    { key: "bank_account_type", label: "Account Type", placeholder: "e.g. Current Account" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key} className="space-y-2">
            <Label>{f.label}</Label>
            <Input
              value={form[f.key]}
              onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Banking Details
      </Button>
    </div>
  );
}

export function BusinessSettingsManager() {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" /> Banking Details
          </CardTitle>
          <CardDescription>
            These details appear on every quote, invoice and PDF. Leave blank to hide a field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BankingForm />
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Site Images
          </CardTitle>
          <CardDescription>
            Replace the homepage hero image and global background. JPG or PNG recommended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageSettingRow
            label="Homepage Hero Image"
            description="Big background photo behind 'Your Event, Our Beat' on the homepage."
            settingKey="hero_image_url"
          />
          <ImageSettingRow
            label="Site Background Image"
            description="Optional global background tint shown across the app."
            settingKey="site_background_url"
          />
        </CardContent>
      </Card>
    </div>
  );
}

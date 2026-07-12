import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Upload, Image as ImageIcon, Banknote, Plus, X, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBusinessSettings, uploadSiteImage, BusinessSettingKey } from "@/hooks/useBusinessSettings";
import { BackgroundRotationManager } from "@/components/admin/BackgroundRotationManager";
import { toast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/ImageCropDialog";

function ImageSettingRow({
  label,
  description,
  settingKey,
  defaultAspect = "free",
}: {
  label: string;
  description: string;
  settingKey: BusinessSettingKey;
  defaultAspect?: "free" | "16:9" | "1:1" | "4:3" | "3:4" | "9:16" | "3:2" | "21:9";
}) {
  const { get, setSetting } = useBusinessSettings();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(get(settingKey));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrl(get(settingKey)); }, [get(settingKey)]);

  const doUpload = async (f: File) => {
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

  const handlePick = () => {
    const f = fileRef.current?.files?.[0];
    if (!f) { toast({ title: "Choose a file first", variant: "destructive" }); return; }
    if (settingKey === "logo_url" && f.type === "image/gif") {
      void doUpload(f);
      return;
    }
    setPendingFile(f);
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
        <input ref={fileRef} type="file" accept="image/*,image/gif" className="text-xs flex-1" />
        <Button size="sm" onClick={handlePick} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload
        </Button>
        {url && (
          <Button size="sm" variant="ghost" onClick={handleClear} disabled={busy}>Clear</Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">You can crop on the next step. Animated GIFs upload as-is.</p>
      <ImageCropDialog
        file={pendingFile}
        open={!!pendingFile}
        onClose={() => setPendingFile(null)}
        onConfirm={doUpload}
        defaultAspect={defaultAspect}
        title={`Crop ${label}`}
      />
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

function normalizeWaNumber(raw: string): string | null {
  // Keep leading + and digits; wa.me/notifiers expect E.164 (e.g. +27655285528).
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\+/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return cleaned.startsWith("+") ? `+${digits}` : `+${digits}`;
}

function parseList(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function AdminAlertsForm() {
  const { settings, setSetting, isLoading } = useBusinessSettings();
  const [saving, setSaving] = useState(false);
  const [emailList, setEmailList] = useState("");
  const [numbers, setNumbers] = useState<string[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [consultant1, setConsultant1] = useState("");
  const [consultant2, setConsultant2] = useState("");
  const [groupUrl, setGroupUrl] = useState("");

  useEffect(() => {
    setEmailList(settings.admin_notification_emails || "");
    setNumbers(parseList(settings.admin_notification_whatsapp_to || ""));
    setConsultant1(settings.whatsapp_consultant_1 || "");
    setConsultant2(settings.whatsapp_consultant_2 || "");
    setGroupUrl(settings.whatsapp_group_url || "");
  }, [
    settings.admin_notification_emails,
    settings.admin_notification_whatsapp_to,
    settings.whatsapp_consultant_1,
    settings.whatsapp_consultant_2,
    settings.whatsapp_group_url,
  ]);

  const addNumber = () => {
    const n = normalizeWaNumber(newNumber);
    if (!n) {
      toast({ title: "Invalid number", description: "Use international format, e.g. +27655285528", variant: "destructive" });
      return;
    }
    if (numbers.includes(n)) {
      toast({ title: "Already added", description: n });
      return;
    }
    setNumbers([...numbers, n]);
    setNewNumber("");
  };

  const removeNumber = (n: string) => setNumbers(numbers.filter((x) => x !== n));

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        setSetting("admin_notification_emails", emailList.trim()),
      setSetting("admin_notification_whatsapp_to", numbers.join(",")),
        setSetting("whatsapp_consultant_1", consultant1.trim()),
        setSetting("whatsapp_consultant_2", consultant2.trim()),
        setSetting("whatsapp_group_url", groupUrl.trim()),
      ]);
      toast({ title: "WhatsApp recipients saved", description: `${numbers.length} number${numbers.length === 1 ? "" : "s"} on file` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Fallback admin emails (comma separated)</Label>
        <Input
          value={emailList}
          onChange={(e) => setEmailList(e.target.value)}
          placeholder="admin1@beatkulture.com, admin2@beatkulture.com"
        />
        <p className="text-xs text-muted-foreground">
          Used if no admin profile emails are available in the database.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-primary/20 p-4 bg-background/40">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <Label className="text-base">WhatsApp notification recipients</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Every number below receives quote requests, client messages, event-plan submissions and
          portal alerts via the WhatsApp webhook. Add or remove numbers any time.
        </p>

        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {numbers.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No recipients yet — add one below.</span>
          )}
          {numbers.map((n) => (
            <Badge key={n} variant="secondary" className="gap-1 pl-3 pr-1 py-1 text-sm">
              {n}
              <button
                type="button"
                onClick={() => removeNumber(n)}
                aria-label={`Remove ${n}`}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNumber(); } }}
            placeholder="+27655285528"
            inputMode="tel"
            maxLength={20}
          />
          <Button type="button" onClick={addNumber} variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Consultant 1 (client-facing WhatsApp chat)</Label>
          <Input value={consultant1} onChange={(e) => setConsultant1(e.target.value)} placeholder="+27655285528" />
        </div>
        <div className="space-y-2">
          <Label>Consultant 2 (optional)</Label>
          <Input value={consultant2} onChange={(e) => setConsultant2(e.target.value)} placeholder="+27710001111" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>WhatsApp group invite link (optional)</Label>
          <Input value={groupUrl} onChange={(e) => setGroupUrl(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
          <p className="text-xs text-muted-foreground">
            If set, both consultants see one shared thread when clients tap the WhatsApp button.
          </p>
        </div>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save WhatsApp Settings
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
            <Save className="w-5 h-5 text-primary" /> Admin Alert Channels
          </CardTitle>
          <CardDescription>
            Configure fallback recipients for quote-request alerts. WhatsApp sending requires
            <code className="mx-1">ADMIN_WHATSAPP_WEBHOOK_URL</code>
            on the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAlertsForm />
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
            label="Brand Logo (Static or GIF)"
            description="Main BeatKulture Entertainment logo used across pages and documents. PNG/JPG/GIF supported."
            settingKey="logo_url"
            defaultAspect="free"
          />
          <ImageSettingRow
            label="Homepage Hero Image"
            description="Big background photo behind 'Your Event, Our Beat' on the homepage."
            settingKey="hero_image_url"
            defaultAspect="16:9"
          />
          <ImageSettingRow
            label="Site Background Image"
            description="Optional global background tint shown across the app."
            settingKey="site_background_url"
            defaultAspect="21:9"
          />
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Page Backgrounds
          </CardTitle>
          <CardDescription>
            Choose a background image for each individual page. Leave any blank to use the default theme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageSettingRow
            label="Landing page background"
            description="Behind the welcome / sign-in hero at /."
            settingKey="bg_landing"
            defaultAspect="21:9"
          />
          <ImageSettingRow
            label="Client portal background"
            description="Behind the signed-in client dashboard at /client."
            settingKey="bg_client_portal"
            defaultAspect="21:9"
          />
          <ImageSettingRow
            label="Event planner background"
            description="Behind the event planning tools."
            settingKey="bg_planner"
            defaultAspect="21:9"
          />
          <ImageSettingRow
            label="Admin dashboard background"
            description="Behind your admin pages."
            settingKey="bg_admin"
            defaultAspect="21:9"
          />
          <ImageSettingRow
            label="Sign-in / sign-up background"
            description="Behind /auth."
            settingKey="bg_auth"
            defaultAspect="21:9"
          />
          <ImageSettingRow
            label="Song-request page background"
            description="Behind the QR song-request page guests scan into."
            settingKey="bg_song_request"
            defaultAspect="21:9"
          />
        </CardContent>
      </Card>

      <BackgroundRotationManager />
    </div>
  );
}


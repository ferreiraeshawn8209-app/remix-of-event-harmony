import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import {
  Bot, Wallet, LayoutGrid, ListChecks, Music, CloudSun, Search, ClipboardList,
  Mail, StickyNote, QrCode, Send, Plus, Trash2, Sparkles, Loader2, Calendar,
  ArrowUp, ArrowDown, Youtube, Phone, MapPin, Wand2,
} from "lucide-react";

type PlannerCtx = {
  scopeKey: string; // e.g. user_id or quote id
  quote?: {
    id?: string;
    event_type?: string | null;
    event_date?: string | null;
    venue?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    guest_count?: number | null;
  };
};

// ---------- localStorage helper ----------
function useLocal<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const r = localStorage.getItem(key);
      return r ? (JSON.parse(r) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore quota */ }
  }, [key, val]);
  return [val, setVal];
}

// ============================================================
export function PlannerHub({ scopeKey, quote }: PlannerCtx) {
  const ns = (k: string) => `bk:planner:${scopeKey}:${k}`;

  return (
    <Card variant="glass" className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" /> Event Planning Tools
        </CardTitle>
        <CardDescription>
          Plan every detail of your event — powered by BeatKulture Entertainment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ai" className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto p-1 mb-4 flex-nowrap">
              <TabsTrigger value="ai" className="gap-1 text-xs"><Bot className="w-3.5 h-3.5" />AI Assistant</TabsTrigger>
              <TabsTrigger value="budget" className="gap-1 text-xs"><Wallet className="w-3.5 h-3.5" />Budget</TabsTrigger>
              <TabsTrigger value="floor" className="gap-1 text-xs"><LayoutGrid className="w-3.5 h-3.5" />Floor</TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1 text-xs"><ListChecks className="w-3.5 h-3.5" />Timeline</TabsTrigger>
              <TabsTrigger value="music" className="gap-1 text-xs"><Music className="w-3.5 h-3.5" />Music</TabsTrigger>
              <TabsTrigger value="weather" className="gap-1 text-xs"><CloudSun className="w-3.5 h-3.5" />Weather</TabsTrigger>
              <TabsTrigger value="vendors" className="gap-1 text-xs"><Search className="w-3.5 h-3.5" />Vendors</TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1 text-xs"><ClipboardList className="w-3.5 h-3.5" />Checklist</TabsTrigger>
              <TabsTrigger value="invite" className="gap-1 text-xs"><Mail className="w-3.5 h-3.5" />Invitation</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs"><StickyNote className="w-3.5 h-3.5" />Notes</TabsTrigger>
              <TabsTrigger value="qr" className="gap-1 text-xs"><QrCode className="w-3.5 h-3.5" />QR Songs</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="ai"><AIAssistant scopeKey={scopeKey} quote={quote} /></TabsContent>
          <TabsContent value="budget"><BudgetPlanner storageKey={ns("budget")} /></TabsContent>
          <TabsContent value="floor"><FloorPlanner storageKey={ns("floor")} /></TabsContent>
          <TabsContent value="timeline"><TimelineScheduler storageKey={ns("timeline")} quote={quote} /></TabsContent>
          <TabsContent value="music"><MusicPlanner storageKey={ns("music")} quote={quote} /></TabsContent>
          <TabsContent value="weather"><WeatherWidget quote={quote} /></TabsContent>
          <TabsContent value="vendors"><VendorFinder storageKey={ns("vendors")} quote={quote} /></TabsContent>
          <TabsContent value="checklist"><ChecklistManager storageKey={ns("checklist")} quote={quote} /></TabsContent>
          <TabsContent value="invite"><InvitationDesigner storageKey={ns("invite")} quote={quote} /></TabsContent>
          <TabsContent value="notes"><NotesReminders storageKey={ns("notes")} /></TabsContent>
          <TabsContent value="qr"><QRSongRequests quote={quote} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 1. AI ASSISTANT
// ============================================================
type Msg = { role: "user" | "assistant"; content: string };
function AIAssistant({ scopeKey, quote }: PlannerCtx) {
  const [messages, setMessages] = useLocal<Msg[]>(`bk:planner:${scopeKey}:chat`, [
    { role: "assistant", content: "Hi! 👋 I'm your BeatKulture Event Assistant. Ask me anything about planning your event — songs, timelines, budget, vendors, you name it. Don't forget to subscribe to **@beatkulturesa** on YouTube for the latest mixes by DJ Shawn-E-Shawn! 🎧" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          context: quote ? {
            event_type: quote.event_type, event_date: quote.event_date,
            venue: quote.venue, guest_count: quote.guest_count,
            start_time: quote.start_time, end_time: quote.end_time,
          } : null,
        }),
      });

      if (resp.status === 429) { toast({ title: "Too many requests", description: "Please wait a moment.", variant: "destructive" }); setLoading(false); return; }
      if (resp.status === 402) { toast({ title: "AI credits exhausted", description: "Please contact us.", variant: "destructive" }); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let acc = ""; let done = false;
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) {
      toast({ title: "AI error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div ref={scrollRef} className="h-72 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
            }`}>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about songs, vendors, timing, budget…"
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Youtube className="w-3 h-3" /> Subscribe to <strong>@beatkulturesa</strong> on YouTube for mixes by DJ Shawn-E-Shawn.
      </p>
    </div>
  );
}

// ============================================================
// 2. BUDGET PLANNER
// ============================================================
type BudgetItem = { id: string; category: string; planned: number; actual: number };
function BudgetPlanner({ storageKey }: { storageKey: string }) {
  const [items, setItems] = useLocal<BudgetItem[]>(storageKey, [
    { id: "1", category: "Venue", planned: 15000, actual: 0 },
    { id: "2", category: "DJ & Entertainment (BeatKulture)", planned: 8000, actual: 0 },
    { id: "3", category: "Catering", planned: 12000, actual: 0 },
    { id: "4", category: "Decor & Flowers", planned: 5000, actual: 0 },
    { id: "5", category: "Photography", planned: 6000, actual: 0 },
  ]);
  const [totalBudget, setTotalBudget] = useLocal<number>(storageKey + ":total", 50000);

  const sumPlanned = items.reduce((s, i) => s + Number(i.planned || 0), 0);
  const sumActual = items.reduce((s, i) => s + Number(i.actual || 0), 0);
  const remaining = totalBudget - sumActual;

  const upd = (id: string, patch: Partial<BudgetItem>) =>
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
  const add = () =>
    setItems([...items, { id: crypto.randomUUID(), category: "New category", planned: 0, actual: 0 }]);
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="py-3 text-center"><p className="text-xs text-muted-foreground">Total Budget</p><Input type="number" value={totalBudget} onChange={e => setTotalBudget(Number(e.target.value))} className="text-center font-bold text-lg border-0 h-8 px-0" /></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xs text-muted-foreground">Spent</p><p className="font-bold text-lg">{formatCurrency(sumActual)}</p></CardContent></Card>
        <Card className={remaining < 0 ? "border-destructive" : ""}><CardContent className="py-3 text-center"><p className="text-xs text-muted-foreground">Remaining</p><p className={`font-bold text-lg ${remaining < 0 ? "text-destructive" : "text-primary"}`}>{formatCurrency(remaining)}</p></CardContent></Card>
      </div>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.id} className="grid grid-cols-12 gap-2 items-center">
            <Input className="col-span-5" value={i.category} onChange={e => upd(i.id, { category: e.target.value })} />
            <Input className="col-span-3" type="number" placeholder="Planned" value={i.planned || ""} onChange={e => upd(i.id, { planned: Number(e.target.value) })} />
            <Input className="col-span-3" type="number" placeholder="Actual" value={i.actual || ""} onChange={e => upd(i.id, { actual: Number(e.target.value) })} />
            <Button variant="ghost" size="icon" className="col-span-1" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" />Add Category</Button>
      <p className="text-xs text-muted-foreground">Planned total: {formatCurrency(sumPlanned)}</p>
    </div>
  );
}

// ============================================================
// 3. FLOOR PLANNER (simple draggable grid)
// ============================================================
type FloorItem = { id: string; type: string; x: number; y: number; label: string };
const FLOOR_TYPES = [
  { type: "table", label: "Round Table", color: "bg-primary/30 border-primary" },
  { type: "rect", label: "Long Table", color: "bg-accent/30 border-accent" },
  { type: "dj", label: "DJ Booth", color: "bg-secondary/30 border-secondary" },
  { type: "dance", label: "Dance Floor", color: "bg-yellow-500/20 border-yellow-500" },
  { type: "bar", label: "Bar", color: "bg-green-500/20 border-green-500" },
  { type: "stage", label: "Stage", color: "bg-pink-500/20 border-pink-500" },
];
function FloorPlanner({ storageKey }: { storageKey: string }) {
  const [items, setItems] = useLocal<FloorItem[]>(storageKey, []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  const add = (type: string, label: string) =>
    setItems([...items, { id: crypto.randomUUID(), type, x: 40, y: 40, label }]);

  const onDragEnd = (e: React.DragEvent) => {
    if (!dragId.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 60, e.clientX - rect.left - 30));
    const y = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - 30));
    setItems(items.map(i => i.id === dragId.current ? { ...i, x, y } : i));
    dragId.current = null;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FLOOR_TYPES.map(t => (
          <Button key={t.type} variant="outline" size="sm" onClick={() => add(t.type, t.label)}>
            <Plus className="w-3 h-3 mr-1" />{t.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setItems([])}><Trash2 className="w-3 h-3 mr-1" />Clear</Button>
      </div>
      <div
        ref={canvasRef}
        onDragOver={e => e.preventDefault()}
        onDrop={onDragEnd}
        className="relative h-80 w-full rounded-lg border-2 border-dashed border-border bg-muted/20 overflow-hidden"
      >
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Click buttons above to add furniture, then drag to position.
          </div>
        )}
        {items.map(i => {
          const meta = FLOOR_TYPES.find(t => t.type === i.type) || FLOOR_TYPES[0];
          const isRound = i.type === "table";
          return (
            <div
              key={i.id}
              draggable
              onDragStart={() => { dragId.current = i.id; }}
              onDoubleClick={() => setItems(items.filter(x => x.id !== i.id))}
              className={`absolute cursor-move ${meta.color} border-2 text-[10px] font-semibold text-center flex items-center justify-center select-none ${isRound ? "rounded-full w-16 h-16" : "rounded w-20 h-12"}`}
              style={{ left: i.x, top: i.y }}
              title="Drag to move. Double-click to delete."
            >
              {i.label}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">Tip: drag to position, double-click to remove.</p>
    </div>
  );
}

// ============================================================
// 4. TIMELINE SCHEDULER
// ============================================================
type TimelineSlot = { id: string; time: string; activity: string };
function TimelineScheduler({ storageKey, quote }: { storageKey: string; quote?: PlannerCtx["quote"] }) {
  const defaults: TimelineSlot[] = [
    { id: "1", time: "17:00", activity: "Guests arrive & welcome drinks" },
    { id: "2", time: "18:00", activity: "Ceremony / Opening" },
    { id: "3", time: "19:00", activity: "Dinner served" },
    { id: "4", time: "20:30", activity: "Speeches" },
    { id: "5", time: "21:00", activity: "First dance + dance floor opens 🎶" },
    { id: "6", time: "23:30", activity: "Last song" },
  ];
  const [slots, setSlots] = useLocal<TimelineSlot[]>(storageKey, defaults);

  const upd = (id: string, p: Partial<TimelineSlot>) => setSlots(slots.map(s => s.id === id ? { ...s, ...p } : s));
  const add = () => setSlots([...slots, { id: crypto.randomUUID(), time: "00:00", activity: "" }]);
  const remove = (id: string) => setSlots(slots.filter(s => s.id !== id));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= slots.length) return;
    const n = [...slots]; [n[i], n[j]] = [n[j], n[i]]; setSlots(n);
  };

  return (
    <div className="space-y-3">
      {quote?.event_date && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Schedule for {new Date(quote.event_date).toLocaleDateString("en-ZA")}
        </p>
      )}
      <div className="space-y-2">
        {slots.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <Input type="time" value={s.time} onChange={e => upd(s.id, { time: e.target.value })} className="w-24" />
            <Input value={s.activity} onChange={e => upd(s.id, { activity: e.target.value })} placeholder="Activity" />
            <Button variant="ghost" size="icon" onClick={() => move(i, -1)}><ArrowUp className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" onClick={() => move(i, 1)}><ArrowDown className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" />Add Slot</Button>
    </div>
  );
}

// ============================================================
// 5. MUSIC PLANNER
// ============================================================
type Song = { id: string; title: string; artist: string; moment: string };
const MOMENTS = ["Cocktail", "Entrance", "Dinner", "First Dance", "Cake Cutting", "Dance Floor", "Last Song"];
function MusicPlanner({ storageKey, quote }: { storageKey: string; quote?: PlannerCtx["quote"] }) {
  const [songs, setSongs] = useLocal<Song[]>(storageKey, []);
  const [doNotPlay, setDoNotPlay] = useLocal<string>(storageKey + ":dnp", "");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [moment, setMoment] = useState(MOMENTS[0]);
  const [loadingAI, setLoadingAI] = useState(false);

  const add = () => {
    if (!title.trim()) return;
    setSongs([...songs, { id: crypto.randomUUID(), title, artist, moment }]);
    setTitle(""); setArtist("");
  };

  const aiSuggest = async () => {
    setLoadingAI(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Suggest 8 crowd-pleaser songs for a ${quote?.event_type || "party"} in South Africa. Mix local + international hits. Format strictly as: "Title — Artist" one per line, no numbering, no extra text.` }],
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("AI failed");
      const reader = resp.body.getReader(); const dec = new TextDecoder();
      let buf = "", text = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6).trim(); if (d === "[DONE]") continue;
          try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content; if (c) text += c; } catch {}
        }
      }
      const newSongs: Song[] = text.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 8).map(line => {
        const [t, a] = line.split("—").map(s => s?.trim());
        return { id: crypto.randomUUID(), title: t || line, artist: a || "", moment: "Dance Floor" };
      });
      setSongs([...songs, ...newSongs]);
      toast({ title: `Added ${newSongs.length} AI suggestions 🎶` });
    } catch (e: any) {
      toast({ title: "AI error", description: e.message, variant: "destructive" });
    } finally { setLoadingAI(false); }
  };

  return (
    <div className="space-y-3">
      <Card><CardContent className="py-3 space-y-2">
        <div className="grid grid-cols-12 gap-2">
          <Input className="col-span-4" placeholder="Song title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input className="col-span-3" placeholder="Artist" value={artist} onChange={e => setArtist(e.target.value)} />
          <select className="col-span-3 h-10 rounded-md border border-input bg-background text-sm px-2" value={moment} onChange={e => setMoment(e.target.value)}>
            {MOMENTS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <Button className="col-span-2" onClick={add}><Plus className="w-4 h-4" /></Button>
        </div>
        <Button variant="outline" size="sm" onClick={aiSuggest} disabled={loadingAI}>
          {loadingAI ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
          AI Suggest Songs
        </Button>
      </CardContent></Card>

      {MOMENTS.map(m => {
        const list = songs.filter(s => s.moment === m);
        if (list.length === 0) return null;
        return (
          <div key={m}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{m}</p>
            <div className="space-y-1">
              {list.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm rounded-md border border-border px-3 py-1.5">
                  <span><strong>{s.title}</strong>{s.artist ? ` — ${s.artist}` : ""}</span>
                  <Button variant="ghost" size="icon" onClick={() => setSongs(songs.filter(x => x.id !== s.id))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="space-y-1">
        <Label className="text-xs">Do NOT play list</Label>
        <Textarea value={doNotPlay} onChange={e => setDoNotPlay(e.target.value)} rows={2} placeholder="One per line: song or artist to avoid" />
      </div>
    </div>
  );
}

// ============================================================
// 6. WEATHER WIDGET (open-meteo, no API key)
// ============================================================
function WeatherWidget({ quote }: { quote?: PlannerCtx["quote"] }) {
  const [loc, setLoc] = useState(quote?.venue || "Pretoria");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchW = async () => {
    setLoading(true);
    try {
      const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`);
      const geo = await g.json();
      if (!geo.results?.[0]) throw new Error("Location not found");
      const { latitude, longitude, name } = geo.results[0];
      const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=14`);
      const wd = await w.json();
      setData({ name, ...wd });
    } catch (e: any) {
      toast({ title: "Weather error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchW(); /* eslint-disable-next-line */ }, []);

  const eventDay = quote?.event_date ? data?.daily?.time?.indexOf(quote.event_date) : -1;
  const codeMap: Record<number, string> = { 0: "☀️ Clear", 1: "🌤 Mostly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast", 45: "🌫 Fog", 51: "🌦 Drizzle", 61: "🌧 Rain", 71: "❄️ Snow", 80: "🌧 Showers", 95: "⛈ Thunderstorm" };
  const labelFor = (c: number) => codeMap[c] || `Code ${c}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={loc} onChange={e => setLoc(e.target.value)} placeholder="City or venue" />
        <Button onClick={fetchW} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}</Button>
      </div>
      {data && (
        <>
          <p className="text-xs text-muted-foreground">14-day forecast for <strong>{data.name}</strong></p>
          {eventDay >= 0 && (
            <Card variant="glass" className="border-primary/30">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Your event day ({new Date(quote!.event_date!).toLocaleDateString("en-ZA")})</p>
                <p className="text-2xl font-bold">{labelFor(data.daily.weather_code[eventDay])}</p>
                <p className="text-sm">{data.daily.temperature_2m_min[eventDay]}° – {data.daily.temperature_2m_max[eventDay]}°C • {data.daily.precipitation_probability_max[eventDay]}% rain</p>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.daily.time.slice(0, 8).map((d: string, i: number) => (
              <div key={d} className="rounded-md border border-border p-2 text-center text-xs">
                <p className="font-semibold">{new Date(d).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" })}</p>
                <p className="text-lg">{labelFor(data.daily.weather_code[i]).split(" ")[0]}</p>
                <p>{Math.round(data.daily.temperature_2m_min[i])}°–{Math.round(data.daily.temperature_2m_max[i])}°</p>
                <p className="text-muted-foreground">{data.daily.precipitation_probability_max[i]}% 💧</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// 7. VENDOR FINDER
// ============================================================
const VENDOR_CATEGORIES = ["Photographer", "Caterer", "Florist", "Cake", "Decor", "Hair & Makeup", "Transport", "Venue", "Stationery", "Other"];
type Vendor = { id: string; name: string; category: string; phone: string; notes: string; booked: boolean };
function VendorFinder({ storageKey, quote }: { storageKey: string; quote?: PlannerCtx["quote"] }) {
  const [vendors, setVendors] = useLocal<Vendor[]>(storageKey, []);
  const [form, setForm] = useState({ name: "", category: VENDOR_CATEGORIES[0], phone: "", notes: "" });
  const [aiBusy, setAiBusy] = useState(false);
  const [recs, setRecs] = useLocal<string>(storageKey + ":recs", "");

  const add = () => {
    if (!form.name.trim()) return;
    setVendors([...vendors, { id: crypto.randomUUID(), ...form, booked: false }]);
    setForm({ name: "", category: VENDOR_CATEGORIES[0], phone: "", notes: "" });
  };

  const getRecs = async () => {
    setAiBusy(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Recommend types of vendors I should book for a ${quote?.event_type || "event"}${quote?.venue ? ` at ${quote.venue}` : ""}${quote?.guest_count ? ` for ${quote.guest_count} guests` : ""} in South Africa. Give a concise checklist with what to look for in each. Mention that BeatKulture covers DJ & entertainment so I don't need to find that.` }],
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("AI failed");
      const r = resp.body.getReader(); const dec = new TextDecoder(); let buf = "", text = "";
      while (true) {
        const { done, value } = await r.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6).trim(); if (d === "[DONE]") continue;
          try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content; if (c) { text += c; setRecs(text); } } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: "AI error", description: e.message, variant: "destructive" });
    } finally { setAiBusy(false); }
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={getRecs} disabled={aiBusy}>
        {aiBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
        AI Vendor Recommendations
      </Button>
      {recs && <Card><CardContent className="py-3 text-xs whitespace-pre-wrap">{recs}</CardContent></Card>}

      <Separator />
      <div className="grid grid-cols-12 gap-2">
        <Input className="col-span-4" placeholder="Vendor name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <select className="col-span-3 h-10 rounded-md border border-input bg-background text-sm px-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {VENDOR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <Input className="col-span-3" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <Button className="col-span-2" onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-1">
        {vendors.map(v => (
          <div key={v.id} className="flex items-center justify-between gap-2 text-sm rounded-md border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={v.booked} onCheckedChange={(c) => setVendors(vendors.map(x => x.id === v.id ? { ...x, booked: !!c } : x))} />
              <div>
                <p className={`font-semibold ${v.booked ? "line-through text-muted-foreground" : ""}`}>{v.name} <Badge variant="outline" className="text-[10px] ml-1">{v.category}</Badge></p>
                {v.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setVendors(vendors.filter(x => x.id !== v.id))}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 8. CHECKLIST MANAGER
// ============================================================
type Task = { id: string; text: string; done: boolean; weeksBefore?: number };
function ChecklistManager({ storageKey, quote }: { storageKey: string; quote?: PlannerCtx["quote"] }) {
  const defaults: Task[] = [
    { id: "1", text: "Book BeatKulture DJ + confirm package", done: false, weeksBefore: 12 },
    { id: "2", text: "Send invitations", done: false, weeksBefore: 8 },
    { id: "3", text: "Finalize venue booking", done: false, weeksBefore: 10 },
    { id: "4", text: "Confirm caterer + menu tasting", done: false, weeksBefore: 6 },
    { id: "5", text: "Book photographer", done: false, weeksBefore: 8 },
    { id: "6", text: "Finalize guest list & RSVPs", done: false, weeksBefore: 3 },
    { id: "7", text: "Submit must-play / do-not-play songs to DJ", done: false, weeksBefore: 2 },
    { id: "8", text: "Confirm timeline with all vendors", done: false, weeksBefore: 1 },
    { id: "9", text: "Pay outstanding balances", done: false, weeksBefore: 1 },
  ];
  const [tasks, setTasks] = useLocal<Task[]>(storageKey, defaults);
  const [newTask, setNewTask] = useState("");

  const completed = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{completed} / {tasks.length} done ({pct}%)</p>
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="space-y-1">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <Checkbox checked={t.done} onCheckedChange={(c) => setTasks(tasks.map(x => x.id === t.id ? { ...x, done: !!c } : x))} />
            <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.text}</span>
            {t.weeksBefore != null && <Badge variant="outline" className="text-[10px]">{t.weeksBefore}w before</Badge>}
            <Button variant="ghost" size="icon" onClick={() => setTasks(tasks.filter(x => x.id !== t.id))}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task…" onKeyDown={e => {
          if (e.key === "Enter" && newTask.trim()) {
            setTasks([...tasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }]);
            setNewTask("");
          }
        }} />
        <Button onClick={() => { if (newTask.trim()) { setTasks([...tasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }]); setNewTask(""); } }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 9. INVITATION DESIGNER
// ============================================================
function InvitationDesigner({ storageKey, quote }: { storageKey: string; quote?: PlannerCtx["quote"] }) {
  const [data, setData] = useLocal(storageKey, {
    title: "You're Invited!",
    hosts: "The Family",
    eventName: quote?.event_type || "Our Special Event",
    date: quote?.event_date || "",
    time: quote?.start_time?.slice(0, 5) || "18:00",
    venue: quote?.venue || "",
    rsvp: "+27 65 528 5528",
    theme: "elegant",
    message: "Join us for an unforgettable evening of music, food, and celebration.",
  });

  const themes: Record<string, string> = {
    elegant: "from-slate-900 via-purple-900 to-slate-900 text-amber-100",
    floral: "from-rose-200 via-pink-100 to-amber-100 text-rose-900",
    neon: "from-cyan-500 via-purple-600 to-pink-500 text-white",
    classic: "from-amber-50 to-stone-100 text-stone-900",
  };

  const print = () => window.print();

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-2">
        <Input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="Title" />
        <Input value={data.hosts} onChange={e => setData({ ...data, hosts: e.target.value })} placeholder="Hosts" />
        <Input value={data.eventName} onChange={e => setData({ ...data, eventName: e.target.value })} placeholder="Event name" />
        <Input value={data.date} type="date" onChange={e => setData({ ...data, date: e.target.value })} />
        <Input value={data.time} type="time" onChange={e => setData({ ...data, time: e.target.value })} />
        <Input value={data.venue} onChange={e => setData({ ...data, venue: e.target.value })} placeholder="Venue" />
        <Input value={data.rsvp} onChange={e => setData({ ...data, rsvp: e.target.value })} placeholder="RSVP" />
        <select className="h-10 rounded-md border border-input bg-background text-sm px-2" value={data.theme} onChange={e => setData({ ...data, theme: e.target.value })}>
          <option value="elegant">Elegant</option><option value="floral">Floral</option>
          <option value="neon">Neon Night</option><option value="classic">Classic</option>
        </select>
      </div>
      <Textarea value={data.message} onChange={e => setData({ ...data, message: e.target.value })} rows={2} placeholder="Personal message" />

      <div id="invite-preview" className={`rounded-xl p-8 text-center bg-gradient-to-br ${themes[data.theme]} shadow-lg`}>
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">{data.hosts} invite you to</p>
        <h2 className="text-3xl font-display font-bold my-3">{data.title}</h2>
        <p className="text-xl font-semibold mb-4">{data.eventName}</p>
        <p className="text-sm italic mb-4 opacity-90">{data.message}</p>
        <Separator className="my-3 opacity-30" />
        <div className="space-y-1 text-sm">
          {data.date && <p>📅 {new Date(data.date).toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>}
          {data.time && <p>🕐 {data.time}</p>}
          {data.venue && <p>📍 {data.venue}</p>}
          {data.rsvp && <p className="mt-2 text-xs">RSVP: {data.rsvp}</p>}
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-widest opacity-60">🎵 Music by BeatKulture Entertainment</p>
      </div>

      <Button variant="outline" size="sm" onClick={print}>Print / Save as PDF</Button>
    </div>
  );
}

// ============================================================
// 10. NOTES & REMINDERS
// ============================================================
type Note = { id: string; text: string; remindAt?: string; created: string };
function NotesReminders({ storageKey }: { storageKey: string }) {
  const [notes, setNotes] = useLocal<Note[]>(storageKey, []);
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setNotes([{ id: crypto.randomUUID(), text, remindAt: when || undefined, created: new Date().toISOString() }, ...notes]);
    setText(""); setWhen("");
  };

  const sorted = [...notes].sort((a, b) => {
    if (a.remindAt && b.remindAt) return a.remindAt.localeCompare(b.remindAt);
    if (a.remindAt) return -1; if (b.remindAt) return 1;
    return b.created.localeCompare(a.created);
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2">
        <Textarea className="col-span-12" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Quick note or reminder…" />
        <Input className="col-span-9" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
        <Button className="col-span-3" onClick={add}><Plus className="w-4 h-4 mr-1" />Add</Button>
      </div>
      <div className="space-y-2">
        {sorted.map(n => {
          const due = n.remindAt && new Date(n.remindAt) < new Date();
          return (
            <div key={n.id} className={`rounded-md border p-3 ${due ? "border-destructive bg-destructive/10" : "border-border"}`}>
              <div className="flex justify-between gap-2">
                <p className="text-sm whitespace-pre-wrap flex-1">{n.text}</p>
                <Button variant="ghost" size="icon" onClick={() => setNotes(notes.filter(x => x.id !== n.id))}><Trash2 className="w-3 h-3" /></Button>
              </div>
              {n.remindAt && <p className="text-[11px] text-muted-foreground mt-1">⏰ {new Date(n.remindAt).toLocaleString("en-ZA")} {due && <Badge variant="destructive" className="text-[9px] ml-1">Due</Badge>}</p>}
            </div>
          );
        })}
        {notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
      </div>
    </div>
  );
}

// ============================================================
// 11. QR SONG REQUEST SYSTEM
// ============================================================
function QRSongRequests({ quote }: { quote?: PlannerCtx["quote"] }) {
  const eventId = quote?.id;
  const url = eventId ? `${window.location.origin}/request/${eventId}` : "";

  if (!eventId) {
    return (
      <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">
        <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
        Your QR song request code will appear here once your event is booked with BeatKulture.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-muted-foreground">Print this QR code and place it on tables. Guests scan to request songs from DJ Shawn-E-Shawn live!</p>
      <div className="inline-block bg-white p-4 rounded-xl shadow">
        <QRCodeSVG value={url} size={200} level="H" includeMargin />
      </div>
      <p className="text-xs font-mono break-all">{url}</p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast({ title: "Link copied!" }); }}>Copy Link</Button>
        <Button variant="outline" size="sm" asChild><a href={url} target="_blank" rel="noreferrer">Open Page</a></Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3" /> Powered by BeatKulture Entertainment • +27 65 528 5528
      </p>
    </div>
  );
}

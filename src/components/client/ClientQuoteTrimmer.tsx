// @ts-nocheck
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scissors, Trash2, Loader2, Sparkles, Info, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEquipmentCatalog } from "@/hooks/useEquipmentCatalog";
import { useSpecials } from "@/hooks/useSpecials";
import { formatCurrency, DJ_HOURLY_RATE, KIDS_CORNER_HOURLY_RATE, TRAVEL_RATE_PER_KM, FREE_TRAVEL_KM, DEPOSIT_PERCENT } from "@/lib/pricing";
import type { DatabaseQuote } from "@/hooks/useQuotes";
import { useQueryClient } from "@tanstack/react-query";

type Removable =
  | { kind: "equipment"; key: string; name: string; price: number; qty: number }
  | { kind: "custom"; index: number; name: string; price: number; qty: number }
  | { kind: "extra"; index: number; name: string; price: number; qty: number }
  | { kind: "kids"; name: string; price: number; qty: number }
  | { kind: "human_jukebox"; name: string; price: number; qty: number };

interface Props {
  quote: DatabaseQuote;
  onUpdated?: () => void;
}

/** Pick the best-matching active special for this event type. Falls back to the largest active discount. */
function pickBestDiscount(specials: any[], eventType: string | null | undefined): { percent: number; title: string | null } {
  const type = (eventType || "").toLowerCase();
  let bestMatch = { percent: 0, title: null as string | null };
  let bestAny = { percent: 0, title: null as string | null };

  for (const s of specials || []) {
    if (!s?.is_active) continue;
    const pct = Number(s.discount_percent || 0);
    if (pct <= 0) continue;
    const title = String(s.title || "").toLowerCase();
    if (pct > bestAny.percent) bestAny = { percent: pct, title: s.title };
    // Event-type match — title mentions the event category
    if (type && (title.includes(type) ||
      (type.includes("wedding") && title.includes("wedding")) ||
      (type.includes("corporate") && title.includes("corporate")) ||
      (type.includes("party") && title.includes("party")) ||
      (type.includes("birthday") && title.includes("birthday")))) {
      if (pct > bestMatch.percent) bestMatch = { percent: pct, title: s.title };
    }
  }
  return bestMatch.percent > 0 ? bestMatch : bestAny;
}

export function ClientQuoteTrimmer({ quote, onUpdated }: Props) {
  const { items: catalogItems } = useEquipmentCatalog();
  const { activeSpecials } = useSpecials();
  const queryClient = useQueryClient();

  const [pending, setPending] = useState<Removable | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const locked = ["accepted", "paid", "deposit_paid", "declined", "cancelled", "completed"].includes(quote.status);

  const removables: Removable[] = useMemo(() => {
    const list: Removable[] = [];
    // Equipment
    Object.entries(quote.equipment || {}).forEach(([key, qty]) => {
      const q = Number(qty) || 0;
      if (q <= 0) return;
      const item = catalogItems.find((c) => c.item_key === key);
      list.push({ kind: "equipment", key, name: item?.name || key, price: Number(item?.price || 0), qty: q });
    });
    // Custom items
    (quote.custom_items || []).forEach((c, i) => list.push({ kind: "custom", index: i, name: c.name, price: Number(c.price), qty: Number(c.qty) }));
    // Extras
    (quote.extras || []).forEach((e, i) => list.push({ kind: "extra", index: i, name: e.name, price: Number(e.price), qty: Number(e.qty) }));
    // Kids corner
    if (quote.kids_corner && Number(quote.kids_cost) > 0) {
      list.push({ kind: "kids", name: `Kids Corner (${quote.kids_hours}h)`, price: Number(quote.kids_cost), qty: 1 });
    }
    // Human jukebox (optional field)
    const hjHours = Number((quote as any).human_jukebox_hours || 0);
    if ((quote as any).human_jukebox && hjHours > 0) {
      const hjCost = Number((quote as any).human_jukebox_cost || 0);
      list.push({ kind: "human_jukebox", name: `Human Jukebox (${hjHours}h)`, price: hjCost, qty: 1 });
    }
    return list;
  }, [quote, catalogItems]);

  const suggestedDiscount = useMemo(
    () => pickBestDiscount(activeSpecials as any[], quote.event_type),
    [activeSpecials, quote.event_type]
  );

  const confirmRemove = async () => {
    if (!pending) return;
    setSaving(true);

    try {
      // Build the updated collections
      const equipment = { ...(quote.equipment || {}) } as Record<string, number>;
      let custom_items = [...(quote.custom_items || [])];
      let extras = [...(quote.extras || [])];
      let kids_corner = !!quote.kids_corner;
      let kids_hours = Number(quote.kids_hours || 0);
      let human_jukebox = !!(quote as any).human_jukebox;
      let human_jukebox_hours = Number((quote as any).human_jukebox_hours || 0);

      if (pending.kind === "equipment") delete equipment[pending.key];
      if (pending.kind === "custom") custom_items = custom_items.filter((_, i) => i !== pending.index);
      if (pending.kind === "extra") extras = extras.filter((_, i) => i !== pending.index);
      if (pending.kind === "kids") { kids_corner = false; kids_hours = 0; }
      if (pending.kind === "human_jukebox") { human_jukebox = false; human_jukebox_hours = 0; }

      // Recalculate against catalog
      const djCost = Number(quote.dj_cost || 0); // DJ hours unchanged
      let equipment_cost = 0;
      Object.entries(equipment).forEach(([key, qty]) => {
        const item = catalogItems.find((c) => c.item_key === key);
        equipment_cost += Number(item?.price || 0) * (Number(qty) || 0);
      });
      const custom_items_cost = custom_items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
      const extras_cost = extras.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
      const kids_cost = kids_corner ? kids_hours * KIDS_CORNER_HOURLY_RATE : 0;
      const hjCost = human_jukebox ? human_jukebox_hours * 250 : 0;

      const subtotal = djCost + equipment_cost + custom_items_cost + kids_cost + hjCost;

      // Apply the best-matching special discount (or keep current if no special matches)
      const chosenPct = suggestedDiscount.percent > 0 ? suggestedDiscount.percent : Number(quote.discount_percent || 0);
      const discount_amount = subtotal * (chosenPct / 100);
      const travel_cost = Number(quote.travel_cost || 0); // travel unchanged
      const total = subtotal + travel_cost + extras_cost - discount_amount;
      const deposit = total * (DEPOSIT_PERCENT / 100);
      const balance = total - deposit;

      // Audit log
      const removalRecord = {
        kind: pending.kind === "extra" ? "extra" : "custom_item",
        item_kind: pending.kind,
        name: pending.name,
        price: pending.price,
        qty: pending.qty,
        reason: reason.trim() || "Client removed",
        removed_at: new Date().toISOString(),
      };
      const client_removed_items = [...((quote as any).client_removed_items || []), removalRecord];

      const patch: any = {
        equipment,
        custom_items,
        extras,
        kids_corner,
        kids_hours,
        equipment_cost,
        custom_items_cost,
        extras_cost,
        kids_cost,
        subtotal,
        discount_percent: chosenPct,
        discount_amount,
        total,
        deposit,
        balance,
        client_removed_items,
      };
      if (pending.kind === "human_jukebox") {
        patch.human_jukebox = false;
        patch.human_jukebox_hours = 0;
        patch.human_jukebox_cost = 0;
      }

      const { error } = await supabase.from("quotes").update(patch).eq("id", quote.id);
      if (error) throw error;

      // Log a message on the quote thread so admin sees it
      await supabase.from("quote_messages").insert({
        quote_id: quote.id,
        sender_role: "client",
        sender_name: quote.client_name,
        message: `Removed from quote: ${pending.name} (${formatCurrency(pending.price * pending.qty)}) — Reason: ${reason.trim() || "not specified"}`,
      });

      toast({
        title: "Item removed",
        description: `${pending.name} has been removed. Total updated${chosenPct > 0 ? ` with ${chosenPct}% ${suggestedDiscount.title || "special"} discount` : ""}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      onUpdated?.();
    } catch (e: any) {
      toast({ title: "Could not remove item", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setPending(null);
      setReason("");
    }
  };

  const restoreItem = async (r: any, index: number) => {
    setSaving(true);
    try {
      const equipment = { ...(quote.equipment || {}) } as Record<string, number>;
      let custom_items = [...(quote.custom_items || [])];
      let extras = [...(quote.extras || [])];
      let kids_corner = !!quote.kids_corner;
      let kids_hours = Number(quote.kids_hours || 0);
      let human_jukebox = !!(quote as any).human_jukebox;
      let human_jukebox_hours = Number((quote as any).human_jukebox_hours || 0);

      const kind = r.item_kind;
      if (kind === "equipment") {
        // Restore the original quantity — look up the key via the catalog
        const cat = catalogItems.find((c) => c.name === r.name);
        const key = cat?.item_key;
        if (key) equipment[key] = Number(r.qty) || 1;
      } else if (kind === "custom") {
        custom_items.push({ name: r.name, price: Number(r.price), qty: Number(r.qty) });
      } else if (kind === "extra") {
        extras.push({ name: r.name, price: Number(r.price), qty: Number(r.qty) });
      } else if (kind === "kids") {
        kids_corner = true;
        // Recover hours from the original label "Kids Corner (Xh)"
        const m = /\((\d+(?:\.\d+)?)h\)/.exec(r.name);
        kids_hours = m ? Number(m[1]) : 1;
      } else if (kind === "human_jukebox") {
        human_jukebox = true;
        const m = /\((\d+(?:\.\d+)?)h\)/.exec(r.name);
        human_jukebox_hours = m ? Number(m[1]) : 1;
      }

      // Recalculate
      const djCost = Number(quote.dj_cost || 0);
      let equipment_cost = 0;
      Object.entries(equipment).forEach(([key, qty]) => {
        const item = catalogItems.find((c) => c.item_key === key);
        equipment_cost += Number(item?.price || 0) * (Number(qty) || 0);
      });
      const custom_items_cost = custom_items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
      const extras_cost = extras.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
      const kids_cost = kids_corner ? kids_hours * KIDS_CORNER_HOURLY_RATE : 0;
      const hjCost = human_jukebox ? human_jukebox_hours * 250 : 0;

      const subtotal = djCost + equipment_cost + custom_items_cost + kids_cost + hjCost;
      const chosenPct = Number(quote.discount_percent || 0);
      const discount_amount = subtotal * (chosenPct / 100);
      const travel_cost = Number(quote.travel_cost || 0);
      const total = subtotal + travel_cost + extras_cost - discount_amount;
      const deposit = total * (DEPOSIT_PERCENT / 100);
      const balance = total - deposit;

      const client_removed_items = ((quote as any).client_removed_items || []).filter(
        (_: any, i: number) => i !== index,
      );

      const patch: any = {
        equipment,
        custom_items,
        extras,
        kids_corner,
        kids_hours,
        equipment_cost,
        custom_items_cost,
        extras_cost,
        kids_cost,
        subtotal,
        discount_amount,
        total,
        deposit,
        balance,
        client_removed_items,
      };
      if (kind === "human_jukebox") {
        patch.human_jukebox = true;
        patch.human_jukebox_hours = human_jukebox_hours;
        patch.human_jukebox_cost = hjCost;
      }

      const { error } = await supabase.from("quotes").update(patch).eq("id", quote.id);
      if (error) throw error;

      await supabase.from("quote_messages").insert({
        quote_id: quote.id,
        sender_role: "client",
        sender_name: quote.client_name,
        message: `Added back to quote: ${r.name} (${formatCurrency(Number(r.price) * Number(r.qty))})`,
      });

      toast({ title: "Item restored", description: `${r.name} is back on your quote.` });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      onUpdated?.();
    } catch (e: any) {
      toast({ title: "Could not restore item", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (locked) {
    return (
      <Card variant="glass" className="border-primary/30">
        <CardContent className="p-4 flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            This quote is <span className="font-semibold text-foreground">{quote.status}</span> — items can no longer be removed.
            Message us on the thread below if you need changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glow" className="border-secondary/40 shadow-[0_0_28px_hsl(285_100%_62%/0.35)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-secondary" />
          Trim Your Quote
        </CardTitle>
        <CardDescription>
          Remove any items you don't want. Your total, discount and deposit will re-calculate automatically.
          <span className="block text-[11px] italic mt-1 text-muted-foreground">
            You can only remove items — to add anything, message us on the thread below.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestedDiscount.percent > 0 && (
          <Alert className="border-primary/40 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              <span className="font-semibold text-primary">{suggestedDiscount.percent}% {suggestedDiscount.title}</span>{" "}
              discount will be applied when you trim this quote (matched to <span className="capitalize">{quote.event_type || "your event"}</span>).
            </AlertDescription>
          </Alert>
        )}

        {removables.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to remove — this quote is already at its minimum.</p>
        ) : (
          <div className="divide-y divide-border/40 rounded-lg border border-border/40">
            {removables.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatCurrency(r.price)} × {r.qty} = <span className="text-foreground">{formatCurrency(r.price * r.qty)}</span>
                    {" "}
                    <Badge variant="outline" className="ml-1 text-[9px] py-0 h-4">
                      {r.kind === "equipment" ? "Equipment"
                        : r.kind === "custom" ? "Custom"
                        : r.kind === "extra" ? "Extra"
                        : r.kind === "kids" ? "Kids Corner"
                        : "Human Jukebox"}
                    </Badge>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setPending(r)}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {((quote as any).client_removed_items?.length ?? 0) > 0 && (
          <div className="pt-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
              <Undo2 className="w-3 h-3" /> Removed by you — tap to add back up to the original quote
            </p>
            <div className="space-y-1">
              {(quote as any).client_removed_items.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-muted-foreground">
                    {r.name} <span className="italic">— {r.reason}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="line-through text-muted-foreground">
                      {formatCurrency(Number(r.price) * Number(r.qty))}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      disabled={saving}
                      onClick={() => restoreItem(r, i)}
                    >
                      <Undo2 className="w-3 h-3 mr-1" /> Add back
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove "{pending?.name}"?</DialogTitle>
            <DialogDescription>
              This will subtract {pending && formatCurrency(pending.price * pending.qty)} and re-run the calculation
              {suggestedDiscount.percent > 0 && <> with the <b>{suggestedDiscount.percent}% {suggestedDiscount.title}</b> discount</>}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Reason (optional)</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Over budget, don't need it, venue provides…" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={saving}>Cancel</Button>
            <Button onClick={confirmRemove} disabled={saving} className="bg-gradient-to-r from-secondary to-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1" /> Remove & recalculate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ClientQuoteTrimmer;

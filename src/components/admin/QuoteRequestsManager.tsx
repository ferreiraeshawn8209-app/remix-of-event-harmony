import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuoteRequests, QuoteRequest } from "@/hooks/useQuoteRequests";
import { useSpecials } from "@/hooks/useSpecials";
import { inferAutoDiscountPercent } from "@/lib/autoDiscount";
import {
  Loader2, Calendar, MapPin, Mic, Lightbulb, Speaker, Wand2, Users, Sparkles,
  ArrowRight, MessageSquare, Phone, Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  pending: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  quoted: "bg-success/20 text-success border-success/30",
  declined: "bg-destructive/20 text-destructive border-destructive/30",
};

export function QuoteRequestsManager() {
  const { requests, isLoading, deleteRequest, updateRequest } = useQuoteRequests();
  const { activeSpecials } = useSpecials();
  const [acting, setActing] = useState<string | null>(null);
  const navigate = useNavigate();

  const startQuote = async (r: QuoteRequest) => {
    setActing(r.id);
    try {
      // Move request to in_progress
      await updateRequest({ id: r.id, updates: { status: "in_progress" } });

      // Stash request payload so the calculator can prefill (optional convenience)
      try {
        sessionStorage.setItem("prefill_quote_request", JSON.stringify(r));
      } catch { /* ignore */ }

      // Open admin quote builder and include request id for prefill
      navigate(`/admin?newQuote=1&newQuoteRequest=${r.id}`);
      navigate("/admin?tab=new-quote");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setActing(null);
  };

  const decline = async (r: QuoteRequest) => {
    setActing(r.id);
    await updateRequest({ id: r.id, updates: { status: "declined" } });
    setActing(null);
  };

  const removeRequest = async (r: QuoteRequest) => {
    const confirmed = window.confirm(`Delete quote request from ${r.client_name}? This cannot be undone.`);
    if (!confirmed) return;
    setActing(r.id);
    try {
      await deleteRequest(r.id);
    } finally {
      setActing(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (requests.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No quote requests yet. When a client submits the questionnaire it will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(r => {
        const autoDiscount = inferAutoDiscountPercent(r.event_type, activeSpecials);
        return (
        <Card key={r.id} variant="glass">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">
                  {r.client_name} — {r.event_type}
                  {r.package_name ? <span className="text-muted-foreground"> · {r.package_name}</span> : null}
                </CardTitle>
                <CardDescription className="text-xs">
                  {r.email}{r.contact_no ? ` • ${r.contact_no}` : ""} • Submitted {new Date(r.created_at).toLocaleString("en-ZA")}
                </CardDescription>
                {autoDiscount > 0 && (
                  <Badge variant="outline" className="mt-2 text-[10px] border-success/40 text-success">
                    Auto discount to apply: {autoDiscount}%
                  </Badge>
                )}
                <Badge variant="outline" className="mt-2 ml-2 text-[10px]">
                  Payment preference: {r.payment_preference === "monthly_installments" ? "Monthly installments" : "Deposit + balance"}
                </Badge>
              </div>
              <Badge variant="outline" className={statusColors[r.status] || ""}>
                {r.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {r.event_date || "Date TBD"} {r.start_time ? `• ${r.start_time.slice(0,5)}` : ""}{r.end_time ? `–${r.end_time.slice(0,5)}` : ""}</div>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {r.venue_name || "Venue TBD"}{r.venue_address ? ` — ${r.venue_address}` : ""}</div>
                {r.city && (
                  <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {r.city}</div>
                )}
                {r.guest_count != null && (
                  <div className="flex items-center gap-2"><Users className="w-3 h-3" /> ~{r.guest_count} guests</div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide">{r.is_outdoor ? "Outdoor" : "Indoor"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Requirements</p>
                <div className="flex flex-wrap gap-1.5">
                  {!r.venue_provides_sound && <Badge variant="outline" className="text-[10px] gap-1"><Speaker className="w-3 h-3" /> Sound setup</Badge>}
                  {r.requires_microphones && <Badge variant="outline" className="text-[10px] gap-1"><Mic className="w-3 h-3" /> Microphones</Badge>}
                  {r.requires_lighting && <Badge variant="outline" className="text-[10px] gap-1"><Lightbulb className="w-3 h-3" /> Lighting</Badge>}
                  {r.requires_laser_effects && <Badge variant="outline" className="text-[10px] gap-1"><Wand2 className="w-3 h-3" /> Lasers</Badge>}
                  {r.requires_smoke_machine && <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="w-3 h-3" /> Smoke</Badge>}
                  {r.requires_fog_machine && <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="w-3 h-3" /> Fog</Badge>}
                  {r.requires_low_fog_machine && <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="w-3 h-3" /> Low fog</Badge>}
                  {r.requires_cold_spark_machines && <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="w-3 h-3" /> Cold sparks</Badge>}
                  {r.venue_provides_sound && (
                    <Badge variant="outline" className="text-[10px]">Venue sound provided</Badge>
                  )}
                  {r.venue_provides_sound &&
                    !r.requires_microphones &&
                    !r.requires_lighting &&
                    !r.requires_laser_effects &&
                    !r.requires_smoke_machine &&
                    !r.requires_fog_machine &&
                    !r.requires_low_fog_machine &&
                    !r.requires_cold_spark_machines && (
                    <span className="text-xs text-muted-foreground">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {r.notes && (
              <>
                <Separator />
                <div className="text-xs">
                  <p className="font-semibold flex items-center gap-1 mb-1"><MessageSquare className="w-3 h-3" /> Notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{r.notes}</p>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {r.status !== "quoted" && r.status !== "declined" && (
                <>
                  <Button size="sm" variant="hero" disabled={acting === r.id} onClick={() => startQuote(r)}>
                    {acting === r.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowRight className="w-3 h-3 mr-1" />}
                    Build Quote
                  </Button>
                  <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => decline(r)}>
                    Decline
                  </Button>
                </>
              )}
              {r.contact_no && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={`tel:${r.contact_no}`}><Phone className="w-3 h-3 mr-1" /> Call</a>
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" disabled={acting === r.id} onClick={() => removeRequest(r)}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DatabaseQuote } from "@/hooks/useQuotes";

interface Props {
  quote: DatabaseQuote & {
    early_settlement_percent?: number;
    early_settlement_applied?: boolean;
    early_settlement_amount?: number;
    early_settlement_applied_at?: string | null;
  };
  isAdmin?: boolean;
}

/**
 * Early Settlement Discount
 * Offers an extra % off the remaining unpaid balance when the client
 * settles at least 30 days before the event.
 */
export function EarlySettlementDiscount({ quote, isAdmin }: Props) {
  const [applying, setApplying] = useState(false);
  const qc = useQueryClient();

  const pct = Number(quote.early_settlement_percent ?? 5);
  const already = Boolean(quote.early_settlement_applied);
  const eventDate = quote.event_date ? new Date(quote.event_date) : null;
  const daysToEvent = eventDate
    ? Math.floor((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const eligibleByDate = daysToEvent === null ? false : daysToEvent >= 30;
  const fullyPaid = Boolean(quote.deposit_paid && quote.balance_paid);

  // Amount considered "unpaid" and eligible for the discount:
  // - if deposit unpaid → the entire total is still owing
  // - if deposit paid but balance not paid → only remaining balance
  const unpaid = quote.deposit_paid
    ? Number(quote.balance || 0)
    : Number(quote.total || 0);
  const projectedDiscount = Math.round(unpaid * (pct / 100));

  if (already) {
    return (
      <Card variant="glass" className="mb-6 border-success/40">
        <CardContent className="py-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <div className="flex-1">
            <p className="font-semibold text-success">
              {pct}% Early Settlement Discount applied
            </p>
            <p className="text-xs text-muted-foreground">
              Saved {formatCurrency(Number(quote.early_settlement_amount || 0))}
              {quote.early_settlement_applied_at &&
                ` on ${new Date(quote.early_settlement_applied_at).toLocaleDateString()}`}
            </p>
          </div>
          <Badge className="bg-success/20 text-success" variant="outline">
            -{formatCurrency(Number(quote.early_settlement_amount || 0))}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (fullyPaid) return null;

  const apply = async () => {
    if (
      !confirm(
        `Apply ${pct}% early settlement discount? This will reduce the ${
          quote.deposit_paid ? "remaining balance" : "total"
        } by ${formatCurrency(projectedDiscount)}.`
      )
    )
      return;
    setApplying(true);
    try {
      const newTotal = Number(quote.total || 0) - projectedDiscount;
      // Reduce balance directly; keep deposit as-is (if already paid) or recompute deposit.
      const newBalance = quote.deposit_paid
        ? Number(quote.balance || 0) - projectedDiscount
        : Math.max(0, newTotal - Number(quote.deposit || 0) + Math.min(0, newTotal));
      // Simpler safe path when deposit isn't paid: total drops, balance = total - deposit still owed.
      const finalBalance = quote.deposit_paid
        ? newBalance
        : newTotal - Number(quote.deposit || 0);

      const { error } = await supabase
        .from("quotes")
        .update({
          early_settlement_applied: true,
          early_settlement_amount: projectedDiscount,
          early_settlement_percent: pct,
          early_settlement_applied_at: new Date().toISOString(),
          total: newTotal,
          balance: finalBalance,
        } as any)
        .eq("id", quote.id);
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Early settlement discount applied 🎉",
        description: `${pct}% off — you saved ${formatCurrency(projectedDiscount)}.`,
      });
    } catch (e: any) {
      toast({
        title: "Couldn't apply discount",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card variant="glow" className="mb-6 border-accent/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Early Settlement Discount — {pct}% Off
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Settle your {quote.deposit_paid ? "remaining balance" : "quote in full"}{" "}
          <strong>at least 30 days before your event</strong> and get an extra{" "}
          <strong>{pct}% off</strong>. Applies to your outstanding amount.
        </p>
        <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
          <span className="text-muted-foreground">Potential saving</span>
          <span className="font-semibold text-accent">
            -{formatCurrency(projectedDiscount)}
          </span>
        </div>

        {eventDate ? (
          eligibleByDate ? (
            <Badge variant="outline" className="bg-success/10 text-success">
              Eligible — {daysToEvent} days until your event
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
              Not eligible — event is in {daysToEvent} days (needs 30+)
            </Badge>
          )
        ) : (
          <Badge variant="outline">Set an event date to check eligibility</Badge>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="hero"
            size="sm"
            disabled={applying || (!isAdmin && !eligibleByDate)}
            onClick={apply}
          >
            {applying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Apply {pct}% Discount
          </Button>
          {isAdmin && !eligibleByDate && (
            <span className="text-xs text-muted-foreground self-center">
              Admin override — you can still apply outside the window.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

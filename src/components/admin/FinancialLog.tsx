import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatabaseQuote } from "@/hooks/useQuotes";
import { formatCurrency } from "@/lib/pricing";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

interface FinancialLogProps {
  quotes: DatabaseQuote[];
}

export function FinancialLog({ quotes }: FinancialLogProps) {
  const accepted = quotes.filter(q => q.status === "accepted" || q.status === "paid" || q.deposit_paid);
  const depositsPaid = quotes.filter(q => q.deposit_paid);
  const fullyPaid = quotes.filter(q => q.balance_paid);
  const rejected = quotes.filter(q => q.status === "declined" || q.status === "rejected");
  const pending = quotes.filter(q => q.status === "draft" || q.status === "sent");

  const totalRevenue = fullyPaid.reduce((s, q) => s + Number(q.total), 0);
  const depositsReceived = depositsPaid.reduce((s, q) => s + Number(q.deposit), 0);
  const outstandingBalances = depositsPaid.filter(q => !q.balance_paid).reduce((s, q) => s + Number(q.balance), 0);
  const pendingValue = pending.reduce((s, q) => s + Number(q.total), 0);
  const lostValue = rejected.reduce((s, q) => s + Number(q.total), 0);

  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: "Deposits Received", value: formatCurrency(depositsReceived), icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
    { label: "Outstanding Balances", value: formatCurrency(outstandingBalances), icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Pending Quotes", value: formatCurrency(pendingValue), icon: TrendingUp, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  // Build transaction log from all quotes sorted by date
  const transactions = quotes
    .filter(q => q.deposit_paid || q.balance_paid)
    .flatMap(q => {
      const items = [];
      if (q.deposit_paid) {
        items.push({
          date: q.deposit_paid_at || q.created_at,
          client: q.client_name,
          type: "Deposit" as const,
          amount: Number(q.deposit),
          quoteId: q.id,
        });
      }
      if (q.balance_paid) {
        items.push({
          date: q.balance_paid_at || q.updated_at,
          client: q.client_name,
          type: "Balance" as const,
          amount: Number(q.balance),
          quoteId: q.id,
        });
      }
      return items;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lost revenue */}
      {lostValue > 0 && (
        <Card variant="glass" className="border-destructive/20">
          <CardContent className="pt-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-muted-foreground">
              Rejected/Declined quotes: <span className="font-semibold text-destructive">{formatCurrency(lostValue)}</span> ({rejected.length} quotes)
            </span>
          </CardContent>
        </Card>
      )}

      {/* Transaction Log */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All deposit and balance payments received</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t, i) => (
                <div key={`${t.quoteId}-${t.type}-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.type === "Deposit" ? "bg-primary" : "bg-success"}`} />
                    <div>
                      <p className="font-medium text-sm">{t.client}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("en-ZA")} • {t.type} Payment
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">+{formatCurrency(t.amount)}</p>
                    <Badge variant="outline" className="text-xs">
                      {t.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

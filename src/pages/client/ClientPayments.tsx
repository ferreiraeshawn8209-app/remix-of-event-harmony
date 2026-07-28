import { Link } from "react-router-dom";
import ClientLayout from "@/components/client/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuotes } from "@/hooks/useQuotes";
import { CreditCard, ExternalLink } from "lucide-react";

const rand = (n: number) => "R " + Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ClientPayments() {
  const { quotes } = useQuotes();
  const active = quotes.filter((q) => !["declined", "rejected", "cancelled", "draft"].includes(q.status || ""));

  return (
    <ClientLayout title="Payments" subtitle="Deposit & balance schedule">
      <div className="space-y-3">
        {active.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No active quotes yet. <Link to="/client/event-hub" className="text-primary underline">Request one</Link>.
          </Card>
        ) : (
          active.map((q) => (
            <Card key={q.id} className="p-4 border-primary/20">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">{q.event_type || "Event"} • {q.event_date || "TBC"}</p>
                  <p className="text-xs text-muted-foreground">{q.client_code}</p>
                </div>
                <Badge variant={q.status === "paid" ? "default" : "secondary"}>{q.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold">{rand(q.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className={q.deposit_paid ? "font-bold text-success" : "font-bold"}>{rand(q.deposit)}</p>
                  {q.deposit_paid && <p className="text-[10px] text-success">Paid</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={q.balance_paid ? "font-bold text-success" : "font-bold"}>{rand(q.balance)}</p>
                  {q.balance_paid && <p className="text-[10px] text-success">Paid</p>}
                </div>
              </div>
              {Array.isArray(q.payment_schedule) && q.payment_schedule.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Payment schedule</p>
                  <ul className="space-y-1 text-sm">
                    {q.payment_schedule.map((p, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{p.description} — {p.due_date}</span>
                        <span className="font-semibold">{rand(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm">
                  <Link to={`/quote/${q.id}`}>
                    <CreditCard className="w-4 h-4 mr-1" /> View & pay
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/quote/${q.id}`}>
                    <ExternalLink className="w-4 h-4 mr-1" /> Details
                  </Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </ClientLayout>
  );
}

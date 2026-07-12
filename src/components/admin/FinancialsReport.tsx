import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, Receipt, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import type { DatabaseQuote } from "@/hooks/useQuotes";

// SA VAT rate — used only for display split so user can see the VAT-inclusive/exclusive breakdown for SARS.
const VAT_RATE = 0.15;

type Props = { quotes: DatabaseQuote[] };

type Period = "ytd" | "last_year" | "this_month" | "last_month" | "custom";

function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1); }
function endOfYear(d: Date) { return new Date(d.getFullYear(), 11, 31, 23, 59, 59); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); }
function iso(d: Date) { return d.toISOString().slice(0, 10); }

export function FinancialsReport({ quotes }: Props) {
  const now = new Date();
  const [period, setPeriod] = useState<Period>("ytd");
  const [from, setFrom] = useState<string>(iso(startOfYear(now)));
  const [to, setTo] = useState<string>(iso(endOfYear(now)));
  const [expenses, setExpenses] = useState<number>(0);
  const [inputVat, setInputVat] = useState<number>(0);
  const [vatRegNo, setVatRegNo] = useState<string>("");
  const [vatVendorCode, setVatVendorCode] = useState<string>("");

  function applyPeriod(p: Period) {
    setPeriod(p);
    const n = new Date();
    if (p === "ytd") { setFrom(iso(startOfYear(n))); setTo(iso(endOfYear(n))); }
    else if (p === "last_year") {
      const ly = new Date(n.getFullYear() - 1, 0, 1);
      setFrom(iso(startOfYear(ly))); setTo(iso(endOfYear(ly)));
    }
    else if (p === "this_month") { setFrom(iso(startOfMonth(n))); setTo(iso(endOfMonth(n))); }
    else if (p === "last_month") {
      const lm = new Date(n.getFullYear(), n.getMonth() - 1, 1);
      setFrom(iso(startOfMonth(lm))); setTo(iso(endOfMonth(lm)));
    }
  }

  const paidStatuses = new Set(["paid"]);

  const rows = useMemo(() => {
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T23:59:59");
    return quotes
      .filter((q) => {
        const dateStr = q.event_date || q.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start && d <= end;
      })
      .map((q) => {
        const total = Number(q.total || 0);
        const depositPaid = q.deposit_paid ? Number(q.deposit || 0) : 0;
        const balancePaid = q.balance_paid ? Number(q.balance || 0) : 0;
        const fullyPaid = paidStatuses.has(String(q.status)) || (q.deposit_paid && q.balance_paid);
        const received = fullyPaid ? total : depositPaid + balancePaid;
        return {
          id: q.id,
          date: q.event_date || q.created_at,
          client: q.client_name,
          code: q.client_code || "",
          event_type: q.event_type || "",
          status: q.status || "",
          total,
          received,
          travel: Number(q.travel_cost || 0),
          discount: Number(q.discount_amount || 0),
        };
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [quotes, from, to]);

  const summary = useMemo(() => {
    const invoiced = rows.reduce((s, r) => s + r.total, 0);
    const received = rows.reduce((s, r) => s + r.received, 0);
    const travel = rows.reduce((s, r) => s + r.travel, 0);
    const discounts = rows.reduce((s, r) => s + r.discount, 0);
    // Treat received as VAT-inclusive turnover for SARS VAT 201 illustration.
    const vatPortion = received - received / (1 + VAT_RATE);
    const netTurnover = received - vatPortion;
    const profit = netTurnover - Number(expenses || 0);
    return { invoiced, received, travel, discounts, vatPortion, netTurnover, profit };
  }, [rows, expenses]);

  function downloadCsv() {
    const header = ["Date", "Client", "Code", "Event Type", "Status", "Total Invoiced", "Received", "Travel", "Discount"];
    const lines = [header.join(",")].concat(
      rows.map((r) => [
        r.date, `"${r.client.replace(/"/g, '""')}"`, r.code, r.event_type, r.status,
        r.total.toFixed(2), r.received.toFixed(2), r.travel.toFixed(2), r.discount.toFixed(2),
      ].join(","))
    );
    lines.push("");
    lines.push(`,,,,Total Invoiced,${summary.invoiced.toFixed(2)}`);
    lines.push(`,,,,Total Received (incl VAT),${summary.received.toFixed(2)}`);
    lines.push(`,,,,VAT Portion (15%),${summary.vatPortion.toFixed(2)}`);
    lines.push(`,,,,Net Turnover (excl VAT),${summary.netTurnover.toFixed(2)}`);
    lines.push(`,,,,Expenses,${Number(expenses || 0).toFixed(2)}`);
    lines.push(`,,,,Net Profit,${summary.profit.toFixed(2)}`);
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financials_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  return (
    <Card variant="glass" className="border-primary/25">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Financial Report — SARS / CIPC
        </CardTitle>
        <CardDescription>
          Total invoiced, cash received, VAT (15%) split, and net profit for the selected period.
          Export to CSV for your accountant or attach to VAT 201 / ITR14 submissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {(["ytd", "last_year", "this_month", "last_month", "custom"] as Period[]).map((p) => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => applyPeriod(p)}>
              {p === "ytd" ? "Year to date" : p === "last_year" ? "Last year" : p === "this_month" ? "This month" : p === "last_month" ? "Last month" : "Custom"}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="fin-from">From</Label>
            <Input id="fin-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPeriod("custom"); }} />
          </div>
          <div>
            <Label htmlFor="fin-to">To</Label>
            <Input id="fin-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPeriod("custom"); }} />
          </div>
          <div>
            <Label htmlFor="fin-exp">Deductible expenses (R)</Label>
            <Input id="fin-exp" type="number" min={0} value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value) || 0)}
              placeholder="e.g. equipment, fuel, admin" />
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Total Invoiced" value={formatCurrency(summary.invoiced)} />
          <Stat label="Cash Received" value={formatCurrency(summary.received)} accent />
          <Stat label="Travel Recovered" value={formatCurrency(summary.travel)} />
          <Stat label="Discounts Given" value={formatCurrency(summary.discounts)} />
          <Stat label="VAT Portion (15%)" value={formatCurrency(summary.vatPortion)} />
          <Stat label="Net Turnover (excl VAT)" value={formatCurrency(summary.netTurnover)} />
        </div>

        <Card variant="glass" className="border-accent/40">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Estimated Net Profit (turnover − expenses)</p>
                <p className="font-display text-3xl">{formatCurrency(summary.profit)}</p>
              </div>
            </div>
            <Badge variant="outline">{rows.length} transactions</Badge>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadCsv} className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Export CSV</Button>
          <Button onClick={printReport} variant="outline" className="gap-2"><Download className="w-4 h-4" /> Print / Save PDF</Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Invoiced</th>
                <th className="px-3 py-2 text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No transactions in this period.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-3 py-2 whitespace-nowrap">{r.date?.slice(0, 10)}</td>
                  <td className="px-3 py-2">{r.client}<span className="text-xs text-muted-foreground ml-1">{r.code}</span></td>
                  <td className="px-3 py-2">{r.event_type}</td>
                  <td className="px-3 py-2"><Badge variant="outline">{r.status}</Badge></td>
                  <td className="px-3 py-2 text-right">{formatCurrency(r.total)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(r.received)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: VAT split shown at 15% for illustration. Only reflect VAT on your VAT 201 if BeatKulture Entertainment is
          registered for VAT with SARS. For CIPC AFS / SARS ITR14, use "Cash Received" as turnover and add your
          audited expenses.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card variant="glass" className={accent ? "border-accent/40" : "border-primary/20"}>
      <CardContent className="py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-display text-xl ${accent ? "text-accent" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

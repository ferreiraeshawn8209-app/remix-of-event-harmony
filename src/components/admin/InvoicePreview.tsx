import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  formatCurrency, 
  QuoteData, 
  EQUIPMENT_CATALOG,
  DJ_HOURLY_RATE,
  DEPOSIT_PERCENT,
  calculateQuote
} from "@/lib/pricing";
import { Download, Send, Music, MapPin, Calendar, Clock, User, Phone, Mail } from "lucide-react";

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteData | null;
}

export function InvoicePreview({ open, onOpenChange, quote }: InvoicePreviewProps) {
  if (!quote) return null;

  const calculations = calculateQuote(quote);
  const invoiceDate = new Date().toLocaleDateString('en-ZA');
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  const selectedEquipment = EQUIPMENT_CATALOG.filter(item => (quote.equipment[item.id] || 0) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Invoice Preview</DialogTitle>
        </DialogHeader>

        <div className="bg-card rounded-lg p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Music className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">BEATKULTURE</h2>
                <p className="text-xs text-muted-foreground">(PTY) LTD</p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Reg: 2025/533623/07</p>
              <p>Tax: 9270022289</p>
              <p>078 926 5866</p>
              <p>info@beatkulture.co.za</p>
            </div>
          </div>

          <Separator />

          {/* Invoice Info */}
          <div className="flex justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg mb-2">INVOICE</h3>
              <p className="text-sm text-muted-foreground">#{invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">Date: {invoiceDate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valid for 7 days</p>
            </div>
          </div>

          {/* Client & Event Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-primary">Client Details</h4>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2"><User className="w-3 h-3" /> {quote.clientName || "—"}</p>
                <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {quote.contactNo || "—"}</p>
                <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {quote.email || "—"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-primary">Event Details</h4>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {quote.eventDate || "—"} • {quote.eventType || "—"}</p>
                <p className="flex items-center gap-2"><Clock className="w-3 h-3" /> {quote.startTime} - {quote.endTime} ({calculations.hours.toFixed(1)} hrs)</p>
                <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {quote.venue || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-primary">Services & Equipment</h4>
            
            {/* DJ Service */}
            <div className="flex justify-between text-sm py-2 border-b border-border/50">
              <div>
                <p className="font-medium">{quote.djName}</p>
                <p className="text-xs text-muted-foreground">{calculations.hours.toFixed(1)} hours × {formatCurrency(DJ_HOURLY_RATE)}</p>
              </div>
              <p className="font-medium">{formatCurrency(calculations.djCost)}</p>
            </div>

            {/* Equipment */}
            {selectedEquipment.map(item => {
              const qty = quote.equipment[item.id];
              return (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{qty} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(qty * item.price)}</p>
                </div>
              );
            })}

            {/* Kids Corner */}
            {calculations.kidsCost > 0 && (
              <div className="flex justify-between text-sm py-2 border-b border-border/50">
                <div>
                  <p className="font-medium">Kiddies Corner</p>
                  <p className="text-xs text-muted-foreground">{quote.kidsHours} hours</p>
                </div>
                <p className="font-medium">{formatCurrency(calculations.kidsCost)}</p>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(calculations.subtotal)}</span>
            </div>
            {calculations.travelCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Travel Fee ({quote.travelDistance - 30} km extra)</span>
                <span>{formatCurrency(calculations.travelCost)}</span>
              </div>
            )}
            {calculations.discount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({quote.discountPercent}%)</span>
                <span>-{formatCurrency(calculations.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(calculations.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{DEPOSIT_PERCENT}% Booking Deposit Required</span>
              <span className="font-bold text-primary">{formatCurrency(calculations.deposit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Balance Due Before Event</span>
              <span>{formatCurrency(calculations.balance)}</span>
            </div>
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Banking Details:</p>
              <p>Bank: First National Bank</p>
              <p>Account: BEATKULTURE(PTY)LTD</p>
              <p>Account No: 63189325905</p>
              <p>Branch Code: 250655</p>
              <p className="mt-2 text-primary">Use your name as reference</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="hero" className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Send to Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

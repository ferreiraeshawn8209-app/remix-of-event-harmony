import jsPDF from "jspdf";
import { DatabaseQuote } from "@/hooks/useQuotes";
import { EQUIPMENT_CATALOG, formatCurrency } from "@/lib/pricing";

export function generateInvoicePdf(quote: DatabaseQuote) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("BEATKULTURE", 20, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Professional DJ & Entertainment", 20, y + 7);
  doc.setTextColor(0);

  // Invoice title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, y, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`#${quote.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, y + 7, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-ZA")}`, pageWidth - 20, y + 13, { align: "right" });
  doc.setTextColor(0);

  y += 28;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Bill To & Event Details side by side
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 20, y);
  doc.text("EVENT DETAILS", 110, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(quote.client_name, 20, y);
  doc.text(`Type: ${quote.event_type || "N/A"}`, 110, y);
  y += 5;
  doc.text(quote.email, 20, y);
  doc.text(`Venue: ${quote.venue || "N/A"}`, 110, y);
  y += 5;
  if (quote.contact_no) {
    doc.text(`Tel: ${quote.contact_no}`, 20, y);
  }
  doc.text(`Date: ${quote.event_date ? new Date(quote.event_date).toLocaleDateString("en-ZA") : "TBD"}`, 110, y);
  y += 5;
  doc.text(`Time: ${quote.start_time?.slice(0, 5) || ""} – ${quote.end_time?.slice(0, 5) || ""}`, 110, y);
  y += 5;
  doc.text(`DJ: ${quote.dj_name || "Not assigned"}`, 110, y);
  y += 10;

  // Table header
  doc.setDrawColor(40);
  doc.setFillColor(40, 40, 40);
  doc.rect(20, y, pageWidth - 40, 8, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DESCRIPTION", 24, y + 5.5);
  doc.text("QTY", 120, y + 5.5);
  doc.text("AMOUNT", pageWidth - 24, y + 5.5, { align: "right" });
  doc.setTextColor(0);
  y += 12;

  // Line items
  doc.setFont("helvetica", "normal");

  const addRow = (desc: string, qty: string, amount: string, highlight = false) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    if (highlight) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y - 4, pageWidth - 40, 7, "F");
    }
    doc.text(desc, 24, y);
    doc.text(qty, 120, y);
    doc.text(amount, pageWidth - 24, y, { align: "right" });
    y += 7;
  };

  // DJ Service
  addRow(`DJ Service (${quote.hours} hours)`, "1", formatCurrency(Number(quote.dj_cost)), true);

  // Equipment
  const equipment = quote.equipment || {};
  Object.entries(equipment).forEach(([eqId, qty]) => {
    if ((qty as number) > 0) {
      const item = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
      addRow(item?.name || eqId, String(qty), formatCurrency((item?.price || 0) * (qty as number)));
    }
  });

  // Kids Corner
  if (Number(quote.kids_cost) > 0) {
    addRow(`Kids Corner (${quote.kids_hours || 0} hours)`, "1", formatCurrency(Number(quote.kids_cost)), true);
  }

  y += 3;
  doc.setDrawColor(200);
  doc.line(100, y, pageWidth - 20, y);
  y += 8;

  // Totals
  const addTotal = (label: string, value: string, bold = false, color?: [number, number, number]) => {
    if (bold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    if (color) doc.setTextColor(...color);
    doc.text(label, 110, y);
    doc.text(value, pageWidth - 24, y, { align: "right" });
    doc.setTextColor(0);
    y += 6;
  };

  addTotal("Subtotal", formatCurrency(Number(quote.subtotal)));
  if (Number(quote.travel_cost) > 0) {
    addTotal(`Travel (${quote.travel_distance}km)`, formatCurrency(Number(quote.travel_cost)));
  }
  if (Number(quote.discount_amount) > 0) {
    addTotal(`Discount (${quote.discount_percent}%)`, `-${formatCurrency(Number(quote.discount_amount))}`, false, [34, 139, 34]);
  }

  y += 2;
  doc.setDrawColor(40);
  doc.line(100, y, pageWidth - 20, y);
  y += 8;

  doc.setFontSize(12);
  addTotal("TOTAL", formatCurrency(Number(quote.total)), true);
  doc.setFontSize(9);
  y += 2;
  addTotal("30% Booking Deposit", formatCurrency(Number(quote.deposit)), true, [0, 100, 200]);
  addTotal("Balance Due", formatCurrency(Number(quote.balance)));

  // Footer
  y = 270;
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("Thank you for choosing BeatKulture Entertainment!", pageWidth / 2, y, { align: "center" });
  doc.text("Payment is due within 7 days of invoice date.", pageWidth / 2, y + 4, { align: "center" });

  // Save
  const fileName = `BK-Invoice-${quote.client_name.replace(/\s+/g, "-")}-${quote.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
}

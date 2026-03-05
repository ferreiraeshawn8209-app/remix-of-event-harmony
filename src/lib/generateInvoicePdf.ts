import jsPDF from "jspdf";
import { DatabaseQuote } from "@/hooks/useQuotes";
import { EQUIPMENT_CATALOG, formatCurrency } from "@/lib/pricing";

// Helper to load logo as base64 for PDF embedding
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(new URL("@/assets/logo.png", import.meta.url).href);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Equipment lookup helper - accepts optional DB catalog
function findEquipmentName(eqId: string, catalogItems?: { id: string; name: string; price: number }[]): { name: string; price: number } {
  if (catalogItems) {
    const found = catalogItems.find(e => e.id === eqId);
    if (found) return { name: found.name, price: found.price };
  }
  const fallback = EQUIPMENT_CATALOG.find(e => e.id === eqId);
  return { name: fallback?.name || eqId, price: fallback?.price || 0 };
}

function addLetterhead(doc: jsPDF, logoBase64: string | null, title: string, quoteId: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 20, y - 5, 22, 22);
    } catch { /* fallback to text only */ }
  }

  const textX = logoBase64 ? 46 : 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BEATKULTURE ENTERTAINMENT", textX, y + 5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("One Beat. One Kulture. One Love.", textX, y + 11);
  doc.setTextColor(0);

  // Title on right
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth - 20, y + 2, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`#${quoteId.slice(0, 8).toUpperCase()}`, pageWidth - 20, y + 9, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-ZA")}`, pageWidth - 20, y + 15, { align: "right" });
  doc.setTextColor(0);

  return y + 25;
}

function addClientAndEventDetails(doc: jsPDF, quote: DatabaseQuote, y: number, clientLabel: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(clientLabel, 20, y);
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
  if (quote.contact_no) doc.text(`Tel: ${quote.contact_no}`, 20, y);
  doc.text(`Date: ${quote.event_date ? new Date(quote.event_date).toLocaleDateString("en-ZA") : "TBD"}`, 110, y);
  y += 5;
  doc.text(`Time: ${quote.start_time?.slice(0, 5) || ""} – ${quote.end_time?.slice(0, 5) || ""}`, 110, y);
  y += 5;
  doc.text(`DJ: ${quote.dj_name || "Not assigned"}`, 110, y);
  y += 10;

  return y;
}

function addLineItems(doc: jsPDF, quote: DatabaseQuote, y: number, catalogItems?: { id: string; name: string; price: number }[]) {
  const pageWidth = doc.internal.pageSize.getWidth();

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

  doc.setFont("helvetica", "normal");

  const addRow = (desc: string, qty: string, amount: string, highlight = false) => {
    if (y > 260) { doc.addPage(); y = 20; }
    if (highlight) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y - 4, pageWidth - 40, 7, "F");
    }
    doc.text(desc, 24, y);
    doc.text(qty, 120, y);
    doc.text(amount, pageWidth - 24, y, { align: "right" });
    y += 7;
  };

  addRow(`DJ Service (${quote.hours} hours)`, "1", formatCurrency(Number(quote.dj_cost)), true);

  const equipment = quote.equipment || {};
  Object.entries(equipment).forEach(([eqId, qty]) => {
    if ((qty as number) > 0) {
      const item = findEquipmentName(eqId, catalogItems);
      addRow(item.name, String(qty), formatCurrency(item.price * (qty as number)));
    }
  });

  const customItems = quote.custom_items || [];
  customItems.forEach((item) => {
    if (item.name && item.price > 0) {
      addRow(item.name, String(item.qty), formatCurrency(item.price * item.qty));
    }
  });

  if (Number(quote.kids_cost) > 0) {
    addRow(`Kids Corner (${quote.kids_hours || 0} hours)`, "1", formatCurrency(Number(quote.kids_cost)), true);
  }

  return y;
}

function addTotals(doc: jsPDF, quote: DatabaseQuote, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  y += 3;
  doc.setDrawColor(200);
  doc.line(100, y, pageWidth - 20, y);
  y += 8;

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
  if (Number(quote.travel_cost) > 0) addTotal(`Travel (${quote.travel_distance}km)`, formatCurrency(Number(quote.travel_cost)));
  if (Number(quote.discount_amount) > 0) addTotal(`Discount (${quote.discount_percent}%)`, `-${formatCurrency(Number(quote.discount_amount))}`, false, [34, 139, 34]);

  y += 2;
  doc.setDrawColor(40);
  doc.line(100, y, pageWidth - 20, y);
  y += 8;

  doc.setFontSize(12);
  addTotal("TOTAL", formatCurrency(Number(quote.total)), true);
  doc.setFontSize(9);
  y += 2;
  addTotal("30% Non-Refundable Deposit", formatCurrency(Number(quote.deposit)), true, [0, 100, 200]);
  addTotal("Remaining Balance", formatCurrency(Number(quote.balance)));

  return y;
}

function addPaymentTerms(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  y += 6;
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(200, 160, 50);
  doc.roundedRect(20, y - 3, pageWidth - 40, 22, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 80, 0);
  doc.text("PAYMENT TERMS & CONDITIONS", 24, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("1. A 30% non-refundable deposit is required to confirm and secure your booking.", 24, y + 9);
  doc.text("2. The remaining balance must be paid IN FULL before the scheduled performance begins.", 24, y + 13.5);
  doc.text("3. No performance will take place without full payment confirmation.", 24, y + 18);
  doc.setTextColor(0);

  return y;
}

function addFooter(doc: jsPDF, extraLine?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const y = 270;
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("Thank you for choosing BeatKulture Entertainment!", pageWidth / 2, y, { align: "center" });
  if (extraLine) {
    doc.text(extraLine, pageWidth / 2, y + 5, { align: "center" });
  }
}

export async function generateInvoicePdf(quote: DatabaseQuote, download = true, catalogItems?: { id: string; name: string; price: number }[]): Promise<jsPDF> {
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64();

  let y = addLetterhead(doc, logoBase64, "INVOICE", quote.id);
  y = addClientAndEventDetails(doc, quote, y, "BILL TO");
  y = addLineItems(doc, quote, y, catalogItems);
  y = addTotals(doc, quote, y);
  addPaymentTerms(doc, y);
  addFooter(doc);

  if (download) {
    const fileName = `BK-Invoice-${quote.client_name.replace(/\s+/g, "-")}-${quote.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
  }

  return doc;
}

export async function generateQuotePdf(quote: DatabaseQuote, download = true, catalogItems?: { id: string; name: string; price: number }[]): Promise<jsPDF> {
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64();

  let y = addLetterhead(doc, logoBase64, "QUOTE", quote.id);
  y = addClientAndEventDetails(doc, quote, y, "PREPARED FOR");
  y = addLineItems(doc, quote, y, catalogItems);
  y = addTotals(doc, quote, y);
  addPaymentTerms(doc, y);
  addFooter(doc, "This quote is valid for 7 days from the date of issue.");

  if (download) {
    const fileName = `BK-Quote-${quote.client_name.replace(/\s+/g, "-")}-${quote.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
  }

  return doc;
}

export function sharePdfViaWhatsApp(quote: DatabaseQuote, type: "quote" | "invoice") {
  const pdfGenerator = type === "quote" ? generateQuotePdf : generateInvoicePdf;
  pdfGenerator(quote, false).then(doc => {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `BK-${type === "quote" ? "Quote" : "Invoice"}-${quote.client_name.replace(/\s+/g, "-")}.pdf`;
    link.click();

    const message = encodeURIComponent(
      `Hi ${quote.client_name},\n\nPlease find your ${type} from BeatKulture Entertainment attached.\n\nTotal: ${formatCurrency(Number(quote.total))}\nDeposit (30%): ${formatCurrency(Number(quote.deposit))}\n\nThank you for choosing BeatKulture! 🎵`
    );
    const phone = quote.contact_no?.replace(/\s+/g, "").replace(/^\+?27/, "27") || "";
    const waUrl = phone 
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    
    window.open(waUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}

export function shareViaEmail(quote: DatabaseQuote, type: "quote" | "invoice") {
  const pdfGenerator = type === "quote" ? generateQuotePdf : generateInvoicePdf;
  pdfGenerator(quote, true);

  const subject = encodeURIComponent(`BeatKulture ${type === "quote" ? "Quote" : "Invoice"} - ${quote.client_name}`);
  const body = encodeURIComponent(
    `Hi ${quote.client_name},\n\nPlease find your ${type} from BeatKulture Entertainment attached.\n\nTotal: ${formatCurrency(Number(quote.total))}\nDeposit (30%): ${formatCurrency(Number(quote.deposit))}\n\nThank you for choosing BeatKulture!\n\nPlease download the PDF that was just saved and attach it to this email.`
  );
  
  window.open(`mailto:${quote.email}?subject=${subject}&body=${body}`, "_self");
}

import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import { DatabaseQuote } from "@/hooks/useQuotes";
import { EQUIPMENT_CATALOG, formatCurrency } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { addTermsAndConditionsPages } from "@/lib/termsAndConditions";
import { fetchBankingDetails } from "@/hooks/useBusinessSettings";

export interface CatalogItemForPdf {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  description?: string;
}

// Helper to load an image URL as base64
async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
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

// Load logo
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

// Equipment lookup helper
function findEquipmentInfo(eqId: string, catalogItems?: CatalogItemForPdf[]): CatalogItemForPdf {
  if (catalogItems) {
    const found = catalogItems.find(e => e.id === eqId);
    if (found) return found;
  }
  const fallback = EQUIPMENT_CATALOG.find(e => e.id === eqId);
  return {
    id: eqId,
    name: fallback?.name || eqId,
    price: fallback?.price || 0,
    description: fallback?.description,
  };
}

// Pre-load all equipment images needed for the PDF
async function preloadEquipmentImages(
  equipment: Record<string, number>,
  catalogItems?: CatalogItemForPdf[]
): Promise<Record<string, string>> {
  const imageMap: Record<string, string> = {};
  const promises: Promise<void>[] = [];

  for (const [eqId, qty] of Object.entries(equipment)) {
    if ((qty as number) <= 0) continue;
    const info = findEquipmentInfo(eqId, catalogItems);
    if (info.image_url) {
      promises.push(
        loadImageBase64(info.image_url).then((b64) => {
          if (b64) imageMap[eqId] = b64;
        })
      );
    }
  }

  await Promise.all(promises);
  return imageMap;
}

function addLetterhead(doc: jsPDF, logoBase64: string | null, title: string, quote: DatabaseQuote) {
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

  // Title + ref on right
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth - 20, y + 2, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`#${quote.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, y + 9, { align: "right" });
  doc.text(`Created: ${new Date(quote.created_at).toLocaleDateString("en-ZA")}`, pageWidth - 20, y + 15, { align: "right" });
  doc.text(`Printed: ${new Date().toLocaleDateString("en-ZA")}`, pageWidth - 20, y + 21, { align: "right" });
  doc.setTextColor(0);

  return y + 30;
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

function addLineItems(
  doc: jsPDF,
  quote: DatabaseQuote,
  y: number,
  catalogItems?: CatalogItemForPdf[],
  equipmentImages?: Record<string, string>
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Table header
  doc.setDrawColor(40);
  doc.setFillColor(40, 40, 40);
  doc.rect(20, y, pageWidth - 40, 8, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DESCRIPTION", 24, y + 5.5);
  doc.text("QTY", 130, y + 5.5);
  doc.text("AMOUNT", pageWidth - 24, y + 5.5, { align: "right" });
  doc.setTextColor(0);
  y += 12;

  doc.setFont("helvetica", "normal");

  const checkPage = () => {
    if (y > 255) { doc.addPage(); y = 20; }
  };

  // Simple row (no image)
  const addSimpleRow = (desc: string, qty: string, amount: string, highlight = false) => {
    checkPage();
    if (highlight) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y - 4, pageWidth - 40, 7, "F");
    }
    doc.setFontSize(9);
    doc.text(desc, 24, y);
    doc.text(qty, 130, y);
    doc.text(amount, pageWidth - 24, y, { align: "right" });
    y += 7;
  };

  // Row with image and description
  const addImageRow = (
    name: string,
    description: string,
    qty: string,
    amount: string,
    imageBase64: string | null
  ) => {
    checkPage();
    const rowHeight = 14;
    doc.setFillColor(250, 250, 250);
    doc.rect(20, y - 4, pageWidth - 40, rowHeight, "F");

    const textX = imageBase64 ? 40 : 24;

    // Image thumbnail
    if (imageBase64) {
      try {
        doc.addImage(imageBase64, "JPEG", 22, y - 3, 14, 10);
      } catch { /* skip image */ }
    }

    // Name
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(name, textX, y);

    // Description (truncated)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100);
    const maxDescWidth = 85;
    const truncDesc = doc.splitTextToSize(description || "", maxDescWidth)[0] || "";
    doc.text(truncDesc, textX, y + 5);
    doc.setTextColor(0);

    // Qty & Amount
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(qty, 130, y);
    doc.text(amount, pageWidth - 24, y, { align: "right" });

    y += rowHeight;
  };

  // DJ Service
  addSimpleRow(`DJ Service (${quote.hours} hours)`, "1", formatCurrency(Number(quote.dj_cost)), true);

  // Equipment
  const equipment = quote.equipment || {};
  Object.entries(equipment).forEach(([eqId, qty]) => {
    if ((qty as number) > 0) {
      const info = findEquipmentInfo(eqId, catalogItems);
      const imgB64 = equipmentImages?.[eqId] || null;

      if (imgB64 || info.description) {
        addImageRow(info.name, info.description || "", String(qty), formatCurrency(info.price * (qty as number)), imgB64);
      } else {
        addSimpleRow(info.name, String(qty), formatCurrency(info.price * (qty as number)));
      }
    }
  });

  // Custom items
  const customItems = quote.custom_items || [];
  customItems.forEach((item) => {
    if (item.name && item.price > 0) {
      addSimpleRow(item.name, String(item.qty), formatCurrency(item.price * item.qty));
    }
  });

  if (Number(quote.kids_cost) > 0) {
    addSimpleRow(`Kids Corner (${quote.kids_hours || 0} hours)`, "1", formatCurrency(Number(quote.kids_cost)), true);
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
    doc.setFontSize(9);
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

function addPaymentStatus(doc: jsPDF, quote: DatabaseQuote, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (y > 240) { doc.addPage(); y = 20; }

  y += 6;
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(0, 100, 200);
  const boxHeight = quote.deposit_paid ? 28 : 22;
  doc.roundedRect(20, y - 3, pageWidth - 40, boxHeight, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 80, 160);
  doc.text("PAYMENT STATUS", 24, y + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  if (quote.deposit_paid) {
    doc.setTextColor(34, 139, 34);
    doc.text(`✓ Deposit of ${formatCurrency(Number(quote.deposit))} PAID`, 24, y + 10);
    if (quote.deposit_paid_at) {
      doc.text(`  Paid on: ${new Date(quote.deposit_paid_at).toLocaleDateString("en-ZA")}`, 24, y + 15);
    }
    doc.setTextColor(200, 100, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Outstanding balance: ${formatCurrency(Number(quote.balance))}`, 24, y + 21);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Full balance must be paid before the scheduled performance begins.", 24, y + 26);
  } else {
    doc.setTextColor(200, 100, 0);
    doc.text(`⏳ Deposit of ${formatCurrency(Number(quote.deposit))} is required to confirm booking.`, 24, y + 10);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("A 30% non-refundable deposit secures your booking. No performance without full payment.", 24, y + 16);
  }

  doc.setTextColor(0);
  return y + boxHeight + 4;
}

function addPaymentTerms(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (y > 245) { doc.addPage(); y = 20; }

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

  return y + 28;
}

function addFooter(doc: jsPDF, extraLine?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const y = 275;
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("Thank you for choosing BeatKulture Entertainment!", pageWidth / 2, y, { align: "center" });
  if (extraLine) {
    doc.text(extraLine, pageWidth / 2, y + 5, { align: "center" });
  }
}

/** Try to load T&Cs PDF from storage and merge with main PDF */
async function mergeWithTermsPdf(mainPdfBytes: ArrayBuffer): Promise<Uint8Array> {
  try {
    // Try to download T&Cs PDF from storage
    const { data, error } = await supabase.storage
      .from("documents")
      .download("terms-and-conditions.pdf");

    if (error || !data) {
      // No T&Cs uploaded — return main PDF as-is
      return new Uint8Array(mainPdfBytes);
    }

    const tcBytes = await data.arrayBuffer();

    // Merge using pdf-lib
    const mainDoc = await PDFDocument.load(mainPdfBytes);
    const tcDoc = await PDFDocument.load(tcBytes);
    const copiedPages = await mainDoc.copyPages(tcDoc, tcDoc.getPageIndices());

    copiedPages.forEach((page) => mainDoc.addPage(page));

    return await mainDoc.save();
  } catch {
    // If merge fails, return original
    return new Uint8Array(mainPdfBytes);
  }
}

function getClientFileName(quote: DatabaseQuote, type: "Quote" | "Invoice"): string {
  const safeName = quote.client_name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-");
  return `BK-${type}-${safeName}-${quote.id.slice(0, 8)}.pdf`;
}

export async function generateInvoicePdf(
  quote: DatabaseQuote,
  download = true,
  catalogItems?: CatalogItemForPdf[]
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64();
  const bankDetails = await fetchBankingDetails();
  const equipmentImages = await preloadEquipmentImages(quote.equipment || {}, catalogItems);

  let y = addLetterhead(doc, logoBase64, "INVOICE", quote);
  y = addClientAndEventDetails(doc, quote, y, "BILL TO");
  y = addLineItems(doc, quote, y, catalogItems, equipmentImages);
  y = addTotals(doc, quote, y);
  y = addPaymentStatus(doc, quote, y);
  addPaymentTerms(doc, y);
  addFooter(doc);

  // Add full T&Cs as additional pages
  addTermsAndConditionsPages(doc, logoBase64, bankDetails);

  if (download) {
    // Merge with T&Cs
    const mainBytes = doc.output("arraybuffer");
    const merged = await mergeWithTermsPdf(mainBytes);
    const blob = new Blob([new Uint8Array(merged) as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getClientFileName(quote, "Invoice");
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return doc;
}

export async function generateQuotePdf(
  quote: DatabaseQuote,
  download = true,
  catalogItems?: CatalogItemForPdf[]
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64();
  const bankDetails = await fetchBankingDetails();
  const equipmentImages = await preloadEquipmentImages(quote.equipment || {}, catalogItems);

  let y = addLetterhead(doc, logoBase64, "QUOTE", quote);
  y = addClientAndEventDetails(doc, quote, y, "PREPARED FOR");
  y = addLineItems(doc, quote, y, catalogItems, equipmentImages);
  y = addTotals(doc, quote, y);
  addPaymentTerms(doc, y);
  addFooter(doc, "This quote is valid for 7 days from the date of issue.");

  // Add full T&Cs as additional pages
  addTermsAndConditionsPages(doc, logoBase64, bankDetails);

  if (download) {
    const mainBytes = doc.output("arraybuffer");
    const merged = await mergeWithTermsPdf(mainBytes);
    const blob = new Blob([new Uint8Array(merged) as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getClientFileName(quote, "Quote");
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return doc;
}

export function sharePdfViaWhatsApp(
  quote: DatabaseQuote,
  type: "quote" | "invoice",
  catalogItems?: CatalogItemForPdf[]
) {
  const pdfGenerator = type === "quote" ? generateQuotePdf : generateInvoicePdf;
  pdfGenerator(quote, false, catalogItems).then(async (doc) => {
    const mainBytes = doc.output("arraybuffer");
    const merged = await mergeWithTermsPdf(mainBytes);
    const blob = new Blob([new Uint8Array(merged) as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = getClientFileName(quote, type === "quote" ? "Quote" : "Invoice");
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

export function shareViaEmail(
  quote: DatabaseQuote,
  type: "quote" | "invoice",
  catalogItems?: CatalogItemForPdf[]
) {
  const pdfGenerator = type === "quote" ? generateQuotePdf : generateInvoicePdf;
  pdfGenerator(quote, true, catalogItems);

  const subject = encodeURIComponent(`BeatKulture ${type === "quote" ? "Quote" : "Invoice"} - ${quote.client_name}`);
  const body = encodeURIComponent(
    `Hi ${quote.client_name},\n\nPlease find your ${type} from BeatKulture Entertainment attached.\n\nTotal: ${formatCurrency(Number(quote.total))}\nDeposit (30%): ${formatCurrency(Number(quote.deposit))}\n\nThank you for choosing BeatKulture!\n\nPlease download the PDF that was just saved and attach it to this email.`
  );

  window.open(`mailto:${quote.email}?subject=${subject}&body=${body}`, "_self");
}

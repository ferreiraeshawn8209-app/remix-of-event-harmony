import jsPDF from "jspdf";

interface TCSection {
  title: string;
  clauses: string[];
}

const TC_SECTIONS: TCSection[] = [
  {
    title: "1. Booking & Deposit",
    clauses: [
      "1.1 A deposit equivalent to thirty percent (30%) of the total quoted fee is required to secure the booking.",
      "1.2 The deposit is strictly non-refundable, irrespective of any subsequent cancellation by the Client, as such funds are allocated towards outsourced equipment hire, music preparation, and administrative costs.",
      "1.3 A booking shall be deemed provisional and not binding until such time as the deposit has been received in cleared funds by BeatKulture.",
    ],
  },
  {
    title: "2. Minimum Notice and Preparation Period",
    clauses: [
      "2.1 To ensure the highest level of service and technical readiness, BeatKulture requires a minimum of seven (7) working business days' notice prior to any event date.",
      "2.2 Bookings with less than seven (7) working days' notice (based on cleared deposit funds) are subject to equipment availability and may result in limited setup options or reduced production quality.",
      "2.3 BeatKulture shall not be held liable for any limitations caused by insufficient preparation time due to late payment or short notice.",
    ],
  },
  {
    title: "3. Payment Terms",
    clauses: [
      "3.1 The outstanding balance of the total quoted fee shall be payable in full and must be received as cleared and immediately available funds prior to commencement of the event.",
      "3.2 BeatKulture shall not commence performance or provide any services until full and final payment has been received.",
    ],
  },
  {
    title: "4. Force Majeure & Safety",
    clauses: [
      "BeatKulture will not be held liable for non-performance due to circumstances beyond its control (including but not limited to power failure, extreme weather, civil unrest, or venue restrictions).",
      "We reserve the right to halt or adjust performance if the safety of guests, staff, or equipment is at risk.",
    ],
  },
  {
    title: "5. Performance Conditions",
    clauses: [
      "5.1 The Client shall ensure the venue provides a safe and suitable performance area, including adequate electrical supply. For outdoor performances, the Client shall provide suitable cover to protect equipment from rain, wind, or other adverse weather.",
      "5.2 BeatKulture reserves the right to suspend or terminate performance where conditions are unsafe, where equipment is at risk, or where guest conduct places personnel at risk.",
    ],
  },
  {
    title: "6. Equipment & Liability",
    clauses: [
      "6.1 All sound and lighting equipment is supplied under BeatKulture's supervision and may be outsourced from third-party suppliers.",
      "6.2 The Client shall be liable for any loss of or damage to equipment caused by guests, venue staff, or third parties during the event.",
    ],
  },
  {
    title: "7. Music Requests & Performance Policy",
    clauses: [
      "7.1 The Client may provide music requests in advance. BeatKulture may also provide QR-code-based live request features if included in the package.",
      "7.2 Final discretion regarding track selection, mixing, and performance style rests exclusively with the DJ.",
    ],
  },
  {
    title: "8. Limitation of Liability & Waiver",
    clauses: [
      "8.1 BeatKulture shall exercise reasonable care in providing its services. Liability for direct, indirect, or consequential loss, damage, or injury arising from performance or equipment failure is expressly excluded, except where caused by proven gross negligence or willful misconduct.",
      "8.2 The Client acknowledges and agrees that BeatKulture shall not be liable for:\n• Event cancellations or disruptions due to acts of God, power outages, strikes, or venue/authority restrictions;\n• Damage to property or injury to persons resulting from the actions, negligence, or misconduct of guests or third parties.",
      "8.3 By engaging BeatKulture, the Client expressly waives any and all claims against BeatKulture, its representatives, contractors, or suppliers for losses, damages, or injuries sustained during or arising out of the event, except where caused directly by BeatKulture's proven negligence.",
    ],
  },
  {
    title: "9. Acceptance",
    clauses: [
      "9.1 By effecting payment of the deposit, the Client confirms that they have read, understood, and agreed to these Terms and Conditions in their entirety.",
    ],
  },
  {
    title: "10. Quote Validity",
    clauses: [
      "10.1 All quotations provided by BeatKulture are valid for a period of seven (7) calendar days from the date of issue, unless otherwise stated in writing.",
      "10.2 BeatKulture reserves the right to revise or withdraw the quotation after the expiry of this period.",
      "10.3 The quote validity period does not affect the minimum notice and preparation requirements, which remain applicable once the deposit is cleared.",
    ],
  },
  {
    title: "11. Performance Time, Cut-Off & Overtime",
    clauses: [
      "11.1 Standard Performance Cut-Off — Unless otherwise agreed in writing, performance time is scheduled from the agreed start time until 12:00 midnight.",
      "11.2 Overtime After Midnight — Any performance time requested after 12:00 midnight will be regarded as overtime and will be charged per hour or part thereof at a rate of 1.5× (one and a half times) the quoted hourly service rate applicable to the event.",
      "11.3 Payment for Overtime During the Event — Any request to continue performing beyond the agreed end time must be approved and paid for immediately IN CASH OR INSTANT EFT before the additional performance time begins. The DJ reserves the right to decline or discontinue performance should overtime payment not be received at the time of request.",
      "11.4 Pre-Arranged Overtime — If additional time beyond the agreed end time is anticipated prior to the event, such overtime may be arranged in advance and will be added.",
    ],
  },
  {
    title: "12. Equipment Condition & Responsibility",
    clauses: [
      "12.1 Condition of Equipment — The Client acknowledges and agrees that all equipment supplied by BeatKulture is delivered, installed, and tested in good working order and in sound, clean, and undamaged condition at the commencement of the event. By allowing the event to proceed, the Client confirms acceptance that the equipment was received in satisfactory condition.",
      "12.2 Responsibility & Care — From the time of setup until collection, the Client accepts full responsibility for the safekeeping and proper use of the equipment. This includes responsibility for any loss, theft, damage, or misuse caused by guests, venue staff, children, intoxicated persons, weather, liquids, power issues, or any third party.",
      "12.3 Return Condition — All equipment must be returned in the same condition as received, fair wear and tear excepted. Any damage, loss, or repair required as a result of negligence, misuse, or accidental damage will be billed to the Client at repair or replacement value.",
      "12.4 Pre-Existing Damage — BeatKulture shall not be held responsible for claims alleging pre-existing damage unless such damage is reported in writing before or immediately upon setup and acknowledged by BeatKulture.",
    ],
  },
  {
    title: "13. No Interference Clause",
    clauses: [
      "No person other than BeatKulture or its authorised representatives may handle, adjust, move, or operate ANY EQUIPMENT unless expressly permitted. Any unauthorised interference resulting in damage will be the Client's responsibility.",
    ],
  },
];

const TRAVEL_NOTE =
  "Travel Costs: The following costs are not included in the package price and will be calculated separately at R7.50 per kilometre: Venue inspection (optional at the request of the client), DJ travel (should the travel distance be outside a 30km radius measured from Hatfield Square, Pretoria, serving as base point). Accommodation for DJs may also be required, depending on the event location and finishing time.";

const BANK_DETAILS = [
  "Bank: First National Bank",
  "Account: BEATKULTURE (PTY) LTD",
  "Account No: 63189325905",
  "Branch Code: 250655",
  "Account Type: Current Account",
  "Please use your name as reference.",
];

/**
 * Adds the full BeatKulture Terms & Conditions as new pages in the PDF.
 */
export function addTermsAndConditionsPages(doc: jsPDF, logoBase64: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const bottomMargin = 20;

  let y = 0;

  const newPage = () => {
    doc.addPage();
    y = 20;
    // Light header line
    doc.setDrawColor(200);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("BEATKULTURE ENTERTAINMENT — Terms & Conditions", marginLeft, y);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginRight, y, { align: "right" });
    doc.setTextColor(0);
    y += 8;
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - bottomMargin) {
      newPage();
    }
  };

  // First T&C page
  doc.addPage();
  y = 15;

  // Logo + header
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", marginLeft, y - 3, 18, 18);
    } catch { /* skip */ }
  }

  const headerX = logoBase64 ? marginLeft + 22 : marginLeft;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BEATKULTURE ENTERTAINMENT", headerX, y + 5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Company Reg No: 2025/533623/07  |  Tax Ref: 9270022289", headerX, y + 11);
  doc.text("Email: info@beatkulture.co.za  |  Contact: 078 926 5866  |  www.beatkulture.co.za", headerX, y + 16);
  doc.setTextColor(0);
  y += 26;

  // Title
  doc.setDrawColor(40);
  doc.setFillColor(40, 40, 40);
  doc.rect(marginLeft, y, contentWidth, 10, "F");
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TERMS & CONDITIONS", pageWidth / 2, y + 7, { align: "center" });
  doc.setTextColor(0);
  y += 16;

  // Preamble
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80);
  const preamble = doc.splitTextToSize(
    'This Quotation together with the Terms & Conditions set out below shall constitute a binding agreement between BeatKulture ("the Service Provider") and the undersigned client ("the Client"). This quote is valid for 7 days.',
    contentWidth
  );
  doc.text(preamble, marginLeft, y);
  y += preamble.length * 4 + 4;
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  // Travel note box
  checkPage(20);
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(200, 160, 50);
  const travelLines = doc.splitTextToSize(TRAVEL_NOTE, contentWidth - 8);
  const travelBoxH = travelLines.length * 3.5 + 8;
  doc.roundedRect(marginLeft, y, contentWidth, travelBoxH, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 70, 0);
  doc.text(travelLines, marginLeft + 4, y + 5);
  doc.setTextColor(0);
  y += travelBoxH + 6;

  // Sections
  for (const section of TC_SECTIONS) {
    checkPage(14);

    // Section title
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    doc.text(section.title, marginLeft, y);
    y += 5;

    // Clauses
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(50);

    for (const clause of section.clauses) {
      const lines = doc.splitTextToSize(clause, contentWidth - 4);
      const blockHeight = lines.length * 3.5;
      checkPage(blockHeight + 2);
      doc.text(lines, marginLeft + 2, y);
      y += blockHeight + 2;
    }

    y += 3;
  }

  // Bank details box
  checkPage(35);
  y += 4;
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(0, 100, 200);
  doc.roundedRect(marginLeft, y, contentWidth, 32, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 80, 160);
  doc.text("BANKING DETAILS", marginLeft + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30);
  BANK_DETAILS.forEach((line, i) => {
    doc.text(line, marginLeft + 4, y + 12 + i * 4);
  });
  doc.setTextColor(0);
}

import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";

const sections = [
  [
    "Booking Confirmation and Deposits",
    [
      "A minimum deposit of 35% of the agreed booking value is required to secure DJ entertainment, sound, lighting or other event services, unless otherwise agreed in writing.",
      "Clients may pay more than the minimum deposit or settle the full booking amount. Payment reserves the agreed event date and allows booking arrangements to begin."
    ]
  ],
  [
    "Deposit Refunds",
    [
      "Deposits secure availability and may cover reasonable booking commitments, administration and preparation expenses.",
      "If a client cancels, any cancellation charge will be fair and reasonable under applicable South African consumer protection law. Any amount paid exceeding lawful charges and other legitimately due amounts will be refunded."
    ]
  ],
  [
    "Client Cancellations",
    [
      "Please send cancellation requests in writing to info@beatkulture.co.za.",
      "Reasonable cancellation charges may consider notice given, work already performed, committed personnel or suppliers, and the likelihood of finding a replacement booking.",
      "No cancellation fee will be charged where prohibited by law, including qualifying death or hospitalisation circumstances under section 17 of the Consumer Protection Act."
    ]
  ],
  [
    "Postponements and Date Changes",
    [
      "Requests to reschedule must be made in writing. We will make reasonable efforts to accommodate changes subject to availability.",
      "Payments may be transferred to an agreed new date, subject to reasonable additional costs and legal requirements. New dates are confirmed only in writing."
    ]
  ],
  [
    "Cancellations by BeatKulture Entertainment",
    [
      "If we cannot fulfil a booking, we will notify you as soon as reasonably possible and may offer an alternative provider or date subject to your agreement.",
      "If the agreed services cannot be supplied, refunds and other applicable remedies will be provided as required by South African law."
    ]
  ],
  [
    "Full Payments and Promotional Discounts",
    [
      "Qualifying bookings paid in full upfront may receive a 5% discount where specified in the agreed quotation.",
      "Paying in full does not remove statutory cancellation or refund rights. Refunds are based on amounts actually paid, lawful cancellation charges and the confirmed agreement."
    ]
  ],
  [
    "Third-Party Suppliers and Event Planning",
    [
      "Some venue, catering, event planning and specialist equipment services are sourced through independent third parties. Applicable supplier cancellation charges must be disclosed where relevant, reasonable and legally permissible.",
      "BeatKulture Entertainment does not own or operate sourced venues."
    ]
  ],
  [
    "Refund Processing",
    [
      "Approved refunds will be processed through the original payment method where reasonably possible, including Paystack or another authorised payment provider.",
      "Refunds will be initiated within 10 business days of approval unless a shorter statutory deadline applies. Bank or provider processing times may vary."
    ]
  ],
  [
    "Consumer Protection",
    [
      "This policy is subject to applicable laws of the Republic of South Africa, including the Consumer Protection Act 68 of 2008 and, where applicable, the Electronic Communications and Transactions Act 25 of 2002.",
      "Nothing in this policy excludes or overrides statutory consumer rights."
    ]
  ],
  [
    "Contact",
    [
      "For refund requests or cancellations, email info@beatkulture.co.za with your booking reference, event date, contact details and reason for your request."
    ]
  ]
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to BeatKulture Entertainment</Link>
        <h1 className="mt-8 font-display text-3xl font-bold md:text-5xl">Refund &amp; Cancellation Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">Effective 9 October 2026</p>
        <p className="mt-5 leading-7 text-muted-foreground"><strong className="text-foreground">BeatKulture Pty Limited</strong>, trading as BeatKulture Entertainment</p>
        <div className="mt-10 space-y-9">
          {sections.map(([heading, paragraphs], index) => (
            <section key={heading}>
              <h2 className="mb-3 font-display text-xl font-semibold">{index + 1}. {heading}</h2>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">Website: <a className="text-primary hover:underline" href="https://www.beatkulture.co.za">www.beatkulture.co.za</a></p>
      </main>
      <Footer />
    </div>
  );
}

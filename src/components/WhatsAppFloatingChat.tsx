import { useState } from "react";
import { MessageCircle, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useLocation } from "react-router-dom";

// Format: strip anything that isn't a digit — wa.me needs the plain E.164 number without `+`.
function toWaNumber(raw: string): string {
  return (raw || "").replace(/[^\d]/g, "");
}

const DEFAULT_INTRO = "Hi! I'd like some help with my event 🎉";

export default function WhatsAppFloatingChat() {
  const [open, setOpen] = useState(false);
  const { get } = useBusinessSettings();
  const location = useLocation();

  // Hide on song-request / DJ queue kiosk pages
  if (/^\/(request|dj-queue)\b/.test(location.pathname)) return null;

  // Consultant phone numbers (E.164 with country code) — stored in business_settings
  const primary = toWaNumber(get("whatsapp_consultant_1") || get("business_whatsapp") || "27655285528");
  const secondary = toWaNumber(get("whatsapp_consultant_2") || "");
  const groupUrl = get("whatsapp_group_url") || ""; // optional invite link so both consultants see one thread
  const intro = get("whatsapp_intro_message") || DEFAULT_INTRO;
  const encoded = encodeURIComponent(intro);

  const primaryHref = `https://wa.me/${primary}?text=${encoded}`;
  const secondaryHref = secondary ? `https://wa.me/${secondary}?text=${encoded}` : "";

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2 pointer-events-none">
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="pointer-events-auto hidden sm:block rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-md border border-border/60"
            >
              Need to chat? <span className="text-primary font-semibold">Chat live</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close WhatsApp chat" : "Open WhatsApp chat"}
          className="pointer-events-auto relative flex items-center justify-center h-14 w-14 rounded-full shadow-[0_0_28px_hsl(140_70%_45%/0.55)] bg-[#25D366] text-white hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
          {!open && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-[70] w-[min(92vw,340px)] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] px-4 py-3 text-white">
              <p className="text-sm font-bold">BeatKulture Live Support</p>
              <p className="text-[11px] opacity-90">Usually replies within minutes</p>
            </div>

            {/* Simulated first message */}
            <div className="p-4 space-y-3 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect fill=%22%23ece5dd%22 width=%2240%22 height=%2240%22/></svg>')]">
              <div className="max-w-[85%] bg-white text-gray-800 rounded-lg rounded-tl-none px-3 py-2 text-sm shadow">
                Hi 👋 how can we help you?
                <div className="text-[10px] text-gray-500 mt-1 text-right">BeatKulture • now</div>
              </div>

              <p className="text-[11px] text-center text-muted-foreground pt-1">
                Your message reaches <span className="font-semibold text-foreground">both consultants</span> so you get help fast.
              </p>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2 border-t border-border/60 bg-background">
              {groupUrl ? (
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-sm py-2.5 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Users className="w-4 h-4" /> Chat with our team
                </a>
              ) : (
                <>
                  <a
                    href={primaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-sm py-2.5 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <MessageCircle className="w-4 h-4" /> Chat with Consultant 1
                  </a>
                  {secondaryHref && (
                    <a
                      href={secondaryHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-semibold text-sm py-2.5 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <MessageCircle className="w-4 h-4" /> Chat with Consultant 2
                    </a>
                  )}
                </>
              )}
              <p className="text-[10px] text-center text-muted-foreground pt-1">
                Opens in WhatsApp. Standard messaging rates apply.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

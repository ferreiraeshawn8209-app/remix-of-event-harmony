import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useQuoteMessages } from "@/hooks/useQuoteMessages";
import { cn } from "@/lib/utils";
import { useBrandingLogo } from "@/hooks/useBranding";

interface Props {
  quoteId: string;
  role: "client" | "admin";
  senderName: string;
  className?: string;
}

export function QuoteMessageThread({ quoteId, role, senderName, className }: Props) {
  const { messages, isLoading, send, sending } = useQuoteMessages(quoteId);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const logoImg = useBrandingLogo();
  const configuredBase = import.meta.env.BASE_URL || "/";
  const appAuthUrl = `${window.location.origin}${configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`}auth`;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    await send({ message: draft, sender_role: role, sender_name: senderName });
    setDraft("");
  };

  const insertClientAccessLink = () => {
    const template = `Client portal access: ${appAuthUrl}`;
    setDraft((prev) => (prev.trim() ? `${prev.trim()}\n${template}` : template));
  };

  const isAppAccessLink = (message: string) => {
    return message.includes(appAuthUrl);
  };

  return (
    <Card variant="glass" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4 text-primary" /> Quote Conversation
        </CardTitle>
        <CardDescription className="text-xs">
          Discuss changes with {role === "client" ? "BeatKulture" : "the client"} before accepting the quote.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No messages yet. Start the conversation below.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_role === role;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={m.sender_role === "admin" ? "default" : "secondary"} className="text-[10px] py-0 px-1.5">
                        {m.sender_role === "admin" ? "BeatKulture" : m.sender_name}
                      </Badge>
                      <span className={cn("text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(m.created_at).toLocaleString("en-ZA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    {isAppAccessLink(m.message) && (
                      <div
                        className={cn(
                          "mt-2 rounded-md border p-2.5",
                          mine ? "border-primary-foreground/30 bg-primary-foreground/10" : "border-primary/25 bg-primary/10"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img src={logoImg} alt="BeatKulture" className="w-6 h-6 object-contain rounded-sm bg-background/70 p-0.5" />
                          <span className={cn("text-xs font-semibold", mine ? "text-primary-foreground" : "text-foreground")}>
                            BeatKulture Client Portal
                          </span>
                        </div>
                        <a
                          href={appAuthUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 border",
                            mine
                              ? "border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                              : "border-primary/40 text-primary hover:bg-primary/10"
                          )}
                        >
                          Open Client App <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="space-y-2">
          <Textarea
            rows={2}
            placeholder={role === "client" ? "Ask a question or request changes…" : "Reply to the client…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex justify-end">
            {role === "admin" && (
              <Button size="sm" variant="outline" onClick={insertClientAccessLink} className="mr-2">
                <LinkIcon className="w-4 h-4 mr-2" />
                Insert App Link
              </Button>
            )}
            <Button size="sm" variant="hero" disabled={sending || !draft.trim()} onClick={handleSend}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

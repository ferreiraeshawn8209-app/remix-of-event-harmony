import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, User, FileText, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  id: string;
  source: "notification" | "access" | "message";
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

function sourceColor(source: AuditEntry["source"]) {
  if (source === "notification") return "bg-primary/20 text-primary border-primary/30";
  if (source === "access") return "bg-secondary/20 text-secondary border-secondary/30";
  return "bg-muted text-muted-foreground";
}

function sourceIcon(source: AuditEntry["source"]) {
  if (source === "notification") return Bell;
  if (source === "access") return User;
  return FileText;
}

export function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const results: AuditEntry[] = [];

      // Admin notifications as audit trail
      const { data: notifs } = await supabase
        .from("admin_notifications")
        .select("id, type, title, message, created_at, email")
        .order("created_at", { ascending: false })
        .limit(30);

      (notifs || []).forEach((n) => {
        results.push({
          id: `notif-${n.id}`,
          source: "notification",
          timestamp: n.created_at,
          actor: n.email || "System",
          action: n.title || n.type,
          detail: n.message || "",
        });
      });

      // Client portal access logs
      const { data: logs } = await supabase
        .from("client_access_logs")
        .select("id, email, client_code, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      (logs || []).forEach((l) => {
        results.push({
          id: `access-${l.id}`,
          source: "access",
          timestamp: l.created_at,
          actor: l.email || l.client_code || "Client",
          action: "Portal visit",
          detail: `Client ${l.client_code || ""} accessed their portal`,
        });
      });

      // Quote messages for client actions
      const { data: msgs } = await supabase
        .from("quote_messages")
        .select("id, sender_name, sender_role, type, content, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      (msgs || []).forEach((m) => {
        const actionLabel =
          m.type === "approval_approved" ? "Quote accepted" :
          m.type === "approval_changes_requested" ? "Changes requested" :
          m.type === "approval_pending" ? "Approval pending" :
          "Message sent";
        results.push({
          id: `msg-${m.id}`,
          source: "message",
          timestamp: m.created_at,
          actor: m.sender_name || (m.sender_role === "admin" ? "Admin" : "Client"),
          action: actionLabel,
          detail: (m.content || "").slice(0, 120),
        });
      });

      // Sort by newest first
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEntries(results.slice(0, 60));
      setLoading(false);
    })();
  }, []);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Permanent record of admin and client actions — portal visits, quote activity, notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No audit entries yet.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {entries.map((entry) => {
              const Icon = sourceIcon(entry.source);
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2 text-sm"
                >
                  <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${sourceColor(entry.source)}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{entry.actor}</span>
                      <Badge variant="outline" className={`text-[10px] ${sourceColor(entry.source)}`}>
                        {entry.action}
                      </Badge>
                    </div>
                    {entry.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.detail}</p>
                    )}
                  </div>
                  <time className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {new Date(entry.timestamp).toLocaleString("en-ZA", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

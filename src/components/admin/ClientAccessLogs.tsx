import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";

interface AccessLog {
  id: string;
  email: string;
  client_code: string;
  created_at: string;
  user_agent: string | null;
}

export function ClientAccessLogs({ email, clientCode }: { email?: string; clientCode?: string }) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let query = supabase
        .from("client_access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (email) query = query.eq("email", email);
      if (clientCode) query = query.eq("client_code", clientCode);

      const { data } = await query;
      setLogs((data as AccessLog[]) || []);
      setLoading(false);
    })();
  }, [email, clientCode]);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;

  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-2">No portal visits yet</p>;
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{new Date(log.created_at).toLocaleString("en-ZA")}</span>
          <Badge variant="outline" className="text-[10px] font-mono">{log.client_code}</Badge>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground pt-1">{logs.length} visit(s) recorded</p>
    </div>
  );
}

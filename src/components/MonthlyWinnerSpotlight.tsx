import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Winner {
  id: string;
  month_label: string;
  winner_name: string;
  prize: string | null;
  message: string | null;
  photo_url: string | null;
}

export function MonthlyWinnerSpotlight() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("competition_winners" as any)
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(3);
      setWinners(((data as unknown) as Winner[]) || []);
    })();
  }, []);

  if (winners.length === 0) return null;
  const top = winners[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold uppercase tracking-widest gradient-text">This Month's Winner</h3>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="overflow-hidden border-warning/40">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center">
            {top.photo_url ? (
              <img src={top.photo_url} alt={top.winner_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-warning/50" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-warning" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{top.month_label}</p>
              <p className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-primary" /> {top.winner_name}
              </p>
              {top.prize && <p className="text-sm text-primary mt-1">🎁 {top.prize}</p>}
              {top.message && <p className="text-sm text-muted-foreground mt-2 italic">"{top.message}"</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {winners.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {winners.slice(1).map((w) => (
            <Card key={w.id} variant="glass" className="border-warning/20">
              <CardContent className="p-3 flex items-center gap-2">
                {w.photo_url ? (
                  <img src={w.photo_url} alt={w.winner_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <Trophy className="w-6 h-6 text-warning" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{w.month_label}</p>
                  <p className="text-sm font-semibold truncate">{w.winner_name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

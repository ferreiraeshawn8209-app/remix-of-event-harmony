import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Shield } from "lucide-react";

type AdminRow = {
  user_id: string;
  created_at: string;
  email: string;
  full_name: string;
};

export function AdminAccountsTab() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const adminsQuery = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: async (): Promise<AdminRow[]> => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      const userIds = Array.from(new Set((roles || []).map((r) => r.user_id)));
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileByUserId = new Map((profiles || []).map((p) => [p.user_id, p]));

      return (roles || []).map((r) => {
        const p = profileByUserId.get(r.user_id);
        return {
          user_id: r.user_id,
          created_at: r.created_at,
          email: p?.email || "(no profile yet)",
          full_name: p?.full_name || "Unknown",
        };
      });
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (!cleanEmail) throw new Error("Please enter an email address");

      // Find the user via profiles table
      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .ilike("email", cleanEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!targetProfile) {
        throw new Error(
          "No profile found for that email. Ask the user to sign up and sign in once first, then try again."
        );
      }

      const { data: existingRole, error: existingRoleError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", targetProfile.user_id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (existingRoleError) throw existingRoleError;
      if (existingRole) return;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: targetProfile.user_id, role: "admin" });

      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["admin-accounts"] });
      toast({
        title: "Admin added",
        description: "The account now has admin access.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Could not add admin",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const adminsSorted = useMemo(() => {
    const rows = adminsQuery.data || [];
    return [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [adminsQuery.data]);

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            Promote an existing account to admin by email (the user must have signed in once so a profile exists).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              inputMode="email"
            />
            <Button
              variant="hero"
              onClick={() => addAdminMutation.mutate(email)}
              disabled={addAdminMutation.isPending}
            >
              {addAdminMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add admin
                </>
              )}
            </Button>
          </div>

          <Separator />

          {adminsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading admins…
            </div>
          ) : adminsSorted.length === 0 ? (
            <div className="text-sm text-muted-foreground">No admin accounts found.</div>
          ) : (
            <div className="space-y-2">
              {adminsSorted.map((a) => (
                <div
                  key={a.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <div className="font-medium">{a.full_name}</div>
                    <div className="text-sm text-muted-foreground">{a.email}</div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

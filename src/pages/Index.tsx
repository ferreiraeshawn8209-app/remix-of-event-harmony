import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Root route is gated: visitors must sign in / sign up first.
 * - Not authenticated  → /auth
 * - Admin              → /admin
 * - Client             → /client
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    // Wait for profile to resolve so we know if they're admin
    if (!profile) return;
    navigate(isAdmin ? "/admin" : "/client", { replace: true });
  }, [user, profile, isAdmin, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;

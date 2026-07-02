import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hydrationRequestRef = useRef(0);

  const hydrateAuthState = async (currentSession: Session | null, deferProfileFetch = false) => {
    const requestId = ++hydrationRequestRef.current;

    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    const finishHydration = () => {
      if (hydrationRequestRef.current === requestId) {
        setIsLoading(false);
      }
    };

    if (!currentSession?.user) {
      setProfile(null);
      setIsAdmin(false);
      finishHydration();
      return;
    }

    const runProfileFetch = async () => {
      try {
        await fetchProfile(currentSession.user);
      } catch (error) {
        console.error("Error hydrating auth state:", error);
      } finally {
        finishHydration();
      }
    };

    if (deferProfileFetch) {
      setTimeout(() => {
        void runProfileFetch();
      }, 0);
      return;
    }

    await runProfileFetch();
  };

  const clearLocalAuthState = async () => {
    try {
      // Clear local session to recover from corrupted/invalid refresh tokens
      // (prevents the app from getting stuck on a blank screen)
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      // As a last resort, nuke any Supabase auth tokens in localStorage
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // ignore
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const ensureProfileExists = async (u: User) => {
    // Some projects can end up without profile rows (e.g. after earlier schema/config changes).
    // We self-heal by creating the profile on first login.
    const userId = u.id;
    const email = u.email || "";
    const meta = (u.user_metadata || {}) as Record<string, unknown>;
    const fullNameRaw =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (email ? email.split("@")[0] : "User");
    const phoneRaw = typeof meta.phone === "string" ? meta.phone : null;

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If multiple rows exist, .limit(1) prevents the "multiple rows" error.
    if (existingError) {
      console.error("Error fetching profile:", existingError);
      return existing;
    }

    if (existing) return existing;

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: fullNameRaw,
        email,
        phone: phoneRaw,
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return null;
    }

    return created;
  };

  const fetchProfile = async (u: User) => {
    try {
      const profileData = await ensureProfileExists(u);
      setProfile(profileData);

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error("Error checking admin role:", roleError);
        return;
      }

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setIsLoading(true);

        void hydrateAuthState(currentSession, true);
      }
    );

    // THEN get the initial session
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // Common when a refresh token was revoked or missing.
          if ((error as any)?.code === "refresh_token_not_found") {
            await clearLocalAuthState();
            toast({
              title: "Session expired",
              description: "Please sign in again.",
              variant: "destructive",
            });
          } else {
            console.error("Error getting session:", error);
          }
          return;
        }

        await hydrateAuthState(data.session);
      } catch (e: any) {
        const code = e?.code;
        if (code === "refresh_token_not_found") {
          await clearLocalAuthState();
          toast({
            title: "Session expired",
            description: "Please sign in again.",
            variant: "destructive",
          });
        } else {
          console.error("Error initializing auth:", e);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const configuredBase = import.meta.env.BASE_URL || "/";
      const normalizedConfiguredBase = configuredBase.endsWith("/")
        ? configuredBase.slice(0, -1)
        : configuredBase;
      const runtimeBase =
        normalizedConfiguredBase &&
        normalizedConfiguredBase !== "/" &&
        (window.location.pathname === normalizedConfiguredBase ||
          window.location.pathname.startsWith(`${normalizedConfiguredBase}/`))
          ? configuredBase
          : "/";

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${runtimeBase}auth`,
          data: {
            full_name: fullName,
            phone: phone || null,
          },
        },
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

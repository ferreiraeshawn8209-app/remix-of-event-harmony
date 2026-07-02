import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
  event_type: string | null;
  event_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  start_time: string | null;
  end_time: string | null;
  guest_count: number | null;
  event_setting: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventProfileInput {
  eventType: string;
  eventDate: string;
  venueName: string;
  venueAddress: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventSetting: "indoor" | "outdoor";
  city: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    eventProfile?: EventProfileInput
  ) => Promise<{ error: Error | null }>;
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
  const pendingAuthEventRef = useRef<"signup" | "signin" | null>(null);
  const lastNotifiedAccessTokenRef = useRef<string | null>(null);
  const notificationRetryTimerRef = useRef<number | null>(null);

  const notifyAdminAuthEvent = useCallback(async (eventType: "signup" | "signin") => {
    const invoke = async () => {
      const { error } = await supabase.rpc("notify_admin_on_app_auth", { _event: eventType });
      return !error;
    };

    let succeeded = await invoke();
    if (succeeded) return;

    if (notificationRetryTimerRef.current) {
      window.clearTimeout(notificationRetryTimerRef.current);
    }

    let attempt = 0;
    const maxAttempts = 3;
    const retry = () => {
      notificationRetryTimerRef.current = window.setTimeout(async () => {
        attempt += 1;
        succeeded = await invoke();
        if (!succeeded && attempt < maxAttempts) {
          retry();
        }
      }, 1200 * attempt + 1200);
    };
    retry();
  }, []);

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
    const baseProfilePayload = {
      user_id: userId,
      full_name: fullNameRaw,
      email,
      phone: phoneRaw,
    };
    const eventProfile = {
      event_type: typeof meta.event_type === "string" ? meta.event_type : null,
      event_date: typeof meta.event_date === "string" ? meta.event_date : null,
      venue_name: typeof meta.venue_name === "string" ? meta.venue_name : null,
      venue_address: typeof meta.venue_address === "string" ? meta.venue_address : null,
      start_time: typeof meta.start_time === "string" ? meta.start_time : null,
      end_time: typeof meta.end_time === "string" ? meta.end_time : null,
      guest_count:
        typeof meta.guest_count === "number"
          ? meta.guest_count
          : typeof meta.guest_count === "string" && meta.guest_count
            ? Number(meta.guest_count)
            : null,
      event_setting: typeof meta.event_setting === "string" ? meta.event_setting : null,
      city: typeof meta.city === "string" ? meta.city : null,
    };

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

    if (existing) {
      const profileNeedsBackfill = [
        ["event_type", eventProfile.event_type],
        ["event_date", eventProfile.event_date],
        ["venue_name", eventProfile.venue_name],
        ["venue_address", eventProfile.venue_address],
        ["start_time", eventProfile.start_time],
        ["end_time", eventProfile.end_time],
        ["guest_count", eventProfile.guest_count],
        ["event_setting", eventProfile.event_setting],
        ["city", eventProfile.city],
      ].some(([key, value]) => !existing[key as keyof typeof existing] && value);

      if (!profileNeedsBackfill) return existing;

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: existing.full_name || fullNameRaw,
          email: existing.email || email,
          phone: existing.phone || phoneRaw,
          ...eventProfile,
        } as any)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Error backfilling profile:", updateError);
        return existing;
      }

      return updated;
    }

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        ...baseProfilePayload,
        ...eventProfile,
      } as any)
      .select("*")
      .single();

    if (!createError) {
      return created;
    }

    console.error("Error creating profile with event fields, retrying base profile:", createError);

    const { data: fallbackCreated, error: fallbackCreateError } = await supabase
      .from("profiles")
      .insert(baseProfilePayload as any)
      .select("*")
      .single();

    if (fallbackCreateError) {
      console.error("Error creating fallback profile:", fallbackCreateError);
      return null;
    }

    return fallbackCreated;
  };

 const fetchProfile = async (u: User) => {
  try {
    console.log("FETCH PROFILE START", u.id);

    const profileData = await ensureProfileExists(u);

    console.log("PROFILE RESULT:", profileData);

    setProfile(profileData);

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    console.log("ROLE RESULT:", roleData);
    console.log("ROLE ERROR:", roleError);

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(!!roleData);

    console.log("FETCH PROFILE COMPLETE");
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
      (event, currentSession) => {
        if (event === "SIGNED_IN" && currentSession?.access_token) {
          const isNewSessionToken = lastNotifiedAccessTokenRef.current !== currentSession.access_token;
          if (isNewSessionToken) {
            lastNotifiedAccessTokenRef.current = currentSession.access_token;
            const authEvent = pendingAuthEventRef.current ?? "signin";
            pendingAuthEventRef.current = null;
            void notifyAdminAuthEvent(authEvent);
          }
        }

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

    return () => {
      subscription.unsubscribe();
      if (notificationRetryTimerRef.current) {
        window.clearTimeout(notificationRetryTimerRef.current);
      }
    };
  }, [notifyAdminAuthEvent]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    eventProfile?: EventProfileInput
  ) => {
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
            event_type: eventProfile?.eventType || null,
            event_date: eventProfile?.eventDate || null,
            venue_name: eventProfile?.venueName || null,
            venue_address: eventProfile?.venueAddress || null,
            start_time: eventProfile?.startTime || null,
            end_time: eventProfile?.endTime || null,
            guest_count: eventProfile?.guestCount ?? null,
            event_setting: eventProfile?.eventSetting || null,
            city: eventProfile?.city || null,
          },
        },
      });

      if (!error) {
        pendingAuthEventRef.current = "signup";
      }

      if (error) return { error };

      return { error: null };
    } catch (error) {
      pendingAuthEventRef.current = null;
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      pendingAuthEventRef.current = "signin";
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        pendingAuthEventRef.current = null;
      }

      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      pendingAuthEventRef.current = null;
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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

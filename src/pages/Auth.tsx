import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Music, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { PageBackground } from "@/components/PageBackground";

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100)
    .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain a lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain a number" }),
  fullName: z.string().trim().min(1, { message: "Name is required" }).max(100),
  phone: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const initialTab = (new URLSearchParams(window.location.search).get("tab") === "signup"
    ? "signup"
    : "login") as "login" | "signup";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
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

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const authRedirectUrl = `${window.location.origin}${runtimeBase}auth`;
  const resetRedirectUrl = `${window.location.origin}${runtimeBase}reset-password`;

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  const explicitRedirect = new URLSearchParams(window.location.search).get("redirect");

  useEffect(() => {
    if (!user || authLoading) return;

    if (explicitRedirect) {
      navigate(explicitRedirect);
      return;
    }

    // If profile is still hydrating, route to dashboard fallback instead of
    // leaving the user on auth (appears as "not signing in").
    if (!profile) {
      navigate("/dashboard");
      return;
    }

    navigate(isAdmin ? "/admin" : "/client");
  }, [user, authLoading, profile, isAdmin, navigate, explicitRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signInSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome Back!",
          description: "You have successfully logged in.",
        });
        // Redirect happens in the useEffect once the role is resolved.
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signUpSchema.parse({
        email: signupEmail,
        password: signupPassword,
        fullName: signupName,
        phone: signupPhone || undefined,
      });

      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.fullName,
        validated.phone
      );

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Welcome to BEATKULTURE! You can now access your dashboard.",
        });
        // Redirect happens in the useEffect once the role is resolved.
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: resetRedirectUrl,
    });
    setForgotLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset Email Sent", description: "Check your inbox for a password reset link." });
      setShowForgotPassword(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirectUrl,
      },
    });

    if (error) {
      setIsLoading(false);
      const unsupportedProvider =
        error.message?.toLowerCase().includes("unsupported provider") ||
        error.message?.toLowerCase().includes("provider is not enabled");

      toast({
        title: unsupportedProvider ? "Google Provider Not Enabled" : "Google Sign-In Failed",
        description: unsupportedProvider
          ? "Google auth is disabled in Supabase. Enable Google under Authentication -> Providers, then try again."
          : error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <PageBackground pageKey="bg_auth" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Music className="w-8 h-8 text-primary" />
            <span className="font-display text-2xl font-bold gradient-text">BEATKULTURE</span>
          </div>
          <p className="text-muted-foreground">Access your quotes and event planning</p>
        </div>

        <Card variant="glass">
          <CardHeader className="text-center pb-4">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="relative my-3">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    Continue with Google
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone (Optional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+27 XX XXX XXXX"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                  <div className="relative my-3">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Forgot Password Overlay */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForgotPassword(false)}>
            <Card variant="glass" className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-lg">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowForgotPassword(false)}>Cancel</Button>
                  <Button variant="hero" className="flex-1" onClick={handleForgotPassword} disabled={forgotLoading}>
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <a href="/" className="text-primary hover:underline">
            ← Back to Home
          </a>
        </p>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { PageBackground } from "@/components/PageBackground";
import { useBrandingLogo } from "@/hooks/useBranding";

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
  eventType: z.string().trim().min(1, { message: "Event type is required" }),
  eventDate: z.string().trim().min(1, { message: "Event date is required" }),
  venueName: z.string().trim().min(1, { message: "Venue name is required" }),
  venueAddress: z.string().trim().min(1, { message: "Venue address is required" }),
  startTime: z.string().trim().min(1, { message: "Start time is required" }),
  endTime: z.string().trim().min(1, { message: "End time is required" }),
  guestCount: z.coerce.number().int().min(1, { message: "Guest count is required" }),
  eventSetting: z.enum(["indoor", "outdoor"]),
  city: z.string().trim().min(1, { message: "City or location is required" }),
});

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signUp, signIn, resetPassword } = useAuth();
  const logoImg = useBrandingLogo();
  const [isLoading, setIsLoading] = useState(false);
  const initialTab = (new URLSearchParams(window.location.search).get("tab") === "signup"
    ? "signup"
    : "login") as "login" | "signup";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEventType, setSignupEventType] = useState("");
  const [signupEventDate, setSignupEventDate] = useState("");
  const [signupVenueName, setSignupVenueName] = useState("");
  const [signupVenueAddress, setSignupVenueAddress] = useState("");
  const [signupStartTime, setSignupStartTime] = useState("");
  const [signupEndTime, setSignupEndTime] = useState("");
  const [signupGuestCount, setSignupGuestCount] = useState("");
  const [signupEventSetting, setSignupEventSetting] = useState<"indoor" | "outdoor" | "">("");
  const [signupCity, setSignupCity] = useState("");

  const explicitRedirect = new URLSearchParams(window.location.search).get("redirect");

  useEffect(() => {
    if (!user || authLoading) return;

    if (explicitRedirect) {
      navigate(explicitRedirect, { replace: true });
      return;
    }

    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    navigate(profile ? "/client" : "/dashboard", { replace: true });
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
        eventType: signupEventType,
        eventDate: signupEventDate,
        venueName: signupVenueName,
        venueAddress: signupVenueAddress,
        startTime: signupStartTime,
        endTime: signupEndTime,
        guestCount: signupGuestCount,
        eventSetting: signupEventSetting,
        city: signupCity,
      });

      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.fullName,
        validated.phone,
        {
          eventType: validated.eventType,
          eventDate: validated.eventDate,
          venueName: validated.venueName,
          venueAddress: validated.venueAddress,
          startTime: validated.startTime,
          endTime: validated.endTime,
          guestCount: validated.guestCount,
          eventSetting: validated.eventSetting,
          city: validated.city,
        }
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
          description: "Welcome to BeatKulture Entertainment. Your event profile is ready for quoting.",
        });
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
    const { error } = await resetPassword(forgotEmail.trim());
    setForgotLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset Email Sent", description: "Check your inbox for a password reset link." });
      setShowForgotPassword(false);
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative isolate">
      <PageBackground pageKey="bg_auth" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src={logoImg} alt="BeatKulture Entertainment logo" className="w-8 h-8 object-contain" />
            <span className="font-display text-2xl font-bold gradient-text">BEATKULTURE ENTERTAINMENT</span>
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
                    <Label htmlFor="signup-event-type">Event type *</Label>
                    <Select value={signupEventType} onValueChange={setSignupEventType}>
                      <SelectTrigger id="signup-event-type">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wedding">Wedding</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Birthday">Birthday</SelectItem>
                        <SelectItem value="Private Party">Private Party</SelectItem>
                        <SelectItem value="Anniversary">Anniversary</SelectItem>
                        <SelectItem value="Matric Dance">Matric Dance</SelectItem>
                        <SelectItem value="Baby Shower">Baby Shower</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-event-date">Event date *</Label>
                      <Input
                        id="signup-event-date"
                        type="date"
                        value={signupEventDate}
                        onChange={(e) => setSignupEventDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-event-setting">Indoor or outdoor *</Label>
                      <Select value={signupEventSetting} onValueChange={(value) => setSignupEventSetting(value as "indoor" | "outdoor")}>
                        <SelectTrigger id="signup-event-setting">
                          <SelectValue placeholder="Select setting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-venue-name">Venue name *</Label>
                    <Input
                      id="signup-venue-name"
                      type="text"
                      placeholder="Event venue"
                      value={signupVenueName}
                      onChange={(e) => setSignupVenueName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-venue-address">Venue address *</Label>
                    <Input
                      id="signup-venue-address"
                      type="text"
                      placeholder="Street address"
                      value={signupVenueAddress}
                      onChange={(e) => setSignupVenueAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-city">City / location *</Label>
                      <Input
                        id="signup-city"
                        type="text"
                        placeholder="Pretoria"
                        value={signupCity}
                        onChange={(e) => setSignupCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-guests">Number of guests *</Label>
                      <Input
                        id="signup-guests"
                        type="number"
                        min="1"
                        value={signupGuestCount}
                        onChange={(e) => setSignupGuestCount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-start-time">Event start time *</Label>
                      <Input
                        id="signup-start-time"
                        type="time"
                        value={signupStartTime}
                        onChange={(e) => setSignupStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-end-time">Event end time *</Label>
                      <Input
                        id="signup-end-time"
                        type="time"
                        value={signupEndTime}
                        onChange={(e) => setSignupEndTime(e.target.value)}
                        required
                      />
                    </div>
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
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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

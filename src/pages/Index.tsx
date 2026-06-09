import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Music, Calendar, PartyPopper, LogIn, UserPlus, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/landing-hero.jpg";
import logoImg from "@/assets/logo.png";
import { PageBackground } from "@/components/PageBackground";

/**
 * Public landing page.
 * - Authenticated visitors are routed to /admin or /client.
 * - Everyone else sees an inviting hero with sign-up / sign-in CTAs.
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user && profile) {
      navigate(isAdmin ? "/admin" : "/client", { replace: true });
    }
  }, [user, profile, isAdmin, isLoading, navigate]);

  if (isLoading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a confirmed user+profile we already redirected; nothing to render.
  if (user) return null;

  const features = [
    { icon: Calendar, label: "Custom Quotes" },
    { icon: Music, label: "QR Song Requests" },
    { icon: PartyPopper, label: "Event Planner" },
    { icon: Sparkles, label: "AI Assistant" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <PageBackground pageKey="bg_landing" />
      {/* Background image */}
      <img
        src={heroImg}
        alt="A glowing wedding reception dance floor lit by a BeatKulture DJ booth"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1280}
      />
      {/* Gradient + vignette overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background)/0.85)_80%)]" />
      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/25 blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] rounded-full bg-secondary/25 blur-3xl animate-pulse"
        style={{ animationDelay: "1.2s" }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="container mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="BeatKulture" className="w-10 h-10 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-base sm:text-lg">BEATKULTURE</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                One Beat. One Kulture. One Love.
              </span>
            </div>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?tab=signup">
                <UserPlus className="w-4 h-4" /> Sign Up
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 container mx-auto px-4 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center py-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">
                26+ Years • 500+ Unforgettable Events
              </span>
            </motion.div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6">
              <span className="text-foreground">Welcome to your</span>
              <br />
              <span className="gradient-text">Event Experience</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Plan weddings, parties, and corporate events with BeatKulture Entertainment.
              Get a custom DJ quote, plan your timeline, request songs by QR — all in one place.
              <span className="block mt-2 text-foreground/90 font-medium">
                Sign up to unlock the full experience, or sign in to pick up where you left off.
              </span>
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?tab=signup">
                  <UserPlus className="w-5 h-5" />
                  Sign Up — It's Free
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/auth">
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Feature chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
            >
              {features.map((f) => (
                <div
                  key={f.label}
                  className="glass-card rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 hover-glow transition-all"
                >
                  <f.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <span>Rated 5★ on Bark.com</span>
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BeatKulture Entertainment (Pty) Ltd · +27 65 528 5528
        </footer>
      </div>
    </div>
  );
};

export default Index;

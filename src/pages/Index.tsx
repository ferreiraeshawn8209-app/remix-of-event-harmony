import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, Sparkles, Music, Calendar, PartyPopper, LogIn, UserPlus,
  Star, Zap, Lock, ArrowRight, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoImg from "@/assets/logo.png";
import { PageBackground } from "@/components/PageBackground";
import { CoordinatorChat } from "@/components/landing/CoordinatorChat";
import { UpcomingEventsTicker } from "@/components/landing/UpcomingEventsTicker";
import { SpecialsBanner } from "@/components/landing/SpecialsBanner";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { YoutubeShowcase } from "@/components/YoutubeShowcase";
import { MixcloudRotator } from "@/components/MixcloudRotator";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";

/**
 * Public landing page — authenticated visitors are redirected to /admin or /client.
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
  if (user) return null;

  const features = [
    {
      icon: Calendar,
      label: "Custom Quote Builder",
      teaser: "Get a personalised, itemised quote in seconds — no calls, no guesswork.",
    },
    {
      icon: Music,
      label: "Live Song Requests",
      teaser: "Your guests request songs via QR code. Real-time, right from their phone.",
    },
    {
      icon: PartyPopper,
      label: "Event Planner Suite",
      teaser: "Timeline, floor plan, music schedule — everything in one place, just for you.",
    },
    {
      icon: Sparkles,
      label: "AI Event Coordinator",
      teaser: "Your 24/7 planning assistant. Ask anything. She always has an answer.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground pageKey="bg_landing" />

      {/* Top bar */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImg} alt="BeatKulture Entertainment logo" className="w-10 h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-lg">BEATKULTURE ENTERTAINMENT</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">One Beat. One Kulture. One Love.</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth"><LogIn className="w-4 h-4" /> Sign In</Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/auth?tab=signup"><UserPlus className="w-4 h-4" /> Sign Up</Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-4 pb-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-5 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">26+ Years · 500+ Unforgettable Events · Rated 5★</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] mb-5">
              <span className="text-foreground">Your night.</span>{" "}
              <span className="gradient-text">Your vibe.</span>{" "}
              <span className="text-foreground">Your legacy.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-muted-foreground mb-3">
              Stop settling for ordinary. BeatKulture Entertainment transforms events into memories your guests will talk about for years — and gives you the tools to plan every detail, effortlessly.
            </p>
            <p className="text-sm text-muted-foreground mb-6 border-l-2 border-primary/40 pl-3">
              Sign up free and unlock your private client portal — packed with features most event services don't even tell you exist.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?tab=signup">
                  <UserPlus className="w-5 h-5" /> Claim My Free Account
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <a href="#features">
                  <ChevronDown className="w-4 h-4" /> Discover What's Inside
                </a>
              </Button>
            </div>

            {/* Star rating */}
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                ))}
              </div>
              <span>Rated 5★ on Bark.com · Trusted by 500+ clients</span>
            </div>
          </motion.div>

          {/* AI Coordinator chat preview */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <CoordinatorChat />
          </motion.div>
        </div>
      </section>

      {/* Events ticker */}
      <UpcomingEventsTicker />

      {/* Specials */}
      <SpecialsBanner />

      {/* Feature teasers — curiosity, no prices */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="mb-4 bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1">
            <Lock className="w-3 h-3 mr-1" /> Members-only access
          </Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-3">
            What's waiting{" "}
            <span className="gradient-text">inside</span>
          </h2>
          <p className="text-muted-foreground">
            Most clients don't realise how much they're missing until they sign up. Here's a glimpse — just a glimpse.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="glass-card rounded-xl p-5 h-full flex flex-col gap-3 hover:border-primary/40 transition-colors border border-transparent">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{f.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.teaser}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FOMO nudge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>There's more — but you'll need to be inside to see it.</span>
            <Link to="/auth?tab=signup" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              Sign up free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* YouTube showcase */}
      <section className="container mx-auto px-4 py-12"><YoutubeShowcase /></section>

      {/* Mixcloud rotator */}
      <section className="container mx-auto px-4 py-8 max-w-3xl"><MixcloudRotator /></section>

      {/* Competitions */}
      <section className="container mx-auto px-4 py-12"><CompetitionsBanner /></section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 py-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            Ready to make it{" "}
            <span className="gradient-text">unforgettable?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-base sm:text-lg">
            Hundreds of couples, corporates, and party planners already have their account. Your perfect event is one step away — and it starts for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?tab=signup">
                <UserPlus className="w-5 h-5" /> Create My Free Account
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link to="/auth"><LogIn className="w-5 h-5" /> Already have an account</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BeatKulture Entertainment (Pty) Ltd · +27 65 528 5528 · Reg 2025/533623/07
      </footer>
    </div>
  );
};

export default Index;

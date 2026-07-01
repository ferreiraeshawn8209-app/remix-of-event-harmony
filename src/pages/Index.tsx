import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Music, Calendar, PartyPopper, LogIn, UserPlus, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageBackground } from "@/components/PageBackground";
import { CoordinatorChat } from "@/components/landing/CoordinatorChat";
import { UpcomingEventsTicker } from "@/components/landing/UpcomingEventsTicker";
import { SpecialsBanner } from "@/components/landing/SpecialsBanner";
import { PackagesShowcase } from "@/components/landing/PackagesShowcase";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { YoutubeShowcase } from "@/components/YoutubeShowcase";
import { MixcloudRotator } from "@/components/MixcloudRotator";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";
import { useBrandingLogo } from "@/hooks/useBranding";

/**
 * Public landing page — authenticated visitors are redirected to /admin or /client.
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading } = useAuth();
  const logoImg = useBrandingLogo();

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
    { icon: Calendar, label: "Custom Quotes" },
    { icon: Music, label: "QR Song Requests" },
    { icon: PartyPopper, label: "Event Planner" },
    { icon: Sparkles, label: "AI Coordinator" },
  ];

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <PageBackground pageKey="bg_landing" />

      {/* Top bar */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImg} alt="BeatKulture" className="w-10 h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-lg">BEATKULTURE</span>
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

      {/* HERO — AI Coordinator front and center */}
      <section className="container mx-auto px-4 pt-4 pb-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-5 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">26+ Years · 500+ Unforgettable Events</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] mb-5">
              <span className="text-foreground">Plan your night with</span>{" "}
              <span className="gradient-text">Kulture</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Meet our AI Event Coordinator. Ask anything — packages, prices, planning, song requests — and she'll point you to the perfect setup. Or jump straight in.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?tab=signup"><UserPlus className="w-5 h-5" /> Sign Up — It's Free</Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <a href="#packages">See Packages</a>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {features.map((f) => (
                <div key={f.label} className="glass-card rounded-xl px-2 py-2 flex flex-col items-center gap-1">
                  <f.icon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] sm:text-xs font-medium text-center">{f.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                ))}
              </div>
              <span>Rated 5★ on Bark.com</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <CoordinatorChat />
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4">
            <h2 className="font-display text-xl font-bold mb-2">BeatKulture Entertainment</h2>
            <p className="text-sm text-muted-foreground">
              Premium DJ and event production platform with guided planning from quote to event day.
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Platform features</p>
            <p className="text-sm text-muted-foreground">
              AI assistant, event planning tools, client music system, and transparent quote management in one portal.
            </p>
          </div>
        </div>
      </section>

      {/* Events ticker */}
      <UpcomingEventsTicker />

      {/* Specials */}
      <SpecialsBanner />

      {/* Packages — Custom first, then Wedding / Corporate / Party */}
      <div id="packages"><PackagesShowcase /></div>

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* YouTube showcase */}
      <section className="container mx-auto px-4 py-12"><YoutubeShowcase /></section>

      {/* Mixcloud rotator */}
      <section className="container mx-auto px-4 py-8 max-w-3xl"><MixcloudRotator /></section>

      {/* Competitions at the bottom */}
      <section className="container mx-auto px-4 py-12"><CompetitionsBanner /></section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BeatKulture Entertainment (Pty) Ltd · +27 65 528 5528 · Reg 2025/533623/07
      </footer>
    </div>
  );
};

export default Index;

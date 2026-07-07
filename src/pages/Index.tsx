import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Music, Calendar, PartyPopper, LogIn, UserPlus, Star, Gem, ShieldCheck, Headphones, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageBackground } from "@/components/PageBackground";
import { CoordinatorChat } from "@/components/landing/CoordinatorChat";
import { UpcomingEventsTicker } from "@/components/landing/UpcomingEventsTicker";
import { SpecialsBanner } from "@/components/landing/SpecialsBanner";
import { PackagesShowcase } from "@/components/landing/PackagesShowcase";
import { ExtraFeaturesSection } from "@/components/landing/ExtraFeaturesSection";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { YoutubeShowcase } from "@/components/YoutubeShowcase";
import { MixcloudRotator } from "@/components/MixcloudRotator";
import { MusicPlayer } from "@/components/MusicPlayer";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";
import { useBrandingLogo } from "@/hooks/useBranding";
import { DjAvatar } from "@/components/beatkulture/DjAvatar";
import { CinematicOverlay } from "@/components/beatkulture/CinematicOverlay";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { resolveMixcloudProfileUrl } from "@/lib/mixcloud";

/**
 * Public landing page — authenticated visitors are redirected to /admin or /client.
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading } = useAuth();
  const logoImg = useBrandingLogo();
  const { get } = useBusinessSettings();
  const mixcloudUrl = resolveMixcloudProfileUrl(get("mixcloud_url"));

  useEffect(() => {
    if (isLoading) return;
    if (user && profile) {
      navigate(isAdmin ? "/admin" : "/client", { replace: true });
    }
  }, [user, profile, isAdmin, isLoading, navigate]);

  // Always render the landing page (backgrounds + packages) immediately.
  // Authenticated users are redirected by the effect above once their profile hydrates.

  const features = [
    { icon: Calendar, label: "Custom Quotes" },
    { icon: Music, label: "Music Curation" },
    { icon: PartyPopper, label: "Bookings & Timelines" },
    { icon: Sparkles, label: "Live AI Companion" },
  ];
  const packagePillars = [
    {
      icon: Gem,
      title: "Price",
      detail: "Transparent package totals before signup.",
    },
    {
      icon: ShieldCheck,
      title: "Description",
      detail: "Purpose-built package outcomes for each event style.",
    },
    {
      icon: Headphones,
      title: "Services + Equipment",
      detail: "Professional DJ services with listed sound and lighting gear.",
    },
    {
      icon: Wand2,
      title: "Extras",
      detail: "Premium add-ons like MC flow, effects, and custom enhancements.",
    },
  ];
  const aiShowcaseFeatures = [
    "Build wedding timelines",
    "Create invitations",
    "Suggest music",
    "Generate MC jokes",
    "Organise seating plans",
    "Create event schedules",
    "Assist with speeches",
    "Track bookings",
    "Generate reminders",
  ];

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground premium-page cinematic-shell">
      <PageBackground pageKey="bg_landing" />
      <CinematicOverlay intensity="medium" />

      {/* Top bar */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImg} alt="BeatKulture" className="w-10 h-10 object-contain" />
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

      <section className="container mx-auto px-4 pt-4 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-primary/35 bg-[linear-gradient(145deg,hsl(252_35%_14%_/_0.86),hsl(252_35%_9%_/_0.7))] p-5 sm:p-7 shadow-[0_18px_52px_hsl(250_75%_2%_/_0.48)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary/90">Landing Hero</p>
              <h2 className="premium-section-title text-2xl sm:text-3xl font-bold">Packages first. Experience premium before login.</h2>
            </div>
            <Button variant="hero" size="sm" asChild>
              <a href="#packages">Explore premium packages</a>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {packagePillars.map((item) => (
              <div key={item.title} className="feature-card-luxe rounded-xl p-3">
                <item.icon className="w-4 h-4 text-primary mb-2" />
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Packages — visible on landing before auth flow */}
      <div id="packages"><PackagesShowcase /></div>

      {/* HERO — AI Coordinator signature */}
      <section className="container mx-auto px-4 pt-0 pb-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full premium-chip mb-5 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">AI Signature Experience · 26+ Years · 500+ Events</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] mb-5">
              <span className="text-foreground">Meet your living</span>{" "}
              <span className="gradient-text">AI event companion</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Your charismatic planner + MC + assistant greets by name, recommends packages, builds timelines, and keeps your booking flow cinematic from quote to event day.
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

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-4">
            <div className="flex justify-center">
              <DjAvatar mood="mixing" className="w-full max-w-[340px]" />
            </div>
            <CoordinatorChat />
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 relative z-10">
        <CardGlowGrid features={aiShowcaseFeatures} />
      </section>

      <ExtraFeaturesSection />

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

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* YouTube showcase */}
      <section className="container mx-auto px-4 py-12"><YoutubeShowcase /></section>

      {/* Mixcloud rotator */}
      <section className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <MusicPlayer mixcloudUrl={mixcloudUrl} />
        <MixcloudRotator backupUrl={mixcloudUrl} />
      </section>

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

function CardGlowGrid({ features }: { features: string[] }) {
  return (
    <div className="rounded-2xl border border-primary/35 bg-[radial-gradient(circle_at_top,rgba(255,140,0,0.2),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(167,71,255,0.25),transparent_40%)] p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">AI Showcase</p>
        <h3 className="font-display text-2xl sm:text-3xl font-bold">
          Neon-powered companion features that keep your event alive
        </h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-primary/25 bg-background/55 backdrop-blur-md p-3 text-sm shadow-[0_0_35px_rgba(255,140,0,0.12)]"
          >
            <p className="text-primary font-semibold">✓ {feature}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

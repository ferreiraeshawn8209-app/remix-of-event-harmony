import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Music, LogIn, UserPlus, Star, Calendar, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageBackground } from "@/components/PageBackground";
import { SpecialsBanner } from "@/components/landing/SpecialsBanner";
import { DjTipsBanner } from "@/components/DjTipsBanner";
import { PackagesShowcase } from "@/components/landing/PackagesShowcase";
import { MixcloudRotator } from "@/components/MixcloudRotator";
import { MusicPlayer } from "@/components/MusicPlayer";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";
import { useBrandingLogo } from "@/hooks/useBranding";
import { CinematicOverlay } from "@/components/beatkulture/CinematicOverlay";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { resolveMixcloudProfileUrl } from "@/lib/mixcloud";
import { Footer } from "@/components/Footer";

/**
 * Public landing page — authenticated visitors are redirected to /admin or /client.
 * Section order: Hero → Specials Banner → Curated Packages → Competition Banner
 *                → Embedded Music Player → Mixcloud → Footer
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

  const stats = [
    { icon: Star, label: "26+ Years Experience" },
    { icon: Calendar, label: "500+ Events Delivered" },
    { icon: Headphones, label: "Premium DJ & Production" },
    { icon: Music, label: "Curated Music Planning" },
  ];

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground premium-page cinematic-shell">
      <PageBackground pageKey="bg_landing" opacity={0.3} />
      <CinematicOverlay intensity="medium" />

      {/* ── Nav ── */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImg} alt="BeatKulture" className="w-10 h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-lg">BEATKULTURE ENTERTAINMENT</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">One Beat. One Kulture. One Love.</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth"><LogIn className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Login</span></Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/auth?tab=signup"><UserPlus className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Sign Up</span></Link>
          </Button>
        </nav>
      </header>

      {/* ── 0. DJ TIPS BANNER (top, above hero) ── */}
      <div className="container mx-auto px-4 pt-2 pb-1 relative z-10">
        <DjTipsBanner variant="landing" />
      </div>

      {/* ── 1. HERO SECTION ── */}
      <section className="container mx-auto px-4 pt-6 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full premium-chip mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">26+ Years Experience · 500+ Events Delivered</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
            <span className="text-foreground">South Africa's</span>{" "}
            <span className="gradient-text">Premier DJ &</span>
            <br />
            <span className="gradient-text">Event Production</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
            <strong className="text-foreground">BeatKulture Entertainment</strong> is a luxury DJ and event production company
            with over 26 years of experience transforming weddings, corporate events, and private parties into
            unforgettable cinematic experiences.
          </p>


          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?tab=signup"><UserPlus className="w-5 h-5" /> Sign Up Free</Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <a href="#packages"><Music className="w-5 h-5" /> View Packages</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth?tab=signup"><Calendar className="w-5 h-5" /> Book Now</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="glass-card rounded-xl px-3 py-3 flex flex-col items-center gap-1.5">
                <s.icon className="w-5 h-5 text-primary" />
                <span className="text-[11px] sm:text-xs font-medium text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
              ))}
            </div>
            <span>Rated 5★ · Bark.com · Google Reviews</span>
          </div>
        </motion.div>
      </section>

      {/* ── 2. SPECIALS BANNER ── */}
      <SpecialsBanner />

      {/* ── 3. CURATED PACKAGES ── */}
      <div id="packages">
        <PackagesShowcase />
      </div>

      {/* ── 4. COMPETITION BANNER ── */}
      <section className="container mx-auto px-4 py-8">
        <CompetitionsBanner />
      </section>

      {/* ── 5. EMBEDDED MUSIC PLAYER ── */}
      <section className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-widest text-primary/80 mb-1">Listen Now</p>
          <h2 className="font-display text-2xl font-bold">BeatKulture Music Experience</h2>
        </div>
        <MusicPlayer mixcloudUrl={mixcloudUrl} />
      </section>

      {/* ── 6. MIXCLOUD SECTION ── */}
      <section className="container mx-auto px-4 py-8 max-w-4xl">
        <MixcloudRotator backupUrl={mixcloudUrl} />
      </section>

      {/* ── 7. FOOTER ── */}
      <Footer />
    </div>
  );
};

export default Index;

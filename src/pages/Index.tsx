import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { PackagesSection } from "@/components/PackagesSection";
import { EquipmentShowcase } from "@/components/EquipmentShowcase";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { Footer } from "@/components/Footer";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.hash) return;

    // Wait a tick so layout is committed before scrolling.
    const id = location.hash.slice(1);
    window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection onGetQuote={() => navigate("/#quote-calculator")} />
      <ServicesSection />
      <PackagesSection />
      <EquipmentShowcase />
      <div id="quote-calculator" className="scroll-mt-24">
        <QuoteCalculator />
      </div>
      <Footer />
    </div>
  );
};

export default Index;

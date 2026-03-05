import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { PackagesSection } from "@/components/PackagesSection";
import { EquipmentShowcase } from "@/components/EquipmentShowcase";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { Footer } from "@/components/Footer";
import { DbPackage } from "@/hooks/usePackages";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<DbPackage | null>(null);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [location.hash]);

  const handlePackageSelect = (pkg: DbPackage) => {
    setSelectedPackage(pkg);
    window.setTimeout(() => {
      document.getElementById('quote-calculator')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection onGetQuote={() => navigate("/#quote-calculator")} />
      <ServicesSection />
      <PackagesSection onSelectPackage={handlePackageSelect} />
      <EquipmentShowcase />
      <div id="quote-calculator" className="scroll-mt-24">
        <QuoteCalculator selectedPackage={selectedPackage} onClearPackage={() => setSelectedPackage(null)} />
      </div>
      <Footer />
    </div>
  );
};

export default Index;

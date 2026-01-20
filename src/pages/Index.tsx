import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Footer } from "@/components/Footer";

type Page = "home" | "quote" | "admin";

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const renderPage = () => {
    switch (currentPage) {
      case "admin":
        return <AdminDashboard />;
      case "quote":
        return (
          <div className="pt-20">
            <QuoteCalculator />
            <Footer />
          </div>
        );
      case "home":
      default:
        return (
          <>
            <HeroSection onGetQuote={() => setCurrentPage("quote")} />
            <ServicesSection />
            <QuoteCalculator />
            <Footer />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={(page) => setCurrentPage(page as Page)} currentPage={currentPage} />
      {renderPage()}
    </div>
  );
};

export default Index;

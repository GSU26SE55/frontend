import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FinalCtaSection from "@/features/landing/components/FinalCtaSection";
import GovernanceSection from "@/features/landing/components/GovernanceSection";
import HeroSection from "@/features/landing/components/HeroSection";
import LandingFooter from "@/features/landing/components/LandingFooter";
import LandingHeader from "@/features/landing/components/LandingHeader";
import ProductSection from "@/features/landing/components/ProductSection";
import RolesSection from "@/features/landing/components/RolesSection";
import WorkflowSection from "@/features/landing/components/WorkflowSection";
import StatsSection from "@/features/landing/components/StatsSection";
const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-slate-950 px-4 py-3 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <LandingHeader scrolled={scrolled} onLogin={() => navigate("/login")} />

      <main id="main-content">
        <HeroSection onLogin={() => navigate("/login")} />
        <ProductSection />
        <WorkflowSection />
        <StatsSection />
        <RolesSection />
        <GovernanceSection />
        <FinalCtaSection onLogin={() => navigate("/login")} />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;

import { NavBar } from '../components/NavBar';
import { HeroSection } from '../components/HeroSection';
import { CouncilSection } from '../components/CouncilSection';
import { CapabilitiesSection } from '../components/CapabilitiesSection';
import { KnowledgeGraphSection } from '../components/KnowledgeGraphSection';
import { SutrasSection } from '../components/SutrasSection';
import { TrustSection } from '../components/TrustSection';
import { Footer } from '../components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      <NavBar />
      <HeroSection />
      <CouncilSection />
      <CapabilitiesSection />
      <KnowledgeGraphSection />
      <SutrasSection />
      <TrustSection />
      <Footer />
    </div>
  );
}
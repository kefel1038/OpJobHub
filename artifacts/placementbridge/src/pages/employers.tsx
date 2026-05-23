import { Layout } from "@/components/layout/Layout";
import {
  HeroSection,
  LiveIntelligenceSection,
  SolutionsMappingSection,
  OrchestrationPipelineSection,
  IntelligencePlatformSection,
  MigrationCorridorMapSection,
  TrustGovernanceSection,
  DashboardPreviewSection,
  PublicIntelligenceFeedSection,
  FinalCTASection,
  AICopilotWidget,
} from "@/components/employers";
import { TrustedBySection } from "@/components/employers/TrustedBySection";
import { TestimonialsSection } from "@/components/employers/TestimonialsSection";
import { PricingSection } from "@/components/employers/PricingSection";
import { VerificationBadgesSection } from "@/components/employers/VerificationBadgesSection";

export default function Employers() {
  return (
    <Layout>
      <HeroSection />
      <TrustedBySection />
      <LiveIntelligenceSection />
      <SolutionsMappingSection />
      <OrchestrationPipelineSection />
      <IntelligencePlatformSection />
      <MigrationCorridorMapSection />
      <VerificationBadgesSection />
      <TrustGovernanceSection />
      <DashboardPreviewSection />
      <TestimonialsSection />
      <PricingSection />
      <PublicIntelligenceFeedSection />
      <FinalCTASection />
      <AICopilotWidget />
    </Layout>
  );
}

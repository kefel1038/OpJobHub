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

export default function Employers() {
  return (
    <Layout>
      <HeroSection />
      <LiveIntelligenceSection />
      <SolutionsMappingSection />
      <OrchestrationPipelineSection />
      <IntelligencePlatformSection />
      <MigrationCorridorMapSection />
      <TrustGovernanceSection />
      <DashboardPreviewSection />
      <PublicIntelligenceFeedSection />
      <FinalCTASection />
      <AICopilotWidget />
    </Layout>
  );
}

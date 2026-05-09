import { Layout } from "@/components/layout/Layout";
import {
  HeroSection,
  TrustedBySection,
  SolutionsSection,
  AIFeaturesSection,
  VerificationBadgesSection,
  PipelineSection,
  IndustryHiringSection,
  InternationalSection,
  PricingSection,
  TestimonialsSection,
  GlobalCTASection,
} from "@/components/employers";

export default function Employers() {
  return (
    <Layout>
      <HeroSection />
      <TrustedBySection />
      <SolutionsSection />
      <AIFeaturesSection />
      <VerificationBadgesSection />
      <PipelineSection />
      <IndustryHiringSection />
      <InternationalSection />
      <PricingSection />
      <TestimonialsSection />
      <GlobalCTASection />
    </Layout>
  );
}

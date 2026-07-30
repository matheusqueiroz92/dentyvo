import { ContactSection } from "@/components/marketing/ContactSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}

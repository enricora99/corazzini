import { About } from "@/components/landing/about";
import { Friends } from "@/components/landing/friends";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Problem } from "@/components/landing/problem";
import { WaitlistSection } from "@/components/landing/waitlist-section";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Friends />
      <About />
      <WaitlistSection />
    </>
  );
}

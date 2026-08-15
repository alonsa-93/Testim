import { Navbar } from "@/components/blocks/navbar";
import { Hero } from "@/components/blocks/hero";
import { Features } from "@/components/blocks/features";
import { About } from "@/components/blocks/about";
import { Testimonials } from "@/components/blocks/testimonials";
import { Pricing } from "@/components/blocks/pricing";
import { Faq } from "@/components/blocks/faq";
import { LeadForm } from "@/components/blocks/lead-form";
import { Cta } from "@/components/blocks/cta";
import { Footer } from "@/components/blocks/footer";

/**
 * דף נחיתה מלא, מורכב מהבלוקים של המערכת.
 * זהו דף הדוגמה — כשבונים דף ללקוח אמיתי, מעתיקים את המבנה הזה
 * ומחליפים תוכן, מוסיפים או מורידים בלוקים לפי הצורך.
 */
export function LandingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-btn bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:start-3"
      >
        דילוג לתוכן הראשי
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <About />
        <Testimonials />
        <Pricing />
        <Faq />
        <LeadForm />
        <Cta />
      </main>
      <Footer />
    </>
  );
}

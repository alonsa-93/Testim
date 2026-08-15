import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-card bg-primary px-6 py-14 text-center text-on-primary shadow-card md:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 start-8 size-64 rounded-full bg-on-primary/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 end-8 size-72 rounded-full bg-accent/25 blur-2xl"
        />
        <h2 className="relative mx-auto max-w-2xl text-h2">
          הבית הבא שלכם מתחיל בפגישה אחת טובה
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl opacity-85">
          פגישת ההיכרות ללא עלות וללא התחייבות — נצא ממנה עם כיוון ראשוני
          והערכת תקציב מציאותית.
        </p>
        <div className="relative mt-8">
          <Button variant="inverted" size="lg" href="#contact">
            לתיאום פגישת היכרות
          </Button>
        </div>
      </div>
    </Section>
  );
}

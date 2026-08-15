import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface CtaContent {
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
}

const defaults: CtaContent = {
  title: "הבית הבא שלכם מתחיל בפגישה אחת טובה",
  text: "פגישת ההיכרות ללא עלות וללא התחייבות — נצא ממנה עם כיוון ראשוני והערכת תקציב מציאותית.",
  ctaLabel: "לתיאום פגישת היכרות",
  ctaHref: "#contact",
};

function Cta({ content }: { content: BlockContent }) {
  const c = { ...defaults, ...content } as CtaContent;

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
        <h2 className="relative mx-auto max-w-2xl text-h2">{c.title}</h2>
        {c.text && (
          <p className="relative mx-auto mt-4 max-w-xl opacity-85">{c.text}</p>
        )}
        {c.ctaLabel && (
          <div className="relative mt-8">
            <Button variant="inverted" size="lg" href={c.ctaHref}>
              {c.ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

export const ctaBlock: BlockDef = {
  type: "cta",
  label: "באנר קריאה לפעולה",
  description: "פס צבעוני בולט עם משפט אחד וכפתור",
  component: Cta,
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "title", type: "text", label: "כותרת" },
    { key: "text", type: "textarea", label: "משפט הסבר" },
    { key: "ctaLabel", type: "text", label: "כפתור — טקסט" },
    { key: "ctaHref", type: "text", label: "כפתור — קישור" },
  ],
};

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/fx/reveal";
import { ANIM_FIELDS, resolveBlockAnim } from "@/lib/effects";
import { cn } from "@/lib/cn";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

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

function Cta({ content, theme }: { content: BlockContent; theme?: Theme }) {
  const c = { ...defaults, ...content } as CtaContent;
  const anim = resolveBlockAnim(theme?.effects, content);
  // buttonStyle מהערכה: push מפעיל כפתור תלת-ממדי (fx-btn-3d), shine
  // מוסיף ברק חולף במעבר עכבר (fx-btn-shine) — שתיהן ב-globals.css
  const btnFx =
    theme?.effects.buttonStyle === "push"
      ? "fx-btn-3d"
      : theme?.effects.buttonStyle === "shine"
        ? "fx-btn-shine"
        : undefined;

  return (
    <Section>
      <Reveal
        anim={anim}
        className="relative overflow-hidden rounded-card bg-primary px-6 py-14 text-center text-on-primary shadow-card md:py-16"
      >
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
            <Button variant="inverted" size="lg" href={c.ctaHref} className={cn(btnFx)}>
              {c.ctaLabel}
            </Button>
          </div>
        )}
      </Reveal>
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
    ...ANIM_FIELDS,
  ],
};

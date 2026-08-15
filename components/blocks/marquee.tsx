import { Reveal } from "@/components/fx/reveal";
import { MarqueeToggle } from "@/components/fx/marquee-toggle";
import { ANIM_FIELDS, resolveBlockAnim } from "@/lib/effects";
import { cn } from "@/lib/cn";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";
import type { CSSProperties } from "react";

interface MarqueeContent {
  items: string[];
  /** משך הקפה אחת בשניות — נמוך יותר = מהיר יותר */
  speedSeconds: number;
  /** נטיית "מדבקה" קלה (rotate -1.4deg) */
  slant: boolean;
}

const defaults: MarqueeContent = {
  items: [
    "עיצוב שמדבר בעד עצמו",
    "ליווי צמוד מהיום הראשון",
    "תוצאה שמרגישה בדיוק נכון",
    "אמינות. שקיפות. תוצאות.",
    "בלי הפתעות בדרך",
  ],
  speedSeconds: 32,
  slant: false,
};

/**
 * פס נגלל אינסופי (marquee): רכיב שרת טהור — כל התוכן ב-DOM תמיד,
 * גם בלי JS. האנימציה עצמה CSS-בלבד (.fx-marquee-track, globals.css);
 * הפיסה האינטראקטיבית היחידה (כפתור ההשהיה) מבודדת ל-MarqueeToggle
 * הקטן (components/fx/marquee-toggle.tsx), כך שהבלוק עצמו לא צריך
 * "use client". התוכן משוכפל בדיוק פעמיים — כך ש-translate ל-50%
 * (הקיים ב-CSS) יוצר לולאה חלקה בלי קפיצה.
 * RTL: המכל dir="ltr" (מתכון ה-RTL הקיים בקוד הבעלים — ראו
 * repos-report), הפריטים עצמם dir="rtl".
 */
function Marquee({ content, theme }: { content: BlockContent; theme?: Theme }) {
  const c = { ...defaults, ...content } as MarqueeContent;
  const anim = resolveBlockAnim(theme?.effects, content);

  if (c.items.length === 0) return null;

  const group = (hidden: boolean) => (
    <ul
      dir="rtl"
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pe-10"
    >
      {c.items.map((item, i) => (
        <li key={i} className="font-heading text-xl font-bold text-muted/80">
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <section className="overflow-hidden border-y border-line bg-surface/40 py-8">
      <Reveal anim={anim}>
        <MarqueeToggle>
          <div
            dir="ltr"
            className={cn("overflow-hidden", c.slant && "-my-2 rotate-[-1.4deg] py-2")}
          >
            <div
              className="fx-marquee-track"
              style={{ animationDuration: `${c.speedSeconds}s` } as CSSProperties}
            >
              {group(false)}
              {group(true)}
            </div>
          </div>
        </MarqueeToggle>
      </Reveal>
    </section>
  );
}

export const marqueeBlock: BlockDef = {
  type: "marquee",
  label: "פס נגלל",
  description: "טקסטים או שמות שנעים בלולאה אינסופית, עם כפתור השהיה מובנה",
  component: Marquee,
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "items", type: "strings", label: "הטקסטים", itemLabel: "טקסט" },
    {
      // "s" ליחידה: כמה שניות לוקח להקיף פעם אחת — נמוך יותר = מהיר יותר
      key: "speedSeconds",
      type: "number",
      label: "מהירות הקפה",
      min: 10,
      max: 60,
      step: 1,
      unit: "s",
    },
    { key: "slant", type: "boolean", label: "נטיית \"מדבקה\" קלה" },
    ...ANIM_FIELDS,
  ],
};

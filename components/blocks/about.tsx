import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/icons";
import { Reveal } from "@/components/fx/reveal";
import { ExperienceTarget } from "@/components/experience/experience-target";
import { ANIM_FIELDS, resolveBlockAnim, staggerChild, staggerStyle } from "@/lib/effects";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

interface AboutContent {
  eyebrow: string;
  title: string;
  text: string;
  points: string[];
  ctaLabel: string;
  ctaHref: string;
  badgeValue: string;
  badgeLabel: string;
}

const defaults: AboutContent = {
  eyebrow: "הגישה שלנו",
  title: "שקט נפשי הוא חלק מהמפרט הטכני",
  text: "שיפוץ או בנייה הם מהפרויקטים הגדולים של החיים — ולכן בנינו תהליך שמוריד מכם את כאב הראש: החלטות מסודרות, לוח זמנים ברור ואדם אחד שאחראי על הכול.",
  points: [
    "פגישת היכרות בבית שלכם — מבינים איך אתם באמת חיים",
    "תקציב שקוף מהיום הראשון, בלי הפתעות בסוף",
    "ספק אחד מולכם: אנחנו מנהלים את כל בעלי המקצוע",
    "עדכון שבועי מסודר עם תמונות והחלטות להמשך",
  ],
  ctaLabel: "לשיחת היכרות ללא עלות",
  ctaHref: "#contact",
  badgeValue: "4–6 חודשים",
  badgeLabel: "משך פרויקט ממוצע, מתכנון למפתח",
};

function About({
  content,
  anchor,
  theme,
}: {
  content: BlockContent;
  anchor?: string;
  theme?: Theme;
}) {
  const c = { ...defaults, ...content } as AboutContent;
  const anim = resolveBlockAnim(theme?.effects, content);

  return (
    <Section id={anchor ?? "about"}>
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* קומפוזיציה ויזואלית דקורטיבית */}
        <ExperienceTarget id="about-visual" className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:max-w-none">
          <Reveal anim={staggerChild(anim, 0)}>
            <div className="grid grid-cols-5 gap-4">
              <div
                aria-hidden="true"
                className="col-span-3 aspect-[3/4] rounded-card bg-gradient-to-b from-accent/70 to-accent/30 shadow-card"
              />
              <div
                aria-hidden="true"
                className="col-span-2 mt-12 aspect-[3/4] rounded-card bg-gradient-to-b from-primary to-primary-hover shadow-card"
              />
            </div>
          </Reveal>
          {c.badgeValue && (
            <ExperienceTarget id="about-badge" className="absolute -bottom-5 start-6">
              <Card className="p-4">
                <p className="font-heading text-h3 font-bold text-ink">
                  {c.badgeValue}
                </p>
                <p className="text-sm text-muted">{c.badgeLabel}</p>
              </Card>
            </ExperienceTarget>
          )}
        </ExperienceTarget>

        <ExperienceTarget id="about-content" as="div" className="order-1 lg:order-2">
          <Reveal anim={staggerChild(anim, 1)}>
            {c.eyebrow && <Badge>{c.eyebrow}</Badge>}
            <h2 className="mt-3 text-h2 text-ink">{c.title}</h2>
            {c.text && <p className="mt-5 text-lead text-muted">{c.text}</p>}

            {c.points.length > 0 && (
              <ul className="mt-8 space-y-4">
                {c.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-3" style={staggerStyle(i)}>
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconCheck className="size-3.5" />
                    </span>
                    <span className="text-ink">{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {c.ctaLabel && (
              <ExperienceTarget id="about-cta" as="div" className="mt-9">
                <Button variant="outline" href={c.ctaHref}>
                  {c.ctaLabel}
                </Button>
              </ExperienceTarget>
            )}
          </Reveal>
        </ExperienceTarget>
      </div>
    </Section>
  );
}

export const aboutBlock: BlockDef = {
  type: "about",
  label: "אודות / הגישה שלנו",
  description: "טקסט מסביר עם רשימת נקודות וויזואל לצידו",
  component: About,
  anchor: "about",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת" },
    { key: "text", type: "textarea", label: "פסקת פתיחה" },
    {
      key: "points",
      type: "strings",
      label: "נקודות בתבליט",
      itemLabel: "נקודה",
    },
    { key: "ctaLabel", type: "text", label: "כפתור — טקסט" },
    { key: "ctaHref", type: "text", label: "כפתור — קישור" },
    { key: "badgeValue", type: "text", label: "כרטיס צף — מספר" },
    { key: "badgeLabel", type: "text", label: "כרטיס צף — הסבר" },
    ...ANIM_FIELDS,
  ],
};

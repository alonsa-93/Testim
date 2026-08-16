import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/fx/reveal";
import { ExperienceTarget } from "@/components/experience/experience-target";
import { ANIM_FIELDS, resolveBlockAnim, staggerChild } from "@/lib/effects";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

interface StepsContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Array<{ title: string; text: string }>;
}

const defaults: StepsContent = {
  eyebrow: "איך זה עובד",
  title: "ארבעה שלבים, בלי הפתעות",
  subtitle: "כל שלב מסתיים בתוצר ברור שאתם מאשרים לפני שממשיכים הלאה.",
  items: [
    {
      title: "פגישת היכרות",
      text: "נכיר אתכם ואת הבית, נבין צרכים ותקציב ונצא עם כיוון ראשוני.",
    },
    {
      title: "תכנון וקונספט",
      text: "תוכניות, הדמיות ומפרט חומרים — עד שהכול מרגיש בדיוק נכון.",
    },
    {
      title: "ביצוע ופיקוח",
      text: "אנחנו מול הקבלן והספקים, עם עדכון שבועי מסודר אליכם.",
    },
    {
      title: "מסירה",
      text: "סבב ליקויים, סטיילינג אחרון ומפתח ביד — מוכנים להיכנס.",
    },
  ],
};

function Steps({
  content,
  anchor,
  theme,
}: {
  content: BlockContent;
  anchor?: string;
  theme?: Theme;
}) {
  const c = { ...defaults, ...content } as StepsContent;
  const anim = resolveBlockAnim(theme?.effects, content);

  return (
    <Section id={anchor ?? "steps"}>
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {c.items.map((s, i) => (
          <li key={i} className="relative border-t-2 border-line pt-6">
            {/* ExperienceTarget עוטף מ-*חוץ* ל-Reveal בכוונה: fx-steps-line
                תלוי בסלקטור צאצא [data-animate] .fx-steps-line (globals.css) —
                חייב להישאר בתוך ה-Reveal עצמו, לא מעליו */}
            <ExperienceTarget id={`steps-item-${i + 1}`} as="div">
              <Reveal anim={staggerChild(anim, i)}>
                {/* "קו מצויר": נמתח מ-0 לרוחבו המלא כשהשלב נכנס לתצוגה
                    (fx-steps-line ב-globals.css) במקום סתם להופיע */}
                <span aria-hidden="true" className="fx-steps-line absolute -top-0.5 start-0 h-0.5 bg-accent" />
                <span className="font-heading text-h3 font-bold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-h3 text-ink">{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </Reveal>
            </ExperienceTarget>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export const stepsBlock: BlockDef = {
  type: "steps",
  label: "שלבי תהליך",
  description: "ציר שלבים ממוספר שמסביר איך העבודה מתנהלת",
  component: Steps,
  anchor: "steps",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    {
      key: "items",
      type: "list",
      label: "השלבים",
      itemLabel: "שלב",
      titleKey: "title",
      fields: [
        { key: "title", type: "text", label: "שם השלב" },
        { key: "text", type: "textarea", label: "תיאור" },
      ],
    },
    ...ANIM_FIELDS,
  ],
};

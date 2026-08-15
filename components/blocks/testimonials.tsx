import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { IconStar } from "@/components/icons";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface TestimonialsContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Array<{ quote: string; name: string; role: string }>;
}

const defaults: TestimonialsContent = {
  eyebrow: "לקוחות מספרים",
  title: "הבתים מדברים בעד עצמם",
  subtitle: "מאות משפחות כבר עברו איתנו את הדרך — כך זה נראה מהצד שלהן.",
  items: [
    {
      quote:
        "הגענו עם פינטרסט מבולגן ויצאנו עם בית שכולו אנחנו. כל שקל בתקציב היה מנומק, וכל החלטה הוסברה בסבלנות.",
      name: "נועה ואיתי ברק",
      role: "שיפוץ דירת 4 חדרים, רמת גן",
    },
    {
      quote:
        "הפיקוח על הקבלן שווה את הכול. בעיות שהיו תוקעות אותנו שבועות נסגרו בשיחת טלפון אחת. עמדנו בלוח הזמנים — וזה נס.",
      name: "משפחת לוי",
      role: "בניית בית פרטי, פרדס חנה",
    },
    {
      quote:
        "חששתי שמעצבת תכתיב לי סגנון. קרה ההפך — קיבלתי בית שמרגיש שלי, רק מוקפד פי מאה. ממליצה בלב שלם.",
      name: "דנה שרון",
      role: "עיצוב פנים לדירת גג, חיפה",
    },
  ],
};

/** ראשי תיבות עבריים לשם, לשימוש כאווטאר */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function Testimonials({
  content,
  anchor,
}: {
  content: BlockContent;
  anchor?: string;
}) {
  const c = { ...defaults, ...content } as TestimonialsContent;

  return (
    <Section id={anchor ?? "testimonials"} className="bg-surface/60">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <div className="grid gap-6 md:grid-cols-3">
        {c.items.map((t, i) => (
          <Card key={i} className="flex flex-col p-7">
            <div className="flex gap-1 text-accent" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, j) => (
                <IconStar key={j} className="size-4" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-ink">״{t.quote}״</blockquote>
            <footer className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-on-primary"
              >
                {initials(t.name)}
              </span>
              <div>
                <p className="font-semibold text-ink">{t.name}</p>
                <p className="text-sm text-muted">{t.role}</p>
              </div>
            </footer>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export const testimonialsBlock: BlockDef = {
  type: "testimonials",
  label: "המלצות לקוחות",
  description: "שלושה ציטוטים עם שם, תפקיד ודירוג כוכבים",
  component: Testimonials,
  anchor: "testimonials",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    {
      key: "items",
      type: "list",
      label: "ההמלצות",
      itemLabel: "המלצה",
      titleKey: "name",
      fields: [
        { key: "quote", type: "textarea", label: "הציטוט" },
        { key: "name", type: "text", label: "שם הממליץ" },
        { key: "role", type: "text", label: "פרטי הפרויקט" },
      ],
    },
  ],
};

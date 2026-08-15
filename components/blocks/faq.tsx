import { Section, SectionHeading } from "@/components/ui/section";
import { IconChevronDown } from "@/components/icons";
import { Reveal } from "@/components/fx/reveal";
import { ANIM_FIELDS, resolveBlockAnim, staggerChild } from "@/lib/effects";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

interface FaqContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Array<{ q: string; a: string }>;
}

const defaults: FaqContent = {
  eyebrow: "שאלות נפוצות",
  title: "כל מה שרציתם לדעת",
  subtitle: "לא מצאתם תשובה? השאירו פרטים ונחזור אליכם עוד היום.",
  items: [
    {
      q: "כמה זמן לוקח פרויקט עיצוב מלא?",
      a: "תכנון אורך בדרך כלל 6–10 שבועות, וביצוע 3–5 חודשים, תלוי בהיקף. בפגישת ההיכרות תקבלו לוח זמנים מפורט לפרויקט שלכם — ואנחנו מתחייבים אליו בכתב.",
    },
    {
      q: "אפשר לעבוד איתכם גם עם קבלן שכבר בחרנו?",
      a: "בהחלט. נשמח להכיר אותו, ליישר קו על התוכניות והמפרט, ולפקח על הביצוע כרגיל. אם עוד אין לכם קבלן — נחבר אתכם לקבלנים שאנחנו עובדים איתם שנים.",
    },
    {
      q: "מה קורה אם נחרוג מהתקציב?",
      a: "בונים את התקציב יחד כבר בשלב התכנון, כולל רזרבה ייעודית להפתעות. כל שינוי מתומחר ומאושר על ידכם מראש — כך שאין הפתעות בסוף הדרך.",
    },
    {
      q: "אתם עובדים גם מחוץ למרכז?",
      a: "כן. הסטודיו יושב בתל אביב אבל אנחנו מלווים פרויקטים בכל הארץ. פגישות תכנון אפשר לקיים גם בווידאו, ואת הביקורים בשטח אנחנו מתאמים מראש.",
    },
    {
      q: "האם אתם מטפלים גם בהיתרי בנייה?",
      a: "כשנדרש היתר, אנחנו מכינים את התוכניות ומנהלים את התהליך מול הרשויות יחד עם יועצים מוסמכים, כך שהכול מתקדם במסלול אחד מסודר.",
    },
  ],
};

function Faq({
  content,
  anchor,
  theme,
}: {
  content: BlockContent;
  anchor?: string;
  theme?: Theme;
}) {
  const c = { ...defaults, ...content } as FaqContent;
  const anim = resolveBlockAnim(theme?.effects, content);

  return (
    <Section id={anchor ?? "faq"} className="bg-surface/60">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <div className="mx-auto max-w-3xl">
        {c.items.map((f, i) => (
          <Reveal key={i} anim={staggerChild(anim, i)}>
            <details name="faq" className="group border-b border-line py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <IconChevronDown className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 pe-9 text-muted">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export const faqBlock: BlockDef = {
  type: "faq",
  label: "שאלות נפוצות",
  description: "אקורדיון שאלה-תשובה שנפתח בלחיצה",
  component: Faq,
  anchor: "faq",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    {
      key: "items",
      type: "list",
      label: "השאלות",
      itemLabel: "שאלה",
      titleKey: "q",
      fields: [
        { key: "q", type: "text", label: "השאלה" },
        { key: "a", type: "textarea", label: "התשובה" },
      ],
    },
    ...ANIM_FIELDS,
  ],
};

import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { getIcon } from "@/components/icon-registry";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface FeaturesContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Array<{ icon: string; title: string; text: string }>;
}

const defaults: FeaturesContent = {
  eyebrow: "מה אנחנו עושים",
  title: "כל השירותים תחת קורת גג אחת",
  subtitle: "צוות אחד מלווה אתכם מהרעיון ועד המפתח — בלי ליפול בין הכיסאות.",
  items: [
    {
      icon: "ruler",
      title: "תכנון אדריכלי",
      text: "תוכניות עבודה מדויקות שמנצלות כל סנטימטר — חלוקת חללים, זרימה ואור טבעי.",
    },
    {
      icon: "sofa",
      title: "עיצוב פנים מלא",
      text: "קונספט עיצובי שלם: ריהוט, טקסטיל, צבע וסטיילינג שמתחברים לסיפור אחד.",
    },
    {
      icon: "bulb",
      title: "תאורה וחומרים",
      text: "בחירת חומרים וגופי תאורה שמחזיקים שנים ונראים מצוין גם בתקציב שפוי.",
    },
    {
      icon: "wrench",
      title: "ליווי ביצוע ופיקוח",
      text: "אנחנו מול הקבלן והספקים — לוחות זמנים, בקרת איכות ופתרון בעיות בשטח.",
    },
    {
      icon: "home",
      title: "שיפוץ והרחבה",
      text: "התחדשות של בית קיים: היתרים, קונסטרוקציה ותכנון שמכבד את מה שכבר יש.",
    },
    {
      icon: "sparkles",
      title: "הום סטיילינג",
      text: "מקצה קצר וממוקד שמרים את הבית לפני כניסה, אירוח או צילום למכירה.",
    },
  ],
};

function Features({
  content,
  anchor,
}: {
  content: BlockContent;
  anchor?: string;
}) {
  const c = { ...defaults, ...content } as FeaturesContent;

  return (
    <Section id={anchor ?? "features"} className="bg-surface/60">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {c.items.map((f, i) => {
          const Icon = getIcon(f.icon);
          return (
            <Card key={i} className="p-7">
              <div className="flex size-12 items-center justify-center rounded-field bg-primary/10 text-primary">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-h3 text-ink">{f.title}</h3>
              <p className="mt-2.5 text-muted">{f.text}</p>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

export const featuresBlock: BlockDef = {
  type: "features",
  label: "שירותים / יתרונות",
  description: "רשת כרטיסים עם אייקון, כותרת והסבר קצר",
  component: Features,
  anchor: "features",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    {
      key: "items",
      type: "list",
      label: "הכרטיסים",
      itemLabel: "שירות",
      titleKey: "title",
      fields: [
        { key: "icon", type: "icon", label: "אייקון" },
        { key: "title", type: "text", label: "כותרת" },
        { key: "text", type: "textarea", label: "תיאור" },
      ],
    },
  ],
};

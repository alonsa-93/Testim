import type { ComponentType, SVGProps } from "react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import {
  IconBulb,
  IconHome,
  IconRuler,
  IconSofa,
  IconSparkles,
  IconWrench,
} from "@/components/icons";

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
};

const features: Feature[] = [
  {
    icon: IconRuler,
    title: "תכנון אדריכלי",
    text: "תוכניות עבודה מדויקות שמנצלות כל סנטימטר — חלוקת חללים, זרימה ואור טבעי.",
  },
  {
    icon: IconSofa,
    title: "עיצוב פנים מלא",
    text: "קונספט עיצובי שלם: ריהוט, טקסטיל, צבע וסטיילינג שמתחברים לסיפור אחד.",
  },
  {
    icon: IconBulb,
    title: "תאורה וחומרים",
    text: "בחירת חומרים וגופי תאורה שמחזיקים שנים ונראים מצוין גם בתקציב שפוי.",
  },
  {
    icon: IconWrench,
    title: "ליווי ביצוע ופיקוח",
    text: "אנחנו מול הקבלן והספקים — לוחות זמנים, בקרת איכות ופתרון בעיות בשטח.",
  },
  {
    icon: IconHome,
    title: "שיפוץ והרחבה",
    text: "התחדשות של בית קיים: היתרים, קונסטרוקציה ותכנון שמכבד את מה שכבר יש.",
  },
  {
    icon: IconSparkles,
    title: "הום סטיילינג",
    text: "מקצה קצר וממוקד שמרים את הבית לפני כניסה, אירוח או צילום למכירה.",
  },
];

export function Features() {
  return (
    <Section id="features" className="bg-surface/60">
      <SectionHeading
        eyebrow="מה אנחנו עושים"
        title="כל השירותים תחת קורת גג אחת"
        subtitle="צוות אחד מלווה אתכם מהרעיון ועד המפתח — בלי ליפול בין הכיסאות."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-7">
            <div className="flex size-12 items-center justify-center rounded-field bg-primary/10 text-primary">
              <f.icon className="size-6" />
            </div>
            <h3 className="mt-5 text-h3 text-ink">{f.title}</h3>
            <p className="mt-2.5 text-muted">{f.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

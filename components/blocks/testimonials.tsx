import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { IconStar } from "@/components/icons";

const testimonials = [
  {
    quote:
      "הגענו עם פינטרסט מבולגן ויצאנו עם בית שכולו אנחנו. כל שקל בתקציב היה מנומק, וכל החלטה הוסברה בסבלנות.",
    name: "נועה ואיתי ברק",
    role: "שיפוץ דירת 4 חדרים, רמת גן",
    initials: "נא",
  },
  {
    quote:
      "הפיקוח על הקבלן שווה את הכול. בעיות שהיו תוקעות אותנו שבועות נסגרו בשיחת טלפון אחת. עמדנו בלוח הזמנים — וזה נס.",
    name: "משפחת לוי",
    role: "בניית בית פרטי, פרדס חנה",
    initials: "מל",
  },
  {
    quote:
      "חששתי שמעצבת תכתיב לי סגנון. קרה ההפך — קיבלתי בית שמרגיש שלי, רק מוקפד פי מאה. ממליצה בלב שלם.",
    name: "דנה שרון",
    role: "עיצוב פנים לדירת גג, חיפה",
    initials: "דש",
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials" className="bg-surface/60">
      <SectionHeading
        eyebrow="לקוחות מספרים"
        title="הבתים מדברים בעד עצמם"
        subtitle="מאות משפחות כבר עברו איתנו את הדרך — כך זה נראה מהצד שלהן."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="flex flex-col p-7">
            <div className="flex gap-1 text-accent" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar key={i} className="size-4" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-ink">
              ״{t.quote}״
            </blockquote>
            <footer className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-full bg-primary font-bold text-on-primary"
              >
                {t.initials}
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

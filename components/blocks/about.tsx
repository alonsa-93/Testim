import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/icons";

const points = [
  "פגישת היכרות בבית שלכם — מבינים איך אתם באמת חיים",
  "תקציב שקוף מהיום הראשון, בלי הפתעות בסוף",
  "ספק אחד מולכם: אנחנו מנהלים את כל בעלי המקצוע",
  "עדכון שבועי מסודר עם תמונות והחלטות להמשך",
];

export function About() {
  return (
    <Section id="about">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* קומפוזיציה ויזואלית דקורטיבית */}
        <div className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:max-w-none">
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
          <Card className="absolute -bottom-5 start-6 p-4">
            <p className="font-heading text-h3 font-bold text-ink">4–6 חודשים</p>
            <p className="text-sm text-muted">משך פרויקט ממוצע, מתכנון למפתח</p>
          </Card>
        </div>

        <div className="order-1 lg:order-2">
          <Badge>הגישה שלנו</Badge>
          <h2 className="mt-3 text-h2 text-ink">
            שקט נפשי הוא חלק מהמפרט הטכני
          </h2>
          <p className="mt-5 text-lead text-muted">
            שיפוץ או בנייה הם מהפרויקטים הגדולים של החיים — ולכן בנינו תהליך
            שמוריד מכם את כאב הראש: החלטות מסודרות, לוח זמנים ברור ואדם אחד
            שאחראי על הכול.
          </p>

          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconCheck className="size-3.5" />
                </span>
                <span className="text-ink">{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Button variant="outline" href="#contact">
              לשיחת היכרות ללא עלות
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

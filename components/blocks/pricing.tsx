import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/icons";

const plans = [
  {
    name: "ייעוץ ממוקד",
    price: "‏1,900 ₪",
    priceNote: "פגישה חד־פעמית",
    description: "כשצריך כיוון ברור לפני שמתחילים",
    features: [
      "פגישת עבודה של שעתיים בבית",
      "אבחון חללים והמלצות מעשיות",
      "לוח השראה וכיוון עיצובי",
      "סיכום כתוב עם רשימת צעדים",
    ],
    highlighted: false,
    cta: "לתיאום פגישה",
  },
  {
    name: "תכנון מלא",
    price: "‏9,500 ₪",
    priceNote: "החל מ־, לפי היקף",
    description: "חבילת התכנון המבוקשת שלנו",
    features: [
      "תוכניות אדריכליות מלאות לביצוע",
      "הדמיות תלת־ממד לחללים המרכזיים",
      "מפרט חומרים, ריהוט ותאורה",
      "ליווי בבחירת ספקים וקבלן",
      "שלוש פגישות עדכון לאורך הדרך",
    ],
    highlighted: true,
    cta: "בואו נתחיל",
  },
  {
    name: "פרויקט מקיף",
    price: "הצעה אישית",
    priceNote: "תכנון + ליווי ביצוע מלא",
    description: "אנחנו מנהלים הכול — אתם רק בוחרים",
    features: [
      "כל מה שבמסלול התכנון המלא",
      "ניהול ופיקוח שוטף באתר",
      "ניהול תקציב ולוחות זמנים",
      "מסירה מסודרת עד הפרט האחרון",
    ],
    highlighted: false,
    cta: "לקבלת הצעה",
  },
];

export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="מסלולים ומחירים"
        title="בוחרים כמה ליווי מתאים לכם"
        subtitle="שקיפות מלאה: אלו נקודות הפתיחה, והצעת המחיר הסופית נבנית לפי היקף הפרויקט."
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={
              p.highlighted
                ? "relative border-primary p-8 ring-1 ring-primary"
                : "p-8"
            }
          >
            {p.highlighted && (
              <Badge
                variant="accent"
                className="absolute -top-3.5 start-6"
              >
                הכי מבוקש
              </Badge>
            )}
            <h3 className="text-h3 text-ink">{p.name}</h3>
            <p className="mt-1 text-sm text-muted">{p.description}</p>
            <p className="mt-5 font-heading text-h2 font-bold text-ink">
              {p.price}
            </p>
            <p className="text-sm text-muted">{p.priceNote}</p>

            <ul className="mt-6 space-y-3 border-t border-line pt-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <IconCheck className="mt-1 size-4 shrink-0 text-primary" />
                  <span className="text-sm text-ink">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button
                href="#contact"
                variant={p.highlighted ? "primary" : "outline"}
                className="w-full"
              >
                {p.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        המחירים כוללים מע״מ. ניתן לשלם בפריסה של עד 6 תשלומים.
      </p>
    </Section>
  );
}

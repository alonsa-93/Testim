import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/icons";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface PricingContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlightLabel: string;
  plans: Array<{
    name: string;
    description: string;
    price: string;
    priceNote: string;
    features: string[];
    highlighted: boolean;
    cta: string;
    ctaHref: string;
  }>;
  note: string;
}

const defaults: PricingContent = {
  eyebrow: "מסלולים ומחירים",
  title: "בוחרים כמה ליווי מתאים לכם",
  subtitle:
    "שקיפות מלאה: אלו נקודות הפתיחה, והצעת המחיר הסופית נבנית לפי היקף הפרויקט.",
  highlightLabel: "הכי מבוקש",
  plans: [
    {
      name: "ייעוץ ממוקד",
      description: "כשצריך כיוון ברור לפני שמתחילים",
      price: "‏1,900 ₪",
      priceNote: "פגישה חד־פעמית",
      features: [
        "פגישת עבודה של שעתיים בבית",
        "אבחון חללים והמלצות מעשיות",
        "לוח השראה וכיוון עיצובי",
        "סיכום כתוב עם רשימת צעדים",
      ],
      highlighted: false,
      cta: "לתיאום פגישה",
      ctaHref: "#contact",
    },
    {
      name: "תכנון מלא",
      description: "חבילת התכנון המבוקשת שלנו",
      price: "‏9,500 ₪",
      priceNote: "החל מ־, לפי היקף",
      features: [
        "תוכניות אדריכליות מלאות לביצוע",
        "הדמיות תלת־ממד לחללים המרכזיים",
        "מפרט חומרים, ריהוט ותאורה",
        "ליווי בבחירת ספקים וקבלן",
        "שלוש פגישות עדכון לאורך הדרך",
      ],
      highlighted: true,
      cta: "בואו נתחיל",
      ctaHref: "#contact",
    },
    {
      name: "פרויקט מקיף",
      description: "אנחנו מנהלים הכול — אתם רק בוחרים",
      price: "הצעה אישית",
      priceNote: "תכנון + ליווי ביצוע מלא",
      features: [
        "כל מה שבמסלול התכנון המלא",
        "ניהול ופיקוח שוטף באתר",
        "ניהול תקציב ולוחות זמנים",
        "מסירה מסודרת עד הפרט האחרון",
      ],
      highlighted: false,
      cta: "לקבלת הצעה",
      ctaHref: "#contact",
    },
  ],
  note: "המחירים כוללים מע״מ. ניתן לשלם בפריסה של עד 6 תשלומים.",
};

function Pricing({ content }: { content: BlockContent }) {
  const c = { ...defaults, ...content } as PricingContent;

  return (
    <Section id="pricing">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {c.plans.map((p, i) => (
          <Card
            key={i}
            className={
              p.highlighted
                ? "relative border-primary p-8 ring-1 ring-primary"
                : "p-8"
            }
          >
            {p.highlighted && c.highlightLabel && (
              <Badge variant="accent" className="absolute -top-3.5 start-6">
                {c.highlightLabel}
              </Badge>
            )}
            <h3 className="text-h3 text-ink">{p.name}</h3>
            <p className="mt-1 text-sm text-muted">{p.description}</p>
            <p className="mt-5 font-heading text-h2 font-bold text-ink">
              {p.price}
            </p>
            <p className="text-sm text-muted">{p.priceNote}</p>

            <ul className="mt-6 space-y-3 border-t border-line pt-6">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <IconCheck className="mt-1 size-4 shrink-0 text-primary" />
                  <span className="text-sm text-ink">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button
                href={p.ctaHref}
                variant={p.highlighted ? "primary" : "outline"}
                className="w-full"
              >
                {p.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {c.note && (
        <p className="mt-8 text-center text-sm text-muted">{c.note}</p>
      )}
    </Section>
  );
}

export const pricingBlock: BlockDef = {
  type: "pricing",
  label: "מחירון / מסלולים",
  description: "כרטיסי מחיר להשוואה, עם אפשרות להדגיש מסלול מומלץ",
  component: Pricing,
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    { key: "highlightLabel", type: "text", label: "תגית המסלול המודגש" },
    {
      key: "plans",
      type: "list",
      label: "המסלולים",
      itemLabel: "מסלול",
      titleKey: "name",
      fields: [
        { key: "name", type: "text", label: "שם המסלול" },
        { key: "description", type: "text", label: "משפט תיאור" },
        { key: "price", type: "text", label: "מחיר" },
        { key: "priceNote", type: "text", label: "הערה מתחת למחיר" },
        { key: "features", type: "strings", label: "מה כלול", itemLabel: "שורה" },
        { key: "highlighted", type: "boolean", label: "להדגיש כמסלול מומלץ" },
        { key: "cta", type: "text", label: "כפתור — טקסט" },
        { key: "ctaHref", type: "text", label: "כפתור — קישור" },
      ],
    },
    { key: "note", type: "text", label: "הערה בתחתית" },
  ],
};

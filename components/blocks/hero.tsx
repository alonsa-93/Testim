import { Container } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconShield, IconStar } from "@/components/icons";
import { renderEmphasis } from "@/lib/rich-text";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  stats: Array<{ value: string; label: string }>;
  quote: string;
  quoteAuthor: string;
  badge: string;
}

const defaults: HeroContent = {
  eyebrow: "סטודיו בוטיק לאדריכלות ועיצוב פנים",
  title: "בית שמרגיש **בדיוק** כמו שדמיינתם",
  subtitle:
    "מהשרטוט הראשון ועד הרגע שבו מסובבים את המפתח — אנחנו מתכננים, מלווים ומפקחים, כדי שהתהליך יהיה רגוע והתוצאה מדויקת.",
  primaryCta: "לתיאום פגישת ייעוץ",
  primaryHref: "#contact",
  secondaryCta: "איך זה עובד",
  secondaryHref: "#about",
  stats: [
    { value: "+12", label: "שנות ניסיון" },
    { value: "+240", label: "פרויקטים שהושלמו" },
    { value: "98%", label: "לקוחות ממליצים" },
  ],
  quote: "ליווי צמוד מהיום הראשון. הבית יצא חלומי.",
  quoteAuthor: "מיכל ועומר, תל אביב",
  badge: "אחריות מלאה לפרויקט",
};

function Hero({
  content,
  anchor,
}: {
  content: BlockContent;
  anchor?: string;
}) {
  const c = { ...defaults, ...content } as HeroContent;

  return (
    <div id={anchor ?? "top"} className="relative overflow-hidden">
      {/* כתמי צבע דקורטיביים ברקע */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 start-[-10%] size-[480px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 end-[-12%] size-[420px] rounded-full bg-accent/15 blur-3xl"
      />

      <Container className="grid items-center gap-14 py-section lg:grid-cols-2">
        <div>
          {c.eyebrow && <Badge>{c.eyebrow}</Badge>}
          <h1 className="mt-5 text-display text-ink">
            {renderEmphasis(c.title)}
          </h1>
          {c.subtitle && (
            <p className="mt-6 max-w-xl text-lead text-muted">{c.subtitle}</p>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-4">
            {c.primaryCta && (
              <Button size="lg" href={c.primaryHref}>
                {c.primaryCta}
              </Button>
            )}
            {c.secondaryCta && (
              <Button size="lg" variant="outline" href={c.secondaryHref}>
                {c.secondaryCta}
              </Button>
            )}
          </div>

          {c.stats.length > 0 && (
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8">
              {c.stats.map((s, i) => (
                <div key={i} className="border-s-2 border-accent ps-4">
                  <dt className="order-2 text-sm text-muted">{s.label}</dt>
                  <dd className="font-heading text-h3 font-bold text-ink">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* קומפוזיציה ויזואלית דקורטיבית — מחליפה תמונת הירו */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden="true"
            className="aspect-[4/5] w-full rounded-card bg-gradient-to-br from-primary to-primary-hover p-6 shadow-card"
          >
            <div className="grid h-full grid-cols-2 grid-rows-3 gap-4">
              <div className="row-span-2 rounded-field border border-on-primary/15 bg-on-primary/10" />
              <div className="rounded-field border border-on-primary/15 bg-accent/50" />
              <div className="rounded-field border border-on-primary/15 bg-on-primary/10" />
              <div className="col-span-2 rounded-field border border-on-primary/15 bg-on-primary/5" />
            </div>
          </div>

          {c.quote && (
            <Card className="absolute -bottom-6 -start-4 w-64 p-4 md:-start-8">
              <div className="flex gap-1 text-accent" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} className="size-4" />
                ))}
              </div>
              <p className="mt-2 text-sm text-ink">״{c.quote}״</p>
              <p className="mt-1.5 text-xs font-semibold text-muted">
                {c.quoteAuthor}
              </p>
            </Card>
          )}

          {c.badge && (
            <Card className="absolute -top-4 end-2 flex items-center gap-2.5 p-3 md:-end-4">
              <IconShield className="size-5 text-primary" />
              <span className="text-sm font-semibold text-ink">{c.badge}</span>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
}

export const heroBlock: BlockDef = {
  type: "hero",
  label: "כותרת ראשית (Hero)",
  description: "החלק העליון של הדף — הכותרת הגדולה, המשפט המסביר וכפתורי הפעולה",
  component: Hero,
  anchor: "top",
  defaults: defaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    {
      key: "title",
      type: "textarea",
      label: "כותרת ראשית",
      hint: "מילה בין ** ** תקבל את צבע המבטא — למשל: בית **מושלם**",
    },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    { key: "primaryCta", type: "text", label: "כפתור ראשי — טקסט" },
    { key: "primaryHref", type: "text", label: "כפתור ראשי — קישור" },
    { key: "secondaryCta", type: "text", label: "כפתור משני — טקסט" },
    { key: "secondaryHref", type: "text", label: "כפתור משני — קישור" },
    {
      key: "stats",
      type: "list",
      label: "מספרים מרשימים",
      itemLabel: "נתון",
      titleKey: "label",
      fields: [
        { key: "value", type: "text", label: "המספר" },
        { key: "label", type: "text", label: "מה הוא מייצג" },
      ],
    },
    { key: "quote", type: "textarea", label: "ציטוט צף" },
    { key: "quoteAuthor", type: "text", label: "מי אמר את הציטוט" },
    { key: "badge", type: "text", label: "תגית צפה עליונה" },
  ],
};

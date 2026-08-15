import { Container } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconShield, IconStar } from "@/components/icons";

const stats = [
  { value: "+12", label: "שנות ניסיון" },
  { value: "+240", label: "פרויקטים שהושלמו" },
  { value: "98%", label: "לקוחות ממליצים" },
];

export function Hero() {
  return (
    <div id="top" className="relative overflow-hidden">
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
          <Badge>סטודיו בוטיק לאדריכלות ועיצוב פנים</Badge>
          <h1 className="mt-5 text-display text-ink">
            בית שמרגיש{" "}
            <span className="text-accent">בדיוק</span>{" "}
            כמו שדמיינתם
          </h1>
          <p className="mt-6 max-w-xl text-lead text-muted">
            מהשרטוט הראשון ועד הרגע שבו מסובבים את המפתח — אנחנו מתכננים,
            מלווים ומפקחים, כדי שהתהליך יהיה רגוע והתוצאה מדויקת.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" href="#contact">
              לתיאום פגישת ייעוץ
            </Button>
            <Button size="lg" variant="outline" href="#about">
              איך זה עובד
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {stats.map((s) => (
              <div key={s.label} className="border-s-2 border-accent ps-4">
                <dt className="order-2 text-sm text-muted">{s.label}</dt>
                <dd className="font-heading text-h3 font-bold text-ink">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
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

          <Card className="absolute -bottom-6 -start-4 w-64 p-4 md:-start-8">
            <div className="flex gap-1 text-accent" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar key={i} className="size-4" />
              ))}
            </div>
            <p className="mt-2 text-sm text-ink">
              ״ליווי צמוד מהיום הראשון. הבית יצא חלומי.״
            </p>
            <p className="mt-1.5 text-xs font-semibold text-muted">
              מיכל ועומר, תל אביב
            </p>
          </Card>

          <Card className="absolute -top-4 end-2 flex items-center gap-2.5 p-3 md:-end-4">
            <IconShield className="size-5 text-primary" />
            <span className="text-sm font-semibold text-ink">
              אחריות מלאה לפרויקט
            </span>
          </Card>
        </div>
      </Container>
    </div>
  );
}

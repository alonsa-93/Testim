import Link from "next/link";
import { Container } from "@/components/ui/section";
import { IconMail, IconMapPin, IconPhone } from "@/components/icons";
import { Reveal } from "@/components/fx/reveal";
import { resolveBlockAnim } from "@/lib/effects";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

interface FooterContent {
  brand: string;
  about: string;
  navTitle: string;
  links: Array<{ label: string; href: string }>;
  contactTitle: string;
  phone: string;
  email: string;
  address: string;
}

const defaults: FooterContent = {
  brand: "סטודיו אלון",
  about:
    "סטודיו בוטיק לאדריכלות ועיצוב פנים. מתכננים, מלווים ומפקחים — כדי שהבית שתקבלו יהיה בדיוק הבית שרציתם.",
  navTitle: "ניווט מהיר",
  links: [
    { label: "שירותים", href: "#features" },
    { label: "הגישה שלנו", href: "#about" },
    { label: "מסלולים", href: "#pricing" },
    { label: "שאלות נפוצות", href: "#faq" },
    { label: "יצירת קשר", href: "#contact" },
  ],
  contactTitle: "יצירת קשר",
  phone: "050-000-0000",
  email: "hello@studio-alon.co.il",
  address: "שדרות רוטשילד 1, תל אביב",
};

function Footer({ content, theme }: { content: BlockContent; theme?: Theme }) {
  const c = { ...defaults, ...content } as FooterContent;
  const year = new Date().getFullYear();
  // הפוטר יושב תמיד בתחתית העמוד — נכנס בעדינות רק כשמגיעים אליו בגלילה
  const anim = resolveBlockAnim(theme?.effects, content);

  return (
    <footer className="border-t border-line bg-surface">
      <Reveal anim={anim}>
        <Container className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1.2fr]">
          <div>
            <p className="flex items-center gap-2.5 font-heading text-xl font-bold text-ink">
              <span className="size-3 rounded-sm bg-accent" aria-hidden="true" />
              {c.brand}
            </p>
            <p className="mt-4 max-w-sm text-sm text-muted">{c.about}</p>
          </div>

          <nav aria-label="ניווט תחתון">
            <p className="text-sm font-bold text-ink">{c.navTitle}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l, i) => (
                <li key={i}>
                  <a
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-sm font-bold text-ink">{c.contactTitle}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {c.phone && (
                <li className="flex items-center gap-2">
                  <IconPhone className="size-4 shrink-0" />
                  <a
                    href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                    className="hover:text-ink"
                    dir="ltr"
                  >
                    {c.phone}
                  </a>
                </li>
              )}
              {c.email && (
                <li className="flex items-center gap-2">
                  <IconMail className="size-4 shrink-0" />
                  <a href={`mailto:${c.email}`} className="hover:text-ink" dir="ltr">
                    {c.email}
                  </a>
                </li>
              )}
              {c.address && (
                <li className="flex items-center gap-2">
                  <IconMapPin className="size-4 shrink-0" />
                  {c.address}
                </li>
              )}
            </ul>
          </div>
        </Container>
      </Reveal>

      <div className="border-t border-line">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-muted">
          <p>
            © {year} {c.brand} · כל הזכויות שמורות
          </p>
          <div className="flex gap-5">
            <Link href="/accessibility" className="hover:text-ink">
              הצהרת נגישות
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              מדיניות פרטיות
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export const footerBlock: BlockDef = {
  type: "footer",
  label: "פוטר",
  description: "תחתית העמוד: תיאור קצר, ניווט, פרטי קשר וקישורים משפטיים",
  component: Footer,
  defaults: defaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "brand", type: "text", label: "שם העסק" },
    { key: "about", type: "textarea", label: "משפט תיאור" },
    { key: "navTitle", type: "text", label: "כותרת עמודת הניווט" },
    {
      key: "links",
      type: "list",
      label: "קישורי ניווט",
      itemLabel: "קישור",
      titleKey: "label",
      fields: [
        { key: "label", type: "text", label: "טקסט" },
        { key: "href", type: "text", label: "יעד" },
      ],
    },
    { key: "contactTitle", type: "text", label: "כותרת עמודת הקשר" },
    { key: "phone", type: "text", label: "טלפון" },
    { key: "email", type: "text", label: "אימייל" },
    { key: "address", type: "text", label: "כתובת" },
  ],
};

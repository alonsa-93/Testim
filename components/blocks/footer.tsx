import Link from "next/link";
import { Container } from "@/components/ui/section";
import { IconMail, IconMapPin, IconPhone } from "@/components/icons";

const navLinks = [
  { href: "#features", label: "שירותים" },
  { href: "#about", label: "הגישה שלנו" },
  { href: "#pricing", label: "מסלולים" },
  { href: "#faq", label: "שאלות נפוצות" },
  { href: "#contact", label: "יצירת קשר" },
];

export function Footer({ brand = "סטודיו אלון" }: { brand?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1.2fr]">
        <div>
          <p className="flex items-center gap-2.5 font-heading text-xl font-bold text-ink">
            <span className="size-3 rounded-sm bg-accent" aria-hidden="true" />
            {brand}
          </p>
          <p className="mt-4 max-w-sm text-sm text-muted">
            סטודיו בוטיק לאדריכלות ועיצוב פנים. מתכננים, מלווים ומפקחים —
            כדי שהבית שתקבלו יהיה בדיוק הבית שרציתם.
          </p>
        </div>

        <nav aria-label="ניווט תחתון">
          <p className="text-sm font-bold text-ink">ניווט מהיר</p>
          <ul className="mt-4 space-y-2.5">
            {navLinks.map((l) => (
              <li key={l.href}>
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
          <p className="text-sm font-bold text-ink">יצירת קשר</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li className="flex items-center gap-2">
              <IconPhone className="size-4 shrink-0" />
              <a href="tel:0500000000" className="hover:text-ink" dir="ltr">
                050-000-0000
              </a>
            </li>
            <li className="flex items-center gap-2">
              <IconMail className="size-4 shrink-0" />
              <a href="mailto:hello@studio-alon.co.il" className="hover:text-ink" dir="ltr">
                hello@studio-alon.co.il
              </a>
            </li>
            <li className="flex items-center gap-2">
              <IconMapPin className="size-4 shrink-0" />
              שדרות רוטשילד 1, תל אביב
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-muted">
          <p>
            © {year} {brand} · כל הזכויות שמורות
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

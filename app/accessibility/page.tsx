import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "הצהרת נגישות" };

export default function AccessibilityPage() {
  return (
    <main>
      <Section>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-h1 text-ink">הצהרת נגישות</h1>
          <div className="mt-6 rounded-card border border-accent bg-accent/10 p-5 font-semibold text-ink">
            ⚠️ תבנית בלבד — יש להשלים את הפרטים ולקבל אישור מקצועי לפני
            פרסום האתר ללקוח אמיתי.
          </div>
          <div className="mt-8 space-y-4 text-muted">
            <p>
              [שם העסק] פועל להנגשת האתר לאנשים עם מוגבלות, בהתאם לתקנות
              שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
              התשע״ג-2013, ולתקן הישראלי ת״י 5568 ברמה AA.
            </p>
            <p>
              רכיבי המערכת נבנו עם HTML סמנטי, ניווט מקלדת מלא, טבעות פוקוס
              ברורות ובדיקת ניגודיות צבעים מובנית בסטודיו.
            </p>
            <p>
              נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן: [שם רכז/ת הנגישות],
              טלפון [מספר], אימייל [כתובת].
            </p>
            <p>תאריך עדכון ההצהרה: [תאריך]</p>
          </div>
          <Link href="/" className="mt-10 inline-block font-semibold text-primary hover:underline">
            → חזרה לדף הבית
          </Link>
        </div>
      </Section>
    </main>
  );
}

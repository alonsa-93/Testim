import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "מדיניות פרטיות" };

export default function PrivacyPage() {
  return (
    <main>
      <Section>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-h1 text-ink">מדיניות פרטיות</h1>
          <div className="mt-6 rounded-card border border-accent bg-accent/10 p-5 font-semibold text-ink">
            ⚠️ תבנית בלבד — יש להתאים לעסק הספציפי ולקבל ייעוץ משפטי לפני
            פרסום. חוק הגנת הפרטיות (תיקון 13) מחייב התאמה פרטנית.
          </div>
          <div className="mt-8 space-y-4 text-muted">
            <p>
              [שם העסק] מכבד את פרטיות המשתמשים באתר. פרטים שנמסרים בטופס
              יצירת הקשר (שם, טלפון, אימייל ותוכן הפנייה) ישמשו אך ורק לחזרה
              אל הפונה, ולא יועברו לצד שלישי ללא הסכמה.
            </p>
            <p>
              [כאן יש לפרט: אילו נתונים נאספים, היכן נשמרים, לכמה זמן, מי
              הגורם האחראי, ואיך פונים לעיון או מחיקה של המידע.]
            </p>
            <p>
              האתר בגרסתו הנוכחית אינו משתמש בעוגיות מעקב או כלי אנליטיקה.
              אם יתווספו — יש לעדכן מדיניות זו ולהוסיף מנגנון הסכמה.
            </p>
          </div>
          <Link href="/" className="mt-10 inline-block font-semibold text-primary hover:underline">
            → חזרה לדף הבית
          </Link>
        </div>
      </Section>
    </main>
  );
}

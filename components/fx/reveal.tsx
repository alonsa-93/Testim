"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ResolvedAnim } from "@/lib/effects";

/**
 * מנוע ה-reveal: עוטף תוכן ומעורר בו אנימציית כניסה כשהוא נכנס לתצוגה.
 * לא מכיל שום לוגיקה של "מה זה אומר ויזואלית" — זה תפקיד ה-CSS
 * ב-globals.css (data-animate + משתני --anim-*). הרכיב הזה רק:
 *   1. מקבל תצורה שכבר נפתרה על ידי resolveAnim (lib/effects.ts).
 *   2. שם data-animate + משתני CSS מהתצורה.
 *   3. עוקב עם IntersectionObserver ומוסיף data-inview בזמן הנכון.
 * כשאין תצורה (anim=null, כלומר האנימציה כבויה) — מרונדר div רגיל,
 * בלי שום data attribute, כדי לא להשאיר עקבות ב-DOM.
 *
 * שימו לב: אין כאן ענף מיוחד ל-reduced-motion. זה מכוון — מצב ה"מוסתר"
 * ב-CSS מוגדר כולו בתוך @media (prefers-reduced-motion: no-preference)
 * (ראו globals.css), כך שאצל משתמשי reduced-motion ה-opacity/translate
 * המוסתרים אף פעם לא חלים, בלי קשר לערך data-inview. ה-IO ממשיך
 * לרוץ ולסמן data-inview כרגיל — זה תמים ולא משנה כלום ויזואלית —
 * כך שאין צורך ב-setState סינכרוני בגוף ה-effect (רק בתוך קולבק
 * אסינכרוני של IntersectionObserver, כמצופה).
 */

/**
 * דגל בעלות: כש-true, Reveal מוותר על ה-IntersectionObserver העצמאי
 * שלו ומרונדר במצב הסופי ("revealed") מיידית — בלי data-animate/
 * data-inview בכלל. נצרך ע"י components/experience/experience-page.tsx
 * (ExperienceBlockRefLayer) בלבד: כש-block-ref layer בתוך scene של
 * Experience נשלט ע"י Track, ה-Reveal הפנימי של הבלוק (§9.4 archdecision)
 * לא יתחרה איתו על תזמון הכניסה — Track מנצח לפי טבלת התקדימות
 * (docs/architecture-decision-gate.md §2). ברירת המחדל false שומרת על
 * Standard ללא שינוי בכל מקום אחר.
 */
export const RevealManagedContext = createContext(false);

/**
 * עטיפת-component ל-RevealManagedContext.Provider, לא שימוש ישיר ב-
 * `<RevealManagedContext.Provider>` מתוך Server Component: Next.js RSC
 * יודע לסרוק ולקשר ייצוא של component אמיתי ממודול "use client" (בדיוק
 * כמו Reveal עצמו), אבל גישה ל-property (`.Provider`) על אובייקט Context
 * מיוצא, מתוך קובץ Server, לא תמיד נפתרת נכון דרך ה-boundary -- אומת
 * אמפירית ב-`next build` (production prerender של /preview/scroll-experience
 * נכשל עם "Element type is invalid... got: undefined" עד שתוקן לצורה הזו).
 */
export function RevealManaged({ children }: { children: ReactNode }) {
  return <RevealManagedContext.Provider value={true}>{children}</RevealManagedContext.Provider>;
}

export interface RevealProps {
  /** תצורה שכבר נפתרה (תוצאת resolveAnim); null/undefined = בלי אנימציה */
  anim?: ResolvedAnim | null;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ anim, children, className, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const managed = useContext(RevealManagedContext);

  useEffect(() => {
    const el = ref.current;
    if (!el || !anim || managed) return;

    const once = anim.once ?? true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anim, managed]);

  // managed: Track חיצוני (Experience) הוא הבעלים של הכניסה -- מרונדרים
  // כמו anim=null (מצב סופי, בלי data-animate/IO) גם אם anim הועבר.
  if (!anim || managed) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const vars: CSSProperties = {
    ...style,
    "--anim-duration": `${anim.durationMs}ms`,
    "--anim-delay": `${anim.delayMs}ms`,
    "--anim-stagger": `${anim.staggerMs}ms`,
    "--anim-distance": `${anim.distance}px`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      data-animate={anim.type}
      data-inview={inView ? "" : undefined}
      className={className}
      style={vars}
    >
      {children}
    </div>
  );
}

/**
 * הערה (שלב ב'): staggerStyle (--i לילד בתוך קונטיינר עם סטאגר משותף,
 * כמו .split-word) עבר ל-lib/effects.ts. הקובץ הזה נושא "use client",
 * ולכן כל export שלו — כולל פונקציה טהורה בלי hooks — נחשב client
 * reference ולא ניתן לקרוא לו ישירות מרכיבי שרת (רוב הבלוקים).
 * lib/effects.ts הוא מודול רגיל, אז אותה פונקציה בדיוק שם בטוחה
 * לשימוש גם משרת וגם מקליינט.
 */

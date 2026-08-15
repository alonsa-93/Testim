"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

  useEffect(() => {
    const el = ref.current;
    if (!el || !anim) return;

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
  }, [anim]);

  if (!anim) {
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

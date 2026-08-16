"use client";

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { useExperienceRuntime } from "./experience-provider";
import { cn } from "@/lib/cn";

/**
 * עוטף target אחד (docs/experience-audit.md §7, §8). זהו מימוש
 * `<ExperienceTarget id="...">` מהאודיט: נושא `data-experience-target`
 * (זהות בלבד) ואת המחלקה `exp-motion` (בעלות בלעדית על --exp-*).
 *
 * נרשם ל-TargetRegistry דרך useLayoutEffect כדי שה-runtime יראה אותו
 * לפני הפריים הראשון שאחרי mount. אם אין ExperienceProvider מעל
 * (למשל: בלוק רגיל בדף Standard בלי Experience בכלל) — `runtime` הוא
 * null, הרישום מדולג בשקט, וה-wrapper עדיין מרנדר נורמלי: ברירות
 * המחדל של --exp-* ב-CSS (opacity:1, translate:0 וכו') הופכות אותו
 * לבלתי-נראה מבחינה ויזואלית. זו בדיוק הדרישה "התנהגות בלוק קיים
 * ללא שינוי כש-Experience כבוי" (§16 באודיט).
 *
 * `as` פולימורפי (ברירת מחדל div): Phase 5 יכול לבחור span/וכו' כדי
 * לצמצם את ההשפעה על flex/grid קיימים סביב היעד המקורי.
 *
 * `data-scrub`: הוק שכבר שמור בסלקטור כיבוי-התנועה של הסטודיו בלי
 * מפיק (נספח א' באודיט) — עכשיו יש לו אחד. בזמן הקלדה בסטודיו
 * (data-studio-motion="off") היעד קופץ מיידית למצב נייטרלי, אותו
 * דפוס בדיוק כמו [data-animate].
 */
export function ExperienceTarget({
  id,
  as: Tag = "div",
  className,
  children,
}: {
  id: string;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const runtime = useExperienceRuntime();
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !runtime) return;
    runtime.targets.register(id, el);
    return () => runtime.targets.unregister(id);
  }, [runtime, id]);

  return (
    <Tag ref={ref} data-experience-target={id} data-scrub="" className={cn("exp-motion", className)}>
      {children}
    </Tag>
  );
}

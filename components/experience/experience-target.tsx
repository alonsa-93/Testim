"use client";

import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
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
  style,
  managed,
  selected,
  onSelect,
  label,
  children,
}: {
  id: string;
  as?: ElementType;
  className?: string;
  /** מוזג עם ברירות המחדל של .exp-motion -- בעיקר לשימוש ע"י Phase 6 layers (מיקום stage/flow) */
  style?: CSSProperties;
  /**
   * Milestone B4: מסמן `data-experience-managed` — הגנת-CSS כפולה
   * (defense in depth) לצד `RevealManagedContext` (components/fx/reveal.tsx)
   * שכבר מנטרל את ה-IO ברמת ה-JS. נצרך ע"י ExperienceBlockRefLayer בלבד.
   */
  managed?: boolean;
  /**
   * Milestone D1 (בחירה-על-קנבס, docs/studio-ux-simplification.md §3.3):
   * שני ה-props הבאים הם undefined תמיד בדף הציבורי (ExperiencePage לא
   * מעביר אותם) — נצרכים אך ורק ע"י ExperienceLivePreview (הסטודיו).
   * `selected` מוסיף הדגשה חזותית; `onSelect` הופך את ה-target ללחיץ.
   * preventDefault/stopPropagation ב-onClick כאן גם מונעים תופעת-לוואי
   * קיימת-מראש (לא נגרמה ע"י השינוי הזה): קליק על שכבת button/קישור
   * בקנבס היה מנווט בפועל במקום לבחור אותה לעריכה.
   */
  selected?: boolean;
  onSelect?: (id: string) => void;
  /**
   * Milestone E2 (נגישות, docs/rebuild-workplan.md אבן דרך E2): תווית
   * קריאה לאדם ("טקסט — demo-hero-title") לצריכת קורא-מסך במקום מזהה
   * גולמי בלבד. אופציונלי -- בדף הציבורי onSelect תמיד undefined, אז
   * זה ממילא לא נצרך שם.
   */
  label?: string;
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
    <Tag
      ref={ref}
      data-experience-target={id}
      data-scrub=""
      data-experience-managed={managed ? "" : undefined}
      className={cn(
        "exp-motion",
        onSelect && "cursor-pointer outline-2 outline-offset-2",
        onSelect && (selected ? "outline-indigo-500" : "outline-transparent hover:outline-indigo-300"),
        // Milestone E2: focus-visible תמיד מקבל טבעת ברורה משלו, גם כשלא
        // selected/hover -- מקלדת חייבת אינדיקציה עצמאית, לא רק תלויה
        // ב-mouse hover שלעולם לא קורה בניווט מקלדת.
        onSelect && "focus-visible:outline-indigo-500",
        className
      )}
      style={style}
      // Milestone E2 (נגישות, docs/rebuild-workplan.md אבן דרך E2): בחירה-
      // על-קנבס (Milestone D1) הייתה לחיצת עכבר בלבד -- אין דרך מקלדת
      // מקבילה ללחוץ Tab ולבחור שכבה. tabIndex/role/onKeyDown הופכים כל
      // target נבחר ל"כפתור" נגיש: Tab מגיע אליו, Enter/Space בוחרים
      // אותו, בדיוק כמו קליק. undefined תמיד כש-onSelect לא קיים (דף
      // ציבורי/block-ref) -- לא נוסף שום תג נגישות מיותר שם.
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={onSelect ? (label ?? id) : undefined}
      onClick={
        onSelect
          ? (e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(id);
            }
          : undefined
      }
      onKeyDown={
        onSelect
          ? (e: KeyboardEvent) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              onSelect(id);
            }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}

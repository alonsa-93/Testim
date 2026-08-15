import type { CSSProperties } from "react";
import { splitWordsWithEmphasis } from "@/lib/rich-text";

/**
 * מציג טקסט כמילים נפרדות לצורך אנימציית "מילה-מילה" (word-stagger).
 * רכיב שרת רגיל — אין כאן שום אינטראקטיביות; ההפעלה בפועל קורית
 * דרך ההורה (Reveal עם type="word-stagger") ו-CSS ב-globals.css
 * (.split-word עם transition-delay מדורג לפי --i).
 *
 * נגישות: המילים הבודדות aria-hidden (הן דקורטיביות/ויזואליות
 * בלבד), והטקסט המלא והנקי (בלי **) מוצג פעם אחת ב-aria-label על
 * המכל, כך שקוראי מסך מקבלים משפט שלם ולא מילים מפורדות.
 */
export function SplitWords({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = splitWordsWithEmphasis(text);
  return (
    <span role="text" aria-label={text.replace(/\*\*/g, "")} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`split-word${w.emphasis ? " text-accent" : ""}`}
          style={{ "--i": i } as CSSProperties}
        >
          {w.text}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

import type { ReactNode } from "react";

/**
 * הדגשת מילים בכותרות: טקסט בין ** ** מקבל את צבע המבטא של הערכה.
 * למשל: "בית שמרגיש **בדיוק** כמו שדמיינתם"
 * זה מאפשר להדגיש מילה מתוך עורך הטקסט, בלי לגעת בקוד.
 */
export function renderEmphasis(text: string): ReactNode {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    // כל חלק אי-זוגי בפיצול הוא הטקסט שהיה בין הכוכביות
    i % 2 === 1 ? (
      <span key={i} className="text-accent">
        {part}
      </span>
    ) : (
      part
    )
  );
}

/** מילה אחת אחרי פיצול, עם דגל אם היא נמצאת בתוך הדגשת ** ** */
export interface EmphasisWord {
  text: string;
  emphasis: boolean;
}

/**
 * מפצל טקסט להדגשות (** **) ואז למילים בודדות, כדי ש-SplitWords
 * (components/fx/split-words.tsx) יוכל להציג כל מילה עם אנימציית
 * כניסה משלה, תוך שמירה על צבע ההדגשה על המילים הנכונות בדיוק —
 * אותה לוגיקת פיצול כמו renderEmphasis, שלב אחד עמוק יותר.
 */
export function splitWordsWithEmphasis(text: string): EmphasisWord[] {
  const segments = String(text).split(/\*\*(.+?)\*\*/g);
  const words: EmphasisWord[] = [];
  segments.forEach((segment, i) => {
    const emphasis = i % 2 === 1;
    for (const w of segment.split(/\s+/)) {
      if (w) words.push({ text: w, emphasis });
    }
  });
  return words;
}

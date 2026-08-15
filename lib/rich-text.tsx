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

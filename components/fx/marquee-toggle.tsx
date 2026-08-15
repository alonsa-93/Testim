"use client";

import { useState, type ReactNode } from "react";
import { IconPause, IconPlay } from "@/components/icons";

/**
 * הפיסה האינטראקטיבית היחידה בבלוק ה-marquee: כפתור השהיה גלוי לתנועה
 * אוטומטית מעל 5 שניות (WCAG 2.2.2 — hover-pause לבד לא מספיק, חייב
 * פקד אמיתי). data-paused על המכל נקרא ב-globals.css כדי לעצור את
 * .fx-marquee-track; hover/focus-within עוצרים גם הם, בלי JS, דרך CSS.
 * זו הסיבה היחידה שהבלוק כולו לא צריך "use client" — רק החלק הזה.
 */
export function MarqueeToggle({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);

  return (
    <div className="fx-marquee-viewport relative" data-paused={paused ? "" : undefined}>
      {children}
      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-pressed={paused}
        aria-label={paused ? "המשך תנועת הפס הנגלל" : "השהיית תנועת הפס הנגלל"}
        className="absolute inset-y-0 end-2 z-10 my-auto flex size-8 cursor-pointer items-center justify-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur-sm hover:text-primary"
      >
        {paused ? <IconPlay className="size-4" /> : <IconPause className="size-4" />}
      </button>
    </div>
  );
}

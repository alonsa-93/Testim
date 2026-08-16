"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * מונה מספרים: סופר מ-0 (בעצם ממש קרוב ל-0) עד הערך הסופי כשהאלמנט
 * נכנס לתצוגה. מקבל את הערך כמחרוזת סטטיסטית חופשית ("+12", "98%",
 * "כ-600") ומפרק אותה לקידומת/מספר/סיומת כדי לשמר את העיצוב המקורי.
 * ה-SSR מרנדר את הערך הסופי (לא 0!) — כך שבלי JS, ב-reduced-motion,
 * או לפני שה-IO מפעיל את הספירה, המספר הנכון כבר גלוי.
 */

interface ParsedStat {
  prefix: string;
  n: number;
  suffix: string;
}

function parseStatValue(raw: string): ParsedStat | null {
  const match = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)([^\d]*)$/);
  if (!match) return null;
  const n = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(n)) return null;
  return { prefix: match[1], n, suffix: match[3] };
}

const formatter = new Intl.NumberFormat("he-IL");

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // ה-SSR והצגה ראשונית תמיד מציגים את הערך הסופי המקורי
  const [display, setDisplay] = useState(value);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const parsed = parseStatValue(value);
    const el = ref.current;
    if (!parsed || !el || reducedMotion) return;

    // מזהה ה-rAF הפעיל של לולאת הספירה — Phase 0.5: זה היה חסר לגמרי
    // קודם, כך שביטול (unmount, או reducedMotion שנהיה true תוך כדי
    // ספירה) לא עצר בפועל את הלולאה; היא המשיכה לקרוא ל-setDisplay
    // על רכיב שכבר לא קיים. עכשיו ה-cleanup מבטל אותו במפורש.
    let rafId: number | null = null;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const duration = 1600;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) * (1 - t); // ease-out-quad
          const current = Math.round(parsed.n * eased);
          setDisplay(`${parsed.prefix}${formatter.format(current)}${parsed.suffix}`);
          rafId = t < 1 ? requestAnimationFrame(tick) : null;
        };
        rafId = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px 15% 0px", threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [value, reducedMotion]);

  return (
    <span ref={ref} className={className} dir="ltr">
      {display}
    </span>
  );
}

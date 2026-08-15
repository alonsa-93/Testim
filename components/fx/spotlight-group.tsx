"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * מכל אחד שמאזין לתנועת הסמן ומשדר את מיקומו (--mx/--my) לכל ילדיו
 * דרך CSS custom properties — כל ילד עם קלאס fx-spot / fx-spot-border
 * (globals.css) קורא את אותם המשתנים ומצייר סביבו זוהר במיקום הנכון.
 * מאזין pointer יחיד לכל הקבוצה, מצומצם ב-rAF — לא מאזין per-item.
 */
export function SpotlightGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  function apply() {
    frame.current = null;
    const el = ref.current;
    const p = pending.current;
    if (!el || !p) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${p.x - rect.left}px`);
    el.style.setProperty("--my", `${p.y - rect.top}px`);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    pending.current = { x: e.clientX, y: e.clientY };
    if (frame.current === null) frame.current = requestAnimationFrame(apply);
  }

  return (
    <div ref={ref} onPointerMove={handlePointerMove} className={className}>
      {children}
    </div>
  );
}

"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * כרטיס שנוטה בעקבות הסמן (3d-fx-report #1). מאזין pointermove יחיד
 * לכל מופע, מצומצם ב-rAF כדי לא להציף פריימים; כותב --rx/--ry/--mx/--my
 * כמשתני CSS על האלמנט עצמו — .fx-tilt ב-globals.css קורא אותם
 * ומיישם transform: perspective(...) rotateX/rotateY. פועל רק
 * במכשירי סמן עדין (עכבר) — מסך מגע לא מקבל טילט מלאכותי.
 */
export function TiltCard({
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
    if (rect.width === 0 || rect.height === 0) return;
    const px = (p.x - rect.left) / rect.width;
    const py = (p.y - rect.top) / rect.height;
    const max = Number(getComputedStyle(el).getPropertyValue("--ds-fx-tilt-max")) || 8;
    el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    pending.current = { x: e.clientX, y: e.clientY };
    if (frame.current === null) frame.current = requestAnimationFrame(apply);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      className={`fx-tilt${className ? ` ${className}` : ""}`}
    >
      {children}
      <span aria-hidden="true" className="fx-tilt-glare" />
    </div>
  );
}

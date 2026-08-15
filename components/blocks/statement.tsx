"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Container } from "@/components/ui/section";
import { splitWordsWithEmphasis } from "@/lib/rich-text";
import { statementDefaults, type StatementContent } from "./statement.meta";
import type { BlockContent } from "@/lib/fields";

/**
 * בלוק "הצהרה": סקשן sticky גבוה שבו פסקה גדולה נדלקת מילה-מילה לפי
 * התקדמות הגלילה. שונה מ-Reveal (כניסה חד-פעמית ב-IO) — כאן ההתקדמות
 * *רציפה*, נכתבת ל---progress ב-rAF תוך כדי גלילה.
 *
 * SSR-safe: הטקסט המלא תמיד ב-DOM (real text, לא רק aria-label), וה-CSS
 * (fx-statement-word ב-globals.css) נופל לברירת מחדל --progress:1 כשאין
 * JS בכלל — כך שהפסקה מוצגת גלויה במלואה בלי תלות בסקריפט. reduced-motion
 * מדלג על מאזין הגלילה וקובע --progress ל-1 מיד עם ה-mount.
 *
 * הקובץ הזה מייצא *רק* את הרכיב — ה-BlockDef חי ב-statement.meta.ts
 * הלא-"use client", ומורכב יחד ב-registry.ts. ראו הערה ב-navbar.meta.ts.
 */
export function Statement({ content }: { content: BlockContent }) {
  const c = { ...statementDefaults, ...content } as StatementContent;
  const words = splitWordsWithEmphasis(c.text);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      el.style.setProperty("--progress", "1");
      return;
    }

    let frame: number | null = null;
    const update = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      el.style.setProperty("--progress", String(progress));
    };
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    // אין overflow:hidden כאן או בהורים — sticky בתוך מכל גבוה דורש
    // שאף אב לא יחתוך/יגלול בעצמו (ראו scroll-text-report)
    <section ref={wrapRef} className="relative min-h-[240vh]">
      <div className="sticky top-0 flex min-h-svh items-center">
        <Container>
          <p
            role="text"
            aria-label={c.text.replace(/\*\*/g, "")}
            className="mx-auto max-w-4xl text-center font-heading text-h1 leading-snug text-ink"
            style={{ "--n": words.length } as CSSProperties}
          >
            {words.map((w, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`fx-statement-word${w.emphasis ? " text-accent" : ""}`}
                style={{ "--i": i } as CSSProperties}
              >
                {w.text}{" "}
              </span>
            ))}
          </p>
        </Container>
      </div>
    </section>
  );
}

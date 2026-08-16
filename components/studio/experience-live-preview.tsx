"use client";

import { useEffect, useState } from "react";
import { ExperienceProvider, useExperienceRuntime } from "@/components/experience/experience-provider";
import { ExperienceScene } from "@/components/experience/experience-scene";
import { ExperienceLayerRenderer } from "@/components/experience/experience-layer";
import { ExperienceBlockRefLayer } from "@/components/experience/experience-page";
import { findScrollRoot } from "@/lib/scroll-root";
import type { ExperienceConfig, ResponsiveMode } from "@/lib/experience";
import type { Page } from "@/lib/page";
import type { Theme } from "@/lib/theme";

/**
 * Phase 7 — התצוגה החיה של חוויית הגלילה בסטודיו + Timeline scrubber
 * (docs/experience-audit.md §18 Phase 7). לא preview מדומה נפרד: מרכיב
 * בדיוק את אותם רכיבי הרצה (ExperienceProvider/Scene/Layer) שהדף
 * הציבורי משתמש בהם (components/experience/experience-page.tsx) --
 * כך שמה שרואים כאן זהה ל-100% למה שיפורסם. ה-scrubber מגלגל את
 * ה-<main overflow-auto> האמיתי של הסטודיו עצמו (runtime.scrollToProgress)
 * במקום להמציא מנגנון preview כפול.
 */
export function ExperienceLivePreview({
  page,
  theme,
  selectedSceneId,
  onSelectScene,
  mode = "base",
}: {
  page: Page;
  theme?: Theme;
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
  /** מצב הרחפורט של תצוגת הסטודיו (desktop/tablet/mobile) — פותר את ה-
   * Responsive<T> של layout/durationVh/tracks לאותו breakpoint שנבחר
   * למעלה, בדיוק כמו שה-max-width של התצוגה כבר עושה ל-Standard. */
  mode?: ResponsiveMode;
}) {
  const config = page.experience;
  if (!config?.enabled) return null;

  return (
    <ExperienceProvider config={config} mode={mode}>
      <TimelineOverlay config={config} selectedSceneId={selectedSceneId} onSelectScene={onSelectScene} />
      {config.scenes.map((scene) => (
        <ExperienceScene
          key={scene.id}
          scene={scene}
          className={selectedSceneId === scene.id ? "outline outline-2 outline-indigo-500 -outline-offset-2" : undefined}
        >
          {scene.layers.map((layer) => (
            <ExperienceLayerRenderer key={layer.id} layer={layer} blocks={page.blocks} theme={theme} />
          ))}
          {scene.blockRefs?.map((blockId) => (
            <ExperienceBlockRefLayer key={blockId} blockId={blockId} blocks={page.blocks} theme={theme} />
          ))}
        </ExperienceScene>
      ))}
    </ExperienceProvider>
  );
}

function TimelineOverlay({
  config,
  selectedSceneId,
  onSelectScene,
}: {
  config: ExperienceConfig;
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
}) {
  const runtime = useExperienceRuntime();
  const scene = config.scenes.find((s) => s.id === selectedSceneId) ?? config.scenes[0];
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  // עוקב אחרי --exp-scene-progress שה-runtime כותב כל פריים (לא setState
  // בלולאת הגלילה של ה-runtime עצמו -- זה קוד סטודיו נפרד, לצורך תצוגה
  // בלבד; §4.6 באודיט אוסר setState-per-frame ב-*runtime*, לא בכלי עזר
  // חיצוניים שמאזינים לתוצאה שלו).
  useEffect(() => {
    if (!scene || dragging) return;
    const el = document.querySelector(`[data-experience-scene="${scene.id}"]`);
    if (!(el instanceof HTMLElement)) return;
    let frame: number | null = null;
    const read = () => {
      frame = null;
      const raw = getComputedStyle(el).getPropertyValue("--exp-scene-progress");
      const value = Number.parseFloat(raw);
      if (!Number.isNaN(value)) setProgress(value);
    };
    const root = findScrollRoot(el);
    const unsub = root.subscribe(() => {
      if (frame === null) frame = requestAnimationFrame(read);
    });
    read();
    return () => {
      unsub();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [scene, dragging]);

  if (!scene) return null;

  return (
    <div
      // sticky ל-*תחתית* ולא לראש בכוונה: סצנות מוצמדות (pinned) כבר
      // תופסות את top:0 של אותו scroll root (experience-scene.tsx) --
      // בר עליון היה מתחרה/מתחבא מאחורי ה-stage שלהן. תחתית פנויה
      // תמיד, בדיוק כמו סרגל הפעלה של נגן וידאו. לא חלק מה-DOM שה-
      // runtime מודד (measureRelativeToRoot בודק רק את אלמנט ה-scene
      // עצמו) -- לכן בטוח שלא ישבש חישובי top/height של הסצנות.
      className="sticky bottom-0 z-50 flex flex-wrap items-center gap-3 border-t border-slate-700 bg-slate-900/95 px-3 py-2 text-white backdrop-blur"
      data-studio-timeline=""
    >
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
        {config.scenes.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectScene(s.id)}
            aria-pressed={s.id === scene.id}
            className={`shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold ${
              s.id === scene.id ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {i + 1}. {s.name}
          </button>
        ))}
      </div>
      <div className="flex flex-1 items-center gap-2">
        <span className="w-10 shrink-0 text-end font-mono text-xs text-slate-400" dir="ltr">
          {Math.round(progress * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(progress * 100)}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onChange={(e) => {
            const p = Number(e.target.value) / 100;
            setProgress(p);
            runtime?.scrollToProgress(scene.id, p);
          }}
          aria-label={`טיימליין — ${scene.name}`}
          className="w-full cursor-pointer accent-indigo-500"
        />
      </div>
    </div>
  );
}

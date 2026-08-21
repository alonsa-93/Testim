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
  selectedLayerId,
  onSelectLayer,
  mode = "base",
  imagePreviewOverrides,
}: {
  page: Page;
  theme?: Theme;
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
  /** Milestone D1 (בחירה-על-קנבס) — קליק על שכבה בקנבס בוחר אותה. שני
   * ה-props אופציונליים: תצוגות עתידיות/בדיקות יכולות להשמיט אותם. */
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
  /** מצב הרחפורט של תצוגת הסטודיו (desktop/tablet/mobile) — פותר את ה-
   * Responsive<T> של layout/durationVh/tracks לאותו breakpoint שנבחר
   * למעלה, בדיוק כמו שה-max-width של התצוגה כבר עושה ל-Standard. */
  mode?: ResponsiveMode;
  /** תצוגה מקדימה מקומית לתמונה שנבחרה מהמחשב — לא חלק מ-page, ראו
   * experience-layer.tsx */
  imagePreviewOverrides?: Record<string, string>;
}) {
  const config = page.experience;
  if (!config?.enabled) return null;

  return (
    <ExperienceProvider config={config} mode={mode}>
      {config.scenes.map((scene) => (
        <ExperienceScene
          key={scene.id}
          scene={scene}
          className={selectedSceneId === scene.id ? "outline outline-2 outline-indigo-500 -outline-offset-2" : undefined}
        >
          {scene.layers.map((layer) => (
            <ExperienceLayerRenderer
              key={layer.id}
              layer={layer}
              blocks={page.blocks}
              theme={theme}
              imagePreviewOverrides={imagePreviewOverrides}
              selected={selectedLayerId === layer.id}
              onSelect={
                onSelectLayer
                  ? (id) => {
                      onSelectScene(scene.id);
                      onSelectLayer(id);
                    }
                  : undefined
              }
            />
          ))}
          {scene.blockRefs?.map((blockId) => (
            <ExperienceBlockRefLayer key={blockId} blockId={blockId} blocks={page.blocks} theme={theme} />
          ))}
          {scene.layers.length === 0 && !scene.blockRefs?.length && (
            /* מצב-ריק בתוך הקנבס (ממצא ה-walkthrough: "סצנה ריקה" נראתה
               כמו באג — קנבס לבן מת). סטודיו בלבד: הרכיב הזה לא קיים
               בדף המפורסם (experience-page.tsx לא מרנדר אותו). */
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-xl border-2 border-dashed border-slate-300 bg-white/80 px-6 py-4 text-center text-sm font-semibold text-slate-500 backdrop-blur-sm">
                הסצנה ריקה — הוסיפו שכבה (טקסט, תמונה, צורה…)
                <br />
                <span className="font-normal text-slate-400">מהפאנל: ״+ הוספת שכבה״</span>
              </p>
            </div>
          )}
        </ExperienceScene>
      ))}
      {/* הטיימליין חייב להיות *אחרי* הסצנות ב-DOM: sticky bottom-0 נדבק
          לתחתית ה-scrollport רק כל עוד המיקום הטבעי של האלמנט נמוך מהחלון —
          כאלמנט ראשון הוא פשוט נגלל החוצה למעלה (ממצא ה-walkthrough:
          "הסרגל נעלם בדיוק כשבוחנים את הסצנה"). כאחרון — הוא צף בתחתית
          לכל אורך הגלילה ומתיישב במקומו רק בסוף. */}
      <TimelineOverlay
        config={config}
        selectedSceneId={selectedSceneId}
        onSelectScene={onSelectScene}
        selectedLayerId={selectedLayerId}
      />
    </ExperienceProvider>
  );
}

function TimelineOverlay({
  config,
  selectedSceneId,
  onSelectScene,
  selectedLayerId,
}: {
  config: ExperienceConfig;
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
  /** Milestone D2: כשיש שכבה נבחרת, מציגים keyframe markers של ה-tracks
   * שלה בלבד (לא רעש של כל הסצנה) — undefined/null נופל חזרה ל-כל הסצנה. */
  selectedLayerId?: string | null;
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

  // Milestone D2 (docs/studio-ux-simplification.md §3.3): keyframe markers
  // על ה-scrubber — כל ה-"at" הייחודיים מתוך ה-tracks הרלוונטיים, כדי
  // שהמשתמש יראה *איפה* לאורך הסצנה קורה שינוי, לא רק "כמה אחוז עכשיו".
  const relevantTracks = selectedLayerId
    ? scene.tracks.filter((t) => t.target === selectedLayerId)
    : scene.tracks;
  const keyframeMarks = Array.from(
    new Set(
      relevantTracks.flatMap((t) =>
        Object.values(t.props)
          .filter((kfs): kfs is NonNullable<typeof kfs> => Array.isArray(kfs))
          .flatMap((kfs) => kfs.map((kf) => kf.at))
      )
    )
  ).sort((a, b) => a - b);

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
        {/* Milestone D2: עוטפים ב-relative כדי למקם את סימוני ה-keyframes
            כשכבה מעל ה-range המקורי -- pointer-events-none כדי לא לחסום
            גרירה של ה-thumb; קירוב ויזואלי (לא מתחשב ברוחב ה-thumb עצמו),
            מספיק כדי לראות *איפה* קורה שינוי לאורך הסצנה. */}
        <div className="relative w-full">
          {keyframeMarks.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0" aria-hidden="true">
              {keyframeMarks.map((at) => (
                <span
                  key={at}
                  className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
                  style={{ insetInlineStart: `${at * 100}%` }}
                />
              ))}
            </div>
          )}
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
    </div>
  );
}

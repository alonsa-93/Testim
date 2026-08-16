"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useExperienceDebug, useExperienceMode, useExperienceRuntime } from "./experience-provider";
import { useReducedMotion } from "@/components/fx/use-reduced-motion";
import { findScrollRoot } from "@/lib/scroll-root";
import { resolveResponsive, resolveThemeColor, type ExperienceScene as ExperienceSceneConfig } from "@/lib/experience";
import { cn } from "@/lib/cn";

/**
 * מממש את מודל Scene/Stage/Layer (docs/experience-audit.md §4.3, §11):
 *
 * ```
 * SCENE
 * └── SCROLL TRACK   (גובה = durationVh, "המסלול" שהגלילה רוכבת עליו)
 *     └── STICKY STAGE   (100svh, זה מה שרואים בפועל)
 *         └── LAYER / LAYER / LAYER
 * ```
 *
 * זה בדיוק הדפוס ש-statement.tsx כבר מוכיח (min-h-[Nsvh] + sticky top-0),
 * מוכלל לכל scene. אפס preventDefault, אפס יירוט gestures.
 *
 * Stage Mode לעומת Flow Mode (§4.3): stage = קומפוזיציה מוצמדת (pinned)
 * בתוך "במה" גבוה-דבוקה; flow = תוכן זורם רגיל, ה-scene רק "רוכב" על
 * הגובה הטבעי שלו בלי pin.
 *
 * reduced-motion (§48 במסמך התיקון: "Disable/simplify: cinematic
 * pinning") מבטל pinning בלבד, לא את ה-scene עצמו — התוכן נשאר גלוי
 * וזורם, פשוט בלי ההצמדה הקולנועית.
 */
export function ExperienceScene({
  scene,
  className,
  children,
}: {
  scene: ExperienceSceneConfig;
  className?: string;
  children: ReactNode;
}) {
  const runtime = useExperienceRuntime();
  const mode = useExperienceMode();
  const debug = useExperienceDebug();
  const reducedMotion = useReducedMotion();
  const wrapRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || !runtime) return;
    runtime.registerScene(scene.id, el);
    return () => runtime.unregisterScene(scene.id);
  }, [runtime, scene.id]);

  const durationVh = resolveResponsive(scene.durationVh, mode);
  const isPinned = scene.composition === "stage" && scene.pinned && !reducedMotion;
  const backgroundStyle = sceneBackgroundStyle(scene);
  const dataProps = {
    "data-experience-scene": scene.id,
    "data-scene-transition": scene.transition ?? "cut",
  };

  if (scene.composition === "stage") {
    return (
      <section
        ref={wrapRef}
        {...dataProps}
        className={cn("relative", debug && "outline outline-2 outline-dashed outline-lime-400 -outline-offset-2", className)}
        style={isPinned ? ({ minHeight: `${durationVh}svh` } as CSSProperties) : undefined}
      >
        <div
          className={cn(
            "exp-stage relative overflow-hidden",
            isPinned ? "sticky top-0 min-h-svh" : "min-h-svh"
          )}
          style={backgroundStyle}
        >
          {debug && <SceneDebugBadge sceneId={scene.id} elRef={wrapRef} />}
          {children}
        </div>
      </section>
    );
  }

  // Flow mode: בלי pin, בלי גובה כפוי -- ה-scene רוכב על הגובה הטבעי
  // של התוכן שלו (§4.3 באודיט: "לא מכריחים הכול ל-absolute positioning")
  return (
    <section
      ref={wrapRef}
      {...dataProps}
      className={cn("exp-stage relative", debug && "outline outline-2 outline-dashed outline-lime-400 -outline-offset-2", className)}
      style={backgroundStyle}
    >
      {debug && <SceneDebugBadge sceneId={scene.id} elRef={wrapRef} />}
      {children}
    </section>
  );
}

/**
 * Phase 8 — Debug Mode (docs/experience-audit.md §18 Phase 8): מסגרת
 * מקווקוות סביב כל scene + badge עם המזהה וה-progress החי (0–1). קורא
 * את --exp-scene-progress שה-runtime כבר כותב כל פריים (§4.2) -- לא
 * setState בלולאת הגלילה של ה-runtime עצמו, אלא רכיב-עזר נפרד שמאזין
 * לתוצאה שלו (אותו דפוס בדיוק כמו הטיימליין בסטודיו, Phase 7).
 */
function SceneDebugBadge({ sceneId, elRef }: { sceneId: string; elRef: RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
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
  }, [elRef]);

  return (
    <div
      aria-hidden="true"
      data-experience-debug-badge={sceneId}
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between bg-black/70 px-2 py-1 font-mono text-[10px] text-lime-300"
    >
      <span dir="ltr">{sceneId}</span>
      <span dir="ltr">{progress.toFixed(2)}</span>
    </div>
  );
}

function sceneBackgroundStyle(scene: ExperienceSceneConfig): CSSProperties | undefined {
  if (!scene.background) return undefined;
  const style: CSSProperties = {};
  if (scene.background.color) style.backgroundColor = resolveThemeColor(scene.background.color);
  if (scene.background.image) style.backgroundImage = `url(${scene.background.image})`;
  return style;
}

"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useExperienceMode, useExperienceRuntime } from "./experience-provider";
import { useReducedMotion } from "@/components/fx/use-reduced-motion";
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
        className={cn("relative", className)}
        style={isPinned ? ({ minHeight: `${durationVh}svh` } as CSSProperties) : undefined}
      >
        <div
          className={cn("exp-stage overflow-hidden", isPinned ? "sticky top-0 min-h-svh" : "min-h-svh")}
          style={backgroundStyle}
        >
          {children}
        </div>
      </section>
    );
  }

  // Flow mode: בלי pin, בלי גובה כפוי -- ה-scene רוכב על הגובה הטבעי
  // של התוכן שלו (§4.3 באודיט: "לא מכריחים הכול ל-absolute positioning")
  return (
    <section ref={wrapRef} {...dataProps} className={cn("exp-stage", className)} style={backgroundStyle}>
      {children}
    </section>
  );
}

function sceneBackgroundStyle(scene: ExperienceSceneConfig): CSSProperties | undefined {
  if (!scene.background) return undefined;
  const style: CSSProperties = {};
  if (scene.background.color) style.backgroundColor = resolveThemeColor(scene.background.color);
  if (scene.background.image) style.backgroundImage = `url(${scene.background.image})`;
  return style;
}

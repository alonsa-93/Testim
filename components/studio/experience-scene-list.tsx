"use client";

import { useState } from "react";
import { newSceneId, type ExperienceConfig, type ExperienceScene } from "@/lib/experience";
import { EXPERIENCE_PRESETS, instantiatePresetScene } from "@/lib/experience-presets";
import { computeExperienceMotionBudget, MOTION_BUDGET_LABELS } from "@/lib/experience-motion-budget";
import { PanelSection } from "@/components/studio/controls";

/**
 * Milestone D2 (docs/studio-ux-simplification.md §3) — LEFT: מבנה
 * (Experience: רשימת סצנות). מחולץ מ-ExperienceEditor הישן: אותה לוגיקה
 * בדיוק (add/remove/move/duplicate), אבל עכשיו **תמיד** מוצג — לא נעלם
 * כשסצנה נבחרת. זה ההבדל המבני המרכזי מול ה-IA הישן (aside אחד עושה
 * הכול): כאן LEFT הוא ניווט קבוע, RIGHT (experience-context-panel.tsx)
 * הוא מה שקונטקסטואלי.
 */

type PageUpdater<T> = T | ((prev: T) => T);

const MOTION_BADGE_CLASS: Record<string, string> = {
  light: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  heavy: "bg-red-100 text-red-800",
};

export function ExperienceSceneList({
  config,
  onChange,
  selectedSceneId,
  onSelectScene,
  onSelectLayer,
  onSetImagePreview,
  onDisable,
}: {
  config: ExperienceConfig;
  onChange: (next: PageUpdater<ExperienceConfig>) => void;
  selectedSceneId: string | null;
  onSelectScene: (id: string | null) => void;
  onSelectLayer: (id: string | null) => void;
  onSetImagePreview?: (layerId: string, url: string | null) => void;
  onDisable: () => void;
}) {
  const [pickingPreset, setPickingPreset] = useState(false);
  const scenes = config.scenes;

  const setScenes = (next: ExperienceScene[]) => onChange((c) => ({ ...c, scenes: next }));

  const addScene = (base?: Partial<ExperienceScene>) => {
    const id = newSceneId(scenes);
    const { layers, tracks } = instantiatePresetScene(
      base ?? {},
      scenes.flatMap((s) => s.layers),
      scenes.flatMap((s) => s.tracks)
    );
    const scene: ExperienceScene = {
      id,
      name: base?.name ?? `סצנה ${scenes.length + 1}`,
      composition: base?.composition ?? "stage",
      pinned: base?.pinned ?? true,
      durationVh: base?.durationVh ?? config.settings.defaultDurationVh,
      background: base?.background,
      transition: base?.transition ?? "fade",
      layers,
      tracks,
      blockRefs: base?.blockRefs,
    };
    setScenes([...scenes, scene]);
    setPickingPreset(false);
    onSelectScene(id);
    onSelectLayer(null);
  };

  /**
   * Milestone D4 — שכפול סצנה (חדש, לא היה קיים כלל — ראו
   * docs/scroll-experience-rebuild-audit.md §2.9). משתמש ב-
   * instantiatePresetScene הקיים בדיוק כמו addScene — remap ids ייחודי
   * גלובלית, לא רק "clone עמוק" נאיבי שהיה יוצר התנגשויות target.
   */
  const duplicateScene = (scene: ExperienceScene) => {
    const id = newSceneId(scenes);
    const { layers, tracks } = instantiatePresetScene(
      scene,
      scenes.flatMap((s) => s.layers),
      scenes.flatMap((s) => s.tracks)
    );
    const copy: ExperienceScene = { ...scene, id, name: `${scene.name} (עותק)`, layers, tracks };
    const index = scenes.findIndex((s) => s.id === scene.id);
    const next = [...scenes];
    next.splice(index + 1, 0, copy);
    setScenes(next);
    onSelectScene(id);
    onSelectLayer(null);
  };

  const removeScene = (id: string) => {
    const scene = scenes.find((s) => s.id === id);
    if (!window.confirm(`למחוק את הסצנה "${scene?.name ?? id}"?`)) return;
    setScenes(scenes.filter((s) => s.id !== id));
    if (selectedSceneId === id) {
      onSelectScene(null);
      onSelectLayer(null);
    }
    scene?.layers.forEach((l) => onSetImagePreview?.(l.id, null));
  };

  const moveScene = (from: number, to: number) => {
    if (to < 0 || to >= scenes.length) return;
    const next = [...scenes];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setScenes(next);
  };

  const rowBtn =
    "flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";
  const budget = scenes.length > 0 ? computeExperienceMotionBudget(config) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          סצנות
          {budget && (
            <span
              title="עומס תנועה כולל — פירוט מלא בפאנל ההגדרות (כלום לא נבחר)"
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${MOTION_BADGE_CLASS[budget.worst]}`}
            >
              {MOTION_BUDGET_LABELS[budget.worst]}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={onDisable}
          className="shrink-0 cursor-pointer text-xs font-semibold text-slate-500 hover:text-red-600 hover:underline"
        >
          כיבוי
        </button>
      </div>

      <PanelSection title="הסצנות בחוויה">
        <div className="space-y-2">
          {scenes.map((scene, i) => (
            <div
              key={scene.id}
              className={`flex items-center gap-1 rounded-md border bg-white p-1.5 ${
                selectedSceneId === scene.id ? "border-indigo-400 ring-1 ring-indigo-400" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onSelectScene(scene.id);
                  onSelectLayer(null);
                }}
                aria-pressed={selectedSceneId === scene.id}
                className="flex-1 cursor-pointer truncate px-1.5 text-start"
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {i + 1}. {scene.name}
                </span>
                <span className="block text-xs text-slate-400">
                  {scene.composition === "stage" ? (scene.pinned ? "מוצמדת" : "במה") : "זורמת"} ·{" "}
                  {scene.layers.length} שכבות
                  {scene.blockRefs?.length ? ` · ${scene.blockRefs.length} בלוקים` : ""}
                </span>
              </button>
              <button
                type="button"
                onClick={() => duplicateScene(scene)}
                aria-label={`שכפול ${scene.name}`}
                title="שכפול סצנה"
                className={rowBtn}
              >
                ⧉
              </button>
              <button
                type="button"
                onClick={() => moveScene(i, i - 1)}
                disabled={i === 0}
                aria-label={`הזזת ${scene.name} למעלה`}
                className={rowBtn}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveScene(i, i + 1)}
                disabled={i === scenes.length - 1}
                aria-label={`הזזת ${scene.name} למטה`}
                className={rowBtn}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeScene(scene.id)}
                aria-label={`מחיקת ${scene.name}`}
                className={rowBtn}
              >
                ✕
              </button>
            </div>
          ))}
          {scenes.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
              אין עדיין סצנות — הוסיפו את הראשונה
            </p>
          )}
        </div>

        {pickingPreset ? (
          <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">בחרו נקודת התחלה</p>
              <button
                type="button"
                onClick={() => setPickingPreset(false)}
                className="cursor-pointer text-sm text-slate-500 hover:text-slate-900"
              >
                ביטול
              </button>
            </div>
            <button
              type="button"
              onClick={() => addScene()}
              className="w-full cursor-pointer rounded-md border border-slate-200 bg-white p-2.5 text-start hover:border-indigo-400"
            >
              <span className="block text-sm font-semibold text-slate-800">סצנה ריקה</span>
              <span className="block text-xs text-slate-500">מוצמדת, בלי שכבות — מתחילים מאפס</span>
            </button>
            {EXPERIENCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => addScene(preset.scene)}
                className="w-full cursor-pointer rounded-md border border-slate-200 bg-white p-2.5 text-start hover:border-indigo-400"
              >
                <span className="block text-sm font-semibold text-slate-800">{preset.label}</span>
                <span className="block text-xs text-slate-500">{preset.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickingPreset(true)}
            className="mt-2 w-full cursor-pointer rounded-md border border-dashed border-indigo-400 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
          >
            + הוספת סצנה
          </button>
        )}
      </PanelSection>
    </div>
  );
}

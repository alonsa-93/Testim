"use client";

import { useState } from "react";
import {
  emptyExperience,
  newSceneId,
  EASING_LABELS,
  type EasingId,
  type ExperienceConfig,
  type ExperienceScene,
} from "@/lib/experience";
import { validateExperience } from "@/lib/experience-validate";
import { EXPERIENCE_PRESETS, instantiatePresetScene } from "@/lib/experience-presets";
import { computeExperienceMotionBudget, MOTION_BUDGET_LABELS } from "@/lib/experience-motion-budget";
import { ChipRow, CheckboxField, PanelSection, SelectField, SliderField } from "@/components/studio/controls";
import { ExperienceSceneEditor } from "@/components/studio/experience-scene-editor";

/**
 * Phase 7 — Experience Studio UI, פאנל עליון (docs/experience-audit.md
 * §18 Phase 7, §97–103 במסמך הסופי). מקביל בדיוק ל-StructurePanel של
 * Mode A: רשימת scenes עם הוספה/מחיקה/סידור/בחירה, פלוס הגדרות ברמת
 * ה-Experience כולו (settings) ואזהרות ולידציה (§9 Track Ownership).
 *
 * MVP מכוון: אין drag-and-drop אמיתי (סידור בחצים, בדיוק כמו הבלוקים
 * הרגילים) ואין preview-thumbnail לכל scene -- אלה שיפורי-UX עתידיים,
 * לא חלק מהחוזה התפקודי (§27 במסמך התיקון: "MVP-first, add nothing not
 * explicitly justified").
 */

type PageUpdater<T> = T | ((prev: T) => T);

const REDUCED_MOTION_OPTIONS: Array<{ value: ExperienceConfig["settings"]["reducedMotion"]; label: string }> = [
  { value: "static", label: "עצירה מלאה (מומלץ)" },
  { value: "opacity-only", label: "רק דהייה, בלי תזוזה" },
];

const PERFORMANCE_OPTIONS: Array<{ value: ExperienceConfig["settings"]["performance"]; label: string }> = [
  { value: "auto", label: "אוטומטי" },
  { value: "high", label: "גבוה" },
  { value: "lite", label: "קליל (מובייל חלש)" },
];

export function ExperienceEditor({
  config,
  onChange,
  selectedSceneId,
  onSelectScene,
  selectedLayerId,
  onSelectLayer,
}: {
  config: ExperienceConfig | undefined;
  onChange: (next: PageUpdater<ExperienceConfig>) => void;
  selectedSceneId: string | null;
  onSelectScene: (id: string | null) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
}) {
  const [pickingPreset, setPickingPreset] = useState(false);

  if (!config) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 p-5 text-center">
        <p className="text-sm font-bold text-indigo-900">
          לדף הזה אין עדיין חוויית גלילה
        </p>
        <p className="text-xs leading-relaxed text-indigo-700">
          חוויית גלילה (Scroll Experience) היא מצב עמוד נפרד: סצנות
          קולנועיות עם pinning, שכבות חופשיות וטיימליין מונע-גלילה —
          בלי לשנות שום דבר בבלוקים הרגילים של הדף.
        </p>
        <button
          type="button"
          onClick={() => onChange(emptyExperience())}
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
        >
          הפעלת חוויית גלילה לדף הזה
        </button>
      </div>
    );
  }

  const scenes = config.scenes;
  const selectedScene = scenes.find((s) => s.id === selectedSceneId) ?? null;
  const issues = validateExperience(config);

  const setScenes = (next: ExperienceScene[]) => onChange((c) => ({ ...c, scenes: next }));
  const setSettings = <K extends keyof ExperienceConfig["settings"]>(
    key: K,
    value: ExperienceConfig["settings"][K]
  ) => onChange((c) => ({ ...c, settings: { ...c.settings, [key]: value } }));

  const addScene = (base?: Partial<ExperienceScene>) => {
    const id = newSceneId(scenes);
    // remapping מזהי layer/track לייחודיים גלובלית -- ראו התיעוד המלא
    // ב-instantiatePresetScene (lib/experience-presets.ts): ה-TargetRegistry
    // הוא Map אחד לכל ה-Experience, לא מפוצל per-scene.
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

  const removeScene = (id: string) => {
    const scene = scenes.find((s) => s.id === id);
    if (!window.confirm(`למחוק את הסצנה "${scene?.name ?? id}"?`)) return;
    setScenes(scenes.filter((s) => s.id !== id));
    if (selectedSceneId === id) {
      onSelectScene(null);
      onSelectLayer(null);
    }
  };

  const moveScene = (from: number, to: number) => {
    if (to < 0 || to >= scenes.length) return;
    const next = [...scenes];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setScenes(next);
  };

  const disableExperience = () => {
    if (!window.confirm("לכבות את חוויית הגלילה ולחזור לתצוגה הרגילה של הדף? הנתונים לא נמחקים.")) return;
    onChange((c) => ({ ...c, enabled: false }));
  };

  if (selectedScene) {
    return (
      <ExperienceSceneEditor
        scene={selectedScene}
        settings={config.settings}
        onChange={(next) => setScenes(scenes.map((s) => (s.id === next.id ? next : s)))}
        onBack={() => {
          onSelectScene(null);
          onSelectLayer(null);
        }}
        selectedLayerId={selectedLayerId}
        onSelectLayer={onSelectLayer}
        issues={issues.filter((i) => i.sceneId === selectedScene.id)}
      />
    );
  }

  const rowBtn =
    "flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <h2 className="text-sm font-bold text-slate-900">חוויית גלילה</h2>
        <button
          type="button"
          onClick={disableExperience}
          className="shrink-0 cursor-pointer text-xs font-semibold text-slate-500 hover:text-red-600 hover:underline"
        >
          כיבוי
        </button>
      </div>

      {issues.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-bold">⚠ {issues.length} אזהרות</p>
          {issues.slice(0, 4).map((issue, i) => (
            <p key={i}>{issue.message}</p>
          ))}
        </div>
      )}

      <PanelSection title="הסצנות בחוויה">
        <div className="space-y-2">
          {scenes.map((scene, i) => (
            <div
              key={scene.id}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1.5"
            >
              <button
                type="button"
                onClick={() => onSelectScene(scene.id)}
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

      <PanelSection title="הגדרות כלליות">
        <SliderField
          label="משך ברירת מחדל לסצנה"
          value={config.settings.defaultDurationVh}
          onChange={(v) => setSettings("defaultDurationVh", v)}
          min={100}
          max={400}
          step={20}
          unit="vh"
        />
        <SelectField
          label="עקומת תנועה ברירת מחדל"
          value={config.settings.defaultEasing}
          onChange={(v) => setSettings("defaultEasing", v as EasingId)}
          options={Object.entries(EASING_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <ChipRow
          label="ביצועים"
          value={config.settings.performance}
          onChange={(v) => setSettings("performance", v as ExperienceConfig["settings"]["performance"])}
          options={PERFORMANCE_OPTIONS as Array<{ value: string; label: string }>}
        />
        <SliderField
          label="עוצמת תנועה כללית"
          value={Math.round(config.settings.intensity * 100)}
          onChange={(v) => setSettings("intensity", v / 100)}
          min={0}
          max={100}
          step={5}
          unit="%"
        />
      </PanelSection>

      <PanelSection title="נגישות">
        <SelectField
          label='כשמשתמש מבקש "פחות תנועה"'
          value={config.settings.reducedMotion}
          onChange={(v) => setSettings("reducedMotion", v as ExperienceConfig["settings"]["reducedMotion"])}
          options={REDUCED_MOTION_OPTIONS as Array<{ value: string; label: string }>}
        />
        <p className="text-xs leading-relaxed text-slate-400">
          תמיד מבטל pinning קולנועי — התוכן נשאר גלוי וזורם, פשוט בלי
          ההצמדה. זה חל אוטומטית, לא ניתן לכיבוי.
        </p>
      </PanelSection>

      <PanelSection title="דיבאג">
        <CheckboxField
          label="הצגת מסגרות סצנה ומספרי progress בתצוגה החיה"
          checked={config.settings.debug}
          onChange={(v) => setSettings("debug", v)}
        />
      </PanelSection>

      {scenes.length > 0 && <MotionBudgetPanel config={config} />}
    </div>
  );
}

/**
 * Phase 8 — Motion Budget (§8 במסמך הסופי): לא cap חוסם, אינדיקטור
 * אמיתי המבוסס על PROPERTY_METADATA.performanceClass הקיים (lib/
 * experience-motion-budget.ts) — עוזר לכתוב חוויה קלילה למובייל
 * *לפני* פרסום, לא רק לגלות בעיה אחרי שהיא כבר איטית בפועל.
 */
const MOTION_BADGE_CLASS: Record<string, string> = {
  light: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  heavy: "bg-red-100 text-red-800",
};
const MOTION_TEXT_CLASS: Record<string, string> = {
  light: "text-emerald-700",
  moderate: "text-amber-700",
  heavy: "text-red-700",
};

function MotionBudgetPanel({ config }: { config: ExperienceConfig }) {
  const budget = computeExperienceMotionBudget(config);
  return (
    <PanelSection title="עומס תנועה">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">כלל החוויה</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${MOTION_BADGE_CLASS[budget.worst]}`}>
          {MOTION_BUDGET_LABELS[budget.worst]}
        </span>
      </div>
      <div className="space-y-1">
        {budget.scenes.map((s) => (
          <div key={s.sceneId} className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate" dir="ltr">
              {s.sceneId}
            </span>
            <span>
              {s.trackCount} תנועות
              {s.expensivePropCount > 0 && ` · ${s.expensivePropCount} טשטוש`} ·{" "}
              <span className={MOTION_TEXT_CLASS[s.verdict]}>{MOTION_BUDGET_LABELS[s.verdict]}</span>
            </span>
          </div>
        ))}
      </div>
      {budget.worst !== "light" && (
        <p className="text-xs leading-relaxed text-slate-400">
          שקלו &quot;ביצועים: קליל&quot; למובייל, או צמצום שכבות עם
          טשטוש שפעילות בו-זמנית באותה סצנה.
        </p>
      )}
    </PanelSection>
  );
}

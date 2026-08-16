"use client";

import { useState } from "react";
import {
  LAYER_TYPE_LABELS,
  newLayerId,
  type ExperienceLayer,
  type ExperienceScene,
  type ExperienceSettings,
  type LayerContent,
  type LayerType,
  type SceneTransition,
} from "@/lib/experience";
import type { ExperienceValidationIssue } from "@/lib/experience-validate";
import { CheckboxField, ChipRow, PanelSection, SelectField, SliderField, TextField } from "@/components/studio/controls";
import { ExperienceLayerInspector } from "@/components/studio/experience-layer-inspector";

/**
 * Phase 7 — עורך scene יחיד: שדות ה-scene עצמו (§4.3, §11) + מנהל
 * השכבות שלו (§12) + הגשר לבלוקים קיימים (§12.3). מקביל בדיוק ל-
 * BlockEditor+StructurePanel של Mode A, רק ברמת scene במקום page.
 */

const TRANSITION_OPTIONS: Array<{ value: SceneTransition; label: string }> = [
  { value: "cut", label: "חיתוך" },
  { value: "fade", label: "דהייה" },
];

function defaultContentFor(type: LayerType): LayerContent {
  switch (type) {
    case "text":
      return { text: "טקסט חדש", tag: "p" };
    case "image":
      return { src: "", alt: "", decorative: false };
    case "shape":
      return { shape: "circle" };
    case "button":
      return { label: "כפתור", href: "#", variant: "primary" };
    case "block":
      return { blockId: "" };
  }
}

export function ExperienceSceneEditor({
  scene,
  settings,
  onChange,
  onBack,
  selectedLayerId,
  onSelectLayer,
  issues,
}: {
  scene: ExperienceScene;
  settings: ExperienceSettings;
  onChange: (next: ExperienceScene) => void;
  onBack: () => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  issues: ExperienceValidationIssue[];
}) {
  const [picking, setPicking] = useState(false);
  const [pickingBlock, setPickingBlock] = useState(false);
  const selectedLayer = scene.layers.find((l) => l.id === selectedLayerId) ?? null;

  const durationVh = typeof scene.durationVh === "number" ? scene.durationVh : scene.durationVh.base;

  const setLayers = (layers: ExperienceLayer[]) => onChange({ ...scene, layers });

  const addLayer = (type: LayerType) => {
    const id = newLayerId(scene.layers, type);
    const layer: ExperienceLayer = {
      id,
      type,
      content: defaultContentFor(type),
      layout: { mode: scene.composition === "stage" ? "stage" : "flow", x: "50%", y: "50%", anchor: "center", zIndex: "content" },
    };
    setLayers([...scene.layers, layer]);
    setPicking(false);
    onSelectLayer(id);
  };

  const removeLayer = (id: string) => {
    const layer = scene.layers.find((l) => l.id === id);
    if (!window.confirm(`למחוק את השכבה "${layer?.id ?? id}"?`)) return;
    setLayers(scene.layers.filter((l) => l.id !== id));
    if (selectedLayerId === id) onSelectLayer(null);
  };

  const moveLayer = (from: number, to: number) => {
    if (to < 0 || to >= scene.layers.length) return;
    const next = [...scene.layers];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setLayers(next);
  };

  const addBlockRef = (blockId: string) => {
    onChange({ ...scene, blockRefs: [...(scene.blockRefs ?? []), blockId] });
    setPickingBlock(false);
  };
  const removeBlockRef = (blockId: string) => {
    onChange({ ...scene, blockRefs: (scene.blockRefs ?? []).filter((b) => b !== blockId) });
  };

  if (selectedLayer) {
    return (
      <ExperienceLayerInspector
        scene={scene}
        layerId={selectedLayer.id}
        defaultEasing={settings.defaultEasing}
        onChange={onChange}
        onBack={() => onSelectLayer(null)}
      />
    );
  }

  const rowBtn =
    "flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline"
        >
          → כל הסצנות
        </button>
        <h2 className="truncate text-sm font-bold text-slate-900">{scene.name}</h2>
      </div>

      {issues.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {issues.map((issue, i) => (
            <p key={i}>⚠ {issue.message}</p>
          ))}
        </div>
      )}

      <PanelSection title="הסצנה">
        <TextField label="שם הסצנה" value={scene.name} onChange={(v) => onChange({ ...scene, name: v })} />
        <ChipRow
          label="קומפוזיציה"
          value={scene.composition}
          onChange={(v) => onChange({ ...scene, composition: v as ExperienceScene["composition"] })}
          options={[
            { value: "stage", label: "במה (pinning אפשרי)" },
            { value: "flow", label: "זורמת (בלי pinning)" },
          ]}
        />
        {scene.composition === "stage" && (
          <CheckboxField
            label="הצמדה (pinning) בזמן הגלילה"
            checked={scene.pinned}
            onChange={(v) => onChange({ ...scene, pinned: v })}
          />
        )}
        <SliderField
          label="משך הסצנה"
          value={durationVh}
          onChange={(v) => onChange({ ...scene, durationVh: v })}
          min={80}
          max={400}
          step={20}
          unit="vh"
        />
        <SelectField
          label="מעבר לסצנה הבאה"
          value={scene.transition ?? "cut"}
          onChange={(v) => onChange({ ...scene, transition: v as SceneTransition })}
          options={TRANSITION_OPTIONS as Array<{ value: string; label: string }>}
        />
        <TextField
          label="צבע רקע (טוקן או הקס)"
          dir="ltr"
          value={scene.background?.color ?? ""}
          onChange={(v) => onChange({ ...scene, background: { ...scene.background, color: v || undefined } })}
          hint='למשל "background", "surface", "primary" או #RRGGBB'
        />
      </PanelSection>

      <PanelSection title="שכבות">
        <div className="space-y-2">
          {scene.layers.map((layer, i) => (
            <div key={layer.id} className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1.5">
              <button
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className="flex-1 cursor-pointer truncate px-1.5 text-start"
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {LAYER_TYPE_LABELS[layer.type]} · {layer.id}
                </span>
                {layer.hidden && <span className="text-xs text-slate-400">מוסתרת</span>}
              </button>
              <button type="button" onClick={() => moveLayer(i, i - 1)} disabled={i === 0} aria-label="למעלה" className={rowBtn}>
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveLayer(i, i + 1)}
                disabled={i === scene.layers.length - 1}
                aria-label="למטה"
                className={rowBtn}
              >
                ↓
              </button>
              <button type="button" onClick={() => removeLayer(layer.id)} aria-label="מחיקה" className={rowBtn}>
                ✕
              </button>
            </div>
          ))}
          {scene.layers.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
              אין עדיין שכבות בסצנה הזו
            </p>
          )}
        </div>

        {picking ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {(Object.keys(LAYER_TYPE_LABELS) as LayerType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addLayer(type)}
                className="cursor-pointer rounded-md border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700 hover:border-indigo-400"
              >
                {LAYER_TYPE_LABELS[type]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500 hover:bg-slate-100"
            >
              ביטול
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="mt-2 w-full cursor-pointer rounded-md border border-dashed border-indigo-400 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
          >
            + הוספת שכבה
          </button>
        )}
      </PanelSection>

      <PanelSection title="בלוקים קיימים בסצנה הזו">
        <p className="text-xs leading-relaxed text-slate-400">
          מפנים לבלוק אמיתי מהדף (למשל טופס יצירת קשר) בלי לשכפל תוכן —
          הגשר בין חוויית הגלילה לבלוקים הרגילים.
        </p>
        <div className="space-y-2">
          {(scene.blockRefs ?? []).map((blockId) => (
            <div key={blockId} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1.5">
              <span className="flex-1 truncate px-1.5 text-sm font-mono text-slate-700" dir="ltr">
                {blockId}
              </span>
              <button type="button" onClick={() => removeBlockRef(blockId)} aria-label="הסרה" className={rowBtn}>
                ✕
              </button>
            </div>
          ))}
        </div>
        {pickingBlock ? (
          <BlockRefPicker onAdd={addBlockRef} onCancel={() => setPickingBlock(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setPickingBlock(true)}
            className="w-full cursor-pointer rounded-md border border-dashed border-slate-300 py-2 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + הפנייה לבלוק קיים
          </button>
        )}
      </PanelSection>
    </div>
  );
}

/** תיבת הזנת מזהה בלוק להפניה — state מקומי כדי שלא ננסה להוסיף על כל הקשה */
function BlockRefPicker({ onAdd, onCancel }: { onAdd: (blockId: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <TextField
        label="מזהה הבלוק בדף"
        dir="ltr"
        value={value}
        onChange={setValue}
        hint="העתיקו את מזהה הבלוק כפי שמופיע ב-JSON של הדף (טאב ״מבנה ותוכן״)"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => value.trim() && onAdd(value.trim())}
          disabled={!value.trim()}
          className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          הוספה
        </button>
        <button type="button" onClick={onCancel} className="cursor-pointer text-xs text-slate-500 hover:underline">
          ביטול
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  EASING_LABELS,
  LAYER_TYPE_LABELS,
  PROPERTY_LABELS,
  PROPERTY_METADATA,
  Z_LAYER_LABELS,
  newTrackId,
  resolveResponsive,
  type AnimatableProp,
  type EasingId,
  type ExperienceLayer,
  type ExperienceScene,
  type ExperienceTrack,
  type Keyframe,
  type LayerAnchor,
  type LayerContent,
  type LayerLayout,
  type LayerStyle,
  type LayerZLayer,
} from "@/lib/experience";
import { CheckboxField, PanelSection, SelectField, SliderField, TextField } from "@/components/studio/controls";

/**
 * Phase 7 — Inspector של שכבה בודדת: Basic/Style/Motion/Advanced
 * (docs/experience-audit.md §18 Phase 7). Motion עורך את ה-tracks
 * שמכוונים ל-layer הזה (חיים על ה-scene, לא על ה-layer עצמו — §9) —
 * לכן ה-props כאן הם scene+onChange(scene) מלא, לא layer בודד.
 *
 * layout הוא Responsive<LayerLayout> (§14 באודיט) — ה-MVP עורך רק את
 * ה-base, אבל *שומר* על overrides קיימים ל-tablet/mobile אם יש (לא
 * דורס אותם בטעות סתם כי נערך desktop).
 */

function baseLayout(layout: LayerLayout | { base: LayerLayout; tablet?: LayerLayout; mobile?: LayerLayout }): LayerLayout {
  return "mode" in layout ? layout : layout.base;
}
function withBaseLayout(
  layout: LayerLayout | { base: LayerLayout; tablet?: LayerLayout; mobile?: LayerLayout },
  base: LayerLayout
): typeof layout {
  return "mode" in layout ? base : { ...layout, base };
}

const ANCHOR_OPTIONS: Array<{ value: LayerAnchor; label: string }> = [
  { value: "start", label: "התחלה" },
  { value: "center", label: "מרכז" },
  { value: "end", label: "סוף" },
];
const Z_OPTIONS = (Object.keys(Z_LAYER_LABELS) as LayerZLayer[]).map((k) => ({ value: k, label: Z_LAYER_LABELS[k] }));
const SHADOW_OPTIONS = [
  { value: "none", label: "בלי צל" },
  { value: "soft", label: "רך" },
  { value: "strong", label: "חזק" },
];

export function ExperienceLayerInspector({
  scene,
  layerId,
  defaultEasing,
  onChange,
  onBack,
  imagePreviewSrc,
  onSetImagePreview,
}: {
  scene: ExperienceScene;
  layerId: string;
  defaultEasing: EasingId;
  onChange: (next: ExperienceScene) => void;
  onBack: () => void;
  /** תצוגה מקדימה מקומית לתמונה שנבחרה מהמחשב עבור השכבה הזו (אם יש) */
  imagePreviewSrc?: string;
  /** url=null מנקה את התצוגה המקדימה. אף פעם לא נכתב ל-content.src עצמו. */
  onSetImagePreview?: (url: string | null) => void;
}) {
  const [tab, setTab] = useState<"basic" | "style" | "motion" | "advanced">("basic");
  const layer = scene.layers.find((l) => l.id === layerId);
  if (!layer) return null;

  const setLayer = (patch: Partial<ExperienceLayer>) => {
    onChange({ ...scene, layers: scene.layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l)) });
  };
  const layout = baseLayout(layer.layout);
  const setLayout = (patch: Partial<LayerLayout>) => setLayer({ layout: withBaseLayout(layer.layout, { ...layout, ...patch }) });
  const setContent = (content: LayerContent) => setLayer({ content });
  const setStyle = (patch: Partial<LayerStyle>) => setLayer({ style: { ...layer.style, ...patch } });

  const tabs = [
    ["basic", "בסיסי"],
    ["style", "עיצוב"],
    ["motion", "תנועה"],
    ["advanced", "מתקדם"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <button type="button" onClick={onBack} className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline">
          → כל השכבות
        </button>
        <h2 className="truncate text-sm font-bold text-slate-900">
          {LAYER_TYPE_LABELS[layer.type]} · {layer.id}
        </h2>
      </div>

      <div className="flex gap-1 rounded-md bg-slate-100 p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`flex-1 cursor-pointer rounded px-2 py-1.5 text-xs font-bold ${
              tab === key ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "basic" && (
        <div className="space-y-6">
          <PanelSection title="תוכן">
            <ContentFields
              layer={layer}
              onChange={setContent}
              imagePreviewSrc={imagePreviewSrc}
              onSetImagePreview={onSetImagePreview}
            />
          </PanelSection>
          <PanelSection title="מיקום">
            <TextField label="מיקום אופקי (x)" dir="ltr" value={layout.x ?? ""} onChange={(v) => setLayout({ x: v || undefined })} hint='למשל "50%"' />
            <TextField label="מיקום אנכי (y)" dir="ltr" value={layout.y ?? ""} onChange={(v) => setLayout({ y: v || undefined })} hint='למשל "40%"' />
            <TextField label="רוחב" dir="ltr" value={layout.width ?? ""} onChange={(v) => setLayout({ width: v || undefined })} hint='למשל "min(90vw, 48rem)"' />
            {layer.type === "shape" && (
              // Milestone G: shape layer ריק ממלא 100% מה-wrapper שלו --
              // בלי height מפורש הוא ריבוע לפי הרוחב (ברירת מחדל אוטומטית,
              // ראו ExperienceLayerRenderer); כאן מאפשרים לדרוס לצורת
              // מלבן/פאנל רחב שאינו ריבועי (למשל רקע בהיר מאחורי תוכן).
              <TextField label="גובה" dir="ltr" value={layout.height ?? ""} onChange={(v) => setLayout({ height: v || undefined })} hint='למשל "60vh" — ריק = ריבוע לפי הרוחב' />
            )}
            <SelectField label="נקודת עוגן" value={layout.anchor ?? "center"} onChange={(v) => setLayout({ anchor: v as LayerAnchor })} options={ANCHOR_OPTIONS as Array<{ value: string; label: string }>} />
            {layout.mode === "stage" && (
              <SelectField label="שכבת עומק" value={layout.zIndex ?? "content"} onChange={(v) => setLayout({ zIndex: v as LayerZLayer })} options={Z_OPTIONS} />
            )}
          </PanelSection>
          {/* Milestone E1: layer.hidden הפך ל-Responsive<boolean> -- הפאנל הזה
              עורך רק את מצב ה-base (עריכת tablet/mobile נפרדת אינה בהיקף
              המילסטון הזה); resolveResponsive עם "base" מחזיר בדיוק את
              ההתנהגות הקודמת כש-hidden הוא boolean רגיל. */}
          <CheckboxField
            label="שכבה מוסתרת (לא מרונדרת בכלל)"
            checked={resolveResponsive(layer.hidden ?? false, "base")}
            onChange={(v) => setLayer({ hidden: v })}
          />
        </div>
      )}

      {tab === "style" && (
        <PanelSection title="עיצוב">
          <TextField label="צבע (טוקן או הקס)" dir="ltr" value={layer.style?.color ?? ""} onChange={(v) => setStyle({ color: v || undefined })} hint='"primary" / "text" / "#RRGGBB"' />
          <TextField label="רקע (טוקן או הקס)" dir="ltr" value={layer.style?.background ?? ""} onChange={(v) => setStyle({ background: v || undefined })} />
          <SliderField label="עיגול פינות" value={layer.style?.radius ?? 0} onChange={(v) => setStyle({ radius: v })} min={0} max={64} />
          <SelectField label="צל" value={layer.style?.shadow ?? "none"} onChange={(v) => setStyle({ shadow: v as LayerStyle["shadow"] })} options={SHADOW_OPTIONS} />
        </PanelSection>
      )}

      {tab === "motion" && <MotionTab scene={scene} layerId={layerId} defaultEasing={defaultEasing} onChange={onChange} />}

      {tab === "advanced" && <AdvancedTab layer={layer} onChange={(next) => onChange({ ...scene, layers: scene.layers.map((l) => (l.id === layerId ? next : l)) })} />}
    </div>
  );
}

function ContentFields({
  layer,
  onChange,
  imagePreviewSrc,
  onSetImagePreview,
}: {
  layer: ExperienceLayer;
  onChange: (content: LayerContent) => void;
  imagePreviewSrc?: string;
  onSetImagePreview?: (url: string | null) => void;
}) {
  switch (layer.type) {
    case "text": {
      const c = layer.content as Extract<LayerContent, { text: string; tag: string }>;
      return (
        <>
          <TextField label="טקסט" value={c.text} onChange={(v) => onChange({ ...c, text: v })} />
          <SelectField
            label="תג סמנטי"
            value={c.tag}
            onChange={(v) => onChange({ ...c, tag: v as typeof c.tag })}
            options={["h1", "h2", "h3", "h4", "p", "span"].map((t) => ({ value: t, label: t }))}
          />
        </>
      );
    }
    case "image": {
      const c = layer.content as Extract<LayerContent, { src: string }>;
      return (
        <>
          <ImagePreviewPicker previewSrc={imagePreviewSrc} onSetPreview={onSetImagePreview} />
          <TextField label="כתובת התמונה" dir="ltr" value={c.src} onChange={(v) => onChange({ ...c, src: v })} />
          <CheckboxField label="דקורטיבית (בלי alt, מוסתרת מקוראי מסך)" checked={!!c.decorative} onChange={(v) => onChange({ ...c, decorative: v })} />
          {!c.decorative && <TextField label="טקסט חלופי (alt)" value={c.alt} onChange={(v) => onChange({ ...c, alt: v })} />}
        </>
      );
    }
    case "shape": {
      const c = layer.content as Extract<LayerContent, { shape: string }>;
      return (
        <SelectField
          label="צורה"
          value={c.shape}
          onChange={(v) => onChange({ ...c, shape: v as typeof c.shape })}
          options={[
            { value: "circle", label: "עיגול" },
            { value: "blob", label: "כתם אורגני" },
            { value: "rect", label: "מלבן" },
          ]}
        />
      );
    }
    case "button": {
      const c = layer.content as Extract<LayerContent, { label: string; href: string }>;
      return (
        <>
          <TextField label="טקסט הכפתור" value={c.label} onChange={(v) => onChange({ ...c, label: v })} />
          <TextField label="קישור" dir="ltr" value={c.href} onChange={(v) => onChange({ ...c, href: v })} />
          <SelectField
            label="סגנון"
            value={c.variant ?? "primary"}
            onChange={(v) => onChange({ ...c, variant: v as typeof c.variant })}
            options={[
              { value: "primary", label: "ראשי" },
              { value: "outline", label: "מסגרת" },
              { value: "ghost", label: "שקוף" },
              { value: "inverted", label: "הפוך" },
            ]}
          />
        </>
      );
    }
    case "block": {
      const c = layer.content as Extract<LayerContent, { blockId: string }>;
      return (
        <TextField
          label="מזהה הבלוק בדף"
          dir="ltr"
          value={c.blockId}
          onChange={(v) => onChange({ ...c, blockId: v })}
          hint="הבלוק מוצג עם המיקום/סגנון/תנועה של השכבה הזו"
        />
      );
    }
  }
}

/**
 * בחירת קובץ מהמחשב לתצוגה מקדימה בלבד: יוצר blob URL זמני (§ בקשת
 * המשתמש — "שלא יישמר בפועל, רק לתצוגה"). לעולם לא נכתב ל-content.src
 * -- זורם דרך imagePreviewOverrides (experience-layer.tsx) ישירות
 * לתצוגה החיה של הסטודיו, ולכן לא נכנס ל-localStorage/ה-JSON המיוצא.
 * נעלם אוטומטית ברענון (blob URL תלוי-מסמך) וגם באופן יזום עם "ניקוי".
 */
function ImagePreviewPicker({
  previewSrc,
  onSetPreview,
}: {
  previewSrc?: string;
  onSetPreview?: (url: string | null) => void;
}) {
  if (!onSetPreview) return null;
  return (
    <div className="space-y-1.5 rounded-md border border-dashed border-indigo-300 bg-indigo-50/50 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="cursor-pointer text-xs font-bold text-indigo-700 hover:underline">
          📁 בחירת תמונה מהמחשב (לתצוגה בלבד)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSetPreview(URL.createObjectURL(file));
              e.target.value = "";
            }}
          />
        </label>
        {previewSrc && (
          <button
            type="button"
            onClick={() => onSetPreview(null)}
            className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-red-600"
          >
            ניקוי
          </button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-indigo-600">
        לתצוגה חיה בלבד — לא נשמר בדף, לא נכלל בייצוא ונעלם ברענון. כדי
        שתמונה תישאר בדף בפועל, הזינו כתובת URL אמיתית למטה.
      </p>
      {previewSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- תמונת תצוגה מקדימה זמנית מ-blob URL, לא נכס אמיתי
        <img src={previewSrc} alt="" className="h-16 w-full rounded object-cover" />
      )}
    </div>
  );
}

function MotionTab({
  scene,
  layerId,
  defaultEasing,
  onChange,
}: {
  scene: ExperienceScene;
  layerId: string;
  defaultEasing: EasingId;
  onChange: (next: ExperienceScene) => void;
}) {
  const tracks = scene.tracks.filter((t) => t.target === layerId);

  const updateTrack = (trackId: string, patch: Partial<ExperienceTrack>) =>
    onChange({ ...scene, tracks: scene.tracks.map((t) => (t.id === trackId ? { ...t, ...patch } : t)) });

  const removeTrack = (trackId: string) => {
    if (!window.confirm("להסיר את התנועה הזו מהשכבה?")) return;
    onChange({ ...scene, tracks: scene.tracks.filter((t) => t.id !== trackId) });
  };

  const addTrack = () => {
    const id = newTrackId(scene.tracks);
    const track: ExperienceTrack = {
      id,
      target: layerId,
      easing: defaultEasing,
      props: { opacity: [{ at: 0, value: 0 }, { at: 0.3, value: 1 }] },
    };
    onChange({ ...scene, tracks: [...scene.tracks, track] });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-400">
        התנועה מונעת ב-100% מהתקדמות הגלילה בסצנה (0 בתחילתה, 1
        בסופה) — לא מזמן. גררו את סרגל הטיימליין בתצוגה החיה כדי לראות
        כל נקודה.
      </p>

      {tracks.map((track) => (
        <div key={track.id} className="space-y-3 rounded-lg border border-slate-200 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1">
              <SelectField
                label="עקומת תנועה"
                value={track.easing ?? defaultEasing}
                onChange={(v) => updateTrack(track.id, { easing: v as EasingId })}
                options={Object.entries(EASING_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <button
              type="button"
              onClick={() => removeTrack(track.id)}
              className="shrink-0 cursor-pointer text-xs font-semibold text-red-600 hover:underline"
            >
              מחיקת תנועה
            </button>
          </div>

          {(Object.keys(track.props) as AnimatableProp[]).map((prop) => (
            <KeyframeEditor
              key={prop}
              label={PROPERTY_LABELS[prop]}
              unit={PROPERTY_METADATA[prop].unit}
              keyframes={track.props[prop] ?? []}
              onChange={(next) => updateTrack(track.id, { props: { ...track.props, [prop]: next } })}
              onRemoveProperty={() => {
                const nextProps = { ...track.props };
                delete nextProps[prop];
                updateTrack(track.id, { props: nextProps });
              }}
            />
          ))}

          <AddPropertyButton
            existing={Object.keys(track.props) as AnimatableProp[]}
            onAdd={(prop) =>
              updateTrack(track.id, {
                props: {
                  ...track.props,
                  [prop]: [
                    { at: 0, value: PROPERTY_METADATA[prop].default },
                    { at: 1, value: PROPERTY_METADATA[prop].default },
                  ],
                },
              })
            }
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addTrack}
        className="w-full cursor-pointer rounded-md border border-dashed border-indigo-400 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
      >
        {tracks.length === 0 ? "+ הוספת תנועה לשכבה" : "+ תנועה נוספת"}
      </button>
    </div>
  );
}

function KeyframeEditor({
  label,
  unit,
  keyframes,
  onChange,
  onRemoveProperty,
}: {
  label: string;
  unit: string;
  keyframes: Keyframe[];
  onChange: (next: Keyframe[]) => void;
  onRemoveProperty: () => void;
}) {
  const sorted = [...keyframes].sort((a, b) => a.at - b.at);
  const update = (i: number, patch: Partial<Keyframe>) =>
    onChange(sorted.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  const remove = (i: number) => onChange(sorted.filter((_, idx) => idx !== i));
  const add = () => onChange([...sorted, { at: 1, value: sorted[sorted.length - 1]?.value ?? 0 }]);

  return (
    <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={add} className="cursor-pointer text-xs font-semibold text-indigo-600 hover:underline">
            + נקודה
          </button>
          <button type="button" onClick={onRemoveProperty} className="cursor-pointer text-xs text-slate-400 hover:text-red-600">
            הסרת מאפיין
          </button>
        </div>
      </div>
      {sorted.map((k, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor={`kf-at-${label}-${i}`}>
            התקדמות (0–1)
          </label>
          <input
            id={`kf-at-${label}-${i}`}
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={k.at}
            dir="ltr"
            onChange={(e) => update(i, { at: Number(e.target.value) })}
            className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs"
          />
          <span aria-hidden="true" className="text-xs text-slate-400">
            →
          </span>
          <label className="sr-only" htmlFor={`kf-val-${label}-${i}`}>
            ערך
          </label>
          <input
            id={`kf-val-${label}-${i}`}
            type="number"
            step={unit === "" ? 0.05 : 1}
            value={k.value}
            dir="ltr"
            onChange={(e) => update(i, { value: Number(e.target.value) })}
            className="w-20 rounded border border-slate-300 px-1.5 py-1 text-xs"
          />
          <span className="text-xs text-slate-400">{unit}</span>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={sorted.length <= 1}
            aria-label="הסרת נקודה"
            className="ms-auto cursor-pointer text-xs text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function AddPropertyButton({
  existing,
  onAdd,
}: {
  existing: AnimatableProp[];
  onAdd: (prop: AnimatableProp) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = (Object.keys(PROPERTY_LABELS) as AnimatableProp[]).filter((p) => !existing.includes(p));
  if (available.length === 0) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer text-xs font-semibold text-indigo-600 hover:underline">
        + מאפיין לתנועה
      </button>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {available.map((prop) => (
        <button
          key={prop}
          type="button"
          onClick={() => {
            onAdd(prop);
            setOpen(false);
          }}
          className="cursor-pointer rounded-full border border-indigo-300 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          {PROPERTY_LABELS[prop]}
        </button>
      ))}
    </div>
  );
}

function AdvancedTab({ layer, onChange }: { layer: ExperienceLayer; onChange: (next: ExperienceLayer) => void }) {
  const [text, setText] = useState(() => JSON.stringify(layer, null, 2));
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    try {
      const parsed = JSON.parse(text) as ExperienceLayer;
      if (!parsed.id || !parsed.type) throw new Error("חסרים שדות חובה (id/type)");
      onChange({ ...parsed, id: layer.id }); // מזהה השכבה עצמו לא ניתן לשינוי מכאן -- מונע פירוד מה-tracks שמצביעים עליו
      setError(null);
    } catch {
      setError("JSON לא תקין — הפעולה בוטלה, שום דבר לא נשמר");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-400">
        עריכת ה-JSON הגולמי של השכבה. שינוי כאן דורש לחיצה על ״החלה״ —
        לא נשמר תוך כדי הקלדה. מזהה השכבה (id) לא ניתן לשינוי כאן, כדי
        לא לנתק תנועות קיימות שמצביעות אליו.
      </p>
      <textarea
        dir="ltr"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={16}
        spellCheck={false}
        className={`w-full rounded-md border p-2.5 font-mono text-xs text-slate-800 focus:outline-none ${
          error ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-indigo-500"
        }`}
      />
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        onClick={apply}
        className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
      >
        החלה
      </button>
    </div>
  );
}

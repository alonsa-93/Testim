import type {
  AnimatableProp,
  EasingId,
  ExperienceConfig,
  ExperienceLayer,
  ExperienceScene,
  ExperienceSettings,
  ExperienceTrack,
  Keyframe,
  LayerType,
} from "./experience";

/**
 * נורמליזציית Experience שהגיע מבחוץ (ייבוא / טיוטה ישנה / page.experience
 * גולמי). אותו עיקרון בדיוק כמו normalizePage/normalizeTheme הקיימים:
 * ממלא ברירות מחדל, מסנן ערכים לא תקינים בשקט, ולעולם לא זורק — Experience
 * פגום חייב ליפול בחינניות ל-Standard rendering (docs/experience-audit.md
 * §5.2, R7).
 *
 * חשוב: `enabled: false` **לא** אומר "השלך את הנתונים" — זה בדיוק המצב
 * ש-Studio חייב לשמר כש-Experience כבוי (§53/§95 במסמך הסופי: "no data
 * loss" במעבר בין מצבי דף). לכן הפונקציה מנרמלת באופן מלא כל אימת
 * שהשדה קיים בכלל, ומחזירה undefined רק כשהוא נעדר לגמרי (=דף ישן
 * שמעולם לא ידע Experience).
 */

const LAYER_TYPES: ReadonlySet<string> = new Set(["text", "image", "shape", "button", "block"]);
const EASING_IDS: ReadonlySet<string> = new Set(["linear", "soft", "spring", "cinematic", "sharp"]);
const ANIMATABLE_PROPS: ReadonlySet<string> = new Set(["opacity", "x", "y", "scale", "rotate", "blur"]);
const COMPOSITIONS: ReadonlySet<string> = new Set(["stage", "flow"]);
const TRANSITIONS: ReadonlySet<string> = new Set(["cut", "fade", "crossfade", "directional"]);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function normalizeEasing(v: unknown, fallback: EasingId): EasingId {
  return typeof v === "string" && EASING_IDS.has(v) ? (v as EasingId) : fallback;
}

/** מסנן keyframes לא תקינים (at/value לא מספרים, NaN) וממיין לפי "at" */
function normalizeKeyframes(raw: unknown): Keyframe[] {
  if (!Array.isArray(raw)) return [];
  const kfs: Keyframe[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.at !== "number" || Number.isNaN(r.at)) continue;
    if (typeof r.value !== "number" || Number.isNaN(r.value)) continue;
    kfs.push({
      at: clamp01(r.at),
      value: r.value,
      ...(typeof r.easing === "string" && EASING_IDS.has(r.easing) ? { easing: r.easing as EasingId } : {}),
    });
  }
  return kfs.sort((a, b) => a.at - b.at);
}

function normalizeProps(raw: unknown): Partial<Record<AnimatableProp, Keyframe[]>> {
  if (typeof raw !== "object" || raw === null) return {};
  const out: Partial<Record<AnimatableProp, Keyframe[]>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ANIMATABLE_PROPS.has(key)) continue;
    const kfs = normalizeKeyframes(value);
    if (kfs.length > 0) out[key as AnimatableProp] = kfs;
  }
  return out;
}

function normalizeRange(raw: unknown): [number, number] | undefined {
  if (!Array.isArray(raw) || raw.length !== 2) return undefined;
  const [a, b] = raw as unknown[];
  if (typeof a !== "number" || typeof b !== "number" || Number.isNaN(a) || Number.isNaN(b)) return undefined;
  return [clamp01(Math.min(a, b)), clamp01(Math.max(a, b))];
}

function normalizeTrack(raw: unknown, index: number, usedIds: Set<string>): ExperienceTrack | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.target !== "string" || !r.target) return null;

  const props = normalizeProps(r.props);
  // track שלא כותב לשום מאפיין אינו track אמיתי -- מדלגים במקום להשאיר "רפאים"
  if (Object.keys(props).length === 0) return null;

  let id = typeof r.id === "string" && r.id ? r.id : `track-${index + 1}`;
  while (usedIds.has(id)) id = `${id}-2`;
  usedIds.add(id);

  const range = normalizeRange(r.range);

  return {
    id,
    target: r.target,
    ...(range ? { range } : {}),
    ...(typeof r.easing === "string" && EASING_IDS.has(r.easing) ? { easing: r.easing as EasingId } : {}),
    props,
  };
}

function normalizeLayer(raw: unknown, index: number, usedIds: Set<string>): ExperienceLayer | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.type !== "string" || !LAYER_TYPES.has(r.type)) return null;
  const type = r.type as LayerType;

  let id = typeof r.id === "string" && r.id ? r.id : `${type}-${index + 1}`;
  while (usedIds.has(id)) id = `${id}-2`;
  usedIds.add(id);

  const content = typeof r.content === "object" && r.content !== null ? r.content : {};
  const layoutRaw = typeof r.layout === "object" && r.layout !== null ? r.layout : { mode: "flow" };

  return {
    id,
    type,
    content: content as ExperienceLayer["content"],
    layout: layoutRaw as ExperienceLayer["layout"],
    ...(typeof r.style === "object" && r.style !== null ? { style: r.style as ExperienceLayer["style"] } : {}),
    ...(typeof r.hidden === "boolean" ? { hidden: r.hidden } : {}),
  };
}

/** לעולם לא px גולמי כלפי המשתמש (§25) — 200 = "2× מסך", ברירת מחדל שמרנית */
function normalizeDurationVh(raw: unknown): ExperienceScene["durationVh"] {
  if (typeof raw === "number" && raw > 0) return raw;
  if (typeof raw === "object" && raw !== null) {
    const r = raw as Record<string, unknown>;
    if (typeof r.base === "number" && r.base > 0) {
      const out: { base: number; tablet?: number; mobile?: number } = { base: r.base };
      if (typeof r.tablet === "number" && r.tablet > 0) out.tablet = r.tablet;
      if (typeof r.mobile === "number" && r.mobile > 0) out.mobile = r.mobile;
      return out;
    }
  }
  return 200;
}

function normalizeScene(raw: unknown, index: number, usedSceneIds: Set<string>): ExperienceScene | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  let id = typeof r.id === "string" && r.id ? r.id : `scene-${index + 1}`;
  while (usedSceneIds.has(id)) id = `${id}-2`;
  usedSceneIds.add(id);

  const usedLayerIds = new Set<string>();
  const layers = Array.isArray(r.layers)
    ? r.layers
        .map((l, i) => normalizeLayer(l, i, usedLayerIds))
        .filter((l): l is ExperienceLayer => l !== null)
    : [];

  const usedTrackIds = new Set<string>();
  const tracks = Array.isArray(r.tracks)
    ? r.tracks
        .map((t, i) => normalizeTrack(t, i, usedTrackIds))
        .filter((t): t is ExperienceTrack => t !== null)
    : [];

  const composition = typeof r.composition === "string" && COMPOSITIONS.has(r.composition)
    ? (r.composition as ExperienceScene["composition"])
    : "flow";

  return {
    id,
    name: typeof r.name === "string" && r.name ? r.name : `סצנה ${index + 1}`,
    composition,
    pinned: typeof r.pinned === "boolean" ? r.pinned : composition === "stage",
    durationVh: normalizeDurationVh(r.durationVh),
    ...(typeof r.background === "object" && r.background !== null
      ? { background: r.background as ExperienceScene["background"] }
      : {}),
    ...(typeof r.transition === "string" && TRANSITIONS.has(r.transition)
      ? { transition: r.transition as ExperienceScene["transition"] }
      : {}),
    ...(Array.isArray(r.blockRefs)
      ? { blockRefs: r.blockRefs.filter((b): b is string => typeof b === "string") }
      : {}),
    layers,
    tracks,
  };
}

function normalizeSettings(raw: unknown): ExperienceSettings {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    defaultDurationVh: typeof r.defaultDurationVh === "number" && r.defaultDurationVh > 0 ? r.defaultDurationVh : 200,
    defaultEasing: normalizeEasing(r.defaultEasing, "soft"),
    reducedMotion: r.reducedMotion === "opacity-only" ? "opacity-only" : "static",
    performance: r.performance === "high" || r.performance === "lite" ? r.performance : "auto",
    intensity: typeof r.intensity === "number" ? clamp01(r.intensity) : 1,
    // scrub smoothing לא ממומש ב-MVP (§4.6 באודיט) -- תמיד 0 גם אם קובץ ישן מכיל ערך אחר
    scrub: 0,
    debug: typeof r.debug === "boolean" ? r.debug : false,
  };
}

/**
 * נקודת הכניסה היחידה לנרמול Experience. מוחזר `undefined` רק כש-`raw`
 * עצמו לא אובייקט (=השדה נעדר לגמרי מה-Page, התאמה לאחור טהורה).
 * כל שאר המקרים — כולל `{}` ריק וכולל `enabled:false` — מנורמלים
 * לאובייקט מלא, כדי לשמר דאטה גם כש-Experience כבוי.
 */
export function normalizeExperience(raw: unknown): ExperienceConfig | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;

  const usedSceneIds = new Set<string>();
  const scenes = Array.isArray(r.scenes)
    ? r.scenes
        .map((s, i) => normalizeScene(s, i, usedSceneIds))
        .filter((s): s is ExperienceScene => s !== null)
    : [];

  return {
    version: 1,
    enabled: r.enabled === true,
    mode: "scroll",
    settings: normalizeSettings(r.settings),
    scenes,
  };
}

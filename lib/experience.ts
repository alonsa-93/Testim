import { DS_EASE_OUT_SOFT, DS_EASE_SPRING } from "./effects";

/**
 * שכבת הטיפוסים של Experience Engine (Phase 1).
 * ראו docs/experience-audit.md §5–§12 להצדקה המלאה של כל החלטה כאן.
 *
 * זו שכבה רביעית, אופציונלית, ברמת הדף — לא תחליף ל-Theme/Blocks/Page/
 * Effects הקיימים. שום דבר כאן לא ידרוש שינוי בקוד הקיים כדי להמשיך
 * לעבוד בלי Experience בכלל.
 */

// ---------------------------------------------------------------------------
// Easing — משתמש בטוקנים הקיימים של Testim (soft/spring), לא ממציא מקבילית
// ---------------------------------------------------------------------------

export type EasingId = "linear" | "soft" | "spring" | "cinematic" | "sharp";

/** תוויות עברית לתצוגה בסטודיו — אותה קונבנציה כמו ANIM_*_LABELS ב-lib/effects.ts */
export const EASING_LABELS: Record<EasingId, string> = {
  linear: "ליניארי",
  soft: "רך",
  spring: "קפיצי",
  cinematic: "קולנועי",
  sharp: "חד",
};

/** עקומות בפועל: soft/spring שואלים בדיוק את הטוקנים הקיימים של Testim */
export const EASING_CURVES: Record<EasingId, string> = {
  linear: "linear",
  soft: DS_EASE_OUT_SOFT,
  spring: DS_EASE_SPRING,
  cinematic: "cubic-bezier(.16,1,.3,1)",
  sharp: "cubic-bezier(.4,0,.2,1)",
};

// ---------------------------------------------------------------------------
// Responsive<T> — ערך יחיד או override מפורש ל-tablet/mobile (§14 באודיט)
// ---------------------------------------------------------------------------

export type Responsive<T> = T | { base: T; tablet?: T; mobile?: T };

export type ResponsiveMode = "base" | "tablet" | "mobile";

/** פותר ערך responsive למצב viewport נתון, עם נפילה חכמה: mobile→tablet→base */
export function resolveResponsive<T>(value: Responsive<T>, mode: ResponsiveMode): T {
  if (value !== null && typeof value === "object" && "base" in (value as object)) {
    const r = value as { base: T; tablet?: T; mobile?: T };
    if (mode === "mobile") return r.mobile ?? r.tablet ?? r.base;
    if (mode === "tablet") return r.tablet ?? r.base;
    return r.base;
  }
  return value as T;
}

// ---------------------------------------------------------------------------
// Keyframes ו-Tracks (§9, §5.2)
// ---------------------------------------------------------------------------

/** MVP: 6 מאפיינים מספריים בלבד. הרחבה לצבע/מחרוזת עתידית (§5.2) */
export type AnimatableProp = "opacity" | "x" | "y" | "scale" | "rotate" | "blur";

export interface Keyframe {
  /** מיקום בתוך ה-track, 0–1 */
  at: number;
  value: number;
  /** easing מ-keyframe זה אל הבא; ברירת מחדל מה-track/settings */
  easing?: EasingId;
}

export interface ExperienceTrack {
  /** מזהה יציב — נדרש לזיהוי התנגשויות בעלות (§9) */
  id: string;
  /** target id של בלוק (§7) או layer id (§12) */
  target: string;
  /** תת-טווח בתוך ה-scene; ברירת מחדל [0,1] */
  range?: [number, number];
  easing?: EasingId;
  props: Partial<Record<AnimatableProp, Keyframe[]>>;
  responsive?: {
    tablet?: Partial<Record<AnimatableProp, Keyframe[]>>;
    mobile?: Partial<Record<AnimatableProp, Keyframe[]>>;
  };
}

// ---------------------------------------------------------------------------
// Property Metadata — מודל מרכזי אחד לכל מאפיין (§10)
// ---------------------------------------------------------------------------

export interface PropertyMetadata {
  type: "numeric" | "angle" | "length" | "responsive-length";
  unit: string;
  interpolation: "linear";
  /** [min, max] — max=null פירושו ללא תקרה */
  range?: [number, number | null];
  default: number;
  performanceClass: "cheap" | "expensive";
}

export const PROPERTY_METADATA: Record<AnimatableProp, PropertyMetadata> = {
  opacity: { type: "numeric", unit: "", interpolation: "linear", range: [0, 1], default: 1, performanceClass: "cheap" },
  x: { type: "responsive-length", unit: "%", interpolation: "linear", default: 0, performanceClass: "cheap" },
  y: { type: "responsive-length", unit: "%", interpolation: "linear", default: 0, performanceClass: "cheap" },
  scale: { type: "numeric", unit: "", interpolation: "linear", range: [0, null], default: 1, performanceClass: "cheap" },
  rotate: { type: "angle", unit: "deg", interpolation: "linear", default: 0, performanceClass: "cheap" },
  blur: { type: "length", unit: "px", interpolation: "linear", range: [0, null], default: 0, performanceClass: "expensive" },
};

export const PROPERTY_LABELS: Record<AnimatableProp, string> = {
  opacity: "שקיפות",
  x: "מיקום אופקי",
  y: "מיקום אנכי",
  scale: "קנה מידה",
  rotate: "סיבוב",
  blur: "טשטוש",
};

/**
 * targets שאסור ל-Experience לכתוב אליהם: הם כבר מבוקרים על ידי
 * אנימציית CSS אינסופית (`animation`), שגוברת בקסקדה על כל כתיבת
 * inline style — כתיבה מ-runtime תיבלע בשקט (R12 באודיט). המפתחות
 * כאן הם ה-className שהאלמנט נושא, לא target id שרירותי.
 */
export const INCOMPATIBLE_TARGETS: ReadonlySet<string> = new Set([
  "fx-marquee-track",
  "fx-aurora",
]);

// ---------------------------------------------------------------------------
// Layers — 5 טיפוסי MVP בלבד (§12.1)
// ---------------------------------------------------------------------------

export type LayerType = "text" | "image" | "shape" | "button" | "block";

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  text: "טקסט",
  image: "תמונה",
  shape: "צורה",
  button: "כפתור",
  block: "בלוק קיים",
};

export type LayerAnchor = "start" | "center" | "end";
export type LayerZLayer = "background" | "background-decoration" | "content" | "foreground" | "ui";

/** סדר הערמה בפועל — המשתמש בוחר קטגוריה סמנטית, לא z-index גולמי (§12.5) */
export const Z_LAYER_ORDER: Record<LayerZLayer, number> = {
  background: 0,
  "background-decoration": 1,
  content: 2,
  foreground: 3,
  ui: 4,
};

export const Z_LAYER_LABELS: Record<LayerZLayer, string> = {
  background: "רקע",
  "background-decoration": "קישוט רקע",
  content: "תוכן",
  foreground: "קדמה",
  ui: "ממשק",
};

export interface LayerLayout {
  mode: "stage" | "flow";
  /** "50%" / "12vw" / clamp() — לעולם לא px גולמי (§12.2) */
  x?: string;
  y?: string;
  width?: string;
  maxWidth?: string;
  anchor?: LayerAnchor;
  zIndex?: LayerZLayer;
}

export interface LayerStyle {
  /** טוקן סמנטי (primary/accent/text/muted/surface/background/border) או hex; hex עובר דרך lib/contrast.ts */
  color?: string;
  background?: string;
  radius?: number;
  shadow?: "none" | "soft" | "strong";
}

export interface TextLayerContent {
  text: string;
  /** תג סמנטי אמיתי — Text layer לא ברירת מחדל ל-div (§12.6) */
  tag: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export interface ImageLayerContent {
  src: string;
  /** חובה אלא אם decorative=true */
  alt: string;
  decorative?: boolean;
}

export interface ShapeLayerContent {
  shape: "circle" | "blob" | "rect";
}

export interface ButtonLayerContent {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}

/** הגשר בין Experience לבלוקים קיימים — לא משכפל תוכן, רק מפנה (§12.3) */
export interface BlockLayerContent {
  blockId: string;
}

export type LayerContent =
  | TextLayerContent
  | ImageLayerContent
  | ShapeLayerContent
  | ButtonLayerContent
  | BlockLayerContent;

export interface ExperienceLayer {
  id: string;
  type: LayerType;
  content: LayerContent;
  layout: Responsive<LayerLayout>;
  style?: LayerStyle;
  hidden?: boolean;
}

// ---------------------------------------------------------------------------
// Scene / Stage (§4.3, §11)
// ---------------------------------------------------------------------------

export type SceneComposition = "stage" | "flow";
export type SceneTransition = "cut" | "fade" | "crossfade" | "directional";

export interface SceneBackground {
  /** טוקן סמנטי או hex */
  color?: string;
  image?: string;
}

export interface ExperienceScene {
  id: string;
  name: string;
  composition: SceneComposition;
  /** רלוונטי בעיקר ל-stage; flow-mode יכול להישאר false */
  pinned: boolean;
  /** ביחידות "מסכים" — הסטודיו מציג 1×/2×/3×/5×, לא px (§25) */
  durationVh: Responsive<number>;
  background?: SceneBackground;
  transition?: SceneTransition;
  /** block instance ids מהדף שה-scene "תופס" ומכניס לבמה */
  blockRefs?: string[];
  layers: ExperienceLayer[];
  tracks: ExperienceTrack[];
}

/** לא boolean — state machine מפורש (§11). MVP צורך בפועל רק before/active/after */
export type SceneLifecycleState = "before" | "entering" | "active" | "leaving" | "after";

// ---------------------------------------------------------------------------
// Experience Config — השדה שמתווסף ל-Page (§5.1)
// ---------------------------------------------------------------------------

export interface ExperienceSettings {
  /** ברירת מחדל לאורך scene כשלא הוגדר במפורש, ביחידות "מסכים" */
  defaultDurationVh: number;
  defaultEasing: EasingId;
  reducedMotion: "static" | "opacity-only";
  performance: "auto" | "high" | "lite";
  /** damper גלובלי, 0–1 */
  intensity: number;
  /** scrub smoothing — MVP: תמיד 0, ראו §4.6 באודיט */
  scrub: number;
  debug: boolean;
}

export interface ExperienceConfig {
  version: 1;
  enabled: boolean;
  mode: "scroll";
  settings: ExperienceSettings;
  scenes: ExperienceScene[];
}

// ---------------------------------------------------------------------------
// מזהים חדשים — אותה קונבנציה בדיוק כמו newBlockId ב-lib/page.ts
// ---------------------------------------------------------------------------

export function newSceneId(existing: ExperienceScene[]): string {
  let n = existing.length + 1;
  let id = `scene-${n}`;
  while (existing.some((s) => s.id === id)) {
    n += 1;
    id = `scene-${n}`;
  }
  return id;
}

export function newLayerId(existing: ExperienceLayer[], type: LayerType): string {
  let n = existing.filter((l) => l.type === type).length + 1;
  let id = `${type}-${n}`;
  while (existing.some((l) => l.id === id)) {
    n += 1;
    id = `${type}-${n}`;
  }
  return id;
}

export function newTrackId(existing: ExperienceTrack[]): string {
  let n = existing.length + 1;
  let id = `track-${n}`;
  while (existing.some((t) => t.id === id)) {
    n += 1;
    id = `track-${n}`;
  }
  return id;
}

/** קונפיגורציית פתיחה נקייה — בשימוש כשמפעילים Experience לראשונה בסטודיו (§53) */
export function emptyExperience(): ExperienceConfig {
  return {
    version: 1,
    enabled: true,
    mode: "scroll",
    settings: {
      defaultDurationVh: 200,
      defaultEasing: "soft",
      reducedMotion: "static",
      performance: "auto",
      intensity: 1,
      scrub: 0,
      debug: false,
    },
    scenes: [],
  };
}

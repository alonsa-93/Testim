/**
 * מנוע האפקטים (Effects Engine)
 * ------------------------------
 * שכבת הטיפוסים והלוגיקה המשותפת לכל אנימציה ואפקט ויזואלי במערכת:
 * טיפוסי אנימציה לבלוק, פריסטים של עוצמה, האנומים של אפקטי הערכה
 * (רקע/כרטיסים/זוהר/כפתורים), וטבלת "כמה זה יזוז" לכל עוצמה.
 * הבלוקים לא מכירים CSS בעצמם — הם רק קוראים ל-resolveAnim ומקבלים
 * תצורה קונקרטית (או null כשאין אנימציה), ו-components/fx הופכים
 * אותה לתכונות data/CSS vars בפועל.
 */

import type { CSSProperties } from "react";
import type { BlockContent, FieldDef } from "./fields";

/** סוג אנימציית הכניסה שבלוק יכול לבקש. "inherit" יורש מהערכה, "none" מכבה. */
export type AnimType =
  | "inherit"
  | ThemeAnimStyle
  | "slide-start"
  | "word-stagger";

/** סגנון האנימציה שערכה יכולה להגדיר כברירת מחדל לכל הדף. */
export type ThemeAnimStyle = "none" | "fade" | "rise" | "scale" | "blur";

/** עוצמת אנימציה: כמה שהיא בולטת (מרחק תזוזה, משך, סטאגר). */
export type AnimIntensity = "subtle" | "dynamic" | "dramatic";

/** פריסט העוצמה שבלוק בוחר: יורש מהערכה, כבוי, או עוקף עם עוצמה מפורשת. */
export type AnimPreset = "inherit" | "off" | AnimIntensity;

/** אפקט הרקע הדקורטיבי של הערכה. */
export type BackgroundFx = "none" | "aurora" | "orbs" | "dots" | "grid";

/** סגנון העיצוב התלת-ממדי של כרטיסים. */
export type CardFx = "flat" | "raised" | "glass" | "tilt";

/** עוצמת אפקטי הזוהר (ספוטלייט, הילות). */
export type GlowLevel = "none" | "soft" | "intense";

/** סגנון הכפתורים: שטוח, לחיץ בתלת-ממד, או עם ברק חולף. */
export type ButtonStyle = "flat" | "push" | "shine";

/**
 * תצורת אנימציה כפי שהיא נשמרת בתוכן הבלוק (content._anim).
 * כל השדות אופציונליים — בלוק בלי _anim בכלל = "ירושה מלאה מהערכה".
 * duration/delay/stagger מוצגים בסטודיו רק תחת "מתקדם".
 */
export interface BlockAnim {
  preset?: AnimPreset;
  type?: AnimType;
  durationMs?: number;
  delayMs?: number;
  staggerMs?: number;
  once?: boolean;
}

/** תוצאת רזולוציית האנימציה: תצורה קונקרטית שרכיבי fx יכולים לצרוך ישירות. */
export interface ResolvedAnim {
  type: Exclude<AnimType, "inherit" | "none">;
  durationMs: number;
  delayMs: number;
  staggerMs: number;
  once: boolean;
  /** מרחק התזוזה בפיקסלים, לפי טבלת העוצמות (INTENSITY) */
  distance: number;
}

/**
 * תת-הקבוצה של Theme.effects שרזולוציית האנימציה צריכה.
 * טיפוס מבני (לא ייבוא מ-lib/theme.ts) כדי שלא תיווצר תלות מעגלית —
 * lib/theme.ts הוא זה שמייבא את הטיפוסים מהקובץ הזה, לא להפך.
 */
export interface EffectsAnimationSource {
  animation: {
    style: ThemeAnimStyle;
    intensity: AnimIntensity;
  };
}

/** תקרות קשיחות לערכי אנימציה — מונעות "הצפת אנימציה" גם בעוצמת "פסיכי". */
export const ANIM_CAPS = {
  durationMs: 2000,
  delayMs: 1500,
  staggerMs: 200,
} as const;

/**
 * טבלת העוצמות: כמה פיקסלים לזוז, כמה זמן, וכמה סטאגר בין ילדים —
 * לפי עוצמה. זו טבלת האמת היחידה; גם themeToCssVars וגם resolveAnim
 * קוראים ממנה כדי שלא יהיו שני מקורות לאותו מספר.
 */
export const INTENSITY: Record<
  AnimIntensity,
  { distance: number; duration: number; stagger: number }
> = {
  subtle: { distance: 12, duration: 500, stagger: 60 },
  dynamic: { distance: 24, duration: 600, stagger: 100 },
  dramatic: { distance: 40, duration: 800, stagger: 140 },
};

/** טוקני ה-easing החתימתיים של המותג (ראו repos-report) — קבועים, לא ניתנים לעריכה. */
export const DS_EASE_OUT_SOFT = "cubic-bezier(.2,.7,.2,1)";
export const DS_EASE_SPRING = "cubic-bezier(.22,1,.36,1)";

/** תוויות עברית לתצוגה בסטודיו (שלב ג') */
export const ANIM_INTENSITY_LABELS: Record<AnimIntensity, string> = {
  subtle: "עדין",
  dynamic: "דינמי",
  dramatic: "פסיכי",
};

export const ANIM_PRESET_LABELS: Record<AnimPreset, string> = {
  inherit: "ירושה מהערכה",
  off: "כבוי",
  ...ANIM_INTENSITY_LABELS,
};

export const ANIM_TYPE_LABELS: Record<AnimType, string> = {
  inherit: "ירושה מהערכה",
  none: "ללא",
  fade: "דהייה",
  rise: "עלייה",
  "slide-start": "החלקה מהצד",
  scale: "זום",
  blur: "טשטוש",
  "word-stagger": "מילה-מילה",
};

export const BACKGROUND_FX_LABELS: Record<BackgroundFx, string> = {
  none: "ללא",
  aurora: "אורורה",
  orbs: "כתמי אור",
  dots: "נקודות",
  grid: "רשת",
};

export const CARD_FX_LABELS: Record<CardFx, string> = {
  flat: "שטוח",
  raised: "מורם",
  glass: "זכוכית",
  tilt: "הטיה תלת-ממד",
};

export const GLOW_LEVEL_LABELS: Record<GlowLevel, string> = {
  none: "ללא",
  soft: "עדין",
  intense: "עז",
};

export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = {
  flat: "שטוח",
  push: "תלת-ממד (לחיצה)",
  shine: "ברק",
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * פותר תצורת אנימציה של בלוק אל מול ברירות המחדל של הערכה.
 * מחזיר null כשהאנימציה כבויה (preset="off" או type הנפתר הוא "none") —
 * כלומר: לא לרנדר שום data-animate, הבלוק תמיד גלוי.
 */
export function resolveAnim(
  themeEffects: EffectsAnimationSource,
  blockAnim?: BlockAnim
): ResolvedAnim | null {
  const preset = blockAnim?.preset ?? "inherit";
  if (preset === "off") return null;

  const rawType = blockAnim?.type ?? "inherit";
  const type: AnimType = rawType === "inherit" ? themeEffects.animation.style : rawType;
  if (type === "none") return null;

  const intensityKey: AnimIntensity =
    preset === "inherit" ? themeEffects.animation.intensity : preset;
  const base = INTENSITY[intensityKey];

  return {
    type,
    durationMs: clamp(blockAnim?.durationMs ?? base.duration, 0, ANIM_CAPS.durationMs),
    delayMs: clamp(blockAnim?.delayMs ?? 0, 0, ANIM_CAPS.delayMs),
    staggerMs: clamp(blockAnim?.staggerMs ?? base.stagger, 0, ANIM_CAPS.staggerMs),
    once: blockAnim?.once ?? true,
    distance: base.distance,
  };
}

/* ========================================================================
 * שלב ב' — אינטגרציית הבלוקים: אחסון האנימציה ברמת content הבלוק.
 * ======================================================================== */

const ANIM_PRESET_VALUES = new Set<string>(["inherit", "off", "subtle", "dynamic", "dramatic"]);
const ANIM_TYPE_VALUES = new Set<string>([
  "inherit",
  "none",
  "fade",
  "rise",
  "scale",
  "blur",
  "slide-start",
  "word-stagger",
]);

function isAnimPreset(v: unknown): v is AnimPreset {
  return typeof v === "string" && ANIM_PRESET_VALUES.has(v);
}
function isAnimType(v: unknown): v is AnimType {
  return typeof v === "string" && ANIM_TYPE_VALUES.has(v);
}

/**
 * צורת האחסון של אנימציה ברמת הבלוק — כפי שממומש בפועל בשלב ב'.
 *
 * WORKPLAN.md סעיף 3.2 מתאר מבנה מקונן: `content._anim.preset` וכו'.
 * בפועל נבדק components/studio/field-editor.tsx ו-block-editor.tsx:
 * `setField(key, value)` כותב ישירות ל-`content[field.key]` בלי שום
 * פירוק דרך נקודות (dot-path) — עורך השדות הגנרי לא תומך במפתחות
 * מקוננים. כדי לא לשבור אותו ולא להוסיף שכבת parsing חדשה רק בשביל
 * האנימציה, האנימציה נשמרת כמפתחות שטוחים ברמת content העליונה:
 *   animPreset · animType · animDurationMs · animDelayMs ·
 *   animStaggerMs · animOnce
 * זו הפשרה שה-AGENTS.md/הנחיות השלב מרשות במפורש כש"נקודה" לא נתמכת.
 * שלב ג' (סטודיו) יכול לבנות ישירות על ANIM_FIELDS למטה, בלי לשנות
 * את מנגנון עורך השדות הקיים.
 */
export function getBlockAnim(content: BlockContent): BlockAnim {
  return {
    preset: isAnimPreset(content.animPreset) ? content.animPreset : undefined,
    type: isAnimType(content.animType) ? content.animType : undefined,
    durationMs: typeof content.animDurationMs === "number" ? content.animDurationMs : undefined,
    delayMs: typeof content.animDelayMs === "number" ? content.animDelayMs : undefined,
    staggerMs: typeof content.animStaggerMs === "number" ? content.animStaggerMs : undefined,
    once: typeof content.animOnce === "boolean" ? content.animOnce : undefined,
  };
}

/**
 * קבוצת שדות האנימציה הגנרית: כל בלוק שרוצה לתת לעורך שליטה על
 * הכניסה שלו (מעבר לירושה מהערכה) פשוט מוסיף `...ANIM_FIELDS` לסוף
 * מערך ה-fields שלו. duration/delay/stagger הם "מתקדם" במכוון —
 * שלב ג' יקפל אותם תחת accordion; כאן הם רק עוד שדות ברשימה.
 */
export const ANIM_FIELDS: FieldDef[] = [
  {
    key: "animPreset",
    type: "select",
    label: "עוצמת אנימציה",
    hint: "ירושה מהערכה, כיבוי, או עוצמה מפורשת לבלוק הזה בלבד",
    options: [
      { value: "inherit", label: ANIM_PRESET_LABELS.inherit },
      { value: "off", label: ANIM_PRESET_LABELS.off },
      { value: "subtle", label: ANIM_PRESET_LABELS.subtle },
      { value: "dynamic", label: ANIM_PRESET_LABELS.dynamic },
      { value: "dramatic", label: ANIM_PRESET_LABELS.dramatic },
    ],
  },
  {
    key: "animType",
    type: "select",
    label: "סוג הכניסה",
    options: [
      { value: "inherit", label: "ירושה מהערכה" },
      { value: "fade", label: ANIM_TYPE_LABELS.fade },
      { value: "rise", label: ANIM_TYPE_LABELS.rise },
      { value: "slide-start", label: ANIM_TYPE_LABELS["slide-start"] },
      { value: "scale", label: ANIM_TYPE_LABELS.scale },
      { value: "blur", label: ANIM_TYPE_LABELS.blur },
    ],
  },
  {
    key: "animDurationMs",
    type: "number",
    label: "משך (מתקדם)",
    min: 0,
    max: ANIM_CAPS.durationMs,
    step: 50,
    unit: "ms",
  },
  {
    key: "animDelayMs",
    type: "number",
    label: "עיכוב (מתקדם)",
    min: 0,
    max: ANIM_CAPS.delayMs,
    step: 50,
    unit: "ms",
  },
  {
    key: "animStaggerMs",
    type: "number",
    label: "סטאגר בין פריטים (מתקדם)",
    min: 0,
    max: ANIM_CAPS.staggerMs,
    step: 10,
    unit: "ms",
  },
  { key: "animOnce", type: "boolean", label: "להפעיל רק בכניסה הראשונה" },
];

/**
 * ברירת מחדל כש-theme לא הועבר לבלוק בכלל — רשת הגנה בלבד (בפועל כל
 * דפי המערכת עוברים דרך ThemeScope+PageRenderer שמעבירים theme תמיד).
 * תואמת את ברירות המחדל השמרניות של normalizeTheme ב-lib/theme.ts.
 */
export const DEFAULT_EFFECTS_SOURCE: EffectsAnimationSource = {
  animation: { style: "rise", intensity: "subtle" },
};

/**
 * קיצור נוחות: מרכיב getBlockAnim + resolveAnim + נפילה ל-ברירת
 * המחדל כשאין theme — במקום אחד. כל בלוק שמצייר Reveal קורא
 * `resolveBlockAnim(theme?.effects, content)` ומקבל תצורה מוכנה.
 */
export function resolveBlockAnim(
  themeEffects: EffectsAnimationSource | undefined,
  content: BlockContent
): ResolvedAnim | null {
  return resolveAnim(themeEffects ?? DEFAULT_EFFECTS_SOURCE, getBlockAnim(content));
}

/**
 * מוסיף עיכוב מדורג לפי אינדקס לתצורת אנימציה שכבר נפתרה — לשימוש
 * כשכמה מופעי Reveal *נפרדים* (כרטיסי רשת, פריטי הירו) צריכים
 * להיכנס בזה אחר זה. בשונה מ-.split-word ב-CSS (שם כל המילים חולקות
 * הורה Reveal אחד וה-CSS מכפיל את --i אוטומטית ב-transition-delay),
 * כאן כל פריט הוא Reveal עצמאי משלו עם ה-IntersectionObserver שלו —
 * אז חישוב הסטאגר קורה כאן, ב-JS, לפני שהתצורה מגיעה ל-Reveal.
 */
export function staggerChild(anim: ResolvedAnim | null, index: number): ResolvedAnim | null {
  if (!anim) return null;
  return {
    ...anim,
    delayMs: clamp(anim.delayMs + index * anim.staggerMs, 0, ANIM_CAPS.delayMs),
  };
}

/**
 * עוזר לילדים בתוך קונטיינר עם סטאגר משותף (--i, למשל .split-word
 * ב-globals.css): מוסיף את המשתנה --i לאלמנט. חי כאן (לא ב-
 * components/fx/reveal.tsx, ששם "use client") כי הוא פונקציה טהורה
 * בלי hooks, ובלוקים (רכיבי שרת) צריכים לקרוא לה ישירות — export מקובץ
 * "use client" נחשב client reference ולא ניתן להפעלה מרכיב שרת, גם
 * כשהפונקציה עצמה לא צריכה קליינט בכלל.
 * שימוש: <div style={staggerStyle(i)} className="split-word">…
 */
export function staggerStyle(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

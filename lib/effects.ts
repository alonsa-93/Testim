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

import type { CSSProperties } from "react";
import { bestTextOn } from "./contrast";
import {
  DS_EASE_OUT_SOFT,
  DS_EASE_SPRING,
  INTENSITY,
  type AnimIntensity,
  type BackgroundFx,
  type ButtonStyle,
  type CardFx,
  type GlowLevel,
  type ThemeAnimStyle,
} from "./effects";

/**
 * מנוע הערכות (Theme Engine)
 * ---------------------------
 * ערכת נושא היא אובייקט JSON אחד שמתאר את כל העיצוב של דף:
 * צבעים, טיפוגרפיה, צורה, פריסה ואפקטים.
 * הפונקציה themeToCssVars ממירה את הערכה למשתני CSS (--ds-*),
 * ו-globals.css ממפה את המשתנים האלה ליוטיליטיז של Tailwind.
 * החלפת ערכה = החלפת ערכי המשתנים. הרכיבים לא משתנים לעולם.
 *
 * טיפוסי האפקטים (BackgroundFx, CardFx, GlowLevel, ButtonStyle, אנימציה)
 * מוגדרים ב-lib/effects.ts — כאן רק מרכיבים אותם לתוך צורת Theme.effects
 * ופולטים אותם כמשתני CSS.
 */

export type ShadowLevel = "none" | "soft" | "strong";

export interface ThemeColors {
  /** צבע המותג הראשי — כפתורים, קישורים, הדגשות */
  primary: string;
  /** גוון primary במצב hover */
  primaryHover: string;
  /** צבע טקסט שמונח על גבי primary */
  onPrimary: string;
  /** צבע מבטא משני — תגיות, כוכבים, הדגשות קטנות */
  accent: string;
  /** צבע טקסט שמונח על גבי accent */
  onAccent: string;
  /** רקע העמוד */
  background: string;
  /** רקע משטחים מורמים — כרטיסים, טפסים */
  surface: string;
  /** צבע טקסט ראשי */
  text: string;
  /** צבע טקסט משני / מעומעם */
  textMuted: string;
  /** צבע קווי מסגרת והפרדה */
  border: string;
  /** צבע שגיאה/חובה — טקסט שדה שגוי, כוכבית חובה. חייב 4.5:1 על background ועל surface */
  danger: string;
}

export interface Theme {
  /** מזהה ייחודי באנגלית — משמש בכתובות URL ובשמות קבצים */
  id: string;
  /** שם תצוגה */
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: {
    fontHeading: FontId;
    fontBody: FontId;
    /** גודל טקסט בסיס בפיקסלים (14–20) */
    baseSize: number;
    /** יחס הסולם הטיפוגרפי (1.1–1.4) — כמה הכותרות גדלות */
    scale: number;
    /** משקל כותרות (500–800) */
    headingWeight: number;
  };
  shape: {
    /** עיגול פינות של כרטיסים, בפיקסלים */
    cardRadius: number;
    /** עיגול פינות של כפתורים — 999 יוצר "גלולה" */
    buttonRadius: number;
    /** עיגול פינות של שדות טופס */
    fieldRadius: number;
  };
  layout: {
    /** ריווח אנכי בין סקשנים, בפיקסלים */
    sectionSpacing: number;
    /** רוחב מרבי של התוכן, בפיקסלים */
    maxWidth: number;
  };
  effects: {
    shadow: ShadowLevel;
    /** רקע דקורטיבי חי מאחורי כל התוכן — אורורה, נקודות, רשת... */
    background: BackgroundFx;
    /** עוצמת הרקע הדקורטיבי, 0–1 */
    backgroundIntensity: number;
    /** שכבת גרעיניות-פילם עדינה מעל הרקע */
    noise: boolean;
    /** סגנון ברירת המחדל של כרטיסים בדף */
    cardStyle: CardFx;
    /** עוצמת אפקטי הזוהר (ספוטלייט, הילות) */
    glow: GlowLevel;
    /** צבע הזוהר; ריק = צבע primary של הערכה */
    glowColor?: string;
    /** סגנון ברירת המחדל של כפתורים */
    buttonStyle: ButtonStyle;
    /** ברירת המחדל של אנימציית הכניסה לדף כולו */
    animation: {
      style: ThemeAnimStyle;
      intensity: AnimIntensity;
    };
  };
}

/**
 * רשימת הפונטים הזמינים במערכת. כולם נטענים מ-Google Fonts
 * ב-layout הראשי, כך שהסטודיו יכול להחליף ביניהם בזמן אמת.
 * כולם תומכים בעברית.
 */
export const FONTS = {
  heebo: { label: "Heebo — מודרני ונקי", stack: `"Heebo", "Segoe UI", system-ui, sans-serif` },
  assistant: { label: "Assistant — קליל וקריא", stack: `"Assistant", "Segoe UI", system-ui, sans-serif` },
  rubik: { label: "Rubik — עגלגל ונעים", stack: `"Rubik", "Segoe UI", system-ui, sans-serif` },
  "noto-sans-hebrew": { label: "Noto Sans Hebrew — ניטרלי", stack: `"Noto Sans Hebrew", "Segoe UI", system-ui, sans-serif` },
  "frank-ruhl-libre": { label: "Frank Ruhl Libre — סריפי יוקרתי", stack: `"Frank Ruhl Libre", "David Libre", serif` },
  "david-libre": { label: "David Libre — סריפי קלאסי", stack: `"David Libre", "Frank Ruhl Libre", serif` },
  "secular-one": { label: "Secular One — כותרות בולטות", stack: `"Secular One", "Heebo", sans-serif` },
  "varela-round": { label: "Varela Round — ידידותי", stack: `"Varela Round", "Rubik", sans-serif` },
} as const;

export type FontId = keyof typeof FONTS;

/**
 * רמפות צל בנות 3 שכבות (מגע/אמצע/הילה), צבועות דרך המשתנה
 * --ds-fx-shadow-rgb כדי שערכות עתידיות יוכלו לגוון את הצל (לא רק
 * שחור-אפור) בלי לגעת בערכי ה-CSS עצמם.
 */
export const SHADOWS: Record<ShadowLevel, string> = {
  none: "none",
  soft: [
    "0 1px 2px rgb(var(--ds-fx-shadow-rgb, 2 8 23) / 0.04)",
    "0 8px 16px -8px rgb(var(--ds-fx-shadow-rgb, 2 8 23) / 0.12)",
    "0 24px 48px -24px rgb(var(--ds-fx-shadow-rgb, 2 8 23) / 0.18)",
  ].join(", "),
  strong: [
    "0 2px 6px rgb(var(--ds-fx-shadow-rgb, 2 8 23) / 0.10)",
    "0 16px 32px -12px rgb(var(--ds-fx-shadow-rgb, 2 8 23) / 0.28)",
    "0 32px 64px -20px rgb(var(--ds-fx-shadow-rgb, 2 8 23) / 0.38)",
  ].join(", "),
};

export const SHADOW_LABELS: Record<ShadowLevel, string> = {
  none: "ללא",
  soft: "עדין",
  strong: "בולט",
};

const round = (n: number) => Math.round(n * 100) / 100;

/** מיפוי עוצמת הזוהר לערך אטימות CSS */
const GLOW_INTENSITY: Record<GlowLevel, string> = {
  none: "0",
  soft: "0.45",
  intense: "0.8",
};

/**
 * ממיר ערכת נושא למפת משתני CSS.
 * גודלי הכותרות מחושבים מהסולם הטיפוגרפי ועטופים ב-clamp()
 * כדי שיתכווצו יפה במובייל בלי media queries.
 */
export function themeToCssVars(t: Theme): Record<string, string> {
  const { baseSize, scale } = t.typography;
  const step = (n: number) => baseSize * Math.pow(scale, n);
  const fluid = (min: number, vw: number, max: number) =>
    `clamp(${round(min)}px, ${vw}vw, ${round(max)}px)`;
  const animIntensity = INTENSITY[t.effects.animation.intensity];

  const h3 = step(1.5);
  const h2 = step(2.5);
  const h1 = step(3.5);
  const display = step(5);

  return {
    "--ds-color-primary": t.colors.primary,
    "--ds-color-primary-hover": t.colors.primaryHover,
    "--ds-color-on-primary": t.colors.onPrimary,
    "--ds-color-accent": t.colors.accent,
    "--ds-color-on-accent": t.colors.onAccent,
    "--ds-color-bg": t.colors.background,
    "--ds-color-surface": t.colors.surface,
    "--ds-color-text": t.colors.text,
    "--ds-color-text-muted": t.colors.textMuted,
    "--ds-color-border": t.colors.border,
    "--ds-color-danger": t.colors.danger,

    "--ds-font-heading": FONTS[t.typography.fontHeading].stack,
    "--ds-font-body": FONTS[t.typography.fontBody].stack,
    "--ds-heading-weight": String(t.typography.headingWeight),
    "--ds-fs-base": `${baseSize}px`,
    "--ds-fs-lead": `${round(step(0.75))}px`,
    "--ds-fs-h3": `${round(h3)}px`,
    "--ds-fs-h2": fluid(h2 * 0.8, 3.2, h2),
    "--ds-fs-h1": fluid(h1 * 0.72, 4.4, h1),
    "--ds-fs-display": fluid(display * 0.62, 6.2, display),

    "--ds-radius-card": `${t.shape.cardRadius}px`,
    "--ds-radius-btn": `${t.shape.buttonRadius}px`,
    "--ds-radius-field": `${t.shape.fieldRadius}px`,

    "--ds-shadow-card": SHADOWS[t.effects.shadow],

    "--ds-section-y": `${t.layout.sectionSpacing}px`,
    "--ds-max-w": `${t.layout.maxWidth}px`,

    // --- אפקטים (lib/effects.ts) ---
    "--ds-fx-bg-intensity": String(t.effects.backgroundIntensity),
    "--ds-fx-noise-opacity": t.effects.noise ? "0.06" : "0",
    "--ds-fx-glow-color": t.effects.glowColor ?? t.colors.primary,
    "--ds-fx-glow-intensity": GLOW_INTENSITY[t.effects.glow],
    "--ds-fx-btn-depth": t.effects.buttonStyle === "push" ? "4px" : "0px",
    "--ds-fx-tilt-max": "8",
    "--ds-fx-shadow-rgb": "2 8 23",
    "--ds-anim-distance": `${animIntensity.distance}px`,
    "--ds-anim-duration": `${animIntensity.duration}ms`,
    "--ds-anim-stagger": `${animIntensity.stagger}ms`,
    "--ds-ease-out-soft": DS_EASE_OUT_SOFT,
    "--ds-ease-spring": DS_EASE_SPRING,
  };
}

/** גרסה נוחה לשימוש כ-style prop על אלמנט React */
export function themeToStyle(t: Theme): CSSProperties {
  return themeToCssVars(t) as CSSProperties;
}

/** בדיקת צורה בסיסית לקובץ ערכה מיובא — אותו דפוס כמו looksLikePage ב-lib/page.ts */
export function looksLikeTheme(obj: unknown): obj is Theme {
  if (typeof obj !== "object" || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    typeof t.colors === "object" &&
    typeof t.typography === "object" &&
    typeof t.shape === "object" &&
    typeof t.layout === "object" &&
    typeof t.effects === "object"
  );
}

/**
 * נרמול ערכה שהגיעה מבחוץ (ייבוא/טיוטה ישנה/קובץ JSON מלפני שלב
 * האפקטים): משלים את כל מפתחות effects החדשים לברירות מחדל שמרניות
 * (רקע כבוי, כרטיסים מורמים, בלי זוהר, כפתור שטוח, אנימציית עלייה
 * עדינה) — כך שערכה ישנה ממשיכה להיראות בדיוק כמו שהיא. אותו עיקרון
 * כמו normalizePage הקיים ב-lib/page.ts.
 */
export function normalizeTheme(t: Theme): Theme {
  const e = (t.effects ?? {}) as Partial<Theme["effects"]>;
  const anim = (e.animation ?? {}) as Partial<Theme["effects"]["animation"]>;
  // ערכות ישנות/מיובאות בלי colors.danger: בוחרים אדום בהיר לרקע כהה
  // ואדום כהה לרקע בהיר, לפי אותה היוריסטיקה ש-bestTextOn משתמשת בה
  // (יחס ניגודיות מול הרקע), כדי ש-4.5:1 יישמר כמעט תמיד.
  const danger = t.colors?.danger ?? (bestTextOn(t.colors.background) === "#FFFFFF" ? "#F87171" : "#B91C1C");
  return {
    ...t,
    colors: { ...t.colors, danger },
    effects: {
      shadow: e.shadow ?? "soft",
      background: e.background ?? "none",
      backgroundIntensity: e.backgroundIntensity ?? 0.5,
      noise: e.noise ?? false,
      cardStyle: e.cardStyle ?? "raised",
      glow: e.glow ?? "none",
      glowColor: e.glowColor,
      buttonStyle: e.buttonStyle ?? "flat",
      animation: {
        style: anim.style ?? "rise",
        intensity: anim.intensity ?? "subtle",
      },
    },
  };
}

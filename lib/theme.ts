import type { CSSProperties } from "react";

/**
 * מנוע הערכות (Theme Engine)
 * ---------------------------
 * ערכת נושא היא אובייקט JSON אחד שמתאר את כל העיצוב של דף:
 * צבעים, טיפוגרפיה, צורה, פריסה ואפקטים.
 * הפונקציה themeToCssVars ממירה את הערכה למשתני CSS (--ds-*),
 * ו-globals.css ממפה את המשתנים האלה ליוטיליטיז של Tailwind.
 * החלפת ערכה = החלפת ערכי המשתנים. הרכיבים לא משתנים לעולם.
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

export const SHADOWS: Record<ShadowLevel, string> = {
  none: "none",
  soft: "0 1px 2px rgb(2 8 23 / 0.04), 0 10px 30px -12px rgb(2 8 23 / 0.15)",
  strong: "0 2px 6px rgb(2 8 23 / 0.10), 0 24px 48px -12px rgb(2 8 23 / 0.35)",
};

export const SHADOW_LABELS: Record<ShadowLevel, string> = {
  none: "ללא",
  soft: "עדין",
  strong: "בולט",
};

const round = (n: number) => Math.round(n * 100) / 100;

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
  };
}

/** גרסה נוחה לשימוש כ-style prop על אלמנט React */
export function themeToStyle(t: Theme): CSSProperties {
  return themeToCssVars(t) as CSSProperties;
}

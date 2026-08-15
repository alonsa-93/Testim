import type { AnimIntensity } from "./effects";
import type { Theme, ThemeColors } from "./theme";
import { FONT_PAIRS } from "./font-pairs";

/**
 * "🎲 ערבב לי" (Stage C / WORKPLAN 4C, ux-report B6).
 * פלטת צבעים אקראית לגמרי היא מתכון בטוח לניגודיות שנכשלת — לכן
 * הפלטות כאן מאוצרות ידנית ונבדקו מראש (contrastRatio/gradeContrast,
 * ראו scratchpad/contrast-check*.mjs בזמן הכתיבה) כך שכל צירוף טקסט
 * מרכזי בערכה עומד לפחות ב-AA. "ערבב לי" לעולם לא יכול להציג תוצאה
 * שנכשלת בניגודיות — כי הוא רק בורר מתוך הרשימה הזו, לא מייצר צבעים.
 */
export interface ShufflePalette {
  name: string;
  colors: ThemeColors;
}

export const SHUFFLE_PALETTES: ShufflePalette[] = [
  {
    name: "אינדיגו קלאסי",
    colors: {
      primary: "#4F46E5",
      primaryHover: "#4338CA",
      onPrimary: "#FFFFFF",
      accent: "#B45309",
      onAccent: "#FFFFFF",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#0F172A",
      textMuted: "#475569",
      border: "#828FA2",
      danger: "#DC2626",
    },
  },
  {
    name: "אמרלד עסקי",
    colors: {
      primary: "#047857",
      primaryHover: "#059669",
      onPrimary: "#FFFFFF",
      accent: "#C2410C",
      onAccent: "#FFFFFF",
      background: "#F7FAF9",
      surface: "#FFFFFF",
      text: "#0B1F17",
      textMuted: "#3F5B50",
      border: "#7B9086",
      danger: "#B91C1C",
    },
  },
  {
    name: "רויאל כהה",
    colors: {
      primary: "#818CF8",
      primaryHover: "#A5B4FC",
      onPrimary: "#0B1020",
      accent: "#22D3EE",
      onAccent: "#062A33",
      background: "#0B1020",
      surface: "#151C33",
      text: "#EEF2FB",
      textMuted: "#9AA7C7",
      border: "#5A72B8",
      danger: "#F87171",
    },
  },
  {
    name: "רוז זהב",
    colors: {
      primary: "#BE185D",
      primaryHover: "#9D174D",
      onPrimary: "#FFFFFF",
      accent: "#92400E",
      onAccent: "#FFFFFF",
      background: "#FFFBF5",
      surface: "#FFF4E6",
      text: "#241208",
      textMuted: "#6B5B4D",
      border: "#A38969",
      danger: "#B91C1C",
    },
  },
  {
    name: "טיל כחול-ירוק",
    colors: {
      primary: "#0D9488",
      primaryHover: "#0F766E",
      onPrimary: "#FFFFFF",
      accent: "#92400E",
      onAccent: "#FFFFFF",
      background: "#F0FDFA",
      surface: "#FFFFFF",
      text: "#042F2E",
      textMuted: "#3F5D5A",
      border: "#67958D",
      danger: "#B91C1C",
    },
  },
];

/** כמה פרופילי צורה מוכנים — מ"חד וממוקד" ועד "עגול לגמרי" */
export const SHAPE_PRESETS: Array<{
  name: string;
  cardRadius: number;
  buttonRadius: number;
  fieldRadius: number;
}> = [
  { name: "חד וממוקד", cardRadius: 6, buttonRadius: 8, fieldRadius: 6 },
  { name: "מאוזן", cardRadius: 16, buttonRadius: 12, fieldRadius: 10 },
  { name: "עגול לגמרי", cardRadius: 24, buttonRadius: 999, fieldRadius: 14 },
];

/** "off" לא שייך לפה — ערבוב תמיד משאיר את הדף עם תנועה כלשהי */
const SHUFFLE_INTENSITIES: AnimIntensity[] = ["subtle", "dynamic", "dramatic"];

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/**
 * מחזיר ערכה חדשה עם צבעים, פונטים, צורה ועוצמת אנימציה אקראיים —
 * כל שאר הערכה (id, שם, פריסה, רקע/כרטיסים/זוהר/כפתורים) נשארים
 * כפי שהיו, כדי שהערבוב יפתיע בלי לאבד את שאר ההתאמות של המשתמש.
 */
export function shuffleTheme(theme: Theme): Theme {
  const palette = pick(SHUFFLE_PALETTES);
  const pair = pick(FONT_PAIRS);
  const shape = pick(SHAPE_PRESETS);
  const intensity = pick(SHUFFLE_INTENSITIES);

  return {
    ...theme,
    colors: { ...palette.colors },
    typography: {
      ...theme.typography,
      fontHeading: pair.fontHeading,
      fontBody: pair.fontBody,
    },
    shape: {
      ...theme.shape,
      cardRadius: shape.cardRadius,
      buttonRadius: shape.buttonRadius,
      fieldRadius: shape.fieldRadius,
    },
    effects: {
      ...theme.effects,
      animation: {
        style: theme.effects.animation.style === "none" ? "rise" : theme.effects.animation.style,
        intensity,
      },
    },
  };
}

import { normalizeTheme, type Theme } from "@/lib/theme";
import defaultTheme from "./default.json";
import novaDark from "./nova-dark.json";

/**
 * רישום הערכות של המערכת.
 * כדי להוסיף ערכה ללקוח חדש:
 *   1. שמרו קובץ JSON חדש בתיקייה הזו (אפשר לייצא מהסטודיו ב-/studio)
 *   2. הוסיפו לו שורת import למעלה
 *   3. הוסיפו אותו למערך themes למטה
 *
 * כל ערכה עוברת normalizeTheme — כך שקובץ ערכה ישן (מלפני שלב
 * האפקטים) ממשיך לטעון ולהיראות בדיוק כמו שהיה, בלי לשבור בנייה.
 */
export const themes: Theme[] = [defaultTheme as Theme, novaDark as Theme].map(normalizeTheme);

export const defaultThemeId = "default";

export function getTheme(id: string): Theme | undefined {
  return themes.find((t) => t.id === id);
}

export function getDefaultTheme(): Theme {
  return getTheme(defaultThemeId) ?? themes[0];
}

import type { Page } from "@/lib/page";
import demo from "./demo.json";
import { kerenLightingPage } from "./keren-lighting";

/**
 * רישום הדפים של המערכת.
 * כדי לפרסם דף שבנית בסטודיו:
 *   1. בסטודיו: "הורדת הדף" — מתקבל קובץ JSON
 *   2. שומרים אותו כאן, בתיקיית pages-data/
 *   3. מוסיפים לו import ושורה במערך למטה
 * מרגע זה הדף חי בכתובת /p/<id>.
 *
 * הערה: תוכן שלא מוגדר בקובץ הדף נלקח מברירות המחדל של הבלוק,
 * ולכן content ריק ({}) הוא תקין לגמרי ומרנדר את תוכן הדוגמה.
 *
 * keren-lighting.ts (Milestone G, docs/rebuild-workplan.md אבן דרך G):
 * הדמו האיכותי -- דף Experience אמיתי, לא route מיוחד, כדי להוכיח את
 * צינור הפרסום המלא (הרישום כאן -> /p/keren) שתוקן ב-Milestone F1.
 */
export const pages: Page[] = [demo as Page, kerenLightingPage];

export const defaultPageId = "demo";

export function getPage(id: string): Page | undefined {
  return pages.find((p) => p.id === id);
}

export function getDefaultPage(): Page {
  return getPage(defaultPageId) ?? pages[0];
}

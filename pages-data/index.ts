import type { Page } from "@/lib/page";
import demo from "./demo.json";

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
 */
export const pages: Page[] = [demo as Page];

export const defaultPageId = "demo";

export function getPage(id: string): Page | undefined {
  return pages.find((p) => p.id === id);
}

export function getDefaultPage(): Page {
  return getPage(defaultPageId) ?? pages[0];
}

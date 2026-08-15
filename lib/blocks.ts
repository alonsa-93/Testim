import type { ComponentType } from "react";
import type { BlockContent, FieldDef } from "./fields";

/**
 * חוזה של בלוק במערכת.
 * כל קובץ בלוק מייצא אובייקט כזה, וה-registry אוסף את כולם.
 * כך הוספת בלוק חדש = קובץ אחד + שורה אחת ב-registry.
 */
export interface BlockDef {
  /** מזהה יציב שנשמר ב-JSON של הדף */
  type: string;
  /** שם הבלוק כפי שמוצג בסטודיו */
  label: string;
  description: string;
  component: ComponentType<{ content: BlockContent; anchor?: string }>;
  /**
   * עוגן הניווט הקנוני של הבלוק (#features וכד').
   * ה-PageRenderer מעביר אותו למופע הראשון כמו שהוא, ולמופעים
   * נוספים של אותו בלוק מצרף סיומת רצה — כדי שלא ייווצרו
   * id כפולים ב-DOM.
   */
  anchor?: string;
  /** תוכן ברירת מחדל — משמש גם כשמוסיפים את הבלוק לדף חדש */
  defaults: BlockContent;
  /** אילו שדות ניתנים לעריכה בסטודיו */
  fields: FieldDef[];
  /** בלוק שיכול להופיע פעם אחת בלבד בדף (ניווט, פוטר) */
  singleton?: boolean;
}

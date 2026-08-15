import type { ComponentType } from "react";
import type { BlockContent, FieldDef } from "./fields";
import type { Theme } from "./theme";

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
  /**
   * theme אופציונלי (שלב ב'): PageRenderer מעביר את הערכה הפעילה לכל
   * בלוק כדי שיוכל לפתור ברירות מחדל של אנימציה/כרטיסים/כפתורים
   * (resolveBlockAnim, cardStyle, buttonStyle) בלי prop-drilling נוסף.
   * בלוקים שלא זקוקים לעיצוב תלוי-ערכה (למשל navbar, whatsapp) פשוט
   * לא קוראים אותו — אותו דפוס כמו anchor האופציונלי הקיים.
   */
  component: ComponentType<{ content: BlockContent; anchor?: string; theme?: Theme }>;
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

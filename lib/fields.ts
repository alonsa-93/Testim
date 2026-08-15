/**
 * סכמת שדות לעורך התוכן.
 * כל בלוק מצהיר אילו שדות אפשר לערוך בו, והסטודיו בונה מהם
 * את טופס העריכה אוטומטית — בלי לכתוב ממשק לכל בלוק בנפרד.
 */

export type FieldDef =
  /** שורת טקסט קצרה */
  | { key: string; type: "text"; label: string; hint?: string }
  /** פסקה רב-שורתית */
  | { key: string; type: "textarea"; label: string; hint?: string }
  /** בחירת אייקון מתוך המדף */
  | { key: string; type: "icon"; label: string }
  /** כן/לא */
  | { key: string; type: "boolean"; label: string }
  /** רשימת מחרוזות פשוטה (למשל: נקודות בתבליט) */
  | { key: string; type: "strings"; label: string; itemLabel: string }
  /** בחירה מרשימת אפשרויות סגורה (למשל: סוג אנימציה, סגנון רקע) */
  | {
      key: string;
      type: "select";
      label: string;
      options: { value: string; label: string }[];
      hint?: string;
    }
  /** מספר בטווח סגור, מוצג כסליידר (למשל: משך אנימציה, עוצמת רקע) */
  | {
      key: string;
      type: "number";
      label: string;
      min: number;
      max: number;
      step?: number;
      unit?: string;
    }
  /** רשימה של פריטים מורכבים (למשל: המלצות, מסלולי מחיר) */
  | {
      key: string;
      type: "list";
      label: string;
      itemLabel: string;
      fields: FieldDef[];
      /** שדה שממנו נלקחת כותרת הפריט ברשימה המקופלת */
      titleKey: string;
    };

/** תוכן של בלוק — מפה חופשית שהבלוק עצמו יודע לפרש */
export type BlockContent = Record<string, unknown>;

/** ערך ריק מתאים לשדה, לשימוש בהוספת פריט חדש לרשימה */
export function emptyValueFor(field: FieldDef): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "strings":
      return [];
    case "list":
      return [];
    case "select":
      return field.options[0]?.value ?? "";
    case "number":
      return field.min;
    default:
      return "";
  }
}

/** יוצר פריט חדש לרשימה לפי סכמת השדות שלה */
export function emptyItem(fields: FieldDef[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const f of fields) item[f.key] = emptyValueFor(f);
  return item;
}

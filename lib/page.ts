import type { BlockContent } from "./fields";

/**
 * מודל הדף.
 * דף שלם = ערכת נושא + רשימת בלוקים, כל אחד עם התוכן שלו.
 * זה מה שנשמר כקובץ JSON בתיקיית pages/ ומה שהסטודיו מייצא.
 */

export interface PageBlockInstance {
  /** מזהה ייחודי למופע הבלוק בתוך הדף */
  id: string;
  /** סוג הבלוק מתוך ה-registry */
  type: string;
  /** דריסות תוכן; מה שלא מוגדר כאן נלקח מברירות המחדל של הבלוק */
  content: BlockContent;
}

export interface Page {
  /** מזהה באנגלית — משמש בכתובת /p/<id> ובשם הקובץ */
  id: string;
  /** שם לתצוגה בסטודיו */
  name: string;
  /** מזהה הערכה שבה הדף מוצג */
  themeId: string;
  meta: {
    title: string;
    description: string;
  };
  blocks: PageBlockInstance[];
}

/** בדיקת צורה בסיסית לקובץ דף מיובא */
export function looksLikePage(obj: unknown): obj is Page {
  if (typeof obj !== "object" || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.themeId === "string" &&
    Array.isArray(p.blocks) &&
    p.blocks.every(
      (b) =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as Record<string, unknown>).type === "string"
    )
  );
}

/** מזהה מופע ייחודי לבלוק חדש שנוסף בסטודיו */
export function newBlockId(type: string, existing: PageBlockInstance[]): string {
  let n = existing.filter((b) => b.type === type).length + 1;
  let id = `${type}-${n}`;
  while (existing.some((b) => b.id === id)) {
    n += 1;
    id = `${type}-${n}`;
  }
  return id;
}

export function emptyPage(): Page {
  return {
    id: "new-page",
    name: "דף חדש",
    themeId: "default",
    meta: { title: "", description: "" },
    blocks: [],
  };
}

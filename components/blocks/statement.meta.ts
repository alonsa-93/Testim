import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

/**
 * מטא-דאטה של בלוק "הצהרה" — קובץ נפרד, לא-"use client".
 * ראו את ההערה המפורטת ב-navbar.meta.ts: אסור לייצא אובייקט BlockDef
 * מרוכב (עם component מוטמע) מקובץ "use client" — Next.js לא פותר
 * את זה נכון בצד השרת. statement.tsx מייצא רק את הרכיב; ה-BlockDef
 * מורכב כאן וב-registry.ts.
 */

export interface StatementContent {
  text: string;
}

export const statementDefaults: StatementContent = {
  text: "אנחנו לא בונים עוד בית — אנחנו בונים את המקום שבו **החיים שלכם** קורים. כל פרט, כל החלטה, כל יום עבודה, לשירות התחושה שתרגישו ברגע שתפתחו את הדלת.",
};

export const statementMeta: Omit<BlockDef, "component"> = {
  type: "statement",
  label: "הצהרה נגללת",
  description: "פסקה גדולה שנדלקת מילה־מילה תוך כדי גלילה — סקשן sticky גבוה שמצטלם",
  defaults: statementDefaults as unknown as BlockContent,
  fields: [
    {
      key: "text",
      type: "textarea",
      label: "הטקסט",
      hint: "מילה בין ** ** תקבל את צבע המבטא. פסקה קצרה-בינונית עובדת הכי טוב.",
    },
  ],
};

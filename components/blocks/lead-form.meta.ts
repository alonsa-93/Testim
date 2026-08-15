import { ANIM_FIELDS } from "@/lib/effects";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

/**
 * מטא-דאטה של טופס הלידים — קובץ נפרד, לא-"use client".
 * ראו את ההערה המפורטת ב-navbar.meta.ts: אסור לייצא אובייקט BlockDef
 * מרוכב (עם component מוטמע) מקובץ "use client" — Next.js לא פותר
 * את זה נכון בצד השרת (registry.ts קיבל את פונקציית הרכיב עצמה
 * במקום את האובייקט, וכל הבלוק נעלם מהדף). לכן lead-form.tsx מייצא
 * רק את הרכיב, וה-BlockDef מורכב כאן ובקובץ registry.ts.
 */

export interface LeadFormContent {
  eyebrow: string;
  title: string;
  text: string;
  phone: string;
  email: string;
  address: string;
  submitLabel: string;
  privacyNote: string;
  successTitle: string;
  successText: string;
}

export const leadFormDefaults: LeadFormContent = {
  eyebrow: "מדברים?",
  title: "הצעד הראשון הוא שיחה אחת",
  text: "השאירו פרטים ונחזור אליכם עד יום העסקים הבא לשיחת היכרות קצרה — בלי התחייבות ובלי לחץ מכירתי.",
  phone: "050-000-0000",
  email: "hello@studio-alon.co.il",
  address: "שדרות רוטשילד 1, תל אביב",
  submitLabel: "שליחה — נחזור אליכם בהקדם",
  privacyNote: "הפרטים ישמשו לחזרה אליכם בלבד ולא יועברו לגורם שלישי.",
  successTitle: "תודה! הפנייה התקבלה",
  successText: "נחזור אליכם עד יום העסקים הבא. בינתיים אפשר להציץ בשאלות הנפוצות.",
};

export const leadFormMeta: Omit<BlockDef, "component"> = {
  type: "leadForm",
  label: "טופס לידים",
  description: "טופס יצירת קשר עם ולידציה בעברית, לצד פרטי התקשרות",
  anchor: "contact",
  defaults: leadFormDefaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת" },
    { key: "text", type: "textarea", label: "משפט הסבר" },
    { key: "phone", type: "text", label: "טלפון" },
    { key: "email", type: "text", label: "אימייל" },
    { key: "address", type: "text", label: "כתובת" },
    { key: "submitLabel", type: "text", label: "כפתור השליחה" },
    { key: "privacyNote", type: "text", label: "הערת פרטיות מתחת לכפתור" },
    { key: "successTitle", type: "text", label: "הודעת הצלחה — כותרת" },
    { key: "successText", type: "textarea", label: "הודעת הצלחה — טקסט" },
    ...ANIM_FIELDS,
  ],
};

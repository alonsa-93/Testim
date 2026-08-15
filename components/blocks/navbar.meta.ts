import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

/**
 * מטא-דאטה של בלוק הניווט (סוג, ברירות מחדל, שדות עריכה) — בקובץ נפרד
 * ולא-"use client" בכוונה.
 *
 * למה: navbar.tsx הוא "use client" (יש בו useState לתפריט המובייל).
 * גילינו בפועל (Playwright + לוג דיבאג) ש-Next.js לא תומך בייצוא אובייקט
 * מרוכב (BlockDef עם component מוטמע) מקובץ "use client" לצריכה בקוד
 * שרת: registry.ts קיבל את *פונקציית הרכיב עצמה* במקום את האובייקט —
 * וה-Navbar כולו נעלם מהדף בלי שגיאת build. התיקון: רק *רכיב* מותר
 * לחצות את הגבול (ולכן component לא כלול כאן), וכל שאר המטא-דאטה
 * (טהורה, לא-קליינט) חיה כאן; registry.ts מרכיב את שניהם יחד.
 */

export interface NavbarContent {
  brand: string;
  links: Array<{ label: string; href: string }>;
  ctaLabel: string;
  ctaHref: string;
}

export const navbarDefaults: NavbarContent = {
  brand: "סטודיו אלון",
  links: [
    { label: "שירותים", href: "#features" },
    { label: "הגישה שלנו", href: "#about" },
    { label: "לקוחות מספרים", href: "#testimonials" },
    { label: "מסלולים", href: "#pricing" },
    { label: "שאלות נפוצות", href: "#faq" },
  ],
  ctaLabel: "לתיאום ייעוץ",
  ctaHref: "#contact",
};

export const navbarMeta: Omit<BlockDef, "component"> = {
  type: "navbar",
  label: "סרגל ניווט עליון",
  description: "לוגו טקסטואלי, קישורי עוגן וכפתור פעולה — נדבק לראש העמוד",
  defaults: navbarDefaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "brand", type: "text", label: "שם העסק" },
    {
      key: "links",
      type: "list",
      label: "קישורי ניווט",
      itemLabel: "קישור",
      titleKey: "label",
      fields: [
        { key: "label", type: "text", label: "טקסט" },
        {
          key: "href",
          type: "text",
          label: "יעד",
          hint: "עוגן לסקשן בדף, למשל ‎#pricing",
        },
      ],
    },
    { key: "ctaLabel", type: "text", label: "כפתור — טקסט" },
    { key: "ctaHref", type: "text", label: "כפתור — קישור" },
  ],
};

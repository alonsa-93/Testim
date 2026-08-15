import type { BlockDef } from "@/lib/blocks";
import { Navbar } from "./navbar";
import { navbarMeta } from "./navbar.meta";
import { heroBlock } from "./hero";
import { logosBlock } from "./logos";
import { marqueeBlock } from "./marquee";
import { featuresBlock } from "./features";
import { aboutBlock } from "./about";
import { stepsBlock } from "./steps";
import { galleryBlock } from "./gallery";
import { videoBlock } from "./video";
import { Statement } from "./statement";
import { statementMeta } from "./statement.meta";
import { testimonialsBlock } from "./testimonials";
import { pricingBlock } from "./pricing";
import { faqBlock } from "./faq";
import { LeadForm } from "./lead-form";
import { leadFormMeta } from "./lead-form.meta";
import { ctaBlock } from "./cta";
import { whatsappBlock } from "./whatsapp";
import { footerBlock } from "./footer";

/**
 * שלושת הבלוקים האלה (navbar/leadForm/statement) מורכבים כאן, לא
 * בקובץ הבלוק עצמו: הם "use client" (יש בהם state/refs), ו-Next.js
 * לא תומך בייצוא אובייקט BlockDef מרוכב (עם component מוטמע) מקובץ
 * "use client" לצריכה בקוד שרת — התגלה בפועל (Playwright + לוג דיבאג):
 * registry.ts קיבל את *פונקציית הרכיב עצמה* במקום את האובייקט, וכל
 * הבלוק נעלם מהדף בלי שגיאת build. הרכיב (component) הוא ה-export
 * היחיד שמותר לו לחצות את הגבול; המטא-דאטה (navbarMeta וכו') חיה
 * בקובץ ‎*.meta.ts‎ לא-"use client" לצד כל בלוק, וכאן — קוד שרת רגיל —
 * מותר בהחלט להרכיב אובייקט שמכיל גם וגם.
 */
const navbarBlock: BlockDef = { ...navbarMeta, component: Navbar };
const leadFormBlock: BlockDef = { ...leadFormMeta, component: LeadForm };
const statementBlock: BlockDef = { ...statementMeta, component: Statement };

/**
 * מדף הבלוקים של המערכת — הסדר כאן הוא הסדר בבורר הבלוקים בסטודיו.
 * להוספת בלוק חדש: יוצרים קובץ שמייצא BlockDef ומוסיפים אותו לרשימה
 * (או, אם הבלוק "use client", עוקבים אחרי הדפוס של navbar/leadForm/
 * statement לעיל — component בקובץ הבלוק, מטא-דאטה ב-‎*.meta.ts‎).
 */
export const blockDefs: BlockDef[] = [
  navbarBlock,
  heroBlock,
  logosBlock,
  marqueeBlock,
  featuresBlock,
  aboutBlock,
  stepsBlock,
  galleryBlock,
  videoBlock,
  statementBlock,
  testimonialsBlock,
  pricingBlock,
  faqBlock,
  leadFormBlock,
  ctaBlock,
  whatsappBlock,
  footerBlock,
];

export const blockMap: Record<string, BlockDef> = Object.fromEntries(
  blockDefs.map((b) => [b.type, b])
);

export function getBlockDef(type: string): BlockDef | undefined {
  return blockMap[type];
}

/** בלוקים שנעוצים למקומם בדף: הניווט תמיד למעלה, הפוטר תמיד למטה */
export const PINNED_TOP = "navbar";
export const PINNED_BOTTOM = "footer";

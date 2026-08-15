import type { BlockDef } from "@/lib/blocks";
import { navbarBlock } from "./navbar";
import { heroBlock } from "./hero";
import { featuresBlock } from "./features";
import { aboutBlock } from "./about";
import { stepsBlock } from "./steps";
import { testimonialsBlock } from "./testimonials";
import { pricingBlock } from "./pricing";
import { faqBlock } from "./faq";
import { leadFormBlock } from "./lead-form";
import { ctaBlock } from "./cta";
import { footerBlock } from "./footer";

/**
 * מדף הבלוקים של המערכת — הסדר כאן הוא הסדר בבורר הבלוקים בסטודיו.
 * להוספת בלוק חדש: יוצרים קובץ שמייצא BlockDef ומוסיפים אותו לרשימה.
 */
export const blockDefs: BlockDef[] = [
  navbarBlock,
  heroBlock,
  featuresBlock,
  aboutBlock,
  stepsBlock,
  testimonialsBlock,
  pricingBlock,
  faqBlock,
  leadFormBlock,
  ctaBlock,
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

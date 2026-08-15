import type { BlockDef } from "@/lib/blocks";
import { navbarBlock } from "./navbar";
import { heroBlock } from "./hero";
import { logosBlock } from "./logos";
import { featuresBlock } from "./features";
import { aboutBlock } from "./about";
import { stepsBlock } from "./steps";
import { galleryBlock } from "./gallery";
import { videoBlock } from "./video";
import { testimonialsBlock } from "./testimonials";
import { pricingBlock } from "./pricing";
import { faqBlock } from "./faq";
import { leadFormBlock } from "./lead-form";
import { ctaBlock } from "./cta";
import { whatsappBlock } from "./whatsapp";
import { footerBlock } from "./footer";

/**
 * מדף הבלוקים של המערכת — הסדר כאן הוא הסדר בבורר הבלוקים בסטודיו.
 * להוספת בלוק חדש: יוצרים קובץ שמייצא BlockDef ומוסיפים אותו לרשימה.
 */
export const blockDefs: BlockDef[] = [
  navbarBlock,
  heroBlock,
  logosBlock,
  featuresBlock,
  aboutBlock,
  stepsBlock,
  galleryBlock,
  videoBlock,
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

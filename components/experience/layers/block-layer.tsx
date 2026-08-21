import { getBlockDef } from "@/components/blocks/registry";
import { RevealManaged } from "@/components/fx/reveal";
import type { BlockLayerContent } from "@/lib/experience";
import type { PageBlockInstance } from "@/lib/page";
import type { Theme } from "@/lib/theme";

/**
 * Block Reference layer (Phase 6, docs/experience-audit.md §12.3, §104
 * במסמך התיקון): הגשר בין Experience לבלוקים הקיימים. מפנה לבלוק
 * קיים בדף לפי id — **לא** משכפל את התוכן שלו לתוך סכמת ה-Experience.
 * target חסר (בלוק שלא קיים בדף, או type לא מוכר) מדלג בשקט, לא קורס.
 *
 * Milestone H (ביקורת מבקר-אדברסריאלי, ממצא #3): עד כה זו הייתה נקודת
 * הכניסה השנייה, הלא-מאובטחת, ל"הכנס בלוק קיים ל-Experience" — לצד
 * scene.blockRefs (experience-page.tsx, ExperienceBlockRefLayer), שכבר
 * עוטפת ב-RevealManaged בדיוק כדי לאכוף את טבלת התקדימות המחייבת
 * (docs/architecture-decision-gate.md §2.2: Track > אפקט בלוק > Reveal).
 * layer מסוג "block" (שכבה חופשית עם מיקום x/y/width עצמאי, בשונה
 * מ-blockRefs השטוח) היה מדלג על העטיפה הזו לגמרי -- אם למחבר יש גם
 * Track על אותו layer id וגם Reveal פנימי בתוך הבלוק, שתי המערכות היו
 * "נלחמות" על אותו אלמנט בדיוק המצב שהארכיטקטורה טוענת שהוא בלתי-אפשרי.
 * אותה עטיפה בדיוק כמו ExperienceBlockRefLayer -- לא מנגנון שני.
 */
export function BlockLayer({
  content,
  blocks,
  theme,
}: {
  content: BlockLayerContent;
  blocks: PageBlockInstance[];
  theme?: Theme;
}) {
  const block = blocks.find((b) => b.id === content.blockId);
  if (!block) return null;
  const def = getBlockDef(block.type);
  if (!def) return null;
  const Component = def.component;
  return (
    <RevealManaged>
      <Component content={block.content} theme={theme} />
    </RevealManaged>
  );
}

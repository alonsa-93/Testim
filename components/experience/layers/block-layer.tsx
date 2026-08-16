import { getBlockDef } from "@/components/blocks/registry";
import type { BlockLayerContent } from "@/lib/experience";
import type { PageBlockInstance } from "@/lib/page";
import type { Theme } from "@/lib/theme";

/**
 * Block Reference layer (Phase 6, docs/experience-audit.md §12.3, §104
 * במסמך התיקון): הגשר בין Experience לבלוקים הקיימים. מפנה לבלוק
 * קיים בדף לפי id — **לא** משכפל את התוכן שלו לתוך סכמת ה-Experience.
 * target חסר (בלוק שלא קיים בדף, או type לא מוכר) מדלג בשקט, לא קורס.
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
  return <Component content={block.content} theme={theme} />;
}

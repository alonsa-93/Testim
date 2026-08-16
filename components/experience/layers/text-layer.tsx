import type { CSSProperties } from "react";
import { layerStyleToCss, type LayerStyle, type TextLayerContent } from "@/lib/experience";

/**
 * Text layer (Phase 6, docs/experience-audit.md §12.6, §33 במסמך התיקון):
 * תג סמנטי אמיתי לפי `content.tag` — לעולם לא ברירת מחדל ל-div. הבחירה
 * הסמנטית היא שדה גלוי ב-Inspector (Phase 7), לא אופציה למתקדמים בלבד.
 */
export function TextLayer({ content, style }: { content: TextLayerContent; style?: LayerStyle }) {
  const Tag = content.tag || "p";
  return <Tag style={layerStyleToCss(style) as CSSProperties}>{content.text}</Tag>;
}

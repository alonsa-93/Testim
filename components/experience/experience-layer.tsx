"use client";

import type { CSSProperties } from "react";
import { ExperienceTarget } from "./experience-target";
import { useExperienceMode } from "./experience-provider";
import { TextLayer } from "./layers/text-layer";
import { ImageLayer } from "./layers/image-layer";
import { ShapeLayer } from "./layers/shape-layer";
import { ButtonLayer } from "./layers/button-layer";
import { BlockLayer } from "./layers/block-layer";
import {
  layerLayoutStyle,
  resolveResponsive,
  type BlockLayerContent,
  type ButtonLayerContent,
  type ExperienceLayer as ExperienceLayerConfig,
  type ImageLayerContent,
  type ShapeLayerContent,
  type TextLayerContent,
} from "@/lib/experience";
import type { PageBlockInstance } from "@/lib/page";
import type { Theme } from "@/lib/theme";

/**
 * דיספצ'ר Layer (Phase 6, docs/experience-audit.md §12): לפי layer.type,
 * מרנדר את רכיב ה-layer הנכון, עוטף ב-ExperienceTarget (זהות + מיקום),
 * ופותר responsive/mode. 5 טיפוסי MVP בלבד — video/stat/logo/group
 * נדחים במפורש (§27 במסמך התיקון), עדיין לא ממומשים.
 */
export function ExperienceLayerRenderer({
  layer,
  blocks,
  theme,
  imagePreviewOverrides,
  selected,
  onSelect,
}: {
  layer: ExperienceLayerConfig;
  /** נדרש רק ל-layer.type === "block" -- הפניה לבלוקים הקיימים של הדף */
  blocks?: PageBlockInstance[];
  theme?: Theme;
  /** Studio בלבד (§ תצוגה מקדימה מקומית לתמונה): מפת layerId -> blob URL
   * זמני שנוצר מקובץ שנבחר במחשב, לתצוגה חיה בלבד -- לעולם לא נכתב
   * ל-content.src עצמו, כך שלא נשמר ב-localStorage/בייצוא הדף. הדף
   * הציבורי (experience-page.tsx) לא מעביר את הפרופ הזה בכלל. */
  imagePreviewOverrides?: Record<string, string>;
  /** Studio בלבד (Milestone D1, בחירה-על-קנבס) — undefined תמיד בדף הציבורי */
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const mode = useExperienceMode();
  if (resolveResponsive(layer.hidden ?? false, mode)) return null;

  const layout = resolveResponsive(layer.layout, mode);
  const style = layerLayoutStyle(layout) as CSSProperties;

  const inner = renderLayerContent(layer, blocks, theme, imagePreviewOverrides);
  if (inner === null) return null;

  return (
    <ExperienceTarget id={layer.id} style={style} selected={selected} onSelect={onSelect}>
      {inner}
    </ExperienceTarget>
  );
}

function renderLayerContent(
  layer: ExperienceLayerConfig,
  blocks: PageBlockInstance[] | undefined,
  theme: Theme | undefined,
  imagePreviewOverrides: Record<string, string> | undefined
) {
  switch (layer.type) {
    case "text":
      return <TextLayer content={layer.content as TextLayerContent} style={layer.style} />;
    case "image": {
      const content = layer.content as ImageLayerContent;
      const previewSrc = imagePreviewOverrides?.[layer.id];
      return <ImageLayer content={previewSrc ? { ...content, src: previewSrc } : content} />;
    }
    case "shape":
      return <ShapeLayer content={layer.content as ShapeLayerContent} style={layer.style} />;
    case "button":
      return <ButtonLayer content={layer.content as ButtonLayerContent} />;
    case "block":
      return blocks ? (
        <BlockLayer content={layer.content as BlockLayerContent} blocks={blocks} theme={theme} />
      ) : null;
    default:
      return null;
  }
}

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
}: {
  layer: ExperienceLayerConfig;
  /** נדרש רק ל-layer.type === "block" -- הפניה לבלוקים הקיימים של הדף */
  blocks?: PageBlockInstance[];
  theme?: Theme;
}) {
  const mode = useExperienceMode();
  if (layer.hidden) return null;

  const layout = resolveResponsive(layer.layout, mode);
  const style = layerLayoutStyle(layout) as CSSProperties;

  const inner = renderLayerContent(layer, blocks, theme);
  if (inner === null) return null;

  return (
    <ExperienceTarget id={layer.id} style={style}>
      {inner}
    </ExperienceTarget>
  );
}

function renderLayerContent(
  layer: ExperienceLayerConfig,
  blocks: PageBlockInstance[] | undefined,
  theme: Theme | undefined
) {
  switch (layer.type) {
    case "text":
      return <TextLayer content={layer.content as TextLayerContent} style={layer.style} />;
    case "image":
      return <ImageLayer content={layer.content as ImageLayerContent} />;
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

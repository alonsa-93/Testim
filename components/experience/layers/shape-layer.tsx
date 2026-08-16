import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { layerShadowClass, layerStyleToCss, type LayerStyle, type ShapeLayerContent } from "@/lib/experience";

/** Shape layer (Phase 6): דקורטיבי בלבד -- aria-hidden תמיד, לעולם לא נכנס ל-accessibility tree (§12.6, §34 במסמך התיקון) */
const SHAPE_CLASS: Record<ShapeLayerContent["shape"], string> = {
  circle: "rounded-full",
  blob: "rounded-[40%_60%_60%_40%/60%_30%_70%_40%]",
  rect: "rounded-card",
};

export function ShapeLayer({ content, style }: { content: ShapeLayerContent; style?: LayerStyle }) {
  return (
    <div
      aria-hidden="true"
      className={cn("size-full", SHAPE_CLASS[content.shape], layerShadowClass(style?.shadow))}
      style={layerStyleToCss(style) as CSSProperties}
    />
  );
}

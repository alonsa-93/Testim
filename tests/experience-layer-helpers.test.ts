import { describe, expect, it } from "vitest";
import { layerLayoutStyle, layerShadowClass, layerStyleToCss } from "@/lib/experience";
import type { LayerLayout, LayerStyle } from "@/lib/experience";

/**
 * Phase 6 — layer layout/style helpers (docs/experience-audit.md §12.2,
 * §12.4, §77 RTL). מבחני יחידה נפרדים מהרכיבים עצמם כי אלה פונקציות
 * טהורות שקל לוודא בבידוד.
 */
describe("layerLayoutStyle — stage mode", () => {
  it("sets position:absolute with logical inset properties, not left/top", () => {
    const layout: LayerLayout = { mode: "stage", x: "10%", y: "20vh" };
    const style = layerLayoutStyle(layout);
    expect(style.position).toBe("absolute");
    expect(style.insetInlineStart).toBe("10%");
    expect(style.insetBlockStart).toBe("20vh");
    expect(style.left).toBeUndefined();
    expect(style.top).toBeUndefined();
  });

  it("maps zIndex semantic layer to its numeric stacking order", () => {
    const style = layerLayoutStyle({ mode: "stage", zIndex: "foreground" });
    expect(style.zIndex).toBe(3);
  });

  it("maps anchor to transformOrigin", () => {
    expect(layerLayoutStyle({ mode: "stage", anchor: "start" }).transformOrigin).toBe("0% 50%");
    expect(layerLayoutStyle({ mode: "stage", anchor: "end" }).transformOrigin).toBe("100% 50%");
  });
});

describe("layerLayoutStyle — flow mode", () => {
  it("never sets position, even if x/y happen to be present", () => {
    const style = layerLayoutStyle({ mode: "flow", x: "10%", y: "20%" });
    expect(style.position).toBeUndefined();
    expect(style.insetInlineStart).toBeUndefined();
  });

  it("still applies width/maxWidth in flow mode", () => {
    const style = layerLayoutStyle({ mode: "flow", width: "50%", maxWidth: "40rem" });
    expect(style.width).toBe("50%");
    expect(style.maxWidth).toBe("40rem");
  });
});

describe("layerStyleToCss — semantic color resolution", () => {
  it("resolves a semantic color/background token to the theme CSS variable", () => {
    const style: LayerStyle = { color: "primary", background: "surface" };
    const css = layerStyleToCss(style);
    expect(css.color).toBe("var(--ds-color-primary)");
    expect(css.backgroundColor).toBe("var(--ds-color-surface)");
  });

  it("passes a custom hex value through unchanged", () => {
    expect(layerStyleToCss({ color: "#ff0000" }).color).toBe("#ff0000");
  });

  it("converts radius (number) into a px border-radius", () => {
    expect(layerStyleToCss({ radius: 12 }).borderRadius).toBe("12px");
  });

  it("returns an empty object for undefined style", () => {
    expect(layerStyleToCss(undefined)).toEqual({});
  });
});

describe("layerShadowClass", () => {
  it("maps the 3 shadow levels to existing Tailwind classes, none reused twice", () => {
    const none = layerShadowClass("none");
    const soft = layerShadowClass("soft");
    const strong = layerShadowClass("strong");
    expect(new Set([none, soft, strong]).size).toBe(3);
  });

  it("returns undefined when no shadow is specified", () => {
    expect(layerShadowClass(undefined)).toBeUndefined();
  });
});

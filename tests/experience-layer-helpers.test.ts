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

  it("maps anchor to logical textAlign too, not just transformOrigin (RTL-safe: start/center/end, never left/right)", () => {
    // אומת אמפירית ב-Playwright, Phase 9: בלי זה, קופסה ממורכזת ב-RTL
    // עדיין מיישרת את הטקסט שבתוכה לימין (ברירת המחדל של dir), ונראית
    // "לא ממורכזת" למרות שהקופסה עצמה כן ממורכזת נכון.
    expect(layerLayoutStyle({ mode: "stage", anchor: "start" }).textAlign).toBe("start");
    expect(layerLayoutStyle({ mode: "stage", anchor: "center" }).textAlign).toBe("center");
    expect(layerLayoutStyle({ mode: "stage", anchor: "end" }).textAlign).toBe("end");
  });

  it("centers via margin:auto + full inset, not transform, when anchor=center and width is set", () => {
    const style = layerLayoutStyle({ mode: "stage", anchor: "center", width: "20rem", x: "80%" });
    // x is deliberately ignored in this branch -- centering wins
    expect(style.insetInlineStart).toBe(0);
    expect(style.insetInlineEnd).toBe(0);
    expect(style.marginInlineStart).toBe("auto");
    expect(style.marginInlineEnd).toBe("auto");
    expect(style.translate).toBeUndefined(); // must never collide with the runtime's --exp-x/--exp-y
  });

  it("falls back to x-based positioning when anchor=center but no width is given", () => {
    const style = layerLayoutStyle({ mode: "stage", anchor: "center", x: "30%" });
    expect(style.insetInlineStart).toBe("30%");
    expect(style.marginInlineStart).toBeUndefined();
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
  // Milestone B4 (docs/architecture-decision-gate.md §2): color תמיד
  // עוטף ב-var(--exp-color, <fallback>) כדי ש-Track יוכל לדרוס אותו --
  // ה-fallback הוא בדיוק מה שהטסטים הישנים ציפו כערך הסופי (no-op
  // ויזואלי כשאין track: var(--exp-color, X) === X כשה-var לא מוגדר).
  it("resolves a semantic color/background token to the theme CSS variable", () => {
    const style: LayerStyle = { color: "primary", background: "surface" };
    const css = layerStyleToCss(style);
    expect(css.color).toBe("var(--exp-color, var(--ds-color-primary))");
    expect(css.backgroundColor).toBe("var(--ds-color-surface)");
  });

  it("passes a custom hex value through unchanged (as the var fallback)", () => {
    expect(layerStyleToCss({ color: "#ff0000" }).color).toBe("var(--exp-color, #ff0000)");
  });

  it("resolves onPrimary/onAccent -- needed for readable text on a primary/accent-colored background (§19 DoD: presets must not fail contrast)", () => {
    // אלה מחושבים בסטודיו במיוחד לניגודיות תקינה (bestTextOn/ContrastPanel) --
    // בלעדי המיפוי הזה, layer עם color:"onPrimary" על רקע primary היה מקבל
    // מחרוזת CSS לא תקינה ("onPrimary" עצמו), לא את הצבע המחושב.
    expect(layerStyleToCss({ color: "onPrimary" }).color).toBe("var(--exp-color, var(--ds-color-on-primary))");
    expect(layerStyleToCss({ color: "onAccent" }).color).toBe("var(--exp-color, var(--ds-color-on-accent))");
  });

  it("converts radius (number) into a px border-radius", () => {
    expect(layerStyleToCss({ radius: 12 }).borderRadius).toBe("12px");
  });

  it("still emits a Track-drivable color var (inherit fallback) even with no style at all", () => {
    // Milestone B4: no-op ויזואלי בפועל -- var(--exp-color, inherit) מרונדר
    // זהה לחלוטין לאי-הגדרת color בכלל, כשאין track שכותב ל---exp-color.
    expect(layerStyleToCss(undefined)).toEqual({ color: "var(--exp-color, inherit)" });
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

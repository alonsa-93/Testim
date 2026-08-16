import { describe, expect, it } from "vitest";
import {
  ANIM_CAPS,
  DEFAULT_EFFECTS_SOURCE,
  INTENSITY,
  getBlockAnim,
  resolveAnim,
  resolveBlockAnim,
  staggerChild,
  type EffectsAnimationSource,
} from "@/lib/effects";

/**
 * רזולוציית תצורת אנימציה (Phase 0.5, §16.2) — הבסיס הישיר להתנגשויות
 * בעלות (§8-9 באודיט): Experience לא יכול להתנהג נכון מול Reveal אם
 * הרזולוציה הבסיסית שלו כבר לא יציבה.
 */
const themeEffects: EffectsAnimationSource = { animation: { style: "rise", intensity: "dynamic" } };

describe("lib/effects — resolveAnim", () => {
  it("returns null when preset is off", () => {
    expect(resolveAnim(themeEffects, { preset: "off" })).toBeNull();
  });

  it("returns null when the resolved type is none", () => {
    expect(resolveAnim(themeEffects, { type: "none" })).toBeNull();
  });

  it("inherits type and intensity from the theme when block has no override", () => {
    const result = resolveAnim(themeEffects, {});
    expect(result?.type).toBe("rise");
    expect(result?.distance).toBe(INTENSITY.dynamic.distance);
    expect(result?.durationMs).toBe(INTENSITY.dynamic.duration);
  });

  it("lets a block override intensity independently of type", () => {
    const result = resolveAnim(themeEffects, { preset: "dramatic" });
    expect(result?.type).toBe("rise"); // still inherited from theme
    expect(result?.distance).toBe(INTENSITY.dramatic.distance);
  });

  it("clamps duration/delay/stagger to ANIM_CAPS even with a wild override", () => {
    const result = resolveAnim(themeEffects, {
      durationMs: 999_999,
      delayMs: -50,
      staggerMs: 999_999,
    });
    expect(result?.durationMs).toBe(ANIM_CAPS.durationMs);
    expect(result?.delayMs).toBe(0);
    expect(result?.staggerMs).toBe(ANIM_CAPS.staggerMs);
  });

  it("defaults once to true", () => {
    expect(resolveAnim(themeEffects, {})?.once).toBe(true);
    expect(resolveAnim(themeEffects, { once: false })?.once).toBe(false);
  });
});

describe("lib/effects — resolveBlockAnim + getBlockAnim (block content storage)", () => {
  it("reads the flat anim* keys back out of block content", () => {
    const anim = getBlockAnim({ animPreset: "dramatic", animType: "scale", animOnce: false });
    expect(anim).toEqual({
      preset: "dramatic",
      type: "scale",
      durationMs: undefined,
      delayMs: undefined,
      staggerMs: undefined,
      once: false,
    });
  });

  it("ignores unrecognized values instead of throwing", () => {
    const anim = getBlockAnim({ animPreset: "not-a-real-preset", animType: 42 });
    expect(anim.preset).toBeUndefined();
    expect(anim.type).toBeUndefined();
  });

  it("falls back to DEFAULT_EFFECTS_SOURCE when theme is undefined", () => {
    const withTheme = resolveAnim(DEFAULT_EFFECTS_SOURCE, {});
    const withoutTheme = resolveBlockAnim(undefined, {});
    expect(withoutTheme).toEqual(withTheme);
  });
});

describe("lib/effects — staggerChild", () => {
  it("adds index * staggerMs to delay, clamped", () => {
    const base = resolveAnim(themeEffects, {});
    const third = staggerChild(base, 2);
    expect(third?.delayMs).toBe((base?.staggerMs ?? 0) * 2);
  });

  it("passes null through unchanged", () => {
    expect(staggerChild(null, 3)).toBeNull();
  });
});

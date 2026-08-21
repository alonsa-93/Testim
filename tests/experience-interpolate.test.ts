import { describe, expect, it } from "vitest";
import {
  ease,
  evaluateKeyframes,
  evaluateTrack,
  interpolate,
  normalizeProgress,
  trackLocalProgress,
} from "@/lib/experience-interpolate";
import type { ExperienceTrack, Keyframe } from "@/lib/experience";

/**
 * Phase 3 — Timeline Engine (docs/experience-audit.md §16.3, §101 במסמך
 * הסופי): בדיוק המטריצה שהמפרט דורש — progress 0/.25/.5/.75/1, clamping
 * שלילי/מעל-1/NaN, keyframes ממוינים/לא-ממוינים/כפולים/חסרים/מחוץ-לטווח.
 */
describe("normalizeProgress — clamping", () => {
  it.each([
    [0, 0],
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
    [1, 1],
    [-1, 0],
    [2, 1],
    [NaN, 0],
  ])("normalizeProgress(%s) === %s", (input, expected) => {
    expect(normalizeProgress(input)).toBe(expected);
  });
});

describe("interpolate — plain linear", () => {
  it("interpolates between two values at t", () => {
    expect(interpolate(0, 100, 0)).toBe(0);
    expect(interpolate(0, 100, 0.5)).toBe(50);
    expect(interpolate(0, 100, 1)).toBe(100);
  });

  it("works with negative deltas (b < a)", () => {
    expect(interpolate(100, 0, 0.25)).toBe(75);
  });
});

describe("ease — cubic-bezier evaluation", () => {
  it("linear easing is the identity function", () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(ease(t, "linear")).toBeCloseTo(t, 5);
    }
  });

  it("endpoints are always 0 and 1 for any named easing", () => {
    for (const id of ["soft", "spring", "cinematic", "sharp"] as const) {
      expect(ease(0, id)).toBeCloseTo(0, 3);
      expect(ease(1, id)).toBeCloseTo(1, 3);
    }
  });

  it("a non-linear easing produces a different mid-point than linear", () => {
    expect(ease(0.5, "soft")).not.toBeCloseTo(0.5, 2);
  });
});

describe("evaluateKeyframes — ENTER/HOLD/EXIT within one track", () => {
  const enterHoldExit: Keyframe[] = [
    { at: 0, value: 0 },
    { at: 0.2, value: 1 },
    { at: 0.75, value: 1 },
    { at: 1, value: 0 },
  ];

  it.each([
    [0, 0],
    [0.2, 1],
    [0.5, 1], // inside the HOLD plateau
    [0.75, 1],
    [1, 0],
  ])("progress %s -> value %s", (p, expected) => {
    expect(evaluateKeyframes(enterHoldExit, p, "linear")).toBeCloseTo(expected, 5);
  });

  it("clamps before the first keyframe and after the last (no extrapolation)", () => {
    expect(evaluateKeyframes(enterHoldExit, -1, "linear")).toBe(0);
    expect(evaluateKeyframes(enterHoldExit, 2, "linear")).toBe(0);
  });

  it("interpolates linearly between two ordered keyframes", () => {
    const kfs: Keyframe[] = [{ at: 0, value: 0 }, { at: 1, value: 100 }];
    expect(evaluateKeyframes(kfs, 0.5, "linear")).toBeCloseTo(50, 5);
  });

  it("handles duplicate 'at' values without dividing by zero", () => {
    const kfs: Keyframe[] = [{ at: 0.5, value: 10 }, { at: 0.5, value: 20 }];
    expect(() => evaluateKeyframes(kfs, 0.5, "linear")).not.toThrow();
    expect(Number.isNaN(evaluateKeyframes(kfs, 0.5, "linear"))).toBe(false);
  });

  it("returns undefined for an empty keyframe list", () => {
    expect(evaluateKeyframes([], 0.5, "linear")).toBeUndefined();
  });

  it("returns the single value for a single-keyframe list regardless of progress", () => {
    const kfs: Keyframe[] = [{ at: 0.3, value: 42 }];
    expect(evaluateKeyframes(kfs, 0, "linear")).toBe(42);
    expect(evaluateKeyframes(kfs, 1, "linear")).toBe(42);
  });

  it("per-keyframe easing overrides the track/scene default for that segment", () => {
    const kfs: Keyframe[] = [{ at: 0, value: 0, easing: "linear" }, { at: 1, value: 100 }];
    // easing "soft" as a global default would NOT apply here -- the segment uses the
    // outgoing keyframe's own "linear" easing, so midpoint must be exactly linear
    expect(evaluateKeyframes(kfs, 0.5, "soft")).toBeCloseTo(50, 5);
  });
});

describe("trackLocalProgress — range sub-windows within a scene", () => {
  it("without a range, local progress equals scene progress", () => {
    const track: ExperienceTrack = { id: "t1", target: "x", props: {} };
    expect(trackLocalProgress(track, 0.5)).toBe(0.5);
  });

  it("maps scene progress into [0,1] across the declared range", () => {
    const track: ExperienceTrack = { id: "t1", target: "x", range: [0.2, 0.6], props: {} };
    expect(trackLocalProgress(track, 0.2)).toBeCloseTo(0, 5);
    expect(trackLocalProgress(track, 0.4)).toBeCloseTo(0.5, 5);
    expect(trackLocalProgress(track, 0.6)).toBeCloseTo(1, 5);
  });

  it("clamps before/after the range instead of producing negative or >1 progress", () => {
    const track: ExperienceTrack = { id: "t1", target: "x", range: [0.2, 0.6], props: {} };
    expect(trackLocalProgress(track, 0)).toBe(0);
    expect(trackLocalProgress(track, 1)).toBe(1);
  });
});

describe("evaluateTrack — full resolution with responsive overrides", () => {
  it("resolves every animated property on the track at a given scene progress", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }],
        y: [{ at: 0, value: 40 }, { at: 1, value: 0 }],
      },
    };
    const result = evaluateTrack(track, 0.5, "linear");
    expect(result.opacity).toBeCloseTo(0.5, 5);
    expect(result.y).toBeCloseTo(20, 5);
  });

  it("uses the mobile override instead of the base keyframes when mode=mobile", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: { x: [{ at: 0, value: 0 }, { at: 1, value: 100 }] },
      responsive: { mobile: { x: [{ at: 0, value: 0 }, { at: 1, value: 10 }] } },
    };
    expect(evaluateTrack(track, 1, "linear", "base").x).toBe(100);
    expect(evaluateTrack(track, 1, "linear", "mobile").x).toBe(10);
  });

  it("falls back to base keyframes on mobile when no override is declared for that property", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: { opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] },
    };
    expect(evaluateTrack(track, 1, "linear", "mobile").opacity).toBe(1);
  });

  it("only returns properties the track actually declares", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: { scale: [{ at: 0, value: 1 }, { at: 1, value: 1.2 }] },
    };
    const result = evaluateTrack(track, 0.5, "linear");
    expect(Object.keys(result)).toEqual(["scale"]);
  });

  /**
   * Milestone H (ביקורת מבקר-אדברסריאלי, ממצא #4): mode="mobile" עם רק
   * override ל-tablet מוגדר (בלי override ל-mobile עצמו) חייב לרשת את
   * ה-tablet override -- בדיוק כמו שresolveResponsive (lib/experience.ts)
   * כבר מתעד ומיישם ("נפילה חכמה" mobile->tablet->base) לכל שדה
   * Responsive<T> אחר. לפני התיקון זה היה נופל ישר ל-track.props (עקומת
   * ה-desktop), מדלג בשקט על ה-tablet override.
   */
  it("cascades mobile -> tablet -> base: mode=mobile with only a tablet override inherits the tablet curve", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: { x: [{ at: 0, value: 0 }, { at: 1, value: 100 }] },
      responsive: { tablet: { x: [{ at: 0, value: 0 }, { at: 1, value: 50 }] } },
    };
    expect(evaluateTrack(track, 1, "linear", "base").x).toBe(100);
    expect(evaluateTrack(track, 1, "linear", "tablet").x).toBe(50);
    expect(evaluateTrack(track, 1, "linear", "mobile").x).toBe(50); // inherits tablet, not base
  });

  it("still prefers an explicit mobile override over an also-present tablet override", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: { x: [{ at: 0, value: 0 }, { at: 1, value: 100 }] },
      responsive: {
        tablet: { x: [{ at: 0, value: 0 }, { at: 1, value: 50 }] },
        mobile: { x: [{ at: 0, value: 0 }, { at: 1, value: 10 }] },
      },
    };
    expect(evaluateTrack(track, 1, "linear", "mobile").x).toBe(10);
  });

  it("tablet mode never inherits a mobile-only override (cascade is one-directional: mobile can borrow from tablet, not the reverse)", () => {
    const track: ExperienceTrack = {
      id: "t1",
      target: "hero-title",
      props: { x: [{ at: 0, value: 0 }, { at: 1, value: 100 }] },
      responsive: { mobile: { x: [{ at: 0, value: 0 }, { at: 1, value: 10 }] } },
    };
    expect(evaluateTrack(track, 1, "linear", "tablet").x).toBe(100); // falls to base, not the mobile override
  });
});

/**
 * Milestone B1/B4 (docs/scroll-experience-rebuild-audit.md §2.1) — color
 * keyframes: ערך string (hex), אינטרפולציה דרך mixHex (lib/contrast.ts)
 * ולא interpolate() המספרי.
 */
describe("evaluateKeyframes — color (hex) interpolation", () => {
  const kfs: Keyframe[] = [
    { at: 0, value: "#000000" },
    { at: 1, value: "#FFFFFF" },
  ];

  it("returns a string, not a number, for color keyframes", () => {
    const result = evaluateKeyframes(kfs, 0.5, "linear");
    expect(typeof result).toBe("string");
  });

  it("mixes black->white to mid-gray at t=0.5 (linear easing)", () => {
    expect(evaluateKeyframes(kfs, 0.5, "linear")).toBe("#808080");
  });

  it("clamps to the first/last keyframe color outside [0,1]", () => {
    expect(evaluateKeyframes(kfs, -1, "linear")).toBe("#000000");
    expect(evaluateKeyframes(kfs, 2, "linear")).toBe("#FFFFFF");
  });

  it("evaluateTrack surfaces the interpolated hex string for a color prop", () => {
    const track: ExperienceTrack = {
      id: "t-color",
      target: "cta-button",
      props: { color: kfs },
    };
    const result = evaluateTrack(track, 0.5, "linear");
    expect(result.color).toBe("#808080");
  });
});

describe("evaluateKeyframes — clip (numeric, same engine as opacity/scale)", () => {
  it("interpolates linearly like any other numeric property", () => {
    const kfs: Keyframe[] = [{ at: 0, value: 0 }, { at: 1, value: 1 }];
    expect(evaluateKeyframes(kfs, 0.5, "linear")).toBe(0.5);
  });
});

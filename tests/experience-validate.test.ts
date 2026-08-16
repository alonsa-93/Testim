import { describe, expect, it } from "vitest";
import { validateExperience, validateScene } from "@/lib/experience-validate";
import type { ExperienceScene } from "@/lib/experience";

/**
 * Phase 1 — Track Ownership validation (docs/experience-audit.md §9).
 * ההודעות חייבות להיות קריאות לאדם (§100 במסמך הסופי) — לא שגיאת סכמה.
 */
function scene(overrides: Partial<ExperienceScene>): ExperienceScene {
  return {
    id: "s1",
    name: "Scene",
    composition: "flow",
    pinned: false,
    durationVh: 200,
    layers: [],
    tracks: [],
    ...overrides,
  };
}

describe("validateScene — track ownership conflicts", () => {
  it("flags two tracks controlling the same target+property", () => {
    const s = scene({
      tracks: [
        { id: "t1", target: "hero-title", props: { opacity: [{ at: 0, value: 0 }] } },
        { id: "t2", target: "hero-title", props: { opacity: [{ at: 0, value: 1 }] } },
      ],
    });
    const issues = validateScene(s);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("ownership-conflict");
    expect(issues[0].trackIds).toEqual(["t1", "t2"]);
    expect(issues[0].message).toContain("hero-title");
    expect(issues[0].message).not.toMatch(/schema|ExperienceTrack/i); // human-readable, not a technical dump
  });

  it("does not flag two tracks on the same target controlling different properties", () => {
    const s = scene({
      tracks: [
        { id: "t1", target: "hero-title", props: { opacity: [{ at: 0, value: 0 }] } },
        { id: "t2", target: "hero-title", props: { scale: [{ at: 0, value: 1 }] } },
      ],
    });
    expect(validateScene(s)).toHaveLength(0);
  });

  it("does not flag a single track controlling multiple properties", () => {
    const s = scene({
      tracks: [
        {
          id: "t1",
          target: "hero-title",
          props: { opacity: [{ at: 0, value: 0 }], scale: [{ at: 0, value: 1 }] },
        },
      ],
    });
    expect(validateScene(s)).toHaveLength(0);
  });

  it("flags an incompatible target (infinite CSS animation) exactly once even with multiple props", () => {
    const s = scene({
      tracks: [
        {
          id: "t1",
          target: "fx-marquee-track",
          props: { opacity: [{ at: 0, value: 0 }], x: [{ at: 0, value: 1 }] },
        },
      ],
    });
    const issues = validateScene(s);
    expect(issues.filter((i) => i.kind === "incompatible-target")).toHaveLength(1);
  });
});

describe("validateExperience — aggregates across scenes", () => {
  it("scopes conflicts to their own scene (same target+prop in different scenes is fine)", () => {
    const config = {
      version: 1 as const,
      enabled: true,
      mode: "scroll" as const,
      settings: {
        defaultDurationVh: 200,
        defaultEasing: "soft" as const,
        reducedMotion: "static" as const,
        performance: "auto" as const,
        intensity: 1,
        scrub: 0,
        debug: false,
      },
      scenes: [
        scene({ id: "a", tracks: [{ id: "t1", target: "hero-title", props: { opacity: [{ at: 0, value: 0 }] } }] }),
        scene({ id: "b", tracks: [{ id: "t2", target: "hero-title", props: { opacity: [{ at: 0, value: 0 }] } }] }),
      ],
    };
    expect(validateExperience(config)).toHaveLength(0);
  });
});

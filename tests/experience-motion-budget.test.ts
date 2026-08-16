import { describe, expect, it } from "vitest";
import { computeExperienceMotionBudget, computeSceneMotionBudget } from "@/lib/experience-motion-budget";
import { emptyExperience, type ExperienceScene, type ExperienceTrack } from "@/lib/experience";

/**
 * Phase 8 — Motion Budget (docs/experience-audit.md §18 Phase 8).
 * חושף בסטודיו כמה "כבדה" scene/experience, בהתבסס על
 * PROPERTY_METADATA.performanceClass הקיים -- לא cap חוסם, אינדיקטור.
 */
function track(props: ExperienceTrack["props"]): ExperienceTrack {
  return { id: `t-${Math.random()}`, target: "x", props };
}

function scene(tracks: ExperienceTrack[]): ExperienceScene {
  return { id: "s1", name: "s", composition: "stage", pinned: true, durationVh: 200, layers: [], tracks };
}

describe("computeSceneMotionBudget", () => {
  it("an empty scene is light", () => {
    const budget = computeSceneMotionBudget(scene([]));
    expect(budget.verdict).toBe("light");
    expect(budget.trackCount).toBe(0);
    expect(budget.expensivePropCount).toBe(0);
  });

  it("a scene with only cheap properties (opacity/x/y/scale/rotate) stays light regardless of count, up to the track threshold", () => {
    const tracks = Array.from({ length: 4 }, () => track({ opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] }));
    const budget = computeSceneMotionBudget(scene(tracks));
    expect(budget.expensivePropCount).toBe(0);
    expect(budget.verdict).toBe("light");
  });

  it("a single blur usage bumps the verdict to at least moderate", () => {
    const budget = computeSceneMotionBudget(scene([track({ blur: [{ at: 0, value: 0 }, { at: 1, value: 10 }] })]));
    expect(budget.expensivePropCount).toBe(1);
    expect(budget.verdict).toBe("moderate");
  });

  it("3+ blur usages (even across different tracks) makes it heavy", () => {
    const tracks = Array.from({ length: 3 }, () => track({ blur: [{ at: 0, value: 0 }, { at: 1, value: 10 }] }));
    const budget = computeSceneMotionBudget(scene(tracks));
    expect(budget.expensivePropCount).toBe(3);
    expect(budget.verdict).toBe("heavy");
  });

  it("10+ tracks alone (even all cheap) makes it heavy", () => {
    const tracks = Array.from({ length: 10 }, () => track({ opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] }));
    const budget = computeSceneMotionBudget(scene(tracks));
    expect(budget.verdict).toBe("heavy");
  });
});

describe("computeExperienceMotionBudget", () => {
  it("worst reflects the single heaviest scene, not an average", () => {
    const light = scene([track({ opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] })]);
    const heavy = { ...scene([track({ blur: [{ at: 0, value: 0 }, { at: 1, value: 10 }] }), track({ blur: [{ at: 0, value: 0 }, { at: 1, value: 10 }] }), track({ blur: [{ at: 0, value: 0 }, { at: 1, value: 10 }] })]), id: "s2" };
    const config = { ...emptyExperience(), scenes: [light, heavy] };
    const result = computeExperienceMotionBudget(config);
    expect(result.worst).toBe("heavy");
    expect(result.scenes).toHaveLength(2);
  });

  it("an experience with zero scenes is light", () => {
    const result = computeExperienceMotionBudget(emptyExperience());
    expect(result.worst).toBe("light");
    expect(result.scenes).toEqual([]);
  });
});

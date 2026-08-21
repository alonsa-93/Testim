import { describe, expect, it } from "vitest";
import { EXPERIENCE_PRESETS, instantiatePresetScene, parallaxTrack } from "@/lib/experience-presets";
import { validateScene, type ExperienceValidationIssue } from "@/lib/experience-validate";
import type { ExperienceLayer, ExperienceScene, ExperienceTrack } from "@/lib/experience";

/**
 * Phase 8 — Presets (docs/experience-audit.md §18 Phase 8, §8 במסמך
 * הסופי). כל preset הוא scene אמיתי, לא רק מטא-דאטה -- הבדיקות כאן
 * מוודאות שכל אחד מששת ה-presets תקין כשלעצמו (כל track מכוון ל-layer
 * שקיים באותו preset), ושה-remapping (instantiatePresetScene) מונע
 * בדיוק את התנגשות ה-TargetRegistry הגלובלית שתועדה בקוד המקור.
 */
describe("EXPERIENCE_PRESETS", () => {
  it("ships exactly the 6 named presets from the master directive", () => {
    const ids = EXPERIENCE_PRESETS.map((p) => p.id).sort();
    expect(ids).toEqual(["bold", "cinematic", "digital", "editorial", "experimental", "luxury"].sort());
  });

  it("every preset's tracks target a layer that actually exists in that same preset", () => {
    for (const preset of EXPERIENCE_PRESETS) {
      const layerIds = new Set((preset.scene.layers ?? []).map((l) => l.id));
      for (const track of preset.scene.tracks ?? []) {
        expect(layerIds.has(track.target), `${preset.id}: track "${track.id}" targets missing layer "${track.target}"`).toBe(true);
      }
    }
  });

  it('"bold" pairs its primary-colored background with onPrimary text, not plain "text" -- a real contrast bug, not just an unownership-conflict issue', () => {
    const bold = EXPERIENCE_PRESETS.find((p) => p.id === "bold")!;
    expect(bold.scene.background?.color).toBe("primary");
    const title = bold.scene.layers?.find((l) => l.type === "text");
    expect(title?.style?.color).toBe("onPrimary");
  });

  it("every preset scene passes validateScene with zero ownership/incompatible-target issues", () => {
    for (const preset of EXPERIENCE_PRESETS) {
      const scene: ExperienceScene = {
        id: "s",
        name: preset.label,
        composition: preset.scene.composition ?? "stage",
        pinned: preset.scene.pinned ?? true,
        durationVh: preset.scene.durationVh ?? 200,
        layers: preset.scene.layers ?? [],
        tracks: preset.scene.tracks ?? [],
      };
      const issues: ExperienceValidationIssue[] = validateScene(scene);
      expect(issues, `${preset.id} has validation issues: ${JSON.stringify(issues)}`).toEqual([]);
    }
  });
});

describe("instantiatePresetScene", () => {
  it("gives layers/tracks fresh ids that don't collide with what's already on the page", () => {
    const existingLayers: ExperienceLayer[] = [
      { id: "text-1", type: "text", content: { text: "x", tag: "p" }, layout: { mode: "stage" } },
    ];
    const existingTracks: ExperienceTrack[] = [
      { id: "track-1", target: "text-1", props: {} },
    ];
    const cinematic = EXPERIENCE_PRESETS.find((p) => p.id === "cinematic")!;
    const { layers, tracks } = instantiatePresetScene(cinematic.scene, existingLayers, existingTracks);

    expect(layers.every((l) => l.id !== "text-1")).toBe(true);
    expect(tracks.every((t) => t.id !== "track-1")).toBe(true);
    // ה-track של ה-preset עוקב אחרי ה-id החדש של השכבה, לא אחרי ה-id הישן ("preset-title")
    expect(tracks[0].target).toBe(layers[0].id);
    expect(tracks[0].target).not.toBe("preset-title");
  });

  it("adding the same preset twice produces two fully distinct id sets (no TargetRegistry collision)", () => {
    const cinematic = EXPERIENCE_PRESETS.find((p) => p.id === "cinematic")!;
    const first = instantiatePresetScene(cinematic.scene, [], []);
    const second = instantiatePresetScene(cinematic.scene, first.layers, first.tracks);

    expect(first.layers[0].id).not.toBe(second.layers[0].id);
    expect(first.tracks[0].id).not.toBe(second.tracks[0].id);
    expect(second.tracks[0].target).toBe(second.layers[0].id);
  });

  it("adding two different presets back-to-back doesn't collide, even though both use the same generic source ids", () => {
    const cinematic = EXPERIENCE_PRESETS.find((p) => p.id === "cinematic")!;
    const digital = EXPERIENCE_PRESETS.find((p) => p.id === "digital")!;
    const first = instantiatePresetScene(cinematic.scene, [], []);
    const second = instantiatePresetScene(digital.scene, first.layers, first.tracks);

    expect(first.layers[0].id).not.toBe(second.layers[0].id);
    expect(second.tracks[0].target).toBe(second.layers[0].id);
  });

  it("passes through an empty preset (no layers/tracks) without throwing", () => {
    expect(() => instantiatePresetScene({}, [], [])).not.toThrow();
    expect(instantiatePresetScene({}, [], [])).toEqual({ layers: [], tracks: [] });
  });
});

/**
 * Milestone F2 (docs/rebuild-workplan.md אבן דרך F2, "עדכון ששת ה-
 * presets הקיימים לרף החדש") — הוכחה שהעדכון בפועל קרה, לא רק תיעוד:
 * durationVh רספונסיבי בחמשת ה-presets המוצמדים, digital מקבל clip,
 * luxury מקבל שכבת עומק עם parallax.
 */
describe("EXPERIENCE_PRESETS — Milestone F2 quality-bar updates", () => {
  it("every pinned (stage) preset has a real tablet/mobile durationVh override, not a flat number", () => {
    for (const preset of EXPERIENCE_PRESETS) {
      if (preset.scene.composition !== "stage") continue; // editorial (flow) intentionally excluded -- durationVh isn't consumed for flow height
      const duration = preset.scene.durationVh;
      expect(typeof duration, `${preset.id}: durationVh should be Responsive<number>, not a flat number`).toBe("object");
      const d = duration as { base: number; tablet?: number; mobile?: number };
      expect(d.mobile, `${preset.id}: missing a real mobile override`).toBeLessThan(d.base);
      expect(d.tablet, `${preset.id}: missing a real tablet override`).toBeLessThan(d.base);
    }
  });

  it('"digital" reveals its title with a clip wipe in the same 0->0.15 entrance window as opacity/y', () => {
    const digital = EXPERIENCE_PRESETS.find((p) => p.id === "digital")!;
    const track = digital.scene.tracks?.[0];
    expect(track?.props.clip).toEqual([{ at: 0, value: 0 }, { at: 0.15, value: 1 }]);
  });

  it('"luxury" carries a second, low-opacity parallax depth layer distinct from the title', () => {
    const luxury = EXPERIENCE_PRESETS.find((p) => p.id === "luxury")!;
    expect(luxury.scene.layers).toHaveLength(2);
    const depthTrack = luxury.scene.tracks?.find((t) => t.target === "preset-luxury-depth");
    expect(depthTrack).toBeDefined();
    // Peak opacity stays restrained (§0 principle 2: decorative = subtle, not competing with the title)
    const peaks = depthTrack!.props.opacity!.map((k) => k.value as number);
    expect(Math.max(...peaks)).toBeLessThanOrEqual(0.4);
  });
});

/**
 * Milestone F2 — parallaxTrack, the primitive itself (docs/reference-
 * experience-analysis.md §4: "אין helper ייעודי ל'יחס מהירות'"). Exported
 * (unlike the other preset-internal helpers here) because a "speed ratio"
 * primitive is exactly the kind of reusable building block worth a real
 * public contract, not just internal preset plumbing.
 */
describe("parallaxTrack (Milestone F2 primitive)", () => {
  it("factor=0 means frozen -- no travel at all", () => {
    const track = parallaxTrack("t", 0);
    expect(track.props.y).toEqual([{ at: 0, value: 0 }, { at: 1, value: 0 }]);
  });

  it("factor scales travel distance linearly (0.5x factor = half the travel of 1x)", () => {
    const full = parallaxTrack("t", 1, { travelPercent: 40 });
    const half = parallaxTrack("t", 0.5, { travelPercent: 40 });
    const fullTravel = (full.props.y![0].value as number) - (full.props.y![1].value as number);
    const halfTravel = (half.props.y![0].value as number) - (half.props.y![1].value as number);
    expect(halfTravel).toBeCloseTo(fullTravel / 2);
  });

  it("a negative factor reverses travel direction", () => {
    const positive = parallaxTrack("t", 1, { travelPercent: 40 });
    const negative = parallaxTrack("t", -1, { travelPercent: 40 });
    expect(negative.props.y![0].value).toBe(-(positive.props.y![0].value as number));
  });

  it("moves from +travel to -travel across the scene (starts below baseline, ends above -- reads as parallax, not a one-way drift)", () => {
    const track = parallaxTrack("t", 1, { travelPercent: 40 });
    expect(track.props.y![0].value).toBe(40);
    expect(track.props.y![1].value).toBe(-40);
  });

  it("defaults to linear easing (parallax should track scroll 1:1, not ease in/out)", () => {
    const track = parallaxTrack("t", 0.5);
    expect(track.easing).toBe("linear");
  });
});

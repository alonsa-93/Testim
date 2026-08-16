import { describe, expect, it } from "vitest";
import { EXPERIENCE_PRESETS, instantiatePresetScene } from "@/lib/experience-presets";
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

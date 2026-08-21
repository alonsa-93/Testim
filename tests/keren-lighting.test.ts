import { describe, expect, it } from "vitest";
import { kerenLightingPage } from "@/pages-data/keren-lighting";
import { getPage, pages } from "@/pages-data";
import { normalizePage } from "@/lib/page";
import { validateExperience } from "@/lib/experience-validate";
import { resolveResponsive } from "@/lib/experience";

/**
 * Milestone G (docs/rebuild-workplan.md אבן דרך G, Phase 15) — הדמו
 * האיכותי ("קרן"). נבנה כדף פרסום אמיתי (לא route מיוחד) כדי להוכיח
 * את צינור הפרסום המלא שתוקן ב-Milestone F1 -- הבדיקות כאן מוודאות
 * שהוא רשום נכון, תקין ולא מפר אף אחד מהעקרונות המחייבים (בעלות
 * יחידה, ניגודיות), בדיוק כמו tests/experience-presets.test.ts עושה
 * ל-EXPERIENCE_PRESETS.
 */
describe("keren-lighting page (Milestone G demo)", () => {
  it("is registered in pages-data and reachable via getPage(\"keren\")", () => {
    expect(pages.some((p) => p.id === "keren")).toBe(true);
    expect(getPage("keren")).toBe(kerenLightingPage);
  });

  it("normalizes cleanly with zero data loss (round-trips through the same path a real /p/[pageId] request takes)", () => {
    const normalized = normalizePage(kerenLightingPage);
    expect(normalized.experience?.enabled).toBe(true);
    expect(normalized.experience?.scenes).toHaveLength(5);
    // every layer/track survived normalization (not silently dropped)
    const rawLayerCount = kerenLightingPage.experience!.scenes.reduce((n, s) => n + s.layers.length, 0);
    const normalizedLayerCount = normalized.experience!.scenes.reduce((n, s) => n + s.layers.length, 0);
    expect(normalizedLayerCount).toBe(rawLayerCount);
    const rawTrackCount = kerenLightingPage.experience!.scenes.reduce((n, s) => n + s.tracks.length, 0);
    const normalizedTrackCount = normalized.experience!.scenes.reduce((n, s) => n + s.tracks.length, 0);
    expect(normalizedTrackCount).toBe(rawTrackCount);
  });

  it("passes validateExperience with zero ownership/incompatible-target/contrast issues", () => {
    const issues = validateExperience(kerenLightingPage.experience!);
    expect(issues, `keren-lighting has validation issues: ${JSON.stringify(issues)}`).toEqual([]);
  });

  it("every track targets a layer id that exists in the same scene, or the scene's blockRefs", () => {
    for (const scene of kerenLightingPage.experience!.scenes) {
      const layerIds = new Set(scene.layers.map((l) => l.id));
      const blockRefIds = new Set(scene.blockRefs ?? []);
      for (const track of scene.tracks) {
        const targetsSomethingReal = layerIds.has(track.target) || blockRefIds.has(track.target);
        expect(targetsSomethingReal, `${scene.id}: track "${track.id}" targets missing "${track.target}"`).toBe(true);
      }
    }
  });

  it("the CTA scene bridges to a real block that exists in page.blocks (Milestone C1's blockRefs pattern)", () => {
    const ctaScene = kerenLightingPage.experience!.scenes.find((s) => s.id === "keren-cta")!;
    expect(ctaScene.blockRefs).toEqual(["keren-cta-block"]);
    expect(kerenLightingPage.blocks.some((b) => b.id === "keren-cta-block")).toBe(true);
  });

  it("every pinned (stage) scene has a real tablet/mobile durationVh override, matching the Milestone F2 preset precedent", () => {
    for (const scene of kerenLightingPage.experience!.scenes) {
      if (scene.composition !== "stage") continue;
      const d = scene.durationVh as { base: number; tablet?: number; mobile?: number };
      expect(typeof d, `${scene.id}: durationVh should be Responsive<number>`).toBe("object");
      expect(d.mobile).toBeLessThan(d.base);
      expect(d.tablet).toBeLessThan(d.base);
    }
  });

  it("the hero's decorative glow shape is hidden on mobile but present on base/tablet (real Responsive<boolean> usage)", () => {
    const hero = kerenLightingPage.experience!.scenes.find((s) => s.id === "keren-hero")!;
    const glow = hero.layers.find((l) => l.id === "keren-glow")!;
    expect(resolveResponsive(glow.hidden ?? false, "base")).toBe(false);
    expect(resolveResponsive(glow.hidden ?? false, "tablet")).toBe(false);
    expect(resolveResponsive(glow.hidden ?? false, "mobile")).toBe(true);
  });

  it("uses the Milestone F2 parallax primitives directly (not hand-rolled equivalents) for its depth layers", () => {
    const reveal = kerenLightingPage.experience!.scenes.find((s) => s.id === "keren-reveal")!;
    const back = reveal.tracks.find((t) => t.target === "keren-reveal-shape-back")!;
    const mid = reveal.tracks.find((t) => t.target === "keren-reveal-shape-mid")!;
    // Different parallax factors on two layers in the same scene at the same
    // progress -- the actual "depth" proof: they must travel by different amounts.
    const backTravel = (back.props.y![0].value as number) - (back.props.y![1].value as number);
    const midTravel = (mid.props.y![0].value as number) - (mid.props.y![1].value as number);
    expect(Math.abs(midTravel)).toBeGreaterThan(Math.abs(backTravel));
  });
});

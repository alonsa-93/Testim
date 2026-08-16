import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ExperienceBlockRefLayer, ExperiencePage } from "@/components/experience/experience-page";
import type { Page, PageBlockInstance } from "@/lib/page";
import type { ExperienceConfig, ExperienceScene } from "@/lib/experience";
import { emptyExperience } from "@/lib/experience";

/**
 * Phase 9 (retroactive coverage) — ExperienceBlockRefLayer/ExperiencePage
 * (docs/experience-audit.md §12.3, §104): הגשר בין Experience לבלוקים
 * קיימים. הבאג האמפירי שנמצא ותוקן ב-Phase 9 (block ref בלי
 * ExperienceTarget עוטף -- שום track לא יכול היה למצוא אותו) לא היה
 * מכוסה באף מבחן יחידה; זה סוגר את הפער.
 */
function ctaBlock(overrides: Partial<PageBlockInstance> = {}): PageBlockInstance {
  return {
    id: "cta-1",
    type: "cta",
    content: { title: "כותרת", text: "טקסט", ctaLabel: "לחצו", ctaHref: "#" },
    ...overrides,
  };
}

describe("ExperienceBlockRefLayer", () => {
  afterEach(cleanup);

  it("wraps the resolved block in an ExperienceTarget carrying the block id -- registerable by a track", () => {
    const { container } = render(
      <ExperienceBlockRefLayer blockId="cta-1" blocks={[ctaBlock()]} />
    );
    const target = container.querySelector('[data-experience-target="cta-1"]');
    expect(target).toBeTruthy();
    expect(target?.textContent).toContain("כותרת");
  });

  it("renders nothing for a blockId that doesn't exist on the page, without throwing", () => {
    const { container } = render(
      <ExperienceBlockRefLayer blockId="missing" blocks={[ctaBlock()]} />
    );
    expect(container.querySelector('[data-experience-target]')).toBeNull();
  });

  it("renders nothing for a block whose type isn't a registered block def", () => {
    const { container } = render(
      <ExperienceBlockRefLayer blockId="x" blocks={[ctaBlock({ id: "x", type: "not-a-real-block" })]} />
    );
    expect(container.querySelector('[data-experience-target]')).toBeNull();
  });
});

describe("ExperiencePage — blockRefs wiring", () => {
  afterEach(cleanup);

  function page(experience: ExperienceConfig): Page {
    return {
      id: "p",
      name: "p",
      themeId: "default",
      meta: { title: "", description: "" },
      blocks: [ctaBlock()],
      experience,
    } as unknown as Page;
  }

  function scene(overrides: Partial<ExperienceScene> = {}): ExperienceScene {
    return {
      id: "s1",
      name: "s",
      composition: "flow",
      pinned: false,
      durationVh: 100,
      layers: [],
      tracks: [],
      blockRefs: ["cta-1"],
      ...overrides,
    };
  }

  it("registers every blockRefs entry as a distinct ExperienceTarget, reachable by a track", () => {
    const config = { ...emptyExperience(), scenes: [scene()] };
    const { container } = render(<ExperiencePage page={page(config)} />);
    expect(container.querySelector('[data-experience-target="cta-1"]')).toBeTruthy();
  });

  it("returns null entirely when the page has no experience config", () => {
    const { container } = render(
      <ExperiencePage page={{ ...page(emptyExperience()), experience: undefined }} />
    );
    expect(container.innerHTML).toBe("");
  });
});

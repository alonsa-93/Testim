import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ExperienceProvider } from "@/components/experience/experience-provider";
import { ExperienceScene } from "@/components/experience/experience-scene";
import type { ExperienceScene as ExperienceSceneConfig } from "@/lib/experience";

/**
 * Phase 4 — Scene/Stage (docs/experience-audit.md §4.3, §11, §18).
 * Sticky pinning, Stage vs Flow composition, reduced-motion disabling
 * pin (not content), scene registration lifecycle.
 */
function scene(overrides: Partial<ExperienceSceneConfig> = {}): ExperienceSceneConfig {
  return {
    id: "s1",
    name: "Scene",
    composition: "stage",
    pinned: true,
    durationVh: 200,
    layers: [],
    tracks: [],
    ...overrides,
  };
}

describe("ExperienceScene — Stage Mode", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders a scroll-track wrapper with a sticky stage child when pinned", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene()}>
          <h1>content</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    const wrapper = container.querySelector('[data-experience-scene="s1"]') as HTMLElement;
    expect(wrapper.tagName).toBe("SECTION");
    expect(wrapper.style.minHeight).toBe("200svh");

    const stage = wrapper.querySelector(".exp-stage") as HTMLElement;
    expect(stage.className).toContain("sticky");
    expect(stage.className).toContain("top-0");
  });

  it("renders content visibly (not sticky, no forced track height) under reduced motion", () => {
    class FakeMQL extends EventTarget {
      matches = false; // reduced motion on
    }
    vi.spyOn(window, "matchMedia").mockReturnValue(new FakeMQL() as unknown as MediaQueryList);

    const { container, getByText } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene()}>
          <h1>content</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    // תוכן משמעותי עדיין גלוי ונגיש -- §48 במסמך התיקון
    expect(getByText("content")).toBeInTheDocument();

    const wrapper = container.querySelector('[data-experience-scene="s1"]') as HTMLElement;
    expect(wrapper.style.minHeight).toBe(""); // pinning בוטל -- אין track height כפוי

    const stage = wrapper.querySelector(".exp-stage") as HTMLElement;
    expect(stage.className).not.toContain("sticky");
  });

  it("respects composition:stage with pinned:false (no sticky track, but still Stage layout)", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene({ pinned: false })}>
          <h1>content</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    const wrapper = container.querySelector('[data-experience-scene="s1"]') as HTMLElement;
    expect(wrapper.style.minHeight).toBe("");
    const stage = wrapper.querySelector(".exp-stage") as HTMLElement;
    expect(stage.className).not.toContain("sticky");
  });
});

describe("ExperienceScene — Flow Mode", () => {
  afterEach(() => cleanup());

  it("renders plain document flow: no sticky, no forced height, single section", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene({ composition: "flow", pinned: false })}>
          <p>long-form content</p>
        </ExperienceScene>
      </ExperienceProvider>
    );
    const wrapper = container.querySelector('[data-experience-scene="s1"]') as HTMLElement;
    expect(wrapper.tagName).toBe("SECTION");
    expect(wrapper.style.minHeight).toBe("");
    expect(wrapper.querySelector(".sticky")).toBeNull();
  });
});

describe("ExperienceScene — registration lifecycle", () => {
  afterEach(() => cleanup());

  it("registers with the runtime on mount and unregisters on unmount", async () => {
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
      scenes: [scene()],
    };

    const { unmount } = render(
      <ExperienceProvider config={config}>
        <ExperienceScene scene={scene()}>
          <h1>content</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    expect(() => unmount()).not.toThrow();
  });

  it("is a safe no-op with no ExperienceProvider ancestor (Standard rendering)", () => {
    expect(() =>
      render(
        <ExperienceScene scene={scene()}>
          <h1>content</h1>
        </ExperienceScene>
      )
    ).not.toThrow();
  });
});

describe("ExperienceScene — background + transition attributes", () => {
  afterEach(() => cleanup());

  it("resolves a semantic color token to the theme CSS variable, not a literal color", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene({ background: { color: "surface" } })}>
          <h1>x</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    const stage = container.querySelector(".exp-stage") as HTMLElement;
    expect(stage.style.backgroundColor).toBe("var(--ds-color-surface)");
  });

  it("passes a custom hex color through unchanged", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene({ background: { color: "#112233" } })}>
          <h1>x</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    const stage = container.querySelector(".exp-stage") as HTMLElement;
    expect(stage.style.backgroundColor).toBe("rgb(17, 34, 51)");
  });

  it("defaults data-scene-transition to 'cut' when not specified", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene()}>
          <h1>x</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    expect(container.querySelector('[data-scene-transition="cut"]')).toBeTruthy();
  });

  it("carries an explicit transition value through to the DOM", () => {
    const { container } = render(
      <ExperienceProvider config={undefined}>
        <ExperienceScene scene={scene({ transition: "fade" })}>
          <h1>x</h1>
        </ExperienceScene>
      </ExperienceProvider>
    );
    expect(container.querySelector('[data-scene-transition="fade"]')).toBeTruthy();
  });
});

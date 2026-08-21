import { afterEach, describe, expect, it, vi } from "vitest";
import { ExperienceRuntime, TargetRegistry, measureScene, sceneLifecycleState } from "@/components/experience/experience-runtime";
import { WindowScrollRoot, ElementScrollRoot } from "@/lib/scroll-root";
import { emptyExperience, type ExperienceConfig } from "@/lib/experience";

/**
 * Phase 2 — Experience Runtime (docs/experience-audit.md §4.2, §16.3
 * "Scene Runtime" / "Runtime" matrix: scene activation, release, rapid
 * scrolling, resize during scroll -- covered here at the unit level;
 * a real-browser proof follows in the Phase 2 gate via Playwright).
 */
describe("TargetRegistry", () => {
  it("registers, resolves, and unregisters targets", () => {
    const registry = new TargetRegistry();
    const el = document.createElement("div");
    registry.register("hero-title", el);
    expect(registry.resolve("hero-title")).toBe(el);
    expect(registry.has("hero-title")).toBe(true);

    registry.unregister("hero-title");
    expect(registry.resolve("hero-title")).toBeUndefined();
    expect(registry.has("hero-title")).toBe(false);
  });

  it("resolving a missing target returns undefined, never throws", () => {
    const registry = new TargetRegistry();
    expect(() => registry.resolve("missing")).not.toThrow();
    expect(registry.resolve("missing")).toBeUndefined();
  });
});

describe("measureScene", () => {
  function makeScene(top: number, height: number, viewportHeight = 800) {
    const el = document.createElement("section");
    document.body.appendChild(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ top, height } as DOMRect);
    Object.defineProperty(window, "innerHeight", { value: viewportHeight, configurable: true });
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("progress is 0 before the scene enters (rect.top === total distance)", () => {
    // total = height - viewport = 1600 - 800 = 800; top=800 -> progress = -800/800 = -1 -> before, clamped 0
    const el = makeScene(800, 1600);
    const m = measureScene(el, new WindowScrollRoot());
    expect(m.state).toBe("before");
    expect(m.progress).toBe(0);
  });

  it("progress is ~0.5 midway through the scene", () => {
    const el = makeScene(-400, 1600); // total=800, top=-400 -> 400/800=0.5
    const m = measureScene(el, new WindowScrollRoot());
    expect(m.progress).toBeCloseTo(0.5, 5);
    expect(m.state).toBe("active");
  });

  it("progress clamps to 1 and state becomes 'after' once fully scrolled past", () => {
    const el = makeScene(-2000, 1600); // way past
    const m = measureScene(el, new WindowScrollRoot());
    expect(m.progress).toBe(1);
    expect(m.state).toBe("after");
    expect(m.rawProgress).toBeGreaterThan(1);
  });

  it("a scene shorter than the viewport resolves progress via viewport-entry, not a negative/NaN total", () => {
    const el = makeScene(-10, 400, 800); // height(400) < viewport(800) -> total <= 0, top already ~at viewport-top
    const m = measureScene(el, new WindowScrollRoot());
    expect(Number.isNaN(m.progress)).toBe(false);
    expect(m.progress).toBe(1);
  });

  it("a short flow scene at the very end of the page (top never reaches 0) still progresses smoothly, not stuck at 0", () => {
    // אומת אמפירית ב-Playwright (Phase 9): scene אחרון בדף, קצר מה-viewport,
    // בלי עוד גובה גלילה מתחתיו -- top נשאר חיובי (195) גם בגלילה מקסימלית,
    // כי אין "לאן" לגלול הלאה. עם הבינארי הישן (top<=0?1:0) זה היה נשאר
    // תקוע ב-progress=0 לנצח, למרות שהאלמנט כבר ברובו בתוך ה-viewport.
    const el = makeScene(195, 487, 900); // height(487) < viewport(900), top still positive
    const m = measureScene(el, new WindowScrollRoot());
    expect(m.progress).toBeCloseTo((900 - 195) / 900, 5); // ~0.783 -- well past the entrance track's last keyframe (0.3)
    expect(m.progress).toBeGreaterThan(0.3);
  });

  it("a short flow scene not yet visible (top === viewportSize) has progress 0", () => {
    const el = makeScene(900, 300, 900); // just below the fold, hasn't entered yet
    const m = measureScene(el, new WindowScrollRoot());
    expect(m.progress).toBe(0);
  });
});

describe("ExperienceRuntime — end to end wiring", () => {
  function config(overrides: Partial<ExperienceConfig> = {}): ExperienceConfig {
    return {
      ...emptyExperience(),
      scenes: [
        {
          id: "s1",
          name: "Scene",
          composition: "flow",
          pinned: false,
          durationVh: 200,
          layers: [],
          tracks: [
            {
              id: "t1",
              target: "hero-title",
              easing: "linear",
              props: { opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] },
            },
          ],
        },
      ],
      ...overrides,
    };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing when config.enabled is false (attach is a no-op)", () => {
    const runtime = new ExperienceRuntime(config({ enabled: false }));
    const sceneEl = document.createElement("section");
    document.body.appendChild(sceneEl);
    runtime.registerScene("s1", sceneEl);

    const scrollRoot = new WindowScrollRoot();
    const subscribeSpy = vi.spyOn(scrollRoot, "subscribe");
    runtime.attach(scrollRoot);
    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it("writes --exp-opacity onto a registered target after a scroll update, when enabled", async () => {
    const runtime = new ExperienceRuntime(config({ enabled: true }));
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    const titleEl = document.createElement("h1");
    document.body.appendChild(titleEl);

    runtime.registerScene("s1", sceneEl);
    runtime.targets.register("hero-title", titleEl);
    runtime.attach(new WindowScrollRoot());

    // attach() already does an initial requestUpdate -> rAF scheduled; flush it
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(titleEl.style.getPropertyValue("--exp-opacity")).toBe("0.5");
    runtime.detach();
  });

  it('settings.performance="lite" skips writing expensive properties (blur, clip) but still writes cheap ones (opacity, color) -- §19 DoD "מובייל מבוקר במכוון, לא רק scaled-down"', async () => {
    // Milestone E3: clip קיבל את אותו performanceClass:"expensive" כמו blur
    // כבר ב-Milestone B (lib/experience.ts PROPERTY_METADATA) -- כאן ההוכחה
    // בפועל שהמנגנון הגנרי ב-runtime (לא רק בדיקת blur ספציפית) באמת מדלג
    // עליו תחת "lite", ושה-color (cheap, אינטרפולציית mixHex בלבד -- אין
    // clip/blur GPU raster) נשאר פעיל לצידו.
    const runtime = new ExperienceRuntime(
      config({
        enabled: true,
        settings: { ...emptyExperience().settings, performance: "lite" },
        scenes: [
          {
            id: "s1",
            name: "Scene",
            composition: "flow",
            pinned: false,
            durationVh: 200,
            layers: [],
            tracks: [
              {
                id: "t1",
                target: "hero-title",
                easing: "linear",
                props: {
                  opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }],
                  blur: [{ at: 0, value: 0 }, { at: 1, value: 20 }],
                  clip: [{ at: 0, value: 0 }, { at: 1, value: 1 }],
                  color: [{ at: 0, value: "#000000" }, { at: 1, value: "#FFFFFF" }],
                },
              },
            ],
          },
        ],
      })
    );
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    const titleEl = document.createElement("h1");
    document.body.appendChild(titleEl);

    runtime.registerScene("s1", sceneEl);
    runtime.targets.register("hero-title", titleEl);
    runtime.attach(new WindowScrollRoot());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(titleEl.style.getPropertyValue("--exp-opacity")).toBe("0.5"); // cheap -- still written
    expect(titleEl.style.getPropertyValue("--exp-blur")).toBe(""); // expensive -- skipped under "lite"
    expect(titleEl.style.getPropertyValue("--exp-clip")).toBe(""); // expensive -- skipped under "lite"
    expect(titleEl.style.getPropertyValue("--exp-color")).not.toBe(""); // cheap -- still written
    runtime.detach();
  });

  it('settings.performance="auto"/"high" still write expensive properties like blur', async () => {
    const runtime = new ExperienceRuntime(
      config({
        enabled: true,
        scenes: [
          {
            id: "s1",
            name: "Scene",
            composition: "flow",
            pinned: false,
            durationVh: 200,
            layers: [],
            tracks: [{ id: "t1", target: "hero-title", easing: "linear", props: { blur: [{ at: 0, value: 0 }, { at: 1, value: 20 }] } }],
          },
        ],
      })
    );
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    const titleEl = document.createElement("h1");
    document.body.appendChild(titleEl);

    runtime.registerScene("s1", sceneEl);
    runtime.targets.register("hero-title", titleEl);
    runtime.attach(new WindowScrollRoot());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(titleEl.style.getPropertyValue("--exp-blur")).toBe("10px");
    runtime.detach();
  });

  it("skips a track whose target was never registered, without throwing", async () => {
    const runtime = new ExperienceRuntime(config({ enabled: true }));
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    runtime.registerScene("s1", sceneEl);
    // deliberately never registering "hero-title"
    runtime.attach(new WindowScrollRoot());
    expect(() => runtime.forceUpdate()).not.toThrow();
    runtime.detach();
  });

  it("detach() fully unsubscribes and cancels a pending rAF, and is idempotent", () => {
    const runtime = new ExperienceRuntime(config({ enabled: true }));
    const scrollRoot = new WindowScrollRoot();
    const unsub = vi.fn();
    vi.spyOn(scrollRoot, "subscribe").mockReturnValue(unsub);

    runtime.attach(scrollRoot);
    runtime.detach();
    expect(unsub).toHaveBeenCalledTimes(1);
    expect(() => runtime.detach()).not.toThrow(); // idempotent
  });

  it("uses the ElementScrollRoot's own container, not window, when attached to one", async () => {
    const container = document.createElement("main");
    Object.defineProperty(container, "scrollTop", { value: 0, writable: true });
    Object.defineProperty(container, "clientHeight", { value: 500, writable: true });
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    document.body.appendChild(container);

    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -100, height: 1000 } as DOMRect);
    container.appendChild(sceneEl);

    const runtime = new ExperienceRuntime(config({ enabled: true }));
    runtime.registerScene("s1", sceneEl);
    runtime.attach(new ElementScrollRoot(container));
    await new Promise((resolve) => setTimeout(resolve, 30));

    const measurement = runtime.getSceneMeasurement("s1");
    // total = 1000 - 500 = 500; top=-100 -> progress = 100/500 = 0.2
    expect(measurement?.progress).toBeCloseTo(0.2, 5);
    runtime.detach();
  });

  it("unregisterScene stops it from being measured on subsequent updates", async () => {
    const runtime = new ExperienceRuntime(config({ enabled: true }));
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    runtime.registerScene("s1", sceneEl);
    runtime.attach(new WindowScrollRoot());
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(runtime.getSceneMeasurement("s1")).toBeDefined();

    runtime.unregisterScene("s1");
    expect(runtime.getSceneMeasurement("s1")).toBeUndefined();
    expect(runtime.activeSceneCount).toBe(0);
    runtime.detach();
  });
});

describe("ExperienceRuntime — scrollToProgress (Phase 7 Timeline scrubber)", () => {
  function config(overrides: Partial<ExperienceConfig> = {}): ExperienceConfig {
    return {
      ...emptyExperience(),
      scenes: [
        { id: "s1", name: "Scene", composition: "stage", pinned: true, durationVh: 200, layers: [], tracks: [] },
      ],
      ...overrides,
    };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolling to a requested progress round-trips through measureScene (total > 0 branch)", async () => {
    const container = document.createElement("main");
    let scrollTop = 0;
    Object.defineProperty(container, "scrollTop", {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
    });
    Object.defineProperty(container, "clientHeight", { value: 800, configurable: true });
    vi.spyOn(container, "getBoundingClientRect").mockImplementation(() => ({ top: 0 }) as DOMRect);
    document.body.appendChild(container);

    // height 1600, viewport 800 -> total=800. rect.top tracks (containerTop=0) minus scrollTop.
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockImplementation(
      () => ({ top: 800 - scrollTop, height: 1600 }) as DOMRect
    );
    container.appendChild(sceneEl);

    const runtime = new ExperienceRuntime(config({ enabled: true }));
    runtime.registerScene("s1", sceneEl);
    const scrollRoot = new ElementScrollRoot(container);
    runtime.attach(scrollRoot);
    await new Promise((resolve) => setTimeout(resolve, 30));

    runtime.scrollToProgress("s1", 0.5);
    runtime.forceUpdate();
    const measurement = runtime.getSceneMeasurement("s1");
    expect(measurement?.progress).toBeCloseTo(0.5, 5);
    runtime.detach();
  });

  it("clamps requested progress to [0,1] before computing the scroll target", async () => {
    const container = document.createElement("main");
    let scrollTop = 0;
    Object.defineProperty(container, "scrollTop", {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = Math.max(0, v);
      },
    });
    Object.defineProperty(container, "clientHeight", { value: 800, configurable: true });
    vi.spyOn(container, "getBoundingClientRect").mockImplementation(() => ({ top: 0 }) as DOMRect);
    document.body.appendChild(container);

    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockImplementation(
      () => ({ top: 800 - scrollTop, height: 1600 }) as DOMRect
    );
    container.appendChild(sceneEl);

    const runtime = new ExperienceRuntime(config({ enabled: true }));
    runtime.registerScene("s1", sceneEl);
    const scrollRoot = new ElementScrollRoot(container);
    runtime.attach(scrollRoot);
    await new Promise((resolve) => setTimeout(resolve, 30));

    runtime.scrollToProgress("s1", 5); // way out of range
    runtime.forceUpdate();
    expect(runtime.getSceneMeasurement("s1")?.progress).toBeCloseTo(1, 5);
    runtime.detach();
  });

  it("is a safe no-op for an unregistered scene id or before attach()", () => {
    const runtime = new ExperienceRuntime(config({ enabled: true }));
    expect(() => runtime.scrollToProgress("missing", 0.5)).not.toThrow();
    runtime.attach(new WindowScrollRoot());
    expect(() => runtime.scrollToProgress("missing", 0.5)).not.toThrow();
    runtime.detach();
  });
});

/**
 * Milestone B2 (docs/scroll-experience-rebuild-audit.md §2.2): 5 מצבים
 * אמיתיים. הסף (SCENE_LIFECYCLE_ENTER/LEAVE_FRACTION, lib/experience.ts)
 * הוא 0.15 משני הצדדים.
 */
describe("sceneLifecycleState — full 5-state lifecycle", () => {
  it.each([
    [-0.1, "before"],
    [0, "entering"],
    [0.1, "entering"],
    [0.14, "entering"],
    [0.15, "active"],
    [0.5, "active"],
    [0.85, "active"],
    [0.86, "leaving"],
    [0.99, "leaving"],
    [1, "leaving"],
    [1.01, "after"],
  ] as const)("sceneLifecycleState(%s) === %s", (raw, expected) => {
    expect(sceneLifecycleState(raw)).toBe(expected);
  });
});

describe("ExperienceRuntime — globalProgress + data-scene-lifecycle (Milestone B2)", () => {
  function twoSceneConfig(): ExperienceConfig {
    return {
      ...emptyExperience(),
      enabled: true,
      scenes: [
        { id: "s1", name: "Scene 1", composition: "flow", pinned: false, durationVh: 200, layers: [], tracks: [] },
        { id: "s2", name: "Scene 2", composition: "flow", pinned: false, durationVh: 200, layers: [], tracks: [] },
      ],
    };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("writes data-scene-lifecycle on the scene element, matching measureScene's state", async () => {
    const runtime = new ExperienceRuntime({ ...emptyExperience(), enabled: true, scenes: [{ id: "s1", name: "S", composition: "flow", pinned: false, durationVh: 200, layers: [], tracks: [] }] });
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    runtime.registerScene("s1", sceneEl);
    runtime.attach(new WindowScrollRoot());
    await new Promise((resolve) => setTimeout(resolve, 30));

    // top=-400, total=800 -> rawProgress=0.5 -> active
    expect(sceneEl.getAttribute("data-scene-lifecycle")).toBe("active");
    runtime.detach();
  });

  it("computes globalProgress across two scenes and writes --exp-global-progress on the root element", async () => {
    const runtime = new ExperienceRuntime(twoSceneConfig());
    const root = document.createElement("div");
    document.body.appendChild(root);
    runtime.setRootElement(root);

    // scene 1: absolute [0, 1600); scene 2: absolute [1600, 3200) -- combined span
    // 3200, viewport 800 -> totalSpan = 3200-0-800 = 2400. scrollPosition=1200 (25% through
    // the combined 2400 range from top=0) -> globalProgress = 1200/2400 = 0.5
    const scene1 = document.createElement("section");
    const scene2 = document.createElement("section");
    document.body.appendChild(scene1);
    document.body.appendChild(scene2);

    const scrollY = 1200;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    vi.spyOn(scene1, "getBoundingClientRect").mockImplementation(() => ({ top: 0 - scrollY, height: 1600 }) as DOMRect);
    vi.spyOn(scene2, "getBoundingClientRect").mockImplementation(() => ({ top: 1600 - scrollY, height: 1600 }) as DOMRect);

    runtime.registerScene("s1", scene1);
    runtime.registerScene("s2", scene2);
    runtime.attach(new WindowScrollRoot());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(runtime.globalProgress).toBeCloseTo(0.5, 5);
    expect(root.style.getPropertyValue("--exp-global-progress")).toBe(String(runtime.globalProgress));
    runtime.detach();
  });

  it("globalProgress is 0 when no scenes are registered (no rootElement writes, no crash)", () => {
    const runtime = new ExperienceRuntime(twoSceneConfig());
    const root = document.createElement("div");
    runtime.setRootElement(root);
    expect(() => runtime.forceUpdate()).not.toThrow();
    expect(runtime.globalProgress).toBe(0);
  });
});

/** Milestone B1/B4 — clip/color end-to-end דרך ה-runtime (לא רק evaluateTrack הטהור) */
describe("ExperienceRuntime — clip/color tracks write to their own CSS vars", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function config(overrides: Partial<ExperienceConfig> = {}): ExperienceConfig {
    return {
      ...emptyExperience(),
      enabled: true,
      scenes: [
        { id: "s1", name: "Scene", composition: "flow", pinned: false, durationVh: 200, layers: [], tracks: [] },
      ],
      ...overrides,
    };
  }

  it("writes --exp-clip as a plain number and --exp-color as a hex string", async () => {
    const runtime = new ExperienceRuntime(
      config({
        scenes: [
          {
            id: "s1",
            name: "Scene",
            composition: "flow",
            pinned: false,
            durationVh: 200,
            layers: [],
            tracks: [
              {
                id: "t1",
                target: "hero-title",
                easing: "linear",
                props: {
                  clip: [{ at: 0, value: 0 }, { at: 1, value: 1 }],
                  color: [{ at: 0, value: "#000000" }, { at: 1, value: "#FFFFFF" }],
                },
              },
            ],
          },
        ],
      })
    );
    const sceneEl = document.createElement("section");
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    document.body.appendChild(sceneEl);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    const titleEl = document.createElement("h1");
    document.body.appendChild(titleEl);

    runtime.registerScene("s1", sceneEl);
    runtime.targets.register("hero-title", titleEl);
    runtime.attach(new WindowScrollRoot());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(titleEl.style.getPropertyValue("--exp-clip")).toBe("0.5");
    expect(titleEl.style.getPropertyValue("--exp-color")).toBe("#808080");
    runtime.detach();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { ExperienceProvider, useExperienceRuntime } from "@/components/experience/experience-provider";
import { ExperienceTarget } from "@/components/experience/experience-target";
import { emptyExperience } from "@/lib/experience";

/**
 * Phase 2 — ExperienceProvider + ExperienceTarget integration
 * (docs/experience-audit.md §4.5, §7.1). Confirms the child-before-parent
 * mount-ordering design actually works: a target registers itself
 * successfully on the very first mount pass, and reduced-motion / disabled
 * Experience never starts the runtime loop at all.
 */
function Probe() {
  const runtime = useExperienceRuntime();
  return <span data-testid="has-runtime">{String(runtime !== null)}</span>;
}

describe("ExperienceProvider", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("provides a non-null runtime to children on the very first render (no mount-order race)", () => {
    const { getByTestId } = render(
      <ExperienceProvider config={emptyExperience()}>
        <Probe />
      </ExperienceProvider>
    );
    expect(getByTestId("has-runtime").textContent).toBe("true");
  });

  it("still provides a runtime instance when config is undefined (no Experience on this page)", () => {
    const { getByTestId } = render(
      <ExperienceProvider config={undefined}>
        <Probe />
      </ExperienceProvider>
    );
    expect(getByTestId("has-runtime").textContent).toBe("true");
  });

  it("a target nested inside registers without throwing, and unregisters cleanly on unmount", () => {
    const config = { ...emptyExperience(), enabled: true };
    const { unmount } = render(
      <ExperienceProvider config={config}>
        <ExperienceTarget id="hero-title">
          <h1>כותרת</h1>
        </ExperienceTarget>
      </ExperienceProvider>
    );
    expect(() => unmount()).not.toThrow();
  });

  it("does not attach a scroll listener when Experience is disabled", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    render(
      <ExperienceProvider config={{ ...emptyExperience(), enabled: false }}>
        <div>content</div>
      </ExperienceProvider>
    );
    expect(addSpy).not.toHaveBeenCalledWith("scroll", expect.any(Function), expect.anything());
  });

  it("does not attach a scroll listener under reduced motion, even when enabled", () => {
    class FakeMQL extends EventTarget {
      matches = false; // no-preference doesn't match -> reduced
    }
    vi.spyOn(window, "matchMedia").mockReturnValue(new FakeMQL() as unknown as MediaQueryList);
    const addSpy = vi.spyOn(window, "addEventListener");

    render(
      <ExperienceProvider config={{ ...emptyExperience(), enabled: true }}>
        <div>content</div>
      </ExperienceProvider>
    );
    expect(addSpy).not.toHaveBeenCalledWith("scroll", expect.any(Function), expect.anything());
  });

  it("attaches a scroll listener when enabled and motion is not reduced", () => {
    class FakeMQL extends EventTarget {
      matches = true; // no-preference matches -> not reduced
    }
    vi.spyOn(window, "matchMedia").mockReturnValue(new FakeMQL() as unknown as MediaQueryList);
    const addSpy = vi.spyOn(window, "addEventListener");

    render(
      <ExperienceProvider config={{ ...emptyExperience(), enabled: true }}>
        <div>content</div>
      </ExperienceProvider>
    );
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
  });

  /**
   * Milestone H (ביקורת מבקר-אדברסריאלי, ממצא #5): runtime.updateMode
   * כבר רץ סינכרונית בגוף ה-render, *לפני* שה-attach effect בכלל
   * מופעל -- אז resolvedMode לא צריך (ולא אמור) להיות ברשימת התלויות
   * של אותו effect. לפני התיקון, מעבר breakpoint (mode prop משתנה) היה
   * מפרק ומחבר מחדש את כל מאזין הגלילה בלי שום תועלת מתאמת. הבדיקה
   * הזו הייתה נכשלת לפני התיקון (detach+attach שני היה קורה).
   */
  it("does not tear down and re-attach the scroll listener when only `mode` changes (Milestone H fix)", () => {
    class FakeMQL extends EventTarget {
      matches = true;
    }
    vi.spyOn(window, "matchMedia").mockReturnValue(new FakeMQL() as unknown as MediaQueryList);
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const config = { ...emptyExperience(), enabled: true };

    const { rerender } = render(
      <ExperienceProvider config={config} mode="base">
        <div>content</div>
      </ExperienceProvider>
    );
    const scrollAttachesBefore = addSpy.mock.calls.filter((c) => c[0] === "scroll").length;
    expect(scrollAttachesBefore).toBe(1);

    rerender(
      <ExperienceProvider config={config} mode="tablet">
        <div>content</div>
      </ExperienceProvider>
    );

    const scrollAttachesAfter = addSpy.mock.calls.filter((c) => c[0] === "scroll").length;
    const scrollDetaches = removeSpy.mock.calls.filter((c) => c[0] === "scroll").length;
    expect(scrollAttachesAfter).toBe(1); // no second attach
    expect(scrollDetaches).toBe(0); // no detach at all -- the mode change alone must not touch the listener
  });

  it("survives a full remount (studio replayKey pattern) without leaking or throwing", () => {
    class FakeMQL extends EventTarget {
      matches = true;
    }
    vi.spyOn(window, "matchMedia").mockReturnValue(new FakeMQL() as unknown as MediaQueryList);
    const config = { ...emptyExperience(), enabled: true };

    const { rerender } = render(
      <ExperienceProvider key="a" config={config}>
        <ExperienceTarget id="hero-title">
          <h1>כותרת</h1>
        </ExperienceTarget>
      </ExperienceProvider>
    );
    // שינוי ה-key בלבד -- בדיוק כמו replayKey בסטודיו -- גורם ל-React
    // לבטל mount לעץ הישן ולעשות mount חדש לגמרי, בלי unmount() ידני
    // (שהיה מבטל את ה-root של RTL עצמו, לא רק את התת-עץ)
    expect(() =>
      rerender(
        <ExperienceProvider key="b" config={config}>
          <ExperienceTarget id="hero-title">
            <h1>כותרת</h1>
          </ExperienceTarget>
        </ExperienceProvider>
      )
    ).not.toThrow();
  });
});

describe("ExperienceTarget — safe with no provider above it", () => {
  it("renders its children normally when there is no ExperienceProvider ancestor at all", () => {
    const { getByText } = render(
      <ExperienceTarget id="hero-title">
        <h1>כותרת</h1>
      </ExperienceTarget>
    );
    expect(getByText("כותרת")).toBeInTheDocument();
  });

  it("renders the exp-motion class and data-experience-target/data-scrub attributes", () => {
    const { container } = render(
      <ExperienceTarget id="hero-title">
        <span>x</span>
      </ExperienceTarget>
    );
    const wrapper = container.querySelector('[data-experience-target="hero-title"]');
    expect(wrapper).toBeTruthy();
    expect(wrapper).toHaveClass("exp-motion");
    expect(wrapper).toHaveAttribute("data-scrub");
  });

  it("supports the polymorphic 'as' prop for minimal layout disruption", () => {
    const { container } = render(
      <ExperienceTarget id="word-1" as="span">
        text
      </ExperienceTarget>
    );
    expect(container.querySelector("span[data-experience-target]")).toBeTruthy();
    expect(container.querySelector("div[data-experience-target]")).toBeNull();
  });
});

describe("ExperienceProvider + ExperienceTarget — end-to-end progress write", () => {
  it("actually writes --exp-opacity to a registered target as the runtime updates", async () => {
    class FakeMQL extends EventTarget {
      matches = true;
    }
    vi.spyOn(window, "matchMedia").mockReturnValue(new FakeMQL() as unknown as MediaQueryList);

    const config = {
      ...emptyExperience(),
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "Scene",
          composition: "flow" as const,
          pinned: false,
          durationVh: 200,
          layers: [],
          tracks: [
            {
              id: "t1",
              target: "hero-title",
              easing: "linear" as const,
              props: { opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] },
            },
          ],
        },
      ],
    };

    function Scene() {
      const runtime = useExperienceRuntime();
      return (
        <section
          ref={(el) => {
            if (el && runtime) runtime.registerScene("s1", el);
          }}
        >
          <ExperienceTarget id="hero-title" as="h1">
            כותרת
          </ExperienceTarget>
        </section>
      );
    }

    const { container } = render(
      <ExperienceProvider config={config}>
        <Scene />
      </ExperienceProvider>
    );

    const sceneEl = container.querySelector("section") as HTMLElement;
    vi.spyOn(sceneEl, "getBoundingClientRect").mockReturnValue({ top: -400, height: 1600 } as DOMRect);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    const target = container.querySelector('[data-experience-target="hero-title"]') as HTMLElement;
    expect(target.style.getPropertyValue("--exp-opacity")).toBe("0.5");
  });
});

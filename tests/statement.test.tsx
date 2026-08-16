import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { Statement } from "@/components/blocks/statement";

/**
 * Phase 0.5 — עקביות מאזין reduced-motion (docs/experience-audit.md
 * נספח ד'.5, G9) על הצרכן השני שנגע בו: Statement.
 */
class FakeMediaQueryList extends EventTarget {
  matches: boolean;
  constructor(matches: boolean) {
    super();
    this.matches = matches;
  }
  set(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event("change"));
  }
}

describe("Statement — reduced-motion reactivity", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sets --progress to 1 immediately and skips scroll listeners under reduced motion", () => {
    const mql = new FakeMediaQueryList(false); // no-preference doesn't match -> reduced
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    const addSpy = vi.spyOn(window, "addEventListener");

    const { container } = render(<Statement content={{ text: "שלום עולם" }} />);
    const section = container.querySelector("section") as HTMLElement;
    expect(section.style.getPropertyValue("--progress")).toBe("1");
    expect(addSpy).not.toHaveBeenCalledWith("scroll", expect.any(Function), expect.anything());
  });

  it("attaches a scroll listener when motion is not reduced, and detaches it on unmount", () => {
    const mql = new FakeMediaQueryList(true); // no-preference matches -> not reduced
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<Statement content={{ text: "שלום עולם" }} />);
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("switches to the reduced-motion branch live when the OS preference changes mid-session", () => {
    const mql = new FakeMediaQueryList(true); // starts: not reduced
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { container } = render(<Statement content={{ text: "שלום עולם" }} />);
    const section = container.querySelector("section") as HTMLElement;

    act(() => {
      mql.set(false); // reduced motion turns on mid-session
    });

    // האפקט הקודם חייב היה להתנקות (הסרת מאזיני scroll/resize הישנים)
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(section.style.getPropertyValue("--progress")).toBe("1");
  });
});

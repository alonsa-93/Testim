import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useReducedMotion } from "@/components/fx/use-reduced-motion";

/**
 * Phase 0.5 — עקביות מאזין reduced-motion (docs/experience-audit.md
 * נספח ד'.5, G9). התיקון המרכזי: לא רק קריאה חד-פעמית ב-mount, אלא
 * מאזין ל-"change" אמיתי — כאן מדומה עם MediaQueryList מבוקר ידנית.
 */
function Probe() {
  const reduced = useReducedMotion();
  return <span data-testid="value">{String(reduced)}</span>;
}

class FakeMediaQueryList extends EventTarget {
  matches: boolean;
  constructor(matches: boolean) {
    super();
    this.matches = matches;
  }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    super.addEventListener(type, listener);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    super.removeEventListener(type, listener);
  }
  set(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event("change"));
  }
}

describe("useReducedMotion", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("reflects reduced=false synchronously on first render when the OS has no preference", () => {
    const mql = new FakeMediaQueryList(true); // "no-preference" matches -> user is fine with motion
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("false");
  });

  it("reflects reduced=true synchronously on first render when the OS prefers reduced motion", () => {
    const mql = new FakeMediaQueryList(false); // "no-preference" does NOT match -> reduce is preferred
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("true");
  });

  it("updates live when the OS-level preference changes mid-session (the actual fix)", () => {
    const mql = new FakeMediaQueryList(true); // no-preference matches -> starts not reduced
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("false");

    act(() => {
      mql.set(false); // no-preference stops matching -> user turned reduced-motion on
    });
    expect(screen.getByTestId("value").textContent).toBe("true");
  });

  it("removes the change listener on unmount", () => {
    const mql = new FakeMediaQueryList(true);
    const removeSpy = vi.spyOn(mql, "removeEventListener");
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
    const { unmount } = render(<Probe />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("change", expect.any(Function));
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { CountUp } from "@/components/fx/count-up";

/**
 * Phase 0.5 — תיקון דליפת rAF ב-CountUp (docs/experience-audit.md
 * נספח ד'.1). לפני התיקון: unmount באמצע ספירה השאיר לולאת rAF פעילה
 * שממשיכה לקרוא setDisplay על רכיב שכבר לא קיים.
 */

class ControllableIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  static lastCallback: IntersectionObserverCallback | null = null;
  static disconnectSpy = vi.fn();
  constructor(cb: IntersectionObserverCallback) {
    ControllableIntersectionObserver.lastCallback = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {
    ControllableIntersectionObserver.disconnectSpy();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

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

describe("CountUp", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    ControllableIntersectionObserver.lastCallback = null;
    ControllableIntersectionObserver.disconnectSpy.mockClear();
  });

  it("cancels the in-flight rAF tween on unmount instead of leaking it", () => {
    vi.stubGlobal("IntersectionObserver", ControllableIntersectionObserver);
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(<CountUp value="+600" />);
    expect(ControllableIntersectionObserver.lastCallback).toBeTruthy();

    // מדמה כניסה לתצוגה — מפעיל את לולאת ה-tick (מתזמן rAF ראשון)
    act(() => {
      ControllableIntersectionObserver.lastCallback!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    // ה-tween עדיין "באוויר" — יש handle פעיל, וה-unmount חייב לבטל אותו
    unmount();
    expect(cafSpy).toHaveBeenCalled();
  });

  it("does not throw or warn about state updates after unmount", async () => {
    vi.stubGlobal("IntersectionObserver", ControllableIntersectionObserver);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<CountUp value="+600" />);
    act(() => {
      ControllableIntersectionObserver.lastCallback!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    unmount();

    // אם ה-rAF לא היה מבוטל, ה-tick הבא (כ-16ms) היה קורא ל-setDisplay
    // על רכיב לא-מחובר ומדפיס אזהרת React ל-console.error
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("tears the observer down when reduced-motion turns on mid-session", () => {
    vi.stubGlobal("IntersectionObserver", ControllableIntersectionObserver);
    const mql = new FakeMediaQueryList(true); // no-preference matches -> not reduced
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

    render(<CountUp value="+600" />);
    act(() => {
      mql.set(false); // no-preference stops matching -> reduced motion now on
    });
    expect(ControllableIntersectionObserver.disconnectSpy).toHaveBeenCalled();
  });
});

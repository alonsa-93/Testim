import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useResponsiveMode } from "@/components/experience/use-responsive-mode";

/**
 * Milestone E1 (docs/rebuild-workplan.md אבן דרך E) — זיהוי mode אמיתי
 * לפי matchMedia, אותו דפוס בדיוק כמו tests/use-reduced-motion.test.tsx
 * (FakeMediaQueryList מבוקר ידנית). כאן יש שתי שאילתות (mobile/tablet)
 * במקום אחת, אז ה-mock ממופה query -> instance.
 */
function Probe() {
  const mode = useResponsiveMode();
  return <span data-testid="value">{mode}</span>;
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

function mockViewport(mobileMatches: boolean, tabletMatches: boolean) {
  const mobile = new FakeMediaQueryList(mobileMatches);
  const tablet = new FakeMediaQueryList(tabletMatches);
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) => (query.includes("640") ? mobile : tablet) as unknown as MediaQueryList
  );
  return { mobile, tablet };
}

describe("useResponsiveMode", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("resolves to base when neither the mobile nor tablet query matches", () => {
    mockViewport(false, false);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("base");
  });

  it("resolves to tablet when only the (wider) max-width:1024px query matches", () => {
    mockViewport(false, true);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("tablet");
  });

  it("resolves to mobile when the max-width:640px query matches (mobile implies tablet too, but mobile wins)", () => {
    mockViewport(true, true);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("mobile");
  });

  it("updates live when the viewport crosses a breakpoint mid-session (resize/orientation change)", () => {
    const { tablet } = mockViewport(false, false);
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("base");

    act(() => {
      tablet.set(true);
    });
    expect(screen.getByTestId("value").textContent).toBe("tablet");
  });

  it("removes both change listeners on unmount", () => {
    const { mobile, tablet } = mockViewport(false, false);
    const mobileSpy = vi.spyOn(mobile, "removeEventListener");
    const tabletSpy = vi.spyOn(tablet, "removeEventListener");
    const { unmount } = render(<Probe />);
    unmount();
    expect(mobileSpy).toHaveBeenCalledWith("change", expect.any(Function));
    expect(tabletSpy).toHaveBeenCalledWith("change", expect.any(Function));
  });
});

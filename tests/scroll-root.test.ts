import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ElementScrollRoot,
  WindowScrollRoot,
  createScrollRoot,
  findScrollRoot,
  measureRelativeToRoot,
} from "@/lib/scroll-root";

/**
 * חוזה ScrollRoot (Phase 0.5, docs/experience-audit.md §6 + §16.3).
 * אלה בדיוק הבדיקות שה-DoD (§19 "Runtime") דורש: Window, HTMLElement,
 * resize, cleanup.
 */
describe("WindowScrollRoot", () => {
  afterEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("getElement returns window", () => {
    expect(new WindowScrollRoot().getElement()).toBe(window);
  });

  it("getScrollPosition reflects window.scrollY", () => {
    Object.defineProperty(window, "scrollY", { value: 240, configurable: true });
    expect(new WindowScrollRoot().getScrollPosition()).toBe(240);
  });

  it("getViewportSize falls back to innerHeight when visualViewport is absent", () => {
    expect(new WindowScrollRoot().getViewportSize()).toBe(window.innerHeight);
  });

  it("subscribe fires the callback on scroll and resize, passively", () => {
    const root = new WindowScrollRoot();
    const cb = vi.fn();
    const addSpy = vi.spyOn(window, "addEventListener");
    root.subscribe(cb);

    expect(addSpy).toHaveBeenCalledWith("scroll", cb, { passive: true });
    expect(addSpy).toHaveBeenCalledWith("resize", cb, { passive: true });

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(cb).toHaveBeenCalledTimes(2);
    addSpy.mockRestore();
  });

  it("the returned unsubscribe function fully detaches both listeners", () => {
    const root = new WindowScrollRoot();
    const cb = vi.fn();
    const unsubscribe = root.subscribe(cb);
    unsubscribe();

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("ElementScrollRoot", () => {
  function makeContainer() {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollTop", { value: 0, writable: true });
    Object.defineProperty(el, "clientHeight", { value: 600, writable: true });
    document.body.appendChild(el);
    return el;
  }

  it("getElement returns the given container, not window", () => {
    const el = makeContainer();
    expect(new ElementScrollRoot(el).getElement()).toBe(el);
  });

  it("getScrollPosition/getViewportSize read from the container, not window", () => {
    const el = makeContainer();
    (el as unknown as { scrollTop: number }).scrollTop = 120;
    const root = new ElementScrollRoot(el);
    expect(root.getScrollPosition()).toBe(120);
    expect(root.getViewportSize()).toBe(600);
  });

  it("subscribe attaches a passive scroll listener and a ResizeObserver on the element", () => {
    const el = makeContainer();
    const addSpy = vi.spyOn(el, "addEventListener");
    const cb = vi.fn();
    new ElementScrollRoot(el).subscribe(cb);
    expect(addSpy).toHaveBeenCalledWith("scroll", cb, { passive: true });
  });

  it("fires the callback on a scroll event dispatched on the container itself, not window", () => {
    const el = makeContainer();
    const cb = vi.fn();
    new ElementScrollRoot(el).subscribe(cb);

    el.dispatchEvent(new Event("scroll"));
    expect(cb).toHaveBeenCalledTimes(1);

    // גלילה על window לא אמורה להפעיל את ה-callback הזה בכלל —
    // זה בדיוק ה-bug ש-R1 תיעד (§3.1 באודיט)
    window.dispatchEvent(new Event("scroll"));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe removes the scroll listener from the element", () => {
    const el = makeContainer();
    const cb = vi.fn();
    const unsubscribe = new ElementScrollRoot(el).subscribe(cb);
    unsubscribe();

    el.dispatchEvent(new Event("scroll"));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("createScrollRoot — factory", () => {
  it("returns a WindowScrollRoot when no container is given", () => {
    expect(createScrollRoot()).toBeInstanceOf(WindowScrollRoot);
    expect(createScrollRoot(null)).toBeInstanceOf(WindowScrollRoot);
  });

  it("returns an ElementScrollRoot when a container is given", () => {
    const el = document.createElement("div");
    expect(createScrollRoot(el)).toBeInstanceOf(ElementScrollRoot);
  });
});

describe("findScrollRoot — auto-detection (Phase 2)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns WindowScrollRoot when no scrolling ancestor exists", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(findScrollRoot(el)).toBeInstanceOf(WindowScrollRoot);
  });

  it("finds the nearest ancestor with overflow-y: auto", () => {
    const scrollContainer = document.createElement("main");
    scrollContainer.style.overflowY = "auto";
    const target = document.createElement("div");
    scrollContainer.appendChild(target);
    document.body.appendChild(scrollContainer);

    const root = findScrollRoot(target);
    expect(root).toBeInstanceOf(ElementScrollRoot);
    expect(root.getElement()).toBe(scrollContainer);
  });

  it("skips an overflow-hidden/clip ancestor and keeps walking up to the real scrollport (the exact R1 studio bug)", () => {
    const scrollport = document.createElement("main");
    scrollport.style.overflowY = "auto";
    const frameChrome = document.createElement("div");
    frameChrome.style.overflowY = "clip"; // the fake browser-chrome frame, post-fix
    const target = document.createElement("div");
    frameChrome.appendChild(target);
    scrollport.appendChild(frameChrome);
    document.body.appendChild(scrollport);

    const root = findScrollRoot(target);
    expect(root).toBeInstanceOf(ElementScrollRoot);
    expect(root.getElement()).toBe(scrollport); // not frameChrome
  });

  it("finds the nearest scroll container even through several non-scrolling ancestors", () => {
    const scrollport = document.createElement("main");
    scrollport.style.overflowY = "scroll";
    const a = document.createElement("div");
    const b = document.createElement("div");
    const target = document.createElement("span");
    b.appendChild(target);
    a.appendChild(b);
    scrollport.appendChild(a);
    document.body.appendChild(scrollport);

    expect(findScrollRoot(target).getElement()).toBe(scrollport);
  });
});

describe("measureRelativeToRoot", () => {
  it("for WindowScrollRoot, top is the element's raw viewport-relative position", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ top: 150 } as DOMRect);

    const result = measureRelativeToRoot(el, new WindowScrollRoot());
    expect(result.top).toBe(150);
    expect(result.viewportSize).toBe(window.innerHeight);
  });

  it("for ElementScrollRoot, top is relative to the container's own boundary, not the window's", () => {
    const container = document.createElement("main");
    document.body.appendChild(container);
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({ top: 80 } as DOMRect);
    Object.defineProperty(container, "clientHeight", { value: 500, configurable: true });

    const el = document.createElement("div");
    container.appendChild(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ top: 130 } as DOMRect);

    const result = measureRelativeToRoot(el, new ElementScrollRoot(container));
    expect(result.top).toBe(50); // 130 - 80: the container starts 80px into the window, e.g. past a sidebar
    expect(result.viewportSize).toBe(500);
  });
});

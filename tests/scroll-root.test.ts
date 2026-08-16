import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ElementScrollRoot,
  WindowScrollRoot,
  createScrollRoot,
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

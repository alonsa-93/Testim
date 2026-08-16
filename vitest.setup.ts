import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * ניקוי DOM אוטומטי אחרי כל בדיקה — בלי זה, render() מצטבר בין
 * מבחנים בתוך אותו קובץ (למשל שני "it" ששניהם קוראים render() על
 * PageRenderer) ומייצר כפילויות אמיתיות ב-DOM (getByRole נכשל עם
 * "multiple elements found" למרות שהבדיקה תקינה לוגית).
 */
afterEach(cleanup);

/**
 * jsdom לא מממש matchMedia / IntersectionObserver / ResizeObserver —
 * שלושתם בשימוש ישיר ברכיבי fx אמיתיים (Reveal, CountUp, Statement,
 * TiltCard) שנבדקים כאן דרך React Testing Library, לא רק מדומים.
 * הפוליפילים כאן הם המינימום הדרוש כדי שהרכיבים ירוצו בסביבת בדיקה
 * בלי לזרוק — לא מדמים התנהגות גלילה/צפייה אמיתית (זה תפקידם של
 * בדיקות ScrollRoot/runtime הייעודיות, Phase 0.5 ואילך).
 */

if (!window.matchMedia) {
  window.matchMedia = (query: string) => {
    const listeners = new Set<(e: MediaQueryListEvent) => void>();
    return {
      // ברירת מחדל "matches: true": מייצג את המקרה הנפוץ (אין העדפת
      // reduced-motion, יש יכולת hover/pointer) כדי שרכיבים שלא בודקי
      // matchMedia במפורש (רוב הבדיקות) יתנהגו כמו בדפדפן רגיל. בדיקות
      // שכן בודקות reduced-motion/hover-capability עצמן דורסות עם
      // vi.spyOn(window, "matchMedia") משלהן, מפורשות.
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.add(cb);
      },
      removeEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.delete(cb);
      },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
}

if (typeof window.IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  globalThis.IntersectionObserver = window.IntersectionObserver;
}

if (typeof window.ResizeObserver === "undefined") {
  class MockResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  globalThis.ResizeObserver = window.ResizeObserver;
}

/**
 * jsdom לא מממש requestAnimationFrame/cancelAnimationFrame בכלל
 * (בכוונה — זה דורש לולאת רינדור אמיתית). כמה רכיבי fx אמיתיים
 * (CountUp, Statement, TiltCard) קוראים להן ישירות, ולכן צריך פוליפיל
 * מבוסס setTimeout כדי שבדיקות שמפעילות בפועל את הלולאה (למשל בדיקת
 * ה-cleanup של CountUp, Phase 0.5) יוכלו לרוץ בלי ReferenceError.
 */
if (!window.requestAnimationFrame) {
  let handle = 0;
  const pending = new Map<number, ReturnType<typeof setTimeout>>();
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = ++handle;
    const timeout = setTimeout(() => {
      pending.delete(id);
      callback(performance.now());
    }, 16);
    pending.set(id, timeout);
    return id;
  };
  window.cancelAnimationFrame = (id: number) => {
    const timeout = pending.get(id);
    if (timeout !== undefined) clearTimeout(timeout);
    pending.delete(id);
  };
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
}

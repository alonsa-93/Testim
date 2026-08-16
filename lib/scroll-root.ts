/**
 * הפשטת Scroll Root (Phase 0.5 — Motion Foundation).
 * ראו docs/experience-audit.md §6: זו התשתית שהExperience Engine
 * (ומכל דבר עתידי שצריך למדוד גלילה/viewport) חייב לעבור דרכה —
 * אסור לשום קוד גלילה עתידי לגעת ב-window/element ישירות.
 *
 * הסיבה שזה קיים: R1 באודיט (אומת אמפירית) — בדף ציבורי ה-scroll root
 * האמיתי הוא window, אבל בתוך הסטודיו התצוגה החיה יושבת בתוך
 * <main className="overflow-auto"> נפרד. קוד שכתוב מול window בלבד
 * (כמו components/blocks/statement.tsx היום) פשוט לא עובד שם.
 *
 * שני מימושים, אותו חוזה — כדי שה-runtime העתידי (Phase 2) יוכל
 * להשתמש באותו קוד בדיוק בשני ההקשרים, בלי ענף "אם זה סטודיו".
 */

export interface ScrollRoot {
  /** אלמנט הגלילה בפועל — window לדף ציבורי, HTMLElement לקונטיינר גולל */
  getElement(): Window | HTMLElement;
  /** מיקום הגלילה הנוכחי בפיקסלים, בכיוון הגלילה הראשי (אנכי) */
  getScrollPosition(): number;
  /** גובה התצוגה של השורש הזה בפיקסלים — לא window.innerHeight גורף */
  getViewportSize(): number;
  /**
   * נרשם לשינויי גלילה/גודל כאירוע מאוחד אחד (לא צריך להבדיל בין
   * scroll ל-resize מנקודת מבט הצרכן — שניהם "משהו שדורש מדידה מחדש").
   * מחזיר פונקציית ביטול הרשמה.
   */
  subscribe(callback: () => void): () => void;
}

/**
 * הגלילה של הדף עצמו. זה ברירת המחדל לכל דף ציבורי — אין שם קונטיינר
 * גולל נפרד, ה-window עצמו הוא ה-scroll root, בדיוק כמו שstatement.tsx
 * הקיים כבר מניח (ראו §1.4 באודיט).
 */
export class WindowScrollRoot implements ScrollRoot {
  getElement(): Window {
    return window;
  }

  getScrollPosition(): number {
    return window.scrollY;
  }

  getViewportSize(): number {
    // visualViewport.height מגיב לזום/מקלדת וירטואלית במובייל בצורה
    // מדויקת יותר מ-innerHeight; fallback ל-innerHeight כשלא זמין
    // (סביבות בדיקה, דפדפנים ישנים).
    return window.visualViewport?.height ?? window.innerHeight;
  }

  subscribe(callback: () => void): () => void {
    const options: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", callback, options);
    window.addEventListener("resize", callback, options);
    return () => {
      window.removeEventListener("scroll", callback, options);
      window.removeEventListener("resize", callback, options);
    };
  }
}

/**
 * גלילה בתוך קונטיינר — זה מה שהסטודיו צריך. ה-caller אחראי להעביר
 * את קונטיינר הגלילה *האמיתי* (ה-<main overflow-auto>, לא מסגרת
 * הדפדפן המדומה עם overflow-hidden שסביבו — ראו R1 §3.1 באודיט;
 * חיווט מעשי לזה בסטודיו עצמו הוא Phase 2, לא כאן).
 */
export class ElementScrollRoot implements ScrollRoot {
  constructor(private readonly el: HTMLElement) {}

  getElement(): HTMLElement {
    return this.el;
  }

  getScrollPosition(): number {
    return this.el.scrollTop;
  }

  getViewportSize(): number {
    return this.el.clientHeight;
  }

  subscribe(callback: () => void): () => void {
    const options: AddEventListenerOptions = { passive: true };
    this.el.addEventListener("scroll", callback, options);
    const ro = new ResizeObserver(callback);
    ro.observe(this.el);
    return () => {
      this.el.removeEventListener("scroll", callback, options);
      ro.disconnect();
    };
  }
}

/**
 * בוחר את מימוש ה-ScrollRoot הנכון: אם מועבר קונטיינר — ElementScrollRoot
 * (הקשר סטודיו); אחרת WindowScrollRoot (דף ציבורי). זו נקודת הכניסה
 * היחידה שקוד צרכן (Phase 2 ואילך) אמור לקרוא לה — לא לבנות
 * new WindowScrollRoot()/new ElementScrollRoot() ידנית בכל מקום.
 */
export function createScrollRoot(container?: HTMLElement | null): ScrollRoot {
  return container ? new ElementScrollRoot(container) : new WindowScrollRoot();
}

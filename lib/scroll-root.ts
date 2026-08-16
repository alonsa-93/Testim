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

/**
 * מוצא את ה-ScrollRoot הנכון אוטומטית, על ידי טיפוס מ-el כלפי מעלה
 * וחיפוש האב הקרוב ביותר עם overflow-y: auto|scroll בפועל (Phase 2).
 * זה בדיוק אותו אלגוריתם ש-`position: sticky` עצמו משתמש בו כדי לקבוע
 * "מי אב הגלילה שלי" — כך שרכיב Experience-aware (Statement, ה-runtime)
 * תמיד מתאים את עצמו נכון גם בדף ציבורי (window) וגם בכל קונטיינר
 * מקונן עתידי (§6 באודיט: "Future: Arbitrary embedded scroll
 * containers"), בלי provider ייעודי לכל הקשר ובלי ענף "אם זה סטודיו".
 *
 * שים לב: `overflow: hidden`/`clip` **לא** נספרים כאן בכוונה — הם
 * לא תיבות גלילה אמיתיות (אין להן מנגנון גלילה), ולכן sticky ו-
 * findScrollRoot כאחד מדלגים מעליהן ומוצאים את אב הגלילה *האמיתי*
 * שמעליהן. זו הסיבה שהחלפת overflow-hidden ב-overflow-clip על מסגרת
 * הדפדפן המדומה בסטודיו (studio-app.tsx) פותרת גם את ה-CSS sticky
 * וגם משאירה את החישוב כאן נכון בלי טיפול מיוחד.
 */
export function findScrollRoot(el: HTMLElement | null): ScrollRoot {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return new ElementScrollRoot(node);
    }
    node = node.parentElement;
  }
  return new WindowScrollRoot();
}

/**
 * מודד רכיב יחסית ל-scroll root נתון: מחזיר rect.top יחסי לגבול
 * ה-viewport של ה-root (לא בהכרח לחלון!) וגובה ה-viewport של אותו
 * root. זו ההכללה של הנוסחה שstatement.tsx כתב במקור מול window
 * בלבד — עכשיו עובדת זהה עבור WindowScrollRoot ו-ElementScrollRoot,
 * כולל כש-ElementScrollRoot לא ממלא את כל חלון הדפדפן (מצב הסטודיו
 * בדיוק — יש סרגל צד, ה-<main> לא מתחיל ב-x=0/y=0 של החלון).
 */
export function measureRelativeToRoot(
  el: HTMLElement,
  root: ScrollRoot
): { top: number; height: number; viewportSize: number } {
  const elementRect = el.getBoundingClientRect();
  const rootEl = root.getElement();
  const containerTop = rootEl instanceof HTMLElement ? rootEl.getBoundingClientRect().top : 0;
  return {
    top: elementRect.top - containerTop,
    height: elementRect.height,
    viewportSize: root.getViewportSize(),
  };
}

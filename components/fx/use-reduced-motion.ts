"use client";

import { useSyncExternalStore } from "react";

/**
 * הוק משותף ל-prefers-reduced-motion, עם מאזין לשינוי אמיתי — לא רק
 * קריאה חד-פעמית ב-mount (Phase 0.5, docs/experience-audit.md נספח
 * ד'.5). עד כה statement.tsx ו-count-up.tsx כל אחד קרא ל-matchMedia
 * בעצמו פעם אחת בגוף ה-effect הראשי; משתמש שמשנה את ההעדפה במערכת
 * ההפעלה תוך כדי שהעמוד פתוח (או שינוי אמולציה ב-DevTools) לא היה
 * נצפה. ה-Experience runtime (מ-Phase 2 ואילך) צורך את ההוק הזה גם
 * הוא — כך שיש הגדרת reduced-motion אחת ויחידה לכל המערכת.
 *
 * מבוסס useSyncExternalStore ולא useState+useEffect עם lazy initializer
 * (Phase 9, תוקן אחרי באג אמפירי אמיתי): גרסה קודמת קראה את matchMedia
 * *סינכרונית* בתוך ה-lazy initializer של useState, כדי "לא להבזיק" רגע
 * אחד עם ברירת המחדל השגויה. זה נראה תקין ב-console.log, אבל כשה-SSR
 * מרנדר false (אין window) וה-hydration הראשון מחשב true (matchMedia
 * אמיתי), זהו hydration mismatch על ה-className/style שה-DOM לא תמיד
 * מתקן את עצמו ממנו — ואז ה-setReduced(true) הבא מתוך ה-effect הוא
 * no-op (הערך כבר true), אז אף render מתקן לא מתוזמן, וה-DOM נשאר
 * תקוע לצמיתות על ברירת המחדל של ה-SSR. אומת אמפירית ב-Playwright עם
 * page.emulateMedia({reducedMotion:'reduce'}): sticky/min-height
 * נשארו דבוקים ב-DOM על אף שה-state הפנימי חישב isPinned=false נכון.
 * (Statement לא נפגע מהבאג הזה כי הוא כותב --progress ישירות דרך
 * el.style.setProperty בתוך effect אימפרטיבי, לא דרך className מוצהר
 * -- כתיבה אימפרטיבית לא כפופה ל-hydration diffing.)
 *
 * useSyncExternalStore הוא הפתרון המתועד של React בדיוק למקרה הזה
 * (ערך שונה בין server ל-client): getServerSnapshot מחזיר false תמיד
 * (תואם ל-SSR, אין hydration mismatch בכלל), ו-React מתאם אוטומטית
 * ובאופן בטוח את ה-snapshot האמיתי אחרי mount -- כולל תיקון DOM נכון,
 * לא רק state פנימי.
 */
function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: no-preference)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return !window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

/** SSR: תמיד false (אין window/matchMedia) -- זהה בכוונה ל-getSnapshot כשאין window, כדי שלא יהיה שום hydration mismatch אפשרי. */
function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

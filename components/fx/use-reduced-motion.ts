"use client";

import { useEffect, useState } from "react";

/**
 * הוק משותף ל-prefers-reduced-motion, עם מאזין לשינוי אמיתי — לא רק
 * קריאה חד-פעמית ב-mount (Phase 0.5, docs/experience-audit.md נספח
 * ד'.5). עד כה statement.tsx ו-count-up.tsx כל אחד קרא ל-matchMedia
 * בעצמו פעם אחת בגוף ה-effect הראשי; משתמש שמשנה את ההעדפה במערכת
 * ההפעלה תוך כדי שהעמוד פתוח (או שינוי אמולציה ב-DevTools) לא היה
 * נצפה. ה-Experience runtime העתידי (מ-Phase 2 ואילך) יצרוך את ההוק
 * הזה גם הוא — כך שיש הגדרת reduced-motion אחת ויחידה לכל המערכת.
 *
 * הערך ההתחלתי נקרא סינכרונית ב-lazy useState initializer (לא רק
 * בתוך effect): כך שהצרכנים (Statement, CountUp) מקבלים כבר ב-render
 * הראשון את הערך הנכון, ולא "מבזיקים" רגע אחד עם ההנחה השגויה
 * (למשל: Statement שמצמיד מאזיני scroll לרגע אחד לפני שהוא מתקן את
 * עצמו) — זה עצמו חלק מהעקביות שהתיקון הזה נועד לספק. ב-SSR (אין
 * window) ברירת המחדל היא false; זה בטוח כי שום JSX לא תלוי בערך
 * הזה ישירות, רק לוגיקת effect בתוך הצרכנים.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return !window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setReduced(!mq.matches);
    update(); // מסנכרן מחדש למקרה שהערך השתנה בין ה-render הראשון ל-mount
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

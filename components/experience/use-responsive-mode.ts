"use client";

import { useSyncExternalStore } from "react";
import type { ResponsiveMode } from "@/lib/experience";

/**
 * Milestone E1 (docs/rebuild-workplan.md אבן דרך E) — זיהוי ResponsiveMode
 * אמיתי לפי רוחב ה-viewport בפועל של המבקר.
 *
 * עד כאן: `resolveResponsive`/`evaluateTrack` (lib/experience.ts,
 * lib/experience-interpolate.ts) כבר פותרים tablet/mobile overrides
 * נכון כשמישהו *מזין* להם mode -- אבל experience-page.tsx (הדף
 * הציבורי) מעולם לא העביר mode ל-ExperienceProvider בכלל, כך שהוא
 * תמיד קיבל את ברירת המחדל הקשיחה "base". מבקר אמיתי בנייד היה מקבל
 * תמיד את עיצוב ה-desktop -- הצינור עבד, אבל שום דבר לא הזין אותו
 * במצב אמיתי מחוץ לסימולטור הידני (מתג ה-viewport) של הסטודיו. זה
 * בדיוק הפער ש-08-16 audit תיעד כ"PARTIAL".
 *
 * אותו דפוס בדיוק כמו use-reduced-motion.ts (Phase 0.5, נספח ד'.5):
 * useSyncExternalStore כדי ש-SSR snapshot וה-snapshot הראשון של הלקוח
 * יהיו זהים (getServerSnapshot="base", זהה בכוונה למה ש-getSnapshot
 * מחזיר כש-window לא קיים) -- אפס hydration mismatch אפשרי, עם מאזין
 * אמיתי ל-resize/orientation (לא רק קריאה חד-פעמית ב-mount).
 *
 * גבולות: 640px (תואם ל-breakpoint היחיד הקיים כבר ב-app/globals.css,
 * @media max-width:640px) ו-1024px (הטאבלט הסימולטור של הסטודיו הוא
 * 820px -- נופל בבירור בטווח 641–1024, ראו components/studio/studio-app.tsx).
 */
const MOBILE_QUERY = "(max-width: 640px)";
const TABLET_QUERY = "(max-width: 1024px)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mobile = window.matchMedia(MOBILE_QUERY);
  const tablet = window.matchMedia(TABLET_QUERY);
  mobile.addEventListener("change", callback);
  tablet.addEventListener("change", callback);
  return () => {
    mobile.removeEventListener("change", callback);
    tablet.removeEventListener("change", callback);
  };
}

function getSnapshot(): ResponsiveMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "base";
  if (window.matchMedia(MOBILE_QUERY).matches) return "mobile";
  if (window.matchMedia(TABLET_QUERY).matches) return "tablet";
  return "base";
}

/** SSR: תמיד "base" -- אין window/matchMedia; זהה בכוונה ל-getSnapshot כשאין window */
function getServerSnapshot(): ResponsiveMode {
  return "base";
}

export function useResponsiveMode(): ResponsiveMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

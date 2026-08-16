"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ExperienceRuntime } from "./experience-runtime";
import { findScrollRoot } from "@/lib/scroll-root";
import { useReducedMotion } from "@/components/fx/use-reduced-motion";
import type { ExperienceConfig, ResponsiveMode } from "@/lib/experience";
import { emptyExperience } from "@/lib/experience";

/**
 * ה-Context שדרכו ExperienceTarget/ExperienceScene (Phase 4) מגיעים
 * ל-runtime המשותף (docs/experience-audit.md §4.5, §44).
 *
 * runtime נוצר *סינכרונית בזמן ה-render הראשון* דרך `useState` עם
 * lazy initializer — לא `useRef`: הלינטר החדש (react-hooks/refs, עידן
 * React Compiler) אוסר קריאת/כתיבת `ref.current` בזמן render, כי זה
 * לא בטוח תחת מימוש עם memoization. `useState` נותן בדיוק אותה תכונה
 * (ערך יציב, נוצר פעם אחת) בדרך התקנית: state נועד להיקרא ב-render.
 * זה קריטי כאן כי ילדים שנרשמים ב-useLayoutEffect משלהם (שרץ *לפני*
 * זה של ה-Provider, לפי סדר ה-mount של React) חייבים לראות runtime
 * לא-null כבר במעבר ה-mount הראשון. חיבור ה-ScrollRoot בפועל (attach,
 * צריך DOM אמיתי) קורה בנפרד ב-useLayoutEffect של ה-Provider.
 */
interface ExperienceContextValue {
  runtime: ExperienceRuntime | null;
  mode: ResponsiveMode;
  debug: boolean;
}

const ExperienceContext = createContext<ExperienceContextValue>({ runtime: null, mode: "base", debug: false });

export function useExperienceRuntime(): ExperienceRuntime | null {
  return useContext(ExperienceContext).runtime;
}

/** מצב ה-viewport הפעיל (base/tablet/mobile) -- לצריכת ExperienceScene/Layer לצורך resolveResponsive */
export function useExperienceMode(): ResponsiveMode {
  return useContext(ExperienceContext).mode;
}

/** settings.debug של ה-Experience (Phase 8) -- ExperienceScene קורא את זה כדי להציג badge עם id+progress חי */
export function useExperienceDebug(): boolean {
  return useContext(ExperienceContext).debug;
}

export function ExperienceProvider({
  config,
  mode = "base",
  children,
}: {
  /** undefined = אין Experience בדף הזה בכלל; runtime עדיין נוצר אך אף פעם לא attach */
  config: ExperienceConfig | undefined;
  mode?: ResponsiveMode;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [runtime] = useState(() => new ExperienceRuntime(config ?? emptyExperience(), mode));
  runtime.updateConfig(config ?? emptyExperience());
  runtime.updateMode(mode);

  const enabled = Boolean(config?.enabled);

  useLayoutEffect(() => {
    const anchor = rootRef.current;
    // reduced-motion: אף פעם לא attach בכלל -- כל --exp-* נשאר בברירת
    // המחדל הנייטרלית שלו (§8 CSS: opacity:1, translate:0, scale:1...),
    // בדיוק כמו שstatement.tsx עושה. אפס כתיבה, אפס האזנה.
    if (!anchor || !enabled || reducedMotion) return;
    const scrollRoot = findScrollRoot(anchor);
    runtime.attach(scrollRoot);
    return () => runtime.detach();
  }, [runtime, enabled, reducedMotion, mode]);

  return (
    <ExperienceContext.Provider value={{ runtime, mode, debug: Boolean(config?.settings.debug) }}>
      {/*
        display:contents -- עוגן DOM טהור ל-findScrollRoot, לא משפיע על layout בכלל.
        data-experience-active (רק כש-enabled && !reducedMotion, בדיוק כמו תנאי
        ה-attach למעלה): globals.css סוגר תחתיו את כל ה-CSS של .exp-motion.
        חיוני, לא רק קוסמטי -- translate (אפילו "0% 0%") יוצר containing block
        חדש ל-position:absolute תחתיו, מה שהיה שובר overlay-ים קיימים (כמו
        הציטוט/התג הצפים ב-Hero) על כל דף רגיל בלי Experience בכלל. כשה-flag
        כבוי, ל-.exp-motion אין שום כלל CSS פעיל -- אינרטי לגמרי (Phase 5).
      */}
      <div ref={rootRef} data-experience-active={enabled && !reducedMotion ? "" : undefined} style={{ display: "contents" }}>
        {children}
      </div>
    </ExperienceContext.Provider>
  );
}

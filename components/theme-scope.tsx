import type { ReactNode } from "react";
import { themeToStyle, type Theme } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { ThemeFxLayers } from "@/components/fx/theme-fx-layers";

/**
 * עוטף ערכה: מזריק את משתני ה-CSS של הערכה (themeToStyle), מוסיף
 * מאפייני data-fx-* שה-CSS משתמש בהם לבחירת סגנון רקע/כרטיסים,
 * ומרנדר את שכבות הרקע הדקורטיביות (ThemeFxLayers) מאחורי התוכן.
 * כל דף וכל תצוגה מקדימה (app/page.tsx, app/preview, app/p, הסטודיו)
 * עוברים דרכו — כך שהחלפת ערכה משנה גם את האפקטים בלי לגעת ברכיבים.
 */
export function ThemeScope({
  theme,
  className,
  children,
  motionOff,
}: {
  theme: Theme;
  className?: string;
  children: ReactNode;
  /** מתג כיבוי אנימציה מיידי (למשל בזמן הקלדה בסטודיו) */
  motionOff?: boolean;
}) {
  return (
    <div
      style={themeToStyle(theme)}
      className={cn("ds-scope", className)}
      data-fx-bg={theme.effects.background}
      data-fx-card={theme.effects.cardStyle}
      data-studio-motion={motionOff ? "off" : undefined}
    >
      <ThemeFxLayers effects={theme.effects} />
      {children}
    </div>
  );
}

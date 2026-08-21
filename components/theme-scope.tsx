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
  suppressFx,
}: {
  theme: Theme;
  className?: string;
  children: ReactNode;
  /** מתג כיבוי אנימציה מיידי (למשל בזמן הקלדה בסטודיו) */
  motionOff?: boolean;
  /**
   * Milestone F1 (docs/rebuild-workplan.md אבן דרך F, ניקוי רעש) —
   * true בכל מקום שמרנדר Experience (page.experience?.enabled): שכבות
   * הרקע הדקורטיביות של ה-*ערכה* (aurora/orbs/dots/grid/grain) הן
   * בחירה ברמת theme.effects, לא מודעות בכלל ל-Experience -- בלי הדגל
   * הזה, ערכה עם aurora/glow היתה מתערבבת מאחורי כל scene, מתחרה
   * בקומפוזיציה/רקע המכוונים במפורש של כל scene (SceneBackground) ומפרה
   * את עקרון-העל "אפקטים דקורטיביים = opt-in בלבד" (§0.2 בתוכנית) בדיוק
   * בהקשר שבו יציבות/ריסון קריטיים ביותר. עדיין לא אפקט חדש -- רק
   * דיכוי קיים בהקשר אחד. Experience שרוצה את הרקע חייב להגדיר אותו
   * במפורש דרך scene.background.
   */
  suppressFx?: boolean;
}) {
  return (
    <div
      style={themeToStyle(theme)}
      className={cn("ds-scope", className)}
      data-fx-bg={theme.effects.background}
      data-fx-card={theme.effects.cardStyle}
      data-studio-motion={motionOff ? "off" : undefined}
    >
      {!suppressFx && <ThemeFxLayers effects={theme.effects} />}
      {children}
    </div>
  );
}

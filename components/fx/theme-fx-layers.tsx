import type { Theme } from "@/lib/theme";

/**
 * שכבות הרקע הדקורטיביות של הערכה — אורורה/כתמי-אור/נקודות/רשת +
 * גרעיניות-פילם. רכיב שרת: אין כאן שום אינטראקטיביות, רק מיפוי
 * theme.effects לתגיות ה-CSS המתאימות (globals.css .fx-*). כל
 * השכבות aria-hidden + pointer-events:none ומונחות מאחורי התוכן —
 * הבלוקים לא מכירים את קיומן בכלל.
 */
export function ThemeFxLayers({ effects }: { effects: Theme["effects"] }) {
  const { background, noise } = effects;
  if (background === "none" && !noise) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {background === "aurora" && (
        <div className="fx-aurora">
          <i />
          <i />
          <i />
        </div>
      )}
      {background === "orbs" && (
        <div className="fx-aurora fx-aurora--orbs">
          <i />
          <i />
        </div>
      )}
      {background === "dots" && <div className="fx-bg-dots absolute inset-0" />}
      {background === "grid" && <div className="fx-bg-grid absolute inset-0" />}
      {noise && <div className="fx-noise absolute inset-0" />}
    </div>
  );
}

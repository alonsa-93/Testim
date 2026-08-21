"use client";

import type { Theme } from "@/lib/theme";
import {
  contrastRatio,
  gradeContrast,
  GRADE_LABELS,
  type ContrastGrade,
} from "@/lib/contrast";

const gradeStyles: Record<ContrastGrade, string> = {
  AAA: "bg-emerald-100 text-emerald-800",
  AA: "bg-emerald-100 text-emerald-800",
  "AA-large": "bg-amber-100 text-amber-800",
  fail: "bg-red-100 text-red-800",
};

/**
 * בדיקת נגישות חיה: מחשב את יחס הניגודיות של צירופי הצבעים
 * המרכזיים בערכה לפי WCAG 2.2, ומציע תיקון אוטומטי לצבעי הטקסט
 * שעל primary ועל accent.
 *
 * צמצום UX 21/08 (ממצא #3 של ה-audit): במקום 8 שורות אבחון קבועות
 * שתופסות מסך שלם גם כשהכול תקין — מצב "חריגים בלבד": כשהכול עובר,
 * שורת ✓ אחת; רק צירוף שנכשל מקבל שורה מלאה עם כפתור תקן. הכשל נהיה
 * *בולט יותר*, לא פחות — הוא כבר לא טובע בים של ירוק.
 */
export function ContrastPanel({
  theme,
  onFix,
  exceptionsOnly = false,
}: {
  theme: Theme;
  onFix: (key: "onPrimary" | "onAccent") => void;
  /** מציג רק צירופים בעייתיים; כשהכול תקין — שורת אישור אחת */
  exceptionsOnly?: boolean;
}) {
  const c = theme.colors;
  const pairs: Array<{
    label: string;
    fg: string;
    bg: string;
    fixKey?: "onPrimary" | "onAccent";
  }> = [
    { label: "טקסט על רקע העמוד", fg: c.text, bg: c.background },
    { label: "טקסט משני על רקע העמוד", fg: c.textMuted, bg: c.background },
    { label: "טקסט על כרטיסים", fg: c.text, bg: c.surface },
    { label: "טקסט על כפתור ראשי", fg: c.onPrimary, bg: c.primary, fixKey: "onPrimary" },
    { label: "טקסט על תגית מבטא", fg: c.onAccent, bg: c.accent, fixKey: "onAccent" },
    { label: "טקסט שגיאה על רקע העמוד", fg: c.danger, bg: c.background },
    { label: "טקסט שגיאה על כרטיסים", fg: c.danger, bg: c.surface },
    { label: "גבול רכיבים (שדות/כרטיסים) על רקע העמוד", fg: c.border, bg: c.background },
  ];

  const graded = pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    const grade: ContrastGrade = ratio === null ? "fail" : gradeContrast(ratio);
    return { ...p, ratio, grade };
  });
  // "בעייתי" בהקשר תצוגה: כשל מלא או AA-large (מספיק רק לטקסט גדול).
  // חריג: שורת הגבול נמדדת מול רף 3:1 של רכיבי UI (WCAG 1.4.11), לא מול
  // רף הטקסט — לכן AA-large עבורה הוא תקין ולא מוצג כבעיה.
  const problems = graded.filter((p) =>
    p.label.startsWith("גבול") ? p.grade === "fail" : p.grade === "fail" || p.grade === "AA-large"
  );

  if (exceptionsOnly && problems.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
        <span aria-hidden="true">✓</span>
        כל צירופי הצבעים עומדים בתקן הנגישות (WCAG AA)
      </p>
    );
  }

  const shown = exceptionsOnly ? problems : graded;

  return (
    <ul className="space-y-2.5">
      {shown.map((p) => {
        const { ratio, grade } = p;
        const needsFix = p.fixKey && (grade === "fail" || grade === "AA-large");
        return (
          <li
            key={p.label}
            className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-xs font-bold"
                style={{ backgroundColor: p.bg, color: p.fg }}
              >
                א
              </span>
              <div>
                <p className="text-xs font-medium text-slate-700">{p.label}</p>
                <p className="font-mono text-[11px] text-slate-400" dir="ltr">
                  {ratio === null ? "—" : `${ratio.toFixed(2)}:1`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${gradeStyles[grade]}`}
              >
                {GRADE_LABELS[grade]}
              </span>
              {needsFix && (
                <button
                  type="button"
                  onClick={() => onFix(p.fixKey!)}
                  className="cursor-pointer rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-indigo-500"
                >
                  תקן
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

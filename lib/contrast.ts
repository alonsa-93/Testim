/**
 * בדיקות ניגודיות (קונטרסט) לפי WCAG 2.2.
 * הסטודיו משתמש בזה כדי להתריע כשצירוף צבעים לא נגיש,
 * ולהציע אוטומטית צבע טקסט מתאים.
 */

export function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** יחס ניגודיות בין שני צבעים: 1 (זהים) עד 21 (שחור/לבן) */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastGrade = "AAA" | "AA" | "AA-large" | "fail";

/**
 * דירוג לפי WCAG: טקסט רגיל דורש 4.5 (AA) או 7 (AAA);
 * טקסט גדול (18px+ מודגש או 24px+) דורש 3.
 */
export function gradeContrast(ratio: number): ContrastGrade {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-large";
  return "fail";
}

export const GRADE_LABELS: Record<ContrastGrade, string> = {
  AAA: "מצוין (AAA)",
  AA: "תקין (AA)",
  "AA-large": "רק לטקסט גדול",
  fail: "נכשל",
};

/** מחזיר לבן או כמעט-שחור — מה שנותן ניגודיות גבוהה יותר על הרקע */
export function bestTextOn(background: string): string {
  const white = contrastRatio(background, "#FFFFFF") ?? 0;
  const dark = contrastRatio(background, "#101418") ?? 0;
  return white >= dark ? "#FFFFFF" : "#101418";
}

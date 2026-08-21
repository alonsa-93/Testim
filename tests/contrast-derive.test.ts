import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveBorder,
  deriveHover,
  deriveMuted,
  mixHex,
  rgbToHex,
} from "@/lib/contrast";

/**
 * בדיקות לגזירת הצבעים האוטומטית (צמצום UX 21/08): חמשת שדות הצבע
 * "הנגזרים" (hover / on-colors / muted / border) יוצאים מהטופס הראשי ומחושבים
 * מצבעי הליבה — הבדיקות כאן מוודאות שהחישוב לא מייצר צירוף שנכשל
 * ב-WCAG, כי כשהשדה כבר לא ידני אין משתמש שיתקן אותו בעין.
 */

describe("mixHex / rgbToHex", () => {
  it("mixes linearly and clamps t", () => {
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mixHex("#000000", "#FFFFFF", -1)).toBe("#000000");
    expect(mixHex("#000000", "#FFFFFF", 2)).toBe("#FFFFFF");
  });
  it("returns null on invalid input instead of corrupting the theme", () => {
    expect(mixHex("not-a-color", "#FFFFFF", 0.5)).toBeNull();
  });
  it("rgbToHex clamps and uppercases", () => {
    expect(rgbToHex(300, -5, 128)).toBe("#FF0080");
  });
});

describe("deriveHover", () => {
  it("darkens light colors and lightens dark colors", () => {
    const lightHover = deriveHover("#EEEEEE")!;
    const darkHover = deriveHover("#112233")!;
    // בהיר -> כהה יותר, כהה -> בהיר יותר (בציר ה-luminance)
    expect(lightHover < "#EEEEEE").toBe(true);
    expect(darkHover > "#112233").toBe(true);
  });
});

describe("deriveMuted / deriveBorder keep WCAG floors", () => {
  const pairs: Array<[string, string]> = [
    ["#15202B", "#FDFDFB"], // ערכת ברירת המחדל
    ["#F5F7FA", "#0B1120"], // ערכה כהה
    ["#333333", "#EFEFEF"],
  ];
  it("muted text stays >= 4.5:1 against its background", () => {
    for (const [text, bg] of pairs) {
      const muted = deriveMuted(text, bg)!;
      expect(contrastRatio(muted, bg)!).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("border stays >= 3:1 against its background (WCAG 1.4.11)", () => {
    for (const [text, bg] of pairs) {
      const border = deriveBorder(text, bg)!;
      expect(contrastRatio(border, bg)!).toBeGreaterThanOrEqual(3);
    }
  });
});

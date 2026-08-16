import { describe, expect, it } from "vitest";
import { getDefaultTheme, themes } from "@/themes";
import { looksLikeTheme, normalizeTheme, themeToCssVars, type Theme } from "@/lib/theme";

/**
 * בסיס רגרסיה ל-Theme Engine (Phase 0.5, §16.2) — Experience תלוי
 * בטוקני הערכה (§65 במסמך התיקון: "reuse semantic tokens, no second
 * contrast/color system") ולכן קריטי שהנרמול הקיים לא ישבר.
 */
describe("lib/theme — normalizeTheme", () => {
  it("fills every effects field with a conservative default when missing", () => {
    const raw = {
      id: "legacy",
      name: "Legacy",
      colors: {
        primary: "#000000",
        primaryHover: "#111111",
        onPrimary: "#FFFFFF",
        accent: "#222222",
        onAccent: "#FFFFFF",
        background: "#FFFFFF",
        surface: "#F5F5F5",
        text: "#000000",
        textMuted: "#555555",
        border: "#DDDDDD",
      },
      typography: { fontHeading: "heebo", fontBody: "heebo", baseSize: 16, scale: 1.2, headingWeight: 700 },
      shape: { cardRadius: 12, buttonRadius: 8, fieldRadius: 8 },
      layout: { sectionSpacing: 96, maxWidth: 1200 },
    } as unknown as Theme;

    const normalized = normalizeTheme(raw);
    expect(normalized.effects).toEqual({
      shadow: "soft",
      background: "none",
      backgroundIntensity: 0.5,
      noise: false,
      cardStyle: "raised",
      glow: "none",
      glowColor: undefined,
      buttonStyle: "flat",
      animation: { style: "rise", intensity: "subtle" },
    });
    // danger מחושב מהיוריסטיקת ניגודיות — לא צריך להיות ריק
    expect(normalized.colors.danger).toBeTruthy();
  });

  it("is idempotent on an already-normalized theme", () => {
    const theme = getDefaultTheme();
    const twice = normalizeTheme(normalizeTheme(theme));
    expect(twice).toEqual(normalizeTheme(theme));
  });
});

describe("lib/theme — looksLikeTheme", () => {
  it("accepts every shipped theme", () => {
    for (const theme of themes) {
      expect(looksLikeTheme(theme)).toBe(true);
    }
  });

  it("rejects malformed input", () => {
    expect(looksLikeTheme(null)).toBe(false);
    expect(looksLikeTheme({ id: "x" })).toBe(false);
  });
});

describe("lib/theme — themeToCssVars", () => {
  it("produces every --ds-* variable the CSS layer expects, non-empty", () => {
    const vars = themeToCssVars(getDefaultTheme());
    for (const key of [
      "--ds-color-primary",
      "--ds-color-bg",
      "--ds-font-heading",
      "--ds-fs-h1",
      "--ds-radius-card",
      "--ds-shadow-card",
      "--ds-anim-distance",
      "--ds-ease-out-soft",
    ]) {
      expect(vars[key], `${key} should be set`).toBeTruthy();
    }
  });

  it("derives fluid heading sizes as clamp() expressions", () => {
    const vars = themeToCssVars(getDefaultTheme());
    expect(vars["--ds-fs-h1"]).toMatch(/^clamp\(/);
    expect(vars["--ds-fs-h2"]).toMatch(/^clamp\(/);
  });
});

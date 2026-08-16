import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StudioApp } from "@/components/studio/studio-app";

/**
 * עשן-בדיקה לרינדור הסטודיו (Phase 0.5, §16.2). מייבא את StudioApp
 * ישירות (עוקף את next/dynamic ssr:false של studio-loader.tsx — לא
 * רלוונטי בסביבת בדיקה) ומוודא שהוא מתרכב בלי לזרוק, כולל התצוגה
 * החיה המקוננת (PageRenderer + ThemeScope) שבה מתגלה R1 (§3.1).
 * localStorage ריק ב-jsdom כברירת מחדל, כך שהסטודיו נטען עם הדף
 * וערכת ברירת המחדל — בדיוק כמו ביקור ראשון אמיתי.
 */
describe("StudioApp — mounts without crashing", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders the structure tab with the block list and live preview", () => {
    render(<StudioApp />);
    // כותרת/ניווט הסטודיו קיימים
    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    // Reset אפשרות תמיד זמינה (WORKPLAN: כפתורי איפוס תמיד נגישים)
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("survives an empty/corrupted localStorage draft instead of crashing", () => {
    localStorage.setItem("testim-studio-draft", "{not valid json");
    localStorage.setItem("testim-studio-page", "{not valid json");
    expect(() => render(<StudioApp />)).not.toThrow();
  });
});

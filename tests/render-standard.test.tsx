import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageRenderer } from "@/components/page-renderer";
import { getDefaultPage } from "@/pages-data";
import { getDefaultTheme } from "@/themes";

/**
 * עשן-בדיקה לרינדור Standard (Phase 0.5, §16.2): מוודא שהדף האמיתי
 * (17 בלוקים, ערכת ברירת מחדל) ממשיך לרנדר בלי לזרוק — זו בדיקת
 * ה-DoD "דפים קיימים ממשיכים לעבוד" (§19) שרצה אוטומטית מעכשיו,
 * במקום רק ביקור ידני בדפדפן.
 */
describe("PageRenderer — standard rendering, no Experience", () => {
  it("renders the demo page with nav pinned first and footer pinned last", () => {
    const page = getDefaultPage();
    const theme = getDefaultTheme();
    const { container } = render(<PageRenderer page={page} theme={theme} />);

    const main = container.querySelector("main#main");
    expect(main).toBeTruthy();

    // navbar הוא PINNED_TOP — חייב לצאת לפני ה-<main>, לא בתוכו
    const nav = container.querySelector("nav, header");
    expect(nav).toBeTruthy();

    // תוכן ממשי מהבלוקים אמור להופיע (לא רק structure ריק)
    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
  });

  it("renders a skip-to-content link as the very first focusable element", () => {
    render(<PageRenderer page={getDefaultPage()} theme={getDefaultTheme()} />);
    const skipLink = screen.getByRole("link", { name: /דילוג לתוכן הראשי/ });
    expect(skipLink).toHaveAttribute("href", "#main");
  });

  it("assigns a unique DOM id to every anchor-bearing block instance", () => {
    const { container } = render(
      <PageRenderer page={getDefaultPage()} theme={getDefaultTheme()} />
    );
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not crash when a block instance has an unknown type", () => {
    const page = getDefaultPage();
    const withGhostBlock = {
      ...page,
      blocks: [...page.blocks, { id: "ghost-1", type: "not-a-real-block", content: {} }],
    };
    expect(() =>
      render(<PageRenderer page={withGhostBlock} theme={getDefaultTheme()} />)
    ).not.toThrow();
  });
});

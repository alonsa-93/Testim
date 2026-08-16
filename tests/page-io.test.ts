import { describe, expect, it } from "vitest";
import { getDefaultPage, pages } from "@/pages-data";
import { looksLikePage, normalizePage } from "@/lib/page";

/**
 * ייבוא/ייצוא (Phase 0.5, §16.2): הדף "demo" הוא הדף האמיתי היחיד
 * שקיים בריפו — זהו בדיוק הנתיב ש-Page.experience? (עתידי, אופציונלי)
 * חייב להמשיך לתמוך בו בלי שום שינוי.
 */
describe("pages-data — real demo page round-trips", () => {
  it("the shipped demo.json is a valid Page", () => {
    const page = getDefaultPage();
    expect(looksLikePage(page)).toBe(true);
    expect(page.id).toBe("demo");
    expect(page.blocks.length).toBeGreaterThan(0);
  });

  it("survives a JSON export → import round-trip unchanged", () => {
    const page = getDefaultPage();
    const exported = JSON.parse(JSON.stringify(page));
    expect(looksLikePage(exported)).toBe(true);
    const reimported = normalizePage(exported);
    expect(reimported.blocks.map((b) => b.id)).toEqual(page.blocks.map((b) => b.id));
    expect(reimported.blocks.map((b) => b.type)).toEqual(page.blocks.map((b) => b.type));
  });

  it("every registered page passes the normalized shape check", () => {
    for (const page of pages) {
      expect(looksLikePage(page)).toBe(true);
      // normalizePage לא אמור לשנות בלוקים שכבר תקינים (idempotent)
      const normalized = normalizePage(page);
      expect(normalized.blocks.map((b) => b.id)).toEqual(page.blocks.map((b) => b.id));
    }
  });

  it("rejects an obviously malformed import instead of crashing", () => {
    expect(looksLikePage({ not: "a page" })).toBe(false);
    expect(looksLikePage(undefined)).toBe(false);
  });
});

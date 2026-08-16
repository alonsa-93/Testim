import { describe, expect, it } from "vitest";
import { emptyPage, looksLikePage, normalizePage, type Page } from "@/lib/page";
import { getDefaultPage } from "@/pages-data";

/**
 * Phase 1 — Page.experience wiring (docs/experience-audit.md §5.1, R7).
 * חייב להיות אופציונלי לחלוטין: הדף האמיתי היחיד שקיים (demo) אין לו
 * experience בכלל, וזה חייב להישאר תקין לגמרי.
 */
describe("Page.experience — backward compatibility", () => {
  it("emptyPage() has no experience field at all", () => {
    const p = emptyPage();
    expect(p.experience).toBeUndefined();
    expect(looksLikePage(p)).toBe(true);
  });

  it("the real demo page normalizes with no experience field added", () => {
    const normalized = normalizePage(getDefaultPage());
    expect(normalized.experience).toBeUndefined();
    expect(normalized.blocks.length).toBeGreaterThan(0); // rest of the page unaffected
  });

  it("normalizePage normalizes an experience field when present", () => {
    // raw, not-yet-normalized input (e.g. from JSON import) -- intentionally
    // untyped, same pattern as tests/page-normalize.test.ts's malformed fixtures
    const raw = {
      ...emptyPage(),
      experience: { enabled: true, scenes: [{ name: "Hero" }] },
    } as unknown as Page;
    const normalized = normalizePage(raw);
    expect(normalized.experience).toBeDefined();
    expect(normalized.experience!.scenes).toHaveLength(1);
    expect(normalized.experience!.scenes[0].id).toBe("scene-1");
  });

  it("a page with a malformed experience field still normalizes safely (falls back to Standard)", () => {
    const raw = { ...emptyPage(), experience: "not an object" } as unknown as Page;
    expect(() => normalizePage(raw)).not.toThrow();
    const normalized = normalizePage(raw);
    expect(normalized.experience).toBeUndefined();
  });

  it("looksLikePage does not require the experience field", () => {
    expect(looksLikePage(emptyPage())).toBe(true);
  });
});

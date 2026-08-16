import { describe, expect, it } from "vitest";
import { emptyPage, looksLikePage, newBlockId, normalizePage } from "@/lib/page";
import type { Page } from "@/lib/page";

/**
 * בסיס רגרסיה (Phase 0.5, docs/experience-audit.md §16.2): מוודא שהתנהגות
 * נורמליזציית ה-Page הקיימת לא נשברת בהמשך הפיתוח של Experience —
 * זה בדיוק המנגנון ש-Page.experience? (אופציונלי, R7) ירכב עליו.
 */
describe("lib/page — normalizePage", () => {
  it("fills missing meta and keeps existing fields untouched", () => {
    const raw = {
      id: "p1",
      name: "Page 1",
      themeId: "default",
      meta: undefined,
      blocks: [{ id: "hero-1", type: "hero", content: { title: "hi" } }],
    } as unknown as Page;

    const result = normalizePage(raw);
    expect(result.meta).toEqual({ title: "", description: "" });
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toEqual({ id: "hero-1", type: "hero", content: { title: "hi" } });
  });

  it("assigns a fresh id to blocks missing one", () => {
    const raw: Page = {
      id: "p1",
      name: "Page 1",
      themeId: "default",
      meta: { title: "", description: "" },
      blocks: [{ id: "", type: "hero", content: {} }],
    };
    const result = normalizePage(raw);
    expect(result.blocks[0].id).toBe("hero-1");
  });

  it("de-duplicates colliding block ids instead of merging them", () => {
    const raw: Page = {
      id: "p1",
      name: "Page 1",
      themeId: "default",
      meta: { title: "", description: "" },
      blocks: [
        { id: "hero-1", type: "hero", content: { title: "first" } },
        { id: "hero-1", type: "hero", content: { title: "second" } },
      ],
    };
    const result = normalizePage(raw);
    const ids = result.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(2);
    // התוכן של שני הבלוקים נשמר — לא נדרס, רק ה-id שונה
    expect(result.blocks.map((b) => b.content.title)).toEqual(["first", "second"]);
  });

  it("coerces a non-object content to an empty object", () => {
    const raw = {
      id: "p1",
      name: "Page 1",
      themeId: "default",
      meta: { title: "", description: "" },
      blocks: [{ id: "hero-1", type: "hero", content: null }],
    } as unknown as Page;
    const result = normalizePage(raw);
    expect(result.blocks[0].content).toEqual({});
  });
});

describe("lib/page — looksLikePage", () => {
  it("accepts a well-formed page", () => {
    expect(looksLikePage(emptyPage())).toBe(true);
  });

  it("rejects null/primitives", () => {
    expect(looksLikePage(null)).toBe(false);
    expect(looksLikePage("page")).toBe(false);
    expect(looksLikePage(42)).toBe(false);
  });

  it("rejects an object missing required fields", () => {
    expect(looksLikePage({ id: "x" })).toBe(false);
    expect(looksLikePage({ id: "x", name: "n", themeId: "t" })).toBe(false); // no blocks
  });

  it("rejects a page whose blocks are missing a type", () => {
    expect(
      looksLikePage({ id: "x", name: "n", themeId: "t", blocks: [{ id: "b1" }] })
    ).toBe(false);
  });
});

describe("lib/page — newBlockId", () => {
  it("produces a stable, unique id from the type and existing count", () => {
    expect(newBlockId("hero", [])).toBe("hero-1");
    expect(newBlockId("hero", [{ id: "hero-1", type: "hero", content: {} }])).toBe("hero-2");
  });

  it("skips over an id that already exists even out of natural order", () => {
    const existing = [
      { id: "hero-1", type: "hero", content: {} },
      { id: "hero-2", type: "hero", content: {} },
    ];
    expect(newBlockId("hero", existing)).toBe("hero-3");
  });
});

describe("lib/page — emptyPage", () => {
  it("returns a page with no blocks and blank meta", () => {
    const p = emptyPage();
    expect(p.blocks).toEqual([]);
    expect(p.meta).toEqual({ title: "", description: "" });
    expect(looksLikePage(p)).toBe(true);
  });
});

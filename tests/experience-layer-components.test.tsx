import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ExperienceProvider } from "@/components/experience/experience-provider";
import { ExperienceLayerRenderer } from "@/components/experience/experience-layer";
import type { ExperienceLayer } from "@/lib/experience";
import type { PageBlockInstance } from "@/lib/page";

/**
 * Phase 6 — Freeform layer MVP: 5 types (docs/experience-audit.md §12.1).
 * כל בדיקה עוברת דרך ExperienceLayerRenderer (הדיספצ'ר), לא ישירות
 * ברכיבי ה-layer, כדי לוודא גם את ה-wiring (ExperienceTarget, mode).
 */
function layer(overrides: Partial<ExperienceLayer>): ExperienceLayer {
  return {
    id: "l1",
    type: "text",
    content: { text: "hi", tag: "p" },
    layout: { mode: "flow" },
    ...overrides,
  };
}

function renderLayer(l: ExperienceLayer, blocks?: PageBlockInstance[]) {
  return render(
    <ExperienceProvider config={undefined}>
      <ExperienceLayerRenderer layer={l} blocks={blocks} />
    </ExperienceProvider>
  );
}

describe("Text layer", () => {
  afterEach(cleanup);

  it("renders the semantic tag declared in content.tag, not a generic div", () => {
    const { container } = renderLayer(
      layer({ type: "text", content: { text: "כותרת", tag: "h2" } })
    );
    const h2 = container.querySelector("h2");
    expect(h2).toBeTruthy();
    expect(h2!.textContent).toBe("כותרת");
  });

  it("defaults to <p> when no tag is specified", () => {
    const { container } = renderLayer(layer({ type: "text", content: { text: "x", tag: undefined as never } }));
    expect(container.querySelector("p")).toBeTruthy();
  });
});

describe("Image layer", () => {
  afterEach(cleanup);

  it("requires alt text for a non-decorative image", () => {
    const { container } = renderLayer(
      layer({ type: "image", content: { src: "/x.jpg", alt: "תיאור" } })
    );
    const img = container.querySelector("img")!;
    expect(img.alt).toBe("תיאור");
    expect(img.getAttribute("aria-hidden")).toBeNull();
  });

  it("marks a decorative image as aria-hidden with empty alt", () => {
    const { container } = renderLayer(
      layer({ type: "image", content: { src: "/x.jpg", alt: "ignored", decorative: true } })
    );
    const img = container.querySelector("img")!;
    expect(img.alt).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Shape layer", () => {
  afterEach(cleanup);

  it("is always aria-hidden -- decorative only, never enters the accessibility tree", () => {
    const { container } = renderLayer(layer({ type: "shape", content: { shape: "circle" } }));
    const shapeEl = container.querySelector('[aria-hidden="true"].rounded-full');
    expect(shapeEl).toBeTruthy();
  });
});

describe("Button layer", () => {
  afterEach(cleanup);

  it("renders as a link using the existing Button component's href behavior", () => {
    const { getByText } = renderLayer(
      layer({ type: "button", content: { label: "לחצו כאן", href: "#go" } })
    );
    const link = getByText("לחצו כאן").closest("a");
    expect(link).toHaveAttribute("href", "#go");
  });
});

describe("Block Reference layer", () => {
  afterEach(cleanup);

  it("resolves an existing block by id and renders it (bridges to Standard blocks, no content duplication)", () => {
    const blocks: PageBlockInstance[] = [{ id: "cta-1", type: "cta", content: { title: "כותרת CTA" } }];
    const { getByText } = renderLayer(
      layer({ id: "l1", type: "block", content: { blockId: "cta-1" }, layout: { mode: "flow" } }),
      blocks
    );
    expect(getByText("כותרת CTA")).toBeInTheDocument();
  });

  it("renders nothing (not a crash) when the referenced block id doesn't exist", () => {
    const blocks: PageBlockInstance[] = [];
    expect(() =>
      renderLayer(layer({ type: "block", content: { blockId: "missing" } }), blocks)
    ).not.toThrow();
  });

  it("renders nothing when no blocks list is provided at all", () => {
    expect(() => renderLayer(layer({ type: "block", content: { blockId: "x" } }))).not.toThrow();
  });
});

describe("ExperienceLayerRenderer — dispatcher behavior", () => {
  afterEach(cleanup);

  it("skips rendering entirely when layer.hidden is true", () => {
    const { container } = renderLayer(layer({ hidden: true }));
    expect(container.querySelector("[data-experience-target]")).toBeNull();
  });

  it("wraps content in an ExperienceTarget carrying the layer's own id", () => {
    const { container } = renderLayer(layer({ id: "my-layer" }));
    expect(container.querySelector('[data-experience-target="my-layer"]')).toBeTruthy();
  });

  it("applies stage-mode positioning as inline style on the target wrapper", () => {
    const { container } = renderLayer(
      layer({ layout: { mode: "stage", x: "5%", y: "10%" } })
    );
    const wrapper = container.querySelector("[data-experience-target]") as HTMLElement;
    expect(wrapper.style.position).toBe("absolute");
    expect(wrapper.style.insetInlineStart).toBe("5%");
  });
});

/**
 * Milestone E1 — hidden הפך מ-boolean ל-Responsive<boolean> (§ proof
 * point: "mobile סיפור מפושט" יכול להשמיט שכבה דקורטיבית-בלבד רק
 * בנייד/טאבלט בלי לגעת ב-desktop). renderWithMode עוקף את ה-mode
 * הכתוב-קשיח של renderLayer/ExperienceProvider (שנופל כברירת מחדל
 * ל-useResponsiveMode() האמיתי) כדי לבדוק דטרמיניסטית את שלושת המצבים.
 */
describe("ExperienceLayerRenderer — Responsive<boolean> hidden (Milestone E1)", () => {
  afterEach(cleanup);

  function renderWithMode(l: ExperienceLayer, mode: "base" | "tablet" | "mobile") {
    return render(
      <ExperienceProvider config={undefined} mode={mode}>
        <ExperienceLayerRenderer layer={l} />
      </ExperienceProvider>
    );
  }

  it("renders normally on base when hidden only overrides mobile", () => {
    const { container } = renderWithMode(layer({ hidden: { base: false, mobile: true } }), "base");
    expect(container.querySelector("[data-experience-target]")).toBeTruthy();
  });

  it("still renders on tablet when only mobile is overridden (falls back to base via tablet->base chain)", () => {
    const { container } = renderWithMode(layer({ hidden: { base: false, mobile: true } }), "tablet");
    expect(container.querySelector("[data-experience-target]")).toBeTruthy();
  });

  it("is skipped on mobile when the mobile override is true", () => {
    const { container } = renderWithMode(layer({ hidden: { base: false, mobile: true } }), "mobile");
    expect(container.querySelector("[data-experience-target]")).toBeNull();
  });
});

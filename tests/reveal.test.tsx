import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Reveal, RevealManagedContext } from "@/components/fx/reveal";
import type { ResolvedAnim } from "@/lib/effects";

/**
 * Milestone B4 (docs/architecture-decision-gate.md §2): RevealManagedContext
 * הוא מנגנון האכיפה של טבלת התקדימות (Experience Track > אפקט בלוק).
 * ברירת המחדל (בלי Provider כלל) חייבת להישאר ההתנהגות הישנה במדויק —
 * זו הערבות שדפי Standard לא מושפעים.
 */
const anim: ResolvedAnim = {
  type: "rise",
  durationMs: 500,
  delayMs: 0,
  staggerMs: 0,
  once: true,
  distance: 24,
};

describe("Reveal — RevealManagedContext (Milestone B4)", () => {
  afterEach(cleanup);

  it("default (no Provider) behaves exactly like before: renders data-animate for a resolved anim", () => {
    const { container } = render(<Reveal anim={anim}>content</Reveal>);
    expect(container.querySelector("[data-animate]")).toBeTruthy();
  });

  it("managed=true suppresses data-animate entirely, even with a resolved anim", () => {
    const { container } = render(
      <RevealManagedContext.Provider value={true}>
        <Reveal anim={anim}>content</Reveal>
      </RevealManagedContext.Provider>
    );
    expect(container.querySelector("[data-animate]")).toBeNull();
    expect(container.textContent).toBe("content");
  });

  it("managed=false explicitly still behaves like the unmanaged default", () => {
    const { container } = render(
      <RevealManagedContext.Provider value={false}>
        <Reveal anim={anim}>content</Reveal>
      </RevealManagedContext.Provider>
    );
    expect(container.querySelector("[data-animate]")).toBeTruthy();
  });

  it("anim=null still renders unmanaged fallback regardless of managed flag (no behavior change)", () => {
    const { container } = render(
      <RevealManagedContext.Provider value={true}>
        <Reveal anim={null}>content</Reveal>
      </RevealManagedContext.Provider>
    );
    expect(container.querySelector("[data-animate]")).toBeNull();
    expect(container.textContent).toBe("content");
  });
});

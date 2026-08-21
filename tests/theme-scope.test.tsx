import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ThemeScope } from "@/components/theme-scope";
import { getDefaultTheme } from "@/themes";

/**
 * Milestone F1 (docs/rebuild-workplan.md אבן דרך F1, ניקוי רעש) —
 * suppressFx: ה-fix האמיתי לסיכון ש-theme.effects (aurora/orbs/dots/
 * grid/grain) יזלוג אחורי Experience ויתחרה ב-SceneBackground/
 * שפת-ברירת-המחדל הנקייה. אין כאן שינוי בברירת המחדל (Standard
 * ממשיך לקבל את שכבות ה-fx בדיוק כמו קודם) — רק דגל מפורש חדש.
 */
function auroraTheme() {
  const base = getDefaultTheme();
  return { ...base, effects: { ...base.effects, background: "aurora" as const, noise: true } };
}

describe("ThemeScope — suppressFx (Milestone F1)", () => {
  afterEach(cleanup);

  it("renders the theme's decorative fx layers by default (unchanged Standard behavior)", () => {
    const { container } = render(
      <ThemeScope theme={auroraTheme()}>
        <p>content</p>
      </ThemeScope>
    );
    expect(container.querySelector(".fx-aurora")).toBeTruthy();
    expect(container.querySelector(".fx-noise")).toBeTruthy();
  });

  it("omits the decorative fx layers entirely when suppressFx is set, even with an aurora+noise theme", () => {
    const { container } = render(
      <ThemeScope theme={auroraTheme()} suppressFx>
        <p>content</p>
      </ThemeScope>
    );
    expect(container.querySelector(".fx-aurora")).toBeNull();
    expect(container.querySelector(".fx-noise")).toBeNull();
  });

  it("still renders children and the theme CSS-var scope when suppressFx is set", () => {
    const { container, getByText } = render(
      <ThemeScope theme={auroraTheme()} suppressFx>
        <p>content</p>
      </ThemeScope>
    );
    expect(getByText("content")).toBeInTheDocument();
    expect(container.querySelector(".ds-scope")).toBeTruthy();
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountUp } from "@/components/fx/count-up";
import { PageRenderer } from "@/components/page-renderer";
import { getDefaultPage } from "@/pages-data";
import { getDefaultTheme } from "@/themes";

/**
 * בדיקת RTL היכן שניתן בלי דפדפן מלא (Phase 0.5, §16.2). ה-<html dir="rtl">
 * עצמו יושב ב-app/layout.tsx (server root, לא נבדק כאן) — מה שכן ניתן
 * ובעל ערך לבדוק ביחידה הוא ההתנהגות הסמנטית המפורשת היחידה בקוד
 * שתלויה בכיווניות: CountUp מכריח dir="ltr" על עצמו כי מספרים
 * מוצגים תמיד משמאל-לימין גם בתוך עמוד RTL.
 */
describe("RTL — explicit directional overrides", () => {
  it("CountUp forces dir=ltr regardless of the surrounding RTL context", () => {
    render(
      <div dir="rtl">
        <CountUp value="+120" />
      </div>
    );
    const span = screen.getByText("120", { exact: false });
    expect(span).toHaveAttribute("dir", "ltr");
  });

  it("never overrides dir=ltr on a whole structural/section-level container", () => {
    // dir="ltr" מקומי (טלפון/אימייל ב-footer/lead-form, מסלול המרקיז)
    // הוא תקין ומכוון — הסיכון האמיתי הוא היפוך כיווניות על אלמנט
    // מבני שלם, מה שהיה הופך את כל הסקשן ל-LTR בטעות.
    const { container } = render(
      <PageRenderer page={getDefaultPage()} theme={getDefaultTheme()} />
    );
    const structural = container.querySelectorAll(
      'section[dir="ltr"], main[dir="ltr"], header[dir="ltr"], footer[dir="ltr"], nav[dir="ltr"]'
    );
    expect(structural.length).toBe(0);
  });
});

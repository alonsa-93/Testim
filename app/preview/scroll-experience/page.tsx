import type { Metadata } from "next";
import Link from "next/link";
import { ThemeScope } from "@/components/theme-scope";
import { ExperiencePage } from "@/components/experience/experience-page";
import { getTheme, getDefaultTheme } from "@/themes";
import { normalizePage } from "@/lib/page";
import { scrollExperienceDemoPage } from "@/pages-data/scroll-experience-demo";

/**
 * Phase 9 — הדגמת Mode B (docs/experience-audit.md §18 Phase 9, §90
 * במסמך הסופי). דף סטטי ייעודי, לא hardcoded: מנרמל page.experience
 * דרך אותו normalizePage/normalizeExperience שכל דף עובר, בדיוק
 * כמו /p/[pageId] — ומרנדר דרך ExperiencePage בלבד (חמש הסצנות,
 * לא PageRenderer — אין בלוקי navbar/footer רגילים בעמוד הזה במכוון,
 * זו הדגמה ממוקדת של מנוע החוויה עצמו).
 */

export const metadata: Metadata = {
  title: scrollExperienceDemoPage.meta.title || scrollExperienceDemoPage.name,
  description: scrollExperienceDemoPage.meta.description,
};

export default function ScrollExperienceDemoPage() {
  const page = normalizePage(scrollExperienceDemoPage);
  const theme = getTheme(page.themeId) ?? getDefaultTheme();

  return (
    <ThemeScope theme={theme} suppressFx>
      <a
        href="#experience-main"
        className="sr-only z-50 rounded-btn bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:start-3"
      >
        דילוג לתוכן הראשי
      </a>
      <Link
        href="/"
        className="fixed top-4 start-4 z-40 rounded-btn bg-surface/90 px-4 py-2 text-sm font-semibold text-ink shadow-card backdrop-blur"
      >
        ← בחזרה ל-Testim
      </Link>
      <main id="experience-main">
        <ExperiencePage page={page} theme={theme} />
      </main>
    </ThemeScope>
  );
}

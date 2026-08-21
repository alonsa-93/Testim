import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/page-renderer";
import { ExperiencePage } from "@/components/experience/experience-page";
import { ThemeScope } from "@/components/theme-scope";
import { normalizePage } from "@/lib/page";
import { getTheme, getDefaultTheme } from "@/themes";
import { pages, getPage } from "@/pages-data";

/**
 * כל דף שנבנה בסטודיו ונשמר בתיקיית pages-data/ מתפרסם כאן:
 *   /p/demo · /p/<מזהה-הדף>
 */

export function generateStaticParams() {
  return pages.map((p) => ({ pageId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}): Promise<Metadata> {
  const { pageId } = await params;
  const page = getPage(pageId);
  if (!page) return { title: "הדף לא נמצא" };
  return {
    title: page.meta.title || page.name,
    description: page.meta.description,
  };
}

export default async function PublishedPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const raw = getPage(pageId);
  if (!raw) notFound();

  // Milestone F1 (docs/rebuild-workplan.md אבן דרך F1) — הבאג האמיתי
  // שנמצא תוך כדי ביקורת האפקטים הדקורטיביים: הנתיב הזה מעולם לא בדק
  // page.experience?.enabled בכלל, תמיד רינדר PageRenderer (Standard)
  // בלבד. משתמש שבנה חוויית-גלילה בסטודיו והוריד את ה-JSON (בדיוק
  // תרחיש "ייבוא" ש-normalizePage/normalizeExperience נועדו לו, ראו
  // lib/page.ts) לעולם לא היה רואה אותה חיה אחרי "פרסום" -- הדף היה
  // נופל בחזרה לבלוקים (או ריק, אם page.blocks היה ריק). ExperiencePage
  // מרונדר עצמאי לגמרי (בלי nav/footer רגילים -- Experience הוא
  // full-bleed במכוון, בדיוק כמו app/preview/scroll-experience/page.tsx),
  // אז שני המצבים מקבלים ניווט-דילוג ו-<main id="main"> משלהם, לא
  // מתחת ל-PageRenderer המשותף.
  const page = normalizePage(raw);
  const theme = getTheme(page.themeId) ?? getDefaultTheme();
  const experienceEnabled = Boolean(page.experience?.enabled);

  if (experienceEnabled) {
    return (
      <ThemeScope theme={theme} className="min-h-screen" suppressFx>
        <a
          href="#main"
          className="sr-only z-50 rounded-btn bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:start-3"
        >
          דילוג לתוכן הראשי
        </a>
        <main id="main">
          <ExperiencePage page={page} theme={theme} />
        </main>
      </ThemeScope>
    );
  }

  return (
    <ThemeScope theme={theme} className="min-h-screen">
      <PageRenderer page={page} theme={theme} />
    </ThemeScope>
  );
}

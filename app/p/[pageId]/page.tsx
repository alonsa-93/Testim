import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/page-renderer";
import { themeToStyle } from "@/lib/theme";
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
  const page = getPage(pageId);
  if (!page) notFound();

  const theme = getTheme(page.themeId) ?? getDefaultTheme();
  return (
    <div style={themeToStyle(theme)} className="ds-scope min-h-screen">
      <PageRenderer page={page} />
    </div>
  );
}

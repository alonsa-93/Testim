import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/page-renderer";
import { themeToStyle } from "@/lib/theme";
import { themes, getTheme } from "@/themes";
import { getDefaultPage } from "@/pages-data";

/**
 * תצוגת דף הדוגמה תחת ערכה של לקוח מסוים:
 *   /preview/default · /preview/nova-dark · /preview/<לקוח-חדש>
 * שימושי להשוואת ערכות על אותו תוכן בדיוק.
 */

export function generateStaticParams() {
  return themes.map((t) => ({ themeId: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ themeId: string }>;
}): Promise<Metadata> {
  const { themeId } = await params;
  const theme = getTheme(themeId);
  return { title: theme ? `תצוגה מקדימה — ${theme.name}` : "תצוגה מקדימה" };
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;
  const theme = getTheme(themeId);
  if (!theme) notFound();

  return (
    <div style={themeToStyle(theme)} className="min-h-screen bg-bg text-ink">
      <PageRenderer page={getDefaultPage()} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/page-renderer";
import { ThemeScope } from "@/components/theme-scope";
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
    <ThemeScope theme={theme} className="min-h-screen">
      <PageRenderer page={getDefaultPage()} theme={theme} />
    </ThemeScope>
  );
}

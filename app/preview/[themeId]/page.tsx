import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { themeToStyle } from "@/lib/theme";
import { themes, getTheme } from "@/themes";

/**
 * תצוגת דף הנחיתה תחת ערכה של לקוח מסוים:
 *   /preview/default · /preview/nova-dark · /preview/<לקוח-חדש>
 * כך בונים "אתר ללקוח": אותם בלוקים, ערכה אחרת.
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
      <LandingPage />
    </div>
  );
}

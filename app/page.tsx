import type { Metadata } from "next";
import { PageRenderer } from "@/components/page-renderer";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { themeToStyle } from "@/lib/theme";
import { getTheme, getDefaultTheme } from "@/themes";
import { getDefaultPage } from "@/pages-data";

const page = getDefaultPage();

export const metadata: Metadata = {
  title: page.meta.title || page.name,
  description: page.meta.description,
};

export default function Home() {
  const theme = getTheme(page.themeId) ?? getDefaultTheme();
  return (
    <div style={themeToStyle(theme)} className="min-h-screen bg-bg text-ink">
      <PageRenderer page={page} />
      <ThemeSwitcher />
    </div>
  );
}

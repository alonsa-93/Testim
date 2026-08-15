"use client";

import { useState } from "react";
import Link from "next/link";
import { themes, getDefaultTheme } from "@/themes";
import { themeToCssVars } from "@/lib/theme";

/**
 * ווידג'ט הדגמה צף: מחליף את הערכה של הדף כולו בזמן אמת,
 * על ידי דריסת משתני ה-CSS שמוזרקים על ה-body.
 */
export function ThemeSwitcher() {
  const [activeId, setActiveId] = useState(getDefaultTheme().id);

  function applyTheme(id: string) {
    const theme = themes.find((t) => t.id === id);
    if (!theme) return;
    const vars = themeToCssVars(theme);
    for (const [key, value] of Object.entries(vars)) {
      document.body.style.setProperty(key, value);
    }
    setActiveId(id);
  }

  return (
    <div className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-btn border border-line bg-surface p-2 shadow-card">
      <label htmlFor="theme-switcher" className="ps-2 text-sm font-semibold text-ink">
        ערכת נושא
      </label>
      <select
        id="theme-switcher"
        value={activeId}
        onChange={(e) => applyTheme(e.target.value)}
        className="cursor-pointer rounded-field border border-line bg-bg px-2.5 py-1.5 text-sm text-ink"
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Link
        href="/studio"
        className="rounded-btn bg-primary px-3.5 py-1.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        עריכה בסטודיו
      </Link>
    </div>
  );
}

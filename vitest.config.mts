import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * תשתית בדיקות (Phase 0.5 — Motion Foundation, ראו docs/experience-audit.md §16).
 * לא היה test runner בפרויקט לפני זה כלל. jsdom כי חלק מהבדיקות מרנדרות
 * רכיבי "use client" אמיתיים (Reveal/CountUp/Statement/StudioApp) דרך
 * React Testing Library — לא רק פונקציות לוגיקה טהורות.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    exclude: ["node_modules/**", ".next/**"],
  },
});

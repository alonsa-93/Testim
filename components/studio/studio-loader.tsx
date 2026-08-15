"use client";

import dynamic from "next/dynamic";

/**
 * הסטודיו נטען בצד הלקוח בלבד (ללא SSR): מצב העריכה חי ב-localStorage,
 * וטעינה כזו מבטיחה שהטיוטה השמורה נטענת מיד בלי אי-התאמות hydration.
 */
const StudioApp = dynamic(
  () => import("./studio-app").then((m) => m.StudioApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-slate-100 text-slate-500">
        טוען את הסטודיו…
      </div>
    ),
  }
);

export function StudioLoader() {
  return <StudioApp />;
}

import { getBlockDef } from "@/components/blocks/registry";
import { ExperienceProvider } from "./experience-provider";
import { ExperienceScene } from "./experience-scene";
import { ExperienceLayerRenderer } from "./experience-layer";
import { ExperienceTarget } from "./experience-target";
import type { Page } from "@/lib/page";
import type { Theme } from "@/lib/theme";

/**
 * מרנדר block reference יחיד בתוך scene (§12.3, §104): עוטף ב-
 * ExperienceTarget בדיוק כמו freeform layers (Phase 6) -- אחרת ל-track
 * שמכוון ל-blockId הזה (למשל cta-entrance-track) אין שום אלמנט רשום
 * ב-TargetRegistry להניע. מיוצא (לא רק פנימי ל-ExperiencePage) כדי
 * שהתצוגה החיה של הסטודיו (Phase 7, experience-live-preview.tsx) תוכל
 * לעטוף בדיוק אותם block refs באותה נאמנות לדף הציבורי -- אין צנרת
 * preview כפולה.
 */
export function ExperienceBlockRefLayer({
  blockId,
  blocks,
  theme,
}: {
  blockId: string;
  blocks: Page["blocks"];
  theme?: Theme;
}) {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const def = getBlockDef(block.type);
  if (!def) return null;
  const Component = def.component;
  return (
    <ExperienceTarget id={blockId} as="div">
      <Component content={block.content} theme={theme} />
    </ExperienceTarget>
  );
}

/**
 * נקודת ההרכבה העליונה של Mode B — Scroll Experience (docs/experience-audit.md
 * §4.5). רכיב שרת רגיל (בלי "use client") — מרכיב את ה-Provider (client)
 * וילדיו, בדיוק כמו ש-PageRenderer מרכיב Reveal/CountUp/TiltCard היום.
 * ה-caller (page.tsx) אחראי לבדוק page.experience?.enabled ולנפול
 * בחזרה ל-PageRenderer הרגיל אם לא (§1 מסמך התיקון: Standard נשאר ברירת
 * המחדל, Experience הוא page-level capability אופציונלי).
 */
export function ExperiencePage({ page, theme }: { page: Page; theme?: Theme }) {
  const config = page.experience;
  if (!config) return null;

  return (
    <ExperienceProvider config={config}>
      {config.scenes.map((scene) => (
        <ExperienceScene key={scene.id} scene={scene}>
          {scene.layers.map((layer) => (
            <ExperienceLayerRenderer key={layer.id} layer={layer} blocks={page.blocks} theme={theme} />
          ))}
          {scene.blockRefs?.map((blockId) => (
            <ExperienceBlockRefLayer key={blockId} blockId={blockId} blocks={page.blocks} theme={theme} />
          ))}
        </ExperienceScene>
      ))}
    </ExperienceProvider>
  );
}

import { getBlockDef } from "@/components/blocks/registry";
import { ExperienceProvider } from "./experience-provider";
import { ExperienceScene } from "./experience-scene";
import { ExperienceLayerRenderer } from "./experience-layer";
import { ExperienceTarget } from "./experience-target";
import type { Page } from "@/lib/page";
import type { Theme } from "@/lib/theme";

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
          {scene.blockRefs?.map((blockId) => {
            const block = page.blocks.find((b) => b.id === blockId);
            if (!block) return null;
            const def = getBlockDef(block.type);
            if (!def) return null;
            const Component = def.component;
            // עוטפים ב-ExperienceTarget בדיוק כמו freeform layers (Phase 6) --
            // אחרת ל-track שמכוון ל-blockId הזה (למשל cta-entrance-track) אין
            // שום אלמנט רשום ב-TargetRegistry להניע (§104: הגשר לבלוקים קיימים
            // חייב לספק זהות בת-מיקוד, לא רק לרנדר את הבלוק כמות שהוא).
            return (
              <ExperienceTarget key={blockId} id={blockId} as="div">
                <Component content={block.content} theme={theme} />
              </ExperienceTarget>
            );
          })}
        </ExperienceScene>
      ))}
    </ExperienceProvider>
  );
}

import type { Page, PageBlockInstance } from "@/lib/page";
import type { Theme } from "@/lib/theme";
import { getBlockDef, PINNED_BOTTOM, PINNED_TOP } from "@/components/blocks/registry";

/**
 * מרנדר דף שלם מתוך אובייקט Page.
 * הניווט תמיד נעוץ לראש העמוד והפוטר לתחתיתו (מבנה HTML תקין),
 * וכל שאר הבלוקים מרונדרים בתוך <main> לפי הסדר שנקבע בסטודיו.
 * עוגני סקשנים: המופע הראשון של בלוק מקבל את העוגן הקנוני שלו
 * (#features), מופעים נוספים מקבלים סיומת רצה (#features-2) —
 * כדי שלא ייווצרו id כפולים ב-DOM.
 * theme (שלב ב'): מועבר הלאה לכל בלוק כדי שיוכל לפתור ברירות מחדל של
 * אנימציה/כרטיסים/כפתורים מהערכה הפעילה בלי לייבא אותה בעצמו.
 */
export function PageRenderer({ page, theme }: { page: Page; theme?: Theme }) {
  const nav = page.blocks.find((b) => b.type === PINNED_TOP);
  const footer = page.blocks.find((b) => b.type === PINNED_BOTTOM);
  const body = page.blocks.filter(
    (b) => b.type !== PINNED_TOP && b.type !== PINNED_BOTTOM
  );

  const anchorCounts = new Map<string, number>();
  const render = (block: PageBlockInstance) => {
    const def = getBlockDef(block.type);
    if (!def) return null;
    let anchor: string | undefined;
    if (def.anchor) {
      const n = (anchorCounts.get(block.type) ?? 0) + 1;
      anchorCounts.set(block.type, n);
      anchor = n === 1 ? def.anchor : `${def.anchor}-${n}`;
    }
    const Component = def.component;
    return (
      <Component key={block.id} content={block.content} anchor={anchor} theme={theme} />
    );
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-btn bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:start-3"
      >
        דילוג לתוכן הראשי
      </a>
      {nav && render(nav)}
      <main id="main">{body.map(render)}</main>
      {footer && render(footer)}
    </>
  );
}

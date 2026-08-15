import type { Page } from "@/lib/page";
import { getBlockDef, PINNED_BOTTOM, PINNED_TOP } from "@/components/blocks/registry";

/**
 * מרנדר דף שלם מתוך אובייקט Page.
 * הניווט תמיד נעוץ לראש העמוד והפוטר לתחתיתו (מבנה HTML תקין),
 * וכל שאר הבלוקים מרונדרים בתוך <main> לפי הסדר שנקבע בסטודיו.
 */
export function PageRenderer({ page }: { page: Page }) {
  const nav = page.blocks.find((b) => b.type === PINNED_TOP);
  const footer = page.blocks.find((b) => b.type === PINNED_BOTTOM);
  const body = page.blocks.filter(
    (b) => b.type !== PINNED_TOP && b.type !== PINNED_BOTTOM
  );

  const render = (block: { id: string; type: string; content: Record<string, unknown> }) => {
    const def = getBlockDef(block.type);
    if (!def) return null;
    const Component = def.component;
    return <Component key={block.id} content={block.content} />;
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

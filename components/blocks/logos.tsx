import { Container } from "@/components/ui/section";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface LogosContent {
  title: string;
  items: string[];
}

const defaults: LogosContent = {
  title: "מלווים את הלקוחות של",
  items: ["קבוצת אשדר", "רשת H&O", "מלונות פתאל", "בנק הפועלים", "משרד עו״ד גולן"],
};

/**
 * פס הוכחה חברתית טקסטואלי — שמות מותגים בפונט הכותרות.
 * סקשן נמוך במכוון (לא py-section מלא) כדי לשבת צמוד להירו.
 */
function Logos({
  content,
  anchor,
}: {
  content: BlockContent;
  anchor?: string;
}) {
  const c = { ...defaults, ...content } as LogosContent;

  return (
    <section id={anchor ?? "logos"} className="border-y border-line bg-surface/40 py-10">
      <Container>
        {c.title && (
          <p className="mb-6 text-center text-sm font-semibold tracking-wide text-muted">
            {c.title}
          </p>
        )}
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {c.items.map((name, i) => (
            <li
              key={i}
              className="font-heading text-xl font-bold text-muted/80"
            >
              {name}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export const logosBlock: BlockDef = {
  type: "logos",
  label: "פס לוגואים / הוכחה חברתית",
  description: "שורת שמות של לקוחות או פרסומים — מחזק אמינות מיד אחרי ההירו",
  component: Logos,
  anchor: "logos",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "title", type: "text", label: "כותרת קטנה מעל השמות" },
    { key: "items", type: "strings", label: "השמות", itemLabel: "שם" },
  ],
};

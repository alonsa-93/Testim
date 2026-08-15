import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { ANIM_FIELDS, resolveBlockAnim, staggerChild } from "@/lib/effects";
import { cn } from "@/lib/cn";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

interface GalleryContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Array<{ imageUrl: string; caption: string }>;
}

const defaults: GalleryContent = {
  eyebrow: "מהעבודות שלנו",
  title: "פרויקטים שמדברים בעד עצמם",
  subtitle: "מבחר קטן מהשנים האחרונות — נשמח להראות לכם עוד בפגישה.",
  items: [
    { imageUrl: "", caption: "דירת גג, תל אביב" },
    { imageUrl: "", caption: "בית פרטי, פרדס חנה" },
    { imageUrl: "", caption: "מטבח ופינת אוכל, רמת גן" },
    { imageUrl: "", caption: "סוויטת הורים, הרצליה" },
    { imageUrl: "", caption: "משרד ביתי, חיפה" },
    { imageUrl: "", caption: "סלון משפחתי, מודיעין" },
  ],
};

/** קומפוזיציה דקורטיבית בצבעי הערכה — placeholder כשאין תמונה */
const placeholderStyles = [
  "bg-gradient-to-br from-primary to-primary-hover",
  "bg-gradient-to-b from-accent/70 to-accent/30",
  "bg-gradient-to-tr from-primary/80 to-accent/50",
];

function Gallery({
  content,
  anchor,
  theme,
}: {
  content: BlockContent;
  anchor?: string;
  theme?: Theme;
}) {
  const c = { ...defaults, ...content } as GalleryContent;
  const anim = resolveBlockAnim(theme?.effects, content);
  const tilt = theme?.effects.cardStyle === "tilt";

  return (
    <Section id={anchor ?? "gallery"} className="bg-surface/60">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {c.items.map((item, i) => {
          const frame = (
            <div className={cn("ds-card aspect-[4/3] overflow-hidden rounded-card border border-line shadow-card")}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- כתובות תמונה חופשיות מהעורך, ללא קונפיגורציית דומיינים
                <img
                  src={item.imageUrl}
                  alt={item.caption}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={`size-full ${placeholderStyles[i % placeholderStyles.length]}`}
                />
              )}
            </div>
          );
          return (
            <li key={i}>
              <Reveal anim={staggerChild(anim, i)}>
                <figure>
                  {tilt ? <TiltCard className="rounded-card">{frame}</TiltCard> : frame}
                  {item.caption && (
                    <figcaption className="mt-3 text-sm font-medium text-muted">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export const galleryBlock: BlockDef = {
  type: "gallery",
  label: "גלריית עבודות",
  description: "רשת תמונות עם כיתובים; בלי תמונה מוצגת קומפוזיציה בצבעי הערכה",
  component: Gallery,
  anchor: "gallery",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    {
      key: "items",
      type: "list",
      label: "הפריטים",
      itemLabel: "עבודה",
      titleKey: "caption",
      fields: [
        {
          key: "imageUrl",
          type: "text",
          label: "כתובת תמונה",
          hint: "אפשר להשאיר ריק — יוצג ריבוע צבע מהערכה. או להדביק קישור לתמונה / שם קובץ מתיקיית public/",
        },
        { key: "caption", type: "text", label: "כיתוב" },
      ],
    },
    ...ANIM_FIELDS,
  ],
};

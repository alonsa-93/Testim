import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/fx/reveal";
import { ANIM_FIELDS, resolveBlockAnim } from "@/lib/effects";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

interface VideoContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  videoTitle: string;
}

const defaults: VideoContent = {
  eyebrow: "רגע לפני שנדבר",
  title: "צפו איך זה נראה מבפנים",
  subtitle: "דקה וחצי שמסבירות את התהליך טוב יותר מכל טקסט.",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  videoTitle: "סרטון תדמית",
};

/**
 * ממיר כתובת YouTube/Vimeo רגילה לכתובת הטמעה.
 * YouTube מוטמע דרך youtube-nocookie — בלי עוגיות מעקב עד שהצופה מנגן.
 */
function toEmbedUrl(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/
  );
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function Video({
  content,
  anchor,
  theme,
}: {
  content: BlockContent;
  anchor?: string;
  theme?: Theme;
}) {
  const c = { ...defaults, ...content } as VideoContent;
  const embedUrl = toEmbedUrl(c.videoUrl);
  const anim = resolveBlockAnim(theme?.effects, content);

  return (
    <Section id={anchor ?? "video"}>
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <Reveal anim={anim} className="mx-auto max-w-3xl">
        {embedUrl ? (
          <div className="ds-card aspect-video overflow-hidden rounded-card border border-line shadow-card">
            <iframe
              src={embedUrl}
              title={c.videoTitle || "סרטון"}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full border-0"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card border border-dashed border-line bg-surface text-center">
            <p className="max-w-xs text-muted">
              הדביקו בשדה ״כתובת הסרטון״ קישור רגיל ל-YouTube או Vimeo —
              והסרטון יופיע כאן.
            </p>
          </div>
        )}
      </Reveal>
    </Section>
  );
}

export const videoBlock: BlockDef = {
  type: "video",
  label: "וידאו מוטמע",
  description: "סרטון YouTube או Vimeo בתוך הדף — לתדמית או הסבר",
  component: Video,
  anchor: "video",
  defaults: defaults as unknown as BlockContent,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת הסקשן" },
    { key: "subtitle", type: "textarea", label: "משפט הסבר" },
    {
      key: "videoUrl",
      type: "text",
      label: "כתובת הסרטון",
      hint: "קישור רגיל, למשל https://www.youtube.com/watch?v=XXXX או https://vimeo.com/123456",
    },
    { key: "videoTitle", type: "text", label: "שם הסרטון (לנגישות)" },
    ...ANIM_FIELDS,
  ],
};

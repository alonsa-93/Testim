import type { ImageLayerContent } from "@/lib/experience";

/**
 * Image layer (Phase 6, docs/experience-audit.md §12.6, §36 במסמך התיקון):
 * alt חובה, אלא אם decorative=true — אז aria-hidden ו-alt ריק, בדיוק
 * כמו כל תמונה דקורטיבית אחרת בקוד (למשל הכתמים ב-hero.tsx).
 */
export function ImageLayer({ content }: { content: ImageLayerContent }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- כתובת חופשית מהעורך, כמו gallery.tsx
    <img
      src={content.src}
      alt={content.decorative ? "" : content.alt}
      aria-hidden={content.decorative ? "true" : undefined}
      loading="lazy"
      className="size-full object-cover"
    />
  );
}

import { Button } from "@/components/ui/button";
import type { ButtonLayerContent } from "@/lib/experience";

/** Button layer (Phase 6): עוטף את ה-Button הקיים -- אין ספריית כפתורים שנייה */
export function ButtonLayer({ content }: { content: ButtonLayerContent }) {
  return (
    <Button href={content.href} variant={content.variant ?? "primary"}>
      {content.label}
    </Button>
  );
}

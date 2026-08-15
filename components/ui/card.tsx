import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        // ds-card: מאמצת את מיפוי data-fx-card של הערכה (globals.css) —
        // כשcardStyle="flat/glass/tilt" הכללים שם דורסים את הצל/הגבול
        // הבסיסיים כאן; ל-"raised" (ברירת המחדל) הם לא-פעולה
        "ds-card rounded-card border border-line bg-surface shadow-card",
        className
      )}
      {...props}
    />
  );
}

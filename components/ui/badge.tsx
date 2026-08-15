import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * תגית קטנה. variant="dot" — טקסט רגיל עם נקודת accent (לכותרות-על);
 * variant="accent" — רקע accent מלא (למשל "הכי משתלם" במחירון).
 */
export function Badge({
  variant = "dot",
  className,
  children,
}: {
  variant?: "dot" | "accent" | "outline";
  className?: string;
  children: ReactNode;
}) {
  if (variant === "accent") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-btn bg-accent px-3 py-1 text-sm font-bold text-on-accent",
          className
        )}
      >
        {children}
      </span>
    );
  }
  if (variant === "outline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-1 text-sm font-medium text-muted",
          className
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-bold tracking-wide text-primary",
        className
      )}
    >
      <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </span>
  );
}

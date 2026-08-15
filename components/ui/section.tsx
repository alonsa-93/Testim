import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-shell px-5 md:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("py-section", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/** כותרת סקשן אחידה: כותרת-על עם נקודת accent, כותרת ותת-כותרת */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "mb-12 max-w-2xl md:mb-16",
        align === "center" ? "mx-auto text-center" : "text-start"
      )}
    >
      {eyebrow && <Badge>{eyebrow}</Badge>}
      <h2 className="mt-3 text-h2 text-ink">{title}</h2>
      {subtitle && <p className="mt-4 text-lead text-muted">{subtitle}</p>}
    </div>
  );
}

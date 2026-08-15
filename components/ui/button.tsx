import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "inverted";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-btn font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-card hover:bg-primary-hover",
  outline:
    "border border-line bg-transparent text-ink hover:border-primary hover:text-primary",
  ghost: "text-primary hover:bg-primary/10",
  // לשימוש על רקע primary (למשל בבאנר CTA)
  inverted: "bg-on-primary text-primary hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3",
  lg: "px-8 py-3.5 text-lead",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  /** אם מועבר href — הכפתור מרונדר כקישור */
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children" | "onClick">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  target,
  rel,
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

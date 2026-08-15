import { cloneElement, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const inputBase =
  "w-full rounded-field border border-line bg-bg px-4 py-3 text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none aria-invalid:border-danger";

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea className={cn(inputBase, "min-h-28 resize-y", className)} {...props} />
  );
}

/**
 * עטיפת שדה טופס נגישה: label מקושר, סימון חובה,
 * והודעת שגיאה עם role="alert" שמוכרז לקורא מסך.
 * ה-"*" הוויזואלי מוסתר מקוראי מסך (aria-hidden) כי חובה מתוקשרת
 * במפורש דרך aria-required על שדה הקלט עצמו, לא רק ויזואלית.
 */
export function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {required && isValidElement<{ "aria-required"?: boolean }>(children)
        ? cloneElement(children, { "aria-required": true })
        : children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

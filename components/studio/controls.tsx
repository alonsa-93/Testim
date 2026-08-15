"use client";

import { useId, type ReactNode } from "react";

/**
 * פקדי העריכה של הסטודיו.
 * שימו לב: הסטודיו עצמו מעוצב בצבעים קבועים (slate) ולא בטוקנים של
 * הערכה — כדי שעריכת הערכה לא תשנה את ממשק העורך, רק את התצוגה החיה.
 */

export function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function normalizeHex(value: string): string {
  let h = value.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toUpperCase()}` : "#000000";
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-8 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0.5"
        />
        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} — ערך הקסדצימלי`}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "px",
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-slate-600">
          {label}
        </label>
        <span className="font-mono text-xs text-slate-500" dir="ltr">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full cursor-pointer accent-indigo-600"
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  dir,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl";
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type="text"
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-pointer accent-indigo-600"
      />
      <label htmlFor={id} className="cursor-pointer text-sm text-slate-600">
        {label}
      </label>
    </div>
  );
}

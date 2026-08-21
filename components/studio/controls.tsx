"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * פקדי העריכה של הסטודיו.
 * שימו לב: הסטודיו עצמו מעוצב בצבעים קבועים (slate) ולא בטוקנים של
 * הערכה — כדי שעריכת הערכה לא תשנה את ממשק העורך, רק את התצוגה החיה.
 */

export function PanelSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  badge,
}: {
  title: string;
  children: ReactNode;
  /** סקשן מתקפל (details/summary) — הדרך המרכזית לצמצם את "מיליון התפריטים":
   * פקדים בשימוש מדי-פעם/נדיר מתקפלים כברירת מחדל, והכול נשאר נגיש בקליק. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** תג קטן ליד הכותרת — למשל ספירת שינויים ("2 שינויים") כשהסקשן סגור,
   * כדי ששינוי קיים לעולם לא ייעלם מהעין רק כי הסקשן מקופל. */
  badge?: ReactNode;
}) {
  if (!collapsible) {
    return (
      <section className="space-y-4">
        <h2 className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
          <span>{title}</span>
          {badge}
        </h2>
        {children}
      </section>
    );
  }
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer select-none items-center justify-between border-b border-slate-200 pb-2 text-sm font-bold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xs text-slate-400 transition-transform group-open:rotate-90">
            ◂
          </span>
          {title}
        </span>
        {badge}
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}

/** תג "N שינויים" לסקשן מקופל — מוצג רק כשיש באמת שינויים מול ערכת הבסיס */
export function ModifiedBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
      {count === 1 ? "שינוי אחד" : `${count} שינויים`}
    </span>
  );
}

/**
 * כפתור האיפוס ↺ ‏(Webflow's blue-label pattern, ux-report B5):
 * מופיע רק כש-isModified הוא true, ולוחצים עליו כדי למחוק את
 * הדריסה/להחזיר לערך ברירת המחדל — בלי דיאלוג אישור, כי זה שדה
 * בודד ולא פעולה הרסנית.
 */
export function ResetButton({
  label,
  onReset,
}: {
  label: string;
  onReset: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onReset}
      title="איפוס לברירת המחדל"
      aria-label={`איפוס ${label} לברירת המחדל`}
      className="cursor-pointer rounded-md px-1 text-sm leading-none text-indigo-500 hover:text-indigo-700"
    >
      <span aria-hidden="true">↺</span>
    </button>
  );
}

/** מוסיף props של איפוס-שדה (isModified/onReset) לכל פקד קיים */
interface ResettableProps {
  isModified?: boolean;
  onReset?: () => void;
}

/** מנרמל הקס: מוסיף #, מרחיב קיצור בן 3 תווים; מחזיר null אם לא תקין */
function tryNormalizeHex(value: string): string | null {
  let h = value.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toUpperCase()}` : null;
}

/**
 * שדה צבע: בוחר צבע + קלט הקס. ערך לא תקין מקבל מסגרת אדומה,
 * לא נשמר לערכה, וב-blur חוזרים לערך התקין האחרון — כך שערך
 * פגום לעולם לא מגיע לטיוטה או לקובץ המיוצא.
 */
export function ColorField({
  label,
  value,
  onChange,
  isModified,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & ResettableProps) {
  const id = useId();
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  // הערך השתנה מבחוץ (בוחר הצבע, "תקן", החלפת ערכה) — מסנכרנים את הקלט
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }
  const invalid = tryNormalizeHex(text) === null;

  const handleText = (raw: string) => {
    setText(raw);
    const normalized = tryNormalizeHex(raw);
    if (normalized) onChange(normalized);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm text-slate-600">
          {label}
        </label>
        {isModified && onReset && <ResetButton label={label} onReset={onReset} />}
      </span>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={tryNormalizeHex(value) ?? "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-8 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0.5"
        />
        <input
          type="text"
          dir="ltr"
          value={text}
          onChange={(e) => handleText(e.target.value)}
          onBlur={() => {
            const normalized = tryNormalizeHex(text);
            setText(normalized ?? value);
          }}
          aria-label={`${label} — ערך הקסדצימלי`}
          aria-invalid={invalid}
          className={`w-24 rounded-md border px-2 py-1.5 font-mono text-xs text-slate-800 focus:outline-none ${
            invalid
              ? "border-red-500 bg-red-50 focus:border-red-500"
              : "border-slate-300 focus:border-indigo-500"
          }`}
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
  isModified,
  onReset,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
} & ResettableProps) {
  const id = useId();
  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1">
          <label htmlFor={id} className="text-sm text-slate-600">
            {label}
          </label>
          {isModified && onReset && <ResetButton label={label} onReset={onReset} />}
        </span>
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
  isModified,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
} & ResettableProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm text-slate-600">
          {label}
        </label>
        {isModified && onReset && <ResetButton label={label} onReset={onReset} />}
      </span>
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
  onBlur,
  dir,
  hint,
  isModified,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  dir?: "ltr" | "rtl";
  hint?: string;
} & ResettableProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm text-slate-600">
          {label}
        </label>
        {isModified && onReset && <ResetButton label={label} onReset={onReset} />}
      </span>
      <input
        id={id}
        type="text"
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
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
  isModified,
  onReset,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
} & ResettableProps) {
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
      {isModified && onReset && <ResetButton label={label} onReset={onReset} />}
    </div>
  );
}

/**
 * שורת צ'יפים (segmented control): הפקד החוזר לכל בחירה סגורה
 * "מוצגת בבת אחת" בסטודיו — עוצמת אנימציה, סוג רקע, סגנון כרטיסים,
 * זוהר, סגנון כפתורים. נבנה פעם אחת כאן כדי לא לשכפל את אותו
 * ה-markup חמש פעמים (WORKPLAN 4C).
 */
export function ChipRow({
  label,
  value,
  onChange,
  options,
  hint,
  isModified,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
} & ResettableProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1">
        <span className="text-sm text-slate-600">{label}</span>
        {isModified && onReset && <ResetButton label={label} onReset={onReset} />}
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === o.value
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

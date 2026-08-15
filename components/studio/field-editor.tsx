"use client";

import { useId, useState } from "react";
import { ICONS } from "@/components/icon-registry";
import { emptyItem, type FieldDef } from "@/lib/fields";
import {
  CheckboxField,
  ResetButton,
  SelectField,
  SliderField,
} from "@/components/studio/controls";

/**
 * עורך שדות גנרי: מקבל סכמת שדות של בלוק ובונה ממנה טופס עריכה.
 * תומך בטקסט, פסקה, כן/לא, בחירת אייקון, רשימת מחרוזות ורשימת פריטים
 * מורכבים — כך שבלוק חדש מקבל ממשק עריכה בלי לכתוב ממשק חדש.
 */

const inputCls =
  "w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none";

const iconBtnCls =
  "flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";

export function FieldEditor({
  field,
  value,
  onChange,
  isModified,
  onReset,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
  /** האם השדה נדרס מברירת המחדל של הבלוק — מציג ↺ ליד התווית (WORKPLAN 4C) */
  isModified?: boolean;
  onReset?: () => void;
}) {
  const id = useId();

  if (field.type === "boolean") {
    return (
      <CheckboxField
        label={field.label}
        checked={Boolean(value)}
        onChange={onChange}
        isModified={isModified}
        onReset={onReset}
      />
    );
  }

  if (field.type === "icon") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1">
          <label htmlFor={id} className="text-sm text-slate-600">
            {field.label}
          </label>
          {isModified && onReset && <ResetButton label={field.label} onReset={onReset} />}
        </span>
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} cursor-pointer bg-white`}
        >
          {Object.entries(ICONS).map(([key, icon]) => (
            <option key={key} value={key}>
              {icon.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex flex-col gap-1.5">
        <SelectField
          label={field.label}
          value={String(value ?? field.options[0]?.value ?? "")}
          onChange={(v) => onChange(v)}
          options={field.options}
          isModified={isModified}
          onReset={onReset}
        />
        {field.hint && <p className="text-xs text-slate-400">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <SliderField
        label={field.label}
        value={typeof value === "number" ? value : field.min}
        onChange={(v) => onChange(v)}
        min={field.min}
        max={field.max}
        step={field.step}
        unit={field.unit}
        isModified={isModified}
        onReset={onReset}
      />
    );
  }

  if (field.type === "strings") {
    const items = Array.isArray(value) ? (value as string[]) : [];
    const update = (next: string[]) => onChange(next);
    return (
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1">
          <span className="text-sm text-slate-600">{field.label}</span>
          {isModified && onReset && <ResetButton label={field.label} onReset={onReset} />}
        </span>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                update(next);
              }}
              aria-label={`${field.itemLabel} ${i + 1}`}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => update(items.filter((_, j) => j !== i))}
              aria-label={`מחיקת ${field.itemLabel} ${i + 1}`}
              className={iconBtnCls}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...items, ""])}
          className="cursor-pointer self-start text-sm font-semibold text-indigo-600 hover:underline"
        >
          + הוספת {field.itemLabel}
        </button>
      </div>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value)
      ? (value as Array<Record<string, unknown>>)
      : [];
    return (
      <ListEditor
        field={field}
        items={items}
        onChange={(next) => onChange(next)}
        isModified={isModified}
        onReset={onReset}
      />
    );
  }

  // text / textarea
  const Tag = field.type === "textarea" ? "textarea" : "input";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm text-slate-600">
          {field.label}
        </label>
        {isModified && onReset && <ResetButton label={field.label} onReset={onReset} />}
      </span>
      <Tag
        id={id}
        value={String(value ?? "")}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        rows={field.type === "textarea" ? 3 : undefined}
        className={field.type === "textarea" ? `${inputCls} resize-y` : inputCls}
      />
      {field.hint && <p className="text-xs text-slate-400">{field.hint}</p>}
    </div>
  );
}

function ListEditor({
  field,
  items,
  onChange,
  isModified,
  onReset,
}: {
  field: Extract<FieldDef, { type: "list" }>;
  items: Array<Record<string, unknown>>;
  onChange: (next: Array<Record<string, unknown>>) => void;
  isModified?: boolean;
  onReset?: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setOpenIndex(to);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1">
        <span className="text-sm font-medium text-slate-600">{field.label}</span>
        {isModified && onReset && <ResetButton label={field.label} onReset={onReset} />}
      </span>

      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const title = String(item[field.titleKey] ?? "") || `${field.itemLabel} ${i + 1}`;
        return (
          <div key={i} className="rounded-md border border-slate-200">
            <div className="flex items-center gap-1 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex-1 cursor-pointer truncate px-1.5 text-start text-sm font-medium text-slate-700"
              >
                {isOpen ? "▾" : "▸"} {title}
              </button>
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={`הזזת ${title} למעלה`}
                className={iconBtnCls}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label={`הזזת ${title} למטה`}
                className={iconBtnCls}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(items.filter((_, j) => j !== i));
                  setOpenIndex(null);
                }}
                aria-label={`מחיקת ${title}`}
                className={iconBtnCls}
              >
                ✕
              </button>
            </div>

            {isOpen && (
              <div className="space-y-3 p-3">
                {field.fields.map((sub) => (
                  <FieldEditor
                    key={sub.key}
                    field={sub}
                    value={item[sub.key]}
                    onChange={(next) => {
                      const copy = [...items];
                      copy[i] = { ...copy[i], [sub.key]: next };
                      onChange(copy);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => {
          onChange([...items, emptyItem(field.fields)]);
          setOpenIndex(items.length);
        }}
        className="cursor-pointer self-start text-sm font-semibold text-indigo-600 hover:underline"
      >
        + הוספת {field.itemLabel}
      </button>
    </div>
  );
}

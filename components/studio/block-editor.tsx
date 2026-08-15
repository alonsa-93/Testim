"use client";

import { getBlockDef } from "@/components/blocks/registry";
import { FieldEditor } from "@/components/studio/field-editor";
import { ChipRow } from "@/components/studio/controls";
import type { Page, PageBlockInstance } from "@/lib/page";
import type { FieldDef } from "@/lib/fields";

/**
 * עריכת התוכן של בלוק שנבחר.
 * השדות נבנים מסכמת השדות שהבלוק מצהיר עליה — אין כאן קוד ייעודי לבלוק.
 * שדות שמפתחם מתחיל ב-"anim" (ANIM_FIELDS, lib/effects.ts) מקובצים
 * חזותית לתת-סקשן "אנימציה" בתחתית: הפריסט כ-ChipRow, ושאר השדות
 * (סוג/משך/עיכוב/סטאגר/פעם-ראשונה) תחת "מתקדם ▾" מקופל כברירת מחדל.
 */

type PageUpdater = Page | ((prev: Page) => Page);

export function BlockEditor({
  block,
  onChange,
  onBack,
  onNotice,
  onReplay,
}: {
  block: PageBlockInstance;
  onChange: (next: PageUpdater) => void;
  onBack: () => void;
  /** הודעת flash() של הסטודיו — עם אפשרות ל"ביטול" (undo toast) */
  onNotice: (kind: "ok" | "error", text: string, onUndo?: () => void) => void;
  /** מפעיל מחדש את אנימציות התצוגה החיה — נקרא כששדה אנימציה משתנה */
  onReplay: () => void;
}) {
  const def = getBlockDef(block.type);
  if (!def) {
    return (
      <p className="text-sm text-red-600">
        סוג הבלוק ״{block.type}״ אינו מוכר במערכת.
      </p>
    );
  }

  const content = { ...def.defaults, ...block.content };
  const isFieldModified = (key: string) =>
    Object.prototype.hasOwnProperty.call(block.content, key);

  const setField = (key: string, value: unknown) => {
    onChange((p) => ({
      ...p,
      blocks: p.blocks.map((b) =>
        b.id === block.id ? { ...b, content: { ...b.content, [key]: value } } : b
      ),
    }));
  };

  const resetField = (key: string) => {
    onChange((p) => ({
      ...p,
      blocks: p.blocks.map((b) => {
        if (b.id !== block.id) return b;
        const nextContent = { ...b.content };
        delete nextContent[key];
        return { ...b, content: nextContent };
      }),
    }));
  };

  const setAnimField = (key: string, value: unknown) => {
    setField(key, value);
    onReplay();
  };
  const resetAnimField = (key: string) => {
    resetField(key);
    onReplay();
  };

  const resetBlock = () => {
    const previousContent = block.content;
    onChange((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === block.id ? { ...b, content: {} } : b)),
    }));
    onReplay();
    onNotice("ok", `התוכן של "${def.label}" אופס לדוגמה`, () => {
      onChange((p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === block.id ? { ...b, content: previousContent } : b
        ),
      }));
      onReplay();
    });
  };

  const contentFields = def.fields.filter((f) => !f.key.startsWith("anim"));
  const animFields = def.fields.filter((f) => f.key.startsWith("anim"));
  const presetField = animFields.find(
    (f): f is Extract<FieldDef, { type: "select" }> =>
      f.key === "animPreset" && f.type === "select"
  );
  const advancedFields = animFields.filter((f) => f.key !== "animPreset");
  const advancedModified = advancedFields.some((f) => isFieldModified(f.key));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline"
        >
          → כל הבלוקים
        </button>
        <h2 className="truncate text-sm font-bold text-slate-900">{def.label}</h2>
        <button
          type="button"
          onClick={resetBlock}
          className="shrink-0 cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-900 hover:underline"
        >
          אפס בלוק
        </button>
      </div>

      {contentFields.map((field) => (
        <FieldEditor
          key={field.key}
          field={field}
          value={content[field.key]}
          onChange={(value) => setField(field.key, value)}
          isModified={isFieldModified(field.key)}
          onReset={() => resetField(field.key)}
        />
      ))}

      {animFields.length > 0 && (
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold text-slate-900">אנימציה</h3>

          {presetField && (
            <ChipRow
              label={presetField.label}
              value={String(content[presetField.key] ?? presetField.options[0]?.value ?? "")}
              onChange={(v) => setAnimField(presetField.key, v)}
              options={presetField.options}
              hint={presetField.hint}
              isModified={isFieldModified(presetField.key)}
              onReset={() => resetAnimField(presetField.key)}
            />
          )}

          {advancedFields.length > 0 && (
            <details open={advancedModified || undefined} className="group">
              <summary className="cursor-pointer select-none text-xs font-semibold text-indigo-600">
                מתקדם ▾
              </summary>
              <div className="mt-3 space-y-3">
                {advancedFields.map((field) => (
                  <FieldEditor
                    key={field.key}
                    field={field}
                    value={content[field.key]}
                    onChange={(value) => setAnimField(field.key, value)}
                    isModified={isFieldModified(field.key)}
                    onReset={() => resetAnimField(field.key)}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

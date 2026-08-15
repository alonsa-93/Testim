"use client";

import { getBlockDef } from "@/components/blocks/registry";
import { FieldEditor } from "@/components/studio/field-editor";
import type { Page, PageBlockInstance } from "@/lib/page";

/**
 * עריכת התוכן של בלוק שנבחר.
 * השדות נבנים מסכמת השדות שהבלוק מצהיר עליה — אין כאן קוד ייעודי לבלוק.
 */
export function BlockEditor({
  page,
  block,
  onChange,
  onBack,
}: {
  page: Page;
  block: PageBlockInstance;
  onChange: (next: Page) => void;
  onBack: () => void;
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

  const setField = (key: string, value: unknown) => {
    onChange({
      ...page,
      blocks: page.blocks.map((b) =>
        b.id === block.id
          ? { ...b, content: { ...content, [key]: value } }
          : b
      ),
    });
  };

  const resetBlock = () => {
    if (!window.confirm(`לאפס את התוכן של "${def.label}" לתוכן הדוגמה?`)) return;
    onChange({
      ...page,
      blocks: page.blocks.map((b) =>
        b.id === block.id
          ? { ...b, content: structuredClone(def.defaults) }
          : b
      ),
    });
  };

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
        <h2 className="text-sm font-bold text-slate-900">{def.label}</h2>
      </div>

      {def.fields.map((field) => (
        <FieldEditor
          key={field.key}
          field={field}
          value={content[field.key]}
          onChange={(value) => setField(field.key, value)}
        />
      ))}

      <button
        type="button"
        onClick={resetBlock}
        className="cursor-pointer text-sm text-slate-500 hover:text-slate-900 hover:underline"
      >
        איפוס הבלוק לתוכן הדוגמה
      </button>
    </div>
  );
}

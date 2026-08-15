"use client";

import { useState } from "react";
import {
  blockDefs,
  getBlockDef,
  PINNED_BOTTOM,
  PINNED_TOP,
} from "@/components/blocks/registry";
import { newBlockId, type Page, type PageBlockInstance } from "@/lib/page";

/**
 * טאב "מבנה הדף": רשימת הבלוקים בדף עם סידור, מחיקה והוספה.
 * הניווט והפוטר מוצגים כנעוצים — הם תמיד בראש ובתחתית הדף.
 */

const rowBtn =
  "flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";

function BlockRow({
  block,
  pinned,
  selected,
  reorderable,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: PageBlockInstance;
  pinned?: string;
  selected: boolean;
  reorderable?: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const def = getBlockDef(block.type);
  const label = def?.label ?? block.type;
  return (
    <div
      className={`flex items-center gap-1 rounded-md border p-1.5 ${
        selected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(block.id)}
        className="flex-1 cursor-pointer truncate px-1.5 text-start"
      >
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {pinned && <span className="text-xs text-slate-400">נעוץ {pinned}</span>}
      </button>
      {reorderable && (
        <>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`הזזת ${label} למעלה`}
            className={rowBtn}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`הזזת ${label} למטה`}
            className={rowBtn}
          >
            ↓
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => onRemove(block.id)}
        aria-label={`מחיקת ${label}`}
        className={rowBtn}
      >
        ✕
      </button>
    </div>
  );
}

export function StructurePanel({
  page,
  onChange,
  selectedId,
  onSelect,
}: {
  page: Page;
  onChange: (next: Page) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  const nav = page.blocks.find((b) => b.type === PINNED_TOP);
  const footer = page.blocks.find((b) => b.type === PINNED_BOTTOM);
  const body = page.blocks.filter(
    (b) => b.type !== PINNED_TOP && b.type !== PINNED_BOTTOM
  );

  const commit = (nextBody: PageBlockInstance[]) => {
    onChange({
      ...page,
      blocks: [...(nav ? [nav] : []), ...nextBody, ...(footer ? [footer] : [])],
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= body.length) return;
    const next = [...body];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  };

  const remove = (id: string) => {
    const block = page.blocks.find((b) => b.id === id);
    const def = block && getBlockDef(block.type);
    if (!window.confirm(`למחוק את הבלוק "${def?.label ?? id}" מהדף?`)) return;
    onChange({ ...page, blocks: page.blocks.filter((b) => b.id !== id) });
  };

  const add = (type: string) => {
    const def = getBlockDef(type);
    if (!def) return;
    const instance: PageBlockInstance = {
      id: newBlockId(type, page.blocks),
      type,
      // בלוק חדש נכנס עם תוכן הדוגמה שלו, כדי שיהיה מה לערוך
      content: structuredClone(def.defaults),
    };
    if (type === PINNED_TOP) {
      onChange({ ...page, blocks: [instance, ...page.blocks] });
    } else if (type === PINNED_BOTTOM) {
      onChange({ ...page, blocks: [...page.blocks, instance] });
    } else {
      commit([...body, instance]);
    }
    setPicking(false);
    onSelect(instance.id);
  };

  const usedTypes = new Set(page.blocks.map((b) => b.type));
  const available = blockDefs.filter((d) => !(d.singleton && usedTypes.has(d.type)));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {nav && (
          <BlockRow
            block={nav}
            pinned="לראש הדף"
            selected={selectedId === nav.id}
            onSelect={onSelect}
            onRemove={remove}
          />
        )}
        {body.map((b, i) => (
          <BlockRow
            key={b.id}
            block={b}
            selected={selectedId === b.id}
            onSelect={onSelect}
            onRemove={remove}
            onMoveUp={i === 0 ? undefined : () => move(i, i - 1)}
            onMoveDown={i === body.length - 1 ? undefined : () => move(i, i + 1)}
            reorderable
          />
        ))}
        {footer && (
          <BlockRow
            block={footer}
            pinned="לתחתית הדף"
            selected={selectedId === footer.id}
            onSelect={onSelect}
            onRemove={remove}
          />
        )}
        {page.blocks.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            הדף ריק — הוסיפו בלוק ראשון
          </p>
        )}
      </div>

      {picking ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">בחרו בלוק להוספה</p>
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="cursor-pointer text-sm text-slate-500 hover:text-slate-900"
            >
              ביטול
            </button>
          </div>
          {available.map((d) => (
            <button
              key={d.type}
              type="button"
              onClick={() => add(d.type)}
              className="w-full cursor-pointer rounded-md border border-slate-200 bg-white p-2.5 text-start hover:border-indigo-400"
            >
              <span className="block text-sm font-semibold text-slate-800">
                {d.label}
              </span>
              <span className="block text-xs text-slate-500">{d.description}</span>
            </button>
          ))}
          {available.length === 0 && (
            <p className="p-2 text-sm text-slate-400">
              כל הבלוקים כבר נמצאים בדף
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="w-full cursor-pointer rounded-md border border-dashed border-indigo-400 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
        >
          + הוספת בלוק
        </button>
      )}
    </div>
  );
}

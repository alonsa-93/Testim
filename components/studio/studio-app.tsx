"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { themes, getDefaultTheme } from "@/themes";
import { pages, getDefaultPage } from "@/pages-data";
import {
  FONTS,
  SHADOW_LABELS,
  themeToStyle,
  type FontId,
  type ShadowLevel,
  type Theme,
  type ThemeColors,
} from "@/lib/theme";
import { bestTextOn } from "@/lib/contrast";
import { emptyPage, looksLikePage, normalizePage, type Page } from "@/lib/page";
import { PageRenderer } from "@/components/page-renderer";
import { StructurePanel } from "@/components/studio/structure-panel";
import { BlockEditor } from "@/components/studio/block-editor";
import {
  CheckboxField,
  ColorField,
  PanelSection,
  SelectField,
  SliderField,
  TextField,
} from "@/components/studio/controls";
import { ContrastPanel } from "@/components/studio/contrast-panel";

const THEME_DRAFT_KEY = "testim-studio-draft";
const PAGE_DRAFT_KEY = "testim-studio-page";
const PILL_RADIUS = 999;

type Viewport = "desktop" | "tablet" | "mobile";
const viewports: Record<Viewport, { label: string; width: string }> = {
  desktop: { label: "מחשב", width: "100%" },
  tablet: { label: "טאבלט", width: "820px" },
  mobile: { label: "נייד", width: "400px" },
};

/** בדיקת צורה בסיסית לקובץ ערכה מיובא */
function looksLikeTheme(obj: unknown): obj is Theme {
  if (typeof obj !== "object" || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    typeof t.colors === "object" &&
    typeof t.typography === "object" &&
    typeof t.shape === "object" &&
    typeof t.layout === "object" &&
    typeof t.effects === "object"
  );
}

/** טעינת טיוטה שמורה (הסטודיו נטען ללא SSR, כך שזה בטוח) */
function readDraft<T>(key: string, guard: (v: unknown) => v is T): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function download(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StudioApp() {
  const [theme, setTheme] = useState<Theme>(
    () => readDraft(THEME_DRAFT_KEY, looksLikeTheme) ?? structuredClone(getDefaultTheme())
  );
  const [page, setPage] = useState<Page>(() => {
    const draft = readDraft(PAGE_DRAFT_KEY, looksLikePage);
    return draft ? normalizePage(draft) : structuredClone(getDefaultPage());
  });
  const [tab, setTab] = useState<"structure" | "design">("structure");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [baseId, setBaseId] = useState(getDefaultTheme().id);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // שמירה אוטומטית של הטיוטות
  useEffect(() => {
    try {
      localStorage.setItem(THEME_DRAFT_KEY, JSON.stringify(theme));
    } catch {
      // localStorage חסום — הסטודיו ממשיך לעבוד בלי שמירה
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(PAGE_DRAFT_KEY, JSON.stringify(page));
    } catch {
      // כנ״ל
    }
  }, [page]);

  const flash = (kind: "ok" | "error", text: string) => {
    // ביטול הטיימר הקודם — אחרת הודעה ישנה מוחקת את החדשה מוקדם מדי
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  /** סניטציה של מזהים — רצה ב-blur ובייצוא, לא בכל הקשה (שומר על הסמן) */
  const sanitizeId = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const setColor = (key: keyof ThemeColors, value: string) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));
  const setTypography = <K extends keyof Theme["typography"]>(
    key: K,
    value: Theme["typography"][K]
  ) => setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value } }));
  const setShape = <K extends keyof Theme["shape"]>(
    key: K,
    value: Theme["shape"][K]
  ) => setTheme((t) => ({ ...t, shape: { ...t.shape, [key]: value } }));
  const setLayout = <K extends keyof Theme["layout"]>(
    key: K,
    value: Theme["layout"][K]
  ) => setTheme((t) => ({ ...t, layout: { ...t.layout, [key]: value } }));

  function loadBaseTheme(id: string) {
    const base = themes.find((t) => t.id === id);
    if (!base) return;
    if (
      !window.confirm(
        `להחליף את העיצוב הנוכחי בערכה "${base.name}"? שינויי עיצוב שלא יוצאו יאבדו.`
      )
    )
      return;
    setBaseId(id);
    setTheme(structuredClone(base));
  }

  function loadPage(id: string) {
    const source = pages.find((p) => p.id === id);
    if (!source) return;
    if (!window.confirm(`לפתוח את הדף "${source.name}"? השינויים הנוכחיים יאבדו.`))
      return;
    setPage(structuredClone(source));
    setSelectedBlockId(null);
    const pageTheme = themes.find((t) => t.id === source.themeId);
    if (pageTheme) {
      setBaseId(pageTheme.id);
      setTheme(structuredClone(pageTheme));
    }
  }

  function startNewPage() {
    if (!window.confirm("להתחיל דף חדש וריק? השינויים הנוכחיים יאבדו.")) return;
    setPage(emptyPage());
    setSelectedBlockId(null);
  }

  function fixOnColor(key: "onPrimary" | "onAccent") {
    setTheme((t) => ({
      ...t,
      colors: {
        ...t.colors,
        [key]: bestTextOn(key === "onPrimary" ? t.colors.primary : t.colors.accent),
      },
    }));
  }

  function downloadPage() {
    // הדף נשמר עם מזהה הערכה שנערכה איתו, כדי שייראה זהה גם אחרי הפרסום
    const id = sanitizeId(page.id) || "page";
    download({ ...page, id, themeId: sanitizeId(theme.id) || "theme" }, `${id}.json`);
    flash("ok", `הקובץ ${id}.json ירד — שמרו אותו בתיקיית pages-data/`);
  }

  function downloadTheme() {
    const id = sanitizeId(theme.id) || "theme";
    download({ ...theme, id }, `${id}.json`);
    flash("ok", `הקובץ ${id}.json ירד — שמרו אותו בתיקיית themes/`);
  }

  /** ייבוא חכם: מזהה לבד אם הקובץ הוא דף או ערכה */
  async function importJson(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (looksLikePage(parsed)) {
        // נרמול משלים מזהי בלוקים חסרים/כפולים — בלעדיו עריכה זולגת בין בלוקים
        setPage(normalizePage(parsed));
        setSelectedBlockId(null);
        flash("ok", `הדף "${parsed.name}" נטען`);
        return;
      }
      if (looksLikeTheme(parsed)) {
        setTheme(parsed);
        flash("ok", `הערכה "${parsed.name}" נטענה`);
        return;
      }
      flash("error", "הקובץ אינו דף ואינו ערכה של המערכת");
    } catch {
      flash("error", "לא ניתן לקרוא את הקובץ — ודאו שזה JSON תקין");
    }
  }

  const isPill = theme.shape.buttonRadius >= PILL_RADIUS;
  const selectedBlock = page.blocks.find((b) => b.id === selectedBlockId) ?? null;
  const activeTheme = themes.find((t) => t.id === baseId);

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      {/* סרגל עליון */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            → חזרה לאתר
          </Link>
          <h1 className="text-lg font-bold">סטודיו הדפים</h1>
        </div>

        <div
          className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 md:flex"
          role="group"
          aria-label="גודל תצוגה"
        >
          {(Object.keys(viewports) as Viewport[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewport(v)}
              aria-pressed={viewport === v}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
                viewport === v
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {viewports[v].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJson(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ייבוא
          </button>
          <button
            type="button"
            onClick={downloadTheme}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            הורדת הערכה
          </button>
          <button
            type="button"
            onClick={downloadPage}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
          >
            הורדת הדף
          </button>
        </div>
      </header>

      {notice && (
        <p
          role="status"
          className={`border-b px-5 py-2 text-sm font-medium ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* פאנל העריכה */}
        <aside className="flex max-h-[48dvh] w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-e">
          <div className="flex shrink-0 gap-1 border-b border-slate-200 p-2">
            {(
              [
                ["structure", "מבנה ותוכן"],
                ["design", "עיצוב"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-bold ${
                  tab === key
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-5">
            {tab === "structure" ? (
              selectedBlock ? (
                <BlockEditor
                  page={page}
                  block={selectedBlock}
                  onChange={setPage}
                  onBack={() => setSelectedBlockId(null)}
                />
              ) : (
                <>
                  <PanelSection title="הדף שאני עורך">
                    <TextField
                      label="שם הדף"
                      value={page.name}
                      onChange={(v) => setPage((p) => ({ ...p, name: v }))}
                    />
                    <TextField
                      label="מזהה (באנגלית)"
                      dir="ltr"
                      value={page.id}
                      onChange={(v) => setPage((p) => ({ ...p, id: v }))}
                      onBlur={() =>
                        setPage((p) => ({ ...p, id: sanitizeId(p.id) }))
                      }
                      hint="קובע את הכתובת: /p/<מזהה> — אותיות לטיניות, ספרות ומקפים"
                    />
                    <TextField
                      label="כותרת לדפדפן ולגוגל"
                      value={page.meta.title}
                      onChange={(v) =>
                        setPage((p) => ({ ...p, meta: { ...p.meta, title: v } }))
                      }
                    />
                    <TextField
                      label="תיאור לגוגל"
                      value={page.meta.description}
                      onChange={(v) =>
                        setPage((p) => ({
                          ...p,
                          meta: { ...p.meta, description: v },
                        }))
                      }
                    />
                    <p className="rounded-md bg-slate-50 p-2.5 text-xs text-slate-500">
                      העיצוב מגיע מהערכה{" "}
                      <span className="font-bold">{theme.name}</span> — לשינוי
                      צבעים ופונטים עברו לטאב ״עיצוב״.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={startNewPage}
                        className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        דף חדש וריק
                      </button>
                      {pages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => loadPage(pages[0].id)}
                          className="cursor-pointer text-sm font-semibold text-slate-500 hover:underline"
                        >
                          טעינת ״{pages[0].name}״
                        </button>
                      )}
                    </div>
                  </PanelSection>

                  <PanelSection title="הבלוקים בדף">
                    <StructurePanel
                      page={page}
                      onChange={setPage}
                      selectedId={selectedBlockId}
                      onSelect={setSelectedBlockId}
                    />
                  </PanelSection>

                  <div className="rounded-lg bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-500">
                    <p className="font-bold text-slate-700">איך מפרסמים את הדף?</p>
                    <p className="mt-1">
                      לוחצים ״הורדת הדף״, שומרים את הקובץ בתיקיית{" "}
                      <code dir="ltr" className="font-mono">pages-data/</code>{" "}
                      ומוסיפים לו שורה ב־
                      <code dir="ltr" className="font-mono">pages-data/index.ts</code>.
                      הדף יעלה בכתובת{" "}
                      <code dir="ltr" className="font-mono">/p/{page.id || "..."}</code>.
                    </p>
                  </div>
                </>
              )
            ) : (
              <>
                <PanelSection title="ערכת בסיס">
                  <SelectField
                    label="מתחילים מ־"
                    value={baseId}
                    onChange={loadBaseTheme}
                    options={themes.map((t) => ({ value: t.id, label: t.name }))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const base = activeTheme ?? getDefaultTheme();
                      if (!window.confirm(`לאפס את כל שינויי העיצוב ולחזור ל"${base.name}"?`))
                        return;
                      setTheme(structuredClone(base));
                    }}
                    className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    איפוס העיצוב לערכת הבסיס
                  </button>
                </PanelSection>

                <PanelSection title="זהות הערכה">
                  <TextField
                    label="שם הערכה"
                    value={theme.name}
                    onChange={(v) => setTheme((t) => ({ ...t, name: v }))}
                  />
                  <TextField
                    label="מזהה (באנגלית)"
                    dir="ltr"
                    value={theme.id}
                    onChange={(v) => setTheme((t) => ({ ...t, id: v }))}
                    onBlur={() =>
                      setTheme((t) => ({ ...t, id: sanitizeId(t.id) }))
                    }
                    hint="שם הקובץ וכתובת /preview — אותיות לטיניות, ספרות ומקפים"
                  />
                </PanelSection>

                <PanelSection title="צבעים">
                  <ColorField label="ראשי (primary)" value={theme.colors.primary} onChange={(v) => setColor("primary", v)} />
                  <ColorField label="ראשי במעבר עכבר" value={theme.colors.primaryHover} onChange={(v) => setColor("primaryHover", v)} />
                  <ColorField label="טקסט על ראשי" value={theme.colors.onPrimary} onChange={(v) => setColor("onPrimary", v)} />
                  <ColorField label="מבטא (accent)" value={theme.colors.accent} onChange={(v) => setColor("accent", v)} />
                  <ColorField label="טקסט על מבטא" value={theme.colors.onAccent} onChange={(v) => setColor("onAccent", v)} />
                  <ColorField label="רקע העמוד" value={theme.colors.background} onChange={(v) => setColor("background", v)} />
                  <ColorField label="רקע כרטיסים" value={theme.colors.surface} onChange={(v) => setColor("surface", v)} />
                  <ColorField label="טקסט ראשי" value={theme.colors.text} onChange={(v) => setColor("text", v)} />
                  <ColorField label="טקסט משני" value={theme.colors.textMuted} onChange={(v) => setColor("textMuted", v)} />
                  <ColorField label="קווי מסגרת" value={theme.colors.border} onChange={(v) => setColor("border", v)} />
                </PanelSection>

                <PanelSection title="נגישות — ניגודיות צבעים">
                  <ContrastPanel theme={theme} onFix={fixOnColor} />
                </PanelSection>

                <PanelSection title="טיפוגרפיה">
                  <SelectField
                    label="פונט כותרות"
                    value={theme.typography.fontHeading}
                    onChange={(v) => setTypography("fontHeading", v as FontId)}
                    options={Object.entries(FONTS).map(([id, f]) => ({ value: id, label: f.label }))}
                  />
                  <SelectField
                    label="פונט טקסט רץ"
                    value={theme.typography.fontBody}
                    onChange={(v) => setTypography("fontBody", v as FontId)}
                    options={Object.entries(FONTS).map(([id, f]) => ({ value: id, label: f.label }))}
                  />
                  <SliderField
                    label="גודל טקסט בסיס"
                    value={theme.typography.baseSize}
                    onChange={(v) => setTypography("baseSize", v)}
                    min={14}
                    max={20}
                  />
                  <SliderField
                    label="סולם כותרות (דרמטיות)"
                    value={theme.typography.scale}
                    onChange={(v) => setTypography("scale", v)}
                    min={1.1}
                    max={1.4}
                    step={0.01}
                    unit=""
                  />
                  <SelectField
                    label="משקל כותרות"
                    value={String(theme.typography.headingWeight)}
                    onChange={(v) => setTypography("headingWeight", Number(v))}
                    options={[
                      { value: "500", label: "בינוני (500)" },
                      { value: "600", label: "מודגש קלות (600)" },
                      { value: "700", label: "מודגש (700)" },
                      { value: "800", label: "כבד (800)" },
                    ]}
                  />
                </PanelSection>

                <PanelSection title="צורה ופינות">
                  <SliderField
                    label="עיגול כרטיסים"
                    value={theme.shape.cardRadius}
                    onChange={(v) => setShape("cardRadius", v)}
                    min={0}
                    max={32}
                  />
                  <CheckboxField
                    label="כפתורי גלולה (עגולים לגמרי)"
                    checked={isPill}
                    onChange={(checked) => setShape("buttonRadius", checked ? PILL_RADIUS : 12)}
                  />
                  <SliderField
                    label="עיגול כפתורים"
                    value={isPill ? 32 : theme.shape.buttonRadius}
                    onChange={(v) => setShape("buttonRadius", v)}
                    min={0}
                    max={32}
                    disabled={isPill}
                  />
                  <SliderField
                    label="עיגול שדות טופס"
                    value={theme.shape.fieldRadius}
                    onChange={(v) => setShape("fieldRadius", v)}
                    min={0}
                    max={24}
                  />
                </PanelSection>

                <PanelSection title="פריסה ואפקטים">
                  <SliderField
                    label="ריווח בין סקשנים"
                    value={theme.layout.sectionSpacing}
                    onChange={(v) => setLayout("sectionSpacing", v)}
                    min={56}
                    max={144}
                    step={4}
                  />
                  <SliderField
                    label="רוחב תוכן מרבי"
                    value={theme.layout.maxWidth}
                    onChange={(v) => setLayout("maxWidth", v)}
                    min={960}
                    max={1440}
                    step={16}
                  />
                  <SelectField
                    label="צל כרטיסים"
                    value={theme.effects.shadow}
                    onChange={(v) =>
                      setTheme((t) => ({ ...t, effects: { shadow: v as ShadowLevel } }))
                    }
                    options={(Object.keys(SHADOW_LABELS) as ShadowLevel[]).map((s) => ({
                      value: s,
                      label: SHADOW_LABELS[s],
                    }))}
                  />
                </PanelSection>
              </>
            )}
          </div>
        </aside>

        {/* תצוגה חיה */}
        <main className="min-w-0 flex-1 overflow-auto p-3 md:p-6">
          <div
            className="mx-auto transition-all duration-300"
            style={{ maxWidth: viewports[viewport].width }}
          >
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="ms-3 truncate text-xs font-medium text-slate-400">
                  {page.name} · {theme.name}
                </span>
              </div>
              {/* translateZ(0) גורם ל-position:fixed בתוך התצוגה (כפתור וואטסאפ)
                  להיצמד למסגרת התצוגה במקום לחלון של הסטודיו */}
              <div
                style={themeToStyle(theme)}
                className="ds-scope [transform:translateZ(0)]"
              >
                {page.blocks.length > 0 ? (
                  <PageRenderer page={page} />
                ) : (
                  <p className="p-20 text-center text-muted">
                    הדף ריק. הוסיפו בלוק ראשון מהפאנל.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

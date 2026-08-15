"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { themes, getDefaultTheme } from "@/themes";
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
import { LandingPage } from "@/components/landing-page";
import {
  CheckboxField,
  ColorField,
  PanelSection,
  SelectField,
  SliderField,
  TextField,
} from "@/components/studio/controls";
import { ContrastPanel } from "@/components/studio/contrast-panel";

const DRAFT_KEY = "testim-studio-draft";
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

/** טעינת טיוטה שמורה מהביקור הקודם (הסטודיו נטען ללא SSR, כך שזה בטוח) */
function readDraft(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return looksLikeTheme(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function StudioApp() {
  const [theme, setTheme] = useState<Theme>(
    () => readDraft() ?? structuredClone(getDefaultTheme())
  );
  const [baseId, setBaseId] = useState(getDefaultTheme().id);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // שמירה אוטומטית של כל שינוי
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(theme));
    } catch {
      // localStorage מלא או חסום — הסטודיו ממשיך לעבוד בלי שמירה
    }
  }, [theme]);

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

  function loadBase(id: string) {
    const base = themes.find((t) => t.id === id);
    if (!base) return;
    if (
      !window.confirm(
        `להחליף את העריכה הנוכחית בערכה "${base.name}"? השינויים שלא יוצאו יאבדו.`
      )
    )
      return;
    setBaseId(id);
    setTheme(structuredClone(base));
  }

  function resetToBase() {
    const base = themes.find((t) => t.id === baseId) ?? getDefaultTheme();
    if (!window.confirm(`לאפס את כל השינויים ולחזור ל"${base.name}"?`)) return;
    setTheme(structuredClone(base));
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

  function downloadJson() {
    const blob = new Blob([JSON.stringify(theme, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.id || "theme"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setImportError("ההעתקה ללוח נחסמה — השתמשו בהורדת קובץ במקום");
    }
  }

  async function importJson(file: File) {
    setImportError(null);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!looksLikeTheme(parsed)) {
        setImportError("הקובץ אינו קובץ ערכה תקין של המערכת");
        return;
      }
      setTheme(parsed);
    } catch {
      setImportError("לא ניתן לקרוא את הקובץ — ודאו שזה JSON תקין");
    }
  }

  const isPill = theme.shape.buttonRadius >= PILL_RADIUS;

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
          <h1 className="text-lg font-bold">סטודיו העיצוב</h1>
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
            onClick={copyJson}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copied ? "הועתק ✓" : "העתקת JSON"}
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
          >
            הורדת הערכה
          </button>
        </div>
      </header>

      {importError && (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700">
          {importError}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* פאנל העריכה */}
        <aside className="max-h-[45dvh] w-full shrink-0 space-y-7 overflow-y-auto border-b border-slate-200 bg-white p-5 lg:max-h-none lg:w-[360px] lg:border-b-0 lg:border-e">
          <PanelSection title="ערכת בסיס">
            <SelectField
              label="מתחילים מ־"
              value={baseId}
              onChange={loadBase}
              options={themes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <button
              type="button"
              onClick={resetToBase}
              className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline"
            >
              איפוס השינויים לערכת הבסיס
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
              onChange={(v) =>
                setTheme((t) => ({
                  ...t,
                  id: v.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                }))
              }
              hint="משמש לשם הקובץ ולכתובת /preview — אותיות לטיניות, ספרות ומקפים"
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

          <div className="rounded-lg bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-500">
            <p className="font-bold text-slate-700">איך שומרים ערכה לתמיד?</p>
            <p className="mt-1">
              לוחצים על ״הורדת הערכה״, שומרים את הקובץ בתיקיית{" "}
              <code dir="ltr" className="font-mono">themes/</code> בפרויקט,
              ומוסיפים לו שורה ב־
              <code dir="ltr" className="font-mono">themes/index.ts</code>.
              מרגע זה הערכה תופיע גם כאן וגם ב־
              <code dir="ltr" className="font-mono">/preview</code>.
            </p>
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
                <span className="ms-3 text-xs font-medium text-slate-400">
                  תצוגה חיה — {theme.name}
                </span>
              </div>
              <div style={themeToStyle(theme)} className="bg-bg text-ink">
                <LandingPage />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

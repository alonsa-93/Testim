"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { themes, getDefaultTheme } from "@/themes";
import { pages, getDefaultPage } from "@/pages-data";
import {
  FONTS,
  SHADOW_LABELS,
  looksLikeTheme,
  normalizeTheme,
  type FontId,
  type ShadowLevel,
  type Theme,
  type ThemeColors,
} from "@/lib/theme";
import {
  ANIM_INTENSITY_LABELS,
  BACKGROUND_FX_LABELS,
  BUTTON_STYLE_LABELS,
  CARD_FX_LABELS,
  GLOW_LEVEL_LABELS,
  type AnimIntensity,
  type BackgroundFx,
  type ButtonStyle,
  type CardFx,
  type GlowLevel,
} from "@/lib/effects";
import { FONT_PAIRS } from "@/lib/font-pairs";
import { shuffleTheme } from "@/lib/shuffle";
import { bestTextOn } from "@/lib/contrast";
import { emptyPage, looksLikePage, normalizePage, type Page } from "@/lib/page";
import { PageRenderer } from "@/components/page-renderer";
import { ThemeScope } from "@/components/theme-scope";
import { StructurePanel } from "@/components/studio/structure-panel";
import { BlockEditor } from "@/components/studio/block-editor";
import {
  ChipRow,
  CheckboxField,
  ColorField,
  PanelSection,
  SelectField,
  SliderField,
  TextField,
} from "@/components/studio/controls";
import { ContrastPanel } from "@/components/studio/contrast-panel";
import { ExperienceEditor } from "@/components/studio/experience-editor";
import { ExperienceLivePreview } from "@/components/studio/experience-live-preview";
import { emptyExperience } from "@/lib/experience";

const THEME_DRAFT_KEY = "testim-studio-draft";
const PAGE_DRAFT_KEY = "testim-studio-page";
const PILL_RADIUS = 999;

type Viewport = "desktop" | "tablet" | "mobile";
const viewports: Record<Viewport, { label: string; width: string }> = {
  desktop: { label: "מחשב", width: "100%" },
  tablet: { label: "טאבלט", width: "820px" },
  mobile: { label: "נייד", width: "400px" },
};

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
  const [theme, setTheme] = useState<Theme>(() => {
    const draft = readDraft(THEME_DRAFT_KEY, looksLikeTheme);
    return draft ? normalizeTheme(draft) : structuredClone(getDefaultTheme());
  });
  const [page, setPage] = useState<Page>(() => {
    const draft = readDraft(PAGE_DRAFT_KEY, looksLikePage);
    return draft ? normalizePage(draft) : structuredClone(getDefaultPage());
  });
  const [tab, setTab] = useState<"structure" | "design">("structure");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [baseId, setBaseId] = useState(getDefaultTheme().id);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  // מצב עמוד: רגיל (Mode A, כברירת מחדל) לעומת חוויית גלילה (Mode B) --
  // §1 במסמך התיקון הסופי: "page-type mode selector" בין Standard
  // ל-Scroll-Experience. נגזר ישירות מ-page.experience?.enabled, לא
  // state כפול -- כך שאין שני מקורות אמת לאותה עובדה.
  const experienceMode = page.experience?.enabled === true;
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    { kind: "ok" | "error"; text: string; onUndo?: () => void } | null
  >(null);
  /** נבדק ב-key על ה-ThemeScope: כל שינוי מפעיל מחדש את כל אנימציות ה-reveal בתצוגה */
  const [replayKey, setReplayKey] = useState(0);
  /** data-studio-motion="off" בזמן עריכת תוכן — עוצר רעידות תצוגה תוך כדי הקלדה */
  const [typing, setTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // תצוגה מקדימה מקומית לתמונה בחוויית הגלילה: מפת layerId -> blob URL
  // זמני מקובץ שנבחר מהמחשב. במתכוון *לא* חלק מ-page — לעולם לא נכתב
  // ל-localStorage או לייצוא הדף (§ בקשת המשתמש: "לתצוגה בלבד, לא נשמר").
  // זורם רק לתצוגה החיה דרך ExperienceLivePreview/ExperienceLayerRenderer.
  const [imagePreviewOverrides, setImagePreviewOverridesState] = useState<Record<string, string>>({});
  const imagePreviewOverridesRef = useRef(imagePreviewOverrides);
  useEffect(() => {
    imagePreviewOverridesRef.current = imagePreviewOverrides;
  }, [imagePreviewOverrides]);

  const setImagePreview = useCallback((layerId: string, url: string | null) => {
    setImagePreviewOverridesState((prev) => {
      const old = prev[layerId];
      if (old) URL.revokeObjectURL(old);
      if (url === null) {
        if (!(layerId in prev)) return prev;
        const next = { ...prev };
        delete next[layerId];
        return next;
      }
      return { ...prev, [layerId]: url };
    });
  }, []);

  const clearAllImagePreviews = useCallback(() => {
    setImagePreviewOverridesState((prev) => {
      Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
      return {};
    });
  }, []);

  // ניקוי כל ה-blob URLs שנותרו כשעוזבים את הסטודיו (לא רק ברענון —
  // רענון כבר הורג אותם לבד, זה מכסה ניווט SPA בתוך האפליקציה)
  useEffect(() => {
    return () => {
      Object.values(imagePreviewOverridesRef.current).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

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

  const flash = (kind: "ok" | "error", text: string, onUndo?: () => void) => {
    // ביטול הטיימר הקודם — אחרת הודעה ישנה מוחקת את החדשה מוקדם מדי
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ kind, text, onUndo });
    // הודעה עם "ביטול" נשארת קצת יותר זמן — נותנים למשתמש הזדמנות אמיתית ללחוץ
    noticeTimer.current = setTimeout(() => setNotice(null), onUndo ? 6000 : 4000);
  };

  /** מפעיל מחדש את כל אנימציות ה-reveal בתצוגה החיה (remount, ראו ThemeScope key) */
  const bumpReplay = () => setReplayKey((k) => k + 1);

  /** מסמן "בזמן עריכה" לזמן קצר — מוצמד לאירועי קלט/שינוי בטאב מבנה ותוכן בלבד */
  const markTyping = () => {
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 500);
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
  const setEffects = <K extends keyof Theme["effects"]>(
    key: K,
    value: Theme["effects"][K]
  ) => setTheme((t) => ({ ...t, effects: { ...t.effects, [key]: value } }));
  const setAnimation = <K extends keyof Theme["effects"]["animation"]>(
    key: K,
    value: Theme["effects"]["animation"][K]
  ) =>
    setTheme((t) => ({
      ...t,
      effects: { ...t.effects, animation: { ...t.effects.animation, [key]: value } },
    }));

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
    setSelectedSceneId(null);
    setSelectedLayerId(null);
    clearAllImagePreviews();
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
    setSelectedSceneId(null);
    setSelectedLayerId(null);
    clearAllImagePreviews();
  }

  /** מתג מצב העמוד (§1 במסמך התיקון הסופי): לא מוחק נתוני Experience
   * כשעוברים חזרה ל"עמוד רגיל" — רק enabled=false, בדיוק כמו שה-no-
   * data-loss design של normalizeExperience מבטיח (lib/experience-normalize.ts).
   * המשתמש יכול לחזור לחוויית הגלילה בדיוק כמו שהשאיר אותה. */
  function setExperienceEnabled(enabled: boolean) {
    setPage((p) => ({ ...p, experience: { ...(p.experience ?? emptyExperience()), enabled } }));
    if (enabled) {
      setSelectedSceneId(null);
      setSelectedLayerId(null);
    }
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

  /** איפוס גלובלי: ערכה (עם אישור, ראו איפוסים בשלוש רמות ב-WORKPLAN 4C) */
  function resetThemeToBase() {
    const base = activeTheme ?? getDefaultTheme();
    if (!window.confirm(`לאפס את כל שינויי העיצוב ולחזור ל"${base.name}"?`)) return;
    const previous = theme;
    setTheme(structuredClone(base));
    bumpReplay();
    flash("ok", `העיצוב אופס לערכת "${base.name}"`, () => setTheme(previous));
  }

  /** איפוס גלובלי: דף — מוחק את כל דריסות התוכן ומחזיר כל בלוק לתוכן הדוגמה שלו */
  function resetPageContent() {
    if (page.blocks.length === 0) return;
    if (
      !window.confirm(
        "לאפס את כל תוכן הבלוקים בדף לתוכן הדוגמה? הפעולה משפיעה על כל הבלוקים בדף."
      )
    )
      return;
    const previousBlocks = page.blocks;
    setPage((p) => ({ ...p, blocks: p.blocks.map((b) => ({ ...b, content: {} })) }));
    bumpReplay();
    flash("ok", "כל תוכן הדף אופס לברירת המחדל", () =>
      setPage((p) => ({ ...p, blocks: previousBlocks }))
    );
  }

  /** 🎲 ערבב לי: קומבינציית פונט+פלטה+צורה+עוצמת אנימציה אקראית ומאוצרת מראש */
  function handleShuffle() {
    setTheme((t) => shuffleTheme(t));
    bumpReplay();
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
        setSelectedSceneId(null);
        setSelectedLayerId(null);
        clearAllImagePreviews();
        flash("ok", `הדף "${parsed.name}" נטען`);
        return;
      }
      if (looksLikeTheme(parsed)) {
        setTheme(normalizeTheme(parsed));
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

  // איפוס שדה-בודד (↺) לפקדי הערכה: "שונה" = הערך הנוכחי שונה מהערכה
  // הטעונה כבסיס (activeTheme). בלי בסיס ידוע (ערכה מיובאת) — אין מה
  // להשוות אליו, אז אף שדה לא מסומן "שונה".
  const colorModified = (key: keyof ThemeColors) =>
    !!activeTheme && theme.colors[key] !== activeTheme.colors[key];
  const resetColor = (key: keyof ThemeColors) => {
    if (activeTheme) setColor(key, activeTheme.colors[key]);
  };
  const typographyModified = <K extends keyof Theme["typography"]>(key: K) =>
    !!activeTheme && theme.typography[key] !== activeTheme.typography[key];
  const resetTypography = <K extends keyof Theme["typography"]>(key: K) => {
    if (activeTheme) setTypography(key, activeTheme.typography[key]);
  };
  const shapeModified = <K extends keyof Theme["shape"]>(key: K) =>
    !!activeTheme && theme.shape[key] !== activeTheme.shape[key];
  const resetShape = <K extends keyof Theme["shape"]>(key: K) => {
    if (activeTheme) setShape(key, activeTheme.shape[key]);
  };
  const layoutModified = <K extends keyof Theme["layout"]>(key: K) =>
    !!activeTheme && theme.layout[key] !== activeTheme.layout[key];
  const resetLayout = <K extends keyof Theme["layout"]>(key: K) => {
    if (activeTheme) setLayout(key, activeTheme.layout[key]);
  };
  const effectsModified = <K extends keyof Theme["effects"]>(key: K) =>
    !!activeTheme && theme.effects[key] !== activeTheme.effects[key];
  const resetEffects = <K extends keyof Theme["effects"]>(key: K) => {
    if (activeTheme) setEffects(key, activeTheme.effects[key]);
  };

  // "אנימציה" ברמת הערכה: 4 צ'יפים בלבד (כבוי/עדין/דינמי/פסיכי) —
  // "כבוי" הוא animation.style="none" (resolveAnim מחזיר null); שאר
  // הצ'יפים קובעים את animation.intensity ושומרים על style הקיים
  // (או "rise" אם היה "none" קודם, כדי שהמעבר מ"כבוי" יזיז משהו).
  const animChipValueOf = (t: Theme) =>
    t.effects.animation.style === "none" ? "off" : t.effects.animation.intensity;
  const animChipValue = animChipValueOf(theme);
  const animChipOptions = [
    { value: "off", label: "כבוי" },
    { value: "subtle", label: ANIM_INTENSITY_LABELS.subtle },
    { value: "dynamic", label: ANIM_INTENSITY_LABELS.dynamic },
    { value: "dramatic", label: ANIM_INTENSITY_LABELS.dramatic },
  ];
  const setAnimChip = (v: string) => {
    if (v === "off") {
      setAnimation("style", "none");
    } else {
      setTheme((t) => ({
        ...t,
        effects: {
          ...t.effects,
          animation: {
            style: t.effects.animation.style === "none" ? "rise" : t.effects.animation.style,
            intensity: v as AnimIntensity,
          },
        },
      }));
    }
    bumpReplay();
  };

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

        <div className="hidden items-center gap-2 md:flex">
          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
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
          <button
            type="button"
            onClick={bumpReplay}
            title="מריץ מחדש את אנימציות הכניסה בתצוגה החיה"
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span aria-hidden="true">↻</span> הפעל אנימציות
          </button>
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
          className={`flex items-center gap-3 border-b px-5 py-2 text-sm font-medium ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{notice.text}</span>
          {notice.onUndo && (
            <button
              type="button"
              onClick={() => {
                notice.onUndo?.();
                setNotice(null);
              }}
              className="cursor-pointer font-bold underline underline-offset-2 hover:no-underline"
            >
              ביטול
            </button>
          )}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* פאנל העריכה */}
        <aside className="flex max-h-[48dvh] w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-e">
          {/* בורר מצב עמוד (§1 במסמך התיקון הסופי): Standard (Mode A) לעומת
              Scroll Experience (Mode B) — שני "אפליקציות" נפרדות לגמרי בפאנל
              העריכה, לא עוד טאב בתוך אותה רשימה. תמיד מוצג (לא רק כש-
              page.experience כבר קיים!): זו הדרך היחידה להגיע בכלל למסך
              "הפעלת חוויית גלילה" (empty state בתוך ExperienceEditor) --
              דף טרי בלי experience חייב נקודת כניסה, אחרת אין שום דרך
              להפעיל Experience מהסטודיו בפעם הראשונה (נתפס לפני שהגיע
              לאימות בדפדפן אמיתי). */}
          <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => setExperienceEnabled(false)}
                aria-pressed={!experienceMode}
                className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-bold ${
                  !experienceMode ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                עמוד רגיל
              </button>
              <button
                type="button"
                onClick={() => setExperienceEnabled(true)}
                aria-pressed={experienceMode}
                className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-bold ${
                  experienceMode
                    ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                חוויית גלילה
              </button>
          </div>

          {experienceMode ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ExperienceEditor
                config={page.experience}
                onChange={(next) =>
                  setPage((p) => ({
                    ...p,
                    experience: typeof next === "function" ? next(p.experience ?? emptyExperience()) : next,
                  }))
                }
                selectedSceneId={selectedSceneId}
                onSelectScene={setSelectedSceneId}
                selectedLayerId={selectedLayerId}
                onSelectLayer={setSelectedLayerId}
                imagePreviewOverrides={imagePreviewOverrides}
                onSetImagePreview={setImagePreview}
              />
            </div>
          ) : (
            <>
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
              // data-studio-motion="off" בזמן עריכה (deliverable 5): נדבק כאן
              // בלבד — לא בטאב עיצוב — כי כאן משתנה תוכן/מבנה חי תוך כדי הקלדה.
              // בשלב-בועה (לא capture!): שדה מוקלד ידנית תמיד עדכן קודם; הדבקה
              // (Ctrl+V) היא event יחיד עם ה-value המלא, ואם markTyping רץ
              // ב-capture — *לפני* שה-onChange של השדה עצמו עדכן את ה-state —
              // ה-setState של typing מפעיל רינדור מתחרה שבולע את ההדבקה בפעם
              // הראשונה (התגלה ב-QA: הדבקה ראשונה נבלעת, הקלדה רגילה תקינה).
              // בשלב-בועה markTyping רץ *אחרי* ששדה היעד כבר עדכן את ה-state.
              <div
                onInput={markTyping}
                onChange={markTyping}
                className="space-y-7"
              >
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onChange={setPage}
                  onBack={() => setSelectedBlockId(null)}
                  onNotice={flash}
                  onReplay={bumpReplay}
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

                  {page.blocks.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={resetPageContent}
                        className="cursor-pointer text-sm font-semibold text-red-600 hover:underline"
                      >
                        אפס דף — מחיקת כל תוכן הבלוקים לדוגמה
                      </button>
                    </div>
                  )}
                </>
              )}
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-xs leading-relaxed text-indigo-900">
                    לא בטוחים מאיפה להתחיל? ״ערבב לי״ בוחר פונטים, צבעים, צורה
                    ועוצמת אנימציה בקומבינציה מוכנה מראש — עם ניגודיות תקינה
                    תמיד. אפשר ללחוץ שוב ושוב.
                  </p>
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="shrink-0 cursor-pointer rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90"
                  >
                    🎲 ערבב לי
                  </button>
                </div>

                <PanelSection title="ערכת בסיס">
                  <SelectField
                    label="מתחילים מ־"
                    value={baseId}
                    onChange={loadBaseTheme}
                    options={themes.map((t) => ({ value: t.id, label: t.name }))}
                  />
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
                  <ColorField label="ראשי (primary)" value={theme.colors.primary} onChange={(v) => setColor("primary", v)} isModified={colorModified("primary")} onReset={() => resetColor("primary")} />
                  <ColorField label="ראשי במעבר עכבר" value={theme.colors.primaryHover} onChange={(v) => setColor("primaryHover", v)} isModified={colorModified("primaryHover")} onReset={() => resetColor("primaryHover")} />
                  <ColorField label="טקסט על ראשי" value={theme.colors.onPrimary} onChange={(v) => setColor("onPrimary", v)} isModified={colorModified("onPrimary")} onReset={() => resetColor("onPrimary")} />
                  <ColorField label="מבטא (accent)" value={theme.colors.accent} onChange={(v) => setColor("accent", v)} isModified={colorModified("accent")} onReset={() => resetColor("accent")} />
                  <ColorField label="טקסט על מבטא" value={theme.colors.onAccent} onChange={(v) => setColor("onAccent", v)} isModified={colorModified("onAccent")} onReset={() => resetColor("onAccent")} />
                  <ColorField label="רקע העמוד" value={theme.colors.background} onChange={(v) => setColor("background", v)} isModified={colorModified("background")} onReset={() => resetColor("background")} />
                  <ColorField label="רקע כרטיסים" value={theme.colors.surface} onChange={(v) => setColor("surface", v)} isModified={colorModified("surface")} onReset={() => resetColor("surface")} />
                  <ColorField label="טקסט ראשי" value={theme.colors.text} onChange={(v) => setColor("text", v)} isModified={colorModified("text")} onReset={() => resetColor("text")} />
                  <ColorField label="טקסט משני" value={theme.colors.textMuted} onChange={(v) => setColor("textMuted", v)} isModified={colorModified("textMuted")} onReset={() => resetColor("textMuted")} />
                  <ColorField label="קווי מסגרת" value={theme.colors.border} onChange={(v) => setColor("border", v)} isModified={colorModified("border")} onReset={() => resetColor("border")} />
                </PanelSection>

                <PanelSection title="נגישות — ניגודיות צבעים">
                  <ContrastPanel theme={theme} onFix={fixOnColor} />
                </PanelSection>

                <PanelSection title="חבילות פונטים">
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_PAIRS.map((pair) => {
                      const active =
                        theme.typography.fontHeading === pair.fontHeading &&
                        theme.typography.fontBody === pair.fontBody;
                      return (
                        <button
                          key={pair.id}
                          type="button"
                          onClick={() => {
                            setTheme((t) => ({
                              ...t,
                              typography: {
                                ...t.typography,
                                fontHeading: pair.fontHeading,
                                fontBody: pair.fontBody,
                              },
                            }));
                          }}
                          title={pair.hint}
                          className={`cursor-pointer rounded-lg border p-2.5 text-start transition-colors ${
                            active
                              ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                              : "border-slate-200 bg-white hover:border-indigo-300"
                          }`}
                        >
                          <span
                            className="block truncate text-lg font-bold text-slate-900"
                            style={{ fontFamily: FONTS[pair.fontHeading].stack }}
                          >
                            אבג הטוב
                          </span>
                          <span
                            className="block truncate text-xs text-slate-500"
                            style={{ fontFamily: FONTS[pair.fontBody].stack }}
                          >
                            טקסט גוף לדוגמה
                          </span>
                          <span className="mt-1 block text-[11px] font-bold text-indigo-600">
                            {pair.vibe}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <details className="rounded-md border border-slate-200 p-2.5">
                    <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
                      התאמה ידנית ▾
                    </summary>
                    <div className="mt-3 space-y-4">
                      <SelectField
                        label="פונט כותרות"
                        value={theme.typography.fontHeading}
                        onChange={(v) => setTypography("fontHeading", v as FontId)}
                        options={Object.entries(FONTS).map(([id, f]) => ({ value: id, label: f.label }))}
                        isModified={typographyModified("fontHeading")}
                        onReset={() => resetTypography("fontHeading")}
                      />
                      <SelectField
                        label="פונט טקסט רץ"
                        value={theme.typography.fontBody}
                        onChange={(v) => setTypography("fontBody", v as FontId)}
                        options={Object.entries(FONTS).map(([id, f]) => ({ value: id, label: f.label }))}
                        isModified={typographyModified("fontBody")}
                        onReset={() => resetTypography("fontBody")}
                      />
                      <SliderField
                        label="גודל טקסט בסיס"
                        value={theme.typography.baseSize}
                        onChange={(v) => setTypography("baseSize", v)}
                        min={14}
                        max={20}
                        isModified={typographyModified("baseSize")}
                        onReset={() => resetTypography("baseSize")}
                      />
                      <SliderField
                        label="סולם כותרות (דרמטיות)"
                        value={theme.typography.scale}
                        onChange={(v) => setTypography("scale", v)}
                        min={1.1}
                        max={1.4}
                        step={0.01}
                        unit=""
                        isModified={typographyModified("scale")}
                        onReset={() => resetTypography("scale")}
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
                        isModified={typographyModified("headingWeight")}
                        onReset={() => resetTypography("headingWeight")}
                      />
                    </div>
                  </details>
                </PanelSection>

                <PanelSection title="צורה ופינות">
                  <SliderField
                    label="עיגול כרטיסים"
                    value={theme.shape.cardRadius}
                    onChange={(v) => setShape("cardRadius", v)}
                    min={0}
                    max={32}
                    isModified={shapeModified("cardRadius")}
                    onReset={() => resetShape("cardRadius")}
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
                    isModified={shapeModified("buttonRadius")}
                    onReset={() => resetShape("buttonRadius")}
                  />
                  <SliderField
                    label="עיגול שדות טופס"
                    value={theme.shape.fieldRadius}
                    onChange={(v) => setShape("fieldRadius", v)}
                    min={0}
                    max={24}
                    isModified={shapeModified("fieldRadius")}
                    onReset={() => resetShape("fieldRadius")}
                  />
                </PanelSection>

                <PanelSection title="פריסה">
                  <SliderField
                    label="ריווח בין סקשנים"
                    value={theme.layout.sectionSpacing}
                    onChange={(v) => setLayout("sectionSpacing", v)}
                    min={56}
                    max={144}
                    step={4}
                    isModified={layoutModified("sectionSpacing")}
                    onReset={() => resetLayout("sectionSpacing")}
                  />
                  <SliderField
                    label="רוחב תוכן מרבי"
                    value={theme.layout.maxWidth}
                    onChange={(v) => setLayout("maxWidth", v)}
                    min={960}
                    max={1440}
                    step={16}
                    isModified={layoutModified("maxWidth")}
                    onReset={() => resetLayout("maxWidth")}
                  />
                </PanelSection>

                <PanelSection title="אנימציה">
                  <ChipRow
                    label="עוצמת אנימציית כניסה לכל הדף"
                    value={animChipValue}
                    onChange={setAnimChip}
                    options={animChipOptions}
                    hint="בלוק בודד יכול לעקוף את זה תחת ״אנימציה״ בעורך הבלוק שלו"
                    isModified={!!activeTheme && animChipValue !== animChipValueOf(activeTheme)}
                    onReset={() => {
                      if (!activeTheme) return;
                      setAnimation("style", activeTheme.effects.animation.style);
                      setAnimation("intensity", activeTheme.effects.animation.intensity);
                      bumpReplay();
                    }}
                  />
                </PanelSection>

                <PanelSection title="רקע">
                  <ChipRow
                    label="סוג רקע דקורטיבי"
                    value={theme.effects.background}
                    onChange={(v) => setEffects("background", v as BackgroundFx)}
                    options={(Object.keys(BACKGROUND_FX_LABELS) as BackgroundFx[]).map((k) => ({
                      value: k,
                      label: BACKGROUND_FX_LABELS[k],
                    }))}
                    isModified={effectsModified("background")}
                    onReset={() => resetEffects("background")}
                  />
                  <SliderField
                    label="עוצמת הרקע"
                    value={Math.round(theme.effects.backgroundIntensity * 100)}
                    onChange={(v) => setEffects("backgroundIntensity", v / 100)}
                    min={0}
                    max={100}
                    step={5}
                    unit="%"
                    disabled={theme.effects.background === "none"}
                    isModified={effectsModified("backgroundIntensity")}
                    onReset={() => resetEffects("backgroundIntensity")}
                  />
                  <CheckboxField
                    label="שכבת גרעיניות-פילם עדינה"
                    checked={theme.effects.noise}
                    onChange={(v) => setEffects("noise", v)}
                    isModified={effectsModified("noise")}
                    onReset={() => resetEffects("noise")}
                  />
                </PanelSection>

                <PanelSection title="כרטיסים">
                  <ChipRow
                    label="סגנון כרטיסים"
                    value={theme.effects.cardStyle}
                    onChange={(v) => setEffects("cardStyle", v as CardFx)}
                    options={(Object.keys(CARD_FX_LABELS) as CardFx[]).map((k) => ({
                      value: k,
                      label: CARD_FX_LABELS[k],
                    }))}
                    isModified={effectsModified("cardStyle")}
                    onReset={() => resetEffects("cardStyle")}
                  />
                  <SelectField
                    label="צל כרטיסים"
                    value={theme.effects.shadow}
                    onChange={(v) => setEffects("shadow", v as ShadowLevel)}
                    options={(Object.keys(SHADOW_LABELS) as ShadowLevel[]).map((s) => ({
                      value: s,
                      label: SHADOW_LABELS[s],
                    }))}
                    isModified={effectsModified("shadow")}
                    onReset={() => resetEffects("shadow")}
                  />
                </PanelSection>

                <PanelSection title="זוהר">
                  <ChipRow
                    label="עוצמת זוהר (ספוטלייט, הילות)"
                    value={theme.effects.glow}
                    onChange={(v) => setEffects("glow", v as GlowLevel)}
                    options={(Object.keys(GLOW_LEVEL_LABELS) as GlowLevel[]).map((k) => ({
                      value: k,
                      label: GLOW_LEVEL_LABELS[k],
                    }))}
                    isModified={effectsModified("glow")}
                    onReset={() => resetEffects("glow")}
                  />
                  {theme.effects.glow !== "none" && (
                    <ColorField
                      label="צבע הזוהר"
                      value={theme.effects.glowColor ?? theme.colors.primary}
                      onChange={(v) => setEffects("glowColor", v)}
                      isModified={effectsModified("glowColor")}
                      onReset={() => resetEffects("glowColor")}
                    />
                  )}
                </PanelSection>

                <PanelSection title="כפתורים">
                  <ChipRow
                    label="סגנון כפתורים"
                    value={theme.effects.buttonStyle}
                    onChange={(v) => setEffects("buttonStyle", v as ButtonStyle)}
                    options={(Object.keys(BUTTON_STYLE_LABELS) as ButtonStyle[]).map((k) => ({
                      value: k,
                      label: BUTTON_STYLE_LABELS[k],
                    }))}
                    isModified={effectsModified("buttonStyle")}
                    onReset={() => resetEffects("buttonStyle")}
                  />
                </PanelSection>

                <div className="border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={resetThemeToBase}
                    className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    אפס ערכה לברירת מחדל
                  </button>
                </div>
              </>
            )}
          </div>
            </>
          )}
        </aside>

        {/* תצוגה חיה */}
        <main className="min-w-0 flex-1 overflow-auto p-3 md:p-6">
          <div
            className="mx-auto transition-all duration-300"
            style={{ maxWidth: viewports[viewport].width }}
          >
            {/* overflow-clip ולא overflow-hidden: קוצץ פינות עגולות בדיוק
                כמו hidden, אבל בניגוד ל-hidden הוא *לא* תיבת גלילה מבחינת
                CSS -- ולכן position:sticky בתוכן חוצה אותו ונאחז ב-<main
                overflow-auto> האמיתי מסביב (ראו R1, docs/experience-audit.md
                §3.1: זו הייתה השבירה השנייה, הבלתי-תלויה, שמנעה מ-sticky
                להיאחז בכלל בתוך הסטודיו). Phase 2. */}
            <div className="overflow-clip rounded-xl border border-slate-300 bg-white shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="ms-3 truncate text-xs font-medium text-slate-400">
                  {page.name} · {theme.name}
                </span>
              </div>
              {/* translateZ(0) גורם ל-position:fixed בתוך התצוגה (כפתור וואטסאפ)
                  להיצמד למסגרת התצוגה במקום לחלון של הסטודיו.
                  key={replayKey}: "הפעל אנימציות" מרענן את כל תת-העץ מחדש,
                  כך שכל Reveal מתחיל שוב מ-IntersectionObserver טרי וחוזר
                  לשחק את אנימציית הכניסה שלו (ראו components/fx/reveal.tsx). */}
              <ThemeScope
                key={replayKey}
                theme={theme}
                className="[transform:translateZ(0)]"
                motionOff={typing}
              >
                {experienceMode ? (
                  page.experience && page.experience.scenes.length > 0 ? (
                    <ExperienceLivePreview
                      page={page}
                      theme={theme}
                      selectedSceneId={selectedSceneId}
                      onSelectScene={setSelectedSceneId}
                      mode={viewport === "desktop" ? "base" : viewport}
                      imagePreviewOverrides={imagePreviewOverrides}
                    />
                  ) : (
                    <p className="p-20 text-center text-muted">
                      אין עדיין סצנות בחוויית הגלילה. הוסיפו את הראשונה מהפאנל.
                    </p>
                  )
                ) : page.blocks.length > 0 ? (
                  <PageRenderer page={page} theme={theme} />
                ) : (
                  <p className="p-20 text-center text-muted">
                    הדף ריק. הוסיפו בלוק ראשון מהפאנל.
                  </p>
                )}
              </ThemeScope>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

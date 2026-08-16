# Experience Engine — אודיט ארכיטקטוני ותוכנית עבודה

**סטטוס: תכנון בלבד. אפס קוד נכתב.**
מסמך זה הוא התוצר של Phase 0 לפי המפרט (סעיפים 122 ו-136): אודיט של
המערכת הקיימת, ניתוח פערים, ניתוח סיכונים, והצעת ארכיטקטורה, סכמה,
Studio UX ותוכנית שלבים — לפני שנכתבת שורת מימוש אחת.

נכתב לאחר קריאה בפועל של הריפו בענף `claude/page-design-system-febey3`,
כולל אימות אמפירי בדפדפן של ההנחות הקריטיות (ראו §3.1).

---

## 1. מה קיים היום — אודיט ארכיטקטוני

### 1.1 שלוש השכבות הקיימות

המערכת בנויה על הפרדה שאסור לשבור:

| שכבה | מקור אמת | קובץ |
|---|---|---|
| **Content** | `Page` JSON — אילו בלוקים, באיזה סדר, מה כתוב | `lib/page.ts`, `pages-data/*.json` |
| **Design** | `Theme` JSON — צבעים, פונטים, צורה, אפקטים | `lib/theme.ts`, `themes/*.json` |
| **Code** | 17 רכיבי בלוק טהורים | `components/blocks/*.tsx` |

זרימה בפועל:

```
theme.json → themeToCssVars() → --ds-* → @theme inline → Tailwind utilities ↘
                                                                             → Block
page.json  → PageRenderer → ordered blocks + content + anchor ──────────────↗
```

חוזה הבלוק (`lib/blocks.ts`) הוא בדיוק:

```ts
component: ComponentType<{ content: BlockContent; anchor?: string; theme?: Theme }>
```

`theme` נוסף בשלב ב' של מנוע האפקטים ומועבר על ידי `PageRenderer` לכל בלוק.
זו נקודת אחיזה קיימת וחשובה: **כבר יש ערוץ להעביר הקשר גלובלי לבלוק בלי
prop-drilling**, ואפשר להרחיב אותו לאותה מטרה עבור Experience.

### 1.2 עוטף הערכה — נקודת ההשתלבות הטבעית

`components/theme-scope.tsx` הוא הרכיב שכל דף וכל תצוגה עוברים דרכו:

```tsx
<div className="ds-scope" style={themeToStyle(theme)}
     data-fx-bg={...} data-fx-card={...} data-studio-motion={...}>
  <ThemeFxLayers effects={theme.effects} />
  {children}
</div>
```

`.ds-scope` ב-`globals.css` נושא `position: relative; isolation: isolate`.
זו **נקודת ההשתלבות הנכונה** ל-`ExperienceProvider`: הוא צריך לעטוף את
`PageRenderer` בתוך `ThemeScope`, לא מחוצה לו — כדי שכל משתני הערכה יהיו
זמינים לשכבות ה-Experience, ובלי לשנות את גבול ה-Server/Client של הדף.

### 1.3 אינוונטר התנועה הקיים

זה החלק הקריטי ביותר באודיט, כי הוא קובע מה מותר ל-Experience לגעת בו.

| מנגנון | סוג | מה הוא **בעלים** עליו | על איזה אלמנט |
|---|---|---|---|
| `Reveal` | client, IO | `opacity`, `translate`, `scale`, `filter` (דרך CSS) | ה-`div` שהוא עצמו מרנדר |
| `.split-word` | CSS | `opacity`, `translate`, `filter` | span לכל מילה |
| `.fx-statement-word` | CSS | `opacity` (מ-`--progress`) | span לכל מילה |
| `TiltCard` | client, pointer | `transform: perspective() rotateX() rotateY()` | ה-`div` של `.fx-tilt` |
| `.fx-lift` | CSS hover | `translate` | כרטיס |
| `.fx-btn-3d` / `.fx-btn-shine` | CSS hover/active | `translate` | כפתור |
| `.fx-steps-line` | CSS reveal-gated | `scale` | הקו בבלוק שלבים |
| `.fx-marquee-track` | CSS infinite | `translate` | מסלול המרקיז |
| `.fx-aurora i` | CSS infinite | `translate`, `scale` | בלובי הרקע |
| `.fx-beam-dot` | CSS infinite | `offset-distance` | נקודת האור |
| `.fx-halo` / `.fx-beam` fallback | CSS + `@property` | `--fx-angle` | פסאודו-אלמנט |
| `.text-shimmer` | CSS infinite | `background-position` | טקסט |
| `Button` | Tailwind | **`transition: all 200ms`** — כלומר *כל* מאפיין | כל CTA במערכת |
| `whatsapp` | Tailwind | `scale` + transition על ארבעת מאפייני ה-transform | הכפתור הצף |
| `faq` chevron | Tailwind | `rotate` (מונע מ-`details[open]`) | ה-svg |
| `marquee` slant | Tailwind | `rotate` | עוטף ה-track |
| `[data-fx-card="tilt"] .ds-card` | CSS | `transform-style: preserve-3d` | **כל** כרטיס בערכת tilt |

**תובנה מרכזית:** ה-CSS הקיים כבר משתמש במאפיינים העצמאיים
`translate` / `scale` (ולא ב-`transform` מרוכב) עבור `Reveal` — במכוון,
כדי לא להתנגש עם `transform` של `.fx-tilt`. ההערה בקוד אומרת זאת
במפורש. זו קונבנציה קיימת שה-Experience Engine **חייב** להמשיך, לא
להמציא מחדש.

### 1.4 מנגנון הגלילה הרציף היחיד שקיים

יש בדיוק אחד, ב-`components/blocks/statement.tsx`:

```
window scroll (passive) → rAF → getBoundingClientRect()
→ progress = clamp(-rect.top / (rect.height - innerHeight))
→ el.style.setProperty("--progress", progress)
→ CSS: .fx-statement-word { opacity: clamp(0.15, --progress * --n - --i, 1) }
```

מה שנכון בו ויש לשמר כזרע ל-runtime:
- כתיבה ישירה ל-CSS custom property, **אפס `setState` per frame**
- rAF throttling עם דגל `frame`
- ניקוי מלא ב-cleanup
- fallback ל-`var(--progress, 1)` — בלי JS הטקסט גלוי לגמרי
- `prefers-reduced-motion` → קובע 1 מיד ולא מאזין בכלל

מה שהוא **לא**: הוא מקומי לבלוק, קשור קשיח ל-`window`, ואין בו מושג של
scene, target, timeline או keyframes.

### 1.5 ארכיטקטורת הסטודיו

`components/studio/studio-app.tsx` (995 שורות, client, נטען עם
`next/dynamic ssr:false` דרך `studio-loader.tsx`).

- **State:** `theme`, `page`, `tab: "structure" | "design"`, `selectedBlockId`,
  `baseId`, `viewport`, `notice`, `replayKey`, `typing`
- **טיוטות:** כל שינוי ב-theme/page נכתב מיד ל-`localStorage`
- **תצוגה חיה:**
  ```
  <main className="... overflow-auto">        ← scroll container נפרד!
    <div style={{maxWidth: viewport}}>
      <div className="overflow-hidden rounded-xl ...">   ← מסגרת דפדפן מדומה
        <ThemeScope key={replayKey} className="[transform:translateZ(0)]" motionOff={typing}>
          <PageRenderer page={page} theme={theme} />
  ```
- **`replayKey`** — "הפעל אנימציות" עושה remount לכל תת-העץ
- **`BlockEditor`** מקבץ שדות שמפתחם מתחיל ב-`anim` לתת-סקשן
- **`FieldEditor`** גנרי אך **שטוח**: כותב `content[field.key]` בלבד,
  אין תמיכה ב-dot-path או במבנים מקוננים

---

## 2. ניתוח פערים (Gap Analysis)

| # | פער | חומרה | הערה |
|---|---|---|---|
| G1 | ל-`Page` אין שדה `experience`, ואין מושג `version` באף JSON | חוסם | `normalizePage`/`normalizeTheme` קיימים אך ללא versioning |
| G2 | אין scroll runtime מרכזי — כל מנגנון מאזין בעצמו | חוסם | ראו §3.1 |
| G3 | אין target system — לאף בלוק אין מזהים addressable לתת-אלמנטים | חוסם | |
| G4 | אין timeline / keyframes / interpolation utilities | חוסם | |
| G5 | אין primitive של "במה" (absolute stage) — הכול flow דרך `Section`/`Container` | חוסם | |
| G6 | אין layer primitives (text/image/shape/button/stat/video) | חוסם ל-freeform | |
| G7 | `FieldEditor` לא יכול לבטא scene/layer/keyframes (מאושר: שטוח) | חוסם ל-Studio | מפרט §105 מדויק |
| G8 | אין מערכת ערכים responsive מפורשת (desktop/tablet/mobile) | גבוה | יש `clamp()` בלבד |
| G9 | `matchMedia` נקרא פעם אחת ב-mount ואין האזנה לשינוי | בינוני | `statement.tsx:31`, `tilt-card.tsx:40` |
| G10 | אין debug tooling | בינוני | |
| G11 | **אין תשתית בדיקות בכלל** — ב-`package.json` אין test runner | גבוה | ראו R8 |
| G12 | אין תיקיית `docs/` | נמוך | נוצרת עם המסמך הזה |

---

## 3. ניתוח סיכונים (Risk Analysis)

### 3.1 R1 — Scroll Root ‏(סיכון קריטי, **אומת אמפירית**)

הרצתי בדיקה בדפדפן אמיתי מול build של פרודקשן. התוצאה:

| הקשר | scroll root בפועל | `--progress` אחרי גלילה | opacity של המילים |
|---|---|---|---|
| `/p/demo` (דף אמיתי) | `window` | `0 → 0.714` ✅ | מתקדם תקין |
| `/studio` (תצוגה חיה) | `main.overflow-auto` | `0 → 0` ❌ | **28/28 תקועות על 0.15** |

כלומר: **בלוק ה-Statement שבור היום בתוך הסטודיו**, ולא בשקט — הוא מרנדר
את התוכן ב-15% אטימות. בנוסף אותר אב עם `transform`:
`ds-scope [transform:translateZ(0)]`.

**ובנוסף — שבירה שנייה, בלתי תלויה:** ב-`studio-app.tsx:961` יש
`<div className="overflow-hidden rounded-xl ...">` (מסגרת הדפדפן המדומה)
בין ה-scrollport לבין התצוגה. `overflow: hidden` הופך אותו לתיבת הגלילה
הקרובה ביותר — והיא לעולם לא נגללת. לכן **`position: sticky` פשוט לא
נאחז בתוך הסטודיו**: גם ה-navbar (`sticky top-0`) וגם ה-Statement
מרונדרים שם כתוכן זורם רגיל.

מסקנות מחייבות:
1. הפשטת scroll root אינה אופציונלית. ה-runtime חייב לקבל
   `scrollRoot: HTMLElement | Window` ולפתור אותו בזמן ריצה.
2. **גם ה-pinning עצמו לא יעבוד בסטודיו** בלי טיפול במסגרת החוצצת —
   זה לא רק חישוב progress שגוי אלא sticky שלא נאחז כלל.
3. כל פיצ'ר גלילה שייבנה בדפוס של Statement יהיה שבור בסטודיו.
4. יש כאן שני באגים קיימים לתיקון — לא רק אילוץ תכנוני.

### 3.2 שאר הסיכונים

| # | סיכון | חומרה | הפחתה מוצעת |
|---|---|---|---|
| R2 | התנגשות בעלות על transform בין Reveal / Tilt / Experience | קריטי | ארכיטקטורת wrapper מבודד — §4.3 |
| R3 | שבירת `position: sticky` על ידי אב עם `overflow`/`transform`/`contain` | גבוה | ה-Hero למשל הוא `<div className="relative overflow-hidden">`; scene pinned בתוכו ייחתך. נדרשת בדיקת clip-ancestors ב-runtime + אזהרה ב-Studio |
| R4 | הזלגת הדף כולו ל-client רק בשביל Experience | גבוה | config נשאר server-safe; רק ה-runtime הוא `"use client"` |
| R5 | נפח טיוטת `localStorage` — scenes+layers+keyframes נכתבים בכל הקשה | בינוני | debounce + בדיקת quota + מדידה לפני Phase 7 |
| R6 | סופת re-render של React בגלילה | קריטי | חוק ברזל: אפס `setState` ב-rAF; כתיבה ישירה ל-CSS vars (דפוס Statement) |
| R7 | שבירת תאימות לאחור של `Page` | גבוה | `experience?` optional; `looksLikePage` לא ידרוש אותו; `normalizeExperience` תמיד רץ |
| R8 | **אין בדיקות** — שינוי בסדר גודל כזה בלי רשת ביטחון | גבוה | דורש החלטה: הוספת `vitest` כ-devDependency. ראו §8 |
| R9 | Scroll-jacking | גבוה | המחקר הקודם בריפו (`repos-report`) סימן במפורש חטיפת גלילה כ-anti-pattern. **פתרון: pinning מבוסס `sticky` בלבד — אפס יירוט `wheel`/`touchmove`.** הגלילה נשארת של המשתמש |
| R10 | RTL — כיווניות אופקית | בינוני | API סמנטי `start`/`end` בלבד; המרה ל-X בזמן ריצה |
| R11 | הצפת תנועה / ירידה בביצועים במובייל | בינוני | Motion budget + damper גלובלי + ברירת מחדל שקטה |
| R12 | **אנימציית CSS גוברת על inline style** — כתיבת `translate` מה-runtime ל-`.fx-marquee-track` או ל-`.fx-aurora i` תיבלע **בשקט** | גבוה | רשימת "אלמנטים אסורים" ב-runtime + אזהרה ב-Studio; אלה שני האלמנטים היחידים עם `animation` אינסופי על מאפיין transform |
| R13 | `transition: all 200ms` על **כל** `Button` — כל scrub על כפתור יהיה מרוכך ב-200ms | בינוני | ה-wrapper `.exp-motion` הוא אלמנט נפרד מהכפתור, ולכן לא יורש את ה-transition |
| R14 | ה-remount של `key={replayKey}` בסטודיו מוחק refs/observers | בינוני | ה-runtime חייב לשרוד remount מלא — רישום מחדש ב-mount, לא state גלובלי |

---

## 4. ארכיטקטורה מוצעת

### 4.1 המודל המנטלי

```
THEME       איך המותג נראה          (קיים, ללא שינוי)
BLOCKS      איזה מידע קיים          (קיים, ללא שינוי)
LAYERS      מה נמצא על הבמה         (חדש)
SCENES      מה רואים בכל שלב         (חדש)
TIMELINE    מתי כל דבר קורה          (חדש)
SCROLL      מה שמניע את ה-Timeline   (חדש)
EFFECTS     איך הדבר זז              (קיים, ללא שינוי)
```

Experience היא **שכבה רביעית**, page-level, אופציונלית לחלוטין.

### 4.2 מפל השליטה בזמן ריצה

```
scroll position (scrollRoot)
        ↓
ExperienceRuntime  ── rAF יחיד, ResizeObserver יחיד, matchMedia יחיד
        ↓
SceneRegistry      ── מדידת כל scene, קביעת active
        ↓
scene progress 0→1
        ↓
TargetRegistry     ── פתרון target id → DOM node
        ↓
Track/Keyframe evaluation + easing
        ↓
CSS custom properties על ה-node   (אפס setState)
```

### 4.3 פתרון בעלות על מאפיינים (R2) — לב הארכיטקטורה

כל מנגנון מקבל **אלמנט DOM משלו**. אף שניים לא כותבים לאותו מאפיין על
אותו node:

```html
<div data-experience-target="hero-title">   <!-- זהות בלבד. לא מקבל סגנון -->
  <div class="exp-motion">                   <!-- Experience בלבד -->
    ...Reveal מרנדר כאן את ה-div שלו...      <!-- Reveal בלבד -->
      ...TiltCard מרנדר כאן את ה-div שלו...  <!-- Tilt בלבד -->
```

`.exp-motion` ב-CSS ישתמש במאפיינים **העצמאיים**, בדיוק כמו ש-`Reveal`
כבר עושה — ולכן לא יתנגש עם `transform` המרוכב של `.fx-tilt`:

```css
.exp-motion {
  translate: var(--exp-x, 0) var(--exp-y, 0);
  scale: var(--exp-scale, 1);
  rotate: var(--exp-rotate, 0deg);
  opacity: var(--exp-opacity, 1);
  filter: blur(var(--exp-blur, 0px));
}
```

ה-runtime כותב רק `--exp-*`. הוא **לא נוגע** ב-`--anim-*`, ב-`--rx/--ry`
או ב-`transform`. גבול הבעלות חד וניתן לאכיפה בבדיקה.

### 4.4 Pinning ללא חטיפת גלילה

```
[ scene wrapper — גובה = durationVh × 100svh ]   ← זה ה"מסלול" של הגלילה
   └── [ stage — position: sticky; top: 0; height: 100svh ]  ← זה מה שרואים
          └── layers / block targets
```

זה בדיוק הדפוס של `statement.tsx` היום (`min-h-[240vh]` + `sticky top-0`),
מוכלל. אפס `preventDefault`, אפס יירוט gestures — הגלילה נשארת נייטיבית
ונגישה.

### 4.5 גבול Server/Client

```
Server:  app/p/[pageId] → ThemeScope (server) → ExperienceProvider ("use client", מקבל config כ-prop סריאלי)
                                                    └── PageRenderer (server children דרך children prop)
```

ה-config עובר כ-prop רגיל. הבלוקים נשארים רכיבי שרת. רק ה-runtime הוא client.

---

## 5. מודל הנתונים המוצע

### 5.1 הרחבת `Page` — תאימות לאחור מלאה

```ts
interface Page {
  id: string
  name: string
  themeId: string
  meta: { title: string; description: string }
  blocks: PageBlockInstance[]
  experience?: ExperienceConfig     // ← חדש, optional
}
```

`looksLikePage` לא ידרוש את השדה. `normalizePage` יקרא ל-`normalizeExperience`
רק אם הוא קיים. כל 
`pages-data/*.json` הקיים ממשיך לעבוד ללא נגיעה.

### 5.2 סכמה מוצעת

```ts
interface ExperienceConfig {
  version: 1
  enabled: boolean
  mode: "scroll"
  settings: ExperienceSettings
  scenes: ExperienceScene[]
}

interface ExperienceSettings {
  defaultDurationVh: number          // ברירת מחדל לאורך scene, ביחידות מסך
  defaultEasing: EasingId
  reducedMotion: "static" | "opacity-only"
  performance: "auto" | "high" | "lite"
  intensity: number                  // damper גלובלי 0–1
  debug: boolean
}

interface ExperienceScene {
  id: string
  name: string
  pinned: boolean
  durationVh: Responsive<number>
  background?: SceneBackground
  transition?: "cut" | "fade" | "crossfade" | "directional"
  blockRefs?: string[]               // מזהי block instances שה-scene מכניס לבמה
  layers: ExperienceLayer[]          // freeform
  tracks: ExperienceTrack[]          // כוריאוגרפיה
}

interface ExperienceTrack {
  target: string                     // target id של בלוק, או layer id
  range?: [number, number]           // תת-טווח בתוך ה-scene, ברירת מחדל [0,1]
  easing?: EasingId
  props: Partial<Record<AnimatableProp, Keyframe[]>>
  responsive?: { tablet?: Partial<...>; mobile?: Partial<...> }
}

type AnimatableProp = "opacity" | "x" | "y" | "scale" | "rotate" | "blur"
interface Keyframe { at: number; value: number; easing?: EasingId }

type Responsive<T> = T | { base: T; tablet?: T; mobile?: T }
```

**למה keyframes ולא from/to:** כדי לאפשר ENTER → HOLD → EXIT בתוך scene
אחד, כפי שהמפרט דורש (§22), בלי שינוי סכמה בעתיד.

### 5.3 Layer

```ts
interface ExperienceLayer {
  id: string
  type: "text" | "richText" | "image" | "video" | "shape" | "button" | "stat" | "logo" | "block" | "spacer"
  content: Record<string, unknown>
  layout: Responsive<LayerLayout>
  style?: LayerStyle
}

interface LayerLayout {
  mode: "stage" | "flow"
  x?: string; y?: string            // "50%", "12vw" — לא px
  width?: string; maxWidth?: string
  anchor?: "start" | "center" | "end"
  zIndex?: number
}
```

**כלל יחידות:** אחוזים / `vw` / `vh` / `rem` / `clamp()` בלבד. אין px
במיקום. זה תנאי ל-responsive אמיתי.

**כלל צבע:** `LayerStyle` מצביע על טוקני הערכה (`primary`, `accent`,
`text`, `muted`, `surface`) ולא על hex. צבע custom מותר אך **חייב** לעבור
דרך `lib/contrast.ts` הקיים — אין contrast checker שני.

### 5.4 חוזה ה-Targets

כל בלוק **מצהיר** אילו targets הוא חושף — זה חוזה מתועד, לא ניחוש של
ה-engine. ה-engine לא יודע ש-Hero משתמש ב-`h1`; הוא יודע רק
`hero-title`.

הצעה ל-Hero (מבוסס קריאה בפועל של `hero.tsx`):

`hero-eyebrow` · `hero-title` · `hero-subtitle` · `hero-cta-primary` ·
`hero-cta-secondary` · `hero-stats` · `hero-visual` · `hero-quote` · `hero-badge`

כולם כבר אלמנטים נפרדים ב-DOM — נדרש רק להוסיף wrapper דק, בלי שינוי מבני.

**target חסר לא מקריס.** ה-runtime מדלג, רושם warning ב-debug, וממשיך.

---

## 6. עץ קבצים מוצע

מותאם לקונבנציות הקיימות (`lib/*.ts` שטוח, `components/<domain>/`,
הערות בעברית):

```
lib/
  experience.ts              טיפוסים + קבועים + easing presets
  experience-normalize.ts    normalizeExperience + versioning
  experience-validate.ts     ולידציה + דוחות אזהרה ל-Studio
  experience-interpolate.ts  interpolate / evaluateTrack / normalizeProgress
  experience-presets.ts      Scene presets (Cinematic/Editorial/...)

components/experience/
  experience-provider.tsx    "use client" — הקשר + runtime
  experience-runtime.ts      rAF, scrollRoot, registries (לא רכיב)
  experience-scene.tsx       wrapper + sticky stage
  experience-target.tsx      עוטף .exp-motion סביב target
  experience-layer.tsx       דיספצ'ר לפי layer.type
  experience-debugger.tsx    overlay
  layers/
    text-layer.tsx  image-layer.tsx  video-layer.tsx
    shape-layer.tsx button-layer.tsx stat-layer.tsx  block-layer.tsx

components/studio/experience/
  experience-panel.tsx       הטאב
  scene-list.tsx             ניהול scenes
  scene-editor.tsx           הגדרות scene
  layer-editor.tsx           עריכת layer
  timeline-editor.tsx        טיימליין + scrubber

docs/
  experience-audit.md        ← המסמך הזה
  experience-engine.md       (Phase 2)
  experience-schema.md       (Phase 1)
  experience-studio.md       (Phase 7)
```

---

## 7. Studio UX מוצע

טאב שלישי — **"חוויה"** — לצד "מבנה ותוכן" ו"עיצוב". לא נוגעים בשניים
הקיימים.

```
┌─ מצב הדף ────────────────────────────┐
│  [ רגיל ]  [ חוויית גלילה ]           │
└──────────────────────────────────────┘
┌─ סצנות ──────────────────────────────┐
│  01  פתיחה          2.0 מסכים  ⇅ ✕   │
│  02  הבעיה          1.5 מסכים  ⇅ ✕   │
│  03  התמורה         2.5 מסכים  ⇅ ✕   │
│  + הוספת סצנה                         │
└──────────────────────────────────────┘
```

בפתיחת scene:
- **תצוגה מלאה** של ה-scene במצב הנוכחי
- **סרגל scrubber** 0%→100% — גרירה מציגה את המצב בזמן אמת, בלי לגלול
- **טיימליין** — שורה לכל target/layer עם טווח הפעילות שלו
- **פקדים** לפי אותה פילוסופיה של שלב ג' הקיים:
  בסיסי = צ'יפים (כבוי / עדין / דינמי / דרמטי) ← ברירת מחדל
  מתקדם = duration / delay / range / easing מקופל
  keyframes = רק במצב מומחה

**החלטה מחייבת:** ה-Experience editor **לא** עובר דרך `FieldEditor`
(מאושר: הוא שטוח, §1.5). הוא מקבל עורכים ייעודיים. `BlockContent` לא
מקבל scenes/layers — Experience הוא page-level.

**Presets** באותו דפוס של `FONT_PAIRS`/`SHUFFLE_PALETTES` הקיימים:
Cinematic · Editorial · Digital · Luxury · Bold · Experimental —
כל אחד עובר בדיקת ניגודיות לפני שהוא מוצג.

**Debug** — overlay עם scene פעיל, progress, target count, מצב
reduced-motion, desktop/mobile.

---

## 8. שלבי פיתוח

לפני כל שלב: קריאה ב-`node_modules/next/dist/docs/` לפי `AGENTS.md`.
אחרי כל שלב: `build` + `lint` + בדיקה בדפדפן + תיעוד — ורק אז הלאה.

| Phase | תוכן | שער יציאה |
|---|---|---|
| **0** | האודיט הזה | ✅ הושלם |
| **0.5** | **החלטת בדיקות** — הוספת `vitest` כ-devDependency | דורש אישור המשתמש |
| **1** | סכמה: טיפוסים, `normalizeExperience`, ולידציה, versioning | `Page` ישן עובר ללא שינוי; יחידה עוברת |
| **2** | Runtime: scrollRoot, rAF, ResizeObserver, registries — **כולל תיקון באג ה-Statement בסטודיו** | Statement עובד גם ב-`/p/demo` וגם ב-`/studio` |
| **3** | Timeline: interpolate, keyframes, easing, property resolver | בדיקות יחידה על 0 / 0.25 / 0.5 / 1 / clamp / NaN |
| **4** | Scene + Stage + sticky pinning + transitions | scene נעוץ ומשוחרר תקין; אין clip |
| **5** | Targets בבלוקים קיימים (Hero → Statement → About → Gallery → Steps → CTA) | בלוק עובד עם ובלי Experience |
| **6** | Layer system (text/image/shape/button/stat/video/block-ref) | freeform scene נבנית מ-JSON |
| **7** | Studio: טאב, scene manager, layer editor, timeline, scrubber | עריכה משנה תצוגה בפועל |
| **8** | Presets + debug + motion budget | preset לא נכשל בניגודיות |
| **9** | Demo `/preview/scroll-experience` — 5 scenes, editable מה-Studio | לא hardcoded |
| **10** | QA מקצה לקצה + נגישות + reduced-motion + no-JS + RTL + מובייל | כל ה-DoD |
| **11** | ביצועים: desktop/mobile, memory, listeners cleanup | אפס דליפות |
| **12** | *אופציונלי בלבד, אחרי יציבות:* adapter ל-WebGL | — |

**MVP מומלץ:** Phases 1–5 + 7 חלקי + 9. זה נותן חוויית גלילה אמיתית על
בלוקים קיימים עם עריכה בסיסית. Phase 6 (freeform layers) הוא המשך טבעי
אך גדול בפני עצמו.

---

## 9. Acceptance Criteria

### תאימות לאחור (חוסם — נבדק בכל Phase)
- [ ] כל דף קיים ב-`pages-data/` נטען ומרונדר ללא שינוי
- [ ] Theme Engine ללא שינוי התנהגותי
- [ ] Effects Engine ללא שינוי התנהגותי
- [ ] 17 הבלוקים עובדים ללא Experience
- [ ] `Page` ללא `experience` תקין לחלוטין
- [ ] ייבוא/ייצוא תואם לשני הפורמטים

### פונקציונליות
- [ ] מצב Standard ומצב Scroll Experience שניהם עובדים
- [ ] scene: pinning, progress, release, transition
- [ ] targets מרובים, keyframes, interpolation, easing
- [ ] ערכים responsive (desktop/tablet/mobile)
- [ ] בלוקים קיימים חושפים targets
- [ ] layers: text / image / video / shape / button / stat / block-ref
- [ ] Studio: scene editor, layer editor, timeline, scrub, replay, debug, presets

### עמידות
- [ ] `normalizeExperience` ממלא כל חסר
- [ ] קונפיגורציה לא תקינה → נפילה חיננית ל-Standard
- [ ] target חסר → אזהרה, לא קריסה
- [ ] בלי JS → כל התוכן גלוי
- [ ] `prefers-reduced-motion` → קומפוזיציה סטטית, תוכן מלא
- [ ] **`--progress` מתקדם גם ב-`window` וגם בתוך scroll container של הסטודיו**
- [ ] אפס דליפות: rAF / listeners / ResizeObserver / matchMedia

### איכות
- [ ] RTL: אין `left`/`right` היכן שיש `start`/`end`
- [ ] ניגודיות דרך `lib/contrast.ts` בלבד
- [ ] אפס `setState` בלולאת ה-rAF
- [ ] `build` + `lint` נקיים
- [ ] בדיקות עוברות
- [ ] Demo קיים ועריך
- [ ] תיעוד: engine / schema / studio

---

## 10. החלטות שממתינות לאישור לפני Phase 1

1. **תשתית בדיקות** — המפרט דורש בדיקות (§95–98), אך אין היום test runner
   בפרויקט. הוספת `vitest` היא dependency חדשה. מאשר?
2. **היקף MVP** — האם Phase 6 (freeform layers) בפנים ב-MVP, או שמתחילים
   בכוריאוגרפיה על בלוקים קיימים בלבד?
3. **תיקון באגי הסטודיו** — לתקן כחלק מ-Phase 2 (מומלץ, כי ה-runtime
   החדש פותר אותם ממילא), או כתיקון נפרד ומוקדם?

---

## נספח א' — וו-תלייה שכבר קיימים ואפשר לאמץ בחינם

סקר מעמיק של הבלוקים העלה מספר הכנות שכבר קיימות בקוד ואף אחד לא צורך
אותן. אימוץ שלהן חוסך migration:

| הוק | מיקום | מצב היום | שימוש מוצע |
|---|---|---|---|
| `[data-scrub]` | `globals.css:523`, בתוך סלקטור כיבוי התנועה של הסטודיו | **אין לו שום מפיק בריפו** | בדיוק השם שה-runtime צריך. מקבלים כיבוי-תנועה בסטודיו בחינם |
| `[data-fx-motion]` | `globals.css:519` | שמור עם הערה, לא בשימוש | מתג עוצמת תנועה ברמת scope |
| `--i` | נכתב ב-`hero.tsx:138`, `about.tsx:87`, `logos.tsx:48` | **נכתב ואף כלל CSS לא קורא אותו שם** | אינדקס מוכן לכל פריט ברשימה, בלי שינוי DOM |
| `Card` spreads `...props` | `ui/card.tsx:6,17` | כבר מעביר `data-*` | אפשר לתייג כרטיסים בלי לגעת ברכיב |

לעומת זאת **לא** מעבירים props היום ולכן ידרשו שינוי קטן אם נרצה לתייג
אותם ישירות: `Badge`, `Reveal`, `Button`, `Section`/`Container`,
`SectionHeading`.

**CSS מת שכדאי לנקות או לאמץ:** `.fx-lift`, `.text-shimmer` ו-`.fx-spot`
מוגדרים ב-`globals.css` אך **אין להם שום carrier בקוד**.

## נספח ב' — מפת התנגשויות מדויקת (תמצית)

| # | בעלים | מאפיינים | חומרת התנגשות |
|---|---|---|---|
| C1 | `[data-animate]` (Reveal) | `opacity`, `translate`, `scale`, `filter` + transition על כולם | **מלאה** — גם בעלות וגם ריכוך של 500–800ms שיהפוך scrub ל"גומייה" |
| C2 | `.split-word` | `opacity`, `translate`, `filter` + delay לפי `--i` | ישירה. `scale`/`rotate` פנויים |
| C3 | `.fx-statement-word` | `opacity` בלבד | חלקית. השאר פנוי |
| C4 | `.fx-tilt` | `transform` (shorthand) | כתיבת shorthand תמחק את הטילט; מאפיינים עצמאיים **מתחברים** בבטחה |
| C5/C6 | `.fx-btn-3d` / `.fx-btn-shine` | `translate` / `overflow:hidden` | על הכפתור עצמו בלבד |
| C7 | `.fx-steps-line` | `scale`, מונע ממצב של **אלמנט אחר** | ההצמדה הצולבת היחידה בקוד |
| C8 | `.fx-marquee-track` | `translate` דרך `animation` | **בליעה שקטה** — ראו R12 |
| C10 | `.fx-aurora i` | `translate`, `scale` דרך `animation` | כנ"ל; ועוגן לגובה הדף, לא לחלון |

**מאפיינים פנויים כמעט בכל מקום:** `rotate` (למעט slant המרקיז ו-chevron
ה-FAQ), `transform` shorthand (למעט `.fx-tilt`), ו-`filter` (למעט
וריאנט ה-blur של Reveal ו-`.split-word`).

**מרחב שמות תפוס:** `--anim-*`, `--i`, `--n`, `--progress`, `--rx`,
`--ry`, `--mx`, `--my`, `--fx-angle`, `--edge`, וכל `--ds-*`.
מכאן הבחירה בקידומת **`--exp-*`** — אין התנגשות.

## נספח ג' — בלוקים שחוסמים pinning בתוכם

`overflow: hidden` יוצר תיבת גלילה, ולכן `sticky` בתוכו לא נאחז לעולם:

| בלוק | שורה | הערה |
|---|---|---|
| **hero** | `hero.tsx:86` | על **כל** ההירו. scene נעוץ בתוך הירו בלתי אפשרי בלי שינוי השורה הזו |
| **cta** | `cta.tsx:40` | על ה-Reveal עצמו, שהוא גם הבאנר |
| marquee | `:61`, `:66` | מכוון |
| gallery / video | `:57` / `:56` | ממוקד למסגרת המדיה, לא בעייתי |

**שרשרת האבות בדפים הציבוריים נקייה:** `body` → `.ds-scope` → `<main>` →
בלוק. אין `overflow`, `transform`, `filter`, `contain` או `perspective`
באף אחד מהם — ולכן sticky עובד היום בדפים אמיתיים (מוכח על ידי ה-navbar
וה-Statement כאחד).

## נספח ד' — חובות טכניים קיימים שהתגלו בדרך

לא חוסמים, אך כדאי לטפל בהם במסגרת השלבים הרלוונטיים:

1. `count-up.tsx` — לולאת ה-rAF **לא מבוטלת ב-unmount**; רק ה-observer
   מנותק. tween באוויר ימשיך לקרוא ל-`setDisplay`.
2. שתי קונבנציות IO שונות בקוד: `threshold 0.6 / rootMargin +15%`
   (CountUp) מול `0.15 / -12%` (Reveal). כדאי לאחד.
3. אי-התאמת יחידות גובה סביב ה-pin היחיד הקיים: `min-h-screen` (`100vh`)
   ב-scope, `min-h-[240vh]` בעוטף, `min-h-svh` ב-sticky, ו-
   `window.innerHeight` בחישוב — ארבע הגדרות שונות ל"גובה מסך" בסצנה אחת.
   במובייל עם שורת כתובת מתקפלת הן לא מסכימות ביניהן.
4. `CountUp` עושה `setState` בכל פריים (re-render per frame) בעוד
   ה-Statement עושה אפס. ה-runtime החדש חייב לאמץ את הדפוס של Statement.

# Experience Engine — אודיט ארכיטקטוני + הצעת ארכיטקטורה סופית (Phase 1)

**סטטוס:** Phase 0 (האודיט) הושלם ואושר על ידי המשתמש ללא צורך להתחיל
מחדש. מסמך זה הוא ה"Final Phase 1 Architecture Proposal" שנדרש לפני
תחילת מימוש — הוא משלב את מסמך "FINAL ARCHITECTURAL CORRECTION &
PRE-IMPLEMENTATION DIRECTIVE" (להלן "מסמך התיקון") לתוך האודיט המקורי,
לפי הרשימה המפורשת A–Q שהמסמך ההוא דרש. **עדיין אפס קוד production** —
אך לפי ההרשאה המפורשת בסוף מסמך התיקון, מיד לאחר מסמך זה מתחיל מימוש
Phase 0.5 בפועל, ללא תור אישור נוסף.

נכתב לאחר קריאה בפועל של הריפו, כולל אימות אמפירי בדפדפן (§3.1) וסקר
block-by-block מלא (§1, נספחים).

### חזון המוצר (§1 במסמך התיקון)

Testim עובר מ"בונה דפי נחיתה עם אפקטים" ל-**"Visual Web Experience
Builder"**. המערכת המוגמרת תומכת בשני מצבי מוצר מקבילים:

- **Mode A — Standard.** ההתנהגות הקיימת: בלוקים, ערכות, תוכן, אפקטים,
  Studio קיים. חייב להישאר יציב ותואם-לאחור לחלוטין — זה כל §1–§3 באודיט.
- **Mode B — Scroll Experience.** שכבה רביעית, אופציונלית: גלילה →
  progress גלובלי → progress לכל scene → timeline → tracks →
  targets/layers → אינטרפולציית מאפיינים. הגלילה עצמה היא מנוע
  ה-timeline — לא "עוד אנימציות" אלא כוריאוגרפיה קולנועית.

**קנה המידה:** האתרים שהמערכת מייצרת צריכים להגיע לרמת תחכום דומה
ל-STONE כהפניה (pinned scenes, storytelling ויזואלי, קומפוזיציה
בשכבות, מעברים מונעי-גלילה, טיפוגרפיה חזקה, תנועה מבוקרת, רגעים
אימרסיביים במסך מלא, כוריאוגרפיה responsive) — **בלי לשכפל את STONE**.
היעד הוא מנוע גנרי, ניתן לשימוש חוזר ועריכה ללא קוד, שמסוגל לאותה
רמת תחכום — לא עותק שלה. עקרון-העל (§114 במסמך התיקון): לא בונים
אוסף טריקי אנימציה — בונים מערכת כוריאוגרפיה. לא מקריבים ארכיטקטורה
תמורת טריק ויזואלי, נגישות תמורת אפקט, או ביצועים תמורת תנועה.

---

## 0. מה השתנה במסמך התיקון — תמצית לצורך מעקב

מסמך התיקון **מאשר** את Phase 0 כפי שהוא, **פותר** את שלוש ההחלטות
הפתוחות שהיו ב-§10 המקורי, ומוסיף שכבת דיוק ארכיטקטונית שלא הייתה
במסמך המקורי:

| נושא | היה באודיט המקורי | התיקון הסופי |
|---|---|---|
| בדיקות | שאלה פתוחה | **מאושר** — `vitest` כ-devDependency |
| היקף Freeform ב-MVP | שאלה פתוחה (7 טיפוסים אפשריים) | **מצומצם ל-5**: text/image/shape/button/block-ref |
| תיקון באג הסטודיו | שאלה פתוחה (Phase 2? נפרד?) | **מוכרע**: דרך הפשטת ScrollRoot עצמה, כחלק מ-Phase 0.5/2 — לא hack נפרד |
| Scroll Root | קונספט חופשי | **חוזה טיפוסי פורמלי** (§6) |
| Track ownership | לא היה סעיף ייעודי | **כלל מחייב + ולידציה** (§9) |
| Scene lifecycle | "pinned: boolean" | **state machine מפורש** BEFORE→ENTERING→ACTIVE→LEAVING→AFTER (§11) |
| קומפוזיציה | Stage בלבד מרומז | **Stage Mode vs Flow Mode** כדואליות מפורשת (§4.3) |
| פילוסופיית תנועה כברירת מחדל | לא הוגדר מפורשות | **מתוקן**: נקי/קולנועי/מאופק כברירת מחדל; "פסיכי"/ניסיוני הוא opt-in בלבד — זה תיקון לדגש "עיצוב פסיכי" משלב מוקדם יותר בסשן, וחל על שכבת ה-Experience בלבד (לא נוגע לערכת "Nova Psycho" הקיימת ברמת Theme) |
| Studio UX | תיאור מילולי | **wireframe מפורש 4-panel** (§13) |
| שלבי פיתוח | Phase 0–12 | **Phase 0.5 חדש** מוכנס לפני הכול (§18) |

כל שאר האודיט המקורי (§1–§3, הנספחים) נותר תקף במלואו ומובא כאן ללא
שינוי מהותי.

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

**Experience היא שכבה רביעית, לא תחליף לאף אחת מהשלוש** (§3 במסמך
התיקון): Theme = זהות ויזואלית, Blocks = מבני תוכן, Page = תוכן+סדר,
Effects = תנועת כניסה/hover/pointer, Experience = כוריאוגרפיית scene,
Studio = ממשק העריכה לכולן. אף שכבה לא בולעת את השנייה.

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
להמציא מחדש. זהו התקדים הישיר לקידומת `--exp-*` (§8).

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
- `prefers-reduced-motion` → קובע 1 מיד ולא מאזין בכלל (זהו בעצמו באג —
  ראו G9/§18 Phase 0.5: אין מאזין לשינוי, רק קריאה חד-פעמית ב-mount)

מה שהוא **לא**: הוא מקומי לבלוק, קשור קשיח ל-`window`, ואין בו מושג של
scene, target, timeline או keyframes.

### 1.5 ארכיטקטורת הסטודיו

`components/studio/studio-app.tsx` (995 שורות, client, נטען עם
`next/dynamic ssr:false` דרך `studio-loader.tsx`).

- **State:** `theme`, `page`, `tab: "structure" | "design"`, `selectedBlockId`,
  `baseId`, `viewport`, `notice`, `replayKey`, `typing`
- **טיוטות:** כל שינוי ב-theme/page נכתב מיד ל-`localStorage`. **זה
  אסור לשכפל עבור Experience** — ראו §14/§15 (debounce מחייב, כי
  scenes+layers+keyframes הם JSON גדול משמעותית מ-theme/page)
- **תצוגה חיה:**
  ```
  <main className="... overflow-auto">        ← scroll container נפרד!
    <div style={{maxWidth: viewport}}>
      <div className="overflow-hidden rounded-xl ...">   ← מסגרת דפדפן מדומה
        <ThemeScope key={replayKey} className="[transform:translateZ(0)]" motionOff={typing}>
          <PageRenderer page={page} theme={theme} />
  ```
- **`replayKey`** — "הפעל אנימציות" עושה remount לכל תת-העץ. ה-runtime
  חייב לשרוד remount מלא (R14) — רישום מחדש נקי ב-mount, בלי לדלוף.
- **`BlockEditor`** מקבץ שדות שמפתחם מתחיל ב-`anim` לתת-סקשן
- **`FieldEditor`** גנרי אך **שטוח** (אומת בקריאה מלאה של
  `field-editor.tsx`): כותב `content[field.key]` בלבד, בלי dot-path,
  בלי nested structures מעבר ל-`list` (מערך פריטים שטוחים). **מסקנה
  מחייבת:** Experience (scenes → layers → tracks → keyframes, עומק
  4 רמות עם arrays בכל רמה) לא יכול לרכב על `FieldEditor` הקיים —
  נדרשים עורכים ייעודיים (§13).
- **`viewport`/viewports** — מנגנון desktop/tablet/mobile preview-toggle
  קיים כבר ב-`studio-app.tsx`. Experience **חייב** להשתמש באותו state,
  לא לבנות מקביל (§14).

---

## 2. ניתוח פערים (Gap Analysis)

| # | פער | חומרה | הערה |
|---|---|---|---|
| G1 | ל-`Page` אין שדה `experience`, ואין מושג `version` באף JSON | חוסם | `normalizePage`/`normalizeTheme` קיימים אך ללא versioning |
| G2 | אין scroll runtime מרכזי — כל מנגנון מאזין בעצמו | חוסם | ראו §3.1, §6 |
| G3 | אין target system — לאף בלוק אין מזהים addressable לתת-אלמנטים | חוסם | ראו §7 |
| G4 | אין timeline / keyframes / interpolation utilities | חוסם | |
| G5 | אין primitive של "במה" (absolute stage) — הכול flow דרך `Section`/`Container` | חוסם | ראו §4.3 |
| G6 | אין layer primitives (text/image/shape/button/block-ref) | חוסם ל-freeform | ראו §12 |
| G7 | `FieldEditor` לא יכול לבטא scene/layer/keyframes (מאושר: שטוח) | חוסם ל-Studio | §1.5 |
| G8 | אין מערכת ערכים responsive מפורשת (desktop/tablet/mobile) | גבוה | יש `clamp()` בלבד |
| G9 | `matchMedia` לreduced-motion נקרא פעם אחת ב-mount ואין האזנה לשינוי | בינוני | `statement.tsx:31`, `count-up.tsx:38` — בטיפול ב-Phase 0.5. **תוקן:** `tilt-card.tsx:40` הוא בדיקת יכולת מצביע (`hover:hover) and (pointer:fine`), לא reduced-motion — טעות בגרסה קודמת של המסמך; `.fx-tilt` כבר מטופל נכון ב-CSS בלבד (`@media (prefers-reduced-motion: reduce) { .fx-tilt { transform: none } }`), אותה קונבנציה כמו Reveal |
| G10 | אין debug tooling | בינוני | ראו §13 |
| G11 | **אין תשתית בדיקות בכלל** — ב-`package.json` אין test runner | גבוה | **פתור** — vitest מאושר, §16 |
| G12 | אין תיקיית `docs/` | נמוך | נוצרה עם המסמך הזה |

---

## 3. ניתוח סיכונים (Risk Analysis)

### 3.1 R1 — Scroll Root (סיכון קריטי, **אומת אמפירית**)

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
   `scrollRoot: HTMLElement | Window` ולפתור אותו בזמן ריצה — **פורמלית
   כחוזה טיפוסי, לא רק כקונספט** (§6, לפי דרישת מסמך התיקון).
2. **גם ה-pinning עצמו לא יעבוד בסטודיו** בלי טיפול במסגרת החוצצת —
   זה לא רק חישוב progress שגוי אלא sticky שלא נאחז כלל.
3. כל פיצ'ר גלילה שייבנה בדפוס של Statement יהיה שבור בסטודיו.
4. יש כאן שני באגים קיימים לתיקון — לא רק אילוץ תכנוני. **מסמך התיקון
   מכריע: התיקון קורה דרך הפשטת ScrollRoot עצמה (Phase 0.5/2), לא
   כ-hack מיוחד לסטודיו** — runtime ציבורי ו-runtime סטודיו הם **אותה**
   מנוע Experience, בשני מימושי ScrollRoot.

### 3.2 שאר הסיכונים

| # | סיכון | חומרה | הפחתה מוצעת |
|---|---|---|---|
| R2 | התנגשות בעלות על transform בין Reveal / Tilt / Experience | קריטי | ארכיטקטורת wrapper מבודד — §8 |
| R3 | שבירת `position: sticky` על ידי אב עם `overflow`/`transform`/`contain` | גבוה | ה-Hero למשל הוא `<div className="relative overflow-hidden">`; scene pinned בתוכו ייחתך. נדרשת בדיקת clip-ancestors ב-runtime + אזהרה ב-Studio |
| R4 | הזלגת הדף כולו ל-client רק בשביל Experience | גבוה | config נשאר server-safe; רק ה-runtime הוא `"use client"` |
| R5 | נפח טיוטת `localStorage` — scenes+layers+keyframes נכתבים בכל הקשה | בינוני | debounce + בדיקת quota + מדידה לפני Phase 7 — ראו §14 |
| R6 | סופת re-render של React בגלילה | קריטי | חוק ברזל: אפס `setState` ב-rAF; כתיבה ישירה ל-CSS vars (דפוס Statement) |
| R7 | שבירת תאימות לאחור של `Page` | גבוה | `experience?` optional; `looksLikePage` לא ידרוש אותו; `normalizeExperience` תמיד רץ |
| R8 | **אין בדיקות** — שינוי בסדר גודל כזה בלי רשת ביטחון | גבוה | **פתור**: vitest, §16 |
| R9 | Scroll-jacking | גבוה | המחקר הקודם בריפו (`repos-report`) סימן במפורש חטיפת גלילה כ-anti-pattern. **פתרון: pinning מבוסס `sticky` בלבד — אפס יירוט `wheel`/`touchmove`.** הגלילה נשארת של המשתמש |
| R10 | RTL — כיווניות אופקית | בינוני | API סמנטי `start`/`end` בלבד; המרה ל-X בזמן ריצה |
| R11 | הצפת תנועה / ירידה בביצועים במובייל | בינוני | Motion budget + damper גלובלי + ברירת מחדל שקטה (§0 — לא "פסיכי" כברירת מחדל) |
| R12 | **אנימציית CSS גוברת על inline style** — כתיבת `translate` מה-runtime ל-`.fx-marquee-track` או ל-`.fx-aurora i` תיבלע **בשקט** | גבוה | רשימת "אלמנטים אסורים" ב-runtime + אזהרה ב-Studio; אלה שני האלמנטים היחידים עם `animation` אינסופי על מאפיין transform — ראו §9.3 |
| R13 | `transition: all 200ms` על **כל** `Button` — כל scrub על כפתור יהיה מרוכך ב-200ms | בינוני | ה-wrapper `.exp-motion` הוא אלמנט נפרד מהכפתור, ולכן לא יורש את ה-transition |
| R14 | ה-remount של `key={replayKey}` בסטודיו מוחק refs/observers | בינוני | ה-runtime חייב לשרוד remount מלא — רישום מחדש ב-mount, לא state גלובלי — ראו §15 |

---

## 4. ארכיטקטורה סופית [A]

### 4.1 המודל המנטלי (מסמך התיקון §113)

```
THEME       מי המותג                (קיים, ללא שינוי)
BLOCKS      אילו תכנים קיימים       (קיים, ללא שינוי)
LAYERS      מה מופיע על הבמה        (חדש)
SCENES      מה חווים בכל שלב        (חדש)
TIMELINE    מתי כל דבר קורה         (חדש)
SCROLL      מה שמניע את ה-Timeline  (חדש)
EFFECTS     איך אלמנט זז            (קיים, ללא שינוי)
STUDIO      איך משתמש לא-טכני שולט בכול (הרחבה)
```

Experience היא **שכבה רביעית**, page-level, אופציונלית לחלוטין.

### 4.2 מפל השליטה בזמן ריצה

```
scroll position (ScrollRoot.getScrollPosition())
        ↓
ExperienceRuntime  ── rAF יחיד, ResizeObserver יחיד, matchMedia יחיד לכל scope
        ↓
SceneRegistry      ── מדידת כל scene (ScrollRoot.getViewportSize()), lifecycle state
        ↓
scene-local progress 0→1
        ↓
TargetRegistry     ── פתרון target id → HTMLElement (Map, אפס querySelector בלולאה)
        ↓
Track/Keyframe evaluation + easing (§10)
        ↓
CSS custom properties על ה-node   (--exp-*, אפס setState)
```

**"בדיוק runtime אחד per Experience scope"** (מסמך התיקון §43): אין
לולאת rAF נפרדת ל-scene, ל-layer או ל-track. הכול נמדד ומעודכן במעבר
פריים יחיד של ה-runtime המרכזי.

### 4.3 Stage Mode לעומת Flow Mode — דואליות מחייבת [I]

זו תוספת מרכזית של מסמך התיקון (§26): לא כל Experience הוא "פוסטר
absolute". שני מצבי קומפוזיציה נתמכים ב-`ExperienceScene`, כל אחד
מיועד למקרה שונה:

| | **Stage Mode** | **Flow Mode** |
|---|---|---|
| קומפוזיציה | absolute / layered, בתוך Stage נעוץ | document flow רגיל |
| למה מתאים | hero קולנועי, reveal של מוצר, קומפוזיציית מגזין | תוכן ארוך, נגישות כבדה, קטעי טקסט |
| pinning | כן (סטנדרטי) | אופציונלי — יכול להיות scene "רגיל" עם כוריאוגרפיה בלבד, בלי pin |
| layers | freeform layers נפוצים כאן | targets על בלוקים קיימים נפוצים כאן |
| מודל גובה | `durationVh` קובע אורך המסלול; ה-stage עצמו `100svh` | הגובה נגזר מהתוכן עצמו, ה-scene רק "רוכב" עליו עם התקדמות |

```ts
interface ExperienceScene {
  // ...
  composition: "stage" | "flow";   // חדש — קובע את המודל
}
```

**"אל תכריח הכול ל-absolute positioning"** (מסמך התיקון §26) — Flow
Mode הוא הדרך שבה Experience נשארת רלוונטית לתוכן ארוך וכבד-נגישות
ולא רק לסצנות פתיחה קולנועיות.

### 4.4 Pinning ללא חטיפת גלילה

```
[ scene wrapper — גובה = durationVh × 100svh ]   ← זה ה"מסלול" של הגלילה
   └── [ stage — position: sticky; top: 0; height: 100svh ]  ← זה מה שרואים
          └── layers / block targets
```

זה בדיוק הדפוס של `statement.tsx` היום (`min-h-[240vh]` + `sticky top-0`),
מוכלל. אפס `preventDefault`, אפס יירוט gestures — הגלילה נשארת נייטיבית
ונגישה. Flow Mode פשוט משמיט את ה-`sticky` ומשתמש ב-target progress
מקומי במקום scene progress גלובלי.

### 4.5 גבול Server/Client

```
Server:  app/p/[pageId] → ThemeScope (server) → ExperienceProvider ("use client", מקבל config כ-prop סריאלי)
                                                    └── PageRenderer (server children דרך children prop)
```

ה-config עובר כ-prop רגיל. הבלוקים נשארים רכיבי שרת. רק ה-runtime הוא client.

### 4.6 החלקת גלילה (scroll smoothing) לעומת החלקת scrub (scrub smoothing)

שני מושגים שונים לגמרי, ומסמך התיקון (§41–42) מבחין ביניהם במפורש:

- **Scroll smoothing** (למשל Lenis, page hijacking) — **אסור לגמרי
  ב-MVP**. מיקום הגלילה הנייטיבי הוא תמיד מקור האמת; המשתמש שולט
  ב-100% מהגלילה.
- **Scrub smoothing** — עיכוב אינטרפולציה קטן שמוחל **רק על הערך
  המונפש**, לא על הגלילה עצמה. ב-MVP: `scrub = 0` (ללא עיכוב). התשתית
  (`settings.scrub?: number`) קיימת בסכמה לעתיד, אך לא ממומשת כברירת
  מחדל.

### 4.7 פילוסופיית תנועה כברירת מחדל — תיקון מפורש

מסמך התיקון §71 מתקן במפורש: ברירת המחדל של Experience היא **נקייה,
קולנועית, מלוטשת, מאופקת** — לא רועשת, לא gimmicky, לא "פסיכית". מצב
ניסיוני/עתיר-תנועה הוא **opt-in בלבד** (preset "Experimental", §13.5).
זהו תיקון ממוקד להדגשת "עיצוב פסיכי" משלב מוקדם יותר בסשן, וחל
ספציפית על שכבת ה-Experience; ערכת ה-Theme "Nova Psycho" שכבר קיימת
ונשלחה היא ארטיפקט ברמת Theme ואינה נוגעת לכלל הזה.

### 4.8 היררכיה חזותית — לא הכול זז באותה עוצמה (§68–70 במסמך התיקון)

כל scene אמור להכיל, לכל היותר: נושא ראשי אחד, נושא משני, רקע, שכבה
דקורטיבית, ו-CTA אופציונלי — בסדר עדיפות יורד. אם הכול נע באותה
עוצמה, ה-scene מאבד היררכיה. סדר העדיפויות המחייב לתנועה:

1. תנועה נרטיבית (מספרת סיפור — כניסת נושא, מעבר בין שלבים)
2. טיפוגרפיה
3. הוויזואל הראשי
4. הוויזואל המשני
5. אפקטים דקורטיביים

לכן הארכיטקטורה **חייבת** לתמוך גם ב-scenes שקטים: טיפוגרפיה בלבד,
מינימליים, או CTA סטטי לגמרי בלי שום track. Studio לא כופה "לפחות
track אחד per scene" — scene ריק מתנועה הוא קונפיגורציה לגיטימית,
לא מקרה קצה שצריך לעקוף.

### 4.9 Motion Budget, Performance Budget ומדיניות Blur (§72–74 במסמך התיקון)

**Motion budget** (מושג, לא חסימה אוטומטית): ה-runtime עוקב אחרי מספר
targets מונפשים בו-זמנית, עוצמת התנועה המצטברת, שימוש במאפיינים
"יקרים" (`blur`), ומספר אנימציות פעילות בו-זמנית ב-scene אחד. כשה-scene
עמוס — הסטודיו מציג **אזהרה**, לא חסימת יצירה (§72: "show a warning.
Do not automatically block creation").

**Performance budget** — כלל קשיח לרמת ה-runtime, לא הצעה:
- מועדף: `transform`/`translate`/`scale`/`rotate`/`opacity` (compositor-only)
- אסור בזמן גלילה: כתיבה ל-`top`/`left`/`width`/`height` (מפעילות
  layout מחדש על כל פריים) — אם נדרשת התנהגות כזו, עוטפים ב-wrapper
  נפרד ומודדים unce, לא כותבים אותה בלולאת ה-rAF

**מדיניות Blur** — `blur` הוא המאפיין ה"יקר" היחיד ברשימת ה-MVP
(§10, `performanceClass: "expensive"`): מותר לשימוש, אך בכפוף לשלושה
כללים — עוצמה מבוקרת (טווח מוגבל ב-`PropertyMetadata`, לא ערך חופשי),
עוצמה מופחתת אוטומטית במובייל (חלק ממדיניות ה-responsive, §14), ואיסור
על blur בו-זמנית על מספר גדול של אלמנטים באותו scene.

### 4.10 מדיניות ספריות חיצוניות: GSAP ו-WebGL (§106–108 במסמך התיקון)

**GSAP — לא נכנס ל-MVP.** שקילה עתידית מותנית בכל הארבעה: (1) הוכחה
בפועל שה-API הנייטיבי (rAF + CSS custom properties + `IntersectionObserver`)
לא מספיק למקרה קונקרטי, (2) המגבלה מתועדת, (3) הצורך מתועד, (4) נבנה
adapter boundary ייעודי. GSAP **לעולם לא** מתפזר כפרימיטיב גולמי
בקוד הבלוקים/הרכיבים — אם אי-פעם ייכנס, זה יהיה מאחורי שכבת הפשטה
אחת, לא כ-import ישיר במקומות רבים.

**WebGL — Phase 12 בלבד, אחרי יציבות מלאה.** נקודת ההרחבה העתידית
שנשמרת כבר בארכיטקטורת ה-Layer (§12.2):

```
ExperienceLayer
  → Renderer adapter
      → DOM/CSS   (ברירת המחדל, כל ה-MVP)
      → WebGL     (עתידי, Phase 12+)
```

renderer WebGL עתידי חייב להיות: אופציונלי (Layer רגיל ממשיך לעבוד
בלי הרחבת WebGL כלל), lazy-loaded (לא נטען כשלא בשימוש בדף), מבודד
(תקלה ב-renderer אחד לא מפילה layers אחרים), SSR-safe, ובעל
fallback — DOM/CSS regular render כש-WebGL לא זמין (מכשיר חלש,
context אבד, וכו').

**רשימת דחיות מאוחדת** (§108 במסמך התיקון, לצורך מעקב יחיד — כל
פריט כבר מוזכר בהקשרו המקומי במסמך): scroll smoothing מותאם-אישית
(§4.6), GSAP, Three.js/WebGL (מעל), Lottie, כוריאוגרפיית SVG,
תנועה מונעת-אודיו, masking מתקדם, טרנספורמציות קבוצתיות מורכבות,
טעינה מוקדמת מתקדמת של מדיה (§11 מעלה) — כולם עם נקודת הרחבה
שמורה בארכיטקטורה, אף אחד לא חוסם את ה-MVP.

---

## 5. מודל הנתונים הסופי [B]

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
רק אם הוא קיים. כל `pages-data/*.json` הקיים ממשיך לעבוד ללא נגיעה.

### 5.2 Versioning ומיגרציה [חלק מ-B]

```ts
interface ExperienceConfig {
  version: 1                       // תמיד קיים; לא מניחים שהסכמה קפואה
  enabled: boolean
  mode: "scroll"
  settings: ExperienceSettings
  scenes: ExperienceScene[]
}
```

`normalizeExperience(raw)`:
1. אם `raw` חסר / לא אובייקט → `undefined` (Standard rendering תקין)
2. אם `raw.version` לא מוכר/חסר → מיגרציה (v1 היא כרגע היחידה; מבנה
   המיגרציה `{ [from]: (cfg) => ExperienceConfigV_next }` קיים כבר
   כ-registry ריק, כך ש-v2 עתידי לא ידרוש רה-כתיבה של דפים ישנים)
3. ממלא ברירות מחדל לכל שדה חסר, מנרמל טווחי progress ל-`[0,1]`
   ומהדק (`clamp`), מנרמל durations, מסנן keyframes לא תקינים
   (out-of-range / לא ממוינים / כפולים) עם אזהרה ולא קריסה
4. קונפיגורציה שלא ניתנת לנרמול בכלל (סוג לא תואם וכו') → `undefined`
   + `console.warn` — Standard rendering הוא ה-fallback הבטוח תמיד

```ts
interface ExperienceSettings {
  defaultDurationVh: number
  defaultEasing: EasingId
  reducedMotion: "static" | "opacity-only"
  performance: "auto" | "high" | "lite"
  intensity: number                  // damper גלובלי 0–1
  scrub: number                      // 0 ב-MVP, ראו §4.6
  debug: boolean
}

interface ExperienceScene {
  id: string
  name: string
  composition: "stage" | "flow"      // §4.3
  pinned: boolean                    // רלוונטי בעיקר ל-stage
  durationVh: Responsive<number>
  background?: SceneBackground
  transition?: "cut" | "fade" | "crossfade" | "directional"
  blockRefs?: string[]
  layers: ExperienceLayer[]
  tracks: ExperienceTrack[]
}

interface ExperienceTrack {
  target: string
  range?: [number, number]
  easing?: EasingId
  props: Partial<Record<AnimatableProp, Keyframe[]>>
  responsive?: { tablet?: Partial<Record<AnimatableProp, Keyframe[]>>; mobile?: Partial<Record<AnimatableProp, Keyframe[]>> }
}

type AnimatableProp = "opacity" | "x" | "y" | "scale" | "rotate" | "blur"
interface Keyframe { at: number; value: number; easing?: EasingId }
type Responsive<T> = T | { base: T; tablet?: T; mobile?: T }
```

**למה keyframes ולא from/to:** כדי לאפשר ENTER → HOLD → EXIT בתוך scene
אחד (מסמך התיקון §35), בלי שינוי סכמה בעתיד.

**סוגי ערך עתידיים (§37 במסמך התיקון):** המודל התיאורטי הוא
`number | color | string`, אך ה-MVP ממש רק `number`. ה-`Keyframe.value`
מוקלד כ-`number` היום; הרחבה לצבע/מחרוזת תהיה union type תוסף
(`Keyframe<T>`), לא רה-כתיבה.

**UX של `durationVh` (§24 במסמך התיקון):** משתמש רגיל **לעולם לא**
רואה או מזין פיקסלים גולמיים. הסטודיו מציג יחסי-מסך בלבד — "1× מסך" /
"2× מסכים" / "3× מסכים" / "5× מסכים" — ומתרגם פנימית ל-`durationVh`.
המספר הגולמי קיים רק בשכבת הנתונים; ה-Inspector (§13.4, תת-סקשן
Motion/Basic) הוא זה שממפה בין שתי הייצוגים.

---

## 6. חוזה Scroll Root [C]

זהו הדרישה המרכזית ביותר של מסמך התיקון (§6–7). **אף חלק ב-Experience
לא רשאי להשתמש ב-`window` ישירות.**

```ts
interface ScrollRoot {
  getElement(): Window | HTMLElement;
  getScrollPosition(): number;        // px, בכיוון הגלילה הראשי
  getViewportSize(): number;          // px, גובה התצוגה של השורש הזה
  subscribe(callback: () => void): () => void;  // scroll+resize מאוחדים; מחזיר unsubscribe
}
```

שני מימושים, **אותו runtime**:

```ts
class WindowScrollRoot implements ScrollRoot {
  getElement() { return window; }
  getScrollPosition() { return window.scrollY; }
  getViewportSize() { return window.visualViewport?.height ?? window.innerHeight; }
  subscribe(cb) {
    const opts = { passive: true };
    window.addEventListener("scroll", cb, opts);
    window.addEventListener("resize", cb, opts);
    return () => { window.removeEventListener("scroll", cb); window.removeEventListener("resize", cb); };
  }
}

class ElementScrollRoot implements ScrollRoot {
  constructor(private el: HTMLElement) {}
  getElement() { return this.el; }
  getScrollPosition() { return this.el.scrollTop; }
  getViewportSize() { return this.el.clientHeight; }
  subscribe(cb) {
    const opts = { passive: true };
    this.el.addEventListener("scroll", cb, opts);
    const ro = new ResizeObserver(cb);
    ro.observe(this.el);
    return () => { this.el.removeEventListener("scroll", cb); ro.disconnect(); };
  }
}
```

**כלל מחייב (§7):** *כל* מדידה — מיקום גלילה, גובה viewport, תחילת/סוף
scene, progress, sticky behavior, breakpoints — עוברת דרך ה-`ScrollRoot`
הפעיל. אסור לערבב `window.innerHeight` / `element.clientHeight` /
`visualViewport.height` בלי דרך ההפשטה הזו. זהו התיקון הישיר לבאג
המתועד ב-R1/נספח ד'.3 (ארבע הגדרות שונות ל"גובה מסך" סביב ה-pin
היחיד הקיים).

**איך ה-scope בוחר את ה-ScrollRoot שלו:** `ExperienceProvider` מקבל
`scrollRootRef?: RefObject<HTMLElement>` אופציונלי. אם קיים →
`ElementScrollRoot`. אם לא → `WindowScrollRoot`. הסטודיו מעביר ref
ל-`<main className="overflow-auto">` (המכל הגולל האמיתי, לא מסגרת
הדפדפן המדומה — ראו תיקון הנדרש ל-`overflow-hidden` ב-Phase 2). דפים
ציבוריים לא מעבירים ref כלל ומקבלים `WindowScrollRoot` אוטומטית —
**אפס שינוי קוד** בין הקשרים.

---

## 7. חוזה Targets [D]

ה-Experience Engine **לא מכיר** מבנה DOM פנימי של בלוק. הוא מכיר רק
זהות target. זהו החוזה היציב בין בלוקים ל-Experience (§14 במסמך
התיקון).

### 7.1 Target Registry

```tsx
<ExperienceTarget id="hero-title">
  <h1 ...>{content.title}</h1>
</ExperienceTarget>
```

Registry פנימי:

```ts
class TargetRegistry {
  private map = new Map<string, HTMLElement>();
  register(id: string, el: HTMLElement) { this.map.set(id, el); }
  unregister(id: string) { this.map.delete(id); }
  resolve(id: string): HTMLElement | undefined { return this.map.get(id); }
}
```

רישום קורה ב-`useLayoutEffect` mount/unmount של `ExperienceTarget`.
**אפס `querySelector` בתוך לולאת ה-rAF** — ה-runtime תמיד קורא מה-`Map`.

### 7.2 מרחב שמות ויציבות (§13 במסמך התיקון)

```
hero-01-title
hero-01-visual
about-01-title
gallery-01-image-01
```

כלל: `blockId.targetKey` בפועל (המקף בדוגמאות לעיל הוא ייצוג — המימוש
המדויק נגזר מ-`block.id` הקיים ב-`PageBlockInstance`, שכבר ייחודי
ויציב בדף). דרישות:
- **יציב** — לא תלוי בסדר רינדור
- **דטרמיניסטי** — אותו קלט מייצר אותו ID
- **ייחודי** בדף
- **קריא בסטודיו** — `hero-01-title`, לא `t_9f2b`
- **בטוח לייבוא/ייצוא**
- **בטוח לשכפול** — שכפול בלוק/scene **מייצר target IDs חדשים**
  ומעדכן referencing tracks (§102 במסמך התיקון); זהו הרחבה ל-`resetBlock`/
  `duplicateBlock` הקיימים בסטודיו.

### 7.3 חוזה per-block

הצעה ל-Hero (מבוסס קריאה בפועל של `hero.tsx`):

`hero-eyebrow` · `hero-title` · `hero-subtitle` · `hero-cta-primary` ·
`hero-cta-secondary` · `hero-stats` · `hero-visual` · `hero-quote` · `hero-badge`

כולם כבר אלמנטים נפרדים ב-DOM — נדרש רק להוסיף wrapper דק, בלי שינוי
מבני (Phase 5, §18).

**target חסר לא מקריס** (§49 במסמך התיקון: "Experience must never
become a single point of failure"): ה-runtime מדלג, רושם warning
ב-debug mode, וממשיך.

---

## 8. מודל בעלות על מאפיינים [E]

לב הארכיטקטורה, ופתרון ישיר ל-R2. כל מנגנון מקבל **אלמנט DOM משלו**.
אף שניים לא כותבים לאותו מאפיין על אותו node:

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

ה-runtime כותב רק `--exp-*`. הוא **לא נוגע** ב-`--anim-*`, ב-`--rx/--ry`,
ב-`--progress` או בכל `--ds-*`. גבול הבעלות חד וניתן לאכיפה בבדיקה
(§16). מרחב השמות `--exp-*` נבחר במפורש כדי לא להתנגש עם המרחב התפוס
הקיים (נספח ב').

---

## 9. כללי בעלות על Track [F]

### 9.1 האינוריאנט המחייב

זוג `target + property` יכול להיות מבוקר על ידי **track אחד ויחיד**
בעל סמכות. `hero-title + opacity` לא יכול להיות מבוקר בו-זמנית על ידי
Track A ו-Track B.

### 9.2 ולידציה ואזהרות

`experience-validate.ts` בונה, עבור כל scene, מפה
`Map<`${target}.${prop}`, trackId[]>`. אם למפתח יש יותר מ-track אחד →
`OwnershipConflict`. הודעה **קריאה לאדם**, לא שגיאת סכמה טכנית (§100
במסמך התיקון):

> "שתי אנימציות שולטות במאפיין opacity על אותו Hero Title" — לא
> "duplicate track ownership on target hero-title prop opacity".

הסטודיו מציג את האזהרה ליד ה-Track editor, לא כ-console error בלבד.
**אין last-write-wins שקט.**

### 9.3 כללי התנגשות עם תנועה קיימת (§18 במסמך התיקון)

לפני שהרשת target הופך ל-Experience-controlled, ה-runtime/הסטודיו
בודקים אם הוא כבר נשלט על ידי Reveal / SplitWords / Statement /
Tilt / hover / marquee / aurora / beam / button-motion. שלוש תגובות
אפשריות, לעולם לא דריסה שקטה:

1. **wrapper ייעודי** (ברירת המחדל — `.exp-motion`, §8)
2. **השבתת האנימציה הלא-תואמת** על ה-wrapper הספציפי (למשל: אם target
   הוא גם `[data-animate]` של Reveal, ה-Experience Target Wrapper
   יכול לשאת `data-experience-override-reveal` שמכבה את ה-Reveal
   המקומי דרך selector ב-CSS, כדי שלא יתחרו על `opacity`)
3. **הכרזת חוסר-תאימות** — target מסומן `incompatible: true` ברישום
   הבלוק; הסטודיו לא מציע אותו לבחירה כלל

### 9.4 רשימת אלמנטים אסורים (infinite CSS animation, R12)

`.fx-marquee-track` ו-`.fx-aurora i` מבוקרים על ידי `@keyframes`
אינסופי שגובר בקסקדה על כל כתיבת inline style. הרשימה הזו קשיחה
בקוד (`INCOMPATIBLE_TARGETS` ב-`lib/experience.ts`), נבדקת בזמן
ולידציה, ומוצגת בסטודיו כ"לא ניתן להנפשה — מונפש כבר ברציפות" במקום
כישלון שקט.

---

## 10. מודל Property Metadata / Units [G]

מודל מרכזי אחד לכל מאפיין אנימבילי, מזין גם את ה-runtime (ולידציה,
אינטרפולציה) וגם את ה-Studio UI (סוג ה-input, טווח הסליידר):

| מאפיין | data type | יחידה | אינטרפולציה | טווח | ברירת מחדל | performance class |
|---|---|---|---|---|---|---|
| `opacity` | numeric | unitless | linear | `0..1` | `1` | cheap (compositor) |
| `x` | responsive length | `%` / `vw` / `rem` | linear | ללא הגבלה | `0` | cheap (compositor, `translate`) |
| `y` | responsive length | `%` / `vh` / `rem` | linear | ללא הגבלה | `0` | cheap (compositor, `translate`) |
| `scale` | numeric | unitless | linear | `>= 0` | `1` | cheap (compositor) |
| `rotate` | angle | `deg` | linear | ללא הגבלה | `0deg` | cheap (compositor) |
| `blur` | length | `px` | linear | `>= 0` | `0px` | **יקר** (`filter`, ראו §15.2 מובייל) |

```ts
interface PropertyMetadata {
  type: "numeric" | "angle" | "length" | "responsive-length";
  unit: string;
  interpolation: "linear"; // MVP; extensible
  range?: [number, number | null];
  default: number;
  performanceClass: "cheap" | "expensive";
}
const PROPERTY_METADATA: Record<AnimatableProp, PropertyMetadata> = { /* ... */ };
```

הרחבה עתידית מתוכננת (לא ב-MVP): `color`, `clip-path`, `border-radius`,
`background-position` — הטבלה בנויה כך שהוספת שורה לא דורשת שינוי
מבנה.

---

## 11. Scene Lifecycle [H]

לא `active: boolean`. State machine מפורש (§9 במסמך התיקון):

```
BEFORE → ENTERING → ACTIVE → LEAVING → AFTER
```

```ts
type SceneLifecycleState = "before" | "entering" | "active" | "leaving" | "after";
```

**MVP** משתמש בפועל רק ב-`before` / `active` / `after` (scene נכנס
לטווח ה-pin, נמצא בו, יוצא ממנו) — אך הארכיטקטורה שומרת את חמשת
המצבים כדי לתמוך בעתיד ב:
- כוריאוגרפיית entrance/exit נפרדת מהכוריאוגרפיה הפנימית
- **טעינה מוקדמת של מדיה** (§50 במסמך התיקון) — לא ממומש ב-MVP, אך
  נקודת ההרחבה מוגדרת כאן: ה-runtime יודע איזה scene `active`, איזה
  `before`/`after` הכי קרוב (השכן הבא לפי סדר), ואיזה רחוק. עתידית:
  מדיה של ה-scene הפעיל נטענת רגיל; מדיה של השכן הבא מקבלת
  `<link rel="preload">`/`loading="eager"`; scenes רחוקים נשארים
  `loading="lazy"`. אין להוסיף התנהגות רשת יזומה מעבר לזה ב-MVP.
- lazy media, מעברי scene מורכבים

ה-`ExperienceRuntime` מחשב את המצב מתוך scene progress גולמי (לפני
clamp): `progress < 0` → `before`; `progress` נכנס לטווח 0–ε → `entering`
(אם מוגדר transition-in); `0 ≤ progress ≤ 1` → `active`; יוצא → `leaving`;
`progress > 1` → `after`.

---

## 12. מודל Freeform Layer [J]

### 12.1 היקף MVP — מצומצם במפורש (§27 במסמך התיקון)

**5 טיפוסים בלבד ב-MVP:**

1. **Text** — h1–h4/p/span (§13 בהמשך, semantic HTML מחייב)
2. **Image** — עם alt text חובה / decorative toggle
3. **Shape** — decorative (ellipse/rect/blob פשוטים דרך CSS/SVG)
4. **Button** — עוטף את ה-`Button` הקיים, לא בונה כפתור חדש
5. **Block Reference** — הגשר בין Experience לבלוקים קיימים (§12.3)

**נדחה במפורש לאחר שה-engine יציב:** Video, Stat, Logo, Group.
**עתיד רחוק:** SVG choreography, Lottie, 3D, Canvas, WebGL.

### 12.2 חוזה Layer

```ts
interface ExperienceLayer {
  id: string;
  type: "text" | "image" | "shape" | "button" | "block";
  content: Record<string, unknown>;   // טיפוס ספציפי per type, מטופל ב-layer dispatcher
  layout: Responsive<LayerLayout>;
  style?: LayerStyle;
}

interface LayerLayout {
  mode: "stage" | "flow";
  x?: string; y?: string;             // "50%", "12vw" — לעולם לא px, ראו §10
  width?: string; maxWidth?: string;
  anchor?: "start" | "center" | "end"; // גם transform-origin, §12.4
  zIndex?: "background" | "background-decoration" | "content" | "foreground" | "ui"; // §12.5
}
```

**כלל יחידות:** אחוזים / `vw` / `vh` / `rem` / `clamp()` בלבד. אין px
במיקום — תנאי ל-responsive אמיתי (§29 במסמך התיקון).

**כלל צבע:** `LayerStyle` מצביע על טוקני הערכה (`primary`, `accent`,
`text`, `muted`, `surface`, `background`, `border`) ולא על hex. צבע
custom מותר אך **חייב** לעבור דרך `lib/contrast.ts` הקיים — אין
contrast checker שני (§65 במסמך התיקון).

### 12.3 Block Reference Layer

`{ type: "block", content: { blockId: string } }` — הגשר בין Experience
לבין Testim הקיים. Scene יכול "לתפוס" בלוק קיים מהדף ולתת לו
כוריאוגרפיה, **בלי לשכפל את התוכן שלו לתוך סכמת ה-Experience** (§104
במסמך התיקון: "Do not duplicate block content into the Experience
schema. Reference it."). זה גם מה ש-`blockRefs` ב-`ExperienceScene`
עושה ברמת ה-scene כולה.

### 12.4 עוגן/מקור טרנספורמציה

`anchor: "start" | "center" | "end"` (או שקול `"start center"` וכו')
קובע transform-origin — סקייל וסיבוב חייבים מקור צפוי, נשלט מה-Studio,
לא ברירת מחדל שרירותית של הדפדפן.

### 12.5 מודל Z-Index מנורמל

אסור למשתמש להזין `z-index: 8742`. חמש שכבות סמנטיות בלבד
(`background` / `background-decoration` / `content` / `foreground` /
`ui`), הממופות למספרים קבועים פנימית. שכבות ניתנות לסידור מחדש בתוך
כל קבוצה, אך לא לקפוץ מחוץ לחמש הרמות (§31 במסמך התיקון).

### 12.6 סמנטיקה: תוכן מול קישוט

Layer types מסווגים ל**semantic** (טקסט, תמונות משמעותיות, כפתורים,
תוכן מובנה) ו-**decorative** (shapes, gradient orbs, קווי קישוט).
Decorative layers מקבלים `aria-hidden="true"` אוטומטית ולא נכנסים
ל-accessibility tree (§32 במסמך התיקון).

**Text layer לא ברירת מחדל ל-`div`.** בחירת תג סמנטי (`h1`–`h4`/`p`/
`span`) היא שדה גלוי וברור ב-Basic tab של ה-Inspector, לא אופציה
ל"מתקדמים בלבד" (§33 במסמך התיקון).

**Image layer** דורש `alt` (או `decorative: true` מפורש). Video layer
עתידי (post-MVP) יידרש `poster`/`muted`/`loop`/`controls` ו-reduced-motion
fallback מובנה — אין הנחת autoplay נגישה כברירת מחדל.

---

## 13. Studio UX Wireframe [K]

### 13.1 עקרון-על

ה-Experience Studio **לא** אמור להיראות כמו After Effects. Progressive
disclosure: פקדים בסיסיים תחילה, פקדים מתקדמים על-פי בקשה, פריסטים
לפני controls טכניים, פידבק חזותי תמיד גלוי (§51–52 במסמך התיקון).

### 13.2 פריסה — 4 panes

```
┌────────────┬───────────────────────────────┬──────────────┐
│            │                               │              │
│   SCENES   │          LIVE STAGE           │   INSPECTOR  │
│            │                               │              │
│   סצנה 1   │        (תצוגה חיה,            │  Selected    │
│   סצנה 2   │      זו העדיפות הראשונה)      │  Layer       │
│   סצנה 3   │                               │  Controls    │
│            │                               │              │
├────────────┴───────────────────────────────┴──────────────┤
│                       TIMELINE                              │
└───────────────────────────────────────────────────────────┘
```

Scenes משמאל, Live Stage במרכז, Inspector מימין; Timeline ברוחב מלא
בתחתית. הפריסה נשארת שמישה ברזולוציות קטנות יותר (stacking אנכי מתחת
ל-breakpoint מוגדר) — לא ממומש ב-MVP הראשוני של ה-Studio אך מהווה
אילוץ עיצובי לרכיבי ה-CSS מ-Phase 7.

**Live Stage היא ה-UX הראשית** (§54): המשתמש תמיד רואה תוצאה. אין מסך
שבו קודם ממלאים טופס ורק אח"כ מגלים איך זה נראה.

### 13.3 Timeline UX

MVP: אופקי, שורה אחת per target/layer, התחלה/סוף/keyframes נראים,
scrubber, אינדיקטור progress נוכחי:

```
0% ───────────────────────────── 100%

Headline       ████████████
Visual             ███████████████
CTA                         ███████
Background     █████████████████████
```

**Scrub preview** (§56): גרירת ה-scrubber מעדכנת את ה-Stage מיידית
**בלי גלילה אמיתית** — חיוני לעריכה. מבחינה טכנית: scrub עוקף את
`ScrollRoot.getScrollPosition()` בזמן גרירה ומזין ל-runtime progress
ידני ישירות.

### 13.4 Inspector — מבנה קבוע

- **Basic** — content / position / size / visibility / semantic type
- **Style** — typography / color / background / radius / shadow
  (משתמש ב-`FONT_PAIRS` ובטוקני Theme קיימים — לא ספריית טיפוגרפיה
  שנייה, §67)
- **Motion** — start / end / easing / keyframes; ברירת מחדל היא
  צ'יפים אנושיים (`Off` / `Gentle` / `Dynamic` / `Dramatic`, §61),
  keyframes גולמיים רק ב-Advanced/Expert
- **Advanced** — מקופל כברירת מחדל (`<details>`, אותה קונבנציה כמו
  `BlockEditor` הקיים היום)

### 13.5 פריסטים (§62–64 במסמך התיקון)

שישה פריסטים, כל אחד מגדיר ברירות מחדל ל-composition/pacing/motion
intensity (לא צבעים — אלה מגיעים מה-Theme, ראו העיקרון המחייב למטה):

| פריסט | אופי |
|---|---|
| **Cinematic** | כהה, טיפוגרפיה גדולה, קצב איטי, מעברים חזקים |
| **Editorial** | נקי, תנועה מאופקת, מונחה-טיפוגרפיה |
| **Digital** | כהה, glow, גריד, סקייל בולט יותר |
| **Luxury** | מרווח, טיפוגרפיה מעודנת, ניגודיות רכה, תנועה מאופקת |
| **Bold** | טיפוגרפיה גדולה, ניגודיות חזקה, תנועה חזקה יותר |
| **Experimental** | היחיד עם אופי "פסיכי"/עמוס-שכבות/א-סימטרי/דרמטי — **opt-in בלבד**, §4.7 |

כל פריסט עובר בדיקת ניגודיות אוטומטית (`lib/contrast.ts`) לפני שהוא
מוצג כאופציה.

**עיקרון מחייב:** פריסטים **לא** מחליפים את מערכת ה-Theme. Theme קובע
זהות (צבעים/פונטים/צורה). Experience preset קובע קומפוזיציה/תנועה/
קצב. הם משלימים זה את זה — preset תמיד קורא מטוקני ה-Theme הפעיל,
לעולם לא hardcoded (§64).

### 13.6 מצבי ריק ושגיאה (§99–100 במסמך התיקון)

| מצב | הודעה |
|---|---|
| אין Experience עדיין | "צור את הסצנה הראשונה שלך" |
| אין layers ב-scene | "הוסף layer כדי להתחיל" |
| אין layer נבחר | "בחר layer כדי להנפיש אותו" |
| התנגשות בעלות (§9.2) | "שתי אנימציות שולטות במאפיין opacity על אותו Hero Title" + קישור "פתח סצנה" |

לעולם לא panel טכני ריק, ולעולם לא הודעת שגיאה טכנית גולמית.

### 13.7 Debug Mode (§89 במסמך התיקון)

Overlay נפרד ויזואלית מה-UX הרגיל, מציג: scene פעיל, scene progress,
target count, active target count, target-local progress, מצב
responsive, מצב reduced-motion, ואינדיקטור ביצועים אופציונלי.

### 13.8 שימוש חוזר בתשתית קיימת

- **Viewport toggle** — Experience משתמש ב-`viewport`/`viewports`
  הקיימים ב-`studio-app.tsx`, לא בונה מנגנון תצוגה מקבילה (§80–81).
- **Reset/undo toast** — אותו דפוס כמו `resetField`/`resetBlock`
  הקיים ב-`block-editor.tsx` (§101).
- **Duplication** — שכפול scene מייצר ID חדש ומחדש layer/target IDs
  (§102), באותה רוח כמו התנהגות שכפול בלוק היום.

---

## 14. אסטרטגיית Responsive [L]

Desktop אינו גרסה מוקטנת של מובייל (§46 במסמך התיקון). ערכים
responsive מפורשים לפחות לשלושה breakpoints (desktop/tablet/mobile)
עבור: אורך scene, מיקום layer, סקייל, טיפוגרפיה, נראות, עוצמת תנועה,
ולעיתים מצב הקומפוזיציה עצמו.

**אסטרטגיית מובייל (§47):** לא רק scaling — פישוט מכוון: פחות layers,
פחות אפקטים, פחות blur, פחות pointer interactions, scenes קצרים
יותר, עוצמת תנועה מופחתת, ולעיתים שינוי נראות ישיר (layer מוסתר
במובייל).

הסטודיו חייב להראות בבירור אילו ערכים משותפים, אילו נדרסים ב-tablet
ואילו ב-mobile (§81) — לא להסתיר את ההבדל בתוך המימוש.

---

## 15. אסטרטגיית נגישות [M]

- **`prefers-reduced-motion: reduce`** → קומפוזיציה סטטית content-first;
  pinning קולנועי, לולאות דקורטיביות רציפות וטרנספורמציות לא-הכרחיות
  מושבתות/מפושטות. כל תוכן משמעותי נשאר גלוי ושמיש (§48).
- **בלי JavaScript** → Standard content flow מלא (§49).
- **קונפיגורציית Experience לא תקינה** → נפילה חיננית ל-Standard.
- **target חסר** → ממשיך לרנדר, לא קורס.
- **Scene לא תקין** → מושבת, השאר ממשיך.
- **HTML סמנטי** — text layers עם תג סמנטי אמיתי (§33); layers
  דקורטיביים מוצאים מה-accessibility tree (§32).
- **מדיה** — alt חובה/decorative toggle לתמונות; מטא-דאטה נגישה
  ל-video עתידי (§34).
- **סדר focus** נשמר; קומפוזיציית absolute לא רשאית לשבש tab order
  הגיוני.
- **ניגודיות** — אך ורק דרך `lib/contrast.ts` הקיים (§65–66), כולל
  אסטרטגיית overlay לטקסט על תמונה/וידאו. לא מתיימרים לניתוח ניגודיות
  אוטומטי מושלם על תמונות.

---

## 16. אסטרטגיית בדיקות [N]

### 16.1 תשתית — מאושרת

הוספת `vitest` כ-devDependency (Phase 0.5). לא היה test runner בפרויקט
היום כלל.

### 16.2 Baseline suite (Phase 0.5, לפני כל שינוי ל-Experience)

- נורמליזציית `Page` קיימת
- ייבוא/ייצוא `Page` קיים
- נורמליזציית `Theme` קיימת
- רינדור Standard page (smoke — `PageRenderer` עם page/theme אמיתיים)
- רינדור Studio (smoke)
- resolve של animation config קיים (`lib/effects.ts`)
- RTL היכן שניתן לבדוק בלי דפדפן מלא (בדיקת מחרוזות `dir`/לוגיקה)

### 16.3 Experience test matrix (מ-Phase 1 ואילך)

| קטגוריה | מקרים |
|---|---|
| Schema | Experience תקין / לא תקין / normalization / version handling |
| Progress | `0`, `.25`, `.5`, `.75`, `1` |
| Clamping | `-1`, `2`, `NaN` |
| Tracks | property יחיד, מספר properties, טווחים חופפים |
| Keyframes | ממוינים, לא ממוינים, כפולים, חסרים, out-of-range |
| Target Registry | register, unregister, כפילות, missing |
| Scroll Root | Window, HTMLElement, resize, cleanup |
| Runtime | הפעלת scene, שחרור scene, גלילה מהירה, resize תוך גלילה |
| נגישות | reduced motion, keyboard, פלט סמנטי, fallback בלי JS |

### 16.4 QA חזותי וברואוזרים

מינימום: Standard desktop/mobile, Experience desktop/mobile, Studio
desktop/mobile preview — כל אחד נבדק להיררכיה, תנועה, clipping,
sticky, responsive, ניגודיות, focus, גלישת טקסט, התנהגות מדיה. דפדפני
יעד: Chrome + Safari עדכניים + סביבת מובייל אחת לפחות — לא מניחים
שהתנהגות desktop שקולה למובייל.

---

## 17. עץ קבצים מוצע — שינויים מדויקים [O]

מותאם לקונבנציות הקיימות (`lib/*.ts` שטוח, `components/<domain>/`,
הערות בעברית):

```
lib/
  experience.ts               טיפוסים + קבועים + PROPERTY_METADATA + INCOMPATIBLE_TARGETS
  experience-normalize.ts     normalizeExperience + versioning/migration registry
  experience-validate.ts      ולידציה + Track-Ownership conflicts + דוחות אזהרה קריאים
  experience-interpolate.ts   interpolate / evaluateTrack / evaluateKeyframes / normalizeProgress
  experience-presets.ts       Scene presets (Cinematic/Editorial/Digital/Luxury/Bold/Experimental)
  scroll-root.ts              ScrollRoot interface + WindowScrollRoot + ElementScrollRoot  (Phase 0.5)

components/experience/
  experience-provider.tsx     "use client" — context + runtime bootstrap
  experience-runtime.ts       rAF יחיד, SceneRegistry, TargetRegistry (לא רכיב React)
  experience-scene.tsx        wrapper + sticky stage, composition: stage/flow
  experience-target.tsx       <ExperienceTarget id> — עוטף .exp-motion
  experience-layer.tsx        דיספצ'ר לפי layer.type (5 טיפוסי MVP)
  experience-debugger.tsx     overlay דיבוג
  layers/
    text-layer.tsx  image-layer.tsx  shape-layer.tsx
    button-layer.tsx  block-layer.tsx

components/studio/experience/
  experience-panel.tsx        הטאב השלישי "חוויה"
  scene-list.tsx               ניהול scenes (הוספה/מחיקה/שכפול/סידור)
  scene-editor.tsx             הגדרות scene + composition toggle
  layer-editor.tsx             Inspector: Basic/Style/Motion/Advanced
  timeline-editor.tsx          טיימליין + scrubber

tests/  (Phase 0.5 ואילך, vitest)
  page-normalize.test.ts  page-io.test.ts  theme-normalize.test.ts
  render-standard.test.tsx  render-studio.test.tsx  effects-resolve.test.ts
  experience-normalize.test.ts  experience-interpolate.test.ts
  experience-validate.test.ts  scroll-root.test.ts

docs/
  experience-audit.md         ← המסמך הזה (Phase 0 + Phase 1 proposal)
  experience-engine.md        (נכתב ב-Phase 2)
  experience-schema.md        (נכתב ב-Phase 1)
  experience-studio.md        (נכתב ב-Phase 7)
```

**שינויים בקבצים קיימים (מינימליים, לא רה-כתיבה):**
- `lib/page.ts` — הוספת `experience?: ExperienceConfig` ל-`Page`,
  קריאה ל-`normalizeExperience` בתוך `normalizePage`
- `components/theme-scope.tsx` / `components/page-renderer.tsx` —
  נקודת עטיפה ל-`ExperienceProvider` (רק אם `page.experience?.enabled`)
- `components/blocks/hero.tsx` (ואח"כ Statement/About/Gallery/Steps/
  CTA/Logos) — הוספת `<ExperienceTarget id>` wrappers דקים בלבד
- `components/fx/count-up.tsx` — תיקון cleanup (Phase 0.5, §18.1)
- `components/blocks/statement.tsx`, `components/fx/tilt-card.tsx` —
  תיקון עקביות מאזין `matchMedia` (Phase 0.5, §18.1)
- `components/studio/studio-app.tsx` — טאב שלישי, ref ל-scroll
  container אמיתי (לא מסגרת הדפדפן המדומה) עבור `ElementScrollRoot`
- `app/globals.css` — הגדרת `.exp-motion` וקידומת `--exp-*` (§8)
- `package.json` — `vitest` כ-devDependency + סקריפט `test`

---

## 18. פירוט שלבים מדויק [P]

לפני כל שלב: קריאה ב-`node_modules/next/dist/docs/` לפי `AGENTS.md`.
אחרי כל שלב (שער — §110 במסמך התיקון): `build` + `lint` + בדיקות +
דפים קיימים עובדים + סטודיו עובד + אימות חזותי + תיעוד מעודכן — ורק אז
הלאה. אם שער נכשל — מתקנים לפני שממשיכים.

| Phase | תוכן | שער יציאה |
|---|---|---|
| **0** | האודיט | ✅ הושלם ואושר |
| **0.5** | **Motion Foundation** — `vitest` + baseline regression tests + `ScrollRoot` (Window+Element) + תיקון cleanup ל-`CountUp` + מדיניות יחידות viewport + עקביות מאזין reduced-motion | ✅ **הושלם.** 62 בדיקות עוברות (`npm test`), `build`+`lint` נקיים, אומת בדפדפן אמיתי (Playwright מול production build): `/p/demo` — Statement `--progress` עדיין מתקדם 0→1 בגלילה, CountUp מציג ערכים סופיים תקינים; reduced-motion אמיתי (`emulateMedia`) — `--progress` נשאר 1 גם אחרי ניסיון גלילה; `/studio` נטען ללא קריסה. ראו §21 לפירוט |
| **1** | סכמה: טיפוסים, `normalizeExperience`, ולידציה, versioning, Property Metadata | `Page` ישן עובר ללא שינוי; בדיקות יחידה עוברות |
| **2** | Runtime: `ExperienceProvider`, rAF יחיד, `SceneRegistry`, `TargetRegistry` — **כולל תיקון באג ה-Statement/sticky בסטודיו דרך ה-`ScrollRoot`** | Statement עובד גם ב-`/p/demo` וגם ב-`/studio`; אפס hack ייעודי לסטודיו |
| **3** | Timeline: interpolate, keyframes, easing, Track Ownership validation | בדיקות יחידה על 0/0.25/0.5/1/clamp/NaN; זיהוי התנגשות בעלות |
| **4** | Scene + Stage + sticky pinning + transitions + **Stage/Flow composition modes** | scene נעוץ ומשוחרר תקין; אין clip; שני מצבי הקומפוזיציה עובדים |
| **5** | Targets בבלוקים קיימים: Hero → Statement → About → Gallery → Steps → CTA → Logos | בלוק עובד עם ובלי Experience |
| **6** | Freeform MVP — **5 טיפוסים בלבד**: Text/Image/Shape/Button/Block-Reference | freeform scene נבנית מ-JSON; Video/Stat/Logo/Group נדחים במפורש |
| **7** | Studio: טאב, 4-pane layout, scene manager, layer editor, timeline, scrubber, empty/error states | עריכה משנה תצוגה בפועל; scrub עובד בלי גלילה אמיתית |
| **8** | Presets (6, כולל Experimental כ-opt-in) + debug mode + motion budget | preset לא נכשל בניגודיות; ברירת מחדל מאופקת |
| **9** | Demo `/preview/scroll-experience` — 5 סצנות (Hero/Typography/Media/Multi-layer/CTA), editable מה-Studio | לא hardcoded — Page+Theme+Experience JSON אמיתיים |
| **10** | QA מקצה לקצה: בדיקות + נגישות + reduced-motion + no-JS + RTL + מובייל + דפדפנים | כל ה-DoD (§19) |
| **11** | ביצועים: desktop/mobile profiling, memory, motion budget בפועל, cleanup מלא | אפס דליפות rAF/listeners/observers |
| **12** | *אופציונלי בלבד, אחרי יציבות מלאה:* WebGL adapter boundary | — |

**MVP מומלץ להמשך מיידי:** Phases 1–5 + 7 (חלקי, ללא presets/debug
מלאים) + 9. זה נותן חוויית גלילה אמיתית ועריכה בסיסית על בלוקים
קיימים. Phase 6 (freeform) נכנס ל-scope לפי §27 במסמך התיקון אך הוא
המשך משמעותי בפני עצמו.

---

## 19. Definition of Done [Q]

### Core
- [ ] דפי Standard ממשיכים לעבוד ללא שינוי
- [ ] Theme Engine ללא שינוי התנהגותי
- [ ] Effects Engine ללא שינוי התנהגותי
- [ ] 17 הבלוקים עובדים ללא Experience
- [ ] `Page` JSON קיים ממשיך לעבוד
- [ ] Experience נשאר אופציונלי לחלוטין

### Runtime
- [ ] `WindowScrollRoot` עובד
- [ ] `ElementScrollRoot` (סטודיו) עובד
- [ ] Scene lifecycle עובד (5 מצבים, MVP subset)
- [ ] Scene progress עובד
- [ ] Target Registry עובד
- [ ] Track Ownership נאכף ומוצג
- [ ] Keyframes + אינטרפולציה עובדים
- [ ] ערכים responsive עובדים
- [ ] Pinning עובד (גם בדף ציבורי, גם בסטודיו)
- [ ] Transitions בין scenes עובדים

### Composition
- [ ] Stage Mode עובד
- [ ] Flow Mode עובד
- [ ] Text / Image / Shape / Button / Block-Reference layers עובדים

### Studio
- [ ] Scene manager (הוסף/מחק/שכפל/שנה שם/סדר) עובד
- [ ] Layer manager עובד
- [ ] Inspector (Basic/Style/Motion/Advanced) עובד
- [ ] Timeline עובד
- [ ] Scrub עובד בלי גלילה אמיתית
- [ ] Replay עובד
- [ ] Responsive preview (משותף עם ה-viewport הקיים) עובד
- [ ] Presets עובדים (6, ניגודיות נבדקת)
- [ ] Debug mode עובד
- [ ] מצבי שגיאה קריאים לאדם קיימים
- [ ] מצבי ריק קיימים
- [ ] Reset/duplication flows עובדים

### נגישות
- [ ] פלט טקסט סמנטי
- [ ] נגישות מקלדת
- [ ] reduced motion → קומפוזיציה סטטית
- [ ] fallback בלי JS
- [ ] layers דקורטיביים מוצאים מה-accessibility tree
- [ ] מטא-דאטה נגישה למדיה
- [ ] סדר focus נשמר

### ביצועים
- [ ] אפס re-render של עץ React per frame
- [ ] אפס DOM query מיותר per frame
- [ ] לולאת rAF מרכזית אחת per scope
- [ ] cleanup מלא (rAF/listeners/ResizeObserver/matchMedia/targets)
- [ ] motion budget קיים
- [ ] מובייל מבוקר במכוון (לא רק scaled-down)

### אמינות
- [ ] `normalizeExperience` עובד
- [ ] ולידציה עובדת
- [ ] Experience פגום נופל בחינניות ל-Standard
- [ ] target חסר לא מקריס
- [ ] תאימות לאחור נשמרת
- [ ] ייבוא/ייצוא עובד

### איכות
- [ ] היררכיה חזותית מכוונת (לא הכול זז באותה עוצמה)
- [ ] דפים מרגישים premium, לא "אוסף טריקים"
- [ ] תנועה נרטיבית, לא רעש דקורטיבי
- [ ] Studio נוח ואינטואיטיבי
- [ ] מובייל מעוצב במכוון
- [ ] RTL תקין (`start`/`end`, לא `left`/`right`)
- [ ] ניגודיות דרך `lib/contrast.ts` בלבד
- [ ] `build` נקי
- [ ] `lint` נקי
- [ ] בדיקות עוברות
- [ ] תיעוד קיים (engine/schema/studio)

---

## 20. החלטות — כולן פתורות

| # | החלטה | סטטוס |
|---|---|---|
| 1 | תשתית בדיקות | ✅ **מאושר** — `vitest`, Phase 0.5 |
| 2 | היקף MVP ל-freeform | ✅ **מוכרע** — 5 טיפוסים: text/image/shape/button/block-ref (§12.1) |
| 3 | מתי לתקן באגי הסטודיו | ✅ **מוכרע** — דרך `ScrollRoot` עצמו, Phase 0.5 (ההפשטה) + Phase 2 (החיווט בפועל), לא hack נפרד |

**אין החלטות פתוחות שחוסמות את Phase 0.5.** לפי ההרשאה המפורשת של
מסמך התיקון, מימוש Phase 0.5 מתחיל מיד בהמשך סשן זה.

---

## 21. Phase 0.5 — דוח ביצוע (Motion Foundation, הושלם)

מומש באותו סשן, מיד אחרי אישור המסמך הזה. שינויים בפועל:

| קובץ | שינוי |
|---|---|
| `package.json`, `package-lock.json` | `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `vite-tsconfig-paths` כ-devDependencies; סקריפטים `test` (`vitest run`) ו-`test:watch` (`vitest`) |
| `vitest.config.mts` | jsdom environment, tsconfig-paths, `setupFiles: vitest.setup.ts` |
| `vitest.setup.ts` | פוליפילים ל-`matchMedia`/`IntersectionObserver`/`ResizeObserver`/`requestAnimationFrame` (jsdom לא מממש אף אחד מהם, ורכיבי fx אמיתיים נבדקים כאן, לא מדומים) + `afterEach(cleanup)` גלובלי |
| `lib/scroll-root.ts` **(חדש)** | `ScrollRoot` interface + `WindowScrollRoot` + `ElementScrollRoot` + `createScrollRoot()` — בדיוק לפי §6 |
| `components/fx/use-reduced-motion.ts` **(חדש)** | הוק משותף `useReducedMotion()`; ערך התחלתי סינכרוני (lazy `useState` initializer) כדי שלא יהיה רגע-ביניים שגוי, ומאזין `change` אמיתי |
| `components/fx/count-up.tsx` | עבר ל-`useReducedMotion()`; מסלול ה-rAF (`rafId`) עכשיו מבוטל ב-cleanup — תיקון דליפת ה-rAF (נספח ד'.1) |
| `components/blocks/statement.tsx` | עבר ל-`useReducedMotion()` (תלות ב-effect); `min-h-[240vh]` → `min-h-[240svh]` ליישור משפחת יחידות עם `min-h-svh` הקיים (נספח ד'.3) |
| `tests/*.test.ts(x)` **(9 קבצים חדשים, 62 בדיקות)** | ראו §16.2–16.3 — page/theme normalization, page I/O, effects resolution, standard+studio render smoke, RTL, ScrollRoot, useReducedMotion, CountUp cleanup, Statement reactivity |

**תיקון לאודיט עצמו תוך כדי העבודה:** G9/נספח ד'.5 טענו בטעות ש-
`tilt-card.tsx:40` הוא מאזין reduced-motion חסר-עקביות. בפועל זו בדיקת
יכולת מצביע (`hover:hover) and (pointer:fine`), לא קשורה כלל, ו-
`.fx-tilt` כבר מטופל נכון ב-CSS בלבד. תוקן במקום.

**שער היציאה — כולו ירוק:**
- `npm test` → 62/62 עוברות
- `npm run lint` → נקי
- `npm run build` → מצליח, `tsc` נקי על כל הפרויקט (כולל `tests/`)
- אימות Playwright מול production build אמיתי (`npm run start`):
  - `/p/demo`: `--progress` של Statement מתקדם 0→1 בגלילה רגילה
    (כמו לפני התיקון — אין רגרסיה); תחת `emulateMedia({reducedMotion:
    "reduce"})` נשאר קבוע על 1 גם אחרי ניסיון גלילה (זה בדיוק ההתנהגות
    הנכונה); CountUp מציג ערכים סופיים תקינים (`+10`, `+198`, `81%`)
  - `/studio`: נטען ללא קריסה, 72 כפתורים מרונדרים, `<main>` קיים
  - שגיאת console היחידה בשני המקרים היא `ERR_CONNECTION_RESET` על
    Google Fonts — תוצר של סביבת הסנדבוקס חסרת האינטרנט, לא קשור
    לשינויים

**מה עדיין לא נגעתי בו (במכוון, מחוץ להיקף §4/§87 במסמך התיקון):**
איחוד שתי קונבנציות ה-IntersectionObserver (Reveal מול CountUp),
מיגרציית CountUp ל-runtime מבוסס-CSS-vars כמו Statement, ותיקון
`min-h-screen` של `.ds-scope` ברמת העמוד. אלה נשארים תיעוד לעתיד
בנספח ד', לא משימות Phase 0.5.

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
| C8 | `.fx-marquee-track` | `translate` דרך `animation` | **בליעה שקטה** — ראו R12/§9.4 |
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

## נספח ד' — חובות טכניים קיימים, בטיפול ב-Phase 0.5

לא חוסמים היקף רחב יותר, אך אלה **בדיוק** ששת הפריטים שנכנסים ל-Phase
0.5 (§4 במסמך התיקון: "Do not turn this into a broad technical-debt
cleanup project"):

1. `count-up.tsx` — לולאת ה-rAF **לא מבוטלת ב-unmount**; רק ה-observer
   מנותק. tween באוויר ימשיך לקרוא ל-`setDisplay`. **← Phase 0.5**
2. שתי קונבנציות IO שונות בקוד: `threshold 0.6 / rootMargin +15%`
   (CountUp) מול `0.15 / -12%` (Reveal). **לא** מאוחדות ב-Phase 0.5 —
   מחוץ להיקף המצומצם; מתועד כאן להמשך עתידי בלבד.
3. אי-התאמת יחידות גובה סביב ה-pin היחיד הקיים: `min-h-screen` (`100vh`)
   ב-scope, `min-h-[240vh]` בעוטף, `min-h-svh` ב-sticky, ו-
   `window.innerHeight` בחישוב — ארבע הגדרות שונות ל"גובה מסך" בסצנה אחת.
   **← Phase 0.5** (מדיניות יחידות viewport אחידה, נצרכת גם על ידי
   `ScrollRoot`)
4. `CountUp` עושה `setState` בכל פריים (re-render per frame) בעוד
   ה-Statement עושה אפס. ה-runtime החדש חייב לאמץ את הדפוס של Statement
   — לא לתקן את `CountUp` להשתמש ב-runtime (מחוץ להיקף Phase 0.5; רק
   ה-cleanup bug מתוקן שם).
5. `matchMedia` לreduced-motion נקרא פעם אחת ב-mount, בלי מאזין לשינוי,
   בשני מקומות: `statement.tsx:31`, `count-up.tsx:38`. **← Phase 0.5**
   (עקביות מאזין reduced-motion — הופך ל-hook משותף `useReducedMotion()`
   ב-`components/fx/use-reduced-motion.ts`, שנצרך גם על ידי Experience
   Provider מ-Phase 2 ואילך). `tilt-card.tsx:40` **אינו** קשור —
   ראו תיקון ב-G9: זו בדיקת יכולת מצביע, ו-`.fx-tilt` כבר מטופל נכון
   דרך CSS `@media (prefers-reduced-motion: reduce)` בלבד, ללא JS.

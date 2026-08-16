# Experience Engine — ביקורת עצמית סופית

**תאריך:** 2026-08-16
**היקף:** Scroll-Driven Experience (Mode B) — Phases 0.5–11, כפי שנבנו בפועל בענף `claude/page-design-system-febey3`.
**מקור הדרישות:** "TESTIM — FINAL MASTER DIRECTIVE — SCROLL-DRIVEN EXPERIENCE BUILDER" + `docs/experience-audit.md` (במיוחד §19 Definition of Done ו-§104–105 הדורשים ביקורת עצמית זו).

**עקרון מנחה למסמך הזה (§105):** לא מסמנים `PASS` כי הבדיקות עוברות — רק אחרי שווידאתי מול הקוד/ההתנהגות בפועל, בדרך כלל בדפדפן אמיתי מול production build. איפה שלא בדקתי אמפירית, כתוב את זה במפורש. כל `PARTIAL`/`FAIL`/`DEFERRED` מקבל Action קונקרטי, לא רק תיאור.

**מצב כללי:** 215/215 בדיקות (`npm test`), `lint`/`build`/`tsc --noEmit` נקיים על ה-commit האחרון (`886d7f0`). אומת אמפירית מול production build אמיתי (`next build && next start`) לאורך כל השלבים — לא רק unit tests.

---

## איך לקרוא את הטבלה

| Status | משמעות |
|---|---|
| **PASS** | נבנה, נבדק (unit test ו/או Playwright מול production build), והתנהגותו אומתה ישירות מול הקוד/הדפדפן |
| **PARTIAL** | קיים ועובד, אבל עם פער אמיתי וממוקד — מפורט ב-Risk/Action |
| **DEFERRED** | לא נבנה במכוון (MVP scope) — לא "נשכח", החלטה מתועדת |
| **FAIL** | נבדק ונמצא לא עובד — אין כאלה בטבלה הזו; כל מה שנמצא שבור תוקן לפני שהמסמך הזה נכתב (ראו §"באגים אמיתיים שנמצאו ותוקנו" למטה) |

---

## 1. ארכיטקטורה ובידוד (Core, §19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| דפי Standard ממשיכים לעבוד ללא שינוי | **PASS** | 62 בדיקות regression מ-Phase 0.5 עדיין עוברות; `/p/demo`, `/preview/[themeId]` באותו build ירוק; ExperienceProvider תמיד עוטף בלי לשנות layout כש-`display:contents` | — | — |
| Theme Engine / Effects Engine ללא שינוי התנהגותי | **PASS** | Experience לא נוגע ב-`lib/theme.ts`/`lib/effects.ts`; קורא מהם דרך `resolveThemeColor` בלבד, לא מגדיר טוקנים מקבילים | — | — |
| 17 הבלוקים עובדים ללא Experience | **PASS** | נספרו ישירות מ-`components/blocks/registry.ts`: 17 entries. אף אחד לא תלוי ב-Experience; 7 מהם (Hero/Statement/About/Gallery/Steps/CTA/Logos) *גם* נושאים `ExperienceTarget` עטיפה אופציונלית (Phase 5), שאינה משנה רינדור כש-Experience כבוי | — | — |
| `Page` JSON קיים ממשיך לעבוד | **PASS** | `normalizePage` מוסיף `experience: normalizeExperience(p.experience)` באופן מפורש (לא spread מותנה) — `undefined` נשאר `undefined` לדף שלא נגע ב-Experience מעולם | — | — |
| Experience נשאר אופציונלי לחלוטין | **PASS** | `page.experience?.enabled` הוא ה-gate היחיד; `ExperiencePage`/`ExperienceLivePreview` מחזירים `null` כש-`!config?.enabled` | — | — |
| בידוד CSS: `.exp-motion` אינרטי כשכבוי | **PASS** | `[data-experience-active] .exp-motion {...}` — נבדק אמפירית ב-Phase 5 ש-`translate` (אפילו `0% 0%`) יוצר containing block חדש; ה-gate מונע זאת על כל דף Standard | — | — |
| No-JS fallback | **PASS** | Playwright עם `javaScriptEnabled: false` מול production build: `/preview/scroll-experience` — טקסט הכותרת קיים ב-DOM, `opacity` מחושב = `1` (לא תקוע ב-0 מ-track שלא רץ), כפתור ה-CTA לחיץ | — | — |

## 2. Runtime (§4.2, §19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| `WindowScrollRoot` / `ElementScrollRoot` | **PASS** | `lib/scroll-root.ts`, מבחני יחידה + Phase 0.5/2 אימות אמפירי: R1 (סטודיו sticky) נפתר דרך `findScrollRoot` + `overflow-clip` | — | — |
| Scene lifecycle (5 מצבים, MVP subset) | **PARTIAL** | MVP משתמש רק ב-`before/active/after` בפועל (`measureScene`); `entering`/`leaving` קיימים בטיפוס (`SceneLifecycleState`) אך אף קוד לא מפיק אותם | לא ממש חסר תפקוד — התיעוד (`lib/experience.ts`) כבר אומר "MVP צורך בפועל רק before/active/after" — זו החלטת MVP מתועדת, לא פער סמוי | אם עתידית נדרשת אנימציית transition-in/out נפרדת מ-scene פעילה, יש להוסיף חישוב entering/leaving ב-`measureScene` |
| Scene progress | **PASS** | `--exp-scene-progress` נכתב כל פריים; אומת ב-Playwright שהוא מתקדם 0→1 בגלילה אמיתית וב-`scrollToProgress` (הטיימליין בסטודיו) | — | — |
| Target Registry | **PASS** | `TargetRegistry` (Map), מבחני יחידה: register/resolve/unregister/missing-target-no-throw | — | — |
| Track Ownership נאכף ומוצג | **PASS** | `lib/experience-validate.ts` מזהה קונפליקטים + incompatible targets; מוצג בסטודיו (`ExperienceEditor`/`ExperienceSceneEditor`) כאזהרות בעברית קריאה, לא רק כשגיאת סכמה | — | — |
| Keyframes + אינטרפולציה | **PASS** | `lib/experience-interpolate.ts` — Newton-Raphson ל-cubic-bezier, תמיכה ENTER→HOLD→EXIT בתוך track אחד; מבחני יחידה על 0/0.25/0.5/1/clamp/NaN | — | — |
| ערכים responsive | **PASS** | `resolveResponsive` + `mode` מוזרם דרך Context; אומת אמפירית שה-viewport toggle של הסטודיו (desktop/tablet/mobile→base/tablet/mobile) מגיע ל-`ExperienceProvider` | — | — |
| Pinning (דף ציבורי + סטודיו) | **PASS** | אומת אמפירית ב-Playwright בשני ההקשרים; R1 (הבאג המרכזי) פתור | — | — |
| Transitions בין scenes | **PASS** | `transition="fade"` — CSS-only דרך `--exp-scene-progress`; תוקן bug אמיתי ב-fallback value (1→0.5, ראו סעיף הבאגים למטה) | — | — |
| אפס `setState` בלולאת ה-runtime עצמו | **PASS** | `ExperienceRuntime.update()`/`applyScene` כותבים ל-DOM ישירות (`element.style.setProperty`) — בלי React state כלל. **הבהרה:** כלי עזר של הסטודיו (Timeline scrubber, Debug badge) *כן* עושים `setState` על scroll — אלה קוד סטודיו נפרד שמאזין לתוצאה, לא ה-runtime עצמו; לא רץ בדף ציבורי כלל | — | — |

## 3. סכמה (§5, §19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| `normalizeExperience` | **PASS** | `lib/experience-normalize.ts` — no-data-loss (מנרמל גם כש-`enabled:false`), מבחני יחידה | — | — |
| ולידציה | **PASS** | `lib/experience-validate.ts`, מוזרם ל-Studio | — | — |
| Versioning | **PARTIAL** | `version: 1` קיים בטיפוס ונכתב תמיד; אין עדיין קוד migration בפועל (אין `version: 2` להיגר ממנו) | לא בעיה כרגע — אין עדיין שינוי סכמה שדורש migration | כשתתווסף שדה שובר-תאימות, לכתוב `migrateExperience(v1→v2)` לפני שמשחררים אותו |
| Property Metadata | **PASS** | `PROPERTY_METADATA` — יחידה/טווח/ברירת מחדל/`performanceClass` לכל אחד מ-6 המאפיינים; משמש גם את ה-Motion Budget (Phase 8) | — | — |

## 4. קומפוזיציה (§4.3, §12, §19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| Stage Mode | **PASS** | אומת אמפירית — sticky+pinned, min-height כפוי לפי `durationVh` | — | — |
| Flow Mode | **PASS** | אומת אמפירית — בלי pin, בלי גובה כפוי; ותוקן באג אמיתי (§11 formula ל-scene קצר מה-viewport, ראו סעיף הבאגים) | — | — |
| Text/Image/Shape/Button/Block-Reference layers | **PASS** | 5 קבצים ב-`components/experience/layers/`; `LAYER_TYPE_LABELS` נעול ל-5 (Video/Stat/Logo/Group נדחים במפורש, כמתועד ב-`lib/experience.ts`) | — | — |
| Block-Reference (blockRefs ברמת scene) | **PASS** | תוקן באג אמיתי (§104 CTA-block לא נמצא ע"י track) — `ExperienceBlockRefLayer` עוטף עכשיו ב-`ExperienceTarget`; בדיקות יחידה + Playwright | — | — |

## 5. Studio (Phase 7, §19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| Scene manager: הוסף/מחק/סדר/שנה-שם/בחר | **PASS** | `ExperienceEditor` — אומת אמפירית (הוספת preset, מחיקה עם אישור, ↑/↓, עריכת שם) | — | — |
| Scene manager: **שכפול (duplicate)** | **DEFERRED** | לא נבנה כלל — אין כפתור "שכפל סצנה" | משתמש שרוצה סצנה דומה לקיימת חייב לבנות מחדש או לייצא/לערוך JSON ידנית דרך טאב "מתקדם" (שקיים ברמת layer, לא scene) | להוסיף `duplicateScene(id)` ב-`ExperienceEditor` — clone + remap ids באותו דפוס בדיוק כמו `instantiatePresetScene` (כבר קיים, ניתן לשימוש חוזר) |
| Layer manager | **PASS** | `ExperienceSceneEditor` — הוסף (לפי טיפוס)/מחק/סדר/בחר; אומת אמפירית | — | — |
| Layer manager: שכפול layer | **DEFERRED** | כנ"ל — לא נבנה | אותו פער, היקף קטן יותר | אותו פתרון: clone + `newLayerId` (כבר קיים) |
| Inspector: Basic | **PASS** | תוכן לפי סוג + מיקום/עוגן/z-index; אומת אמפירית (עריכת טקסט מיד משתקפת בתצוגה החיה) | — | — |
| Inspector: Style | **PASS** | color/background/radius/shadow — כל השדות קוראים דרך `resolveThemeColor`/`layerStyleToCss` הקיימים | — | — |
| Inspector: Motion | **PASS** | tracks/keyframes per-property, easing picker; אומת אמפירית שהצגת ה-track של preset "קולנועי" תואמת בדיוק את הנתונים (4 keyframes ל-opacity, 2 ל-y) | — | — |
| Inspector: Advanced | **PASS** | JSON גולמי עם parse-on-apply; שגיאת JSON לא תקין מוצגת ולא נשמרת (לא "בולעת" בשקט) | — | — |
| Timeline + Scrubber | **PASS** | `runtime.scrollToProgress()` (חדש, Phase 7) — גלילה אמיתית של ה-scroll root האמיתי, לא preview מדומה; אומת אמפירית: scrub ל-0%/15%/50%/100% נותן opacity 0/0.97/1/0 התואם בדיוק לעקומת ה-preset | — | — |
| Scrub בלי גלילה ידנית של המשתמש (§19 הניסוח המדויק) | **PASS** | המשתמש גורר slider — אין דרישה לגלול בעכבר; מאחורי הקלעים כן קורית גלילה תכנותית אמיתית (בכוונה, ראו §Runtime למעלה) | — | — |
| Replay | **PARTIAL** | הכפתור "הפעל אנימציות" (`bumpReplay`) הקיים משפיע על Standard mode (Reveal remount); לא נבדק/נבנה מכוון במפורש ל-Experience scenes (אין מנגנון "replay scene from 0" ב-Experience) | ה-scrubber עצמו כבר מאפשר "לחזור להתחלה" (גרירה ל-0%), אז הפער הוא נוחות (כפתור ייעודי), לא תפקוד חסר | להוסיף כפתור "התחל מההתחלה" ב-Timeline שקורא `runtime.scrollToProgress(sceneId, 0)` |
| Responsive preview (עם ה-viewport הקיים) | **PASS** | `mode={viewport === "desktop" ? "base" : viewport}` מוזרם ל-`ExperienceLivePreview`; אומת שה-wiring מגיע ל-Context. **הסתייגות:** אף preset/דמו לא מגדיר בפועל override ל-tablet/mobile, אז לא נראה חזותית הבדל אמיתי — הצינור עובד, אבל לא הודגם | ראו §UX למטה — "מובייל מבוקר במכוון" מסומן PARTIAL מאותה סיבה בדיוק | להוסיף לפחות דוגמה אחת (בדמו או ב-preset) עם `layout.mobile`/`durationVh: {base, mobile}` שונה מה-desktop, כדי שהמנגנון גם *יוכח* חזותית לא רק קיים בקוד |
| Presets (6, ניגודיות נבדקת) | **PASS** | 6 presets (`lib/experience-presets.ts`) תואמים בדיוק לרשימה מהדירקטיב; בדיקת ניגודיות אמיתית נמצאה חסרה ותוקנה במהלך Phase 10 (`onPrimary`/`onAccent` — ראו סעיף הבאגים) | — | — |
| Debug mode | **PASS** | checkbox ב-settings → outline מקווקוו + badge עם id+progress חי; אומת אמפירית | — | — |
| מצבי שגיאה קריאים לאדם | **PASS** | ולידציה (Track Ownership) מוצגת כאזהרות עבריות; Advanced tab JSON שגוי מוצג עם שגיאה ברורה | — | — |
| מצבי ריק | **PASS** | "אין עדיין סצנות — הוסיפו את הראשונה"; "אין עדיין שכבות בסצנה הזו"; empty CTA כש-`page.experience` לא קיים כלל | — | — |
| Reset/duplication flows | **PARTIAL** | Reset ברמת דף/ערכה (Standard) כבר קיים ולא נגע; **duplication ל-Experience לא קיים** (אותו פער כמו למעלה) | ראה Action למעלה | — |

## 6. UX ואיכות (§19 "איכות")

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| היררכיה חזותית מכוונת (לא הכל זז באותה עוצמה) | **PASS** | 6 presets, כל אחד עם easing/timing/composition שונה בכוונה (קולנועי איטי, דיגיטלי חד, יוקרתי מרווח) | — | — |
| דפים מרגישים premium | **PASS** (סובייקטיבי, לא ניתן ל-PASS מוחלט) | אומת חזותית בצילומי מסך אמיתיים (5 סצנות הדמו + presets) — נראה מכוון, לא "אוסף טריקים" | שיפוט אסתטי הוא במידה מסוימת סובייקטיבי | להראות ל-stakeholder אנושי לפני production release, לא להסתמך רק על שיפוט הסוכן |
| תנועה נרטיבית, לא רעש דקורטיבי | **PASS** | כל track בכל preset/דמו הוא ENTER→HOLD→EXIT מכוון (opacity+y יחד, לא "flicker" אקראי) | — | — |
| Studio נוח ואינטואיטיבי | **PASS** (עם הסתייגות) | זרימה שלמה (toggle→scene→layer→motion→scrub) אומתה קצה-לקצה בלי שגיאות; **אבל**: אין drag-and-drop אמיתי לסידור (רק חצים ↑/↓), עקבי עם Mode A הקיים | — | — |
| מובייל מעוצב במכוון | **PARTIAL** | ראו הערה ב-Studio למעלה — הצינור (`Responsive<T>`) עובד, אבל אין תוכן שמדגים בפועל עיצוב שונה למובייל | אותו Action כמו למעלה | (זהה) |
| RTL תקין (start/end לא left/right) | **PASS** | `insetInlineStart`/`insetInlineEnd`/`marginInlineStart` בכל מקום; תוקן באג אמיתי ב-Phase 9 (טקסט ממורכז לא היה מיושר נכון ב-RTL — `textAlign` נוסף ל-`layerLayoutStyle`) | — | — |
| ניגודיות דרך `lib/contrast.ts` בלבד | **PASS** | Experience לא מגדיר בדיקת ניגודיות משלו — קורא צבעים מה-Theme הקיים (כולל `onPrimary`/`onAccent` המחושבים ע"י `bestTextOn`); באג הניגודיות שנמצא (preset "נועז") היה חוסר-מיפוי טוקן, לא בעיה בלוגיקת הניגודיות עצמה | — | — |
| `build`/`lint`/בדיקות | **PASS** | 215/215, נקי, נקי | — | — |
| תיעוד (engine/schema/studio) | **PASS** | `docs/experience-audit.md` (מפרט מלא) + JSDoc עברי מקיף בכל קובץ מרכזי (`lib/experience*.ts`, `components/experience/*`, `components/studio/experience-*`) + המסמך הזה | — | — |

## 7. נגישות (§19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| פלט טקסט סמנטי | **PASS** | `TextLayer` דורש `tag` אמיתי (h1-h4/p/span), לא ברירת מחדל ל-div; `role="text"`/`aria-label` בדפוס statement.tsx | — | — |
| נגישות מקלדת | **PASS** | אומת אמפירית — Tab עובר רק על אלמנטים אינטראקטיביים אמיתיים (קישורים/כפתורים), בסדר הגיוני, גם ב-`/preview/scroll-experience` וגם ב-`/studio` | — | — |
| reduced motion → קומפוזיציה סטטית | **PASS** | תוקן באג אמיתי, קריטי: `useReducedMotion` נכתב מחדש עם `useSyncExternalStore` אחרי שהתגלה hydration-mismatch אמיתי (הגרסה הישנה עם lazy `useState` initializer השאירה DOM תקוע על ברירת המחדל של ה-SSR לצמיתות כש-reduced-motion פעיל באמת — לא flash של רגע, תקיעה מוחלטת). אומת אמפירית: `page.emulateMedia({reducedMotion:'reduce'})` → `data-experience-active` נעדר, `sticky` נעדר מכל הסצנות, תוכן נשאר גלוי | — | — |
| fallback בלי JS | **PASS** | ראו §Core למעלה | — | — |
| layers דקורטיביים מוצאים מה-accessibility tree | **PASS** | `ShapeLayer`: תמיד `aria-hidden="true"`; `ImageLayer`: `aria-hidden`+`alt=""` כש-`decorative:true`, אחרת `alt` חובה | — | — |
| מטא-דאטה נגישה למדיה | **PASS** | `ImageLayerContent.alt` חובה (טיפוס) אלא אם `decorative:true`; Inspector מסתיר את שדה ה-alt כש-decorative מסומן | — | — |
| סדר focus נשמר | **PASS** | אומת אמפירית — סדר ה-Tab תואם בדיוק לסדר ה-DOM (=סדר מערך ה-layers, הניתן לסידור ע"י המשתמש ב-Studio) | — | — |

## 8. ביצועים (Phase 11, §19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| אפס re-render של עץ React per frame (ה-runtime עצמו) | **PASS** | `ExperienceRuntime.update()` כותב ל-DOM ישירות; קוד עזר של הסטודיו בלבד (Timeline/Debug badge) עושה `setState` — לא רץ בדף ציבורי | — | — |
| אפס DOM query מיותר per frame | **PASS** | `TargetRegistry`/scene registration שומרים refs פעם אחת ב-mount; `update()` לא קורא `querySelector` בלולאה | — | — |
| לולאת rAF מרכזית אחת per scope | **PASS** | `ExperienceRuntime.requestUpdate()` — `if (this.frame !== null) return;` מונע כפילות | — | — |
| cleanup מלא (rAF/listeners/ResizeObserver/matchMedia/targets) | **PASS** | מבחני יחידה מפורשים לכל אחד: `detach()` מבטל subscribe+מבטל rAF ממתין (idempotent); `useReducedMotion` מסיר `change` listener ב-unmount; `ExperienceTarget`/`registerScene` מבטלים רישום ב-unmount. **אומת גם אמפירית**: מדידת JS heap אמיתית (`--js-flags=--expose-gc`) על פני 20 מחזורי mount/unmount בדפדפן אמיתי — תנודה חסומה ב-~7.2–7.9MB, לא גדילה ליניארית. (בדיקה ראשונית עם ספירת `addEventListener` גולמית ב-jsdom הראתה "דליפה" מדומה של 138/מחזור — אותרה כתופעת-לוואי של מנגנון ה-event-delegation הפנימי של React על container חדש בכל render, לא קשורה לקוד שלנו; ה-heap האמיתי מפריך זאת) | — | — |
| motion budget קיים | **PASS** | `lib/experience-motion-budget.ts` — verdict light/moderate/heavy per-scene ולכלל ה-Experience, מבוסס `PROPERTY_METADATA.performanceClass` הקיים; מוצג בסטודיו | — | — |
| מובייל מבוקר במכוון (לא רק scaled-down) | **PASS** | תוקן במהלך הביקורת עצמה (לא רק תועד כפער): `applyScene` מדלג עכשיו על כתיבת מאפיינים עם `performanceClass:"expensive"` (בפועל: blur) כש-`settings.performance==="lite"`, ומשאיר אותם על ברירת המחדל הנייטרלית שלהם; מאפיינים "זולים" (opacity/x/y/scale/rotate) נכתבים כרגיל. שני מבחני יחידה חדשים מוודאים גם את הדילוג וגם שזה לא משפיע על `"auto"`/`"high"` | — | — |

## 9. אמינות (§19)

| Requirement | Status | Evidence | Risk | Action |
|---|---|---|---|---|
| `normalizeExperience` עובד | **PASS** | ראו §סכמה | — | — |
| ולידציה עובדת | **PASS** | ראו §Runtime | — | — |
| Experience פגום נופל בחינניות ל-Standard | **PASS** | `normalizeExperience` תמיד מחזיר מבנה תקין (או `undefined`); שום שדה חסר לא זורק | — | — |
| target חסר לא מקריס | **PASS** | `applyScene`: `if (!target) continue;` — מבחן יחידה מפורש ("skips a track whose target was never registered, without throwing") | — | — |
| תאימות לאחור נשמרת | **PASS** | ראו §Core | — | — |
| ייבוא/ייצוא עובד | **PASS** | אומת אמפירית קצה-לקצה: יצירת scene מ-preset → הורדת JSON → דף חדש וריק → ייבוא הקובץ בחזרה → Experience mode מופעל אוטומטית, הסצנה חוזרת | — | — |

---

## באגים אמיתיים שנמצאו ותוקנו במהלך העבודה הזו (לא רק "נבדק ועבר")

מפורטים כאן במפורש כי §105 דורש להראות עבודת ביקורת אמיתית, לא רק תוצאה סופית ירוקה:

1. **Block-reference layers לא נרשמו ב-TargetRegistry** — `ExperiencePage` רינדר `blockRefs` בלי לעטוף ב-`ExperienceTarget`, אז שום track לא מצא את היעד שלו. תוקן: `ExperienceBlockRefLayer` (מיוצא, משותף בין הדף הציבורי לתצוגת הסטודיו).
2. **`useReducedMotion` — SSR/hydration mismatch אמיתי, לא רק תיאורטי** — lazy `useState` initializer שקרא `matchMedia` סינכרונית גרם ל-DOM להישאר תקוע על ברירת המחדל של ה-SSR (`reducedMotion:false`) לצמיתות, כש-reduced-motion פעיל באמת. תוקן עם `useSyncExternalStore` (הפתרון המתועד של React בדיוק למקרה הזה).
3. **`measureScene` — flow scene קצר מה-viewport בסוף הדף לא היה יכול להגיע ל-progress=1** — הנוסחה הישנה קפצה בינארית (`top<=0 ? 1 : 0`); scene אחרון בדף קצר בלי גובה גלילה מתחתיו נשאר תקוע ב-0 לנצח. תוקן עם נוסחת viewport-entry הדרגתית.
4. **CSS fallback ל-`--exp-scene-progress` בנוסחת ה-fade transition היה `1` (קצה העקומה = `opacity:0`) במקום `0.5` (אמצע = `opacity:1`)** — גרם לתוכן להיעלם *לצמיתות* בדיוק תחת reduced-motion (כש-runtime אף פעם לא מתחבר ולא כותב את המשתנה). תוקן ל-`0.5`.
5. **RTL: מירכוז קופסה לא כלל מירכוז טקסט** — `anchor:"center"` קבע רק `transformOrigin`, לא `textAlign`; טקסט עברי בקופסה ממורכזת נשאר צמוד לימין. תוקן — `textAlign` נגזר מאותו `anchor`.
6. **`onPrimary`/`onAccent` חסרים ממפת הטוקנים הסמנטיים** — קיימים ב-Theme (מחושבים לניגודיות) אך לא נחשפו ל-Experience; preset "נועז" (רקע primary) השתמש ב-`color:"text"` הרגיל במקום, בדיוק סוג הבאג ש-§19 DoD מזהיר ממנו במפורש. תוקן.
7. **מלכודת "ביצה ותרנגולת" בבורר מצב העמוד** — הכפתור "חוויית גלילה" הוצג רק כש-`page.experience` כבר קיים, כלומר דף טרי לא היה יכול להגיע ל-Experience mode בכלל. נתפס ותוקן *לפני* אימות בדפדפן.

כל אחד מהשבעה אומת אמפירית — לפני התיקון (שחזור הבאג בפועל) ואחרי (Playwright מול production build מראה את ההתנהגות הנכונה).

---

## סיכום Status

| Status | כמות |
|---|---|
| PASS | 63 |
| PARTIAL | 5 |
| DEFERRED | 2 |
| FAIL | 0 |

**כל ה-PARTIAL/DEFERRED יש להם Action מפורש בטבלאות למעלה — אף אחד לא "נשאר תלוי" בלי החלטה.** שני ה-DEFERRED (scene/layer duplication) הם תוספת UX נוחות, לא פער תפקודי — יש דרך עוקפת (edit/re-add ידני, או JSON גולמי בטאב "מתקדם"). מתוך חמשת ה-PARTIAL: אחד הוא החלטת MVP מתועדת מראש (Scene lifecycle entering/leaving), אחד הוא תיעוד-בלבד חסר (Versioning — אין עדיין מה למיגרט), שניים הם פערי תוכן-הדגמה (Responsive preview / מובייל מעוצב — הצינור עובד, פשוט שום preset לא מדגים אותו חזותית עדיין), ואחד הוא נוחות (Replay ל-Experience — קיים עקיפה דרך ה-scrubber). **הפער המשמעותי היחיד שנמצא בפועל** (`performance:"lite"` לא אכף שום דבר) תוקן *במהלך כתיבת המסמך הזה עצמו*, לא רק תועד — זו בדיוק המשמעות של "ביקורת עצמית", לא רשימת בדיקה.

**Phase 12 (WebGL adapter boundary) נשאר אופציונלי-בלבד, לא נבנה — כמתועד במפורש ב-`docs/experience-audit.md` כ"אחרי יציבות מלאה", לא MVP.**

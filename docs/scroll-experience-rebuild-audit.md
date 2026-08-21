# אודיט Rebuild — Visual Web Experience Builder (Milestone A2)

**סטטוס:** מסמך זה **לא** פותח אודיט מאפס. הוא בונה על שני מסמכי אודיט
קיימים ומאומתים אמפירית — `docs/experience-audit.md` (הצעת הארכיטקטורה
המקורית, 1421 שורות) ו-`docs/experience-final-audit.md` (ביקורת עצמית
סופית, 63 PASS / 5 PARTIAL / 2 DEFERRED / 0 FAIL, מ-2026-08-16) — ומוסיף
עליהם שלוש שכבות שלא היו קיימות עד כה:

1. **דלתא** מאז 2026-08-16: מה השתנה בקוד בפועל (צמצום UX 21/08, תצוגה
   מקדימה מקומית לתמונה).
2. **מיפוי מול הדרישות המדויקות** של ה-Master Execution Prompt החדש
   (21/08/2026) — שהרחיב את הדרישות מעבר למה שהאודיט המקורי כיסה:
   `globalProgress`, lifecycle states מלאים (לא רק before/active/after),
   מאפייני `clip`/`color`, Studio Canvas-first, בחירה-על-קנבס, שכפול
   סצנה/שכבה, עריכה קונטקסטואלית אכיפתית, keyframe markers.
3. **טבלת סיווג סופית** KEEP/REFACTOR/REPLACE/REMOVE/UNKNOWN — הגרסה
   הסגורה של הטיוטה בסעיף 1 של `docs/rebuild-workplan.md`.

כל הממצאים כאן אומתו מול הקוד בפועל (grep + קריאת קבצים) בזמן כתיבת
מסמך זה, לא הועתקו בעיוורון מהתיעוד הישן.

---

## 1. דלתא מאז experience-final-audit.md (2026-08-16)

| שינוי | השפעה על האודיט הישן |
|---|---|
| צמצום UX 21/08: `PanelSection` מתקפל + badge, 5+5 צבעים נגזרים, `ContrastPanel` חריגים-בלבד, מודאל ⚙, מיזוג מיקרו-סקשנים, Motion Budget ב-header, empty-states פעילים | הסטודיו הרגיש "צפוף" תוקן ברמת **תוכן הפקדים**; ה-**IA המבני** (aside שמאל 380px קבוע + main) לא השתנה — זה עדיין הפער המרכזי ל-Milestone D |
| תצוגה מקדימה מקומית לתמונה (`ImagePreviewOverrides`, blob URL, לא נשמר) | לא נוגע לארכיטקטורת Experience; עדכון קטן ל-`ExperienceLayerInspector` בלבד |
| `vercel.json` + framework fix | תשתית פריסה בלבד, לא נוגע למנוע |

מסקנה: כל 63 ה-PASS + 5 ה-PARTIAL מהמסמך הישן נבדקו מדגמית ונשארו
תקפים (Standard Mode, runtime, נגישות, ביצועים — לא נגעו בהם כלל
מאז 08-16). שני ה-DEFERRED (שכפול scene/layer) **עדיין** לא קיימים.

---

## 2. הפער האמיתי מול הדרישות החדשות (מאומת מול הקוד עכשיו)

### 2.1 מודל נתונים — `lib/experience.ts`
```
export type AnimatableProp = "opacity" | "x" | "y" | "scale" | "rotate" | "blur";
```
מאומת (שורה 60): **אין** `clip`/`color` כמאפיינים אנימביליים. יש כן
`SEMANTIC_COLOR_VARS` (primary/accent/background/.../onPrimary/onAccent)
שכבר ממופה ל-CSS vars של ה-Theme — תשתית מוכנה לניצול ע"י track של
color, לא צריך לבנות מיפוי טוקנים מחדש.
**סיווג: BUILD** (הרחבה, לא שבירה — AnimatableProp הוא union, הוספת
איבר לא פוגעת בדפים קיימים).

### 2.2 Timeline — `components/experience/experience-runtime.ts`
מאומת: `SceneLifecycleState` מיוצא מ-`lib/experience.ts` וקיים כטיפוס,
אבל בפועל מחושב רק:
```
const state: SceneLifecycleState = rawProgress < 0 ? "before" : rawProgress > 1 ? "after" : "active";
```
כלומר **3 מצבים בפועל, לא 5** — `entering`/`leaving` מוגדרים בטיפוס
אך לעולם לא מופקים. זו הייתה **החלטת MVP מתועדת** ב-08-16 (§Runtime
בביקורת הישנה), לא באג — אבל היא **לא מספיקה** יותר: המאסטר-פרומפט
החדש דורש lifecycle מלא כבסיס למעברי handoff עשירים (Milestone B3).
**אין `globalProgress`** בקוד כלל — רק `sceneProgress` לכל סצנה
בנפרד. אין דרך היום לדעת "כמה % מכל החוויה עברתי" בלי לחשב ידנית
ממיקום הסצנה הפעילה.
**סיווג: KEEP הבסיס + BUILD (globalProgress, entering/leaving אמיתיים)**

### 2.3 בעלות ותקדימות — התנגשות אמיתית שאותרה עכשיו
`ExperienceBlockRefLayer` (`components/experience/experience-page.tsx`)
מרנדר בלוקים אמיתיים (CTA/Features/About וכו') שמכילים `<Reveal>`
פנימי משלהם. `Reveal` (`components/fx/reveal.tsx`) הוא **עיוור
לחלוטין** לקיומו של Experience — הוא רץ עם ה-`IntersectionObserver`
העצמאי שלו (סף 15% מלמטה) בלי קשר לכך שה-wrapper החיצוני שלו
(`ExperienceTarget`) כבר נשלט ע"י track. אלה שני DOM nodes שונים (אין
התנגשות ברמת CSS property על אותו אלמנט), אבל יש **התנגשות תזמון
אמיתית**: ה-track החיצוני עשוי לחשוף את הבלוק לפי התקדמות גלילה
(scroll-position-driven), בעוד ה-`Reveal` הפנימי חושף את התוכן שלו
לפי metric שונה לגמרי (viewport-intersection של האלמנט הפנימי) —
תוצאה אפשרית: "הבזק כפול" (double reveal) כשהשניים לא מסונכרנים.
**זו בדיוק הבעיה ש-A3 (טבלת תקדימות) חייב לפתור, לא רק לתעד.**
**סיווג: REFACTOR** (מנגנון דיכוי — Reveal חייב לדעת לוותר על
הבעלות כשהוא מנוהל ע"י Experience; ראו A3).

### 2.4 מנוע סצנות — `components/experience/experience-scene.tsx`
147 שורות; sticky pinning + `cut`/`fade` בלבד ל-transition. אין
handoff חופף (הסצנה הבאה מתחילה להיכנס לפני שהקודמת יצאה לגמרי) ואין
אכיפת "מרחק גלילה מינימלי" (סצנה עם 10 keyframes ו-`durationVh:80`
לא מזהירה על "חלון הבזק"). **סיווג: REFACTOR** (Milestone B3).

### 2.5 דמו 5 הסצנות — `pages-data/scroll-experience-demo.ts`
מאומת עכשיו (לא כפי שתועד קודם בטעות כ"2 סצנות"): **הדמו כבר מכיל 5
סצנות אמיתיות** — "פתיחה — כותרת קולנועית" / "טיפוגרפיה — הצהרה
גדולה" / "מדיה — פרלקס" / "רב-שכבתי" / "סיום — קריאה לפעולה", 464
שורות, עם tracks מלאים לכל שכבה. **תיקון לתוכנית העבודה**: Milestone
C הוא **לא** בנייה מאפס — הוא **ביקורת ושדרוג** של דמו קיים מול
העקרונות שיחולצו ב-A1 (שם התוכן/הקומפוזיציה כן עשויים להשתנות אם
אינם עומדים ברף, אבל השלד קיים). **סיווג: KEEP + לולאת QA ויזואלי**,
לא REPLACE כפי שסווג בטיוטה.

### 2.6 סטודיו — IA מבני מאומת עכשיו
`studio-app.tsx` שורה 617: `<aside className="... w-[380px] ...">`
(פאנל שמאל קבוע, מכיל **הכול** — רשימת סצנות, Inspector 4 טאבים,
presets, הגדרות) + `<main className="flex-1 overflow-auto">` (הקנבס/
תצוגה חיה). כלומר זהו IA **דו-אזורי** (LEFT מלא-הכול + CENTER תצוגה),
לא ה-5 אזורים (TOP/LEFT/CENTER/RIGHT/BOTTOM) שהמאסטר דורש. אין הפרדה
בין "מבנה" (LEFT) ל"מאפיינים קונטקסטואליים" (RIGHT) — שניהם חיים
היום באותו פאנל שמאל אחד, כלומר עריכת שכבה "תופסת" את כל הפאנל וה-
מבנה (רשימת הסצנות) נעלם עד ש-`onBack` נלחץ (ראה
`experience-scene-editor.tsx` שורות 111-123 — `if (selectedLayer)
return <ExperienceLayerInspector .../>` מחליף את כל הפאנל, לא
מוסיף פאנל שני). **סיווג: REFACTOR עמוק** (Milestone D — "לב הפרויקט").

### 2.7 בחירה-על-קנבס — מאומת: לא קיים
`selectedLayerId`/`onSelectLayer` (הצהרה: `studio-app.tsx:109`) זורמים
רק לתוך `experience-editor.tsx`→`experience-scene-editor.tsx` (פאנל
שמאל). ב-`experience-live-preview.tsx` (הקנבס בפועל, `main`) **אין**
שום `onClick`/`onSelectLayer` — קליק על שכבה בתצוגה החיה לא עושה
כלום. **סיווג: BUILD** (Milestone D1 — היכולת החדשה המרכזית).

### 2.8 Timeline scrubber — מאומת: `<input type="range">` פשוט
`experience-live-preview.tsx:161-176` — סרגל טווח רגיל, `min=0
max=100`, בלי שום סימון keyframes על גביו. חוב מתועד מ-21/08.
**סיווג: BUILD** (Milestone D2).

### 2.9 שכפול סצנה/שכבה — מאומת: DEFERRED, עדיין לא קיים
`grep duplicateScene` בכל הריפו — אין תוצאה. `instantiatePresetScene`
(ב-`lib/experience-presets.ts`) קיים ועושה בדיוק את הפעולה הנדרשת
(clone + remap ids ייחודי) — ניתן לשימוש חוזר ישיר ל-Milestone D4
בלי לבנות מנגנון חדש. **סיווג: BUILD (משתמש ב-utility קיים)**.

---

## 3. טבלת סיווג סופית (נועלת את הטיוטה בסעיף 1 של rebuild-workplan.md)

| רכיב | סיווג | פירוט |
|---|---|---|
| `lib/experience.ts` — סכמה Page→Scenes→Layers→Tracks | **KEEP** + BUILD (clip/color) | הרחבת union, נירמול תואם-לאחור |
| `ExperienceRuntime`/`ScrollRoot` (sceneProgress) | **KEEP** + BUILD (globalProgress) | ליבה יציבה, לא לגעת בה מחדש |
| Scene lifecycle (before/active/after) | **KEEP** + BUILD (entering/leaving אמיתיים) | טיפוס כבר קיים; רק החישוב חסר |
| `ExperienceScene` (sticky, cut/fade) | **REFACTOR** | handoff חופף + ולידציית מרחק-מינימלי |
| Tracks (keyframes+easing, 6 מאפיינים) | **KEEP** + BUILD (הרחבת whitelist) | מודל האינטרפולציה עצמו לא משתנה |
| Track Ownership validation | **REFACTOR** | חסרה טבלת תקדימות מול Reveal/hover/theme-fx — לא רק בין tracks |
| `Reveal` (components/fx/reveal.tsx) מול Experience | **REFACTOR** | מנגנון דיכוי כש-managed ע"י Track (ראו §2.3, A3) |
| Studio IA (aside 380px + main) | **REFACTOR עמוק** | הליבה של Milestone D |
| בחירה-על-קנבס | **BUILD** | לא קיים היום כלל |
| Timeline scrubber + keyframe markers | **BUILD** (על גבי scrubber קיים) | ה-scrubber עצמו (scrollToProgress) נשאר |
| שכפול scene/layer | **BUILD** (על גבי `instantiatePresetScene` הקיים) | utility כבר קיים, רק חסר UI |
| צמצום UX 21/08 (PanelSection, badges, contrast, מודאל) | **KEEP** | תוכן הפקדים תקף; ה-IA סביבם עובר Milestone D |
| Reveal/SplitWords/Statement/CountUp/Tilt (ב-Standard, לא ב-Experience) | **KEEP ב-Standard** | ללא שינוי — Standard Stability = 10.0 |
| אפקטים דקורטיביים (aurora/beams/glow/marquee/grain) | **KEEP כ-opt-in** | ביקורת Milestone F1 — לא דולקים כברירת מחדל ב-Experience |
| `pages-data/scroll-experience-demo.ts` (5 סצנות) | **KEEP** + לולאת QA | לא replace — תיקון לטיוטה, ראו §2.5 |
| 6 presets (`lib/experience-presets.ts`) | **KEEP** + עדכון רף (Milestone F2) | — |
| בדיקות (223), `vercel.json`, פריסה | **KEEP** | תשתית יציבה |
| חסר לגמרי: ניתוח רפרנס (A1), טבלת תקדימות (A3), IA חדש מתועד (A4) | **BUILD** | תוצרי Milestone A עצמו |

---

## 4. מה זה **לא** משנה לעומת rebuild-workplan.md

התוכנית המקורית (סעיף 1 שם) הייתה נכונה ברוב הסיווגים; שני התיקונים
היחידים שהאודיט הזה מכניס: (א) הדמו **כבר** בעל 5 סצנות — Milestone C
הוא ביקורת/שדרוג לא בנייה-מאפס; (ב) זוהתה התנגשות בעלות **קונקרטית
וממשית** (Reveal↔Track על blockRefs), לא רק תיאורטית — מה שהופך את A3
לדחוף יותר ממה שנראה בהתחלה, כי יש כבר קוד שסובל ממנה בפוטנציה.

**שער יציאה A2: הושלם.** ← ממשיכים ל-A3.

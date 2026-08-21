# ניתוח עקרונות — אתר רפרנס (STONE) לחוויית גלילה

> **סטטוס: חסום.** מסמך זה נכתב לפי המנדט ב-`docs/rebuild-workplan.md` §"אבן
> דרך A — A1" (`docs/reference-experience-analysis.md`), אבל **הגישה
> לאתר הרפרנס (`stoneliner.vercel.app`) נחסמה ברמת הרשת** של סביבת
> הביצוע הזו, ולא ניתן היה לבצע את הגלישה החיה שהפרוטוקול דורש. סעיף 1
> מתעד את זה במפורש, כפי שהמשימה עצמה הנחתה לעשות ("אם האתר לא נגיש —
> תעד את זה במפורש; אל תמציא תיאור של אתר שלא ראית"). שום שורה במסמך
> הזה אינה תיאור של מה שנראה על המסך של stoneliner.vercel.app — כי
> המסך הזה לא נצפה.
>
> מה כן יש כאן: תיעוד מלא ומדויק של ניסיון הגישה (עם ראיות), פרוטוקול
> ריצה מוכן־לחלוטין להרצה מיידית ברגע שהגישה תיפתח (כולל סקריפט
> Playwright שמור), וטבלת "עיקרון → פרימיטיב Testim" **המבוססת על
> קריאה בפועל של `lib/experience.ts` ו-`components/experience/*.tsx`**
> ועל אוצר-מונחים כללי ומוכר של חוויות גלילה-קולנועיות (pinned
> sections, parallax, choreography) — לא על תצפית באתר הספציפי. כל
> שורה בטבלה מסומנת לפי מה שקיים-ועובד בקוד היום מול מה שעדיין חסר,
> כדי שהיא תהיה שימושית ל-Milestones B–G גם בלי אימות מול STONE, ותידרש
> חזרה-ואימות ברגע שהגישה תתאפשר (ראו סעיף 4).

---

## 0. מטרת המסמך והבהרה על היקף העבודה

**המטרה המקורית:** לגלוש בדפדפן אמיתי (Playwright, Chromium) לאורך כל
מסע הגלילה של `stoneliner.vercel.app`, לתעד ממשק/קומפוזיציה/התנהגות
גלילה/מבנה סצנה/progress/תנועה/רספונסיב לכל "סצנה" באתר, ולגזור מכך
**עקרונות עיצוביים ואדריכליים כלליים** — לא מיתוג, לא טקסטים, לא
תמונות, לא פלטת צבעים ספציפית, לא לייאאוט מדויק, לא תזמונים מדויקים,
לא קוד. בדיוק כפי שכתוב ב-`docs/rebuild-workplan.md` §0.3: "STONE = רף
איכות ללמידת עקרונות. **לא** תבנית להעתקה."

**מה קרה בפועל:** ניסיון הגישה נחסם באופן עקבי ומאומת בכמה ערוצים
בלתי-תלויים (סעיף 1). בהתאם להנחיה המפורשת של המשימה — לא להמציא תיאור
של אתר שלא נצפה — סעיף 2 (פירוק לפי סצנה, לפי פרוטוקול 8 הנקודות) אינו
מכיל שום ממצא אמפירי. הוא מוחלף בפרוטוקול ריצה מוכן.

---

## 1. ניסיון הגישה — תיעוד מלא (למה זה "חסום" ולא "לא ניסיתי")

בוצעו שלוש בדיקות עצמאיות, בשלושה נתיבי-רשת שונים, כולן נכשלות באותה
צורה:

| # | שיטה | פקודה/כלי | תוצאה |
|---|---|---|---|
| 1 | `curl` ישיר דרך פרוקסי הסוכן (`HTTPS_PROXY`, CA `--cacert /root/.ccr/ca-bundle.crt`) | `curl -x http://127.0.0.1:46711 --cacert ... https://stoneliner.vercel.app` | `HTTP/1.1 403 Forbidden` על ה-`CONNECT` tunnel עצמו |
| 2 | Playwright + Chromium (`/opt/pw-browsers/chromium`) עם `proxy: { server: "http://127.0.0.1:46711" }` מפורש בקריאת `launch()` | ראו `stone-scroll-audit.mjs` (סעיף 3) | `net::ERR_TUNNEL_CONNECTION_FAILED` |
| 3 | כלי `WebFetch` (נתיב רשת נפרד, לא דרך ה-agent-proxy המקומי) | `WebFetch(url: "https://stoneliner.vercel.app", ...)` | `EGRESS_BLOCKED — Access to stoneliner.vercel.app is blocked by the network egress proxy` |

הראיה הקובעת ל"חסימת מדיניות" (policy denial), לא תקלת רשת חולפת: נקודת
הסטטוס של הפרוקסי (`GET http://127.0.0.1:46711/__agentproxy/status`)
מחזירה לוג `recentRelayFailures` עם רשומות מהסוג:

```json
{
  "kind": "connect_rejected",
  "detail": "gateway answered 403 to CONNECT (policy denial or upstream failure)",
  "host": "stoneliner.vercel.app:443"
}
```

**בדיקת ביקורת (control check):** כדי לוודא שזו לא בעיה ספציפית
ל-domain הזה (למשל DNS/certificate) אלא חסימת egress כללית, בוצעה אותה
בדיקה מול שני domains לא-קשורים לחלוטין (`example.com`,
`vercel.com`) — שתיהן חזרו עם אותה שגיאה בדיוק (`403` על ה-`CONNECT`).
המסקנה: **גישת רשת כללית לאתרים חיצוניים חסומה במדיניות ה-egress של
הסביבה הזו כרגע**, לא רק `stoneliner.vercel.app` נקודתית. זה תואם את
ההנחיה המפורשת ב-`/root/.ccr/README.md`: *"403/407 = the destination
host is not allowed by your organization's egress policy... do not
retry or route around it — report the blocked host"* — ולכן לא בוצעו
ניסיונות חוזרים-ונשנים או עקיפה של החסימה מעבר לשלוש הבדיקות
האבחוניות שלמעלה (כל אחת בנתיב-קוד שונה, לא "אותה קריאה שוב").

**מה זה אומר לגבי שאר המסמך:** אין screenshots, אין מדידות DOM/CSS
אמיתיות, ואין שום תובנה ספציפית ל-STONE במסמך הזה. זה עיכוב תפעולי, לא
כשל בעבודה — ברגע שהגישה תיפתח (למשל דרך הרחבת allowlist ב-`no_proxy`/
מדיניות הסביבה, או הרצה מסביבה עם גישה), הפרוטוקול המלא מוכן להרצה
מיידית (סעיף 3).

---

## 2. פירוק לפי סצנה — לא בוצע

בהתאם להנחיה המפורשת של המשימה, סעיף זה **לא** מכיל תיאור מומצא של
ממשק/קומפוזיציה/גלילה/מבנה-סצנה/progress/תנועה/רספונסיב עבור
`stoneliner.vercel.app`, כי שום עמוד מהאתר לא נצפה בפועל. פרוטוקול
8 הנקודות (ממשק, קומפוזיציה, התנהגות גלילה, מבנה סצנה, progress, תנועה,
רספונסיב, עיקרון UX) לכל סצנה שהוגדר במשימה — נשאר מוכן-ליישום ברגע
שהגישה תתאפשר, ומיושם ישירות דרך הסקריפט בסעיף 3.

---

## 3. פרוטוקול ריצה מוכן (להרצה מיידית ברגע שהגישה תיפתח)

נכתב ונשמר: `stone-scroll-audit.mjs` (בתיקיית ה-scratchpad של הסשן
הזה; לא הכניס אותו לריפו כי הוא סקריפט חד-פעמי, לא קוד production).
תקציר מה שהוא עושה, כדי שכל סשן עתידי (עם גישה) יוכל להריץ ולקבל ישר
את הממצאים הדרושים לסעיף 2:

1. פותח Chromium (`/opt/pw-browsers/chromium`) עם הפרוקסי של הסביבה, בשלושה
   רוחבי viewport: desktop (1440×900), tablet (820×1180), mobile (390×844) —
   בדיוק שלושת המצבים שהמשימה ביקשה רספונסיב עליהם.
2. בכל רוחב: מודד `scrollHeight`, גוזר 11 checkpoints (0%, 10%, …, 100%),
   גולל לכל אחד (`scrollTo` מיידי, לא simulated — לא מסתמך על תזמון
   אנימציה), וממתין קצר ליציבות.
3. בכל checkpoint: **screenshot** + מדידת DOM/CSS מחושב —
   `position` (`sticky`/`fixed`/אחר), `transform`, `opacity`, `z-index`,
   `top`, ומיקום/גודל בפועל (`getBoundingClientRect`) לכל אלמנט
   sticky/fixed, ורשימת גבהי הסקשנים ברמה עליונה (סדר + גובה בלבד — לא
   טקסט/תמונה/צבע, כדי לא לאסוף בטעות תוכן שאסור להעתיק).
4. שומר הכול כ-`measurements.json` לצד ה-screenshots, לכל viewport
   בנפרד — מוכן ישירות לניתוח יחסי-מהירות בין שכבות (parallax),
   רציפות-מול-קפיצות, ו-handoff בין סצנות (לפי הבדל progress/opacity/
   transform בין checkpoints סמוכים).

הרצה: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node stone-scroll-audit.mjs`
(דורש רק שהגישה ל-`stoneliner.vercel.app:443` תהיה פתוחה; שאר התלויות
— Chromium ו-Playwright — כבר קיימות בסביבה כפי שצוין במשימה).

**חשוב:** גם לאחר הרצה מוצלחת, יש לעדכן את סעיף 2 של המסמך הזה עם
הממצאים בפרוזה (לא רק לצרף JSON גולמי) ולעדכן/לאשר מחדש את טבלת סעיף 4
לפי מה שנצפה בפועל — לא להשאיר אותה כפי שהיא רק כי היא "סבירה".

---

## 4. טבלת "עיקרון → פרימיטיב Testim" (זמנית — טרם מאומתת מול STONE)

**חשוב לקרוא לפני הטבלה:** השורות למטה **אינן** תוצר של תצפית ב-STONE.
הן בנויות משני מקורות בלבד: (א) אוצר-מונחים כללי ומוכר של חוויות
גלילה-קולנועיות/scrollytelling (pinned stage, parallax, entrance/
climax/exit, progress indication וכו') — בדיוק סוג העקרונות שכבר מנוסח
ב-`docs/rebuild-workplan.md` §0.3 כרף האיכות המבוקש; ו-(ב) קריאה
בפועל של `lib/experience.ts` ו-`components/experience/*.tsx` בריפו
הזה, כדי שכל טור ימני יהיה מבוסס-קוד אמיתי (עם ציון EXISTS / PARTIAL /
MISSING לפי מה שבאמת ממומש) ולא תיאורטי. ברגע שהפרוטוקול בסעיף 3 ירוץ
מול STONE בפועל, יש לעבור שורה־שורה: לאשר, לתקן, או להוסיף שורות
שהאתר בפועל חשף ושלא נחזו כאן.

| עיקרון כללי (אוצר-מונחים מוכר, לא תצפית) | פרימיטיב Testim קיים/דרוש | סטטוס בקוד היום |
|---|---|---|
| ניווט/פקדי UI קבועים מעטים ככל האפשר על המסך בכל רגע, כדי שהתשומת לב תישאר על הסצנה | `LayerZLayer="ui"` + `Z_LAYER_ORDER` (`lib/experience.ts`) קובעים סדר-ערמה סמנטי לשכבת UI; אבל אין עדיין מושג "שכבה גלובלית שרוכבת מעל כמה סצנות" — כל layer שייך ל-scene בודד | **PARTIAL** — הפרימיטיב לסדר-ערמה קיים; "global persistent layer" שלא ננעל ב-scene יחיד עדיין לא קיים, נדרש ל-Milestone D |
| קומפוזיציה: viewport מלא, אובייקט/טיפוגרפיה דומיננטית אחת, הרבה "לובן"/breathing room | `SceneComposition="stage"` + `LayerLayout` במצב `"stage"` (מיקום `absolute` יחסי ל-`.exp-stage`, `anchor` עם `transform-origin`) — `components/experience/experience-scene.tsx`, `layerLayoutStyle()` | **EXISTS** — ממומש ומאומת (`min-h-svh`, sticky) |
| הצמדה (pinning): קומפוזיציה "נעולה" על המסך בזמן שהתוכן הפנימי משתנה סביבה | `ExperienceScene.pinned=true` עם `composition="stage"` → `sticky top-0` על `.exp-stage` (`experience-scene.tsx`), מבוטל אוטומטית תחת `prefers-reduced-motion` | **EXISTS** — מאומת אמפירית לפי `docs/experience-final-audit.md` §"Pinning" |
| שכבות שונות זזות במהירויות/עוצמות שונות תוך כדי אותה גלילה (parallax), כדי לבנות תחושת עומק/יחס | `ExperienceTrack` פר-layer עם `Keyframe[]` עצמאי לכל `AnimatableProp` (`x`/`y`/`scale`) בטווח `range` משלו | **PARTIAL** — המודל התחתי (כמה tracks עצמאיים על progress משותף) קיים ועובד; אין helper/preset ייעודי ל"יחס מהירות" (parallax factor) שהמעצב יכול לגרור בלי לחשב keyframes ידנית — פער ל-Studio (Milestone D) |
| מעברים רציפים, מונעי-scroll-position (לא קפיצות בדידות) | `measureScene` מפיק `progress` רציף 0–1 לכל frame; `evaluateTrack` (`lib/experience-interpolate.ts`) עושה אינטרפולציית cubic-bezier רציפה, כולל דפוס ENTER→HOLD→EXIT בתוך track יחיד | **EXISTS** — הבסיס הטכני לרציפות מוכח; ראו הסתייגות בשורה הבאה לגבי handoff *בין* סצנות |
| Handoff חופף בין סצנות (הבאה מתחילה להיכנס לפני שהקודמת סיימה לצאת), לעומת חיתוך נקי | `SceneTransition` כולל `"crossfade"`/`"directional"` כטיפוסים (`lib/experience.ts`), אבל רק `"fade"` ממומש בפועל (`[data-scene-transition="fade"]` ב-`app/globals.css`, opacity על כל ה-`.exp-stage` לפי `--exp-scene-progress`) — ו-fade הוא fade-in/out *בתוך* סצנה בודדת, לא חפיפה עם השכנה | **MISSING** — `crossfade`/`directional` הם טיפוס ללא מימוש runtime/CSS; handoff אמיתי בין שתי סצנות דורש בנייה — ליבת Milestone B/C |
| מבנה סצנה מפורש: כניסה (entering) / שיא (active) / יציאה (leaving), עם משך-גלילה ייעודי לכל שלב | `SceneLifecycleState` מוגדר עם 5 ערכים (`before/entering/active/leaving/after`) ב-`lib/experience.ts`, אבל `measureScene` (`experience-runtime.ts`) מפיק בפועל רק 3 (`before/active/after`) — "MVP צורך בפועל רק את השלושה" מתועד במפורש בקוד | **PARTIAL** — הטיפוס מוכן, המימוש חלקי במכוון; להשלים ל-Milestone B כדי לאפשר choreography נפרד לכניסה/יציאה |
| אינדיקציית progress חזותית (לסצנה הנוכחית ו/או לעמוד כולו) | `--exp-scene-progress` נכתב כ-CSS var בכל frame על ה-`<section data-experience-scene>` (`experience-runtime.ts`) — ניתן לצריכה חזותית (progress bar/דיוט מונע-var) | **PARTIAL** — ה-var ל-progress *של סצנה בודדת* קיים; אין `globalProgress` (0–1 על פני כל הדף) ואין layer-type ייעודי מסוג "progress indicator" בתוך 5 סוגי ה-Layer הקיימים (`text/image/shape/button/block`) — שניהם ל-Milestone B |
| תנועה עם מטרת נרטיב מכוונת (מושכת תשומת לב / בונה יחס בין אלמנטים / דרמה) — לא "אפקט לשם אפקט" | `ExperienceTrack` על 6 מאפיינים (`opacity/x/y/scale/rotate/blur`, `PROPERTY_METADATA`) + טוקני easing סמנטיים (`linear/soft/spring/cinematic/sharp`, `EASING_LABELS`) | **EXISTS** ברמת הכלי הטכני; ה"כוונה הנרטיבית" היא תמיד החלטת עיצוב של מי שבונה את הסצנה — ניתן לקודד דפוסים בעלי-כוונה כ-presets מוכנים (`lib/experience-presets.ts`) כדי להנמיך את סף הכניסה |
| בעלות בלעדית של target+property אחד, כדי שאין "מלחמת אנימציות" בין שתי מערכות על אותו אלמנט (תנאי-סף לחוויה שמורגשת "נקייה"/מכוונת) | `Track Ownership` validation + `INCOMPATIBLE_TARGETS` (`lib/experience.ts`) — אבל אין עדיין טבלת תקדימות פורמלית מול Reveal/hover/theme-fx (מתועד כפער פתוח גם ב-`docs/rebuild-workplan.md` §1) | **PARTIAL** — הבדיקה נגד קונפליקטים *בתוך* Experience קיימת; אכיפה מול המערכות האחרות (Reveal וכו') עדיין לא פורמלית — Milestone B/A3 |
| רספונסיב אמיתי: הכוריאוגרפיה *מסתגלת* במסכים צרים (durationVh/keyframes/layout שונים), לא רק "אותו דבר בקטן" או נפילה לסטטי מוחלט | `Responsive<T>` על `durationVh`/`LayerLayout`/`Track.responsive.{tablet,mobile}` + `resolveResponsive()` + `ResponsiveMode` דרך Context; `reducedMotion` מבטל רק pinning, לא תוכן | **EXISTS** — ממומש ומאומת (`docs/experience-final-audit.md`, Phases 10–12) |
| ביצועים כרכיב UX: frame drops הורסים את תחושת ה"קולנועיות" בדיוק כמו טעות קומפוזיציה | `PROPERTY_METADATA.performanceClass` ("cheap"/"expensive") + `settings.performance="lite"` מדלג על מאפיינים יקרים (`blur`); `rAF` יחיד לכל runtime, אפס `setState` בלולאה עצמה | **EXISTS** — ממומש ומאומת |

---

## 5. סיכום — מה עדיין נחוץ לפני שאפשר לכתוב את סעיף 2 באמת

1. **גישת רשת ל-`stoneliner.vercel.app:443`** — ללא זה, שום המשך של
   העבודה הזו (A1 במלואה) לא אפשרי. יש לדווח למשתמש על החסימה ולבקש
   הרחבת ה-egress allowlist, או להריץ את `stone-scroll-audit.mjs`
   מסביבה אחרת שיש לה גישה ולייבא את התוצרים (`measurements.json`
   + screenshots) חזרה לניתוח.
2. ברגע שיש גישה: להריץ את הסקריפט (סעיף 3), לכתוב את סעיף 2 מהתצפית
   האמיתית לפי פרוטוקול 8 הנקודות המלא, ואז — ורק אז — לעבור שורה־שורה
   על טבלת סעיף 4 ולתקן/לאשר כל תא לפי מה שנצפה בפועל.
3. עד אז, טבלת סעיף 4 שימושה מוגבל: היא יכולה לכוון עבודת Milestone B
   (השלמת `globalProgress`/lifecycle מלא, `crossfade`/`directional`
   בפועל, טבלת תקדימות פורמלית) כי הפערים שהיא מזהה נובעים **מקריאת
   הקוד הקיים עצמו**, לא מהשערה על STONE — אבל אין להתייחס אליה כאילו
   היא מוכיחה ש-STONE אכן משתמשת בעקרונות האלה. זה עדיין לא אומת.

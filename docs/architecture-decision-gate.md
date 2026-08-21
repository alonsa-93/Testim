# שער החלטת ארכיטקטורה (Milestone A3)

> תנאי מהתוכנית (rebuild-workplan.md §A3): "אין המשך לקוד עד שהפרק
> קוהרנטי". מסמך זה הוא אותו פרק — 12 שאלות הבעלות + טבלת התקדימות
> המחייבת. אחרי המסמך הזה, Milestone B (קוד) מותר להתחיל.

---

## 1. שתים-עשרה שאלות הבעלות — תשובות חד-משמעיות

| # | שאלה | תשובה |
|---|---|---|
| 1 | מי מחזיק scroll state? | `ExperienceRuntime` **בלבד**, אחד per page/preview, דרך `ScrollRoot` abstraction. אין מקור שני לגלילה (לא ב-React state, לא ב-CSS scroll-timeline נפרד). |
| 2 | מי מחזיק scene state (איזו סצנה פעילה, טווחים)? | `ExperienceRuntime` — `measureScene` מודד גבולות אמיתיים (DOM), לא אחוזים קשיחים. הסטודיו **קורא** מצב זה (debug badge, scrubber) — לא מחזיק עותק עצמאי. |
| 3 | מי מחזיק progress (סצנה/גלובלי)? | `sceneProgress` (קיים) ו-`globalProgress` (Milestone B2, חדש) — שניהם מחושבים ונכתבים ע"י `ExperienceRuntime.update()` בלבד, כ-CSS vars (`--exp-scene-progress`, `--exp-global-progress`). אין `useState` מקביל בצד React לערכים האלה בדף הציבורי (רק בכלי עזר של הסטודיו, שקוראים לא כותבים). |
| 4 | מי מחזיק מאפיינים ויזואליים (opacity/x/y/.../clip/color)? | **Track פעיל, אם יש** — נכתב ישירות ל-DOM (`element.style.setProperty`) על ה-`--exp-*` var המתאים; אם אין track פעיל על target+property מסוים, הברירת-מחדל הנייטרלית של `.exp-motion` ב-CSS חלה (opacity:1, translate:0 וכו') — לא "כלום קורה", אלא ערך ברירת-מחדל מפורש. |
| 5 | מי אחראי על pinning? | `ExperienceScene` (sticky) בלבד, לפי `scene.composition==="stage" && scene.pinned`. אין pinning נפרד ברמת layer. |
| 6 | מי אחראי על רספונסיב (Desktop/Tablet/Mobile)? | הסכמה (`Responsive<T>`) ברמת נתונים; `ExperienceProvider` מזרים `mode` יחיד מלמעלה (נגזר מ-viewport אמיתי בדף הציבורי, או מבורר ה-viewport בסטודיו) — כל צרכן פותר עם `resolveResponsive(value, mode)`. אין ניחוש CSS media-query מקביל בתוך tracks עצמם. |
| 7 | מי אחראי על אפקטים (Reveal/hover/theme-fx) כש-Experience פעיל? | **תלוי בשכבה**: freeform layers (text/image/shape/button) לעולם לא עוברים דרך Reveal/Tilt/CountUp כלל — הם מרונדרים ישירות ע"י `ExperienceLayerRenderer`. **רק** block-ref layers (`ExperienceBlockRefLayer`) מכילים בלוקים אמיתיים עם האפקטים הפנימיים שלהם — וזו בדיוק נקודת ההתנגשות שנפתרת בטבלת התקדימות למטה (§2). |
| 8 | מי אחראי על theme (צבעים/טוקנים)? | `lib/theme.ts` בלבד. Experience **קורא** דרך `resolveThemeColor`/`SEMANTIC_COLOR_VARS` — אף פעם לא מגדיר טוקן מקביל. Track של `color` (Milestone B4) יאנטרפל **בין** ערכי טוקן קיימים, לא יגדיר צבעים חדשים. |
| 9 | מהו יחס Experience↔Blocks/Theme? | Experience הוא שכבה **אופציונלית מעל** Standard — לעולם צרכן, לא מחליף. בלוק שמופיע כ-blockRef הוא אותו רכיב בדיוק שמופיע ב-Standard, לא עותק. |
| 10 | האם Standard עצמאי לחלוטין מ-Experience? | כן — `page.experience?.enabled` הוא ה-gate היחיד; מאומת אמפירית (`experience-final-audit.md` §Core: 62 בדיקות regression, CSS מבודד תחת `[data-experience-active]`). Milestone B/C/D **אסור** להם לגעת בנתיב הרינדור של Standard כשה-flag כבוי. |
| 11 | מי מחזיק את בחירת ה-UI (selectedLayerId וכו') ב-Studio? | React state ב-`studio-app.tsx` (רמת האפליקציה), מוזרם *גם* לפאנל הימני (עריכה) *וגם* לקנבס (הדגשה) — Milestone D1 מוסיף את הכיוון השני (קנבס→state) שחסר היום. |
| 12 | מי קובע ולידציה/אזהרות? | `lib/experience-validate.ts` בלבד — מקור אמת יחיד, גם לתצוגת אזהרות בסטודיו וגם (Milestone B4) לאכיפת נטרול בזמן ריצה. |

---

## 2. טבלת התקדימות המחייבת (Single Ownership)

**עיקרון-העל:** לכל צירוף `(target, property)` יש **בעלים אחד** בכל
רגע נתון. כשיש קונפליקט פוטנציאלי, סדר העדיפות הבא **מחייב**, לא
מוצע:

```
1. Experience Track פעיל על אותו (target, property)   ← הכי גבוה
2. אפקט ברמת בלוק (Reveal / CountUp / TiltCard hover)
3. Reveal של Standard (ברמת עמוד, מחוץ ל-Experience)
4. ברירת מחדל של Theme                                 ← הכי נמוך
```

### 2.1 מתי בכלל יש קונפליקט אפשרי (מאומת מול הקוד, לא תיאורטי)

רק בנקודה אחת: **block-ref layer בתוך scene** (`ExperienceBlockRefLayer`)
מרנדר בלוק אמיתי (CTA/Features/About/Gallery/...) שמכיל `<Reveal>`
פנימי. ה-wrapper החיצוני (`ExperienceTarget`, `data-scrub`) עשוי להיות
ממוקד ע"י track; ה-`<Reveal>` הפנימי (`data-animate`) רץ תמיד, בלתי
תלוי, עם ה-`IntersectionObserver` העצמאי שלו. freeform layers
(text/image/shape/button) **אינן** יכולות להתנגש — הן לא עוברות דרך
Reveal/Tilt/CountUp כלל.

### 2.2 האכיפה (Milestone B4 — לא רק תיעוד)

כלל: **כש-block-ref layer נמצא בתוך scene פעילה של Experience, אפקטי
ה-Reveal הפנימיים שלו מנוטרלים לחלוטין** — הבלוק מרונדר במצב הסופי
("revealed") שלו באופן מיידי, בלי IntersectionObserver, בלי
`data-animate`/`data-inview`. ה-Track החיצוני (אם קיים) הוא היחיד
שקובע את הכניסה/יציאה; אם אין track על ה-target הזה, ברירת המחדל
הנייטרלית של `.exp-motion` חלה (הבלוק פשוט גלוי, ללא אנימציה) — לא
"שני מנועים מתחרים", אלא אחד מהם תמיד שותק.

מנגנון (עקבי עם דפוס קיים כבר בקוד — `data-studio-motion="off"` ב-
`globals.css:523`, שכבר משתמש באותו selector `:is([data-animate],
[data-scrub], ...)` בדיוק בשביל תרחיש אחר, קפיאת עריכה בסטודיו):

1. `ExperienceBlockRefLayer` יסמן `data-experience-managed=""` על ה-
   wrapper שלו (בנוסף ל-`data-scrub` הקיים).
2. `Reveal` יקרא (דרך context אופציונלי חדש, ברירת מחדל `false` —
   כך ש-Standard לא מושפע כלל כשאין Experience) האם הוא "מנוהל" —
   ואם כן, ידלג על ה-`IntersectionObserver` ויתחיל ב-`inView=true`
   באופן קבוע (מצב סופי, בלי אנימציה, בלי `data-animate`).
3. גיבוי ברמת CSS (הגנה כפולה, כמו התקדים הקיים): כלל תחת
   `[data-experience-managed] [data-animate]` שמנטרל visually את
   מצב-ההתחלה-המוסתר גם אם ה-JS context לא תפס איכשהו.

זה מממש ישירות את שורה #1 בטבלה: Track > אפקט בלוק. שורות #2-#4
כבר נכונות כברירת מחדל היום (Reveal של Standard רגיל תמיד מנצח theme
default; לא נדרש שינוי שם).

### 2.3 מה **לא** בהיקף (מוצהר, לא נשכח)

- Hover-driven effects (TiltCard) מגיבים לעכבר, לא לגלילה — אינם
  מתנגשים בציר הזמן עם track (שניהם יכולים לפעול בו-זמנית על
  properties שונות של אותו אלמנט בלי בעיה: track שולט y/opacity
  לאורך גלילה, hover שולט rotate בתגובה לעכבר). **לא נדרש נטרול.**
  אם עתידית track ינסה לשלוט גם ב-`rotate` על אותו טרגט עם TiltCard
  — זה המקרה שדורש את אותה טכניקת דיכוי; לא קיים כרגע במאגר.
- Theme-level ambient effects (aurora/beam/glow/marquee/grain) —
  אלה שכבות עיצוב גלובליות, לא per-property; הטיפול בהן הוא Milestone
  F1 ("opt-in בלבד"), לא טבלת תקדימות per-property.

---

## 3. שער יציאה A3

הפרק קוהרנטי: 12/12 שאלות בעלות נענו חד-משמעית; טבלת התקדימות מגדירה
כלל ברור + מנגנון אכיפה קונקרטי שמשתמש בתבנית CSS/data-attribute
שכבר קיימת בקוד (לא המצאה — הרחבה). **הושלם.** ← ממשיכים ל-A4.

Milestone B4 מיישם את §2.2 בפועל (עם בדיקות ייעודיות ל-`Reveal`
במצב `data-experience-managed`).

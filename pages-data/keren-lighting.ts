import type { Page } from "@/lib/page";
import type { ExperienceScene, ExperienceTrack } from "@/lib/experience";
import { parallaxDepthTrack, parallaxTrack } from "@/lib/experience-presets";

/**
 * Milestone G (docs/rebuild-workplan.md אבן דרך G, Phase 15) — הדמו
 * האיכותי. שונה במכוון מ-pages-data/scroll-experience-demo.ts (C1):
 * זה לא הוכחת-יכולת-מנוע ("5 סצנות בדיוק לפי המפרט הטכני") אלא ניסיון
 * ממשי לבנות אתר-מוצר מקורי, מדומיין, שמרגיש כמו אתר אמיתי -- לא
 * הדגמת הנדסה. "קרן" הוא סטודיו עיצוב תאורה אדריכלי בדיוני (אין מותג
 * כזה בעולם האמיתי; כל תוכן כאן מומצא לצורך הדמו הזה בלבד).
 *
 * נבנה **רק** מפרימיטיבים גנריים קיימים -- אפס לוגיקת רינדור חד-פעמית:
 * טיפוסי Layer רגילים (text/shape), Track רגיל, ושני ה-helpers
 * המיוצאים מ-lib/experience-presets.ts (parallaxTrack/parallaxDepthTrack,
 * Milestone F2) בדיוק כפי שפרימיטיב-לשימוש-חוזר אמור לשמש -- לא רק
 * בתוך presets, גם בדף אמיתי.
 *
 * רשום כדף פרסום אמיתי (pages-data/index.ts, /p/keren) ולא כ-route
 * מיוחד בקוד -- עובר דרך בדיוק אותו נתיב שמשתמש אמיתי היה עובר דרכו
 * אחרי הורדת JSON מהסטודיו (§ Milestone F1: התיקון האמיתי ל-/p/[pageId]
 * שלא בדק page.experience?.enabled בכלל). זו ההוכחה החיה שהצינור המלא
 * עובד קצה-לקצה, לא רק דמו נפרד עם route משלו.
 *
 * ניווט מינימלי במכוון (§0 עקרון 4/5 בתוכנית): בלי סרגל עליון קבוע,
 * בלי "חזרה לאתר" -- בדיוק כמו שדף מוצר אמיתי לא היה נושא chrome של
 * כלי הבנייה שיצר אותו. ExperienceLayer אין לו עדיין מושג "שכבה
 * גלובלית חוצת-סצנות" (תועד כפער פתוח ב-docs/reference-experience-
 * analysis.md §4 שורה 1) -- לא נבנה מנגנון עוקף כאן, רק מוותרים על נאב
 * לגמרי, שמקיים את העיקרון בצורה הכי נקייה.
 *
 * ערכה: nova-dark (כהה וטכנולוגי) -- אותה ערכה מוכחת מהדמו C1, בלי
 * להילחם בפלטה הקרירה שלה: התוכן כאן ממוסגר כתאורה אדריכלית מדויקת/
 * קרירה, לא חמה-כפרית, כך שהפלטה משרתת את הזהות במקום לסתור אותה.
 */

// Milestone H (ביקורת מבקר-אדברסריאלי, ממצא #6): מחושב פעם אחת, לא
// פעמיים עם אותם ארגומנטים בדיוק (fadeUpClipTrack ב-lib/experience-presets.ts
// כבר עושה את זה נכון -- כאן זה היה הסטייה, לא הכלל).
const kerenGlowBase = parallaxDepthTrack("keren-glow", 0.3, { easing: "soft", peakOpacity: 0.5, blurPx: 60 });
const kerenGlowTrack: ExperienceTrack = {
  ...kerenGlowBase,
  id: "keren-glow-track",
  props: { ...kerenGlowBase.props, rotate: [{ at: 0, value: 0 }, { at: 1, value: 25 }] },
};

const heroScene: ExperienceScene = {
  id: "keren-hero",
  name: "פתיחה — קרן",
  composition: "stage",
  pinned: true,
  // Milestone F2/E1: durationVh רספונסיבי (לא רק ברירת מחדל שטוחה) --
  // אותו עיקרון בכל הסצנות המוצמדות בדף הזה.
  durationVh: { base: 240, tablet: 210, mobile: 170 },
  background: { color: "background" },
  transition: "fade",
  layers: [
    {
      id: "keren-eyebrow",
      type: "text",
      content: { text: "עיצוב תאורה אדריכלי", tag: "span" },
      layout: { mode: "stage", x: "50%", y: "36%", anchor: "center", zIndex: "content" },
      style: { color: "muted" },
    },
    {
      id: "keren-title",
      type: "text",
      content: { text: "קרן", tag: "h1" },
      layout: { mode: "stage", x: "50%", y: "50%", width: "min(92vw, 60rem)", anchor: "center", zIndex: "content" },
      style: { color: "text" },
    },
    {
      id: "keren-subtitle",
      type: "text",
      content: { text: "אור הוא חומר. אנחנו מעצבים אותו כמו כל חומר אחר — בדיוק, באיפוק, בכוונה.", tag: "p" },
      layout: { mode: "stage", x: "50%", y: "67%", width: "min(85vw, 34rem)", anchor: "center", zIndex: "content" },
      style: { color: "muted" },
    },
    {
      id: "keren-scroll-hint",
      type: "text",
      content: { text: "גללו לגלות ↓", tag: "span" },
      layout: { mode: "stage", x: "50%", y: "90%", anchor: "center", zIndex: "ui" },
      style: { color: "muted" },
    },
    {
      id: "keren-glow",
      type: "shape",
      content: { shape: "circle" },
      layout: { mode: "stage", x: "50%", y: "50%", width: "50vmax", anchor: "center", zIndex: "background-decoration" },
      style: { background: "accent" },
      // Milestone E1: דקורטיבי-בלבד -- על מסך צר "רקע רחוק" שכזה תופס
      // יותר מדי מהמרחב המצומצם ביחס לתועלת הוויזואלית שהוא נותן.
      hidden: { base: false, mobile: true },
    },
  ],
  tracks: [
    {
      id: "keren-eyebrow-track",
      target: "keren-eyebrow",
      easing: "soft",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.12, value: 1 }, { at: 0.55, value: 1 }, { at: 0.75, value: 0 }],
        y: [{ at: 0, value: 20 }, { at: 0.12, value: 0 }],
        // הצבע "מתעורר" ממ-muted לכיוון accent -- אור שמתחיל להידלק,
        // לא רק אפקט טכני (אותו רעיון עיצובי כמו ב-scroll-experience-demo,
        // אבל כאן זה חלק מהנרטיב של המותג עצמו: אור).
        color: [{ at: 0, value: "#9AA7C7" }, { at: 0.3, value: "#22D3EE" }],
      },
    },
    {
      id: "keren-title-track",
      target: "keren-title",
      easing: "cinematic",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.3, value: 1 }, { at: 0.75, value: 1 }, { at: 1, value: 0 }],
        y: [{ at: 0, value: 50 }, { at: 0.3, value: 0 }, { at: 1, value: -40 }],
        scale: [{ at: 0, value: 0.94 }, { at: 0.3, value: 1 }],
        // חשיפה כלפי מעלה בכניסה, וחזרה לצל ביציאה -- אותה כוריאוגרפיה
        // בדיוק כמו typo-track ב-scroll-experience-demo.ts, לא מנגנון שני.
        clip: [{ at: 0, value: 0 }, { at: 0.3, value: 1 }, { at: 0.85, value: 1 }, { at: 1, value: 0 }],
      },
    },
    {
      id: "keren-subtitle-track",
      target: "keren-subtitle",
      easing: "soft",
      props: {
        opacity: [{ at: 0.2, value: 0 }, { at: 0.4, value: 1 }, { at: 0.65, value: 1 }, { at: 0.8, value: 0 }],
      },
    },
    {
      id: "keren-scroll-hint-track",
      target: "keren-scroll-hint",
      easing: "soft",
      props: {
        // רמז חולף, לא נוכחות קבועה -- נעלם עוד לפני שהכותרת מתחילה לצאת
        opacity: [{ at: 0, value: 0 }, { at: 0.08, value: 0.6 }, { at: 0.18, value: 0 }],
      },
    },
    // Milestone F2/G: שימוש ישיר ב-parallaxDepthTrack המיוצא --
    // ההוכחה שהפרימיטיב הזה משרת גם דף אמיתי, לא רק presets.
    // factor נמוך (0.3) = "מקור אור רחוק", לא זז חד יחסית לגלילה.
    kerenGlowTrack,
  ],
};

const craftScene: ExperienceScene = {
  id: "keren-craft",
  name: "מלאכה — כל קו נולד ביד",
  composition: "flow",
  pinned: false,
  durationVh: 100,
  background: { color: "surface" },
  transition: "cut",
  layers: [
    {
      id: "keren-craft-title",
      type: "text",
      content: { text: "כל קו נולד ביד", tag: "h2" },
      layout: { mode: "flow", width: "min(80vw, 40rem)", anchor: "center" },
      style: { color: "text" },
    },
    {
      id: "keren-craft-body",
      type: "text",
      content: {
        text: "לפני שקרן הופך למוצר, הוא סקיצה. אנחנו מתחילים מהצל — מאיפה האור לא אמור להיות — ובונים כלפי חוץ. כל דגם עובר עשרות גרסאות ביד לפני שהוא מגיע לייצור.",
        tag: "p",
      },
      layout: { mode: "flow", width: "min(80vw, 36rem)", anchor: "center" },
      style: { color: "muted" },
    },
  ],
  tracks: [
    {
      id: "keren-craft-title-track",
      target: "keren-craft-title",
      easing: "soft",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.3, value: 1 }],
        y: [{ at: 0, value: 30 }, { at: 0.3, value: 0 }],
      },
    },
    {
      id: "keren-craft-body-track",
      target: "keren-craft-body",
      easing: "soft",
      props: {
        opacity: [{ at: 0.15, value: 0 }, { at: 0.4, value: 1 }],
        y: [{ at: 0.15, value: 24 }, { at: 0.4, value: 0 }],
      },
    },
  ],
};

// Milestone H (ביקורת מבקר-אדברסריאלי, ממצא #6): שני ה-tracks הבאים
// מחושבים פעם אחת כל אחד, לא פעמיים עם אותם ארגומנטים.
const kerenRevealBackBase = parallaxTrack("keren-reveal-shape-back", 0.15, { easing: "linear", travelPercent: 20 });
const kerenRevealBackTrack: ExperienceTrack = {
  ...kerenRevealBackBase,
  id: "keren-reveal-back-track",
  props: {
    ...kerenRevealBackBase.props,
    opacity: [{ at: 0, value: 0 }, { at: 0.2, value: 1 }, { at: 0.85, value: 1 }, { at: 1, value: 0 }],
  },
};
const kerenRevealMidBase = parallaxTrack("keren-reveal-shape-mid", 0.6, { easing: "linear", travelPercent: 20 });
const kerenRevealMidTrack: ExperienceTrack = {
  ...kerenRevealMidBase,
  id: "keren-reveal-mid-track",
  props: {
    ...kerenRevealMidBase.props,
    opacity: [{ at: 0.15, value: 0 }, { at: 0.35, value: 1 }, { at: 0.85, value: 1 }, { at: 1, value: 0 }],
    scale: [{ at: 0.15, value: 0.8 }, { at: 0.35, value: 1 }, { at: 1, value: 1.08 }],
    // האור "נדלק": מ-muted (כבוי) ל-accent (דולק) -- הצבע הוא חלק מהסיפור, לא רק תנועה.
    color: [{ at: 0.15, value: "#5A72B8" }, { at: 0.5, value: "#22D3EE" }],
  },
};

const revealScene: ExperienceScene = {
  id: "keren-reveal",
  name: "גילוי — צורה שממשיכה את האור",
  composition: "stage",
  pinned: true,
  durationVh: { base: 260, tablet: 225, mobile: 185 },
  background: { color: "background" },
  transition: "fade",
  layers: [
    {
      id: "keren-reveal-label",
      type: "text",
      content: { text: "הדגם הראשון", tag: "span" },
      layout: { mode: "stage", x: "50%", y: "18%", anchor: "center", zIndex: "content" },
      style: { color: "muted" },
    },
    {
      id: "keren-reveal-shape-back",
      type: "shape",
      content: { shape: "rect" },
      // height מפורש (LayerLayout.height, Milestone G) -- פאנל-רקע רחב,
      // לא ריבוע; בלי זה ה-shape עומד בגובה 0px (ראו lib/experience.ts).
      layout: { mode: "stage", x: "50%", y: "52%", width: "72vw", height: "55vh", anchor: "center", zIndex: "background-decoration" },
      style: { background: "surface", radius: 40 },
    },
    {
      id: "keren-reveal-shape-mid",
      type: "shape",
      content: { shape: "circle" },
      // y מוזז מ-50% ל-44% -- עם parallax travel (±20%) + scale (עד 1.08)
      // ה-shape יכול לרדת קרוב מדי לכותרת ב-82%; מרווח בטוח יותר.
      layout: { mode: "stage", x: "50%", y: "44%", width: "26vmax", anchor: "center", zIndex: "content" },
      style: { background: "muted" },
    },
    {
      id: "keren-reveal-title",
      type: "text",
      content: { text: "צורה שממשיכה את האור", tag: "h2" },
      layout: { mode: "stage", x: "50%", y: "88%", width: "min(80vw, 40rem)", anchor: "center", zIndex: "content" },
      style: { color: "text" },
    },
  ],
  tracks: [
    {
      id: "keren-reveal-label-track",
      target: "keren-reveal-label",
      easing: "soft",
      props: { opacity: [{ at: 0.05, value: 0 }, { at: 0.25, value: 1 }, { at: 0.8, value: 1 }, { at: 0.95, value: 0 }] },
    },
    // "far" layer -- קרוב לגמרי, נע מעט מאוד (רקע-תוך-רקע)
    kerenRevealBackTrack,
    // "near" layer -- זזה מהר יותר מהרקע (יחס מהירות אחר, אותה סצנה,
    // אותו progress) -- זו בדיוק ה-parallax שהטבלה בסעיף 4 של
    // docs/reference-experience-analysis.md זיהתה כחסרת helper.
    kerenRevealMidTrack,
    {
      id: "keren-reveal-title-track",
      target: "keren-reveal-title",
      easing: "soft",
      props: {
        opacity: [{ at: 0.35, value: 0 }, { at: 0.55, value: 1 }, { at: 0.85, value: 0 }],
        y: [{ at: 0.35, value: 20 }, { at: 0.55, value: 0 }],
      },
    },
  ],
};

const detailScene: ExperienceScene = {
  id: "keren-detail",
  name: "פרט — שום דבר לא מקרי",
  composition: "stage",
  pinned: true,
  durationVh: { base: 200, tablet: 175, mobile: 150 },
  background: { color: "surface" },
  transition: "fade",
  layers: [
    {
      id: "keren-detail-statement",
      type: "text",
      content: { text: "אלומיניום ממוחזר. זכוכית מנופחת ביד. שום דבר לא מקרי.", tag: "h2" },
      layout: { mode: "stage", x: "50%", y: "50%", width: "min(85vw, 44rem)", anchor: "center", zIndex: "content" },
      style: { color: "text" },
    },
  ],
  tracks: [
    {
      id: "keren-detail-track",
      target: "keren-detail-statement",
      easing: "cinematic",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.25, value: 1 }, { at: 0.75, value: 1 }, { at: 1, value: 0 }],
        scale: [{ at: 0, value: 0.92 }, { at: 0.25, value: 1 }, { at: 1, value: 1.05 }],
        blur: [{ at: 0, value: 6 }, { at: 0.25, value: 0 }, { at: 0.85, value: 0 }, { at: 1, value: 5 }],
        clip: [{ at: 0, value: 0 }, { at: 0.25, value: 1 }, { at: 0.85, value: 1 }, { at: 1, value: 0 }],
      },
    },
  ],
};

const ctaScene: ExperienceScene = {
  id: "keren-cta",
  name: "סיום — קריאה לפעולה",
  composition: "flow",
  pinned: false,
  durationVh: 100,
  layers: [],
  tracks: [
    {
      id: "keren-cta-entrance-track",
      target: "keren-cta-block",
      easing: "soft",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.3, value: 1 }],
        y: [{ at: 0, value: 40 }, { at: 0.3, value: 0 }],
      },
    },
  ],
  blockRefs: ["keren-cta-block"],
};

export const kerenLightingPage: Page = {
  id: "keren",
  name: "קרן — עיצוב תאורה אדריכלי",
  themeId: "nova-dark",
  meta: {
    title: "קרן — אור שמעצב חלל",
    description: "סטודיו עיצוב תאורה אדריכלי מינימליסטי. כל קו נולד ביד.",
  },
  blocks: [
    {
      id: "keren-cta-block",
      type: "cta",
      content: {
        title: "מוכנים להאיר את החלל שלכם?",
        text: "קרן זמינה כעת להזמנה מוקדמת — ליווי אישי מהסקיצה ועד ההתקנה.",
        ctaLabel: "לקביעת פגישת ייעוץ",
        ctaHref: "#",
      },
    },
  ],
  experience: {
    version: 1,
    enabled: true,
    mode: "scroll",
    settings: {
      defaultDurationVh: 200,
      defaultEasing: "soft",
      reducedMotion: "static",
      performance: "auto",
      intensity: 1,
      scrub: 0,
      debug: false,
    },
    scenes: [heroScene, craftScene, revealScene, detailScene, ctaScene],
  },
};

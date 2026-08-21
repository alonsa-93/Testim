import type { Page } from "@/lib/page";
import type { ExperienceScene } from "@/lib/experience";

/**
 * Phase 9 — דוגמת /preview/scroll-experience (docs/experience-audit.md
 * §18 Phase 9, §90–96 במסמך הסופי). Page JSON אמיתי — לא hardcoded בקוד
 * React; ה-route רק קורא אותו ומרנדר. חמש סצנות בדיוק לפי המפרט:
 * Hero / Typography / Media / Multi-Layer / CTA.
 *
 * Scene 5 (CTA) משתמש ב-blockRefs כדי להפגין את הגשר לבלוקים קיימים
 * (§104 במסמך הסופי) — לא משכפל תוכן, מפנה לבלוק cta אמיתי שמוגדר
 * למטה ב-blocks. Scene 2/3/4 לא משתמשות ב-blockRefs במכוון: הבלוקים
 * שלהם (Statement וכו') נושאים מנגנון sticky/scroll עצמאי משלהם,
 * וקינון pin-בתוך-pin הוא לא דפוס שרצינו להפגין כאן.
 *
 * ImageLayer בסצנה 3 מצביע ל-SVG הקיים ב-public/globe.svg בהיעדר תמונת
 * תוכן אמיתית בריפו — מוכיח את הצנרת המלאה (alt/decorative/responsive
 * positioning), לא את איכות הנכס עצמו.
 *
 * Milestone E1 (docs/rebuild-workplan.md אבן דרך E) — סצנה 4 (רב-שכבתי)
 * נושאת עכשיו tablet/mobile overrides אמיתיים: durationVh מתקצר,
 * layout של הכותרת/הנתון עובר מדו-טור (RTL start) לערימה ממורכזת,
 * וצורת ה-accent הדקורטיבית מוסתרת לגמרי במובייל. סצנה 1 (hero) נושאת
 * responsive.mobile על ה-y track של הכותרת (תזוזה מרוסנת יותר). זו
 * ההוכחה בתוכן אמיתי ש-Responsive<T> לא רק pipe ריק (§ בעיה שתועדה
 * ב-08-16 audit כ-PARTIAL) — יחד עם use-responsive-mode.ts החדש
 * (components/experience/) שמזין mode אמיתי מ-matchMedia בדף הציבורי,
 * לא רק מסימולטור ה-viewport הידני של הסטודיו.
 */

const heroScene: ExperienceScene = {
  id: "demo-hero",
  name: "פתיחה — כותרת קולנועית",
  composition: "stage",
  pinned: true,
  durationVh: 260,
  background: { color: "background" },
  transition: "fade",
  layers: [
    {
      id: "demo-hero-eyebrow",
      type: "text",
      content: { text: "Testim Experience Engine", tag: "span" },
      layout: {
        mode: "stage",
        x: "50%",
        y: "38%",
        anchor: "center",
        zIndex: "content",
      },
      style: { color: "accent" },
    },
    {
      id: "demo-hero-title",
      type: "text",
      content: { text: "חוויית גלילה שמספרת סיפור", tag: "h1" },
      layout: {
        mode: "stage",
        x: "50%",
        y: "48%",
        width: "min(90vw, 48rem)",
        anchor: "center",
        zIndex: "content",
      },
      style: { color: "text" },
    },
    {
      id: "demo-hero-subtitle",
      type: "text",
      content: {
        text: "כל מה שרואים כאן מונע מ-Page JSON + Theme JSON + Experience JSON אמיתיים — לא וידאו, לא אנימציה מוקלטת.",
        tag: "p",
      },
      layout: {
        mode: "stage",
        x: "50%",
        y: "62%",
        width: "min(85vw, 34rem)",
        anchor: "center",
        zIndex: "content",
      },
      style: { color: "muted" },
    },
    {
      id: "demo-hero-cta",
      type: "button",
      content: { label: "לתחילת הסיפור", href: "#demo-typography", variant: "primary" },
      layout: { mode: "stage", x: "50%", y: "76%", anchor: "center", zIndex: "ui" },
    },
    {
      id: "demo-hero-orb",
      type: "shape",
      content: { shape: "blob" },
      layout: {
        mode: "stage",
        x: "50%",
        y: "50%",
        width: "38vmax",
        anchor: "center",
        zIndex: "background-decoration",
      },
      style: { background: "primary" },
    },
  ],
  tracks: [
    {
      id: "hero-eyebrow-track",
      target: "demo-hero-eyebrow",
      easing: "soft",
      props: {
        opacity: [
          { at: 0, value: 0 },
          { at: 0.12, value: 1 },
          { at: 0.55, value: 1 },
          { at: 0.75, value: 0 },
        ],
        y: [
          { at: 0, value: 30 },
          { at: 0.12, value: 0 },
        ],
        // Milestone B1/C1: color track — הצבע "מתיישב" מ-muted לכיוון accent
        // בדיוק עם עליית ה-opacity (אותו טווח 0->0.12), ומחזיק בדיוק את גוון
        // ה-accent הסטטי שהיה כאן קודם (#22D3EE, nova-dark) -- מוכיח שה-track
        // חי בשלום עם layer.style.color הסטטי (§B4: var(--exp-color, fallback))
        // ולא שובר את המראה הסופי, רק מוסיף תנועה עדינה לכניסה.
        color: [
          { at: 0, value: "#9AA7C7" },
          { at: 0.12, value: "#22D3EE" },
        ],
      },
    },
    {
      id: "hero-title-track",
      target: "demo-hero-title",
      easing: "cinematic",
      props: {
        // ENTER (0->0.3) -> HOLD -> exits upward while shrinking as the scene releases (0.7->1),
        // exactly matching the documented progression (30% appears, 70% repositions, 100% transition)
        opacity: [
          { at: 0, value: 0 },
          { at: 0.3, value: 1 },
          { at: 0.7, value: 1 },
          { at: 1, value: 0 },
        ],
        y: [
          { at: 0, value: 60 },
          { at: 0.3, value: 0 },
          { at: 0.7, value: -30 },
          { at: 1, value: -90 },
        ],
        scale: [
          { at: 0, value: 0.92 },
          { at: 0.3, value: 1 },
          { at: 1, value: 0.94 },
        ],
      },
      // Milestone E1: proof point ל-track.responsive (evaluateTrack,
      // lib/experience-interpolate.ts) עם תוכן אמיתי -- לא רק בדיקת יחידה.
      // "Mobile סיפור מפושט" (docs/rebuild-workplan.md אבן דרך E1) פירושו
      // כאן תזוזה מרוסנת יותר: אותה כוריאוגרפיה בדיוק (אותם at, אותו כיוון),
      // רק עם טווח y קטן משמעותית -- על מסך צר תזוזה אנכית של 90 יחידות
      // דוחפת את הכותרת קרוב מדי לקצה, ותנועה כה גדולה מרגישה טלטלה ולא
      // קולנועית במרחב מצומצם.
      responsive: {
        mobile: {
          y: [
            { at: 0, value: 30 },
            { at: 0.3, value: 0 },
            { at: 0.7, value: -12 },
            { at: 1, value: -30 },
          ],
        },
      },
    },
    {
      id: "hero-subtitle-track",
      target: "demo-hero-subtitle",
      easing: "soft",
      props: {
        opacity: [
          { at: 0.2, value: 0 },
          { at: 0.4, value: 1 },
          { at: 0.65, value: 1 },
          { at: 0.8, value: 0 },
        ],
      },
    },
    {
      id: "hero-cta-track",
      target: "demo-hero-cta",
      easing: "spring",
      props: {
        opacity: [
          { at: 0.35, value: 0 },
          { at: 0.5, value: 1 },
          { at: 0.85, value: 0 },
        ],
        scale: [
          { at: 0.35, value: 0.8 },
          { at: 0.5, value: 1 },
        ],
      },
    },
    {
      id: "hero-orb-track",
      target: "demo-hero-orb",
      easing: "linear",
      props: {
        rotate: [
          { at: 0, value: 0 },
          { at: 1, value: 40 },
        ],
        scale: [
          { at: 0, value: 0.85 },
          { at: 0.5, value: 1.05 },
          { at: 1, value: 0.9 },
        ],
        opacity: [
          { at: 0, value: 0.5 },
          { at: 0.5, value: 0.9 },
          { at: 1, value: 0.4 },
        ],
      },
    },
  ],
};

const typographyScene: ExperienceScene = {
  id: "demo-typography",
  name: "טיפוגרפיה — הצהרה גדולה",
  composition: "stage",
  pinned: true,
  durationVh: 220,
  background: { color: "surface" },
  transition: "fade",
  layers: [
    {
      id: "demo-typo-statement",
      type: "text",
      content: {
        text: "תנועה היא כלי נרטיבי — לא קישוט. כשהיא משרתת את התוכן, היא נעלמת מהתודעה ומשאירה רק את המסר.",
        tag: "h2",
      },
      layout: {
        mode: "stage",
        x: "50%",
        y: "50%",
        width: "min(88vw, 46rem)",
        anchor: "center",
        zIndex: "content",
      },
      style: { color: "text" },
    },
  ],
  tracks: [
    {
      id: "typo-track",
      target: "demo-typo-statement",
      easing: "cinematic",
      props: {
        opacity: [
          { at: 0, value: 0 },
          { at: 0.25, value: 1 },
          { at: 0.75, value: 1 },
          { at: 1, value: 0 },
        ],
        scale: [
          { at: 0, value: 0.9 },
          { at: 0.25, value: 1 },
          { at: 1, value: 1.06 },
        ],
        blur: [
          { at: 0, value: 8 },
          { at: 0.25, value: 0 },
          { at: 0.85, value: 0 },
          { at: 1, value: 6 },
        ],
        // Milestone B1/C1: clip track — חשיפה (wipe) מלמטה כלפי מעלה, באותו
        // טווח בדיוק כמו ה-opacity/blur (0->0.25 כניסה, 0.85->1 יציאה) --
        // מחזק את אותה כוריאוגרפיה קיימת במקום להתחרות איתה (§0 עקרון 2:
        // CLEAN/CINEMATIC/RESTRAINED, לא אפקט נוסף בפני עצמו).
        clip: [
          { at: 0, value: 0 },
          { at: 0.25, value: 1 },
          { at: 0.85, value: 1 },
          { at: 1, value: 0 },
        ],
      },
    },
  ],
};

const mediaScene: ExperienceScene = {
  id: "demo-media",
  name: "מדיה — פרלקס",
  composition: "stage",
  pinned: true,
  durationVh: 220,
  background: { color: "background" },
  transition: "fade",
  layers: [
    {
      id: "demo-media-image",
      type: "image",
      content: { src: "/globe.svg", alt: "המחשה גרפית", decorative: true },
      layout: {
        mode: "stage",
        x: "50%",
        y: "45%",
        width: "min(60vw, 26rem)",
        anchor: "center",
        zIndex: "content",
      },
    },
    {
      id: "demo-media-caption",
      type: "text",
      content: { text: "פרלקס וסקייל — מונעים לגמרי מ-scroll progress, אפס אנימציה מוקלטת", tag: "p" },
      layout: {
        mode: "stage",
        x: "50%",
        y: "82%",
        width: "min(80vw, 32rem)",
        anchor: "center",
        zIndex: "content",
      },
      style: { color: "muted" },
    },
  ],
  tracks: [
    {
      id: "media-image-track",
      target: "demo-media-image",
      easing: "soft",
      props: {
        y: [
          { at: 0, value: 15 },
          { at: 0.5, value: -5 },
          { at: 1, value: -25 },
        ],
        scale: [
          { at: 0, value: 0.85 },
          { at: 0.5, value: 1 },
          { at: 1, value: 1.15 },
        ],
        opacity: [
          { at: 0, value: 0 },
          { at: 0.2, value: 1 },
          { at: 0.85, value: 1 },
          { at: 1, value: 0 },
        ],
      },
    },
    {
      id: "media-caption-track",
      target: "demo-media-caption",
      easing: "soft",
      props: {
        opacity: [
          { at: 0.3, value: 0 },
          { at: 0.5, value: 1 },
          { at: 0.85, value: 0 },
        ],
      },
    },
  ],
};

const multiLayerScene: ExperienceScene = {
  id: "demo-multi",
  name: "רב-שכבתי",
  composition: "stage",
  pinned: true,
  // Milestone E1: proof point ל-durationVh responsive (normalizeDurationVh
  // כבר תמך בזה קודם -- כאן תוכן אמיתי משתמש בו לראשונה). על מובייל
  // הקומפוזיציה מתפשטת (כותרת+נתון נערמים אנכית במקום דו-טור, צורת
  // ה-accent מוסתרת) -- פחות כוריאוגרפיה בו-זמנית = פחות מרחק גלילה נדרש.
  durationVh: { base: 240, tablet: 220, mobile: 180 },
  background: { color: "surface" },
  transition: "fade",
  layers: [
    {
      id: "demo-multi-shape-bg",
      type: "shape",
      content: { shape: "rect" },
      layout: {
        mode: "stage",
        x: "50%",
        y: "50%",
        width: "70vw",
        anchor: "center",
        zIndex: "background",
      },
      style: { background: "primary", radius: 32 },
    },
    {
      id: "demo-multi-title",
      type: "text",
      content: { text: "כמה שכבות, סנכרון אחד", tag: "h2" },
      // Milestone E1: proof point ל-Responsive<LayerLayout> עם תוכן אמיתי --
      // desktop/tablet: טור טקסט בצד ימין (RTL start) מול הצורות בצד שני.
      // mobile: הקומפוזיציה הדו-טורית לא נכנסת ברוחב צר -- x/anchor עוברים
      // למרכז, width הופך מ-rem קשיח ל-vw יחסי. "Mobile סיפור מפושט"
      // (docs/rebuild-workplan.md E1) הלכה למעשה, לא רק תיאור.
      layout: {
        base: { mode: "stage", x: "30%", y: "35%", width: "20rem", anchor: "start", zIndex: "content" },
        // x מושמט בכוונה: anchor:"center"+width ממרכז דרך inset מלא +
        // margin-inline:auto (layerLayoutStyle, lib/experience.ts §12.4) --
        // x לא נצרך בכלל בנתיב הזה, השארתו הייתה קוד מת מטעה.
        mobile: { mode: "stage", y: "32%", width: "min(82vw, 20rem)", anchor: "center", zIndex: "content" },
      },
      style: { color: "background" },
    },
    {
      id: "demo-multi-stat",
      type: "text",
      content: { text: "0 setState בלולאת הגלילה", tag: "p" },
      layout: {
        base: { mode: "stage", x: "30%", y: "48%", width: "18rem", anchor: "start", zIndex: "content" },
        mobile: { mode: "stage", y: "46%", width: "min(78vw, 18rem)", anchor: "center", zIndex: "content" },
      },
      style: { color: "accent" },
    },
    {
      id: "demo-multi-shape-accent",
      type: "shape",
      content: { shape: "circle" },
      layout: { mode: "stage", x: "72%", y: "42%", width: "10rem", anchor: "center", zIndex: "foreground" },
      style: { background: "accent" },
      // Milestone E1: proof point ל-hidden כ-Responsive<boolean> (היה boolean
      // קשיח). הצורה כאן דקורטיבית-בלבד (אין track שכותב אליה תוכן, רק
      // rotate/opacity) -- "סיפור מפושט" במובייל אומר להשמיט אותה לגמרי
      // במקום לדחוס אותה למרחב הצר יחד עם הכותרת/הנתון.
      hidden: { base: false, mobile: true },
    },
  ],
  tracks: [
    {
      id: "multi-bg-track",
      target: "demo-multi-shape-bg",
      easing: "soft",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.15, value: 1 }, { at: 0.85, value: 1 }, { at: 1, value: 0 }],
        scale: [{ at: 0, value: 0.9 }, { at: 0.15, value: 1 }],
      },
    },
    {
      id: "multi-title-track",
      target: "demo-multi-title",
      easing: "cinematic",
      props: {
        opacity: [{ at: 0.15, value: 0 }, { at: 0.35, value: 1 }, { at: 0.85, value: 0 }],
        x: [{ at: 0.15, value: -15 }, { at: 0.35, value: 0 }],
      },
    },
    {
      id: "multi-stat-track",
      target: "demo-multi-stat",
      easing: "spring",
      props: {
        opacity: [{ at: 0.3, value: 0 }, { at: 0.5, value: 1 }, { at: 0.85, value: 0 }],
      },
    },
    {
      id: "multi-accent-track",
      target: "demo-multi-shape-accent",
      easing: "spring",
      props: {
        opacity: [{ at: 0.35, value: 0 }, { at: 0.55, value: 1 }, { at: 0.85, value: 0 }],
        scale: [{ at: 0.35, value: 0.5 }, { at: 0.55, value: 1 }, { at: 1, value: 1.2 }],
        rotate: [{ at: 0.35, value: -20 }, { at: 1, value: 15 }],
      },
    },
  ],
};

const ctaScene: ExperienceScene = {
  id: "demo-cta",
  name: "סיום — קריאה לפעולה",
  composition: "flow",
  pinned: false,
  durationVh: 100,
  layers: [],
  tracks: [
    {
      id: "cta-entrance-track",
      target: "demo-cta-block",
      easing: "soft",
      props: {
        opacity: [{ at: 0, value: 0 }, { at: 0.3, value: 1 }],
        y: [{ at: 0, value: 40 }, { at: 0.3, value: 0 }],
      },
    },
  ],
  blockRefs: ["demo-cta-block"],
};

export const scrollExperienceDemoPage: Page = {
  id: "scroll-experience-demo",
  name: "Scroll Experience — הדגמה",
  themeId: "nova-dark",
  meta: {
    title: "Scroll Experience — הדגמת מנוע החוויה של Testim",
    description: "חמש סצנות שמדגימות pinning, keyframes, שכבות freeform וגשר לבלוקים קיימים — הכול מונע מ-JSON.",
  },
  blocks: [
    {
      id: "demo-cta-block",
      type: "cta",
      content: {
        title: "רוצים לבנות חוויית גלילה כזו לדף שלכם?",
        text: "כל מה שראיתם כאן נבנה מתוך הסטודיו הוויזואלי של Testim — בלי שורת קוד.",
        ctaLabel: "לתיאום היכרות עם המערכת",
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
    scenes: [heroScene, typographyScene, mediaScene, multiLayerScene, ctaScene],
  },
};

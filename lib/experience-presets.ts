import { newLayerId, newTrackId, type ExperienceLayer, type ExperienceScene, type ExperienceTrack } from "./experience";

/**
 * Phase 8 — Presets (docs/experience-audit.md §18 Phase 8, §8 במסמך
 * הסופי: "Presets: Cinematic / Editorial / Digital / Luxury / Bold /
 * Experimental"). כל preset הוא scene *התחלתי* אמיתי — לא רק תווית —
 * עם composition/timing/layers/tracks מוכנים, כדי שיש למשתמש משהו
 * לראות ולערוך מיד (אותה פילוסופיה כמו block.defaults ב-registry.ts:
 * בלוק חדש נכנס עם תוכן דוגמה, לא ריק). נבחר ב-Phase 7 מתוך פאנל
 * "הוספת סצנה" (components/studio/experience-scene-list.tsx, Milestone D).
 *
 * שים לב: אלה Partial<ExperienceScene> בכוונה -- id/name/layers/tracks
 * הבסיסיים מתמלאים על ידי ה-caller (newSceneId, מזהי layer/track
 * ייחודיים) כדי שלא יהיו התנגשויות כשאותו preset נוסף כמה פעמים לאותו
 * דף.
 */

export interface ExperiencePreset {
  id: string;
  label: string;
  description: string;
  scene: Partial<ExperienceScene>;
}

/**
 * מתרגם layers/tracks של preset למזהים ייחודיים גלובלית לפני הכנסה
 * לדף (Phase 7, experience-scene-list.tsx). קריטי: ה-TargetRegistry של
 * ה-runtime הוא Map<string, HTMLElement> *אחד* לכל ה-Experience, לא
 * מפוצל לפי scene (components/experience/experience-runtime.ts) --
 * כל ה-presets למעלה חולקים מזהים גנריים כמו "preset-title"/
 * "preset-track" בכוונה (קריאים בקוד המקור), כך שהוספת שני presets
 * (או אותו preset פעמיים) בלי remapping הייתה גורמת לשני layers
 * ב-scenes שונים "להתחרות" על אותו target -- ה-registry היה זוכר רק
 * את האחרון, וה-track של ה-scene הראשון היה מניע את האלמנט הלא נכון.
 * newLayerId/newTrackId כבר עוברים בדיוק את אותה בדיקת התנגשות
 * שבלוק/סצנה/track רגילים עוברים (§9 באודיט) -- לא ממציאים כאן מנגנון
 * שני.
 */
export function instantiatePresetScene(
  preset: Partial<ExperienceScene>,
  existingLayers: ExperienceLayer[],
  existingTracks: ExperienceTrack[]
): { layers: ExperienceLayer[]; tracks: ExperienceTrack[] } {
  const idMap = new Map<string, string>();
  const allLayers = [...existingLayers];
  const layers = (preset.layers ?? []).map((layer) => {
    const id = newLayerId(allLayers, layer.type);
    idMap.set(layer.id, id);
    const cloned = { ...structuredClone(layer), id };
    allLayers.push(cloned);
    return cloned;
  });

  const allTracks = [...existingTracks];
  const tracks = (preset.tracks ?? []).map((track) => {
    const id = newTrackId(allTracks);
    const cloned = { ...structuredClone(track), id, target: idMap.get(track.target) ?? track.target };
    allTracks.push(cloned);
    return cloned;
  });

  return { layers, tracks };
}

/**
 * color ניתן לדריסה (ברירת מחדל "text", הצבע הרגיל על רקע background/
 * surface) כי preset "נועז" יושב על רקע primary מלא -- שם "text" רגיל
 * לא בהכרח קריא, וצריך את onPrimary שמחושב במיוחד לניגודיות על primary
 * (§19 DoD: "preset לא נכשל בניגודיות").
 */
function titleLayer(text: string, y = "50%", color = "text"): ExperienceLayer {
  return {
    id: "preset-title",
    type: "text",
    content: { text, tag: "h2" },
    layout: { mode: "stage", x: "50%", y, width: "min(88vw, 46rem)", anchor: "center", zIndex: "content" },
    style: { color },
  };
}

function fadeUpTrack(target: string, easing: ExperienceTrack["easing"], enterAt = 0.25): ExperienceTrack {
  return {
    id: "preset-track",
    target,
    easing,
    props: {
      opacity: [
        { at: 0, value: 0 },
        { at: enterAt, value: 1 },
        { at: 1 - enterAt, value: 1 },
        { at: 1, value: 0 },
      ],
      y: [
        { at: 0, value: 40 },
        { at: enterAt, value: 0 },
      ],
    },
  };
}

/**
 * Milestone F2 (רף איכות חדש) — fadeUpTrack + חשיפת clip באותו טווח
 * כניסה בדיוק. לא track נוסף על אותו target (§9 באודיט: בעלות יחידה
 * גם בתוך preset יחיד) -- מרכיב על גבי fadeUpTrack הקיים בדיוק כמו
 * typo-track בדמו (Milestone C1, pages-data/scroll-experience-demo.ts).
 */
function fadeUpClipTrack(target: string, easing: ExperienceTrack["easing"], enterAt = 0.25): ExperienceTrack {
  const base = fadeUpTrack(target, easing, enterAt);
  return { ...base, props: { ...base.props, clip: [{ at: 0, value: 0 }, { at: enterAt, value: 1 }] } };
}

/**
 * Milestone F2 (docs/rebuild-workplan.md אבן דרך F2, "מעברים נשלטים...
 * עומק עדין" + docs/reference-experience-analysis.md §4 שורה 4: "שכבות
 * שונות זזות במהירויות/עוצמות שונות... אין helper/preset ייעודי ל'יחס
 * מהירות' (parallax factor) שהמעצב יכול לגרור בלי לחשב keyframes
 * ידנית") — הפרימיטיב שהיה חסר. לא מנוע חדש: רק y track בשני
 * keyframes, שבו ה-caller מציין *יחס מהירות* אחד (factor) במקום שני
 * מספרי px/% ידניים.
 *
 * factor=0: קפוא לגמרי יחסית לסצנה (מרגיש "רקע רחוק", לא זז בכלל תוך
 * כדי הגלילה); factor=1: תזוזה מלאה, זהה ל-travelPercent הבסיסי;
 * factor>1: "מקדים" את קצב הגלילה (מרגיש קרוב/foreground). ערך שלילי
 * הופך כיוון (travel כלפי מטה כש-0<factor הרגיל נע כלפי מעלה).
 * מחזיר track נקי (רק y) -- preset שרוצה גם opacity/scale על אותו
 * layer מרכיב את זה בעצמו על גבי ה-props שמוחזרים כאן (ראו "luxury"
 * למטה), בדיוק כמו שכל שאר ה-track helpers כאן מרכיבים.
 */
export function parallaxTrack(
  target: string,
  factor: number,
  opts: { easing?: ExperienceTrack["easing"]; travelPercent?: number } = {}
): ExperienceTrack {
  const travel = (opts.travelPercent ?? 30) * factor;
  // factor=0 -> travel=0 -> -travel would be -0 (mathematically identical,
  // but a stray "-0" in exported keyframe JSON reads as a bug to anyone
  // inspecting it). +0 normalizes the sign without changing the value.
  const backTravel = travel === 0 ? 0 : -travel;
  return {
    id: "preset-parallax-track",
    target,
    easing: opts.easing ?? "linear",
    props: {
      y: [
        { at: 0, value: travel },
        { at: 1, value: backTravel },
      ],
    },
  };
}

/**
 * Milestone F2 — parallaxTrack + עטיפת opacity/blur קבועה, ל"רקע רחוק"
 * דקורטיבי שנוכח לאורך כל הסצנה בעוצמה נמוכה (לא נכנס/יוצא כמו טקסט).
 * מרכיב על גבי parallaxTrack בדיוק כמו ש-fadeUpClipTrack מרכיב על גבי
 * fadeUpTrack למעלה -- אותו דפוס compose, לא helper שלישי עצמאי.
 */
export function parallaxDepthTrack(
  target: string,
  factor: number,
  opts: { easing?: ExperienceTrack["easing"]; peakOpacity?: number; blurPx?: number } = {}
): ExperienceTrack {
  const base = parallaxTrack(target, factor, { easing: opts.easing });
  const peak = opts.peakOpacity ?? 0.35;
  const blur = opts.blurPx ?? 0;
  return {
    ...base,
    id: "preset-parallax-depth-track",
    props: {
      ...base.props,
      opacity: [{ at: 0, value: 0 }, { at: 0.2, value: peak }, { at: 0.8, value: peak }, { at: 1, value: 0 }],
      ...(blur > 0 ? { blur: [{ at: 0, value: blur }, { at: 1, value: blur }] } : {}),
    },
  };
}

export const EXPERIENCE_PRESETS: ExperiencePreset[] = [
  {
    id: "cinematic",
    label: "קולנועי",
    description: "כותרת גדולה ומוצמדת, נכנסת לאט מתוך חשיכה — למסרים דרמטיים",
    scene: {
      composition: "stage",
      pinned: true,
      // Milestone F2: durationVh רספונסיבי בכל 5 ה-presets המוצמדים (לא
      // "editorial" -- flow לא נעול ל-durationVh בכלל, ראו experience-scene.tsx)
      // -- אותה בחירה שהוכחה בדמו (Milestone E1, multi-layer scene):
      // כוריאוגרפיה פחות עמוסה על מסך צר לא זקוקה לאותו מרחק גלילה.
      durationVh: { base: 260, tablet: 230, mobile: 190 },
      transition: "fade",
      // חשיכה אמיתית: ה-walkthrough (21/08) מדד שהתבנית הבטיחה "מתוך
      // חשיכה" וסיפקה טקסט קטן על רקע בהיר — רקע כהה קבוע + כותרת h1
      // בהירה מקיימים סוף-סוף את ההבטחה של התיאור. ניתן לעריכה מלאה.
      background: { color: "#0B1120" },
      layers: [
        {
          ...titleLayer("כותרת קולנועית", "50%", "#F8FAFC"),
          content: { text: "כותרת קולנועית", tag: "h1" },
        },
      ],
      tracks: [fadeUpTrack("preset-title", "cinematic", 0.3)],
    },
  },
  {
    id: "editorial",
    label: "עיתונאי",
    description: "טקסט זורם, בלי pinning — לתוכן שנקרא ולא רק נצפה",
    scene: {
      composition: "flow",
      pinned: false,
      durationVh: 100,
      transition: "cut",
      background: { color: "surface" },
      layers: [{ ...titleLayer("כותרת עיתונאית", "50%"), layout: { mode: "flow", width: "min(88vw, 46rem)", anchor: "center" } }],
      tracks: [fadeUpTrack("preset-title", "soft", 0.3)],
    },
  },
  {
    id: "digital",
    label: "דיגיטלי",
    description: "כניסה חדה ומהירה, עקומת תנועה טכנית — למוצרי טכנולוגיה",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: { base: 200, tablet: 180, mobile: 150 },
      transition: "fade",
      background: { color: "background" },
      layers: [titleLayer("ממשק. מהיר. מדויק.", "50%")],
      // clip חשיפה מלמטה כלפי מעלה, באותו טווח כניסה (0->0.15) כמו
      // opacity/y -- מחזקת בדיוק את הזהות המוצהרת של ה-preset הזה
      // ("כניסה חדה ומהירה"), לא מתחרה בה.
      tracks: [fadeUpClipTrack("preset-title", "sharp", 0.15)],
    },
  },
  {
    id: "luxury",
    label: "יוקרתי",
    description: "תנועה איטית ורכה, נשימה מרווחת — למותגי פרימיום",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: { base: 320, tablet: 280, mobile: 220 },
      transition: "fade",
      background: { color: "surface" },
      // Milestone F2 (רף איכות חדש, docs/reference-experience-analysis.md
      // §4 "עומק עדין"): שכבת רקע דקורטיבית עם parallaxTrack (factor
      // נמוך = "רקע רחוק") -- ה-preset הזה היה עד כה כותרת בודדת על רקע
      // שטוח, לא ממש מקיים את "נשימה מרווחת/תחושת עומק" שהתיאור שלו
      // מבטיח. עוצמה נמוכה במכוון (opacity שיא 0.35, blur קבוע) -- נשאר
      // "שקט", לא מוסיף רעש דקורטיבי (§0 עקרון 2).
      layers: [
        titleLayer("איכות שמדברת בשקט", "50%"),
        {
          id: "preset-luxury-depth",
          type: "shape",
          content: { shape: "circle" },
          layout: { mode: "stage", x: "50%", y: "55%", width: "55vmax", anchor: "center", zIndex: "background-decoration" },
          style: { background: "accent" },
        },
      ],
      tracks: [
        fadeUpTrack("preset-title", "soft", 0.4),
        parallaxDepthTrack("preset-luxury-depth", 0.25, { easing: "soft", peakOpacity: 0.35, blurPx: 30 }),
      ],
    },
  },
  {
    id: "bold",
    label: "נועז",
    description: "קפיצה עם oomph — קנה מידה ותזוזה מוגזמים בכוונה",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: { base: 200, tablet: 180, mobile: 150 },
      transition: "fade",
      background: { color: "primary" },
      layers: [titleLayer("תפסו את זה עכשיו", "50%", "onPrimary")],
      tracks: [
        {
          id: "preset-track",
          target: "preset-title",
          easing: "spring",
          props: {
            opacity: [{ at: 0.1, value: 0 }, { at: 0.3, value: 1 }, { at: 0.75, value: 1 }, { at: 0.9, value: 0 }],
            scale: [{ at: 0.1, value: 0.6 }, { at: 0.3, value: 1.1 }, { at: 0.4, value: 1 }],
          },
        },
      ],
    },
  },
  {
    id: "experimental",
    label: "ניסיוני",
    description: "כמה שכבות, טשטוש וסיבוב — לחוויות אמנותיות/יצירתיות",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: { base: 220, tablet: 195, mobile: 165 },
      transition: "fade",
      background: { color: "background" },
      layers: [
        titleLayer("פורמט חדש לגמרי", "50%"),
        {
          id: "preset-shape",
          type: "shape",
          content: { shape: "blob" },
          layout: { mode: "stage", x: "50%", y: "50%", width: "40vmax", anchor: "center", zIndex: "background-decoration" },
          style: { background: "accent" },
        },
      ],
      tracks: [
        fadeUpTrack("preset-title", "cinematic", 0.35),
        {
          id: "preset-shape-track",
          target: "preset-shape",
          easing: "linear",
          props: {
            rotate: [{ at: 0, value: 0 }, { at: 1, value: 60 }],
            blur: [{ at: 0, value: 20 }, { at: 0.3, value: 0 }, { at: 0.7, value: 0 }, { at: 1, value: 20 }],
            opacity: [{ at: 0, value: 0.4 }, { at: 0.3, value: 0.85 }, { at: 1, value: 0.3 }],
          },
        },
      ],
    },
  },
];

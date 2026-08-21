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

export const EXPERIENCE_PRESETS: ExperiencePreset[] = [
  {
    id: "cinematic",
    label: "קולנועי",
    description: "כותרת גדולה ומוצמדת, נכנסת לאט מתוך חשיכה — למסרים דרמטיים",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: 260,
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
      durationVh: 200,
      transition: "fade",
      background: { color: "background" },
      layers: [titleLayer("ממשק. מהיר. מדויק.", "50%")],
      tracks: [fadeUpTrack("preset-title", "sharp", 0.15)],
    },
  },
  {
    id: "luxury",
    label: "יוקרתי",
    description: "תנועה איטית ורכה, נשימה מרווחת — למותגי פרימיום",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: 320,
      transition: "fade",
      background: { color: "surface" },
      layers: [titleLayer("איכות שמדברת בשקט", "50%")],
      tracks: [fadeUpTrack("preset-title", "soft", 0.4)],
    },
  },
  {
    id: "bold",
    label: "נועז",
    description: "קפיצה עם oomph — קנה מידה ותזוזה מוגזמים בכוונה",
    scene: {
      composition: "stage",
      pinned: true,
      durationVh: 200,
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
      durationVh: 220,
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

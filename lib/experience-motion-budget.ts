import { PROPERTY_METADATA, type AnimatableProp, type ExperienceConfig, type ExperienceScene } from "./experience";

/**
 * Phase 8 — Motion Budget (docs/experience-audit.md §18 Phase 8, §8
 * במסמך הסופי: "Presets + debug mode + motion budget"). לא cap קשיח —
 * Testim לא חוסמת רינדור (§16: שום דבר לא קורס) — אלא אינדיקטור
 * מחושב אמיתי בסטודיו שעוזר למחבר להבין את עלות ה-scene/experience
 * *לפני* שהוא מפרסם, בהתבסס על PROPERTY_METADATA.performanceClass
 * שכבר קיים (blur="expensive", כל השאר "cheap") — לא ממציא מודל ביצועים
 * שני, רק חושף את מה שכבר מתועד.
 *
 * הנוסחה מכוונת ל"בו-זמנית על המסך", לא סה"כ מצטבר בדף: כמה tracks
 * פעילים באותו רגע (באותה scene) עלולים לכתוב ל-DOM כל פריים, וכמה
 * מהם על מאפיין יקר (blur, שדורש repaint ולא רק compositing). זה
 * בדיוק מה שקובע jank בפועל, לא מספר ה-scenes הכולל בדף.
 */

export type MotionBudgetVerdict = "light" | "moderate" | "heavy";

export interface SceneMotionBudget {
  sceneId: string;
  trackCount: number;
  layerCount: number;
  /** מספר track.prop שהם performanceClass="expensive" (בפועל: blur) */
  expensivePropCount: number;
  verdict: MotionBudgetVerdict;
}

export interface ExperienceMotionBudget {
  scenes: SceneMotionBudget[];
  /** הסצנה הכבדה ביותר -- זו שקובעת את חוויית הגלילה בפועל, לא הממוצע */
  worst: MotionBudgetVerdict;
}

const EXPENSIVE_PROPS = (Object.keys(PROPERTY_METADATA) as AnimatableProp[]).filter(
  (p) => PROPERTY_METADATA[p].performanceClass === "expensive"
);

function verdictFor(trackCount: number, expensivePropCount: number): MotionBudgetVerdict {
  if (expensivePropCount >= 3 || trackCount >= 10) return "heavy";
  if (expensivePropCount >= 1 || trackCount >= 5) return "moderate";
  return "light";
}

export function computeSceneMotionBudget(scene: ExperienceScene): SceneMotionBudget {
  let expensivePropCount = 0;
  for (const track of scene.tracks) {
    for (const prop of EXPENSIVE_PROPS) {
      if (track.props[prop]) expensivePropCount += 1;
    }
  }
  return {
    sceneId: scene.id,
    trackCount: scene.tracks.length,
    layerCount: scene.layers.length,
    expensivePropCount,
    verdict: verdictFor(scene.tracks.length, expensivePropCount),
  };
}

const VERDICT_RANK: Record<MotionBudgetVerdict, number> = { light: 0, moderate: 1, heavy: 2 };

export function computeExperienceMotionBudget(config: ExperienceConfig): ExperienceMotionBudget {
  const scenes = config.scenes.map(computeSceneMotionBudget);
  const worst = scenes.reduce<MotionBudgetVerdict>(
    (acc, s) => (VERDICT_RANK[s.verdict] > VERDICT_RANK[acc] ? s.verdict : acc),
    "light"
  );
  return { scenes, worst };
}

export const MOTION_BUDGET_LABELS: Record<MotionBudgetVerdict, string> = {
  light: "קליל",
  moderate: "בינוני",
  heavy: "כבד",
};

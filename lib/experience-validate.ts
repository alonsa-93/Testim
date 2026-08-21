import { contrastRatio, gradeContrast } from "./contrast";
import {
  INCOMPATIBLE_TARGETS,
  PROPERTY_LABELS,
  type AnimatableProp,
  type ExperienceConfig,
  type ExperienceScene,
} from "./experience";

/**
 * ולידציית Experience — מוצאת התנגשויות בעלות (Track Ownership, §9
 * באודיט) ויעדים לא-תואמים (§9.4), ומחזירה אזהרות **קריאות לאדם**
 * ולא שגיאות סכמה טכניות (§100 במסמך הסופי: "Two animations are
 * controlling the same opacity property on Hero Title." לא
 * "duplicate track ownership on target hero-title prop opacity").
 *
 * שום דבר כאן לא זורק. זה מזין את Studio (אזהרה ליד ה-Track editor,
 * Phase 7) ואת ה-runtime (Phase 2, אזהרת debug) — לא חוסם רינדור.
 */

export interface ExperienceValidationIssue {
  sceneId: string;
  kind: "ownership-conflict" | "incompatible-target" | "low-contrast-color";
  /** הודעה מוכנה לתצוגה בסטודיו, כבר בעברית */
  message: string;
  trackIds: string[];
  target: string;
}

/**
 * Milestone B4 (docs/architecture-decision-gate.md §2.2): בדיקת ניגודיות
 * ל-color tracks, דרך lib/contrast.ts הקיים — בדיוק כמו ContrastPanel
 * בסטודיו, לא מנגנון ניגודיות שני (§19 DoD: "Experience לא מגדיר בדיקת
 * ניגודיות משלו"). backgroundHex כבר פתור (hex סופי) ע"י ה-caller —
 * validate.ts לא תלוי ב-Theme כדי להישאר מפורק (decoupled).
 */
export interface ColorContrastContext {
  backgroundHex: string;
}

/** בודק scene יחיד — לב הלוגיקה. שימושי גם עצמאית (למשל בסטודיו, per-scene) */
export function validateScene(
  scene: ExperienceScene,
  contrastCtx?: ColorContrastContext
): ExperienceValidationIssue[] {
  const issues: ExperienceValidationIssue[] = [];
  const ownership = new Map<string, string[]>(); // "target.prop" -> trackIds[]
  const flaggedIncompatible = new Set<string>(); // target -- מונע כפילות אם כמה tracks פונים לאותו יעד לא-תואם

  for (const track of scene.tracks) {
    if (INCOMPATIBLE_TARGETS.has(track.target) && !flaggedIncompatible.has(track.target)) {
      flaggedIncompatible.add(track.target);
      issues.push({
        sceneId: scene.id,
        kind: "incompatible-target",
        target: track.target,
        trackIds: [track.id],
        message: `היעד "${track.target}" כבר מונפש ברציפות (אנימציית CSS אינסופית) ואינו זמין לשליטה על ידי Experience.`,
      });
    }

    for (const prop of Object.keys(track.props) as AnimatableProp[]) {
      const key = `${track.target}.${prop}`;
      const owners = ownership.get(key) ?? [];
      owners.push(track.id);
      ownership.set(key, owners);
    }

    if (contrastCtx && track.props.color) {
      for (const kf of track.props.color) {
        if (typeof kf.value !== "string") continue;
        const ratio = contrastRatio(kf.value, contrastCtx.backgroundHex);
        if (ratio !== null && gradeContrast(ratio) === "fail") {
          issues.push({
            sceneId: scene.id,
            kind: "low-contrast-color",
            target: track.target,
            trackIds: [track.id],
            message: `צבע ה-track "${track.id}" (${kf.value}) על "${track.target}" לא עומד בניגודיות מול הרקע (${ratio.toFixed(2)}:1, נדרש 4.5:1 לפחות).`,
          });
        }
      }
    }
  }

  for (const [key, trackIds] of ownership) {
    if (trackIds.length <= 1) continue;
    const [target, prop] = key.split(".") as [string, AnimatableProp];
    issues.push({
      sceneId: scene.id,
      kind: "ownership-conflict",
      target,
      trackIds,
      message: `שתי אנימציות שולטות במאפיין "${PROPERTY_LABELS[prop] ?? prop}" על אותו יעד ("${target}").`,
    });
  }

  return issues;
}

/**
 * בודק את כל ה-scenes בקונפיגורציה.
 * שימו לב: `scenes.flatMap(validateScene)` ישיר היה מעביר את ה-index
 * של flatMap כארגומנט שני (contrastCtx!) בטעות -- לכן עטיפה מפורשת.
 */
export function validateExperience(
  config: ExperienceConfig,
  contrastCtx?: ColorContrastContext
): ExperienceValidationIssue[] {
  return config.scenes.flatMap((scene) => validateScene(scene, contrastCtx));
}

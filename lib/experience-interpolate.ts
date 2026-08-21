import { mixHex } from "./contrast";
import {
  EASING_CURVES,
  resolveResponsive,
  type AnimatableProp,
  type EasingId,
  type ExperienceTrack,
  type Keyframe,
  type ResponsiveMode,
} from "./experience";

/**
 * מנוע האינטרפולציה (Phase 3, docs/experience-audit.md §10, §40 במסמך
 * התיקון: "one central implementation... do not duplicate interpolation
 * behavior across layer components"). טהור לגמרי — אין כאן שום DOM,
 * שום React, שום rAF. ה-runtime (Phase 2) הוא זה שקורא לפונקציות כאן
 * בכל פריים וכותב את התוצאה כ-CSS custom property.
 */

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/** מהדק ל-[0,1]; NaN → 0 (אף פעם לא NaN דולף הלאה לתוך חישובי CSS) */
export function normalizeProgress(raw: number): number {
  if (Number.isNaN(raw)) return 0;
  return Math.min(1, Math.max(0, raw));
}

/** אינטרפולציה ליניארית פשוטה — ה-easing מוחל על t *לפני* קריאה לפונקציה הזו */
export function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Easing — מעריך cubic-bezier בזמן ריצה מתוך EASING_CURVES הקיימות, כדי
// שהעקומות (כולל --ds-ease-out-soft/--ds-ease-spring המקוריים) ישמשו
// גם לחישוב ב-JS וגם ל-CSS, בלי הגדרה כפולה (§41 במסמך התיקון).
// ---------------------------------------------------------------------------

function parseCubicBezier(css: string): [number, number, number, number] | null {
  const m = css.match(
    /cubic-bezier\(\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\)/
  );
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}

/** Newton-Raphson: אותה שיטה שדפדפנים משתמשים בה לפתור cubic-bezier() */
function cubicBezierY(x1: number, y1: number, x2: number, y2: number, x: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  let guess = x;
  for (let i = 0; i < 8; i++) {
    const dx = sampleX(guess) - x;
    const d = sampleDerivativeX(guess);
    if (Math.abs(d) < 1e-6) break;
    guess -= dx / d;
  }
  return sampleY(Math.max(0, Math.min(1, guess)));
}

const easingFnCache = new Map<EasingId, (t: number) => number>();

/** מחיל easing נתון על t∈[0,1], מחזיר y∈[0,1] (בערך — עקומות spring יכולות לחרוג מעט מהטווח, זה תקין ומכוון) */
export function ease(t: number, easing: EasingId): number {
  if (easing === "linear") return t;
  let fn = easingFnCache.get(easing);
  if (!fn) {
    const curve = parseCubicBezier(EASING_CURVES[easing]);
    fn = curve ? (x: number) => cubicBezierY(curve[0], curve[1], curve[2], curve[3], x) : (x: number) => x;
    easingFnCache.set(easing, fn);
  }
  return fn(t);
}

// ---------------------------------------------------------------------------
// Keyframes — ENTER → HOLD → EXIT בתוך רשימה אחת (§35 במסמך התיקון)
// ---------------------------------------------------------------------------

/**
 * מעריך רשימת keyframes (חייבת להיות ממוינת לפי `at` — normalizeExperience
 * כבר מבטיח זאת) במיקום progress נתון. לפני ה-keyframe הראשון/אחרי
 * האחרון — הערך נתפס (clamp), לא extrapolation.
 *
 * Milestone B1/B4: ערכי color הם hex (string), לא number — הענף
 * `typeof first.value === "string"` מזהה זאת (בזמן ריצה, לא לפי שם
 * ה-prop, כי הפונקציה הזו טהורה ולא מקבלת prop) ומאנטרפל דרך `mixHex`
 * (lib/contrast.ts, אותו אלגוריתם שכבר גוזר hover/muted/border) במקום
 * `interpolate` המספרי. אם mixHex נכשל (hex לא תקין) — נופל בחינניות
 * ל-`to.value` (לא NaN/undefined שדולף ל-CSS).
 */
export function evaluateKeyframes(
  keyframes: readonly Keyframe[],
  progress: number,
  defaultEasing: EasingId
): number | string | undefined {
  if (keyframes.length === 0) return undefined;
  if (keyframes.length === 1) return keyframes[0].value;

  const p = normalizeProgress(progress);
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (p <= first.at) return first.value;
  if (p >= last.at) return last.value;

  const isColor = typeof first.value === "string";

  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i];
    const to = keyframes[i + 1];
    if (p < from.at || p > to.at) continue;
    const span = to.at - from.at;
    // span=0 (שני keyframes באותו at) -- הערך "קופץ" ל-to ברגע ההוא, לא NaN מחלוקה באפס
    const localT = span > 0 ? (p - from.at) / span : 1;
    const easedT = ease(localT, from.easing ?? defaultEasing);
    if (isColor) {
      return mixHex(String(from.value), String(to.value), easedT) ?? to.value;
    }
    return interpolate(from.value as number, to.value as number, easedT);
  }
  return last.value;
}

// ---------------------------------------------------------------------------
// Track — טווח מקומי בתוך ה-scene + responsive overrides (§5.2, §14 באודיט)
// ---------------------------------------------------------------------------

/** ממיר scene progress לפרוגרס מקומי של ה-track (מכבד track.range אם קיים) */
export function trackLocalProgress(track: ExperienceTrack, sceneProgress: number): number {
  if (!track.range) return normalizeProgress(sceneProgress);
  const [start, end] = track.range;
  const span = end - start;
  if (span <= 0) return normalizeProgress(sceneProgress) >= start ? 1 : 0;
  return normalizeProgress((sceneProgress - start) / span);
}

/**
 * מעריך track שלם במיקום scene progress נתון, עם override responsive
 * אם קיים למצב הנוכחי. מחזיר רק את המאפיינים שה-track הזה בפועל כותב
 * אליהם — ה-caller (runtime, Phase 2) אחראי למזג עם ברירות מחדל
 * (--exp-* fallback ב-CSS כבר עושה את זה, ראו §8 באודיט).
 */
export function evaluateTrack(
  track: ExperienceTrack,
  sceneProgress: number,
  defaultEasing: EasingId,
  mode: ResponsiveMode = "base"
): Partial<Record<AnimatableProp, number | string>> {
  const localProgress = trackLocalProgress(track, sceneProgress);
  const easing = track.easing ?? defaultEasing;
  const result: Partial<Record<AnimatableProp, number | string>> = {};

  for (const prop of Object.keys(track.props) as AnimatableProp[]) {
    const responsiveOverride =
      mode !== "base" ? track.responsive?.[mode]?.[prop] : undefined;
    const keyframes = responsiveOverride ?? track.props[prop];
    if (!keyframes || keyframes.length === 0) continue;
    const value = evaluateKeyframes(keyframes, localProgress, easing);
    if (value !== undefined) result[prop] = value;
  }

  return result;
}

/** קיצור: resolveResponsive מיוצא מחדש מכאן כדי שצרכני ה-runtime לא יצטרכו שני imports */
export { resolveResponsive };

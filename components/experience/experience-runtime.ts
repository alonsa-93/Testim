import { measureRelativeToRoot, type ScrollRoot } from "@/lib/scroll-root";
import { evaluateTrack, normalizeProgress } from "@/lib/experience-interpolate";
import {
  PROPERTY_METADATA,
  type AnimatableProp,
  type ExperienceConfig,
  type ExperienceScene,
  type ResponsiveMode,
  type SceneLifecycleState,
} from "@/lib/experience";

/**
 * ה-Experience Runtime (Phase 2, docs/experience-audit.md §4.2/§44).
 * לא רכיב React — מחלקת TS פשוטה, כדי שכל המצב (registries, rAF handle,
 * subscription) יחיה במקום אחד ויהיה קל לשחזר אחרי remount מלא
 * (replayKey בסטודיו, R14). rAF *יחיד* לכל scope; אפס setState; אפס
 * querySelector בלולאה — כל מדידה עוברת דרך ה-ScrollRoot וה-registries.
 */

// ---------------------------------------------------------------------------
// Target Registry — Map<id, HTMLElement>, אפס DOM lookup בלולאת הפריים
// ---------------------------------------------------------------------------

export class TargetRegistry {
  private map = new Map<string, HTMLElement>();

  register(id: string, el: HTMLElement) {
    this.map.set(id, el);
  }

  unregister(id: string) {
    this.map.delete(id);
  }

  resolve(id: string): HTMLElement | undefined {
    return this.map.get(id);
  }

  has(id: string): boolean {
    return this.map.has(id);
  }
}

// ---------------------------------------------------------------------------
// מדידת scene — הכללה ישירה של הנוסחה שstatement.tsx כבר הוכיחה
// ---------------------------------------------------------------------------

export interface SceneMeasurement {
  /** progress מהודק ל-[0,1] */
  progress: number;
  /** progress גולמי, לא מהודק — שלילי לפני הscene, מעל 1 אחריו */
  rawProgress: number;
  state: SceneLifecycleState;
}

export function measureScene(
  el: HTMLElement,
  scrollRoot: ScrollRoot
): SceneMeasurement {
  const { top, height, viewportSize } = measureRelativeToRoot(el, scrollRoot);
  const total = height - viewportSize;
  // תוכן קצר מהחלון (flow scene עם content יחיד כמו כרטיס CTA, §11): אין
  // "מסלול גלילה" משמעותי לרוץ עליו (total<=0), אז progress נגזר מכניסת
  // האלמנט מלמטה לחלון -- 0 כשה-top עדיין בתחתית ה-viewport, 1 כשהוא
  // הגיע לראשו -- באותה סמנטיקה בדיוק של "top מגיע לראש viewport=1" של
  // המקרה הרגיל, רק שכאן היא הדרגתית ולא קפיצה בינארית. קריטי לסצנה
  // שהיא האחרונה בדף: אין עוד גובה גלילה מתחתיה כדי ש-top יגיע ל-0
  // בפועל (אומת אמפירית: --exp-opacity נשאר תקוע על 0 גם בתחתית הדף
  // המוחלטת), אז חייבים progress הדרגתי שמגיע ל-1 גם בלי "לעבור" את
  // ה-viewport top ממש.
  const rawProgress = total > 0 ? -top / total : viewportSize > 0 ? (viewportSize - top) / viewportSize : top <= 0 ? 1 : 0;
  const progress = normalizeProgress(rawProgress);
  // MVP: 3 מצבים בפועל בלבד (before/active/after) -- ראו §11 באודיט
  const state: SceneLifecycleState = rawProgress < 0 ? "before" : rawProgress > 1 ? "after" : "active";
  return { progress, rawProgress, state };
}

const PROP_CSS_VAR: Record<AnimatableProp, string> = {
  opacity: "--exp-opacity",
  x: "--exp-x",
  y: "--exp-y",
  scale: "--exp-scale",
  rotate: "--exp-rotate",
  blur: "--exp-blur",
};

function formatPropValue(prop: AnimatableProp, value: number): string {
  const unit = PROPERTY_METADATA[prop].unit;
  if (prop === "x" || prop === "y") return `${value}%`;
  return unit ? `${value}${unit}` : String(value);
}

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

interface SceneRegistration {
  scene: ExperienceScene;
  element: HTMLElement;
}

export class ExperienceRuntime {
  readonly targets = new TargetRegistry();

  private config: ExperienceConfig;
  private mode: ResponsiveMode;
  private scrollRoot: ScrollRoot | null = null;
  private scenes = new Map<string, SceneRegistration>();
  private frame: number | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastMeasurements = new Map<string, SceneMeasurement>();

  constructor(config: ExperienceConfig, mode: ResponsiveMode = "base") {
    this.config = config;
    this.mode = mode;
  }

  /** מעדכן קונפיגורציה (למשל אחרי עריכה בסטודיו) בלי להפעיל מחדש את הלולאה */
  updateConfig(config: ExperienceConfig) {
    this.config = config;
  }

  updateMode(mode: ResponsiveMode) {
    this.mode = mode;
  }

  registerScene(sceneId: string, element: HTMLElement) {
    const scene = this.config.scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    this.scenes.set(sceneId, { scene, element });
  }

  unregisterScene(sceneId: string) {
    this.scenes.delete(sceneId);
    this.lastMeasurements.delete(sceneId);
  }

  /** מתחבר ל-ScrollRoot ומתחיל להאזין. לא עושה כלום אם config כבוי. */
  attach(scrollRoot: ScrollRoot) {
    this.scrollRoot = scrollRoot;
    if (!this.config.enabled) return;
    if (this.unsubscribe) return; // כבר רץ
    this.unsubscribe = scrollRoot.subscribe(() => this.requestUpdate());
    this.requestUpdate();
  }

  /** מנתק לגמרי — מבטל מאזין ו-rAF ממתין. בטוח לקרוא כמה פעמים */
  detach() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.scrollRoot = null;
  }

  private requestUpdate() {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.update();
    });
  }

  /** מפעיל מדידה+כתיבה מיידית (לשימוש חיצוני — למשל scrub preview, Phase 7) */
  forceUpdate() {
    this.update();
  }

  private update() {
    if (!this.scrollRoot) return;
    for (const { scene, element } of this.scenes.values()) {
      const measurement = measureScene(element, this.scrollRoot);
      this.lastMeasurements.set(scene.id, measurement);
      // --exp-scene-progress על ה-scene wrapper עצמו -- לא רק לצריכה
      // פנימית: זה הבסיס שמעברי scene (Phase 4, transition="fade")
      // וה-Debug Mode (Phase 8) קוראים ישירות מ-CSS/DOM, בלי עוד כתיבת JS.
      element.style.setProperty("--exp-scene-progress", String(measurement.progress));
      this.applyScene(scene, measurement.progress);
    }
  }

  /**
   * settings.performance="lite" (Phase 11, §19 DoD: "מובייל מבוקר במכוון,
   * לא רק scaled-down") מדלג על כתיבת מאפיינים "יקרים"
   * (PROPERTY_METADATA.performanceClass="expensive", בפועל: blur, שדורש
   * repaint ולא רק compositing) -- לא מוחק את ה-track, רק לא כותב את
   * ה-CSS var שלו, כך שהוא נשאר בברירת המחדל הנייטרלית שלו (blur:0px,
   * §8 CSS). נבדק אמפירית שבלעדי זה "lite" היה preference שמור בלי שום
   * השפעה בפועל -- ה-gap הזה נמצא בביקורת העצמית (docs/experience-final-audit.md)
   * ותוקן, לא רק תועד.
   */
  private applyScene(scene: ExperienceScene, progress: number) {
    const lite = this.config.settings.performance === "lite";
    for (const track of scene.tracks) {
      const target = this.targets.resolve(track.target);
      if (!target) continue; // target חסר -- מדלגים, לא קורסים (§7.3)
      const values = evaluateTrack(track, progress, this.config.settings.defaultEasing, this.mode);
      for (const [prop, value] of Object.entries(values) as [AnimatableProp, number][]) {
        if (lite && PROPERTY_METADATA[prop].performanceClass === "expensive") continue;
        target.style.setProperty(PROP_CSS_VAR[prop], formatPropValue(prop, value));
      }
    }
  }

  getSceneMeasurement(sceneId: string): SceneMeasurement | undefined {
    return this.lastMeasurements.get(sceneId);
  }

  /** לשימוש ב-Debug Mode (Phase 8) ובבדיקות */
  get activeSceneCount(): number {
    return this.scenes.size;
  }

  /**
   * גלילה בפועל למיקום שמייצר progress נתון ב-scene (Phase 7, Timeline
   * scrubber בסטודיו). זו האינברסה המדויקת של measureScene: לא "preview
   * מדומה" נפרד -- גלילה אמיתית של ה-ScrollRoot האמיתי, כדי שאותה
   * צנרת scroll-listener->update() בדיוק שמניעה דף ציבורי תניע גם את
   * התצוגה החיה בסטודיו (0 מסלול preview כפול לתחזק).
   *
   * הנוסחה: measureScene קורא top=rect.top-containerTop *בזמן גלילה
   * נתונה*; אנחנו רוצים למצוא scrollPosition חדש כך שאחרי הגלילה, אותו
   * top ייתן בדיוק את ה-progress המבוקש. מודדים top בפועל *עכשיו* ברגע
   * הקריאה (measureRelativeToRoot), ואז: כל שינוי בגלילה ב-delta מזיז
   * את top ב--delta בדיוק (element.top יורד כשגוללים למטה) -- כך
   * שהיעד הוא scrollPosition הנוכחי + delta.
   */
  scrollToProgress(sceneId: string, progress: number) {
    if (!this.scrollRoot) return;
    const reg = this.scenes.get(sceneId);
    if (!reg) return;
    const clamped = Math.min(1, Math.max(0, progress));
    const { top, height, viewportSize } = measureRelativeToRoot(reg.element, this.scrollRoot);
    const total = height - viewportSize;
    // אותה חלוקת מקרים בדיוק כמו measureScene, הפוכה: פותרים ל-top הרצוי
    // (top שממנו measureScene יחשב בדיוק את clamped), ואז מתרגמים
    // "כמה top צריך לזוז" ל"כמה scrollPosition צריך לזוז" (סימן הפוך --
    // גלילה למטה מקטינה top).
    const desiredTop =
      total > 0 ? -clamped * total : viewportSize > 0 ? viewportSize * (1 - clamped) : 0;
    const delta = top - desiredTop;
    const current = this.scrollRoot.getScrollPosition();
    const target = Math.max(0, current + delta);
    const el = this.scrollRoot.getElement();
    if (el instanceof Window) {
      el.scrollTo({ top: target, behavior: "auto" });
    } else {
      el.scrollTop = target;
    }
  }
}

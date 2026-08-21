"use client";

import { EASING_LABELS, type EasingId, type ExperienceConfig } from "@/lib/experience";
import { validateExperience, type ExperienceValidationIssue } from "@/lib/experience-validate";
import { computeExperienceMotionBudget, MOTION_BUDGET_LABELS } from "@/lib/experience-motion-budget";
import { ChipRow, CheckboxField, PanelSection, SelectField, SliderField } from "@/components/studio/controls";

/**
 * Milestone D3 (עריכה קונטקסטואלית) — תוכן פאנל RIGHT כש**כלום לא נבחר**:
 * הגדרות ברמת ה-Experience כולו + אזהרות ולידציה + עומס תנועה מפורט.
 * מחולץ מ-ExperienceEditor הישן (חלק "הגדרות החוויה") — אותה לוגיקה
 * בדיוק, רק תמיד-פתוח כי זה כל תוכן הפאנל במצב הזה, לא עוד סקשן בין רבים.
 */

type PageUpdater<T> = T | ((prev: T) => T);

const REDUCED_MOTION_OPTIONS: Array<{ value: ExperienceConfig["settings"]["reducedMotion"]; label: string }> = [
  { value: "static", label: "עצירה מלאה (מומלץ)" },
  { value: "opacity-only", label: "רק דהייה, בלי תזוזה" },
];

const PERFORMANCE_OPTIONS: Array<{ value: ExperienceConfig["settings"]["performance"]; label: string }> = [
  { value: "auto", label: "אוטומטי" },
  { value: "high", label: "גבוה" },
  { value: "lite", label: "קליל (מובייל חלש)" },
];

const MOTION_BADGE_CLASS: Record<string, string> = {
  light: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  heavy: "bg-red-100 text-red-800",
};
const MOTION_TEXT_CLASS: Record<string, string> = {
  light: "text-emerald-700",
  moderate: "text-amber-700",
  heavy: "text-red-700",
};

export function ExperienceSettingsPanel({
  config,
  onChange,
}: {
  config: ExperienceConfig;
  onChange: (next: PageUpdater<ExperienceConfig>) => void;
}) {
  const issues: ExperienceValidationIssue[] = validateExperience(config);
  const setSettings = <K extends keyof ExperienceConfig["settings"]>(
    key: K,
    value: ExperienceConfig["settings"][K]
  ) => onChange((c) => ({ ...c, settings: { ...c.settings, [key]: value } }));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-2">
        <h2 className="text-sm font-bold text-slate-900">הגדרות החוויה</h2>
        <p className="mt-1 text-xs text-slate-400">
          כלום לא נבחר בקנבס — הפאנל הזה שולט בהגדרות שחלות על כל החוויה.
        </p>
      </div>

      {issues.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-bold">⚠ {issues.length} אזהרות</p>
          {issues.slice(0, 4).map((issue, i) => (
            <p key={i}>{issue.message}</p>
          ))}
        </div>
      )}

      <PanelSection title="כללי">
        <SliderField
          label="משך ברירת מחדל לסצנה"
          value={config.settings.defaultDurationVh}
          onChange={(v) => setSettings("defaultDurationVh", v)}
          min={100}
          max={400}
          step={20}
          unit="vh"
        />
        <SelectField
          label="עקומת תנועה ברירת מחדל"
          value={config.settings.defaultEasing}
          onChange={(v) => setSettings("defaultEasing", v as EasingId)}
          options={Object.entries(EASING_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <ChipRow
          label="ביצועים"
          value={config.settings.performance}
          onChange={(v) => setSettings("performance", v as ExperienceConfig["settings"]["performance"])}
          options={PERFORMANCE_OPTIONS as Array<{ value: string; label: string }>}
        />
        <SliderField
          label="עוצמת תנועה כללית"
          value={Math.round(config.settings.intensity * 100)}
          onChange={(v) => setSettings("intensity", v / 100)}
          min={0}
          max={100}
          step={5}
          unit="%"
        />
        <SelectField
          label='כשמשתמש מבקש "פחות תנועה"'
          value={config.settings.reducedMotion}
          onChange={(v) => setSettings("reducedMotion", v as ExperienceConfig["settings"]["reducedMotion"])}
          options={REDUCED_MOTION_OPTIONS as Array<{ value: string; label: string }>}
        />
        <p className="text-xs leading-relaxed text-slate-400">
          תמיד מבטל pinning קולנועי — התוכן נשאר גלוי וזורם, פשוט בלי
          ההצמדה. זה חל אוטומטית, לא ניתן לכיבוי.
        </p>
        <CheckboxField
          label="הצגת מסגרות סצנה ומספרי progress בתצוגה החיה"
          checked={config.settings.debug}
          onChange={(v) => setSettings("debug", v)}
        />
      </PanelSection>

      {config.scenes.length > 0 && (
        <PanelSection title="עומס תנועה">
          <MotionBudgetPanel config={config} />
        </PanelSection>
      )}
    </div>
  );
}

/**
 * Phase 8 — Motion Budget (§8 במסמך הסופי): לא cap חוסם, אינדיקטור
 * אמיתי המבוסס על PROPERTY_METADATA.performanceClass הקיים.
 */
function MotionBudgetPanel({ config }: { config: ExperienceConfig }) {
  const budget = computeExperienceMotionBudget(config);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">כלל החוויה</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${MOTION_BADGE_CLASS[budget.worst]}`}>
          {MOTION_BUDGET_LABELS[budget.worst]}
        </span>
      </div>
      <div className="space-y-1">
        {budget.scenes.map((s) => (
          <div key={s.sceneId} className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate" dir="ltr">
              {s.sceneId}
            </span>
            <span>
              {s.trackCount} תנועות
              {s.expensivePropCount > 0 && ` · ${s.expensivePropCount} טשטוש`} ·{" "}
              <span className={MOTION_TEXT_CLASS[s.verdict]}>{MOTION_BUDGET_LABELS[s.verdict]}</span>
            </span>
          </div>
        ))}
      </div>
      {budget.worst !== "light" && (
        <p className="text-xs leading-relaxed text-slate-400">
          שקלו &quot;ביצועים: קליל&quot; למובייל, או צמצום שכבות עם
          טשטוש שפעילות בו-זמנית באותה סצנה.
        </p>
      )}
    </div>
  );
}

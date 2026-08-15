import type { ComponentType, SVGProps } from "react";
import {
  IconBulb,
  IconCheck,
  IconHome,
  IconMail,
  IconMapPin,
  IconPhone,
  IconRuler,
  IconShield,
  IconSofa,
  IconSparkles,
  IconStar,
  IconWrench,
} from "@/components/icons";

/**
 * מדף האייקונים הזמינים לבחירה בסטודיו.
 * המפתח נשמר ב-JSON של הדף, ולכן חייב להישאר יציב.
 */
export const ICONS: Record<
  string,
  { label: string; component: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  ruler: { label: "סרגל / תכנון", component: IconRuler },
  sofa: { label: "ספה / ריהוט", component: IconSofa },
  bulb: { label: "נורה / רעיון", component: IconBulb },
  wrench: { label: "מפתח ברגים / ביצוע", component: IconWrench },
  home: { label: "בית", component: IconHome },
  sparkles: { label: "נצנוץ / חידוש", component: IconSparkles },
  shield: { label: "מגן / אחריות", component: IconShield },
  check: { label: "וי / אישור", component: IconCheck },
  star: { label: "כוכב / דירוג", component: IconStar },
  phone: { label: "טלפון", component: IconPhone },
  mail: { label: "מעטפה", component: IconMail },
  pin: { label: "סיכת מיקום", component: IconMapPin },
};

export type IconId = keyof typeof ICONS;

export function getIcon(id: unknown): ComponentType<SVGProps<SVGSVGElement>> {
  return ICONS[String(id)]?.component ?? IconSparkles;
}

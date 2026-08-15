import type { FontId } from "./theme";

/**
 * חבילות פונטים (Stage C / WORKPLAN 4C, ux-report B4).
 * במקום שני בוררים נפרדים (כותרת + גוף) שמאלצים את המשתמש לגלות
 * לבד אילו צירופים "עובדים", הסטודיו מציג קודם 8 צמדים מוכנים —
 * כל אחד עם "אווירה" מוגדרת (נועז/יוקרתי/אלגנטי/...) ודוגמה חיה.
 * הבוררים הידניים נשארים זמינים תחת "התאמה ידנית" למי שרוצה לשלוט
 * בפונט הכותרת והגוף בנפרד.
 */
export interface FontPair {
  id: string;
  /** התיאור החד-מילתי שמוצג מתחת לכרטיס */
  vibe: string;
  fontHeading: FontId;
  fontBody: FontId;
  /** הקשר קצר לאיזה סוג עסק/מותג הצמד הזה מתאים */
  hint: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: "bold-launch",
    vibe: "נועז",
    fontHeading: "secular-one",
    fontBody: "assistant",
    hint: "השקות, סטארטאפים, מבצעים",
  },
  {
    id: "editorial-authority",
    vibe: "יוקרתי",
    fontHeading: "frank-ruhl-libre",
    fontBody: "heebo",
    hint: "מותגים ותיקים, סמכות מקצועית",
  },
  {
    id: "boutique-elegant",
    vibe: "אלגנטי",
    fontHeading: "frank-ruhl-libre",
    fontBody: "assistant",
    hint: "בוטיק, יופי, אירועים",
  },
  {
    id: "clean-safe",
    vibe: "נקי",
    fontHeading: "heebo",
    fontBody: "heebo",
    hint: "ברירת המחדל הבטוחה — תמיד עובד",
  },
  {
    id: "modern-neutral",
    vibe: "מודרני",
    fontHeading: "rubik",
    fontBody: "noto-sans-hebrew",
    hint: "טכנולוגיה, מוצר, B2B",
  },
  {
    id: "friendly-round",
    vibe: "חברותי",
    fontHeading: "varela-round",
    fontBody: "assistant",
    hint: "ילדים, קהילה, וולנס",
  },
  {
    id: "traditional-classic",
    vibe: "מסורתי",
    fontHeading: "david-libre",
    fontBody: "heebo",
    hint: "יודאיקה, תרבות, מורשת",
  },
  {
    id: "loud-campaign",
    vibe: "קמפיין",
    fontHeading: "secular-one",
    fontBody: "noto-sans-hebrew",
    hint: "אירוע חד-פעמי, קמפיין רועש",
  },
];

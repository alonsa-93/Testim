/** צירוף שמות מחלקות עם סינון ערכים ריקים */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

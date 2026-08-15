import { Section, SectionHeading } from "@/components/ui/section";
import { IconChevronDown } from "@/components/icons";

const faqs = [
  {
    q: "כמה זמן לוקח פרויקט עיצוב מלא?",
    a: "תכנון אורך בדרך כלל 6–10 שבועות, וביצוע 3–5 חודשים, תלוי בהיקף. בפגישת ההיכרות תקבלו לוח זמנים מפורט לפרויקט שלכם — ואנחנו מתחייבים אליו בכתב.",
  },
  {
    q: "אפשר לעבוד איתכם גם עם קבלן שכבר בחרנו?",
    a: "בהחלט. נשמח להכיר אותו, ליישר קו על התוכניות והמפרט, ולפקח על הביצוע כרגיל. אם עוד אין לכם קבלן — נחבר אתכם לקבלנים שאנחנו עובדים איתם שנים.",
  },
  {
    q: "מה קורה אם נחרוג מהתקציב?",
    a: "בונים את התקציב יחד כבר בשלב התכנון, כולל רזרבה ייעודית להפתעות. כל שינוי מתומחר ומאושר על ידכם מראש — כך שאין הפתעות בסוף הדרך.",
  },
  {
    q: "אתם עובדים גם מחוץ למרכז?",
    a: "כן. הסטודיו יושב בתל אביב אבל אנחנו מלווים פרויקטים בכל הארץ. פגישות תכנון אפשר לקיים גם בווידאו, ואת הביקורים בשטח אנחנו מתאמים מראש.",
  },
  {
    q: "האם אתם מטפלים גם בהיתרי בנייה?",
    a: "כשנדרש היתר, אנחנו מכינים את התוכניות ומנהלים את התהליך מול הרשויות יחד עם יועצים מוסמכים, כך שהכול מתקדם במסלול אחד מסודר.",
  },
];

export function Faq() {
  return (
    <Section id="faq" className="bg-surface/60">
      <SectionHeading
        eyebrow="שאלות נפוצות"
        title="כל מה שרציתם לדעת"
        subtitle="לא מצאתם תשובה? השאירו פרטים ונחזור אליכם עוד היום."
      />
      <div className="mx-auto max-w-3xl">
        {faqs.map((f) => (
          <details key={f.q} name="faq" className="group border-b border-line py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <IconChevronDown className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-3 pe-9 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

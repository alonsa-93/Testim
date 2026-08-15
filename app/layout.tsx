import type { Metadata } from "next";
import "./globals.css";
import { themeToStyle } from "@/lib/theme";
import { getDefaultTheme } from "@/themes";

/**
 * כל הפונטים העבריים שהסטודיו מציע נטענים כאן פעם אחת,
 * כדי שהחלפת פונט בערכה תעבוד מיידית בלי טעינה נוספת.
 */
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Assistant:wght@400;500;600;700" +
  "&family=David+Libre:wght@400;500;700" +
  "&family=Frank+Ruhl+Libre:wght@400;500;600;700" +
  "&family=Heebo:wght@400;500;600;700;800" +
  "&family=Noto+Sans+Hebrew:wght@400;500;600;700" +
  "&family=Rubik:wght@400;500;600;700" +
  "&family=Secular+One" +
  "&family=Varela+Round" +
  "&display=swap";

export const metadata: Metadata = {
  title: {
    default: "Testim — מערכת עיצוב לדפי נחיתה",
    template: "%s | Testim",
  },
  description:
    "מערכת עיצוב רב-לקוחית: בלוקים מוכנים לדפי נחיתה, ערכות נושא מתחלפות וסטודיו ויזואלי — בעברית וב-RTL מלא.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // ערכת ברירת המחדל מוזרקת כמשתני CSS על ה-body.
  // דפי preview והסטודיו דורסים אותה מקומית עם ערכה אחרת.
  return (
    <html lang="he" dir="rtl">
      <body style={themeToStyle(getDefaultTheme())}>
        {/* חייב לרוץ ראשון, לפני הידרציה: מסמן שה-JS פעיל, כדי ש-CSS
            יוכל להסתיר מצבי "לפני כניסה" של reveal רק כש-data-js קיים.
            בלי JS (או לפני שהסקריפט רץ) התוכן תמיד גלוי — עוגת הנסיגה. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.js=""`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" precedence="default" href={GOOGLE_FONTS_URL} />
        {children}
      </body>
    </html>
  );
}

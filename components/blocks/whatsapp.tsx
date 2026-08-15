import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface WhatsappContent {
  phone: string;
  message: string;
  label: string;
}

const defaults: WhatsappContent = {
  phone: "050-000-0000",
  message: "היי, הגעתי מדף הנחיתה ואשמח לשמוע פרטים",
  label: "דברו איתנו בוואטסאפ",
};

/** ממיר טלפון ישראלי לפורמט הבינלאומי של wa.me (9725XXXXXXXX) */
function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  return `972${digits.replace(/^0/, "")}`;
}

function Whatsapp({ content }: { content: BlockContent }) {
  const c = { ...defaults, ...content } as WhatsappContent;
  const href = `https://wa.me/${toWaNumber(c.phone)}?text=${encodeURIComponent(
    c.message
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={c.label}
      title={c.label}
      // ירוק וואטסאפ הרשמי — צבע מותג קבוע, במכוון לא טוקן של הערכה
      className="fixed bottom-5 end-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-card transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-7">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.27-1.38a9.87 9.87 0 0 0 4.72 1.2h.01c5.46 0 9.9-4.44 9.9-9.9a9.83 9.83 0 0 0-2.9-7A9.83 9.83 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
      </svg>
    </a>
  );
}

export const whatsappBlock: BlockDef = {
  type: "whatsapp",
  label: "כפתור וואטסאפ צף",
  description: "כפתור ירוק קבוע בפינת המסך שפותח שיחה עם הודעה מוכנה",
  component: Whatsapp,
  defaults: defaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "phone", type: "text", label: "מספר הטלפון", hint: "למשל 050-1234567" },
    {
      key: "message",
      type: "textarea",
      label: "הודעה פותחת",
      hint: "הטקסט שיופיע מוכן מראש אצל הפונה",
    },
    { key: "label", type: "text", label: "תיאור נגישות לכפתור" },
  ],
};

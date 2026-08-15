"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { IconCheck, IconMail, IconMapPin, IconPhone } from "@/components/icons";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface LeadFormContent {
  eyebrow: string;
  title: string;
  text: string;
  phone: string;
  email: string;
  address: string;
  submitLabel: string;
  privacyNote: string;
  successTitle: string;
  successText: string;
}

const defaults: LeadFormContent = {
  eyebrow: "מדברים?",
  title: "הצעד הראשון הוא שיחה אחת",
  text: "השאירו פרטים ונחזור אליכם עד יום העסקים הבא לשיחת היכרות קצרה — בלי התחייבות ובלי לחץ מכירתי.",
  phone: "050-000-0000",
  email: "hello@studio-alon.co.il",
  address: "שדרות רוטשילד 1, תל אביב",
  submitLabel: "שליחה — נחזור אליכם בהקדם",
  privacyNote: "הפרטים ישמשו לחזרה אליכם בלבד ולא יועברו לגורם שלישי.",
  successTitle: "תודה! הפנייה התקבלה",
  successText: "נחזור אליכם עד יום העסקים הבא. בינתיים אפשר להציץ בשאלות הנפוצות.",
};

type FormErrors = Partial<Record<"name" | "phone" | "email", string>>;

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  const name = String(data.get("name") ?? "").trim();
  const phone = String(data.get("phone") ?? "").replace(/[\s-]/g, "");
  const email = String(data.get("email") ?? "").trim();

  if (name.length < 2) errors.name = "נשמח לשם מלא";
  if (!/^0\d{8,9}$/.test(phone))
    errors.phone = "מספר טלפון ישראלי תקין, למשל 050-1234567";
  if (email && !/^\S+@\S+\.\S+$/.test(email))
    errors.email = "כתובת אימייל לא תקינה";
  return errors;
}

function LeadForm({ content }: { content: BlockContent }) {
  const c = { ...defaults, ...content } as LeadFormContent;
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    // שדה פיתיון לבוטים — בני אדם לא רואים ולא ממלאים אותו
    if (String(data.get("company") ?? "") !== "") {
      setSubmitted(true);
      return;
    }

    const nextErrors = validate(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // כאן מחברים שליחה אמיתית: קריאת API, CRM, אימייל או webhook.
    setSubmitted(true);
  }

  return (
    <Section id="contact">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          {c.eyebrow && <Badge>{c.eyebrow}</Badge>}
          <h2 className="mt-3 text-h2 text-ink">{c.title}</h2>
          {c.text && <p className="mt-5 max-w-lg text-lead text-muted">{c.text}</p>}

          <ul className="mt-9 space-y-5">
            {c.phone && (
              <li className="flex items-center gap-3.5">
                <span className="flex size-11 items-center justify-center rounded-field bg-primary/10 text-primary">
                  <IconPhone className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted">טלפון</p>
                  <a
                    href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                    className="font-semibold text-ink hover:text-primary"
                    dir="ltr"
                  >
                    {c.phone}
                  </a>
                </div>
              </li>
            )}
            {c.email && (
              <li className="flex items-center gap-3.5">
                <span className="flex size-11 items-center justify-center rounded-field bg-primary/10 text-primary">
                  <IconMail className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted">אימייל</p>
                  <a
                    href={`mailto:${c.email}`}
                    className="font-semibold text-ink hover:text-primary"
                    dir="ltr"
                  >
                    {c.email}
                  </a>
                </div>
              </li>
            )}
            {c.address && (
              <li className="flex items-center gap-3.5">
                <span className="flex size-11 items-center justify-center rounded-field bg-primary/10 text-primary">
                  <IconMapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted">סטודיו</p>
                  <p className="font-semibold text-ink">{c.address}</p>
                </div>
              </li>
            )}
          </ul>
        </div>

        <Card className="p-6 md:p-9">
          {submitted ? (
            <div
              role="status"
              className="flex h-full min-h-72 flex-col items-center justify-center text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary">
                <IconCheck className="size-7" />
              </span>
              <h3 className="mt-5 text-h3 text-ink">{c.successTitle}</h3>
              <p className="mt-2 max-w-xs text-muted">{c.successText}</p>
              <Button
                variant="ghost"
                className="mt-6"
                onClick={() => setSubmitted(false)}
              >
                שליחת פנייה נוספת
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="lead-name" label="שם מלא" required error={errors.name}>
                  <Input
                    id="lead-name"
                    name="name"
                    autoComplete="name"
                    placeholder="ישראל ישראלי"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "lead-name-error" : undefined}
                  />
                </Field>
                <Field id="lead-phone" label="טלפון" required error={errors.phone}>
                  <Input
                    id="lead-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="050-1234567"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "lead-phone-error" : undefined}
                  />
                </Field>
              </div>
              <Field id="lead-email" label="אימייל" error={errors.email}>
                <Input
                  id="lead-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "lead-email-error" : undefined}
                />
              </Field>
              <Field id="lead-message" label="ספרו לנו על הפרויקט">
                <Textarea
                  id="lead-message"
                  name="message"
                  placeholder="דירת 4 חדרים ברמת גן, מתלבטים בין שיפוץ מלא לחלקי..."
                />
              </Field>

              {/* Honeypot — מוסתר מבני אדם ומקוראי מסך */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="lead-company">חברה</label>
                <input
                  id="lead-company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                {c.submitLabel}
              </Button>
              {c.privacyNote && (
                <p className="text-center text-xs text-muted">{c.privacyNote}</p>
              )}
            </form>
          )}
        </Card>
      </div>
    </Section>
  );
}

export const leadFormBlock: BlockDef = {
  type: "leadForm",
  label: "טופס לידים",
  description: "טופס יצירת קשר עם ולידציה בעברית, לצד פרטי התקשרות",
  component: LeadForm,
  defaults: defaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "eyebrow", type: "text", label: "כותרת-על קטנה" },
    { key: "title", type: "text", label: "כותרת" },
    { key: "text", type: "textarea", label: "משפט הסבר" },
    { key: "phone", type: "text", label: "טלפון" },
    { key: "email", type: "text", label: "אימייל" },
    { key: "address", type: "text", label: "כתובת" },
    { key: "submitLabel", type: "text", label: "כפתור השליחה" },
    { key: "privacyNote", type: "text", label: "הערת פרטיות מתחת לכפתור" },
    { key: "successTitle", type: "text", label: "הודעת הצלחה — כותרת" },
    { key: "successText", type: "textarea", label: "הודעת הצלחה — טקסט" },
  ],
};

"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { IconCheck, IconMail, IconMapPin, IconPhone } from "@/components/icons";
import { Reveal } from "@/components/fx/reveal";
import { resolveBlockAnim, staggerChild } from "@/lib/effects";
import { leadFormDefaults, type LeadFormContent } from "./lead-form.meta";
import type { BlockContent } from "@/lib/fields";
import type { Theme } from "@/lib/theme";

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

/**
 * הקובץ הזה מייצא *רק* את הרכיב — ה-BlockDef חי ב-lead-form.meta.ts
 * הלא-"use client", ומורכב יחד ב-registry.ts. ראו הערה ב-navbar.meta.ts.
 */
export function LeadForm({
  content,
  anchor,
  theme,
}: {
  content: BlockContent;
  anchor?: string;
  theme?: Theme;
}) {
  const c = { ...leadFormDefaults, ...content } as LeadFormContent;
  const anim = resolveBlockAnim(theme?.effects, content);
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
    <Section id={anchor ?? "contact"}>
      <div className="grid gap-14 lg:grid-cols-2">
        <Reveal anim={staggerChild(anim, 0)}>
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
        </Reveal>

        <Reveal anim={staggerChild(anim, 1)}>
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
        </Reveal>
      </div>
    </Section>
  );
}

"use client";

import { useState } from "react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { IconMenu, IconX } from "@/components/icons";
import type { BlockDef } from "@/lib/blocks";
import type { BlockContent } from "@/lib/fields";

interface NavbarContent {
  brand: string;
  links: Array<{ label: string; href: string }>;
  ctaLabel: string;
  ctaHref: string;
}

const defaults: NavbarContent = {
  brand: "סטודיו אלון",
  links: [
    { label: "שירותים", href: "#features" },
    { label: "הגישה שלנו", href: "#about" },
    { label: "לקוחות מספרים", href: "#testimonials" },
    { label: "מסלולים", href: "#pricing" },
    { label: "שאלות נפוצות", href: "#faq" },
  ],
  ctaLabel: "לתיאום ייעוץ",
  ctaHref: "#contact",
};

function Navbar({ content }: { content: BlockContent }) {
  const c = { ...defaults, ...content } as NavbarContent;
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-18">
        <a
          href="#top"
          className="flex items-center gap-2.5 font-heading text-xl font-bold text-ink"
        >
          <span className="size-3 rounded-sm bg-accent" aria-hidden="true" />
          {c.brand}
        </a>

        <nav aria-label="ניווט ראשי" className="hidden items-center gap-7 lg:flex">
          {c.links.map((l, i) => (
            <a
              key={i}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {c.ctaLabel && (
          <div className="hidden lg:block">
            <Button size="sm" href={c.ctaHref}>
              {c.ctaLabel}
            </Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
          className="cursor-pointer rounded-field p-2 text-ink lg:hidden"
        >
          {open ? <IconX className="size-6" /> : <IconMenu className="size-6" />}
        </button>
      </Container>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="ניווט ראשי — מובייל"
          className="border-t border-line bg-bg lg:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {c.links.map((l, i) => (
              <a
                key={i}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-field px-3 py-2.5 font-medium text-ink hover:bg-surface"
              >
                {l.label}
              </a>
            ))}
            {c.ctaLabel && (
              <div className="mt-2 px-3 pb-2">
                <Button
                  href={c.ctaHref}
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {c.ctaLabel}
                </Button>
              </div>
            )}
          </Container>
        </nav>
      )}
    </header>
  );
}

export const navbarBlock: BlockDef = {
  type: "navbar",
  label: "סרגל ניווט עליון",
  description: "לוגו טקסטואלי, קישורי עוגן וכפתור פעולה — נדבק לראש העמוד",
  component: Navbar,
  defaults: defaults as unknown as BlockContent,
  singleton: true,
  fields: [
    { key: "brand", type: "text", label: "שם העסק" },
    {
      key: "links",
      type: "list",
      label: "קישורי ניווט",
      itemLabel: "קישור",
      titleKey: "label",
      fields: [
        { key: "label", type: "text", label: "טקסט" },
        {
          key: "href",
          type: "text",
          label: "יעד",
          hint: "עוגן לסקשן בדף, למשל ‎#pricing",
        },
      ],
    },
    { key: "ctaLabel", type: "text", label: "כפתור — טקסט" },
    { key: "ctaHref", type: "text", label: "כפתור — קישור" },
  ],
};

import type { SVGProps } from "react";

/**
 * אייקוני SVG מוטמעים — בלי תלות בספרייה חיצונית.
 * כולם יורשים צבע מ-currentColor ומסומנים aria-hidden,
 * כי הם דקורטיביים לצד טקסט.
 */

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

export function IconStar(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props} fill="currentColor" stroke="none">
      <path d="M12 2l2.9 6.26 6.6.57-5 4.4 1.5 6.47L12 16.9 5.99 19.7l1.5-6.47-5-4.4 6.6-.57L12 2z" />
    </Icon>
  );
}

export function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
  );
}

export function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </Icon>
  );
}

export function IconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function IconSparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </Icon>
  );
}

export function IconRuler(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10.1a1 1 0 0 0 0-1.4z" />
      <path d="m7.5 10.5 2 2" />
      <path d="m10.5 7.5 2 2" />
      <path d="m13.5 4.5 2 2" />
    </Icon>
  );
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
    </Icon>
  );
}

export function IconSofa(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path d="M2 13a2 2 0 0 1 4 0v1h12v-1a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4z" />
      <path d="M6 19v2" />
      <path d="M18 19v2" />
    </Icon>
  );
}

export function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function IconWrench(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Icon>
  );
}

export function IconBulb(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </Icon>
  );
}

/** חץ "המשך" — מצייר שמאלה, שזה כיוון ההתקדמות ב-RTL */
export function IconArrowNext(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Icon>
  );
}

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Icon>
  );
}

export function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

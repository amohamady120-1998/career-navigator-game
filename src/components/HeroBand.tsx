import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeroBandProps {
  /** Small amber label above the title, e.g. "الفصل الأول · نقطة البداية" */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** CTA buttons or extra content (progress bar, etc.) rendered under the text */
  children?: ReactNode;
  className?: string;
}

/**
 * Navy hero banner (prototype `.hband`): gradient, amber halo, subtle grain.
 * Placed at the top of most screens.
 */
export function HeroBand({ eyebrow, title, description, children, className }: HeroBandProps) {
  return (
    <section className={cn("hero-band", className)}>
      {eyebrow && <div className="mb-2.5 text-sm font-bold text-accent">{eyebrow}</div>}
      <h1 className="mb-2.5 text-[clamp(1.7rem,3.6vw,2.5rem)] font-extrabold leading-[1.16] tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="m-0 max-w-[52ch] text-[1.05rem] leading-[1.75] text-hero-muted">{description}</p>
      )}
      {children && <div className="mt-[22px]">{children}</div>}
    </section>
  );
}

/** Dimmed part of a HeroBand title (prototype `h1 .s`). */
export function HeroBandSubtle({ children }: { children: ReactNode }) {
  return <span className="text-hero-subtle">{children}</span>;
}

/** Amber progress bar sized for the HeroBand (prototype `.map-prog`). */
export function HeroBandProgress({ value, label }: { value: number; label?: ReactNode }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-hero-foreground/15">
        <i
          className="block h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
          }}
        />
      </div>
      <b className="font-extrabold text-hero-foreground">{label ?? `${Math.round(pct)}٪`}</b>
    </div>
  );
}

export default HeroBand;

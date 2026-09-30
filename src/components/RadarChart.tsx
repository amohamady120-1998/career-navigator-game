import { cn } from "@/lib/utils";

export type HollandCode = "R" | "I" | "A" | "S" | "E" | "C";

/** Clockwise from the top, matching the prototype `.radar`. */
export const HOLLAND_ORDER: HollandCode[] = ["R", "I", "A", "S", "E", "C"];

export const HOLLAND_LABELS_AR: Record<HollandCode, string> = {
  R: "الواقعي",
  I: "البحثي",
  A: "الفني",
  S: "الاجتماعي",
  E: "المُبادر",
  C: "التقليدي",
};

interface RadarChartProps {
  /** Scores keyed by Holland code. Missing codes count as 0. */
  values: Partial<Record<HollandCode, number>> | Record<string, number>;
  /** Value that maps to the outer ring. Defaults to the largest value (min 1). */
  max?: number;
  labels?: Partial<Record<HollandCode, string>>;
  /** "light" for cards, "dark" for placement on a HeroBand / navy surface. */
  variant?: "light" | "dark";
  className?: string;
  /** Accessible summary; defaults to a list of the labels with their values. */
  ariaLabel?: string;
}

const C = 200; // centre
const R = 150; // outer radius

function point(i: number, r: number) {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

const ring = (r: number) =>
  HOLLAND_ORDER.map((_, i) => {
    const p = point(i, r);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

/** SVG radar of the six Holland dimensions (prototype `.radar`). */
export function RadarChart({ values, max, labels, variant = "light", className, ariaLabel }: RadarChartProps) {
  const v = values as Record<string, number>;
  const nums = HOLLAND_ORDER.map((c) => Math.max(0, Number(v[c]) || 0));
  const top = max ?? Math.max(1, ...nums);
  const pts = nums.map((n, i) => point(i, (Math.min(n, top) / top) * R));
  const names = { ...HOLLAND_LABELS_AR, ...labels };
  const dark = variant === "dark";

  const summary =
    ariaLabel ?? HOLLAND_ORDER.map((c, i) => `${names[c]}: ${Math.round(nums[i])}`).join("، ");

  return (
    <svg
      viewBox="0 0 400 410"
      role="img"
      aria-label={summary}
      // Physical text anchors: keep "start" pointing right even inside RTL pages.
      direction="ltr"
      className={cn("mx-auto block h-auto w-full max-w-[300px] overflow-visible", className)}
    >
      {[0.5, 1].map((f) => (
        <polygon
          key={f}
          points={ring(R * f)}
          fill="none"
          strokeWidth={1}
          className={dark ? "stroke-hero-foreground/15" : "stroke-border"}
        />
      ))}
      {HOLLAND_ORDER.map((_, i) => {
        const p = point(i, R);
        return (
          <line
            key={i}
            x1={C}
            y1={C}
            x2={p.x}
            y2={p.y}
            strokeWidth={1}
            className={dark ? "stroke-hero-foreground/10" : "stroke-border/70"}
          />
        );
      })}
      <polygon
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        strokeWidth={2.5}
        strokeLinejoin="round"
        className={cn(
          "motion-safe:animate-radar-grow [transform-box:fill-box] [transform-origin:center]",
          dark ? "fill-accent/25 stroke-accent" : "fill-accent/15 stroke-[hsl(var(--gradient-end))]",
        )}
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4.5}
          className={dark ? "fill-accent" : "fill-[hsl(var(--gradient-end))]"}
        />
      ))}
      {HOLLAND_ORDER.map((c, i) => {
        const p = point(i, R + 20);
        const anchor = Math.abs(p.x - C) < 1 ? "middle" : p.x > C ? "start" : "end";
        const dy = i === 0 ? -4 : i === 3 ? 14 : 5;
        return (
          <text
            key={c}
            x={p.x}
            y={p.y + dy}
            textAnchor={anchor}
            className={cn(
              "font-tajawal text-[12px] font-bold",
              dark ? "fill-hero-subtle" : "fill-foreground",
            )}
          >
            {names[c]}
          </text>
        );
      })}
    </svg>
  );
}

export default RadarChart;

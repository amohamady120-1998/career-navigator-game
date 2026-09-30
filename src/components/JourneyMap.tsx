import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type JourneyNodeStatus = "done" | "current" | "locked";

export interface JourneyNode {
  id: string;
  label: string;
  icon: LucideIcon;
  status: JourneyNodeStatus;
}

interface JourneyMapProps {
  nodes: JourneyNode[];
  onSelect?: (node: JourneyNode) => void;
  /** Called when a locked node is clicked (e.g. to show a toast). */
  onLockedSelect?: (node: JourneyNode) => void;
  /** Nodes per row before the path turns. */
  columns?: number;
  hereLabel?: string;
  className?: string;
}

type Pt = { x: number; y: number };

/** Catmull-Rom → cubic Bézier, as in the prototype. */
function smoothPath(p: Pt[]): string {
  if (p.length < 2) return "";
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] || c;
    d += ` C${b.x + (c.x - a.x) / 6} ${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6} ${c.y - (e.y - b.y) / 6} ${c.x} ${c.y}`;
  }
  return d;
}

/**
 * Serpentine journey path (prototype `.serp`): medallions laid out in rows that
 * alternate direction, joined by a curved track filled up to the current stage.
 */
export function JourneyMap({
  nodes,
  onSelect,
  onLockedSelect,
  columns = 3,
  hereLabel = "أنت هنا",
  className,
}: JourneyMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const medRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [geo, setGeo] = useState<{ w: number; h: number; pts: Pt[] }>({ w: 0, h: 0, pts: [] });

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    if (!box.width) return;
    const pts = medRefs.current.slice(0, nodes.length).flatMap((el) => {
      if (!el) return [];
      const r = el.getBoundingClientRect();
      return [{ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }];
    });
    setGeo({ w: wrap.clientWidth, h: wrap.scrollHeight, pts });
  }, [nodes.length]);

  useLayoutEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure, nodes]);

  const currentIdx = nodes.findIndex((n) => n.status === "current");
  const lastDone = nodes.reduce((acc, n, i) => (n.status === "done" ? i : acc), -1);
  const progressEnd = currentIdx >= 0 ? currentIdx : lastDone;

  return (
    <div
      ref={wrapRef}
      className={cn("relative mt-6 grid gap-x-1.5 gap-y-12 px-1.5 pb-4 pt-2", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={geo.w}
        height={geo.h}
        viewBox={`0 0 ${geo.w || 1} ${geo.h || 1}`}
      >
        <path
          d={smoothPath(geo.pts)}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-border"
        />
        {progressEnd > 0 && (
          <path
            d={smoothPath(geo.pts.slice(0, progressEnd + 1))}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-accent"
          />
        )}
      </svg>

      {nodes.map((node, i) => {
        const row = Math.floor(i / columns);
        const pos = i % columns;
        const col = row % 2 === 0 ? pos : columns - 1 - pos;
        const Icon = node.icon;
        const locked = node.status === "locked";
        const current = node.status === "current";
        const done = node.status === "done";

        return (
          <button
            key={node.id}
            type="button"
            onClick={() => (locked ? onLockedSelect?.(node) : onSelect?.(node))}
            aria-disabled={locked}
            aria-current={current ? "step" : undefined}
            aria-label={`${node.label}${done ? " — مكتملة" : locked ? " — مقفلة" : ""}`}
            className="group relative z-[1] flex flex-col items-center gap-2 bg-transparent p-0"
            style={{ gridColumn: col + 1, gridRow: row + 1 }}
          >
            {current && (
              <span className="absolute -top-4 z-[3] whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[0.6rem] font-extrabold text-accent-foreground shadow-glow">
                {hereLabel}
              </span>
            )}
            <span
              ref={(el) => (medRefs.current[i] = el)}
              className={cn(
                "relative grid h-[62px] w-[62px] place-items-center rounded-full border-2 transition-transform duration-150",
                done &&
                  "border-transparent text-[hsl(var(--gradient-end))] [background:linear-gradient(hsl(var(--accent)/0.16),hsl(var(--accent)/0.16)),hsl(var(--card))] group-hover:-translate-y-0.5",
                current &&
                  "scale-[1.08] border-transparent text-accent-foreground shadow-premium-lg btn-gradient group-hover:-translate-y-0.5",
                locked && "border-transparent bg-muted text-muted-foreground/40",
                !done && !current && !locked && "border-border bg-card text-muted-foreground",
              )}
            >
              {done && (
                <span className="absolute -top-[3px] z-[2] grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-success text-success-foreground [inset-inline-start:-3px]">
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
              )}
              <Icon className="h-[26px] w-[26px]" strokeWidth={1.7} />
            </span>
            <span
              className={cn(
                "max-w-[96px] text-center text-xs font-bold leading-tight",
                current ? "text-[hsl(var(--gradient-end))]" : locked ? "text-muted-foreground/60" : "text-foreground",
              )}
            >
              {node.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default JourneyMap;

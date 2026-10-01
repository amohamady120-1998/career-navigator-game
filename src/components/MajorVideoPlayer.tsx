import { useState } from "react";
import { Play } from "lucide-react";
import { toArabicDigits } from "@/lib/athar";

export type VideoSegment = { id: string; title: string; desc: string; duration: string };

/** YouTube embed with minimal branding. */
export const youtubeEmbedUrl = (id: string) =>
  `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;

/**
 * Video player with the current segment's description and the segment list
 * underneath (prototype s9). The current segment is highlighted.
 */
export function MajorVideoPlayer({ segments, className }: { segments: VideoSegment[]; className?: string }) {
  const [active, setActive] = useState(0);
  if (segments.length === 0) return null;
  const current = segments[Math.min(active, segments.length - 1)];

  return (
    <div className={className}>
      <div className="relative mb-4 aspect-video overflow-hidden rounded-[15px] bg-hero-to">
        <iframe
          key={current.id}
          src={youtubeEmbedUrl(current.id)}
          title={current.title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{current.desc}</p>
      <ol>
        {segments.map((seg, i) => {
          const isCurrent = seg.id === current.id;
          return (
            <li key={seg.id} className="border-b border-border/60 last:border-b-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={isCurrent ? "true" : undefined}
                className={`flex w-full items-center gap-[13px] rounded-xl px-2 py-[13px] text-start transition-colors ${
                  isCurrent ? "bg-accent/10" : "hover:bg-muted/60"
                }`}
              >
                <span
                  className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-lg text-[0.78rem] font-extrabold ${
                    isCurrent ? "btn-gradient" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCurrent ? <Play className="h-3 w-3 fill-current" /> : toArabicDigits(i + 1)}
                </span>
                <span className={`flex-1 text-[0.93rem] font-bold ${isCurrent ? "text-foreground" : ""}`}>{seg.title}</span>
                <span className="text-[0.8rem] text-muted-foreground">{seg.duration}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default MajorVideoPlayer;

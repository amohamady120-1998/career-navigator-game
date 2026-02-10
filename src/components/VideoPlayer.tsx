import { useState, useRef } from "react";
import { Play, Pause, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  title: string;
  className?: string;
}

export function VideoPlayer({ src, poster, title, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const hasSource = !!src;

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <p className="text-sm font-bold text-accent mb-2 text-center">{title}</p>
      <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-border bg-muted" style={{ aspectRatio: "16/9" }}>
        {hasSource ? (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              className="w-full h-full object-cover"
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
            />
            <button
              onClick={toggle}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity",
                playing ? "opacity-0 hover:opacity-100" : "opacity-100 bg-black/30"
              )}
              aria-label={playing ? "إيقاف" : "تشغيل"}
            >
              <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-xl">
                {playing ? (
                  <Pause className="w-7 h-7 text-accent-foreground" />
                ) : (
                  <Play className="w-7 h-7 text-accent-foreground mr-[-2px]" />
                )}
              </div>
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/5 gap-3">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Film className="w-8 h-8 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">الفيديو قريباً...</span>
          </div>
        )}
      </div>
    </div>
  );
}

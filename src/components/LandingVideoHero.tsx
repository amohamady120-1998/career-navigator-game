import { useState, useRef, useEffect, memo } from "react";
import { Play, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import landingVideo from "@/assets/landing-explainer.mp4";

const STORAGE_KEY = "athar_explainer_watched";

interface LandingVideoHeroProps {
  onCtaClick: () => void;
}

export const LandingVideoHero = memo(function LandingVideoHero({ onCtaClick }: LandingVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  useEffect(() => {
    if (dismissed) return;
    // Attempt autoplay muted
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [dismissed]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play();
    setPlaying(!playing);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleEnded = () => {
    setPlaying(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (dismissed) return null;

  return (
    <section className="relative w-full px-5 pt-6 pb-2 md:pt-10 md:pb-4">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none rounded-b-3xl" />

      <div className="relative max-w-3xl mx-auto z-10">
        <p className="text-center text-sm font-bold text-accent mb-3">شاهد كيف تعمل رحلتك</p>

        {/* Video container */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-border bg-muted" style={{ aspectRatio: "16/9" }}>
          {!loaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
          )}

          <video
            ref={videoRef}
            src={landingVideo}
            className={cn("w-full h-full object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            onEnded={handleEnded}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            controls
          />

          {/* Play/Pause overlay (only when paused, not using native controls) */}
          {loaded && !playing && (
            <button
              onClick={toggle}
              className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
              aria-label="تشغيل"
            >
              <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-xl">
                <Play className="w-7 h-7 text-accent-foreground mr-[-2px]" />
              </div>
            </button>
          )}

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
            aria-label="تخطي الفيديو"
          >
            <X className="w-3.5 h-3.5" />
            تخطي
          </button>
        </div>

        {/* CTA below video */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={onCtaClick}
            className="btn-gradient h-12 px-8 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            ابدأ الآن
          </Button>
        </div>
      </div>
    </section>
  );
});

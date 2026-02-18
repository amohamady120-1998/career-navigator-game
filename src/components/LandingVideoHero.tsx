import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import videoWelcome from "@/assets/video-welcome.mp4";
import videoHolland from "@/assets/video-holland.mp4";
import videoSimulation from "@/assets/video-simulation.mp4";
import videoReport from "@/assets/video-report.mp4";

const STORAGE_KEY = "athar_explainer_watched";

const CLIPS = [
  { src: videoWelcome, label: "مرحبًا بك في أثر", description: "رحلتك لاكتشاف مسارك تبدأ هنا" },
  { src: videoHolland, label: "مقياس هولند", description: "تحليل علمي لشخصيتك وميولك المهنية" },
  { src: videoSimulation, label: "المحاكاة المهنية", description: "عيش مواقف حقيقية تحاكي سوق العمل" },
  { src: videoReport, label: "التقرير والشهادة", description: "تقرير مفصل وخطة واضحة لمستقبلك" },
] as const;

interface LandingVideoHeroProps {
  onCtaClick: () => void;
}

export const LandingVideoHero = memo(function LandingVideoHero({ onCtaClick }: LandingVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  const clip = CLIPS[current];

  // Autoplay muted on mount
  useEffect(() => {
    if (dismissed) return;
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.load();
      setLoaded(false);
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [current, dismissed]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    // Auto-advance to next clip
    if (current < CLIPS.length - 1) {
      setCurrent((p) => p + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  }, [current]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setPlaying(false);
    setLoaded(false);
  }, []);

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

  if (dismissed) return null;

  return (
    <section className="relative w-full px-5 pt-6 pb-2 md:pt-10 md:pb-4">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none rounded-b-3xl" />

      <div className="relative max-w-3xl mx-auto z-10">
        {/* Clip title + description */}
        <div className="text-center mb-3">
          <p className="text-sm font-bold text-accent">{clip.label}</p>
          <p className="text-xs text-primary-foreground/60 mt-0.5">{clip.description}</p>
        </div>

        {/* Video container */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-border bg-muted" style={{ aspectRatio: "16/9" }}>
          {!loaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
          )}

          <video
            ref={videoRef}
            src={clip.src}
            className={cn("w-full h-full object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            onEnded={handleEnded}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />

          {/* Play overlay */}
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
            className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
            aria-label="تخطي الفيديو"
          >
            <X className="w-3.5 h-3.5" />
            تخطي
          </button>

          {/* Clip counter */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
            {current + 1} / {CLIPS.length}
          </div>

          {/* Prev / Next arrows */}
          {current > 0 && (
            <button
              onClick={() => goTo(current - 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label="السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {current < CLIPS.length - 1 && (
            <button
              onClick={() => goTo(current + 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label="التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {CLIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                i === current ? "bg-accent w-6" : "bg-primary-foreground/20 hover:bg-primary-foreground/40"
              )}
              aria-label={`مقطع ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
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

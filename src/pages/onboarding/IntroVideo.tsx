import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import atharLogoDark from "@/assets/athar-logo-dark.png";
import atharLogoLight from "@/assets/athar-logo-light.png";

type UserRole = "student" | "parent" | "institution";

const WATCH_THRESHOLD = 70; // percent

const ROLE_CONTENT: Record<UserRole, { title: string; subtitle: string; videoSrc: string }> = {
  student: {
    title: "قبل ما نبدأ… خلّينا نفهم القرار ده سوا",
    subtitle: "الفيديو ده هيساعدك تفهم ليه البرنامج معمول، وإزاي هيمشي معاك خطوة خطوة.",
    videoSrc: "", // placeholder — no real video yet
  },
  parent: {
    title: "دورك في رحلة ابنك أهم مما تتخيل",
    subtitle: "الفيديو ده يوضح لك إزاي نساعد ابنك يفهم نفسه، من غير تدخل مباشر في قراره.",
    videoSrc: "",
  },
  institution: {
    title: "أثر البداية: تجربة منظمة وسهلة التطبيق داخل المدارس",
    subtitle: "الفيديو ده يشرح آلية التطبيق، وسهولة المتابعة، والأثر التعليمي المتوقع.",
    videoSrc: "",
  },
};

const INTRO_STEP_ID = "0101d638-a9fd-4100-b24d-9e2c676a79ba";

export default function IntroVideo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [role, setRole] = useState<UserRole>("student");
  const [userId, setUserId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Video state
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [completing, setCompleting] = useState(false);

  const routeToDashboard = useCallback(
    (r?: string) => {
      if (r === "parent") navigate("/parent", { replace: true });
      else if (r === "institution") navigate("/institution", { replace: true });
      else navigate("/dashboard", { replace: true });
    },
    [navigate],
  );

  // Initialise: auth check, role, progress
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const userRole = (profile?.user_type ?? "student") as UserRole;
      setRole(userRole);

      // Already completed? Skip straight to dashboard
      const { data: progress } = await supabase
        .from("user_progress")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("step_id", INTRO_STEP_ID)
        .maybeSingle();

      if (progress?.status === "completed") {
        routeToDashboard(userRole);
        return;
      }

      // Restore saved playback position
      const saved = localStorage.getItem(`intro_time_${session.user.id}`);
      if (saved) {
        const t = parseFloat(saved);
        setMaxWatchedTime(t);
      }

      setPageLoading(false);
    })();
  }, [navigate, routeToDashboard]);

  // Restore currentTime once video is ready
  useEffect(() => {
    if (!videoLoading && videoRef.current && maxWatchedTime > 0 && videoRef.current.currentTime === 0) {
      videoRef.current.currentTime = maxWatchedTime;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoLoading]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;

    const current = v.currentTime;
    // Anti-skip: cap at max + 2s
    if (current > maxWatchedTime + 2) {
      v.currentTime = maxWatchedTime;
      return;
    }

    const newMax = Math.max(maxWatchedTime, current);
    setMaxWatchedTime(newMax);

    // Persist locally
    if (userId) localStorage.setItem(`intro_time_${userId}`, newMax.toString());

    const pct = (newMax / v.duration) * 100;
    setProgressPercent(pct);
    if (pct >= WATCH_THRESHOLD) setIsUnlocked(true);
  }, [maxWatchedTime, userId]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play();
  };

  const handleComplete = async () => {
    if (!isUnlocked || !userId) return;
    setCompleting(true);
    try {
      await supabase.from("user_progress").upsert(
        {
          user_id: userId,
          step_id: INTRO_STEP_ID,
          status: "completed",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,step_id" },
      );
      localStorage.removeItem(`intro_time_${userId}`);
      routeToDashboard(role);
    } catch {
      toast.error("حدث خطأ أثناء حفظ التقدم");
      setCompleting(false);
    }
  };

  const content = ROLE_CONTENT[role];
  const hasVideo = !!content.videoSrc;

  // ─── Loading state ───
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-4 md:px-10 border-b border-border/60">
        <img src={atharLogoDark} alt="أثر البداية" className="h-9 md:h-11 object-contain dark:hidden" />
        <img src={atharLogoLight} alt="أثر البداية" className="h-9 md:h-11 object-contain hidden dark:block" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">الخطوة 1 من الرحلة</span>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-2xl mx-auto w-full gap-8">
        {/* Text */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
            {content.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            {content.subtitle}
          </p>
        </div>

        {/* Video player */}
        <div className="w-full rounded-2xl overflow-hidden border border-border bg-muted relative" style={{ aspectRatio: "16/9" }}>
          {hasVideo ? (
            <>
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              )}
              {videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">تعذر تحميل الفيديو. يرجى التحقق من اتصالك.</p>
                  <Button variant="outline" size="sm" onClick={() => { setVideoError(false); setVideoLoading(true); }}>
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={content.videoSrc}
                    className="w-full h-full object-cover"
                    onLoadedData={() => setVideoLoading(false)}
                    onError={() => setVideoError(true)}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => { setPlaying(false); setIsUnlocked(true); }}
                    playsInline
                    controlsList="nodownload nofullscreen"
                    disablePictureInPicture
                  />
                  {/* Play overlay */}
                  <button
                    onClick={togglePlay}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                      playing ? "opacity-0 hover:opacity-100" : "opacity-100 bg-primary/30"
                    }`}
                    aria-label={playing ? "إيقاف" : "تشغيل"}
                  >
                    <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-xl">
                      {playing ? (
                        <svg className="w-7 h-7 text-accent-foreground" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      ) : (
                        <Play className="w-7 h-7 text-accent-foreground mr-[-2px]" />
                      )}
                    </div>
                  </button>
                </>
              )}
            </>
          ) : (
            /* No video placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">الفيديو قريباً...</span>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsUnlocked(true)}>
                تخطي مؤقتاً
              </Button>
            </div>
          )}
        </div>

        {/* Progress bar + CTA */}
        <div className="w-full space-y-4">
          {hasVideo && (
            <div className="progress-premium">
              <div style={{ width: `${Math.min(progressPercent, 100)}%`, transition: "width 0.3s ease" }} />
            </div>
          )}

          <Button
            onClick={handleComplete}
            disabled={!isUnlocked || completing}
            className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
              isUnlocked ? "btn-gradient shadow-lg hover:shadow-xl" : ""
            }`}
          >
            {completing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : isUnlocked ? (
              "ابدأ الرحلة"
            ) : (
              `يرجى المشاهدة للمتابعة (${Math.round(progressPercent)}%)`
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            مش مطلوب منك أي قرار دلوقتي.
          </p>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Users, Building2, Loader2, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingVideoHero } from "@/components/LandingVideoHero";
import { AtharLogo } from "@/components/AtharLogo";

type UserType = "student" | "parent" | "institution";

const roles: { type: UserType; label: string; icon: typeof GraduationCap; description: string }[] = [
  {
    type: "student",
    label: "طالب",
    icon: GraduationCap,
    description: "افهم ميولك، وابنِ قائمتك من التخصصات الأقرب إليك، وجرّبها قبل القرار.",
  },
  {
    type: "parent",
    label: "وليّ أمر",
    icon: Users,
    description: "تابع تقدّم ابنك ونتيجته وتقريره، وادعمه بثقة دون أن تتدخّل في قراره.",
  },
  {
    type: "institution",
    label: "جهة تعليمية",
    icon: Building2,
    description: "اشتراكات جماعية، ورموز تفعيل للطلاب، وتقارير أثر مجمّعة تقيس نموّ وضوحهم.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  // Restore selection from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("athar_user_type") as UserType | null;
    if (stored && roles.some((r) => r.type === stored)) {
      setSelected(stored);
    }
  }, []);

  // Redirect logged-in users
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile?.user_type === "parent") navigate("/parent", { replace: true });
      else if (profile?.user_type === "institution") navigate("/institution", { replace: true });
      else navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleSelect = (type: UserType) => {
    setSelected(type);
    setShowError(false);
    localStorage.setItem("athar_user_type", type);
  };

  const handleContinue = () => {
    if (!selected) {
      setShowError(true);
      return;
    }
    setLoading(true);
    setTimeout(() => navigate("/auth"), 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir="rtl">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1020px] items-center justify-between px-[22px] py-3.5">
          <AtharLogo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="h-auto rounded-xl px-[18px] py-2.5 text-sm font-bold"
            >
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[1020px] flex-1 px-[22px]">
        {/* ── Hero ── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pb-[52px] pt-[clamp(48px,9vw,92px)] text-center"
        >
          <span className="mb-5 inline-block rounded-full bg-accent/10 px-4 py-2 text-sm font-bold text-[hsl(var(--gradient-end))]">
            مبنيّ على نموذج هولاند العلمي
          </span>
          <h1 className="mb-[18px] text-[clamp(2.3rem,6vw,3.7rem)] font-extrabold leading-[1.12] tracking-tight">
            قبل أن تختار،
            <br />
            اعرف من أنت.
          </h1>
          <p className="mx-auto mb-3 max-w-[44ch] text-[clamp(1.02rem,2vw,1.2rem)] text-muted-foreground">
            مسارٌ قصير ومدروس: تفهم ميولك، وتصل إلى اختيارين أو ثلاثة من التخصصات الأقرب إليك، ثم تجرّبها
            بنفسك قبل أن تقرّر.
          </p>
          <p className="text-sm text-muted-foreground/80">بلا أحكام، ولا إجابات صحيحة أو خاطئة. القرار قرارك.</p>
        </motion.header>

        {/* ── Explainer Video ── */}
        <LandingVideoHero onCtaClick={handleContinue} />

        {/* ── User Type Selection ── */}
        <section className="pt-10">
          <div className="mb-[18px] text-center">
            <h2 className="mb-1.5 text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-tight">من أنت؟</h2>
            <p className="text-muted-foreground">لكلّ طرفٍ مساره في أثر البداية.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selected === role.type;
              return (
                <button
                  key={role.type}
                  onClick={() => handleSelect(role.type)}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col rounded-[20px] border bg-card p-[26px] text-start text-card-foreground transition-all duration-200 hover:-translate-y-[3px] hover:border-accent hover:shadow-premium-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected ? "border-accent ring-2 ring-accent/30" : "border-border"
                  }`}
                >
                  <span className="athar-tile mb-4 h-12 w-12 rounded-[14px]">
                    <Icon className="h-6 w-6" strokeWidth={1.7} />
                  </span>
                  <h3 className="mb-[7px] text-xl font-extrabold">{role.label}</h3>
                  <p className="flex-1 text-[0.94rem] leading-[1.7] text-muted-foreground">{role.description}</p>

                  {/* Selected indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-accent"
                      >
                        <Check className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {showError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-center text-sm font-medium text-destructive"
              >
                يُرجى اختيار نوع الحساب للمتابعة
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* ── Primary CTA ── */}
        <section className="pb-12 pt-6">
          <div className="mx-auto max-w-sm">
            <Button
              onClick={handleContinue}
              disabled={loading}
              className={`h-14 w-full rounded-xl text-lg font-bold transition-all duration-300 ${
                selected
                  ? "btn-gradient shadow-premium hover:shadow-premium-lg"
                  : "cursor-not-allowed bg-muted text-muted-foreground opacity-60"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جارٍ التحميل...
                </>
              ) : (
                <>
                  متابعة
                  <ChevronLeft className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="pb-[60px]">
          <h2 className="mb-[18px] text-center text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-tight">
            كيف تسير الرحلة؟
          </h2>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {[
              { n: "١", t: "نقطة البداية", d: "تتهيّأ وتقيس نقطة انطلاقك." },
              { n: "٢", t: "اعرف نفسك", d: "تكتشف ميولك وترتّب اختياراتك." },
              { n: "٣", t: "جرّب واختبر", d: "تتعمّق وتعيش التخصص." },
              { n: "٤", t: "قرارك وأثرك", d: "تخرج بتقرير وشهادة." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-accent/15 font-extrabold text-[hsl(var(--gradient-end))]">
                  {s.n}
                </div>
                <b className="font-extrabold">{s.t}</b>
                <p className="mt-1 text-sm leading-normal text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Secondary Links ── */}
        <section className="pb-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <button onClick={() => navigate("/auth?next=/dashboard/activate")} className="transition-colors hover:text-foreground hover-underline">
              لديك رمز تفعيل؟
            </button>
            <span className="hidden text-border sm:inline">|</span>
            <button onClick={() => navigate("/auth?next=/dashboard/activate")} className="transition-colors hover:text-foreground hover-underline">
              لديك رابط تفعيل من وليّ الأمر؟
            </button>
            <span className="hidden text-border sm:inline">|</span>
            <button onClick={() => navigate("/contact")} className="transition-colors hover:text-foreground hover-underline">
              تواصل معنا
            </button>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-5 py-6">
        <div className="mx-auto flex max-w-[1020px] flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} أثر البداية بواسطة Uniex. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/privacy")} className="transition-colors hover:text-foreground">سياسة الخصوصية</button>
            <button onClick={() => navigate("/terms")} className="transition-colors hover:text-foreground">الشروط والأحكام</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

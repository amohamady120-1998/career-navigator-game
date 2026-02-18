import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Users, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingVideoHero } from "@/components/LandingVideoHero";
import atharLogoDark from "@/assets/athar-logo-dark.png";

type UserType = "student" | "parent" | "institution";

const roles: { type: UserType; label: string; icon: typeof GraduationCap; description: string }[] = [
  {
    type: "student",
    label: "طالب",
    icon: GraduationCap,
    description: "ابدأ رحلتك واكتشف ميولك والتخصصات المناسبة لك.",
  },
  {
    type: "parent",
    label: "ولي أمر",
    icon: Users,
    description: "تابع تقدم ابنك واطمئن على رحلته بدون تدخل.",
  },
  {
    type: "institution",
    label: "جهة تعليمية",
    icon: Building2,
    description: "اشتراكات جماعية، أكواد للطلاب، وتقارير أثر مجمعة.",
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
    <div className="min-h-screen flex flex-col bg-primary" dir="rtl">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <img src={atharLogoDark} alt="أثر البداية" className="h-10 md:h-12 object-contain" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors hover-underline"
          >
            تسجيل الدخول
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Explainer Video ── */}
      <LandingVideoHero onCtaClick={handleContinue} />

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-4 md:pt-12 md:pb-8 relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto relative z-10"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-primary-foreground leading-tight mb-5">
            اختيار التخصص مش قرار عادي.
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/75 leading-relaxed mb-3 max-w-lg mx-auto">
            أثر البداية يساعدك تفهم نفسك وتوصل إلى 2–3 اختيارات قوية،
            <br className="hidden sm:block" />
            ثم ترتبهم بخطوات واضحة ومحاكاة تفكير حقيقية.
          </p>
          <p className="text-sm text-primary-foreground/45">
            بدون أحكام. بدون إجابات صح أو غلط. القرار في إيدك.
          </p>
        </motion.div>
      </section>

      {/* ── User Type Selection ── */}
      <section className="px-5 pb-4 md:pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.type;
            return (
              <motion.button
                key={role.type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(role.type)}
                className={`
                  relative flex flex-col items-center gap-4 p-6 sm:p-8 rounded-2xl
                  bg-card text-card-foreground border-2 transition-all duration-300
                  cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent
                  shadow-md hover:shadow-xl
                  ${isSelected
                    ? "border-accent ring-2 ring-accent/30 shadow-lg"
                    : "border-transparent hover:border-accent/30"
                  }
                `}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isSelected ? "bg-accent/20 scale-110" : "bg-accent/10"
                  }`}
                >
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-xl font-extrabold">{role.label}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed text-center">{role.description}</p>

                {/* Selected indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 left-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                    >
                      <svg className="w-3.5 h-3.5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
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
              className="text-center text-destructive text-sm mt-3 font-medium"
            >
              يرجى اختيار نوع الحساب للمتابعة
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      {/* ── Primary CTA ── */}
      <section className="px-5 pb-6 md:pb-10 relative z-10">
        <div className="max-w-sm mx-auto">
          <Button
            onClick={handleContinue}
            disabled={loading}
            className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
              selected
                ? "btn-gradient shadow-lg hover:shadow-xl"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جاري التحميل...
              </>
            ) : (
              "متابعة"
            )}
          </Button>
        </div>
      </section>

      {/* ── Secondary Links ── */}
      <section className="px-5 pb-8 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/50">
          <button onClick={() => navigate("/auth?next=/dashboard/activate")} className="hover:text-primary-foreground/80 transition-colors hover-underline">
            لديك كود تفعيل؟
          </button>
          <span className="hidden sm:inline text-primary-foreground/20">|</span>
          <button onClick={() => navigate("/auth?next=/dashboard/activate")} className="hover:text-primary-foreground/80 transition-colors hover-underline">
            لديك رابط تفعيل من ولي الأمر؟
          </button>
          <span className="hidden sm:inline text-primary-foreground/20">|</span>
          <button onClick={() => navigate("/contact")} className="hover:text-primary-foreground/80 transition-colors hover-underline">
            تواصل معنا
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 px-5 border-t border-primary-foreground/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
          <p className="text-primary-foreground/35 text-xs">
            © {new Date().getFullYear()} أثر البداية بواسطة Uniex. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4 text-xs text-primary-foreground/35">
            <button onClick={() => navigate("/privacy")} className="hover:text-primary-foreground/60 transition-colors">سياسة الخصوصية</button>
            <button onClick={() => navigate("/terms")} className="hover:text-primary-foreground/60 transition-colors">الشروط والأحكام</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

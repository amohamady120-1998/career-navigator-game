import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import atharLogoDark from "@/assets/athar-logo-dark.png";
import { GraduationCap, Users, Building2, ClipboardList, FlaskConical, FileText, Award, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";

type UserType = "student" | "parent" | "institution";

const roles: { type: UserType; label: string; icon: typeof GraduationCap; description: string }[] = [
  {
    type: "student",
    label: "طالب",
    icon: GraduationCap,
    description: "اكتشف ميولك واختر تخصصك الجامعي بثقة",
  },
  {
    type: "parent",
    label: "ولي أمر",
    icon: Users,
    description: "ساعد ابنك في اتخاذ القرار الأنسب لمستقبله",
  },
  {
    type: "institution",
    label: "مؤسسة تعليمية",
    icon: Building2,
    description: "قدّم لطلابك أدوات التوجيه المهني الذكية",
  },
];

const steps = [
  { icon: ClipboardList, title: "استبيان الميول", desc: "أجب على أسئلة مصممة علميًا لاكتشاف نمطك المهني" },
  { icon: FlaskConical, title: "محاكاة التخصصات", desc: "عش تجربة واقعية لأبرز التخصصات الجامعية" },
  { icon: FileText, title: "التقرير التفصيلي", desc: "احصل على تحليل شامل لميولك وتوصيات مخصصة" },
  { icon: Award, title: "الشهادة", desc: "احصل على شهادة إتمام رحلة أثر البداية" },
];

const faqs = [
  { q: "هل المنصة مجانية؟", a: "نعم، المنصة مجانية بالكامل للطلاب وأولياء الأمور." },
  { q: "ما هو اختبار هولاند؟", a: "هو اختبار علمي معتمد عالميًا يساعدك في اكتشاف ميولك المهنية بناءً على 6 أنماط شخصية (RIASEC)." },
  { q: "كم يستغرق إكمال الرحلة؟", a: "تستغرق الرحلة الكاملة من 30 إلى 45 دقيقة تقريبًا." },
  { q: "هل يمكن لولي الأمر متابعة نتائج ابنه؟", a: "نعم، يمكن لولي الأمر ربط حسابه بحساب الطالب ومتابعة التقدم والنتائج." },
  { q: "هل المنصة متاحة للمؤسسات التعليمية؟", a: "نعم، توفر المنصة لوحة تحكم خاصة بالمؤسسات لمتابعة طلابها وتحليل بياناتهم." },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserType | null>(null);

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
    localStorage.setItem("athar_user_type", type);
    setTimeout(() => navigate("/auth"), 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary" dir="rtl">
      {/* Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Decorative blurred circles */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center relative z-10"
        >
          <motion.img
            src={atharLogoDark}
            alt="أثر البداية"
            className="h-28 mx-auto mb-6 object-contain drop-shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-4 leading-tight">
            اكتشف مسارك المهني
            <span className="block text-gradient mt-1">بثقة وعلم</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-xl mx-auto leading-relaxed">
            منصة ذكية مبنية على أسس علمية تساعدك في اختيار التخصص الجامعي المناسب لميولك وقدراتك
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-12"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-primary-foreground/40" />
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-card py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-extrabold text-foreground mb-3">كيف تعمل المنصة؟</h2>
          <div className="section-divider mb-4" />
          <p className="text-muted-foreground text-lg">أربع خطوات بسيطة نحو اكتشاف مستقبلك</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center gap-4 p-6 rounded-xl hover:bg-secondary/50 transition-colors duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center icon-circle">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Get Started - Role Cards */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center mb-12 relative z-10">
          <h2 className="text-3xl font-extrabold text-primary-foreground mb-3">ابدأ رحلتك الآن</h2>
          <div className="section-divider mb-4" />
          <p className="text-primary-foreground/70 text-lg">اختر دورك للمتابعة</p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.type;
            return (
              <motion.button
                key={role.type}
                variants={item}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(role.type)}
                className={`
                  relative flex flex-col items-center gap-5 p-8 rounded-2xl
                  bg-card text-card-foreground border-2 transition-all duration-300
                  cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent
                  shadow-lg hover:shadow-premium-lg
                  ${isSelected ? "border-accent shadow-glow" : "border-transparent hover:border-accent/40"}
                `}
              >
                <div className={`w-18 h-18 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isSelected ? "bg-accent/20 scale-110" : "bg-accent/10"
                }`}
                  style={{ width: '4.5rem', height: '4.5rem' }}
                >
                  <Icon className={`w-9 h-9 transition-colors duration-300 ${isSelected ? "text-accent" : "text-accent"}`} />
                </div>
                <h2 className="text-2xl font-extrabold">{role.label}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{role.description}</p>
                <span className={`text-xs font-bold transition-all duration-300 ${
                  isSelected ? "text-accent" : "text-muted-foreground/0 group-hover:text-accent"
                }`}>
                  ابدأ الآن ←
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="bg-card py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground text-center mb-3">الأسئلة الشائعة</h2>
          <div className="section-divider mb-10" />
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-xl border border-border/60 px-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <AccordionTrigger className="text-right font-semibold text-base py-5">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 text-center border-t border-primary-foreground/10">
        <p className="text-primary-foreground/40 text-sm">© {new Date().getFullYear()} أثر البداية. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default Index;

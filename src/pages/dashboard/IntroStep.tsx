import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseVideo } from "@/components/CourseVideo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function IntroStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "intro")
        .single();

      if (step) {
        await supabase.from("user_progress").upsert({
          user_id: session.user.id,
          step_id: step.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,step_id" });
      }

      await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

      navigate("/dashboard/pre-impact");
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto text-center py-12"
    >
      <motion.div
        className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      >
        <Rocket className="w-10 h-10 text-accent" />
      </motion.div>
      <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
        مرحباً بك في رحلة
        <span className="text-gradient block mt-1">أثر البداية</span>
      </h2>
      <p className="text-lg text-muted-foreground leading-loose mb-8 max-w-lg mx-auto">
        ستمرّ خلال هذه الرحلة بعدة مراحل مصمّمة بعناية لمساعدتك على اكتشاف ميولك المهنية وتحديد
        التخصص الجامعي الأنسب لشخصيتك. كل مرحلة ستُفتح تلقائياً بعد إكمال المرحلة السابقة.
      </p>
      <CourseVideo
        title="مرحباً بك في أثر.. لماذا نحتار في اختيار التخصص؟"
        description="شاهد هذا المقطع التمهيدي قبل أن تبدأ رحلتك لاكتشاف ذاتك."
        videoUrl=""
        className="mb-8"
      />
      <Button
        onClick={handleStart}
        disabled={loading}
        className="btn-gradient text-lg px-12 h-13 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300"
        style={{ height: '3.25rem' }}
      >
        {loading ? "جاري البدء..." : "ابدأ الرحلة 🚀"}
      </Button>
    </motion.div>
  );
}

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

      // Get the intro step ID
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

      await queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
      await queryClient.invalidateQueries({ queryKey: ["step-guard-progress"] });
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
      className="max-w-2xl mx-auto text-center py-12"
    >
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
        <Rocket className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-3xl font-bold mb-4">مرحباً بك في رحلة أثر البداية</h2>
      <p className="text-lg text-muted-foreground leading-loose mb-8">
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
        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-10 h-12"
      >
        {loading ? "جاري البدء..." : "ابدأ الرحلة 🚀"}
      </Button>
    </motion.div>
  );
}

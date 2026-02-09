import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuestionWizard } from "@/components/QuestionWizard";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export default function PostImpactStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", "post_impact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("category", "post_impact")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const handleComplete = async (answers: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const inserts = Object.entries(answers).map(([question_id, answer_value]) => ({
      user_id: session.user.id,
      question_id,
      answer_value,
    }));

    const { error } = await supabase.from("answers").upsert(inserts, { onConflict: "user_id,question_id" });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }

    // Mark step as completed
    const { data: step } = await supabase
      .from("journey_steps")
      .select("id")
      .eq("slug", "post-impact")
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
    toast({ title: "تم الحفظ ✓", description: "تم حفظ إجاباتك بنجاح" });
    setCompleted(true);
    setTimeout(() => navigate("/dashboard/report"), 1500);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">جاري التحميل...</div>;
  }

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">تم إكمال قياس الأثر البعدي!</h2>
        <p className="text-muted-foreground mt-2">جاري الانتقال للتقرير النهائي...</p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">قياس الأثر البعدي</h2>
        <p className="text-muted-foreground">أجب عن الأسئلة التالية لقياس مدى تأثير التجربة على رؤيتك المهنية</p>
      </div>
      {questions && questions.length > 0 && (
        <QuestionWizard questions={questions} onComplete={handleComplete} batchSize={6} />
      )}
    </div>
  );
}

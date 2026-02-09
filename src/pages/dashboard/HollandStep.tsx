import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuestionWizard } from "@/components/QuestionWizard";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

export default function HollandStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completed, setCompleted] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", "holland"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("category", "holland")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const handleComplete = async (answers: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Save all answers
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

    // Calculate scores via DB function
    const { data: scores } = await supabase.rpc("calculate_holland_scores", { _user_id: session.user.id });
    const { data: topCode } = await supabase.rpc("get_holland_code", { _user_id: session.user.id });

    // Save results
    await supabase.from("holland_results").upsert({
      user_id: session.user.id,
      scores: scores || {},
      top_code: topCode || "",
    }, { onConflict: "user_id" });

    toast({ title: "تم الحفظ ✓", description: "تم حساب نتائجك بنجاح" });
    setCompleted(true);
    setTimeout(() => navigate("/dashboard/simulation"), 1500);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">جاري التحميل...</div>;
  }

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">تم إكمال اختبار هولاند!</h2>
        <p className="text-muted-foreground mt-2">جاري الانتقال للمحاكاة المهنية...</p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">اختبار هولاند للميول المهنية</h2>
        <p className="text-muted-foreground">أجب بـ "نعم" أو "لا" على كل سؤال — 42 سؤالاً في 7 مجموعات</p>
      </div>
      {questions && questions.length > 0 && (
        <QuestionWizard questions={questions} onComplete={handleComplete} batchSize={6} />
      )}
    </div>
  );
}

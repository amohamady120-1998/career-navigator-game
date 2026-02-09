import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Clock, AlertTriangle } from "lucide-react";

interface SimOption {
  id: string;
  text: string;
  ai_tag: string;
}

export default function SimulationStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["simulation-scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulation_scenarios")
        .select("*")
        .order("major_id")
        .order("level");
      if (error) throw error;
      return data;
    },
  });

  const current = scenarios?.[currentIdx];
  const isStress = current?.level === "stress";
  const options: SimOption[] = (current?.options_json as unknown as SimOption[]) || [];

  // Timer for stress levels
  useEffect(() => {
    if (!isStress || !current?.timer_seconds) return;
    setTimeLeft(current.timer_seconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIdx, isStress, current?.timer_seconds]);

  const handleSubmit = useCallback(async () => {
    if (!selectedOption || !current) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("simulation_responses").upsert({
      user_id: session.user.id,
      scenario_id: current.id,
      selected_option_id: selectedOption,
      rationale_text: isStress ? rationale : null,
    }, { onConflict: "user_id,scenario_id" });

    toast({ title: "تم الحفظ ✓" });

    if (scenarios && currentIdx < scenarios.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setRationale("");
      setTimeLeft(null);
    } else {
      setCompleted(true);
      setTimeout(() => navigate("/dashboard/report"), 1500);
    }
  }, [selectedOption, current, currentIdx, scenarios, isStress, rationale, navigate, toast]);

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && selectedOption) {
      handleSubmit();
    }
  }, [timeLeft, selectedOption, handleSubmit]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">جاري التحميل...</div>;
  }

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">تم إكمال المحاكاة المهنية!</h2>
        <p className="text-muted-foreground mt-2">جاري تحضير تقريرك النهائي...</p>
      </motion.div>
    );
  }

  if (!current) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">المحاكاة المهنية</h2>
        <p className="text-muted-foreground">
          السيناريو {currentIdx + 1} من {scenarios?.length || 0}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Timer for stress */}
          {isStress && timeLeft !== null && (
            <div className={`flex items-center justify-center gap-3 p-4 rounded-lg ${timeLeft <= 15 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
              <AlertTriangle className="w-5 h-5" />
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold font-mono">{timeLeft}s</span>
              <span className="text-sm">مستوى الضغط — أجب بسرعة!</span>
            </div>
          )}

          {/* Scenario text */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                {current.major_id}
              </span>
              <span>المستوى: {current.level}</span>
            </div>
            <p className="text-xl font-medium leading-loose">{current.text_ar}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`
                  w-full text-right p-5 rounded-lg border-2 transition-all
                  ${selectedOption === opt.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/40"
                  }
                `}
              >
                <span className="font-bold text-accent ml-2">{opt.id}.</span>
                {opt.text}
              </button>
            ))}
          </div>

          {/* Rationale for stress level */}
          {isStress && (
            <div>
              <label className="block text-sm font-medium mb-2">اكتب مبررك للإجابة:</label>
              <Textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="لماذا اخترت هذا الخيار؟"
                rows={3}
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedOption || (isStress && !rationale.trim())}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-12 text-lg"
          >
            {currentIdx === (scenarios?.length || 0) - 1 ? "إنهاء المحاكاة" : "التالي"}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2, Clock, AlertTriangle, ArrowRight, CheckCircle2, FileText,
  Stethoscope, SmilePlus, Pill, Wrench, Building, Factory,
  Scale, Briefcase, TrendingUp, Users, Languages, Radio, Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SimOption {
  id: string;
  text: string;
  ai_tag: string;
}

const MAJOR_META: Record<string, { name: string; icon: LucideIcon }> = {
  MED_001:   { name: "طب بشري",          icon: Stethoscope },
  DENT_001:  { name: "طب الأسنان",       icon: SmilePlus },
  PHARM_001: { name: "الصيدلة",          icon: Pill },
  ENG_001:   { name: "الهندسة",          icon: Wrench },
  CIVIL_001: { name: "الهندسة المدنية",  icon: Building },
  IND_001:   { name: "الهندسة الصناعية", icon: Factory },
  LAW_001:   { name: "القانون",          icon: Scale },
  BUS_001:   { name: "إدارة الأعمال",    icon: Briefcase },
  FIN_001:   { name: "المالية",          icon: TrendingUp },
  HR_001:    { name: "الموارد البشرية",  icon: Users },
  TRANS_001: { name: "الترجمة",          icon: Languages },
  MEDIA_001: { name: "الإعلام",          icon: Radio },
  ART_001:   { name: "التصميم",          icon: Palette },
};

export default function SimulationStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [completedMajors, setCompletedMajors] = useState<Set<string>>(new Set());
  const [majorDone, setMajorDone] = useState(false);

  // Fetch all scenarios once
  const { data: allScenarios, isLoading } = useQuery({
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

  // Build library data from scenarios
  const majorsInDb = allScenarios
    ? [...new Set(allScenarios.map((s) => s.major_id))]
    : [];

  const majorCounts: Record<string, number> = {};
  allScenarios?.forEach((s) => {
    majorCounts[s.major_id] = (majorCounts[s.major_id] || 0) + 1;
  });

  // Filtered scenarios for selected major
  const scenarios = selectedMajor
    ? allScenarios?.filter((s) => s.major_id === selectedMajor)
    : [];

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
    if (!selectedOption || !current || !selectedMajor) return;
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
      // Major completed — go back to library
      setCompletedMajors((prev) => new Set(prev).add(selectedMajor));
      setMajorDone(true);
      setTimeout(() => {
        setSelectedMajor(null);
        setCurrentIdx(0);
        setSelectedOption(null);
        setRationale("");
        setTimeLeft(null);
        setMajorDone(false);
      }, 1800);
    }
  }, [selectedOption, current, currentIdx, scenarios, isStress, rationale, selectedMajor, toast]);

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && selectedOption) {
      handleSubmit();
    }
  }, [timeLeft, selectedOption, handleSubmit]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">جاري التحميل...</div>;
  }

  // --- Major completion splash ---
  if (majorDone) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">تم إكمال التخصص!</h2>
        <p className="text-muted-foreground mt-2">جاري العودة إلى المكتبة...</p>
      </motion.div>
    );
  }

  // --- LIBRARY VIEW ---
  if (!selectedMajor) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">مكتبة المحاكاة المهنية</h2>
          <p className="text-muted-foreground">اختر التخصص الذي تريد محاكاته</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {majorsInDb.map((majorId) => {
            const meta = MAJOR_META[majorId];
            const Icon = meta?.icon || Gamepad2;
            const name = meta?.name || majorId;
            const count = majorCounts[majorId] || 0;
            const isDone = completedMajors.has(majorId);

            return (
              <motion.div key={majorId} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    isDone ? "border-success/50 bg-success/5" : "border-border hover:border-accent/40"
                  }`}
                  onClick={() => {
                    setSelectedMajor(majorId);
                    setCurrentIdx(0);
                    setSelectedOption(null);
                    setRationale("");
                    setTimeLeft(null);
                  }}
                >
                  <CardContent className="p-5 text-center space-y-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                      isDone ? "bg-success/10" : "bg-accent/10"
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <Icon className="w-6 h-6 text-accent" />
                      )}
                    </div>
                    <h3 className="font-bold text-sm">{name}</h3>
                    <p className="text-xs text-muted-foreground">{count} سيناريو</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {completedMajors.size > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              أكملت {completedMajors.size} من {majorsInDb.length} تخصص
            </p>
            <Button
              onClick={() => navigate("/dashboard/report")}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            >
              <FileText className="w-4 h-4 ml-2" />
              عرض التقرير النهائي
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- SCENARIO VIEW ---
  if (!current) return null;

  const majorMeta = MAJOR_META[selectedMajor];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold mb-1">{majorMeta?.name || selectedMajor}</h2>
          <p className="text-muted-foreground text-sm">
            السيناريو {currentIdx + 1} من {scenarios?.length || 0}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedMajor(null);
            setCurrentIdx(0);
            setSelectedOption(null);
            setRationale("");
            setTimeLeft(null);
          }}
          className="text-muted-foreground"
        >
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة
        </Button>
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
                {majorMeta?.name || selectedMajor}
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
            {scenarios && currentIdx === scenarios.length - 1 ? "إنهاء التخصص" : "التالي"}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

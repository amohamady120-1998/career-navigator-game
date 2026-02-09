import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2, Clock, AlertTriangle, ArrowRight, CheckCircle2, FileText,
  Stethoscope, SmilePlus, Pill, Cpu, Building, Factory, Landmark,
  Scale, Briefcase, TrendingUp, Users, Languages, Radio, Palette,
  Shield, BrainCircuit, Megaphone, Heart, PenTool, Save,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SimOption {
  id: string;
  text: string;
  ai_tag: string;
}

const MAJOR_META: Record<string, { name: string; icon: LucideIcon }> = {
  MED_001:   { name: "الطب والجراحة",          icon: Stethoscope },
  DENT_001:  { name: "طب الأسنان",             icon: SmilePlus },
  PHARM_001: { name: "الصيدلة",                icon: Pill },
  ENG_001:   { name: "هندسة البرمجيات",        icon: Cpu },
  CIVIL_001: { name: "الهندسة المدنية",        icon: Building },
  IND_001:   { name: "الهندسة الصناعية",       icon: Factory },
  ARCH_001:  { name: "الهندسة المعمارية",      icon: Landmark },
  CYBER_001: { name: "الأمن السيبراني",        icon: Shield },
  AI_001:    { name: "الذكاء الاصطناعي",       icon: BrainCircuit },
  LAW_001:   { name: "القانون والمحاماة",      icon: Scale },
  BUS_001:   { name: "إدارة الأعمال",          icon: Briefcase },
  FIN_001:   { name: "المالية والاستثمار",     icon: TrendingUp },
  HR_001:    { name: "الموارد البشرية",        icon: Users },
  MKT_001:   { name: "التسويق الرقمي",        icon: Megaphone },
  MEDIA_001: { name: "الإعلام والعلاقات العامة", icon: Radio },
  PSY_001:   { name: "علم النفس",              icon: Heart },
  TRANS_001: { name: "الترجمة واللغات",        icon: Languages },
  ART_001:   { name: "التصميم الجرافيكي",     icon: PenTool },
};

const MIN_RATIONALE_LENGTH = 20;

export default function SimulationStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [completedMajors, setCompletedMajors] = useState<Set<string>>(new Set());
  const [majorDone, setMajorDone] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // beforeunload guard
  useEffect(() => {
    if (!selectedMajor) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [selectedMajor]);

  // Fetch all scenarios
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

  // Fetch completed majors from DB
  const { data: existingResponses } = useQuery({
    queryKey: ["simulation-responses-completed"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from("simulation_responses")
        .select("scenario_id")
        .eq("user_id", session.user.id);
      if (error) throw error;
      return data;
    },
  });

  // Determine which majors are fully completed
  useEffect(() => {
    if (!allScenarios || !existingResponses) return;
    const respondedIds = new Set(existingResponses.map((r) => r.scenario_id));
    const majorScenarios: Record<string, string[]> = {};
    allScenarios.forEach((s) => {
      if (!majorScenarios[s.major_id]) majorScenarios[s.major_id] = [];
      majorScenarios[s.major_id].push(s.id);
    });
    const done = new Set<string>();
    for (const [majorId, ids] of Object.entries(majorScenarios)) {
      if (ids.every((id) => respondedIds.has(id))) {
        done.add(majorId);
      }
    }
    setCompletedMajors(done);
  }, [allScenarios, existingResponses]);

  // Build library
  const majorsInDb = allScenarios
    ? [...new Set(allScenarios.map((s) => s.major_id))]
    : [];

  const majorCounts: Record<string, number> = {};
  allScenarios?.forEach((s) => {
    majorCounts[s.major_id] = (majorCounts[s.major_id] || 0) + 1;
  });

  // Filtered scenarios
  const scenarios = selectedMajor
    ? allScenarios?.filter((s) => s.major_id === selectedMajor)
    : [];

  const current = scenarios?.[currentIdx];
  const isStress = current?.level === "stress";
  const options: SimOption[] = (current?.options_json as unknown as SimOption[]) || [];

  // Timer
  useEffect(() => {
    if (!isStress || !current?.timer_seconds) return;
    setTimeLeft(current.timer_seconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIdx, isStress, current?.timer_seconds]);

  // Debounced autosave
  useEffect(() => {
    if (!selectedOption || !current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaved(false);

    autoSaveTimer.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from("simulation_responses").upsert({
        user_id: session.user.id,
        scenario_id: current.id,
        selected_option_id: selectedOption,
        rationale_text: rationale || null,
      }, { onConflict: "user_id,scenario_id" });

      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 2000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [selectedOption, rationale, current]);

  const resetToLibrary = useCallback(() => {
    setSelectedMajor(null);
    setCurrentIdx(0);
    setSelectedOption(null);
    setRationale("");
    setTimeLeft(null);
    setMajorDone(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedOption || !current || !selectedMajor) return;
    
    // Validate rationale for all levels
    if (rationale.trim().length < MIN_RATIONALE_LENGTH) {
      toast({ title: "مبرر قصير", description: `يرجى كتابة مبرر لا يقل عن ${MIN_RATIONALE_LENGTH} حرفاً`, variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("simulation_responses").upsert({
      user_id: session.user.id,
      scenario_id: current.id,
      selected_option_id: selectedOption,
      rationale_text: rationale,
    }, { onConflict: "user_id,scenario_id" });

    if (scenarios && currentIdx < scenarios.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setRationale("");
      setTimeLeft(null);
    } else {
      // Mark simulation step as completed
      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "simulation")
        .single();

      if (step) {
        await supabase.from("user_progress").upsert({
          user_id: session.user.id,
          step_id: step.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,step_id" });
      }

      setCompletedMajors((prev) => new Set(prev).add(selectedMajor));
      setMajorDone(true);
      queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
      toast({ title: "أحسنت! 🎉", description: "أكملت هذا التخصص بنجاح" });
      setTimeout(resetToLibrary, 2000);
    }
  }, [selectedOption, current, currentIdx, scenarios, rationale, selectedMajor, toast, resetToLibrary, queryClient]);

  // Auto-submit on timer end
  useEffect(() => {
    if (timeLeft === 0 && selectedOption && rationale.trim().length >= MIN_RATIONALE_LENGTH) handleSubmit();
  }, [timeLeft, selectedOption, rationale, handleSubmit]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">جاري التحميل...</div>;
  }

  // --- Major done splash ---
  if (majorDone) {
    const meta = MAJOR_META[selectedMajor || ""];
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-1">أحسنت!</h2>
        <p className="text-muted-foreground">أكملت محاكاة «{meta?.name || selectedMajor}» بنجاح</p>
      </motion.div>
    );
  }

  // --- LIBRARY VIEW ---
  if (!selectedMajor) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-2">مكتبة المحاكاة المهنية</h2>
          <p className="text-muted-foreground">اختر التخصص الذي تريد تجربته — أجب على سيناريوهات واقعية واكتشف مدى توافقك</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {majorsInDb.map((majorId, i) => {
            const meta = MAJOR_META[majorId];
            const Icon = meta?.icon || Gamepad2;
            const name = meta?.name || majorId;
            const count = majorCounts[majorId] || 0;
            const isDone = completedMajors.has(majorId);

            return (
              <motion.div
                key={majorId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Card
                  className={`cursor-pointer transition-all h-full border-2 group ${
                    isDone
                      ? "border-success/40 bg-success/5"
                      : "border-border hover:border-primary hover:shadow-lg"
                  }`}
                  onClick={() => {
                    setSelectedMajor(majorId);
                    setCurrentIdx(0);
                    setSelectedOption(null);
                    setRationale("");
                    setTimeLeft(null);
                  }}
                >
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-success/10"
                        : "bg-primary/5 group-hover:bg-primary/10"
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <Icon className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <h3 className="font-bold text-sm leading-snug">{name}</h3>
                    <span className="text-xs text-muted-foreground">{count} سيناريو</span>
                    {isDone ? (
                      <span className="text-xs font-medium text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        ابدأ المحاكاة ←
                      </span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Go to post-impact */}
        <div className="mt-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            أكملت <span className="font-bold text-foreground">{completedMajors.size}</span> من {majorsInDb.length} تخصص
          </p>
          <Button
            onClick={() => navigate("/dashboard/post-impact")}
            disabled={completedMajors.size === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8"
          >
            <FileText className="w-4 h-4 ml-2" />
            الانتقال لقياس الأثر البعدي
          </Button>
        </div>
      </div>
    );
  }

  // --- SCENARIO VIEW ---
  if (!current) return null;

  const majorMeta = MAJOR_META[selectedMajor];
  const MajorIcon = majorMeta?.icon || Gamepad2;
  const rationaleValid = rationale.trim().length >= MIN_RATIONALE_LENGTH;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Autosave indicator */}
      <AnimatePresence>
        {autoSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-success/90 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            تم الحفظ التلقائي
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MajorIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{majorMeta?.name || selectedMajor}</h2>
            <p className="text-muted-foreground text-xs">
              السيناريو {currentIdx + 1} من {scenarios?.length || 0}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={resetToLibrary} className="text-muted-foreground">
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة للمكتبة
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + 1) / (scenarios?.length || 1)) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Timer */}
          {isStress && timeLeft !== null && (
            <div className={`flex items-center justify-center gap-3 p-4 rounded-lg ${
              timeLeft <= 15 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
            }`}>
              <AlertTriangle className="w-5 h-5" />
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold font-mono">{timeLeft}s</span>
              <span className="text-sm">مستوى الضغط — أجب بسرعة!</span>
            </div>
          )}

          {/* Scenario */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                {majorMeta?.name || selectedMajor}
              </span>
              <span>المستوى: {current.level === "stress" ? "ضغط" : current.level}</span>
            </div>
            <p className="text-xl font-medium leading-loose">{current.text_ar}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`w-full text-right p-5 rounded-lg border-2 transition-all ${
                  selectedOption === opt.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="font-bold text-primary ml-2">{opt.id}.</span>
                {opt.text}
              </button>
            ))}
          </div>

          {/* Rationale - shown for ALL levels */}
          <div>
            <label className="block text-sm font-medium mb-2">اكتب مبررك للإجابة (لا يقل عن {MIN_RATIONALE_LENGTH} حرفاً):</label>
            <Textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="لماذا اخترت هذا الخيار؟"
              rows={3}
            />
            {rationale.length > 0 && !rationaleValid && (
              <p className="text-xs text-destructive mt-1">
                {rationale.trim().length}/{MIN_RATIONALE_LENGTH} حرف — يرجى كتابة المزيد
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedOption || !rationaleValid}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-12 text-lg"
          >
            {scenarios && currentIdx === scenarios.length - 1 ? "إنهاء التخصص" : "التالي"}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

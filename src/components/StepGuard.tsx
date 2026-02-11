import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const STEP_ORDER = ["intro", "pre-impact", "orientation", "holland", "initial-report", "shortlist", "excluded-majors", "doubt-checkpoint", "explore", "simulation", "post-impact", "report"];

interface StepGuardProps {
  requiredStep: string;
  children: React.ReactNode;
}

export function StepGuard({ requiredStep, children }: StepGuardProps) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  const { data: completedSlugs, isLoading } = useQuery({
    queryKey: ["step-guard-progress"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: steps } = await supabase
        .from("journey_steps")
        .select("id, slug");
      if (!steps) return [];

      const { data: progress } = await supabase
        .from("user_progress")
        .select("step_id, status")
        .eq("user_id", session.user.id)
        .eq("status", "completed");
      if (!progress) return [];

      const completedIds = new Set(progress.map((p) => p.step_id));
      return steps.filter((s) => completedIds.has(s.id)).map((s) => s.slug);
    },
    staleTime: 5000,
  });

  useEffect(() => {
    if (isLoading || !completedSlugs) return;

    if (completedSlugs.includes(requiredStep)) {
      setAllowed(true);
    } else {
      // Find the first incomplete step and redirect there
      const firstIncomplete = STEP_ORDER.find((s) => !completedSlugs.includes(s)) || "intro";
      navigate(`/dashboard/${firstIncomplete}`, { replace: true });
    }
  }, [completedSlugs, isLoading, requiredStep, navigate]);

  if (isLoading || !allowed) return <LoadingSpinner />;

  return <>{children}</>;
}

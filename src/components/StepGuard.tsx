import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { STEP_SLUGS } from "@/lib/stepConfig";
import { useJourney } from "@/hooks/use-journey";

interface StepGuardProps {
  requiredStep: string;
  children: React.ReactNode;
}

export function StepGuard({ requiredStep, children }: StepGuardProps) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const { completedSlugs, isLoading, session } = useJourney();

  useEffect(() => {
    if (isLoading || !completedSlugs || !session) return;

    if (completedSlugs.includes(requiredStep)) {
      setAllowed(true);
    } else {
      // Find the first incomplete step and redirect there
      const firstIncomplete = STEP_SLUGS.find((s) => !completedSlugs.includes(s)) || "intro";
      console.log("[StepGuard] GUARD_BLOCKED — required:", requiredStep, "redirecting to:", firstIncomplete);
      navigate(`/dashboard/${firstIncomplete}`, { replace: true });
    }
  }, [completedSlugs, isLoading, requiredStep, navigate, session]);

  if (isLoading || !allowed) return <LoadingSpinner />;

  return <>{children}</>;
}


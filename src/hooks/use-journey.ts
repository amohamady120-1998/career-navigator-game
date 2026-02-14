import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useJourney() {
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: Infinity, // Session doesn't change often
  });

  const userId = session?.user?.id;

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: completedSlugs = [], isLoading: isProgressLoading } = useQuery({
    queryKey: ["user-journey-progress", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const [stepsRes, progressRes] = await Promise.all([
        supabase.from("journey_steps").select("id, slug"),
        supabase.from("user_progress")
          .select("step_id, status")
          .eq("user_id", userId)
          .eq("status", "completed")
      ]);

      if (!stepsRes.data || !progressRes.data) return [];

      const completedIds = new Set(progressRes.data.map((p) => p.step_id));
      return stepsRes.data
        .filter((s) => completedIds.has(s.id))
        .map((s) => s.slug);
    },
    enabled: !!userId,
    staleTime: 30000, // Cache progress for 30s
  });

  return {
    session,
    userId,
    profile,
    completedSlugs,
    isLoading: isSessionLoading || isProfileLoading || isProgressLoading,
    isSessionLoading,
    isProfileLoading,
    isProgressLoading,
  };
}

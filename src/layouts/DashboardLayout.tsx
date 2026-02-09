import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { PledgeModal } from "@/components/PledgeModal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

const STEP_ORDER = ["intro", "pre-impact", "holland", "simulation", "post-impact", "report"];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPledge, setShowPledge] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/auth");
          return;
        }

        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type, school_name")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (profile?.user_type === "parent") {
            navigate("/parent", { replace: true });
            return;
          }
          if (profile?.user_type === "institution") {
            navigate("/institution", { replace: true });
            return;
          }
          if (!profile?.school_name) {
            navigate("/dashboard/profile", { replace: true });
          }

          // Smart resume: if on exact /dashboard, redirect to first incomplete step
          if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
            const { data: steps } = await supabase
              .from("journey_steps")
              .select("id, slug")
              .order("order_index");

            const { data: progress } = await supabase
              .from("user_progress")
              .select("step_id, status")
              .eq("user_id", session.user.id)
              .eq("status", "completed");

            if (steps && progress) {
              const completedIds = new Set(progress.map((p) => p.step_id));
              const completedSlugs = steps.filter((s) => completedIds.has(s.id)).map((s) => s.slug);
              const firstIncomplete = STEP_ORDER.find((s) => !completedSlugs.includes(s));
              if (firstIncomplete && firstIncomplete !== "intro") {
                navigate(`/dashboard/${firstIncomplete}`, { replace: true });
              }
            }
          }

          setAuthChecked(true);
          const pledgeAccepted = localStorage.getItem("athar_pledge_accepted");
          if (!pledgeAccepted) setShowPledge(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handlePledgeAccept = () => {
    localStorage.setItem("athar_pledge_accepted", "true");
    setShowPledge(false);
  };

  if (!authChecked) return null;

  return (
    <>
      <PledgeModal open={showPledge} onAccept={handlePledgeAccept} />
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border px-4 bg-card">
              <SidebarTrigger>
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="mr-4 font-bold text-lg">أثر البداية</h1>
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}

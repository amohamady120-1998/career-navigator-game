import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { PledgeModal } from "@/components/PledgeModal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const STEP_ORDER = ["intro", "pre-impact", "orientation", "holland", "initial-report", "shortlist", "excluded-majors", "doubt-checkpoint", "explore", "simulation", "post-impact", "report"];

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
            .select("user_type, school_name, has_paid")
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
          } else if (profile?.user_type === "student" && !(profile as any).has_paid && !location.pathname.startsWith("/dashboard/payment")) {
            navigate("/dashboard/payment", { replace: true });
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

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <PledgeModal open={showPledge} onAccept={handlePledgeAccept} />
      <SidebarProvider>
        <div className="min-h-screen flex flex-row-reverse w-full" dir="rtl">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center justify-between border-b border-border/60 px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <SidebarTrigger aria-label="فتح/إغلاق القائمة">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <h1 className="font-extrabold text-lg">أثر البداية</h1>
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1 p-6 animate-fade-in">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}

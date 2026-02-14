import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { PledgeModal } from "@/components/PledgeModal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { STEP_SLUGS } from "@/lib/stepConfig";
import { useJourney } from "@/hooks/use-journey";

const STEP_ORDER = STEP_SLUGS;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPledge, setShowPledge] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const processedRef = useRef(false);
  const locationRef = useRef(location.pathname);
  const { profile, completedSlugs, session, isLoading } = useJourney();

  // Keep locationRef current without re-running the effect
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (isLoading || !session) return;

    if (processedRef.current) {
      setAuthChecked(true);
      return;
    }
    processedRef.current = true;

    const checkState = async () => {
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
      } else if (profile?.user_type === "student" && !profile?.has_paid && !locationRef.current.startsWith("/dashboard/payment")) {
        navigate("/dashboard/payment", { replace: true });
      }

      // Smart resume: if on exact /dashboard, redirect to first incomplete step
      const currentPath = locationRef.current;
      if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
        const firstIncomplete = STEP_ORDER.find((s) => !completedSlugs.includes(s));
        if (firstIncomplete && firstIncomplete !== "intro") {
          navigate(`/dashboard/${firstIncomplete}`, { replace: true });
        }
      }
      
      setAuthChecked(true);
      const pledgeAccepted = localStorage.getItem("athar_pledge_accepted");
      if (!pledgeAccepted) setShowPledge(true);
    };

    checkState();
  }, [isLoading, profile, completedSlugs, session, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);


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

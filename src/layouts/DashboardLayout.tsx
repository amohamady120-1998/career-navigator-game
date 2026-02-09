import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { PledgeModal } from "@/components/PledgeModal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [showPledge, setShowPledge] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is a parent — redirect to parent dashboard
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

      // Student profile completeness check
      if (!profile?.school_name) {
        navigate("/dashboard/profile", { replace: true });
      }

      setAuthChecked(true);
      const pledgeAccepted = localStorage.getItem("athar_pledge_accepted");
      if (!pledgeAccepted) setShowPledge(true);
    });
  }, [navigate]);

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

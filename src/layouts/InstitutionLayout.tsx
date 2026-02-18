import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import InstitutionSidebar from "@/components/institution/InstitutionSidebar";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import atharLogoDark from "@/assets/athar-logo-dark.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function InstitutionLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState("denied"); return; }

      const [{ data: profile }, { data: adminRole }] = await Promise.all([
        supabase.from("profiles").select("user_type").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle(),
      ]);

      setState(profile?.user_type === "institution" || adminRole ? "authorized" : "denied");
    })();
  }, []);

  useEffect(() => {
    if (state === "denied") navigate("/dashboard", { replace: true });
  }, [state, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (state === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "denied") return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <InstitutionSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
              <img src={atharLogoDark} alt="أثر البداية" className="h-8 object-contain brightness-0 invert" />
              <h1 className="font-bold text-base hidden sm:block">لوحة المؤسسة</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 ml-2" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
            <Breadcrumbs rootPath="/institution" rootLabel="لوحة المؤسسة" />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

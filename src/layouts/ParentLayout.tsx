import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import atharLogoDark from "@/assets/athar-logo-dark.png";

export default function ParentLayout() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile?.user_type !== "parent") {
        navigate("/dashboard", { replace: true });
        return;
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-16 flex items-center justify-between border-b border-border px-6 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <img src={atharLogoDark} alt="أثر البداية" className="h-9 object-contain brightness-0 invert" />
          <h1 className="font-bold text-lg">لوحة ولي الأمر</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/parent/settings")}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

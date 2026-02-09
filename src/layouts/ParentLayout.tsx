import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import atharLogoDark from "@/assets/athar-logo-dark.png";

export default function ParentLayout() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setAuthChecked(true);
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-14 flex items-center justify-between border-b border-border px-6 bg-card">
        <div className="flex items-center gap-3">
          <img src={atharLogoDark} alt="أثر البداية" className="h-8 object-contain" />
          <h1 className="font-bold text-lg">لوحة ولي الأمر</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          تسجيل الخروج
        </button>
      </header>
      <main className="max-w-3xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

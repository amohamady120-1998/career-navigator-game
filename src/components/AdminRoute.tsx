import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [state, setState] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState("denied");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setState(roleData ? "authorized" : "denied");
    })();
  }, []);

  if (state === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

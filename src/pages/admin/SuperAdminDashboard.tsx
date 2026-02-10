import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import SystemSettingsTab from "@/components/admin/SystemSettingsTab";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) { navigate("/dashboard"); return; }
      setAuthorized(true);
      setLoading(false);
    })();
  }, [navigate]);

  if (!authorized || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">لوحة المشرف العام</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 نظرة عامة</TabsTrigger>
          <TabsTrigger value="promo">💰 أكواد الخصم</TabsTrigger>
          <TabsTrigger value="settings">⚙️ إعدادات النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverviewTab />
        </TabsContent>

        <TabsContent value="promo">
          <PromoCodesTab />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

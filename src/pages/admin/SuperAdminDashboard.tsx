import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import SystemSettingsTab from "@/components/admin/SystemSettingsTab";
import AdminSchools from "@/pages/admin/AdminSchools";
import AdminSchoolOrders from "@/pages/admin/AdminSchoolOrders";
import AdminSchoolAdmins from "@/pages/admin/AdminSchoolAdmins";
import AdminSchoolUsage from "@/pages/admin/AdminSchoolUsage";
import AdminSchoolReports from "@/pages/admin/AdminSchoolReports";
import AdminConsultations from "@/pages/admin/AdminConsultations";
import AdminExploreManager from "@/pages/admin/AdminExploreManager";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminErrors from "@/pages/admin/AdminErrors";
import AdminHealthCheck from "@/pages/admin/AdminHealthCheck";
import AdminUsersTab from "@/components/admin/AdminUsersTab";

const TAB_GROUPS = [
  {
    label: "عام",
    tabs: [
      { value: "overview", label: "📊 نظرة عامة" },
      { value: "users", label: "👥 المستخدمون" },
      { value: "health", label: "🩺 فحص النظام" },
    ],
  },
  {
    label: "المدارس",
    tabs: [
      { value: "schools", label: "🏫 المدارس" },
      { value: "school-orders", label: "📦 الطلبات" },
      { value: "school-admins", label: "👤 المشرفون" },
      { value: "school-usage", label: "📈 الاستخدام" },
      { value: "school-reports", label: "📋 التقارير" },
    ],
  },
  {
    label: "المحتوى",
    tabs: [
      { value: "explore", label: "🧭 الاستكشاف" },
      { value: "consultations", label: "💬 الاستشارات" },
    ],
  },
  {
    label: "النظام",
    tabs: [
      { value: "promo", label: "💰 الخصومات" },
      { value: "notifications", label: "🔔 الإشعارات" },
      { value: "analytics", label: "📊 التحليلات" },
      { value: "errors", label: "⚠️ الأخطاء" },
      { value: "settings", label: "⚙️ الإعدادات" },
    ],
  },
];

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
    <div className="max-w-7xl mx-auto p-4 md:p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">لوحة المشرف العام</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <ScrollArea className="w-full" dir="rtl">
          <TabsList className="inline-flex h-auto gap-1 p-1 flex-nowrap w-max">
            {TAB_GROUPS.map((group) => (
              group.tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="whitespace-nowrap text-xs md:text-sm px-3 py-2"
                >
                  {tab.label}
                </TabsTrigger>
              ))
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="overview"><AdminOverviewTab /></TabsContent>
        <TabsContent value="users"><AdminUsersTab /></TabsContent>
        <TabsContent value="health"><AdminHealthCheck embedded /></TabsContent>
        <TabsContent value="schools"><AdminSchools embedded /></TabsContent>
        <TabsContent value="school-orders"><AdminSchoolOrders embedded /></TabsContent>
        <TabsContent value="school-admins"><AdminSchoolAdmins embedded /></TabsContent>
        <TabsContent value="school-usage"><AdminSchoolUsage embedded /></TabsContent>
        <TabsContent value="school-reports"><AdminSchoolReports embedded /></TabsContent>
        <TabsContent value="explore"><AdminExploreManager embedded /></TabsContent>
        <TabsContent value="consultations"><AdminConsultations embedded /></TabsContent>
        <TabsContent value="promo"><PromoCodesTab /></TabsContent>
        <TabsContent value="notifications"><AdminNotifications embedded /></TabsContent>
        <TabsContent value="analytics"><AdminAnalytics embedded /></TabsContent>
        <TabsContent value="errors"><AdminErrors embedded /></TabsContent>
        <TabsContent value="settings"><SystemSettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

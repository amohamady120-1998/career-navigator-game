import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, BarChart3, Compass, Gamepad2, FileText, Lock, CheckCircle2, LogOut, Settings, Award, Bot, AlertCircle, HelpCircle, Search, ClipboardCheck, PlayCircle, ArrowLeftCircle, UserCircle } from "lucide-react";
import atharLogoDark from "@/assets/athar-logo-dark.png";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Ordered step config matching the required journey order
const SIDEBAR_STEPS: { slug: string; labelAr: string; icon: any; customPath?: string }[] = [
  { slug: "intro", labelAr: "المقدمة", icon: BookOpen },
  { slug: "pre-impact", labelAr: "قياس الأثر القبلي", icon: BarChart3 },
  { slug: "orientation", labelAr: "التهيئة", icon: PlayCircle },
  { slug: "holland", labelAr: "اختبار هولند", icon: Compass },
  { slug: "initial-report", labelAr: "التقرير المبدئي", icon: FileText },
  { slug: "shortlist", labelAr: "ترتيب الاختيارات", icon: Award },
  { slug: "excluded-majors", labelAr: "تخصصات أقل توافقًا", icon: AlertCircle },
  { slug: "doubt-checkpoint", labelAr: "لحظة صدق", icon: HelpCircle },
  { slug: "explore", labelAr: "استكشاف التخصص", icon: Search },
  { slug: "simulation", labelAr: "المحاكاة المهنية", icon: Gamepad2 },
  { slug: "post-impact", labelAr: "قياس الأثر البعدي", icon: ClipboardCheck },
  { slug: "report", labelAr: "التقرير النهائي", icon: FileText, customPath: "/dashboard/final-report" },
];

const STEP_SLUGS = SIDEBAR_STEPS.map(s => s.slug);

export function AppSidebar() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["sidebar-profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase
        .from("profiles")
        .select("has_paid")
        .eq("user_id", session.user.id)
        .maybeSingle();
      return data;
    },
  });

  const hasPaid = (profile as any)?.has_paid ?? false;

  const { data: steps } = useQuery({
    queryKey: ["journey-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_steps")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const { data: completedSlugs } = useQuery({
    queryKey: ["user-progress-slugs"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from("user_progress")
        .select("step_id, status")
        .eq("user_id", session.user.id)
        .eq("status", "completed");
      if (error) return [];

      if (!steps) return [];
      const completedStepIds = new Set(data.map(p => p.step_id));
      return steps.filter(s => completedStepIds.has(s.id)).map(s => s.slug);
    },
    enabled: !!steps,
  });

  const isStepUnlocked = (slug: string): boolean => {
    const idx = STEP_SLUGS.indexOf(slug);
    if (idx === 0) return true;
    // "explore" is unlocked if doubt-checkpoint is done
    const prevSlug = STEP_SLUGS[idx - 1];
    return completedSlugs?.includes(prevSlug) ?? false;
  };

  const isStepCompleted = (slug: string): boolean => {
    return completedSlugs?.includes(slug) ?? false;
  };

  const reportCompleted = completedSlugs?.includes("report") ?? false;

  const handleLogout = async () => {
    localStorage.removeItem("athar_pledge_accepted");
    await supabase.auth.signOut();
    navigate("/");
  };

  const completedCount = completedSlugs?.length ?? 0;
  const totalSteps = STEP_SLUGS.length;
  const progressPct = (completedCount / totalSteps) * 100;

  return (
    <Sidebar className="border-r-0 border-l border-sidebar-border" side="right">
      <SidebarContent>
        <div className="p-5 border-b border-sidebar-border flex items-center justify-center">
          <img src={atharLogoDark} alt="أثر البداية" className="h-14 object-contain" />
        </div>

        {hasPaid && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex justify-between text-xs text-sidebar-foreground/50 mb-1.5">
              <span>التقدم</span>
              <span className="font-bold text-sidebar-primary">{completedCount}/{totalSteps}</span>
            </div>
            <div className="h-1.5 bg-sidebar-accent/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))`,
                }}
              />
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs font-semibold tracking-wide">
            مراحل الرحلة
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SIDEBAR_STEPS.map((item) => {
                const Icon = item.icon;
                const unlocked = hasPaid && isStepUnlocked(item.slug);
                const completed = isStepCompleted(item.slug);
                const path = item.customPath || `/dashboard/${item.slug}`;

                return (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton
                      asChild
                      className={!unlocked ? "opacity-40 pointer-events-none" : "transition-all duration-200"}
                    >
                      {!unlocked ? (
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm">{item.labelAr}</span>
                        </div>
                      ) : (
                        <NavLink
                          to={path}
                          end
                          className="hover:bg-sidebar-accent/50 rounded-lg transition-colors duration-200"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        >
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 ml-3 text-success" />
                          ) : (
                            <Icon className="w-4 h-4 ml-3" />
                          )}
                          <span className="text-sm">{item.labelAr}</span>
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Certificate */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={!hasPaid || !reportCompleted ? "opacity-40 pointer-events-none" : "transition-all duration-200"}
                >
                  {!hasPaid || !reportCompleted ? (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">الشهادة</span>
                    </div>
                  ) : (
                    <NavLink
                      to="/dashboard/certificate"
                      end
                      className="hover:bg-sidebar-accent/50 rounded-lg transition-colors duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <Award className="w-4 h-4 ml-3 text-accent" />
                      <span className="text-sm">الشهادة</span>
                    </NavLink>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Next Step / Consultation */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={!hasPaid || !reportCompleted ? "opacity-40 pointer-events-none" : "transition-all duration-200"}
                >
                  {!hasPaid || !reportCompleted ? (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">الخطوة التالية</span>
                    </div>
                  ) : (
                    <NavLink
                      to="/dashboard/next-step"
                      end
                      className="hover:bg-sidebar-accent/50 rounded-lg transition-colors duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <ArrowLeftCircle className="w-4 h-4 ml-3 text-accent" />
                      <span className="text-sm">الخطوة التالية</span>
                    </NavLink>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg text-sm"
          onClick={() => navigate("/dashboard/my-profile")}
        >
          <UserCircle className="w-4 h-4 text-accent" />
          ملفي
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg text-sm"
          onClick={() => navigate("/dashboard/ai-counselor")}
        >
          <Bot className="w-4 h-4 text-accent" />
          مستشار أثر الذكي
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg text-sm"
          onClick={() => navigate("/dashboard/settings")}
        >
          <Settings className="w-4 h-4" />
          الإعدادات
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg text-sm"
          onClick={handleLogout}
          aria-label="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

import { useNavigate } from "react-router-dom";
import { BookOpen, BarChart3, Compass, Gamepad2, FileText, Lock, CheckCircle2, LogOut, Settings, Award, Bot, AlertCircle, HelpCircle, Search, ClipboardCheck, PlayCircle, ArrowLeftCircle, UserCircle } from "lucide-react";
import atharLogoDark from "@/assets/athar-logo-dark.png";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { JOURNEY_STEPS } from "@/lib/stepConfig";
import { useJourney } from "@/hooks/use-journey";
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

// Map slugs to icons
const SLUG_ICONS: Record<string, any> = {
  "intro": BookOpen,
  "pre-impact": BarChart3,
  "orientation": PlayCircle,
  "holland": Compass,
  "initial-report": FileText,
  "shortlist": Award,
  "excluded-majors": AlertCircle,
  "doubt-checkpoint": HelpCircle,
  "explore": Search,
  "simulation": Gamepad2,
  "post-impact": ClipboardCheck,
  "report": FileText,
  "certificate": Award,
  "next-step": ArrowLeftCircle,
};

// Build sidebar steps from centralized config
const SIDEBAR_STEPS = JOURNEY_STEPS.map(s => ({
  slug: s.slug,
  labelAr: s.labelAr,
  icon: SLUG_ICONS[s.slug] || BookOpen,
  path: s.route,
}));

const STEP_SLUGS = SIDEBAR_STEPS.map(s => s.slug);

export function AppSidebar() {
  const navigate = useNavigate();
  const { profile, completedSlugs } = useJourney();

  const isStepUnlocked = (slug: string): boolean => {
    const idx = STEP_SLUGS.indexOf(slug);
    if (idx === 0) return true;
    // If this step is already completed, it's obviously unlocked
    if (completedSlugs?.includes(slug)) return true;
    // Unlock if previous step is completed
    const prevSlug = STEP_SLUGS[idx - 1];
    return completedSlugs?.includes(prevSlug) ?? false;
  };

  const isStepCompleted = (slug: string): boolean => {
    return completedSlugs?.includes(slug) ?? false;
  };

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

        {completedCount > 0 && (
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
                const unlocked = isStepUnlocked(item.slug);
                const completed = isStepCompleted(item.slug);

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
                          to={item.path}
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

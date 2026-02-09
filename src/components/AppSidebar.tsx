import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, BarChart3, Compass, Gamepad2, FileText, Lock, CheckCircle2, LogOut, ClipboardCheck } from "lucide-react";
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

const stepIcons: Record<string, typeof BookOpen> = {
  intro: BookOpen,
  "pre-impact": BarChart3,
  holland: Compass,
  simulation: Gamepad2,
  "post-impact": ClipboardCheck,
  report: FileText,
};

// Step unlock order: each step requires the previous step to be completed
const STEP_ORDER = ["intro", "pre-impact", "holland", "simulation", "post-impact", "report"];

export function AppSidebar() {
  const navigate = useNavigate();

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
    const idx = STEP_ORDER.indexOf(slug);
    if (idx === 0) return true; // intro always unlocked
    // Previous step must be completed
    const prevSlug = STEP_ORDER[idx - 1];
    return completedSlugs?.includes(prevSlug) ?? false;
  };

  const isStepCompleted = (slug: string): boolean => {
    return completedSlugs?.includes(slug) ?? false;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar className="border-l-0">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <img src={atharLogoDark} alt="أثر البداية" className="h-14 object-contain" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs">
            مراحل الرحلة
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {steps?.map((step) => {
                const Icon = stepIcons[step.slug] || BookOpen;
                const unlocked = isStepUnlocked(step.slug);
                const completed = isStepCompleted(step.slug);
                const path = `/dashboard/${step.slug}`;

                return (
                  <SidebarMenuItem key={step.id}>
                    <SidebarMenuButton
                      asChild
                      className={!unlocked ? "opacity-50 pointer-events-none" : ""}
                    >
                      {!unlocked ? (
                        <div className="flex items-center gap-3 px-3 py-2">
                          <Lock className="w-4 h-4" />
                          <span>{step.name_ar}</span>
                        </div>
                      ) : (
                        <NavLink
                          to={path}
                          end
                          className="hover:bg-sidebar-accent/50"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 ml-3 text-success" />
                          ) : (
                            <Icon className="w-4 h-4 ml-3" />
                          )}
                          <span>{step.name_ar}</span>
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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

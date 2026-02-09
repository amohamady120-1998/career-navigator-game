import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { BookOpen, BarChart3, Compass, Gamepad2, FileText, Lock, CheckCircle2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const stepIcons: Record<string, typeof BookOpen> = {
  intro: BookOpen,
  "pre-impact": BarChart3,
  holland: Compass,
  simulation: Gamepad2,
  report: FileText,
};

// For now, all steps unlocked for development — lock logic will use user_progress later
const UNLOCKED_SLUGS = ["intro", "pre-impact", "holland", "simulation", "report"];

export function AppSidebar() {
  const location = useLocation();

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

  return (
    <Sidebar className="border-l-0">
      <SidebarContent>
        <div className="p-6 border-b border-sidebar-border">
          <h2 className="text-xl font-black text-sidebar-primary">أثر ستارت</h2>
          <p className="text-xs text-sidebar-foreground/60 mt-1">رحلة اكتشاف المسار المهني</p>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs">
            مراحل الرحلة
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {steps?.map((step) => {
                const Icon = stepIcons[step.slug] || BookOpen;
                const isUnlocked = UNLOCKED_SLUGS.includes(step.slug);
                const path = `/dashboard/${step.slug}`;

                return (
                  <SidebarMenuItem key={step.id}>
                    <SidebarMenuButton
                      asChild
                      className={!isUnlocked ? "opacity-50 pointer-events-none" : ""}
                    >
                      {!isUnlocked ? (
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
                          <Icon className="w-4 h-4 ml-3" />
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
    </Sidebar>
  );
}

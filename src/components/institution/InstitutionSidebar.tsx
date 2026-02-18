import {
  LayoutDashboard, Users, Key, Activity, Settings, LifeBuoy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

const items = [
  { title: "لوحة التحكم", url: "/institution", icon: LayoutDashboard },
  { title: "الطلاب", url: "/institution/students", icon: Users },
  { title: "أكواد التفعيل", url: "/institution/codes", icon: Key },
  { title: "النشاط", url: "/institution/activity", icon: Activity },
  { title: "الإعدادات", url: "/institution/settings", icon: Settings },
  { title: "الدعم", url: "/institution/support", icon: LifeBuoy },
];

export default function InstitutionSidebar() {
  return (
    <Sidebar side="right" collapsible="icon" className="border-l border-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>لوحة المؤسسة</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/institution"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

import {
  LayoutDashboard, Users, HeartPulse, School, Package, UserCog,
  BarChart3, FileText, Compass, MessageSquare, Percent, Bell,
  TrendingUp, AlertTriangle, Settings,
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

const groups = [
  {
    label: "عام",
    items: [
      { title: "نظرة عامة", url: "/admin", icon: LayoutDashboard },
      { title: "المستخدمون", url: "/admin/users", icon: Users },
      { title: "فحص النظام", url: "/admin/health", icon: HeartPulse },
    ],
  },
  {
    label: "المدارس",
    items: [
      { title: "المدارس", url: "/admin/schools", icon: School },
      { title: "الطلبات", url: "/admin/orders", icon: Package },
      { title: "المشرفون", url: "/admin/school-admins", icon: UserCog },
      { title: "الاستخدام", url: "/admin/usage", icon: BarChart3 },
      { title: "التقارير", url: "/admin/reports", icon: FileText },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { title: "الاستكشاف", url: "/admin/explore", icon: Compass },
      { title: "الاستشارات", url: "/admin/consultations", icon: MessageSquare },
    ],
  },
  {
    label: "النظام",
    items: [
      { title: "الخصومات", url: "/admin/promos", icon: Percent },
      { title: "الإشعارات", url: "/admin/notifications", icon: Bell },
      { title: "التحليلات", url: "/admin/analytics", icon: TrendingUp },
      { title: "الأخطاء", url: "/admin/errors", icon: AlertTriangle },
      { title: "الإعدادات", url: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  return (
    <Sidebar side="right" collapsible="icon" className="border-l border-border">
      <SidebarContent className="pt-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

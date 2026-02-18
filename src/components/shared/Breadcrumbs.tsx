import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  institution: "المؤسسة",
  admin: "المشرف",
  students: "الطلاب",
  codes: "أكواد التفعيل",
  activity: "النشاط",
  settings: "الإعدادات",
  support: "الدعم",
  users: "المستخدمون",
  health: "فحص النظام",
  schools: "المدارس",
  orders: "الطلبات",
  "school-admins": "المشرفون",
  usage: "الاستخدام",
  reports: "التقارير",
  explore: "الاستكشاف",
  consultations: "الاستشارات",
  promos: "الخصومات",
  notifications: "الإشعارات",
  analytics: "التحليلات",
  errors: "الأخطاء",
};

interface BreadcrumbsProps {
  rootPath: string;
  rootLabel: string;
}

export default function Breadcrumbs({ rootPath, rootLabel }: BreadcrumbsProps) {
  const location = useLocation();
  const relativePath = location.pathname.replace(rootPath, "").replace(/^\//, "");
  const segments = relativePath ? relativePath.split("/") : [];

  if (segments.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={rootPath}>{rootLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const path = `${rootPath}/${segments.slice(0, i + 1).join("/")}`;
          return (
            <BreadcrumbItem key={seg}>
              <BreadcrumbSeparator><ChevronLeft className="w-3.5 h-3.5" /></BreadcrumbSeparator>
              {isLast ? (
                <BreadcrumbPage>{LABEL_MAP[seg] ?? seg}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={path}>{LABEL_MAP[seg] ?? seg}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

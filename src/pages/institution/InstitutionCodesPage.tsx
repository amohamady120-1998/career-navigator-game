import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Loader2, Key, Copy, Check, Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeRow {
  id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string | null;
}

interface OrderSummary {
  order_id: string;
  school_name: string;
  seats_total: number;
  seats_used: number;
  status: string;
  codes: CodeRow[];
}

const PAGE_SIZE = 15;

export default function InstitutionCodesPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: adminLinks } = await supabase
        .from("school_admins")
        .select("school_id")
        .eq("user_id", user.id);

      if (!adminLinks?.length) { setOrders([]); setLoading(false); return; }

      const schoolIds = adminLinks.map(a => a.school_id);
      const [schoolsRes, ordersRes] = await Promise.all([
        supabase.from("schools").select("id, name").in("id", schoolIds),
        supabase.from("school_orders").select("id, school_id, seats_total, seats_used, status").in("school_id", schoolIds).order("created_at", { ascending: false }),
      ]);

      const ordersData = ordersRes.data ?? [];
      if (!ordersData.length) { setOrders([]); setLoading(false); return; }

      const { data: codesData } = await supabase
        .from("school_codes")
        .select("id, code, is_used, used_at, created_at, school_order_id")
        .in("school_order_id", ordersData.map(o => o.id))
        .order("is_used", { ascending: true });

      const schoolMap = new Map((schoolsRes.data ?? []).map(s => [s.id, s.name]));

      setOrders(ordersData.map(o => ({
        order_id: o.id,
        school_name: schoolMap.get(o.school_id) ?? "—",
        seats_total: o.seats_total,
        seats_used: o.seats_used,
        status: o.status,
        codes: (codesData?.filter(c => c.school_order_id === o.id) ?? []) as CodeRow[],
      })));
      setLoading(false);
    })();
  }, []);

  const maskCode = (code: string) => {
    if (code.length <= 6) return "****";
    return code.slice(0, 6) + "****" + code.slice(-4);
  };

  const toggleReveal = (codeId: string) => {
    setRevealedCodes(prev => {
      const next = new Set(prev);
      if (next.has(codeId)) next.delete(codeId); else next.add(codeId);
      return next;
    });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "تم نسخ الكود ✓" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (orders.length === 0) {
    return <EmptyState icon={Key} title="لا توجد أكواد تفعيل" description="لم يتم ربط حسابك كمشرف على أي مدرسة بعد" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">أكواد التفعيل</h1>
      {orders.map((order) => {
        const totalPages = Math.ceil(order.codes.length / PAGE_SIZE);
        const paged = order.codes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

        return (
          <Card key={order.order_id}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="w-5 h-5 text-primary" />
                  {order.school_name}
                </CardTitle>
                <Badge variant={order.status === "active" ? "default" : "secondary"}>
                  {order.status === "active" ? "نشط" : "متوقف"}
                </Badge>
              </div>
              <CardDescription>
                المقاعد: {order.seats_used} / {order.seats_total} مستخدمة
              </CardDescription>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(order.seats_used / order.seats_total) * 100}%` }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الكود</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>تاريخ الاستخدام</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm tracking-wider">
                          {revealedCodes.has(c.id) ? c.code : maskCode(c.code)}
                        </TableCell>
                        <TableCell>
                          {c.is_used ? (
                            <Badge variant="secondary" className="text-xs">مُستخدم</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">متاح</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("ar-SA") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.used_at ? new Date(c.used_at).toLocaleDateString("ar-SA") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleReveal(c.id)}>
                              {revealedCodes.has(c.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </Button>
                            {!c.is_used && (
                              <Button variant="ghost" size="sm" onClick={() => handleCopy(c.code)}>
                                {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

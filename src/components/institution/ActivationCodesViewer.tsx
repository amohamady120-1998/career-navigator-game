import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Key, Copy, Check, ChevronRight, ChevronLeft } from "lucide-react";
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

const PAGE_SIZE = 10;

export default function ActivationCodesViewer() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get school_admins for this user
    const { data: adminLinks } = await supabase
      .from("school_admins")
      .select("school_id")
      .eq("user_id", user.id);

    if (!adminLinks?.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const schoolIds = adminLinks.map((a) => a.school_id);

    // Get schools
    const { data: schools } = await supabase
      .from("schools")
      .select("id, name")
      .in("id", schoolIds);

    // Get orders for these schools
    const { data: ordersData } = await supabase
      .from("school_orders")
      .select("id, school_id, seats_total, seats_used, status")
      .in("school_id", schoolIds)
      .order("created_at", { ascending: false });

    if (!ordersData?.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = ordersData.map((o) => o.id);

    // Get codes for these orders
    const { data: codesData } = await supabase
      .from("school_codes")
      .select("id, code, is_used, used_at, created_at, school_order_id")
      .in("school_order_id", orderIds)
      .order("is_used", { ascending: true })
      .order("created_at", { ascending: false });

    const schoolMap = new Map(schools?.map((s) => [s.id, s.name]) ?? []);

    const result: OrderSummary[] = ordersData.map((o) => ({
      order_id: o.id,
      school_name: schoolMap.get(o.school_id) ?? "—",
      seats_total: o.seats_total,
      seats_used: o.seats_used,
      status: o.status,
      codes: (codesData?.filter((c) => c.school_order_id === o.id) ?? []) as CodeRow[],
    }));

    setOrders(result);
    setLoading(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "تم نسخ الكود ✓" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return null; // Don't show section if no school admin link
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const availableCodes = order.codes.filter((c) => !c.is_used);
        const usedCodes = order.codes.filter((c) => c.is_used);
        const totalPages = Math.ceil(order.codes.length / PAGE_SIZE);
        const pagedCodes = order.codes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

        return (
          <Card key={order.order_id} className="border-2 border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="w-5 h-5 text-primary" />
                  أكواد التفعيل — {order.school_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "active" ? "default" : "secondary"}>
                    {order.status === "active" ? "نشط" : order.status === "paused" ? "متوقف" : "مغلق"}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                المقاعد: {order.seats_used} / {order.seats_total} مستخدمة
                {" • "}
                متاحة: {availableCodes.length} كود
                {" • "}
                مستخدمة: {usedCodes.length} كود
              </CardDescription>
              {/* Seats progress bar */}
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(order.seats_used / order.seats_total) * 100}%` }}
                />
              </div>
            </CardHeader>

            <CardContent>
              {order.codes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد أكواد مرتبطة بهذا الطلب</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الكود</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>تاريخ الاستخدام</TableHead>
                          <TableHead>نسخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedCodes.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <span className="font-mono text-sm tracking-wider">{c.code}</span>
                            </TableCell>
                            <TableCell>
                              {c.is_used ? (
                                <Badge variant="secondary" className="text-xs">مُستخدم</Badge>
                              ) : (
                                <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 text-xs">
                                  متاح
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {c.used_at
                                ? new Date(c.used_at).toLocaleDateString("ar-SA")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {!c.is_used && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(c.code)}
                                  className="gap-1"
                                >
                                  {copiedCode === c.code ? (
                                    <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "نشط", variant: "default" },
  paused: { label: "متوقف", variant: "secondary" },
  closed: { label: "مغلق", variant: "destructive" },
};

export default function AdminSchoolOrders() {
  const qc = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-school-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_orders")
        .select("*, schools(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("school_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-school-orders"] });
      toast.success("تم تحديث الحالة");
    },
    onError: () => toast.error("خطأ في التحديث"),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> طلبات المقاعد</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المدرسة</TableHead>
                <TableHead className="text-right">المقاعد الكلية</TableHead>
                <TableHead className="text-right">المستخدمة</TableHead>
                <TableHead className="text-right">المتبقية</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map(o => {
                const s = STATUS_MAP[o.status] || STATUS_MAP.active;
                const remaining = o.seats_total - o.seats_used;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{(o as any).schools?.name || "—"}</TableCell>
                    <TableCell>{o.seats_total}</TableCell>
                    <TableCell>{o.seats_used}</TableCell>
                    <TableCell className={remaining <= 5 ? "text-destructive font-bold" : ""}>{remaining}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {o.status !== "paused" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: o.id, status: "paused" })}>
                            إيقاف
                          </Button>
                        )}
                        {o.status !== "active" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: o.id, status: "active" })}>
                            تنشيط
                          </Button>
                        )}
                        {o.status !== "closed" && (
                          <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: o.id, status: "closed" })}>
                            إغلاق
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!orders?.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد طلبات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

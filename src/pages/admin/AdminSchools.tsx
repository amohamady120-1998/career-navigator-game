import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, School, Download, Key } from "lucide-react";

export default function AdminSchools({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showOrder, setShowOrder] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState<{ orderId: string; schoolName: string } | null>(null);
  const [codeCount, setCodeCount] = useState(10);
  const [form, setForm] = useState({ name: "", contact_name: "", contact_whatsapp: "", contact_email: "", city: "" });
  const [seatsTotal, setSeatsTotal] = useState(50);

  const { data: schools, isLoading } = useQuery({
    queryKey: ["admin-schools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createSchool = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("schools").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-schools"] });
      setShowCreate(false);
      setForm({ name: "", contact_name: "", contact_whatsapp: "", contact_email: "", city: "" });
      toast.success("تم إنشاء المدرسة");
    },
    onError: () => toast.error("خطأ في إنشاء المدرسة"),
  });

  const createOrder = useMutation({
    mutationFn: async (schoolId: string) => {
      const { error } = await supabase.from("school_orders").insert({ school_id: schoolId, seats_total: seatsTotal });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-schools"] });
      setShowOrder(null);
      toast.success("تم إنشاء الطلب");
    },
    onError: () => toast.error("خطأ في إنشاء الطلب"),
  });

  const generateCodes = useMutation({
    mutationFn: async (orderId: string) => {
      const codes = Array.from({ length: codeCount }, () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        return `ATHAR-${rand}`;
      });

      const rows = codes.map(code => ({ school_order_id: orderId, code }));
      const { error } = await supabase.from("school_codes").insert(rows);
      if (error) throw error;
      return codes;
    },
    onSuccess: (codes) => {
      qc.invalidateQueries({ queryKey: ["admin-schools"] });
      toast.success(`تم توليد ${codes.length} كود`);
      // Download CSV
      const csv = "code\n" + codes.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `athar-codes-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowCodes(null);
    },
    onError: () => toast.error("خطأ في توليد الأكواد"),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className={embedded ? "space-y-6" : "max-w-5xl mx-auto p-6 space-y-6"} dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><School className="w-6 h-6" /> إدارة المدارس</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-1" /> إضافة مدرسة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إنشاء مدرسة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>اسم المدرسة *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>اسم جهة الاتصال</Label><Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} /></div>
              <div><Label>واتساب</Label><Input value={form.contact_whatsapp} onChange={e => setForm(p => ({ ...p, contact_whatsapp: e.target.value }))} /></div>
              <div><Label>بريد إلكتروني</Label><Input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
              <div><Label>المدينة</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <Button onClick={() => createSchool.mutate()} disabled={!form.name || createSchool.isPending} className="w-full">
                {createSchool.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المدرسة</TableHead>
                <TableHead className="text-right">المدينة</TableHead>
                <TableHead className="text-right">جهة الاتصال</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools?.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.city || "—"}</TableCell>
                  <TableCell>{s.contact_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={showOrder === s.id} onOpenChange={v => setShowOrder(v ? s.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Plus className="w-3 h-3 ml-1" /> طلب مقاعد</Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader><DialogTitle>إنشاء طلب مقاعد - {s.name}</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div><Label>عدد المقاعد</Label><Input type="number" min={1} value={seatsTotal} onChange={e => setSeatsTotal(Number(e.target.value))} /></div>
                            <Button onClick={() => createOrder.mutate(s.id)} disabled={createOrder.isPending} className="w-full">
                              {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء الطلب"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showCodes?.orderId === s.id} onOpenChange={v => setShowCodes(v ? { orderId: s.id, schoolName: s.name } : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Key className="w-3 h-3 ml-1" /> توليد أكواد</Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader><DialogTitle>توليد أكواد - {s.name}</DialogTitle></DialogHeader>
                          <CodesGenerator schoolId={s.id} onGenerate={(orderId, count) => {
                            setCodeCount(count);
                            generateCodes.mutate(orderId);
                          }} isPending={generateCodes.isPending} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!schools?.length && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">لا توجد مدارس بعد</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CodesGenerator({ schoolId, onGenerate, isPending }: { schoolId: string; onGenerate: (orderId: string, count: number) => void; isPending: boolean }) {
  const [count, setCount] = useState(10);

  const { data: orders } = useQuery({
    queryKey: ["school-orders", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_orders").select("*").eq("school_id", schoolId).eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const [selectedOrder, setSelectedOrder] = useState("");

  if (!orders?.length) {
    return <p className="text-muted-foreground text-center py-4">لا توجد طلبات نشطة. أنشئ طلب مقاعد أولاً.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>اختر الطلب</Label>
        <select
          className="w-full border rounded-md p-2 mt-1 bg-background"
          value={selectedOrder}
          onChange={e => setSelectedOrder(e.target.value)}
        >
          <option value="">اختر...</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>
              {o.seats_total} مقعد ({o.seats_used} مستخدم)
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>عدد الأكواد</Label>
        <Input type="number" min={1} max={500} value={count} onChange={e => setCount(Number(e.target.value))} />
      </div>
      <Button onClick={() => onGenerate(selectedOrder, count)} disabled={!selectedOrder || isPending} className="w-full">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 ml-1" /> توليد وتحميل CSV</>}
      </Button>
    </div>
  );
}

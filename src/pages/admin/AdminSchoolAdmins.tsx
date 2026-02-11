import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";

export default function AdminSchoolAdmins() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedRole, setSelectedRole] = useState("school_admin");
  const [lookupLoading, setLookupLoading] = useState(false);

  const { data: schools } = useQuery({
    queryKey: ["admin-schools-list"],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("id, name, city").order("name");
      return data || [];
    },
  });

  const { data: admins, isLoading } = useQuery({
    queryKey: ["school-admins-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_admins")
        .select("id, user_id, school_id, role, created_at");
      if (error) throw error;

      // Enrich with school names
      const schoolIds = [...new Set((data || []).map(a => a.school_id))];
      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, name")
        .in("id", schoolIds.length ? schoolIds : ["__none__"]);
      const schoolMap = new Map((schoolData || []).map(s => [s.id, s.name]));

      return (data || []).map(a => ({
        ...a,
        school_name: schoolMap.get(a.school_id) || "—",
      }));
    },
  });

  const assignAdmin = useMutation({
    mutationFn: async () => {
      setLookupLoading(true);
      // Lookup user by email via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke("lookup-user-by-email", {
        body: { email: email.trim().toLowerCase() },
      });

      if (fnError) throw new Error("خطأ في البحث عن المستخدم");
      const results = fnData?.results || [];
      const exactMatch = results.find((r: any) => r.email?.toLowerCase() === email.trim().toLowerCase());
      if (!exactMatch) {
        throw new Error("لم يتم العثور على مستخدم بهذا البريد الإلكتروني");
      }

      const userId = exactMatch.user_id;

      // Upsert into school_admins
      const { error } = await supabase
        .from("school_admins")
        .upsert(
          { user_id: userId, school_id: selectedSchool, role: selectedRole },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-admins-list"] });
      setShowAdd(false);
      setEmail("");
      setSelectedSchool("");
      setSelectedRole("school_admin");
      toast.success("تم تعيين مشرف المدرسة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطأ في التعيين");
    },
    onSettled: () => setLookupLoading(false),
  });

  const removeAdmin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_admins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-admins-list"] });
      toast.success("تم إزالة المشرف");
    },
    onError: () => toast.error("خطأ في الإزالة"),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="w-6 h-6" /> إدارة مشرفي المدارس
        </h1>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-1" /> تعيين مشرف</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>تعيين مشرف مدرسة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>البريد الإلكتروني للمستخدم</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>المدرسة</Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مدرسة" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الصلاحية</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school_admin">مشرف (تحكم كامل)</SelectItem>
                    <SelectItem value="school_viewer">مشاهد (قراءة فقط)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => assignAdmin.mutate()}
                disabled={!email || !selectedSchool || assignAdmin.isPending || lookupLoading}
                className="w-full"
              >
                {assignAdmin.isPending || lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تعيين"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">المشرفون المعينون</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">معرّف المستخدم</TableHead>
                <TableHead className="text-right">المدرسة</TableHead>
                <TableHead className="text-right">الصلاحية</TableHead>
                <TableHead className="text-right">تاريخ التعيين</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins?.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>{a.school_name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {a.role === "school_admin" ? "مشرف" : "مشاهد"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{new Date(a.created_at).toLocaleDateString("ar")}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeAdmin.mutate(a.id)}
                      disabled={removeAdmin.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!admins?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    لا يوجد مشرفون معينون بعد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

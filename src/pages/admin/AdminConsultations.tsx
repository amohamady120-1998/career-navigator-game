import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "new", label: "جديد", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "تم التواصل", color: "bg-yellow-100 text-yellow-800" },
  { value: "booked", label: "محجوز", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "مغلق", color: "bg-gray-100 text-gray-800" },
];

const TYPE_LABELS: Record<string, string> = {
  career: "استشارة مهنية",
  university_local: "قبول محلي",
  university_abroad: "قبول خارجي",
  scholarship: "منح دراسية",
};

type ConsultationRequest = {
  id: string;
  user_id: string;
  user_name: string | null;
  whatsapp: string;
  consultation_type: string;
  status: string;
  report_link: string | null;
  notes: string | null;
  created_at: string;
};

export default function AdminConsultations({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) { navigate("/dashboard"); return; }
      setAuthorized(true);
      await fetchRequests();
      setLoading(false);
    })();
  }, [navigate]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("consultation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("خطأ في تحميل الطلبات");
    } else {
      setRequests((data as ConsultationRequest[]) || []);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("consultation_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("خطأ في تحديث الحالة");
    } else {
      toast.success("تم تحديث الحالة");
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const saveNotes = async () => {
    if (!selectedRequest) return;
    const { error } = await supabase
      .from("consultation_requests")
      .update({ notes: adminNotes })
      .eq("id", selectedRequest.id);

    if (error) {
      toast.error("خطأ في حفظ الملاحظات");
    } else {
      toast.success("تم حفظ الملاحظات");
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, notes: adminNotes } : r));
      setSelectedRequest(null);
    }
  };

  const filtered = filterStatus === "all" ? requests : requests.filter(r => r.status === filterStatus);

  if (!authorized || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "max-w-6xl mx-auto p-6"} dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">📋 إدارة طلبات الاستشارات</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">فلترة:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>واتساب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(req => {
                  const statusInfo = STATUS_OPTIONS.find(s => s.value === req.status);
                  return (
                    <TableRow key={req.id}>
                      <TableCell>{req.user_name || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-left">{req.whatsapp}</TableCell>
                      <TableCell>{TYPE_LABELS[req.consultation_type] || req.consultation_type}</TableCell>
                      <TableCell>
                        <Select value={req.status} onValueChange={(val) => updateStatus(req.id, val)}>
                          <SelectTrigger className="w-32 h-8">
                            <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(req.created_at).toLocaleDateString("ar-SA")}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedRequest(req); setAdminNotes(req.notes || ""); }}
                        >
                          تفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>معلومات طلب الاستشارة</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3 text-sm">
              <p><strong>الاسم:</strong> {selectedRequest.user_name || "—"}</p>
              <p><strong>واتساب:</strong> <span dir="ltr">{selectedRequest.whatsapp}</span></p>
              <p><strong>النوع:</strong> {TYPE_LABELS[selectedRequest.consultation_type]}</p>
              <p><strong>التاريخ:</strong> {new Date(selectedRequest.created_at).toLocaleString("ar-SA")}</p>
              {selectedRequest.report_link && (
                <p><strong>رابط التقرير:</strong> <a href={selectedRequest.report_link} target="_blank" rel="noreferrer" className="text-primary underline">فتح</a></p>
              )}
              <div className="space-y-1">
                <strong>ملاحظات:</strong>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} maxLength={1000} />
              </div>
              <Button onClick={saveNotes} className="w-full">حفظ الملاحظات</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

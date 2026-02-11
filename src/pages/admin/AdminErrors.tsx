import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminErrors() {
  const [routeFilter, setRouteFilter] = useState("");
  const [selectedError, setSelectedError] = useState<any>(null);

  const { data: errors, isLoading } = useQuery({
    queryKey: ["admin-error-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const filtered = errors?.filter(e =>
    !routeFilter || (e.route && e.route.toLowerCase().includes(routeFilter.toLowerCase()))
  ) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" /> سجل الأخطاء
      </h1>

      <div className="flex gap-4 items-end">
        <div className="space-y-1 flex-1 max-w-xs">
          <Input
            placeholder="فلتر حسب المسار..."
            value={routeFilter}
            onChange={e => setRouteFilter(e.target.value)}
            dir="ltr"
          />
        </div>
        <Badge variant="outline">{filtered.length} خطأ</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المسار</TableHead>
                <TableHead className="text-right">الرسالة</TableHead>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">تفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(err => (
                <TableRow key={err.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(err.created_at).toLocaleString("ar")}</TableCell>
                  <TableCell className="font-mono text-xs">{err.route || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">{err.error_message}</TableCell>
                  <TableCell className="font-mono text-xs">{err.user_id ? err.user_id.slice(0, 8) + "..." : "—"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedError(err)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد أخطاء مسجلة</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل الخطأ</DialogTitle></DialogHeader>
          {selectedError && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold">الرسالة:</p>
                <p className="text-destructive">{selectedError.error_message}</p>
              </div>
              <div>
                <p className="font-semibold">المسار:</p>
                <p className="font-mono text-xs">{selectedError.route || "—"}</p>
              </div>
              <div>
                <p className="font-semibold">المستخدم:</p>
                <p className="font-mono text-xs">{selectedError.user_id || "—"}</p>
              </div>
              <div>
                <p className="font-semibold">التاريخ:</p>
                <p>{new Date(selectedError.created_at).toLocaleString("ar")}</p>
              </div>
              {selectedError.stack && (
                <div>
                  <p className="font-semibold">Stack:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono" dir="ltr">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
              {selectedError.meta && Object.keys(selectedError.meta).length > 0 && (
                <div>
                  <p className="font-semibold">Meta:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono" dir="ltr">
                    {JSON.stringify(selectedError.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

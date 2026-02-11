import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Loader2, Mail, Webhook, CheckCircle2, XCircle, Save } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  consultation_new: "طلب استشارة جديد",
  school_activation: "تفعيل كود مدرسي",
};

export default function AdminNotifications() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["notifications-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="w-6 h-6" /> إعدادات الإشعارات
      </h1>

      <div className="space-y-4">
        {settings?.map((s) => (
          <SettingCard key={s.id} setting={s} onSaved={() => qc.invalidateQueries({ queryKey: ["notification-settings"] })} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل الإشعارات (آخر 50)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الحدث</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">بريد</TableHead>
                <TableHead className="text-right">ويب هوك</TableHead>
                <TableHead className="text-right">خطأ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{EVENT_LABELS[log.event_key] || log.event_key}</TableCell>
                  <TableCell className="text-xs">{new Date(log.created_at).toLocaleString("ar")}</TableCell>
                  <TableCell>
                    {log.sent_email ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell>
                    {log.sent_webhook ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[200px] truncate">{log.error || "—"}</TableCell>
                </TableRow>
              ))}
              {!logs?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد إشعارات بعد</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingCard({ setting, onSaved }: { setting: any; onSaved: () => void }) {
  const [emailTo, setEmailTo] = useState(setting.email_to || "");
  const [webhookUrl, setWebhookUrl] = useState(setting.webhook_url || "");
  const [enabled, setEnabled] = useState(setting.is_enabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("notification_settings")
      .update({
        email_to: emailTo.trim() || null,
        webhook_url: webhookUrl.trim() || null,
        is_enabled: enabled,
      })
      .eq("id", setting.id);
    setSaving(false);
    if (error) {
      toast.error("خطأ في الحفظ");
    } else {
      toast.success("تم الحفظ");
      onSaved();
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={enabled ? "default" : "secondary"}>
              {EVENT_LABELS[setting.key] || setting.key}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`toggle-${setting.id}`} className="text-sm">مفعّل</Label>
            <Switch
              id={`toggle-${setting.id}`}
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              <Mail className="w-3 h-3" /> البريد الإلكتروني
            </Label>
            <Input
              placeholder="team@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              dir="ltr"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">يمكن إضافة عدة عناوين مفصولة بفاصلة</p>
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              <Webhook className="w-3 h-3" /> Webhook URL
            </Label>
            <Input
              placeholder="https://hooks.slack.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              dir="ltr"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Slack / Make / Zapier webhook</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          حفظ
        </Button>
      </CardContent>
    </Card>
  );
}

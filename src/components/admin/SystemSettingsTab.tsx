import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SystemSetting {
  setting_key: string;
  is_enabled: boolean;
}

const SETTING_LABELS: Record<string, string> = {
  show_videos: "عرض الفيديوهات التعليمية",
  allow_registration: "السماح بالتسجيل",
  show_simulation: "عرض المحاكاة المهنية",
  show_certificate: "عرض الشهادة",
};

export default function SystemSettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("system_settings").select("*");
      setSettings((data as any[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (key: string, current: boolean) => {
    const { error } = await supabase
      .from("system_settings")
      .update({ is_enabled: !current } as any)
      .eq("setting_key", key);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, is_enabled: !current } : s));
      toast({ title: `تم ${!current ? "تفعيل" : "تعطيل"} ${SETTING_LABELS[key] ?? key}` });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">إعدادات النظام</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((s) => (
          <div key={s.setting_key} className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium">{SETTING_LABELS[s.setting_key] ?? s.setting_key}</p>
              <p className="text-xs text-muted-foreground">{s.setting_key}</p>
            </div>
            <Switch
              checked={s.is_enabled}
              onCheckedChange={() => handleToggle(s.setting_key, s.is_enabled)}
            />
          </div>
        ))}
        {settings.length === 0 && (
          <p className="text-center text-muted-foreground py-4">لا توجد إعدادات</p>
        )}
      </CardContent>
    </Card>
  );
}

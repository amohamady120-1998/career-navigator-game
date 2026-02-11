import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import atharLogoLight from "@/assets/athar-logo-light.png";

export default function VerifyCertificate() {
  const { code } = useParams<{ code: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-certificate", code],
    queryFn: async () => {
      if (!code) throw new Error("No code");
      // Query the public view
      const { data, error } = await supabase
        .from("certificate_verification")
        .select("certificate_code, full_name, issued_at")
        .eq("certificate_code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <img src={atharLogoLight} alt="أثر البداية" className="h-12 mx-auto mb-4" />

        {data ? (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-xl font-bold text-success">شهادة صحيحة ✓</h1>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">الاسم:</span>{" "}
                {data.full_name || "غير محدد"}
              </p>
              <p>
                <span className="font-semibold text-foreground">تاريخ الإصدار:</span>{" "}
                {new Date(data.issued_at).toLocaleDateString("ar-SA", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
              <p>
                <span className="font-semibold text-foreground">رمز التحقق:</span>{" "}
                <span className="font-mono">{data.certificate_code}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
              تم التحقق من هذه الشهادة بواسطة منصة أثر البداية
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-destructive">رمز غير صحيح</h1>
            <p className="text-sm text-muted-foreground">
              لم يتم العثور على شهادة بهذا الرمز. تأكد من صحة الرابط أو الرمز المستخدم.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail } from "lucide-react";

const TEAM_WHATSAPP = "966563872949";
const TEAM_EMAIL = "support@athar.sa";

export default function ContactSupportCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">تحتاج مساعدة؟</p>
          <p className="text-xs text-muted-foreground">تواصل مع فريق الدعم</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${TEAM_WHATSAPP}?text=${encodeURIComponent("مرحباً، أحتاج مساعدة بخصوص لوحة المؤسسة")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white">
              <MessageCircle className="w-3.5 h-3.5" />
              واتساب
            </Button>
          </a>
          <a href={`mailto:${TEAM_EMAIL}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              بريد إلكتروني
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

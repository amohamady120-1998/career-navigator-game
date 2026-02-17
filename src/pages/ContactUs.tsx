import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import atharLogoLight from "@/assets/athar-logo-light.png";

const TEAM_WHATSAPP = "966563872949";
const TEAM_EMAIL = "support@athar.sa";

export default function ContactUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 relative overflow-hidden" dir="rtl">
      <div className="absolute top-20 right-20 w-80 h-80 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-3">
            <img src={atharLogoLight} alt="أثر" className="h-14 mx-auto object-contain" />
            <CardTitle className="text-xl">تواصل معنا</CardTitle>
            <CardDescription>نسعد بخدمتك! اختر الطريقة المناسبة للتواصل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href={`https://wa.me/${TEAM_WHATSAPP}?text=${encodeURIComponent("مرحباً، أحتاج مساعدة بخصوص منصة أثر البداية")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full h-12 rounded-xl text-base gap-2 bg-[#25D366] hover:bg-[#1da851] text-white">
                <MessageCircle className="w-5 h-5" />
                واتساب
              </Button>
            </a>

            <a href={`mailto:${TEAM_EMAIL}`} className="block">
              <Button variant="outline" className="w-full h-12 rounded-xl text-base gap-2">
                <Mail className="w-5 h-5" />
                {TEAM_EMAIL}
              </Button>
            </a>

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

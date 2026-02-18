import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TEAM_WHATSAPP = "966563872949";
const TEAM_EMAIL = "support@athar.sa";

const FAQ = [
  { q: "كيف أضيف طلاب جدد؟", a: "من لوحة التحكم الرئيسية، أدخل اسم المدرسة واضغط 'جلب بيانات الطلاب' لربط الطلاب المسجلين." },
  { q: "كيف أوزع أكواد التفعيل؟", a: "من صفحة أكواد التفعيل، يمكنك نسخ الأكواد المتاحة ومشاركتها مع الطلاب." },
  { q: "هل يمكنني تصدير بيانات الطلاب؟", a: "نعم، من صفحة الطلاب يمكنك تصدير البيانات بصيغة CSV." },
  { q: "ماذا أفعل إذا نفدت الأكواد؟", a: "تواصل مع فريق الدعم لطلب أكواد إضافية أو توسيع الاشتراك." },
];

export default function InstitutionSupportPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">الدعم والمساعدة</h1>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تواصل مع فريق الدعم</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${TEAM_WHATSAPP}?text=${encodeURIComponent("مرحباً، أحتاج مساعدة بخصوص لوحة المؤسسة")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white">
              <MessageCircle className="w-4 h-4" />واتساب
            </Button>
          </a>
          <a href={`mailto:${TEAM_EMAIL}`}>
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />بريد إلكتروني
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />الأسئلة الشائعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-right">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

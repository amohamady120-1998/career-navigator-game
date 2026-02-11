import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">سياسة الخصوصية</h1>
          <p className="text-muted-foreground">آخر تحديث: فبراير 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">مقدمة</h2>
            <p>
              نحن ملتزمون بحماية خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام بيانات. عند استخدام منصتنا، فإنك توافق على
              ممارسات الخصوصية هذه.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">البيانات التي نجمعها</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-2">معلومات الحساب</h3>
                <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
                  <li>البريد الإلكتروني</li>
                  <li>الاسم الكامل</li>
                  <li>رقم الهاتف (اختياري)</li>
                  <li>المدرسة/الجامعة (اختياري)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">بيانات التقييم</h3>
                <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
                  <li>إجاباتك على اختبار Holland (RIASEC)</li>
                  <li>تقييمات الأثر القبلي والبعدي</li>
                  <li>استجابات المحاكاة والسيناريوهات</li>
                  <li>تفضيلات التخصصات</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">بيانات التقدم</h3>
                <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
                  <li>مراحل الرحلة التي أكملتها</li>
                  <li>وقت الإكمال</li>
                  <li>التقارير والشهادات</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">طلبات الاستشارة</h3>
                <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
                  <li>نوع الاستشارة المطلوبة</li>
                  <li>الملاحظات والتعليقات</li>
                  <li>معلومات الاتصال</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">بيانات التفعيل</h3>
                <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
                  <li>أكواد المدرسة المستخدمة</li>
                  <li>تاريخ التفعيل</li>
                  <li>معرف المدرسة</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">كيف نستخدم بيانات</h2>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li>توليد التقارير الشخصية والتوصيات الأكاديمية</li>
              <li>تتبع تقدمك عبر رحلة الاستكشاف الوظيفي</li>
              <li>تحسين جودة المحتوى والتقييمات بناءً على البيانات المجمعة</li>
              <li>إرسال إشعارات الاستشارة والدعم</li>
              <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
              <li>تحليل أداء النظام والأمان</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">مشاركة البيانات</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">مع الوالدين:</strong> إذا كان حسابك مرتبطاً بحساب والد، يمكن للوالد الاطلاع على
                تقدمك والتقارير الخاصة بك.
              </p>
              <p>
                <strong className="text-foreground">مع المدارس/الجامعات:</strong> إذا فعلت كود المدرسة، يمكن لإداريي المدرسة
                الاطلاع على الإحصائيات الإجمالية فقط (بدون بيانات شخصية).
              </p>
              <p>
                <strong className="text-foreground">روابط المشاركة:</strong> عندما تشارك تقريرك برابط، يمكن لأي شخص لديه الرابط
                الاطلاع على التقرير. يمكنك إلغاء الرابط في أي وقت.
              </p>
              <p>
                <strong className="text-foreground">لن نشارك بيانات:</strong> لن نبيع أو نشارك بيانات مع جهات خارجية إلا بموافقتك
                الصريحة أو إذا كان مطلوباً قانوناً.
              </p>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">حماية البيانات</h2>
            <p className="text-muted-foreground mb-3">
              نستخدم تشفيراً قياسياً لحماية بيانات أثناء النقل والتخزين. لكن لا توجد طريقة آمنة 100٪ عبر الإنترنت.
            </p>
            <p className="text-muted-foreground">
              يُنصح بك بحماية كلمة مرورك وعدم مشاركتها مع أحد، وتسجيل الخروج من حسابك عند الانتهاء.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">حقوقك</h2>
            <p className="text-muted-foreground mb-3">لك الحق في:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li>الوصول إلى بيانات الشخصية</li>
              <li>طلب تصحيح البيانات غير الدقيقة</li>
              <li>طلب حذف حسابك وبيانات (مع بعض الاستثناءات)</li>
              <li>الاعتراض على معالجة بيانات</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">التواصل</h2>
            <p className="text-muted-foreground mb-3">
              إذا كان لديك أسئلة حول سياسة الخصوصية هذه أو ممارسات الخصوصية الخاصة، يرجى التواصل معنا:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">البريد الإلكتروني:</span> support@athar.com
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">WhatsApp:</span> +966563872949
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">التغييرات على السياسة</h2>
            <p className="text-muted-foreground">
              قد نحدث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية بنشر السياسة الجديدة على هذه الصفحة.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            العودة للمنصة
          </Button>
        </div>
      </div>
    </div>
  );
}

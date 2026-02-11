import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">الشروط والأحكام</h1>
          <p className="text-muted-foreground">آخر تحديث: فبراير 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground leading-relaxed">
          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">الموافقة على الشروط</h2>
            <p className="text-muted-foreground">
              باستخدام هذه المنصة، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم
              استخدام المنصة.
            </p>
          </section>

          {/* Usage */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">شروط الاستخدام</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">أنت توافق على:</h3>
                <ul className="list-disc pr-6 space-y-1">
                  <li>استخدام المنصة فقط للأغراض القانونية والمسموحة</li>
                  <li>عدم انتهاك حقوق الآخرين</li>
                  <li>عدم محاولة الوصول غير المصرح إلى أنظمتنا</li>
                  <li>عدم نسخ أو توزيع محتوى المنصة بدون إذن</li>
                  <li>تقديم معلومات دقيقة وحديثة</li>
                  <li>عدم الانخراط في أنشطة تعطل خدمة المنصة</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">المحظورات:</h3>
                <ul className="list-disc pr-6 space-y-1">
                  <li>الاحتيال أو الخداع</li>
                  <li>الإساءة أو التحرش برفع أو موظفي الفريق</li>
                  <li>نشر محتوى غير قانوني أو مسيء</li>
                  <li>اختراق الحسابات الأخرى</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">الحسابات</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                أنت مسؤول عن الحفاظ على سرية كلمة المرور وعن جميع الأنشطة التي تحدث تحت حسابك.
              </p>
              <p>
                يجب عليك إبلاغنا فوراً عن أي استخدام غير مصرح لحسابك. لن نكون مسؤولين عن أي خسائر تنجم عن عدم حماية كلمة
                المرور الخاصة بك.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">الملكية الفكرية</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                جميع محتوى المنصة (الاختبارات والتقارير والفيديوهات) محمي بموجب قوانين الملكية الفكرية. لا يمكنك نسخ أو توزيع
                هذا المحتوى بدون إذن كتابي.
              </p>
              <p>
                عند إرسال محتوى إلى المنصة، فإنك تمنحنا ترخيصاً لاستخدامه لتحسين خدمتنا.
              </p>
            </div>
          </section>

          {/* Assessment Accuracy */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">دقة التقييمات</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                اختبارات وتقارير هذه المنصة موجهة للتوجيه والاستكشاف. لا تعتبر بديلاً لنصيحة مهنية من مستشار متخصص.
              </p>
              <p>
                النتائج تعتمد على إجابات صادقة وصحيحة. إذا لم تكن الإجابات دقيقة، قد لا تكون النتائج دقيقة.
              </p>
              <p>
                لا نضمن أن التوصيات ستؤدي إلى النتيجة المرغوبة. القرارات الأخيرة بشأن المستقبل الأكاديمي تقع على عاتقك.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">تحديد المسؤولية</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                بقدر أقصى مسموح به قانوناً، لن نكون مسؤولين عن:
              </p>
              <ul className="list-disc pr-6 space-y-1">
                <li>أي أضرار غير مباشرة أو عرضية</li>
                <li>فقدان البيانات أو الإيرادات</li>
                <li>توقف الخدمة</li>
                <li>أخطاء أو عيوب في المحتوى</li>
              </ul>
            </div>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">إخلاء المسؤولية</h2>
            <div className="bg-muted/50 p-4 rounded-lg text-muted-foreground">
              <p>
                تُقدَّم المنصة "كما هي" بدون ضمانات من أي نوع، سواء صريحة أو ضمنية. لا نضمن أن المنصة خالية من الأخطاء أو أن
                الخدمة ستكون دون انقطاع.
              </p>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">الدفع والرسوم</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                بعض الخدمات قد تتطلب دفع رسوم. عند الدفع، فإنك توافق على الشروط المرتبطة بتلك الخدمة.
              </p>
              <p>
                جميع الدفعات نهائية ولا يمكن استرجاعها إلا في الحالات المسموح بها قانوناً.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">إنهاء الحساب</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                يمكنك حذف حسابك في أي وقت من إعدادات الحساب.
              </p>
              <p>
                قد نحذف حسابك إذا انتهكت هذه الشروط أو قوانين تطبيقية.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">التغييرات على الشروط</h2>
            <p className="text-muted-foreground">
              قد نعدل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية. الاستخدام المستمر للمنصة يعني قبولك للشروط الجديدة.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">القانون المنطبق</h2>
            <p className="text-muted-foreground">
              تحكم هذه الشروط قوانين المملكة العربية السعودية. أي نزاع ينشأ عن هذه الشروط يجب حله وفقاً لقوانينها.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">التواصل</h2>
            <p className="text-muted-foreground mb-3">
              إذا كان لديك أسئلة حول هذه الشروط، يرجى التواصل معنا:
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

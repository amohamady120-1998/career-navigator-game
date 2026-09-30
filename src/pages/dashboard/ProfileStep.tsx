import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { HeroBand } from "@/components/HeroBand";


const GRADE_OPTIONS = [
  { value: "الصف الأول ثانوي", label: "الصف الأول ثانوي" },
  { value: "الصف الثاني ثانوي", label: "الصف الثاني ثانوي" },
  { value: "الصف الثالث ثانوي", label: "الصف الثالث ثانوي" },
];

export default function ProfileStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !gradeLevel) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          school_name: schoolName.trim(),
          grade_level: gradeLevel,
          phone: phone.trim() || null,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({ title: "تم حفظ البيانات بنجاح" });
      navigate("/dashboard/payment", { replace: true });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="athar-page"
    >
      <HeroBand
        eyebrow="لنتعرّف عليك"
        title="معلومات أساسية"
        description="نستخدمها لتخصيص رحلتك وربط تقاريرك بمدرستك. تبقى بياناتك خاصة."
      />

      <form onSubmit={handleSubmit} className="athar-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-[7px]">
            <Label htmlFor="schoolName" className="text-[0.86rem] font-bold">اسم المدرسة *</Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="مثال: مدارس الرياض الأهلية"
              required
              className="athar-field"
            />
          </div>

          <div className="space-y-[7px]">
            <Label className="text-[0.86rem] font-bold">المرحلة الدراسية *</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel} required>
              <SelectTrigger className="athar-field">
                <SelectValue placeholder="اختر المرحلة" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 space-y-[7px]">
          <Label htmlFor="phone" className="text-[0.86rem] font-bold">رقم الجوال (اختياري)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XXXXXXXX"
            dir="ltr"
            className="athar-field text-left"
          />
        </div>

        <div className="athar-foot justify-end">
          <Button
            type="submit"
            disabled={loading || !schoolName.trim() || !gradeLevel}
            className="btn-gradient h-auto rounded-xl px-[26px] py-3.5 text-base shadow-premium"
          >
            {loading ? "جارٍ الحفظ..." : "حفظ وبدء الرحلة"}
            {!loading && <ChevronLeft className="h-[17px] w-[17px]" />}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

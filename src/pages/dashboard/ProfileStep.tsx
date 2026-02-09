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
import atharLogoLight from "@/assets/athar-logo-light.png";

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
      navigate("/dashboard/intro", { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card rounded-xl p-8 shadow-2xl"
      >
        <img src={atharLogoLight} alt="أثر البداية" className="h-16 mx-auto mb-2 object-contain" />
        <h2 className="text-xl font-bold text-center mb-1">أكمل بياناتك</h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          نحتاج بعض المعلومات قبل بدء الرحلة
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="schoolName">اسم المدرسة *</Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="مثال: مدرسة الملك فهد"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>المرحلة الدراسية *</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel} required>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="text-left"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !schoolName.trim() || !gradeLevel}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg h-12"
          >
            {loading ? "جاري الحفظ..." : "متابعة"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

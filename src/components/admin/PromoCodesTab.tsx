import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

export default function PromoCodesTab() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleAdd = async () => {
    if (!newCode.trim() || !newDiscount) return;
    const discount = parseInt(newDiscount);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      toast({ title: "نسبة الخصم يجب أن تكون بين 1 و 100", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("promo_codes").insert({
      code: newCode.trim().toUpperCase(),
      discount_percentage: discount,
    } as any);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تمت إضافة كود الخصم ✓" });
      setNewCode("");
      setNewDiscount("");
      fetchCodes();
    }
    setAdding(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("promo_codes")
      .update({ is_active: !currentActive } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setCodes(prev => prev.filter(c => c.id !== id));
      toast({ title: "تم الحذف" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">إدارة أكواد الخصم</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new code */}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">الكود</label>
            <Input
              placeholder="مثال: ATHAR50"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              dir="ltr"
              className="text-left w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">نسبة الخصم %</label>
            <Input
              type="number"
              placeholder="50"
              value={newDiscount}
              onChange={(e) => setNewDiscount(e.target.value)}
              dir="ltr"
              className="text-left w-24"
              min={1}
              max={100}
            />
          </div>
          <Button onClick={handleAdd} disabled={adding || !newCode.trim() || !newDiscount} className="gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الخصم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell dir="ltr" className="text-left font-mono">{c.code}</TableCell>
                  <TableCell>{c.discount_percentage}%</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${c.is_active ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}`}>
                      {c.is_active ? "فعّال" : "معطّل"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(c.id, c.is_active)}>
                        {c.is_active ? <ToggleRight className="w-4 h-4 text-[hsl(var(--success))]" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد أكواد خصم</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

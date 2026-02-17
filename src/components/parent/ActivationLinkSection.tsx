import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link2, Copy, Check, Ban, Loader2, MessageCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface TokenRow {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

function generateToken(length = 28): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export default function ActivationLinkSection() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("parent_activation_tokens")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setTokens((data as TokenRow[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("parent_activation_tokens").insert({
        parent_user_id: user.id,
        token,
        expires_at: expiresAt,
      });

      if (error) throw error;

      const link = `${window.location.origin}/activate/parent/${token}`;
      setNewLink(link);
      await loadTokens();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase
      .from("parent_activation_tokens")
      .update({ status: "revoked" })
      .eq("id", id);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إلغاء الرابط" });
      await loadTokens();
    }
  };

  const handleCopy = () => {
    if (!newLink) return;
    navigator.clipboard.writeText(newLink);
    setCopied(true);
    toast({ title: "تم النسخ ✓" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!newLink) return;
    const text = encodeURIComponent(`مرحباً! استخدم هذا الرابط لتفعيل اشتراكك في أثر البداية:\n${newLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">نشط</Badge>;
      case "used":
        return <Badge variant="secondary">مُستخدم</Badge>;
      case "revoked":
        return <Badge variant="destructive">ملغي</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-muted-foreground">منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="border-2 border-accent/30 shadow-lg">
        <CardHeader className="bg-primary/5 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Link2 className="w-6 h-6" />
            رابط تفعيل للطالب
          </CardTitle>
          <CardDescription>
            أنشئ رابط تفعيل وأرسله لابنك/ابنتك لربط حسابهم بحسابك
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إنشاء رابط تفعيل
          </Button>

          {/* Token list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : tokens.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">الروابط السابقة</p>
              {tokens.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 gap-2"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(t.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono" dir="ltr">
                      ...{t.token.slice(-8)}
                    </p>
                  </div>
                  {t.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0 gap-1"
                      onClick={() => handleRevoke(t.id)}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      إلغاء
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              لم يتم إنشاء أي روابط بعد
            </p>
          )}
        </CardContent>
      </Card>

      {/* New link dialog */}
      <Dialog open={!!newLink} onOpenChange={() => setNewLink(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-accent" />
              تم إنشاء الرابط
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-mono break-all" dir="ltr">{newLink}</p>
            </div>
            <p className="text-xs text-muted-foreground">صالح لمدة 72 ساعة</p>
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1 gap-2" variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </Button>
              <Button onClick={handleWhatsApp} className="flex-1 gap-2 bg-[#25D366] hover:bg-[#1da851] text-white">
                <MessageCircle className="w-4 h-4" />
                واتساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, ShieldPlus, ShieldMinus, Users } from "lucide-react";

interface UserResult {
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  school_name: string | null;
  has_paid: boolean;
  roles: string[];
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "مشرف عام" },
  { value: "moderator", label: "مشرف" },
  { value: "user", label: "مستخدم" },
];

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  admin: "destructive",
  moderator: "default",
  user: "secondary",
};

const TYPE_LABELS: Record<string, string> = {
  student: "طالب",
  parent: "ولي أمر",
  institution: "مؤسسة",
};

export default function AdminUsersTab() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const searchUsers = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "search", query: query.trim(), page: 1 },
      });
      if (error) throw error;
      setUsers(data?.results || []);
    } catch (e: any) {
      toast.error(e.message || "خطأ في البحث");
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-add`);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "add_role", user_id: userId, role },
      });
      if (error) throw error;
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, roles: [...u.roles, role] } : u
      ));
      toast.success("تم إضافة الدور");
    } catch (e: any) {
      toast.error(e.message || "خطأ");
    } finally {
      setActionLoading(null);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-${role}`);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "remove_role", user_id: userId, role },
      });
      if (error) throw error;
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, roles: u.roles.filter(r => r !== role) } : u
      ));
      toast.success("تم إزالة الدور");
    } catch (e: any) {
      toast.error(e.message || "خطأ");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6" />
        <h2 className="text-xl font-bold">إدارة المستخدمين</h2>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="بحث بالبريد الإلكتروني أو المعرف..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && searchUsers()}
          dir="ltr"
          className="max-w-md"
        />
        <Button onClick={searchUsers} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 ml-1" />}
          بحث
        </Button>
      </div>

      {searched && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الدفع</TableHead>
                  <TableHead className="text-right">الأدوار</TableHead>
                  <TableHead className="text-right">إضافة دور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{u.full_name || "—"}</p>
                        <p className="font-mono text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[u.user_type || ""] || u.user_type || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.has_paid ? "default" : "secondary"}>
                        {u.has_paid ? "مدفوع" : "مجاني"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length === 0 && <span className="text-xs text-muted-foreground">لا أدوار</span>}
                        {u.roles.map(role => (
                          <Badge
                            key={role}
                            variant={ROLE_COLORS[role] || "secondary"}
                            className="gap-1 cursor-pointer hover:opacity-80"
                            onClick={() => removeRole(u.user_id, role)}
                          >
                            {ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                            {actionLoading === `${u.user_id}-${role}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShieldMinus className="w-3 h-3" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleAdder
                        currentRoles={u.roles}
                        onAdd={(role) => addRole(u.user_id, role)}
                        loading={actionLoading === `${u.user_id}-add`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {loading ? "جاري البحث..." : "لا توجد نتائج — ابحث بالبريد الإلكتروني"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoleAdder({ currentRoles, onAdd, loading }: { currentRoles: string[]; onAdd: (role: string) => void; loading: boolean }) {
  const [selected, setSelected] = useState("");
  const available = ROLE_OPTIONS.filter(r => !currentRoles.includes(r.value));

  if (!available.length) return <span className="text-xs text-muted-foreground">كل الأدوار</span>;

  return (
    <div className="flex gap-1 items-center">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder="اختر..." />
        </SelectTrigger>
        <SelectContent>
          {available.map(r => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        disabled={!selected || loading}
        onClick={() => { onAdd(selected); setSelected(""); }}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldPlus className="w-3 h-3" />}
      </Button>
    </div>
  );
}

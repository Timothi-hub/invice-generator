import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, FileText, UserSquare, AlertCircle, ShieldCheck, RefreshCw, Download, Trash2 } from "lucide-react";

type Stats = {
  total_users: number;
  total_profiles: number;
  total_invoices: number;
  total_customers: number;
  total_saved_items: number;
  total_errors: number;
  total_admins: number;
};

type ErrorRow = {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  stack: string | null;
  source: string | null;
  url: string | null;
  user_agent: string | null;
  created_at: string;
};

type UserRow = {
  user_id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  invoice_count: number;
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const load = async () => {
    setLoading(true);
    const [statsRes, errRes, usersRes] = await Promise.all([
      supabase.rpc("admin_get_stats"),
      supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.rpc("admin_list_users"),
    ]);
    if (statsRes.error) toast.error(statsRes.error.message);
    else setStats(statsRes.data as unknown as Stats);
    if (!errRes.error) setErrors(errRes.data as ErrorRow[]);
    if (!usersRes.error) setUsers((usersRes.data as UserRow[]) || []);
    setLoading(false);
  };

  // Call admin_get_stats once — this also bootstraps first admin if none exists
  useEffect(() => {
    if (adminLoading) return;
    if (!bootstrapped) {
      setBootstrapped(true);
      supabase.rpc("admin_get_stats").then(() => load());
    }
  }, [adminLoading, bootstrapped]);

  if (adminLoading) {
    return (
      <AppLayout title="Admin">
        <p className="text-muted-foreground">Checking access...</p>
      </AppLayout>
    );
  }

  // After bootstrap attempt, if still not admin, redirect
  if (bootstrapped && !isAdmin && stats === null && !loading) {
    // Not admin and RPC failed
    return <Navigate to="/" replace />;
  }

  const downloadErrors = () => {
    const text = errors
      .map(
        (e) =>
          `[${e.created_at}] (${e.type}) user=${e.user_id ?? "-"}\n  ${e.message}\n` +
          (e.source ? `  source: ${e.source}\n` : "") +
          (e.url ? `  url: ${e.url}\n` : "") +
          (e.stack ? `  stack: ${e.stack}\n` : "")
      )
      .join("\n");
    const blob = new Blob([text || "No errors."], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-error-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearErrors = async () => {
    if (!confirm("Delete ALL error logs?")) return;
    const { error } = await supabase.from("error_logs").delete().not("id", "is", null);
    if (error) return toast.error(error.message);
    toast.success("Errors cleared");
    load();
  };

  return (
    <AppLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Total Users" value={stats?.total_users ?? "—"} icon={Users} color="bg-blue-600" />
          <StatCard label="Admins" value={stats?.total_admins ?? "—"} icon={ShieldCheck} color="bg-emerald-600" />
          <StatCard label="Invoices" value={stats?.total_invoices ?? "—"} icon={FileText} color="bg-violet-600" />
          <StatCard label="Customers" value={stats?.total_customers ?? "—"} icon={UserSquare} color="bg-amber-600" />
          <StatCard label="Saved Items" value={stats?.total_saved_items ?? "—"} icon={FileText} color="bg-teal-600" />
          <StatCard label="Errors" value={stats?.total_errors ?? "—"} icon={AlertCircle} color="bg-red-600" />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Users ({users.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2">Joined</th>
                    <th className="py-2 pr-2">Invoices</th>
                    <th className="py-2 pr-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b last:border-0">
                      <td className="py-2 pr-2">{u.email}</td>
                      <td className="py-2 pr-2">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-2">{u.invoice_count}</td>
                      <td className="py-2 pr-2">
                        {u.is_admin ? (
                          <span className="text-xs font-semibold text-emerald-600">ADMIN</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">user</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" /> Error Logs ({errors.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={downloadErrors} disabled={errors.length === 0}>
                <Download className="w-4 h-4 mr-1" /> Download .txt
              </Button>
              <Button variant="destructive" size="sm" onClick={clearErrors} disabled={errors.length === 0}>
                <Trash2 className="w-4 h-4 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No errors reported.</p>
            ) : (
              <ScrollArea className="h-[60vh] pr-3">
                <div className="space-y-3">
                  {errors.map((e) => (
                    <div key={e.id} className="border rounded-md p-3 bg-muted/30 text-sm font-mono">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-red-600">[{e.type}]</span>
                        {e.user_id && <span className="text-xs text-muted-foreground">user: {e.user_id.slice(0, 8)}…</span>}
                      </div>
                      <div className="break-words whitespace-pre-wrap">{e.message}</div>
                      {e.source && <div className="text-xs text-muted-foreground mt-1">source: {e.source}</div>}
                      {e.url && <div className="text-xs text-muted-foreground truncate">url: {e.url}</div>}
                      {e.stack && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground">Stack</summary>
                          <pre className="text-xs mt-1 whitespace-pre-wrap break-words text-muted-foreground">{e.stack}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
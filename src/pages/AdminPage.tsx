import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, FileText, UserSquare, AlertCircle, ShieldCheck, RefreshCw, Download, Trash2, UserPlus, UserMinus, CalendarClock, Search, Save, Activity, DatabaseBackup, Upload } from "lucide-react";

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
  last_sign_in_at: string | null;
  is_admin: boolean;
  invoice_count: number;
  expires_at: string | null;
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
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [expiryFilter, setExpiryFilter] = useState<"all" | "active" | "expired" | "none">("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "email" | "invoices" | "expiry" | "active">("created_desc");
  // per-row draft expiry values (yyyy-mm-dd) keyed by user_id
  const [expiryDrafts, setExpiryDrafts] = useState<Record<string, string>>({});
  const [savingExpiry, setSavingExpiry] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    | null
    | { kind: "revoke" | "delete" | "clear-errors"; user?: UserRow }
  >(null);
  const [lastRevoked, setLastRevoked] = useState<UserRow | null>(null);
  const [busyBackup, setBusyBackup] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<UserRow | null>(null);

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

  const filteredUsers = useMemo(() => {
    const now = Date.now();
    let out = users.filter((u) => {
      if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter === "admin" && !u.is_admin) return false;
      if (roleFilter === "user" && u.is_admin) return false;
      if (expiryFilter === "none" && u.expires_at) return false;
      if (expiryFilter === "active" && (!u.expires_at || new Date(u.expires_at).getTime() < now)) return false;
      if (expiryFilter === "expired" && (!u.expires_at || new Date(u.expires_at).getTime() >= now)) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return +new Date(a.created_at) - +new Date(b.created_at);
        case "email":
          return a.email.localeCompare(b.email);
        case "invoices":
          return b.invoice_count - a.invoice_count;
        case "expiry":
          return (a.expires_at ? +new Date(a.expires_at) : Infinity) - (b.expires_at ? +new Date(b.expires_at) : Infinity);
        case "active":
          return (b.last_sign_in_at ? +new Date(b.last_sign_in_at) : 0) - (a.last_sign_in_at ? +new Date(a.last_sign_in_at) : 0);
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });
    return out;
  }, [users, search, roleFilter, expiryFilter, sortBy]);

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
    const { error } = await supabase.from("error_logs").delete().not("id", "is", null);
    if (error) return toast.error(error.message);
    toast.success("Errors cleared");
    load();
  };

  const grantAdmin = async () => {
    const email = grantEmail.trim();
    if (!email) return;
    const { error } = await (supabase.rpc as any)("admin_grant_admin_by_email", { _email: email });
    if (error) return toast.error(error.message);
    toast.success(`Granted admin to ${email}`);
    setGrantEmail("");
    load();
  };

  const revokeAdmin = async (u: UserRow) => {
    const { error } = await (supabase.rpc as any)("admin_revoke_admin", { _user_id: u.user_id });
    if (error) return toast.error(error.message);
    setLastRevoked(u);
    toast.success(`Admin revoked from ${u.email}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const { error: e2 } = await (supabase.rpc as any)("admin_grant_admin_by_email", { _email: u.email });
          if (e2) return toast.error(e2.message);
          toast.success("Admin restored");
          load();
        },
      },
      duration: 8000,
    });
    load();
  };

  const makeAdmin = async (u: UserRow) => {
    const { error } = await (supabase.rpc as any)("admin_grant_admin_by_email", { _email: u.email });
    if (error) return toast.error(error.message);
    toast.success("Granted admin");
    load();
  };

  const deleteUser = async (u: UserRow) => {
    const { error } = await (supabase.rpc as any)("admin_delete_user", { _user_id: u.user_id });
    if (error) return toast.error(error.message);
    toast.success("Account and all its data deleted");
    load();
  };

  const backupUser = async (u: UserRow) => {
    setBusyBackup(u.user_id);
    const { data, error } = await (supabase.rpc as any)("admin_export_user_data", { _user_id: u.user_id });
    setBusyBackup(null);
    if (error) return toast.error(error.message);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = u.email.replace(/[^a-z0-9._-]+/gi, "_");
    a.download = `backup-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Backup downloaded for ${u.email}`);
  };

  const restoreUserFromFile = async (u: UserRow, file: File) => {
    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return toast.error("Invalid JSON file");
    }
    setBusyBackup(u.user_id);
    const { data, error } = await (supabase.rpc as any)("admin_import_user_data", {
      _user_id: u.user_id,
      _data: parsed,
    });
    setBusyBackup(null);
    if (error) return toast.error(error.message);
    const r = (data ?? {}) as any;
    toast.success(
      `Restored ${u.email}: ${r.invoices ?? 0} invoices, ${r.customers ?? 0} customers, ${r.saved_items ?? 0} saved items`
    );
    load();
  };

  const saveExpiry = async (u: UserRow) => {
    const draft = expiryDrafts[u.user_id] ?? toDateInput(u.expires_at);
    let iso: string | null = null;
    if (draft) {
      const parsed = new Date(draft + "T23:59:59");
      if (isNaN(parsed.getTime())) {
        toast.error("Invalid date");
        return;
      }
      if (parsed.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        toast.error("Expiry date cannot be in the past");
        return;
      }
      iso = parsed.toISOString();
    }
    setSavingExpiry(u.user_id);
    const { error } = await (supabase.rpc as any)("admin_set_expiry", {
      _user_id: u.user_id,
      _expires_at: iso,
    });
    setSavingExpiry(null);
    if (error) return toast.error(error.message);
    toast.success(iso ? `Expiry set for ${u.email}` : `Expiry cleared for ${u.email}`);
    setExpiryDrafts((d) => {
      const n = { ...d };
      delete n[u.user_id];
      return n;
    });
    load();
  };

  const clearExpiry = async (u: UserRow) => {
    setSavingExpiry(u.user_id);
    const { error } = await (supabase.rpc as any)("admin_set_expiry", {
      _user_id: u.user_id,
      _expires_at: null,
    });
    setSavingExpiry(null);
    if (error) return toast.error(error.message);
    toast.success(`Expiry cleared for ${u.email}`);
    setExpiryDrafts((d) => {
      const n = { ...d };
      delete n[u.user_id];
      return n;
    });
    load();
  };

  const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
  const todayInput = new Date().toISOString().slice(0, 10);

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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Admin Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Grant admin privileges by email. The user must already have an account.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && grantAdmin()}
              />
              <Button onClick={grantAdmin} disabled={!grantEmail.trim()}>
                <UserPlus className="w-4 h-4 mr-1" /> Grant Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Users ({filteredUsers.length}/{users.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admins only</SelectItem>
                  <SelectItem value="user">Non-admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={expiryFilter} onValueChange={(v) => setExpiryFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Expiry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any expiry</SelectItem>
                  <SelectItem value="none">No expiry set</SelectItem>
                  <SelectItem value="active">Active (not expired)</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Newest first</SelectItem>
                  <SelectItem value="created_asc">Oldest first</SelectItem>
                  <SelectItem value="email">Email A–Z</SelectItem>
                  <SelectItem value="invoices">Most invoices</SelectItem>
                  <SelectItem value="expiry">Expiry soonest</SelectItem>
                  <SelectItem value="active">Recently active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[420px]">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2">Joined</th>
                    <th className="py-2 pr-2">Last active</th>
                    <th className="py-2 pr-2">Invoices</th>
                    <th className="py-2 pr-2">Role</th>
                    <th className="py-2 pr-2">Expires</th>
                    <th className="py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = u.user_id === currentUser?.id;
                    const expired = u.expires_at && new Date(u.expires_at).getTime() < Date.now();
                    const draft = expiryDrafts[u.user_id] ?? toDateInput(u.expires_at);
                    const dirty = draft !== toDateInput(u.expires_at);
                    return (
                      <tr key={u.user_id} className="border-b last:border-0 align-middle">
                        <td className="py-2 pr-2">{u.email}{isSelf && <span className="text-xs text-muted-foreground ml-1">(you)</span>}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Activity className="w-3 h-3 text-muted-foreground" />
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : <span className="text-muted-foreground">never</span>}
                          </span>
                        </td>
                        <td className="py-2 pr-2">{u.invoice_count}</td>
                        <td className="py-2 pr-2">
                          {u.is_admin ? (
                            <span className="text-xs font-semibold text-emerald-600">ADMIN</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">user</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-1">
                            <CalendarClock className={`w-3.5 h-3.5 ${expired ? "text-red-600" : "text-muted-foreground"}`} />
                            <Input
                              type="date"
                              value={draft}
                              min={todayInput}
                              onChange={(e) => setExpiryDrafts((d) => ({ ...d, [u.user_id]: e.target.value }))}
                              className="h-8 w-36"
                            />
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8"
                              onClick={() => saveExpiry(u)}
                              disabled={!dirty || savingExpiry === u.user_id}
                              title="Set expiry"
                            >
                              <Save className="w-3.5 h-3.5 mr-1" /> Set
                            </Button>
                            {u.expires_at && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clearExpiry(u)} disabled={savingExpiry === u.user_id} title="Clear expiry">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                          {expired && <span className="text-[10px] text-red-600 font-semibold">EXPIRED</span>}
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex gap-1">
                            {u.is_admin ? (
                              <Button variant="outline" size="sm" onClick={() => setConfirm({ kind: "revoke", user: u })} disabled={isSelf}>
                                <UserMinus className="w-3.5 h-3.5 mr-1" /> Revoke
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => makeAdmin(u)}>
                                <UserPlus className="w-3.5 h-3.5 mr-1" /> Make Admin
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" onClick={() => setConfirm({ kind: "delete", user: u })} disabled={isSelf}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => backupUser(u)}
                              disabled={busyBackup === u.user_id}
                              title="Download a JSON backup of this user's data"
                            >
                              <DatabaseBackup className="w-3.5 h-3.5 mr-1" /> Backup
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRestoreTarget(u)}
                              disabled={busyBackup === u.user_id}
                              title="Restore this user's data from a backup file"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" /> Restore
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <Button variant="destructive" size="sm" onClick={() => setConfirm({ kind: "clear-errors" })} disabled={errors.length === 0}>
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

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "revoke" && "Revoke admin privileges?"}
              {confirm?.kind === "delete" && "Permanently delete account?"}
              {confirm?.kind === "clear-errors" && "Delete all error logs?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "revoke" && (
                <>
                  <strong>{confirm.user?.email}</strong> will lose admin access. You can undo this
                  from the toast that appears after confirming.
                </>
              )}
              {confirm?.kind === "delete" && (
                <>
                  This will permanently delete <strong>{confirm.user?.email}</strong> and all of their
                  invoices, customers, and saved items. This action cannot be undone.
                </>
              )}
              {confirm?.kind === "clear-errors" && (
                <>Every entry in the error log will be removed. This cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const c = confirm;
                setConfirm(null);
                if (!c) return;
                if (c.kind === "revoke" && c.user) await revokeAdmin(c.user);
                if (c.kind === "delete" && c.user) await deleteUser(c.user);
                if (c.kind === "clear-errors") await clearErrors();
              }}
              className={confirm?.kind === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirm?.kind === "revoke" && "Revoke"}
              {confirm?.kind === "delete" && "Delete permanently"}
              {confirm?.kind === "clear-errors" && "Clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore data for {restoreTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>replace</strong> all invoices, customers, saved items, and profile
              fields for <strong>{restoreTarget?.email}</strong> with the contents of the backup
              file you choose. This cannot be undone. Select a backup JSON to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                const target = restoreTarget;
                setRestoreTarget(null);
                if (file && target) await restoreUserFromFile(target, file);
                e.target.value = "";
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AdminPage;
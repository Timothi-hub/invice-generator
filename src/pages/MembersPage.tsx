import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, UserPlus, Mail, Check, Clock } from 'lucide-react';

interface MemberRow {
  id: string;
  member_email: string;
  member_user_id: string | null;
  role: string;
  created_at: string;
}

const MembersPage = () => {
  const { user } = useAuth();
  const { refresh: refreshWorkspaces } = useWorkspace();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('account_members')
      .select('id, member_email, member_user_id, role, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load members');
    setMembers((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim()) return;
    const cleaned = email.trim().toLowerCase();
    if (cleaned === (user.email || '').toLowerCase()) {
      toast.error("You can't invite yourself");
      return;
    }
    setInviting(true);
    const { error } = await supabase.from('account_members').insert({
      owner_id: user.id,
      member_email: cleaned,
      role,
    });
    setInviting(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'This email is already invited' : error.message);
      return;
    }
    toast.success('Invitation added. They can sign in with this email to access your account.');
    setEmail('');
    load();
    refreshWorkspaces();
  };

  const updateRole = async (id: string, newRole: string) => {
    const { error } = await supabase.from('account_members').update({ role: newRole }).eq('id', id);
    if (error) return toast.error('Failed to update role');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this collaborator?')) return;
    const { error } = await supabase.from('account_members').delete().eq('id', id);
    if (error) return toast.error('Failed to remove');
    toast.success('Collaborator removed');
    load();
    refreshWorkspaces();
  };

  return (
    <AppLayout title="Collaborators">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Invite a collaborator
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Invited users can view and edit your invoices, customers, and saved items once they sign in
            with this email (Google or email/password).
          </p>
          <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor (view & edit)</SelectItem>
                  <SelectItem value="viewer">Viewer (read only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={inviting} className="w-full">Invite</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Current collaborators</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collaborators yet.</p>
          ) : (
            <ul className="divide-y">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.member_email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {m.member_user_id ? (
                        <><Check className="w-3 h-3 text-emerald-600" /> Active</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Pending sign-in</>
                      )}
                    </p>
                  </div>
                  <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)} aria-label="Remove">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default MembersPage;
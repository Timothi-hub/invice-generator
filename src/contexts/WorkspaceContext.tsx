import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Workspace {
  ownerId: string;
  label: string;
  isOwn: boolean;
  role: 'owner' | 'editor' | 'viewer';
}

interface WorkspaceContextType {
  activeOwnerId: string | null;
  workspaces: Workspace[];
  loading: boolean;
  setActiveOwnerId: (id: string) => void;
  isOwner: boolean;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};

const STORAGE_KEY = 'active_workspace_owner_id';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeOwnerId, setActiveOwnerIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveOwnerId = useCallback((id: string) => {
    setActiveOwnerIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  }, []);

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveOwnerIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Own workspace
    const list: Workspace[] = [
      { ownerId: user.id, label: 'My Account', isOwn: true, role: 'owner' },
    ];

    // Memberships where current user is the member
    const { data: memberships } = await supabase
      .from('account_members')
      .select('owner_id, role')
      .or(`member_user_id.eq.${user.id},member_email.eq.${(user.email || '').toLowerCase()}`);

    const ownerIds = (memberships || []).map((m: any) => m.owner_id).filter((id: string) => id !== user.id);

    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, company_name')
        .in('user_id', ownerIds);

      const profileMap = new Map<string, string>();
      (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p.company_name || 'Shared Account'));

      (memberships || []).forEach((m: any) => {
        if (m.owner_id === user.id) return;
        list.push({
          ownerId: m.owner_id,
          label: profileMap.get(m.owner_id) || 'Shared Account',
          isOwn: false,
          role: (m.role as Workspace['role']) || 'editor',
        });
      });
    }

    setWorkspaces(list);

    // Restore or default the active workspace
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
    const valid = saved && list.some((w) => w.ownerId === saved) ? saved : user.id;
    setActiveOwnerIdState(valid);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const isOwner = !!user && activeOwnerId === user.id;

  return (
    <WorkspaceContext.Provider
      value={{ activeOwnerId, workspaces, loading, setActiveOwnerId, isOwner, refresh: loadWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
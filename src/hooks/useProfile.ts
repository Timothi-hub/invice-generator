import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { CompanyProfile } from '@/types/invoice';

export const useProfile = () => {
  const { user } = useAuth();
  const { activeOwnerId, isOwner } = useWorkspace();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && activeOwnerId) {
      fetchProfile();
    }
  }, [user, activeOwnerId]);

  const fetchProfile = async () => {
    if (!user || !activeOwnerId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', activeOwnerId)
      .maybeSingle();

    if (data) {
      setProfile({
        companyName: data.company_name || 'Your Company',
        logoUrl: data.logo_url || undefined,
        address: data.address || '',
        phone: data.phone || '',
        website: data.website || '',
        directorName: data.director_name || '',
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<CompanyProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    if (!isOwner) return { error: new Error('Only the account owner can edit company settings') };

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: updates.companyName,
        logo_url: updates.logoUrl,
        address: updates.address,
        phone: updates.phone,
        website: updates.website,
        director_name: updates.directorName,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  return { profile, loading, updateProfile, refetch: fetchProfile, isOwner };
};

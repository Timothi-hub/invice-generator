import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface SavedItem {
  id: string;
  description: string;
  price: number;
  unit: string;
}

export const useSavedItems = () => {
  const { user } = useAuth();
  const { activeOwnerId } = useWorkspace();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user || !activeOwnerId) return;
    const { data, error } = await (supabase as any)
      .from('saved_items')
      .select('id, description, price, unit')
      .eq('user_id', activeOwnerId)
      .order('description', { ascending: true });
    if (!error && data) {
      setItems(
        data.map((d: any) => ({
          id: d.id,
          description: d.description,
          price: Number(d.price),
          unit: d.unit || 'pcs',
        }))
      );
    }
    setLoading(false);
  }, [user, activeOwnerId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const upsertItem = async (description: string, price: number, unit: string) => {
    if (!user || !activeOwnerId || !description.trim()) return;
    await (supabase as any).from('saved_items').upsert(
      {
        user_id: activeOwnerId,
        description: description.trim(),
        price,
        unit: unit || 'pcs',
      },
      { onConflict: 'user_id,description' }
    );
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await (supabase as any).from('saved_items').delete().eq('id', id);
    fetchItems();
  };

  return { items, loading, upsertItem, deleteItem, refetch: fetchItems };
};
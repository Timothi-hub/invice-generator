import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface SavedItem {
  id: string;
  description: string;
  price: number;
  unit: string;
  width?: number | null;
  height?: number | null;
  pieces?: number | null;
  mrp?: number | null;
  taxRate?: number | null;
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
      .select('id, description, price, unit, width, height, pieces, mrp, tax_rate')
      .eq('user_id', activeOwnerId)
      .order('description', { ascending: true });
    if (!error && data) {
      setItems(
        data.map((d: any) => ({
          id: d.id,
          description: d.description,
          price: Number(d.price),
          unit: d.unit || 'pcs',
          width: d.width != null ? Number(d.width) : null,
          height: d.height != null ? Number(d.height) : null,
          pieces: d.pieces != null ? Number(d.pieces) : null,
          mrp: d.mrp != null ? Number(d.mrp) : null,
          taxRate: d.tax_rate != null ? Number(d.tax_rate) : 0,
        }))
      );
    }
    setLoading(false);
  }, [user, activeOwnerId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const upsertItem = async (
    description: string,
    price: number,
    unit: string,
    extra?: {
      width?: number | null;
      height?: number | null;
      pieces?: number | null;
      mrp?: number | null;
      taxRate?: number | null;
    }
  ) => {
    if (!user || !activeOwnerId || !description.trim()) return;
    await (supabase as any).from('saved_items').upsert(
      {
        user_id: activeOwnerId,
        description: description.trim(),
        price,
        unit: unit || 'pcs',
        width: extra?.width ?? null,
        height: extra?.height ?? null,
        pieces: extra?.pieces ?? null,
        mrp: extra?.mrp ?? null,
        tax_rate: extra?.taxRate ?? 0,
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
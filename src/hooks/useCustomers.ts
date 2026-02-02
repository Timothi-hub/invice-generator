import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const useCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setCustomers(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          phone: c.phone,
          email: c.email,
          notes: c.notes,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
      );
    } catch (error: any) {
      toast.error('Failed to load customers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const saveCustomer = async (customer: CustomerInput, existingId?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      if (existingId) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: customer.name,
            address: customer.address || null,
            phone: customer.phone || null,
            email: customer.email || null,
            notes: customer.notes || null,
          })
          .eq('id', existingId);

        if (error) throw error;
        toast.success('Customer updated!');
        await fetchCustomers();
        return existingId;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: customer.name,
            address: customer.address || null,
            phone: customer.phone || null,
            email: customer.email || null,
            notes: customer.notes || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        toast.success('Customer saved!');
        await fetchCustomers();
        return data.id;
      }
    } catch (error: any) {
      toast.error('Failed to save customer: ' + error.message);
      console.error(error);
      return null;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) throw error;
      toast.success('Customer deleted!');
      await fetchCustomers();
    } catch (error: any) {
      toast.error('Failed to delete customer');
      console.error(error);
    }
  };

  return {
    customers,
    loading,
    saveCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};

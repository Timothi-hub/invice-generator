import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceData, InvoiceItem } from '@/types/invoice';
import { toast } from 'sonner';

export interface SavedInvoice extends InvoiceData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const useInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch items for all invoices
      const invoiceIds = invoicesData.map(inv => inv.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (itemsError) throw itemsError;

      // Map to SavedInvoice format
      const mappedInvoices: SavedInvoice[] = invoicesData.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date,
        customerName: inv.customer_name,
        customerAddress: inv.customer_address || '',
        deliveryCharges: inv.delivery_charges || 0,
        designingCharges: inv.designing_charges || 0,
        discount: (inv as any).discount || 0,
        advance: (inv as any).advance || 0,
        expenses: inv.expenses || 0,
        termsConditions: inv.terms_conditions || '',
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
        items: (itemsData || [])
          .filter(item => item.invoice_id === inv.id)
          .map(item => ({
            id: item.id,
            quantity: item.quantity,
            description: item.description,
            price: Number(item.price),
            unit: (item as any).unit || 'pcs',
            width: (item as any).width != null ? Number((item as any).width) : null,
            height: (item as any).height != null ? Number((item as any).height) : null,
          })),
      }));

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const saveInvoice = async (invoice: InvoiceData, existingId?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      if (existingId) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            invoice_number: invoice.invoiceNumber,
            invoice_date: invoice.invoiceDate,
            customer_name: invoice.customerName,
            customer_address: invoice.customerAddress,
            delivery_charges: invoice.deliveryCharges,
            designing_charges: invoice.designingCharges,
            discount: invoice.discount || 0,
            advance: invoice.advance || 0,
            expenses: invoice.expenses,
            terms_conditions: invoice.termsConditions,
          })
          .eq('id', existingId);

        if (updateError) throw updateError;

        // Delete old items and insert new ones
        await supabase.from('invoice_items').delete().eq('invoice_id', existingId);

        if (invoice.items.length > 0) {
          const { error: itemsError } = await supabase.from('invoice_items').insert(
            invoice.items.map(item => ({
              invoice_id: existingId,
              quantity: item.quantity,
              description: item.description,
              price: item.price,
              unit: item.unit || 'pcs',
              width: item.width ?? null,
              height: item.height ?? null,
            }))
          );
          if (itemsError) throw itemsError;
        }

        await fetchInvoices();
        toast.success('Invoice updated successfully!');
        return existingId;
      } else {
        // Create new invoice
        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            invoice_number: invoice.invoiceNumber,
            invoice_date: invoice.invoiceDate,
            customer_name: invoice.customerName,
            customer_address: invoice.customerAddress,
            delivery_charges: invoice.deliveryCharges,
            designing_charges: invoice.designingCharges,
            discount: invoice.discount || 0,
            advance: invoice.advance || 0,
            expenses: invoice.expenses,
            terms_conditions: invoice.termsConditions,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Insert items
        if (invoice.items.length > 0) {
          const { error: itemsError } = await supabase.from('invoice_items').insert(
            invoice.items.map(item => ({
              invoice_id: newInvoice.id,
              quantity: item.quantity,
              description: item.description,
              price: item.price,
              unit: item.unit || 'pcs',
              width: item.width ?? null,
              height: item.height ?? null,
            }))
          );
          if (itemsError) throw itemsError;
        }

        await fetchInvoices();
        toast.success('Invoice saved successfully!');
        return newInvoice.id;
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
      return null;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      // Items will be deleted via cascade (if set) or manually
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      
      await fetchInvoices();
      toast.success('Invoice deleted successfully!');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  return {
    invoices,
    loading,
    saveInvoice,
    deleteInvoice,
    refetch: fetchInvoices,
  };
};

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useInvoices, SavedInvoice } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useDraftInvoice } from '@/contexts/DraftInvoiceContext';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Save, Users, FilePlus } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading: profileLoading } = useProfile();
  const { invoices, saveInvoice, deleteInvoice } = useInvoices();
  const { customers } = useCustomers();
  const { invoice, setInvoice, currentInvoiceId, setCurrentInvoiceId, resetInvoice } = useDraftInvoice();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const state = location.state as { invoiceId?: string } | null;
    if (state?.invoiceId && invoices.length > 0) {
      const found = invoices.find((i) => i.id === state.invoiceId);
      if (found) handleSelectInvoice(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, invoices]);

  const handleSave = async () => {
    if (!invoice.invoiceNumber) {
      toast.error('Please enter an invoice number');
      return;
    }
    if (!invoice.customerName) {
      toast.error('Please enter a customer name');
      return;
    }

    setIsSaving(true);
    const savedId = await saveInvoice(invoice, currentInvoiceId);
    if (savedId) {
      setCurrentInvoiceId(savedId);
    }
    setIsSaving(false);
  };

  const handleSelectInvoice = (savedInvoice: SavedInvoice) => {
    setCurrentInvoiceId(savedInvoice.id);
    setInvoice({
      id: savedInvoice.id,
      invoiceNumber: savedInvoice.invoiceNumber,
      invoiceDate: savedInvoice.invoiceDate,
      customerName: savedInvoice.customerName,
      customerAddress: savedInvoice.customerAddress,
      items: savedInvoice.items,
      deliveryCharges: savedInvoice.deliveryCharges,
      designingCharges: savedInvoice.designingCharges,
      discount: savedInvoice.discount || 0,
      advance: savedInvoice.advance || 0,
      expenses: savedInvoice.expenses,
      termsConditions: savedInvoice.termsConditions,
    });
  };

  const handleNewInvoice = () => {
    resetInvoice();
  };

  const handleDeleteInvoice = async (id: string) => {
    await deleteInvoice(id);
    if (currentInvoiceId === id) {
      handleNewInvoice();
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setInvoice({
        ...invoice,
        customerName: customer.name,
        customerAddress: customer.address || '',
      });
    }
  };

  if (profileLoading) {
    return (
      <AppLayout title="Invoices">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Invoices">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* Customer Selector */}
          {customers.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Quick Select Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select onValueChange={handleSelectCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a saved customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone && ` - ${customer.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-foreground">
              {currentInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewInvoice}>
                <FilePlus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
              <Button variant="secondary" onClick={() => navigate('/preview')}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : currentInvoiceId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>

          <InvoiceForm invoice={invoice} onChange={setInvoice} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

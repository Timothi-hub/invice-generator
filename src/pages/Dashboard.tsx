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
import { Eye, Save, Users, FilePlus, FileText, Info, Lightbulb, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { calculateSubtotal, calculateTax, calculateTotal } from '@/types/invoice';

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

  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(invoice.items);
  const totalCharges = (invoice.deliveryCharges || 0) + (invoice.designingCharges || 0) + tax;
  const totalAmount = calculateTotal(invoice.items, invoice.deliveryCharges, invoice.designingCharges, invoice.discount);
  const balanceDue = totalAmount - (invoice.advance || 0);
  const fmt = (n: number) => `₹${(n || 0).toFixed(2)}`;

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); handleSave(); }
      else if (k === 'p') { e.preventDefault(); navigate('/preview'); }
      else if (k === 'n') { e.preventDefault(); handleNewInvoice(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, currentInvoiceId]);

  return (
    <AppLayout title="Invoices">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {currentInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fill the details below to generate a new invoice.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleNewInvoice}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
            <Button
              onClick={() => navigate('/preview')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : currentInvoiceId ? 'Update Invoice' : 'Save Invoice'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main form column */}
          <div className="lg:col-span-2 space-y-5">
            {customers.length > 0 && (
              <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4 md:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-violet-700 dark:text-violet-300">
                    Quick Select Customer
                  </h3>
                </div>
                <Select onValueChange={handleSelectCustomer}>
                  <SelectTrigger className="bg-background">
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
              </div>
            )}

            <InvoiceForm invoice={invoice} onChange={setInvoice} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Invoice Summary */}
            <div className="rounded-xl p-5 text-white shadow-lg bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Invoice Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-90">Subtotal</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Total Discounts</span>
                  <span className="font-medium">- {fmt(invoice.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Total Charges</span>
                  <span className="font-medium">+ {fmt(totalCharges)}</span>
                </div>
                <div className="border-t border-white/30 my-2"></div>
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold">{fmt(totalAmount)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-white/15 backdrop-blur p-3 flex justify-between text-sm">
                <span>Advance Received</span>
                <span className="font-medium">- {fmt(invoice.advance)}</span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="font-semibold text-lg">Balance Due</span>
                <span className="font-bold text-2xl">{fmt(balanceDue)}</span>
              </div>
            </div>

            {/* Important Note */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Important Note</h4>
              </div>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                The balance due is the amount remaining after subtracting advance and discounts.
              </p>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-sky-600" />
                <h4 className="font-semibold text-sky-700 dark:text-sky-300 text-sm">Invoice Tips</h4>
              </div>
              <ul className="text-xs text-sky-900/80 dark:text-sky-200/80 space-y-1">
                <li>✓ Add customer details for quick selection</li>
                <li>✓ Use clear item descriptions</li>
                <li>✓ Review before saving</li>
                <li>✓ You can preview before final save</li>
              </ul>
            </div>

            {/* Shortcuts */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">Shortcuts</h4>
              </div>
              <ul className="text-xs text-emerald-900/80 dark:text-emerald-200/80 space-y-1 font-mono">
                <li>Ctrl + S &nbsp; Save Invoice</li>
                <li>Ctrl + P &nbsp; Preview Invoice</li>
                <li>Ctrl + N &nbsp; New Invoice</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

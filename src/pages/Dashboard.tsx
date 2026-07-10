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
import { Eye, Save, Users, FilePlus, FileText, Info, Lightbulb, Keyboard, UserPlus, Package, ListChecks, BarChart3 } from 'lucide-react';
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

  // Keyboard shortcuts (must be declared before any early return)
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
      customerPhone: savedInvoice.customerPhone || '',
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
        customerPhone: customer.phone || '',
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

  return (
    <AppLayout title="Invoices">
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100dvh-8rem)] min-h-[560px]">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {currentInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Fill the details below to generate a new invoice.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleNewInvoice}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
            <Button
              onClick={() => navigate('/preview')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : currentInvoiceId ? 'Update Invoice' : 'Save Invoice'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Main form column */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-1 -mr-1">
            {customers.length > 0 && (
              <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-semibold text-sm text-violet-700 dark:text-violet-300">
                    Select Customer
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select onValueChange={handleSelectCustomer}>
                    <SelectTrigger className="bg-background h-9 flex-1">
                      <SelectValue placeholder="Search or select a customer..." />
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate('/customers')}
                      className="h-9 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      New Customer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/customers')}
                      className="h-9 w-9 p-0"
                      title="Manage customers"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <InvoiceForm invoice={invoice} onChange={setInvoice} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-3 overflow-y-auto pr-1 -mr-1">
            {/* Invoice Summary */}
            <div className="rounded-xl p-4 text-white shadow-lg bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold text-base">Invoice Summary</h3>
              </div>
              <div className="space-y-1.5 text-sm">
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
                <div className="border-t border-white/30 my-1.5"></div>
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold">{fmt(totalAmount)}</span>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-white/15 backdrop-blur p-2.5 flex justify-between text-sm">
                <span>Advance Received</span>
                <span className="font-medium">- {fmt(invoice.advance)}</span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-semibold">Balance Due</span>
                <span className="font-bold text-xl">{fmt(balanceDue)}</span>
              </div>
            </div>

            {/* Important Note */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Important Note</h4>
              </div>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                The balance due is the amount remaining after subtracting advance and discounts.
              </p>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-900 p-3">
              <div className="flex items-center gap-2 mb-1.5">
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
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">Shortcuts</h4>
              </div>
              <ul className="text-xs text-emerald-900/80 dark:text-emerald-200/80 space-y-1 font-mono">
                <li>Ctrl + S &nbsp; Save Invoice</li>
                <li>Ctrl + P &nbsp; Preview Invoice</li>
                <li>Ctrl + N &nbsp; New Invoice</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Quick Actions</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/customers')} className="h-auto flex-col py-2 gap-1">
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  <span className="text-[11px]">New Customer</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/saved-items')} className="h-auto flex-col py-2 gap-1">
                  <Package className="w-4 h-4 text-violet-400" />
                  <span className="text-[11px]">Item List</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/history')} className="h-auto flex-col py-2 gap-1">
                  <ListChecks className="w-4 h-4 text-violet-400" />
                  <span className="text-[11px]">Invoice List</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/reports')} className="h-auto flex-col py-2 gap-1">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px]">Reports</span>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

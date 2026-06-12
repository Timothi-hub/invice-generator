import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useInvoices, SavedInvoice } from '@/hooks/useInvoices';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { InvoiceData, calculateTotal, calculateProfit } from '@/types/invoice';
import { InvoiceTemplate, invoiceTemplates } from '@/types/invoiceTemplates';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ExportOptions from '@/components/invoice/ExportOptions';
import InvoiceHistory from '@/components/invoice/InvoiceHistory';
import TemplateSelector from '@/components/invoice/TemplateSelector';
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
import { FileText, Menu, Save, Users } from 'lucide-react';
import { toast } from 'sonner';

const getEmptyInvoice = (): InvoiceData => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  customerName: '',
  customerAddress: '',
  items: [],
  deliveryCharges: 0,
  designingCharges: 0,
  discount: 0,
  expenses: 0,
  termsConditions: 'Payment due within 30 days.',
});

const Dashboard = () => {
  const location = useLocation();
  const { profile, loading: profileLoading } = useProfile();
  const { invoices, loading: invoicesLoading, saveInvoice, deleteInvoice } = useInvoices();
  const { customers } = useCustomers();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | undefined>();
  const [invoice, setInvoice] = useState<InvoiceData>(getEmptyInvoice());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>(invoiceTemplates[0]);

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
      expenses: savedInvoice.expenses,
      termsConditions: savedInvoice.termsConditions,
    });
  };

  const handleNewInvoice = () => {
    setCurrentInvoiceId(undefined);
    setInvoice(getEmptyInvoice());
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

  const defaultProfile = profile || {
    companyName: 'Your Company',
    address: 'Your Address Here',
    phone: '+91 XXXXX XXXXX',
    website: 'www.yourcompany.com',
    directorName: 'Director Name',
  };

  const total = calculateTotal(invoice.items, invoice.deliveryCharges, invoice.designingCharges, invoice.discount);
  const profit = calculateProfit(invoice.items, invoice.deliveryCharges, invoice.designingCharges, invoice.expenses, invoice.discount);

  return (
    <AppLayout title="Invoices">
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowMobilePreview(!showMobilePreview)}
        >
          {showMobilePreview ? (
            <>
              <Menu className="w-4 h-4 mr-2" /> Show Form
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" /> Preview Invoice
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className={`space-y-4 ${showMobilePreview ? 'hidden lg:block' : ''}`}>
          {/* Invoice History */}
          <InvoiceHistory
            invoices={invoices}
            loading={invoicesLoading}
            onSelect={handleSelectInvoice}
            onDelete={handleDeleteInvoice}
            onNew={handleNewInvoice}
            selectedId={currentInvoiceId}
          />

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

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {currentInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : currentInvoiceId ? 'Update' : 'Save'}
            </Button>
          </div>

          <InvoiceForm invoice={invoice} onChange={setInvoice} />
        </div>

        {/* Preview Section */}
        <div className={`space-y-4 ${!showMobilePreview ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-foreground">Preview</h2>
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          </div>

          {/* Export Options */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-foreground">Export Options</h3>
              <ExportOptions invoiceRef={invoiceRef} invoiceNumber={invoice.invoiceNumber || 'draft'} />
            </CardContent>
          </Card>

          {/* Business Summary */}
          <Card className="no-print">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-foreground">Business Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">₹{total.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <p className="text-sm text-warning">Expenses</p>
                  <p className="text-xl font-bold text-warning">₹{invoice.expenses.toFixed(2)}</p>
                </div>
                <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <p className={`text-sm ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>Profit</p>
                  <p className={`text-xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ₹{profit.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <div className="overflow-auto rounded-lg border" style={{ maxHeight: '700px' }}>
            <InvoicePreview
              ref={invoiceRef}
              invoice={invoice}
              profile={defaultProfile}
              showExpensesProfit={false}
              template={selectedTemplate}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useInvoices, SavedInvoice } from '@/hooks/useInvoices';
import { InvoiceData, calculateTotal, calculateProfit } from '@/types/invoice';
import { InvoiceTemplate, invoiceTemplates } from '@/types/invoiceTemplates';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ExportOptions from '@/components/invoice/ExportOptions';
import CompanySettings from '@/components/invoice/CompanySettings';
import InvoiceHistory from '@/components/invoice/InvoiceHistory';
import TemplateSelector from '@/components/invoice/TemplateSelector';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, Menu, Save } from 'lucide-react';
import { toast } from 'sonner';

const getEmptyInvoice = (): InvoiceData => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  customerName: '',
  customerAddress: '',
  items: [],
  deliveryCharges: 0,
  designingCharges: 0,
  expenses: 0,
  termsConditions: 'Payment due within 30 days.',
});

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { invoices, loading: invoicesLoading, saveInvoice, deleteInvoice } = useInvoices();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | undefined>();
  const [invoice, setInvoice] = useState<InvoiceData>(getEmptyInvoice());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>(invoiceTemplates[0]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

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

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const defaultProfile = profile || {
    companyName: 'Your Company',
    address: 'Your Address Here',
    phone: '+91 XXXXX XXXXX',
    website: 'www.yourcompany.com',
    directorName: 'Director Name',
  };

  const total = calculateTotal(invoice.items, invoice.deliveryCharges, invoice.designingCharges);
  const profit = calculateProfit(invoice.items, invoice.deliveryCharges, invoice.designingCharges, invoice.expenses);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="invoice-header-gradient text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{defaultProfile.companyName}</h1>
              <p className="text-xs opacity-80">Billing Software</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CompanySettings profile={defaultProfile} onSave={updateProfile} />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-[72px] z-40 bg-background border-b p-2">
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className={`space-y-6 ${showMobilePreview ? 'hidden lg:block' : ''}`}>
            {/* Invoice History */}
            <InvoiceHistory
              invoices={invoices}
              loading={invoicesLoading}
              onSelect={handleSelectInvoice}
              onDelete={handleDeleteInvoice}
              onNew={handleNewInvoice}
              selectedId={currentInvoiceId}
            />

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
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
              <h2 className="text-2xl font-bold text-foreground">Preview</h2>
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>

            {/* Export Options */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold mb-3 text-foreground">Export Options</h3>
              <ExportOptions invoiceRef={invoiceRef} invoiceNumber={invoice.invoiceNumber || 'draft'} />
            </div>

            {/* Business Summary */}
            <div className="bg-card rounded-lg border p-4 no-print">
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
            </div>

            {/* Invoice Preview */}
            <div className="overflow-auto rounded-lg border" style={{ maxHeight: '800px' }}>
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
      </div>
    </div>
  );
};

export default Dashboard;

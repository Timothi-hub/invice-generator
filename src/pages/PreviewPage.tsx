import { useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useDraftInvoice } from '@/contexts/DraftInvoiceContext';
import { calculateTotal, calculateProfit } from '@/types/invoice';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ExportOptions from '@/components/invoice/ExportOptions';
import TemplateSelector from '@/components/invoice/TemplateSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Sparkles, TrendingUp, Wallet, Receipt } from 'lucide-react';

const PreviewPage = () => {
  const { profile } = useProfile();
  const { invoice, selectedTemplate, setSelectedTemplate } = useDraftInvoice();
  const invoiceRef = useRef<HTMLDivElement>(null);

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
    <AppLayout title="Preview Invoice">
      <div className="space-y-6">
        {/* Colorful Hero */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0D4C5C 0%, #14b8a6 50%, #f59e0b 100%)' }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 -bottom-12 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Preview Invoice <Sparkles className="w-5 h-5" />
                </h2>
                <p className="text-sm text-white/80">Review, style, and export your invoice</p>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>
          </div>
        </div>

        {/* Export Options */}
        <Card className="border-2 border-primary/20 shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Export Options
            </h3>
            <ExportOptions invoiceRef={invoiceRef} invoiceNumber={invoice.invoiceNumber || 'draft'} />
          </CardContent>
        </Card>

        {/* Business Summary */}
        <Card className="no-print shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-foreground">Business Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl text-white shadow-md" style={{ background: 'linear-gradient(135deg, #0D4C5C, #14b8a6)' }}>
                <TrendingUp className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-90">Total</p>
                <p className="text-2xl font-bold">₹{total.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl text-white shadow-md" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                <Wallet className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-90">Expenses</p>
                <p className="text-2xl font-bold">₹{invoice.expenses.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl text-white shadow-md" style={{ background: profit >= 0 ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
                <Sparkles className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-90">Profit</p>
                <p className="text-2xl font-bold">₹{profit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        <div className="overflow-auto rounded-lg border shadow-lg" style={{ maxHeight: '900px' }}>
          <InvoicePreview
            ref={invoiceRef}
            invoice={invoice}
            profile={defaultProfile}
            showExpensesProfit={false}
            template={selectedTemplate}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default PreviewPage;
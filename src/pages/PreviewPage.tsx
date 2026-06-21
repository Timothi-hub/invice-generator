import { useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useDraftInvoice } from '@/contexts/DraftInvoiceContext';
import { calculateTotal, calculateProfit, calculateSubtotal } from '@/types/invoice';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ExportOptions from '@/components/invoice/ExportOptions';
import ResponsiveInvoiceFrame from '@/components/invoice/ResponsiveInvoiceFrame';
import TemplateSelector from '@/components/invoice/TemplateSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, Sparkles, TrendingUp, Wallet, Receipt } from 'lucide-react';

const PreviewPage = () => {
  const { profile } = useProfile();
  const { invoice, selectedTemplate, setSelectedTemplate } = useDraftInvoice();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<'total' | 'expenses' | 'profit' | null>(null);

  const defaultProfile = profile || {
    companyName: 'Your Company',
    address: 'Your Address Here',
    phone: '+91 XXXXX XXXXX',
    website: 'www.yourcompany.com',
    directorName: 'Director Name',
  };

  const total = calculateTotal(invoice.items, invoice.deliveryCharges, invoice.designingCharges, invoice.discount);
  const profit = calculateProfit(invoice.items, invoice.deliveryCharges, invoice.designingCharges, invoice.expenses, invoice.discount);
  const subtotal = calculateSubtotal(invoice.items);
  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  const detailContent = () => {
    if (detail === 'total') {
      return (
        <div className="space-y-2 text-sm">
          <Row label="Items subtotal" value={fmt(subtotal)} />
          <Row label="Delivery charges" value={fmt(invoice.deliveryCharges)} />
          <Row label="Designing charges" value={fmt(invoice.designingCharges)} />
          {invoice.discount > 0 && <Row label="Discount" value={`- ${fmt(invoice.discount)}`} />}
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>Total</span><span>{fmt(total)}</span>
          </div>
          {invoice.advance > 0 && (
            <>
              <Row label="Advance paid" value={`- ${fmt(invoice.advance)}`} />
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Balance due</span><span>{fmt(total - invoice.advance)}</span>
              </div>
            </>
          )}
        </div>
      );
    }
    if (detail === 'expenses') {
      return (
        <div className="space-y-2 text-sm">
          <Row label="Recorded expenses" value={fmt(invoice.expenses)} />
          <p className="text-muted-foreground text-xs pt-2">
            This is the total cost you entered for this invoice. It is deducted from the total to calculate profit and is not shown in the exported invoice.
          </p>
        </div>
      );
    }
    if (detail === 'profit') {
      return (
        <div className="space-y-2 text-sm">
          <Row label="Total billed" value={fmt(total)} />
          <Row label="Expenses" value={`- ${fmt(invoice.expenses)}`} />
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>Profit</span>
            <span className={profit >= 0 ? 'text-success' : 'text-destructive'}>{fmt(profit)}</span>
          </div>
          {total > 0 && (
            <p className="text-muted-foreground text-xs pt-2">
              Margin: {((profit / total) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout title="Preview Invoice">
      <div className="space-y-4 md:space-y-6 max-w-full">
        {/* Colorful Hero */}
        <div className="relative overflow-hidden rounded-2xl p-4 md:p-6 text-white shadow-xl"
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
              <button type="button" onClick={() => setDetail('total')} className="p-4 rounded-xl text-white shadow-md hover:scale-[1.02] active:scale-95 transition-transform text-left" style={{ background: 'linear-gradient(135deg, #0D4C5C, #14b8a6)' }}>
                <TrendingUp className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-90 text-center">Total</p>
                <p className="text-2xl font-bold text-center">₹{total.toFixed(2)}</p>
                <p className="text-[10px] opacity-75 text-center mt-1">Tap for breakdown</p>
              </button>
              <button type="button" onClick={() => setDetail('expenses')} className="p-4 rounded-xl text-white shadow-md hover:scale-[1.02] active:scale-95 transition-transform text-left" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                <Wallet className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-90 text-center">Expenses</p>
                <p className="text-2xl font-bold text-center">₹{invoice.expenses.toFixed(2)}</p>
                <p className="text-[10px] opacity-75 text-center mt-1">Tap for breakdown</p>
              </button>
              <button type="button" onClick={() => setDetail('profit')} className="p-4 rounded-xl text-white shadow-md hover:scale-[1.02] active:scale-95 transition-transform text-left" style={{ background: profit >= 0 ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
                <Sparkles className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-90 text-center">Profit</p>
                <p className="text-2xl font-bold text-center">₹{profit.toFixed(2)}</p>
                <p className="text-[10px] opacity-75 text-center mt-1">Tap for breakdown</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Preview - scales to fit any viewport */}
        <div className="rounded-lg border shadow-lg bg-white p-2 sm:p-4 overflow-hidden">
          <ResponsiveInvoiceFrame>
            <InvoicePreview
              ref={invoiceRef}
              invoice={invoice}
              profile={defaultProfile}
              showExpensesProfit={false}
              template={selectedTemplate}
            />
          </ResponsiveInvoiceFrame>
        </div>

        <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="capitalize">{detail} breakdown</DialogTitle>
              <DialogDescription>How this number was calculated for invoice {invoice.invoiceNumber || 'draft'}.</DialogDescription>
            </DialogHeader>
            {detailContent()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default PreviewPage;
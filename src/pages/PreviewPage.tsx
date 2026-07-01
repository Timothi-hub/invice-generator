import { useEffect, useRef, useState } from 'react';
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
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewH, setPreviewH] = useState<number>(600);

  useEffect(() => {
    const update = () => {
      const top = previewWrapRef.current?.getBoundingClientRect().top ?? 0;
      setPreviewH(Math.max(320, window.innerHeight - top - 24));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
      <div className="space-y-2 md:space-y-3 max-w-full">
        {/* Colorful Hero */}
        <div className="relative overflow-hidden rounded-xl p-2.5 md:p-3 text-white shadow"
          style={{ background: 'linear-gradient(135deg, #0D4C5C 0%, #14b8a6 50%, #f59e0b 100%)' }}
        >
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-1.5">
                  Preview Invoice <Sparkles className="w-3.5 h-3.5" />
                </h2>
                <p className="text-[11px] text-white/80 leading-tight">Review, style, and export</p>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-md p-1">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>
          </div>
        </div>

        {/* Compact Export + Summary strip */}
        <div className="no-print grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 items-stretch">
          <Card className="border border-primary/20 shadow-sm">
            <CardContent className="p-2 flex items-center gap-2 flex-wrap">
              <Receipt className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold mr-1">Export:</span>
              <ExportOptions invoiceRef={invoiceRef} invoiceNumber={invoice.invoiceNumber || 'draft'} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => setDetail('total')} className="px-2 py-1.5 rounded-md text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-transform text-left" style={{ background: 'linear-gradient(135deg, #0D4C5C, #14b8a6)' }}>
              <div className="flex items-center gap-1 text-[10px] opacity-90"><TrendingUp className="w-3 h-3" /> Total</div>
              <p className="text-xs font-bold leading-tight">₹{total.toFixed(0)}</p>
            </button>
            <button type="button" onClick={() => setDetail('expenses')} className="px-2 py-1.5 rounded-md text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-transform text-left" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
              <div className="flex items-center gap-1 text-[10px] opacity-90"><Wallet className="w-3 h-3" /> Expense</div>
              <p className="text-xs font-bold leading-tight">₹{invoice.expenses.toFixed(0)}</p>
            </button>
            <button type="button" onClick={() => setDetail('profit')} className="px-2 py-1.5 rounded-md text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-transform text-left" style={{ background: profit >= 0 ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
              <div className="flex items-center gap-1 text-[10px] opacity-90"><Sparkles className="w-3 h-3" /> Profit</div>
              <p className="text-xs font-bold leading-tight">₹{profit.toFixed(0)}</p>
            </button>
          </div>
        </div>

        {/* Invoice Preview - scales to fit any viewport */}
        <div ref={previewWrapRef} className="rounded-lg border shadow bg-white p-1.5 sm:p-2 overflow-hidden flex justify-center" style={{ height: previewH }}>
          <ResponsiveInvoiceFrame maxHeight={previewH - 16}>
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
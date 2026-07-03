import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useDraftInvoice } from '@/contexts/DraftInvoiceContext';
import { calculateTotal, calculateProfit, calculateSubtotal } from '@/types/invoice';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ExportOptions from '@/components/invoice/ExportOptions';
import ResponsiveInvoiceFrame from '@/components/invoice/ResponsiveInvoiceFrame';
import TemplateSelector from '@/components/invoice/TemplateSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

const PreviewPage = () => {
  const { profile } = useProfile();
  const { invoice, selectedTemplate, setSelectedTemplate } = useDraftInvoice();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<'total' | 'expenses' | 'profit' | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasH, setCanvasH] = useState<number>(600);

  useEffect(() => {
    const update = () => {
      const top = canvasRef.current?.getBoundingClientRect().top ?? 0;
      setCanvasH(Math.max(320, window.innerHeight - top - 16));
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

  const ControlPanel = () => (
    <div className="h-full flex flex-col bg-[#0D4C5C] text-white">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-5 bg-teal-400 rounded-full" />
          Invoice Studio
        </h1>
        <p className="text-[10px] text-teal-200/60 mt-1 uppercase tracking-widest">Preview & Export</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-teal-200/50 uppercase tracking-wider">Financial Overview</h3>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setDetail('total')}
              className="w-full text-left bg-white/5 hover:bg-white/10 transition-colors p-2.5 rounded-lg border border-white/10"
            >
              <p className="text-[9px] text-teal-200/60 uppercase tracking-wider">Total Amount</p>
              <p className="text-base font-semibold">{fmt(total)}</p>
            </button>
            <button
              type="button"
              onClick={() => setDetail('expenses')}
              className="w-full text-left bg-white/5 hover:bg-white/10 transition-colors p-2.5 rounded-lg border border-white/10"
            >
              <p className="text-[9px] text-teal-200/60 uppercase tracking-wider">Expenses</p>
              <p className="text-base font-semibold">{fmt(invoice.expenses)}</p>
            </button>
            <button
              type="button"
              onClick={() => setDetail('profit')}
              className="w-full text-left bg-teal-500/15 hover:bg-teal-500/25 transition-colors p-2.5 rounded-lg border border-teal-400/30"
            >
              <p className="text-[9px] text-teal-200 uppercase tracking-wider">Net Profit</p>
              <p className={`text-base font-semibold ${profit >= 0 ? 'text-teal-200' : 'text-rose-300'}`}>{fmt(profit)}</p>
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-teal-200/50 uppercase tracking-wider">Template</h3>
          <div className="[&_button]:!text-slate-800">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          </div>
        </section>
      </div>

      <div className="p-4 bg-black/20 text-[9px] text-teal-200/40 text-center uppercase tracking-[0.2em]">
        Invoice #{invoice.invoiceNumber || 'draft'}
      </div>
    </div>
  );

  return (
    <AppLayout title="Preview Invoice">
      <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-6rem)] min-h-[500px]">
        {/* Left control sidebar - desktop */}
        <aside className="hidden lg:block w-72 shrink-0 rounded-xl overflow-hidden shadow-lg">
          <ControlPanel />
        </aside>

        {/* Main canvas */}
        <section className="flex-1 flex flex-col rounded-xl overflow-hidden shadow-lg border bg-slate-100">
          {/* Slim top toolbar */}
          <header className="no-print bg-white border-b flex items-center justify-between px-3 py-2 gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden h-8 gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Controls
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <ControlPanel />
              </SheetContent>
            </Sheet>
            <div className="flex-1 min-w-0">
              <ExportOptions invoiceRef={invoiceRef} invoiceNumber={invoice.invoiceNumber || 'draft'} />
            </div>
          </header>

          {/* Preview canvas */}
          <div ref={canvasRef} className="flex-1 overflow-auto bg-slate-100 p-4 flex items-start justify-center" style={{ height: canvasH }}>
            <ResponsiveInvoiceFrame maxHeight={canvasH - 32}>
              <InvoicePreview
                ref={invoiceRef}
                invoice={invoice}
                profile={defaultProfile}
                showExpensesProfit={false}
                template={selectedTemplate}
              />
            </ResponsiveInvoiceFrame>
          </div>
        </section>

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
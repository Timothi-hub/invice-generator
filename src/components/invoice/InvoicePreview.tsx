import { forwardRef } from 'react';
import { CompanyProfile, InvoiceData, InvoiceItem, calculateSubtotal, calculateTotal } from '@/types/invoice';
import { FileText } from 'lucide-react';
interface InvoicePreviewProps {
  invoice: InvoiceData;
  profile: CompanyProfile;
  showExpensesProfit?: boolean;
}
const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({
  invoice,
  profile,
  showExpensesProfit = true
}, ref) => {
  const subtotal = calculateSubtotal(invoice.items);
  const total = calculateTotal(invoice.items, invoice.deliveryCharges, invoice.designingCharges);
  const profit = total - invoice.expenses;
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
  return <div ref={ref} className="bg-white w-full max-w-[210mm] mx-auto shadow-xl" style={{
    minHeight: '297mm'
  }}>
        {/* Header */}
        <div className="invoice-header-gradient text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-bl-full bg-invoice-accent/30"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              {profile.logoUrl ? <img src={profile.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/10 p-2" /> : <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>}
              <div>
                <h2 className="text-xl font-bold">{profile.companyName}</h2>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-wide">INVOICE</h1>
          </div>
        </div>

        {/* Invoice Info Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2 text-muted-foreground">
            {[...Array(10)].map((_, i) => <svg key={i} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>)}
          </div>
          <div className="flex gap-6 text-sm">
            <div className="bg-invoice-accent/20 px-4 py-1 rounded">
              <span className="text-muted-foreground">Invoice: </span>
              <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date: </span>
              <span className="font-semibold text-foreground">{invoice.invoiceDate}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-6 flex justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Invoice to:</p>
            <p className="font-bold text-lg text-foreground">{invoice.customerName}</p>
            <p className="text-muted-foreground whitespace-pre-line">{invoice.customerAddress}</p>
          </div>
          <div className="w-20 h-20 opacity-20">
            <svg viewBox="0 0 100 100" fill="none">
              {[...Array(6)].map((_, i) => <line key={i} x1={10 + i * 15} y1="0" x2={10 + i * 15} y2="100" stroke="currentColor" strokeWidth="2" className="text-invoice-accent" />)}
            </svg>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-6">
          <table className="w-full">
            <thead>
              <tr className="bg-invoice-table-header text-white">
                <th className="text-left py-3 px-4 font-semibold rounded-l">Qty.</th>
                <th className="text-left py-3 px-4 font-semibold">Item Description</th>
                <th className="text-right py-3 px-4 font-semibold">Price</th>
                <th className="text-right py-3 px-4 font-semibold rounded-r">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                  <td className="py-3 px-4 text-foreground">{item.quantity}</td>
                  <td className="py-3 px-4 text-foreground">{item.description}</td>
                  <td className="py-3 px-4 text-right text-foreground">{formatCurrency(item.price)}</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">
                    {formatCurrency(item.quantity * item.price)}
                  </td>
                </tr>)}
              {invoice.items.length === 0 && <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No items added yet
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div className="px-6 mt-6">
          <div className="flex justify-between gap-8">
            {/* Terms */}
            <div className="flex-1">
              <h4 className="font-semibold text-primary mb-2">Terms & Conditions</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {invoice.termsConditions || 'Payment due within 30 days.'}
              </p>
            </div>

            {/* Totals */}
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sub Total:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Charges:</span>
                  <span className="font-medium">{formatCurrency(invoice.deliveryCharges)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Designing Charges:</span>
                  <span className="font-medium">{formatCurrency(invoice.designingCharges)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses & Profit - Hidden in print */}
          {showExpensesProfit && <div className="mt-6 p-4 bg-muted/50 rounded-lg no-print">
              <h4 className="font-semibold mb-3 text-foreground">Business Summary (Not included in export)</h4>
              <div className="flex gap-8">
                <div className="expense-badge">
                  Expenses: {formatCurrency(invoice.expenses)}
                </div>
                <div className="profit-badge">
                  Profit: {formatCurrency(profit)}
                </div>
              </div>
            </div>}
        </div>

        {/* Bottom Footer */}
        <div className="invoice-footer-gradient text-white p-6 mt-8 relative">
          
          <div className="flex justify-between items-end relative z-10">
            <div>
              <div className="border-t border-white/50 pt-2 mb-2 w-48">
                <p className="font-semibold">{profile.directorName}</p>
                <p className="text-sm opacity-80">Director</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p>{profile.address}</p>
              <p>{profile.phone}</p>
              <p>{profile.website}</p>
            </div>
          </div>
        </div>
      </div>;
});
InvoicePreview.displayName = 'InvoicePreview';
export default InvoicePreview;
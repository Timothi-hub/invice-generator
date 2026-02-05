import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InvoiceData, InvoiceItem } from '@/types/invoice';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';

interface InvoiceFormProps {
  invoice: InvoiceData;
  onChange: (invoice: InvoiceData) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onChange }) => {
  const { invoices } = useInvoices();
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInvoice, setDuplicateInvoice] = useState<{ number: string; customerName: string } | null>(null);

  // Check for duplicate invoice number
  useEffect(() => {
    if (!invoice.invoiceNumber.trim()) {
      setShowDuplicateWarning(false);
      setDuplicateInvoice(null);
      return;
    }

    const existingInvoice = invoices.find(
      (inv) =>
        inv.invoiceNumber.toLowerCase() === invoice.invoiceNumber.toLowerCase() &&
        inv.id !== invoice.id // Don't match self when editing
    );

    if (existingInvoice) {
      setShowDuplicateWarning(true);
      setDuplicateInvoice({
        number: existingInvoice.invoiceNumber,
        customerName: existingInvoice.customerName,
      });
    } else {
      setShowDuplicateWarning(false);
      setDuplicateInvoice(null);
    }
  }, [invoice.invoiceNumber, invoice.id, invoices]);

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...invoice, [field]: value });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      quantity: 1,
      description: '',
      price: 0,
    };
    updateField('items', [...invoice.items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    const updatedItems = invoice.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    updateField('items', updatedItems);
  };

  const removeItem = (id: string) => {
    updateField('items', invoice.items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Invoice Details */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Invoice Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={invoice.invoiceNumber}
              onChange={(e) => updateField('invoiceNumber', e.target.value)}
              placeholder="INV-0001"
              className={showDuplicateWarning ? 'border-warning focus-visible:ring-warning' : ''}
            />
            {showDuplicateWarning && duplicateInvoice && (
              <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/30 rounded-md text-warning text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Invoice #{duplicateInvoice.number} already exists for customer "{duplicateInvoice.customerName}"
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Date</Label>
            <div className="relative">
              <Input
                id="invoiceDate"
                type="date"
                value={invoice.invoiceDate}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Customer Details</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={invoice.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="Customer name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerAddress">Address</Label>
            <Textarea
              id="customerAddress"
              value={invoice.customerAddress}
              onChange={(e) => updateField('customerAddress', e.target.value)}
              placeholder="Customer address"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-foreground">Items</h3>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {invoice.items.map((item, index) => (
            <div key={item.id} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
              <div className="w-20">
                <Label className="text-xs text-muted-foreground">Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Item description"
                  className="mt-1"
                />
              </div>
              <div className="w-28">
                <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-6 text-destructive hover:text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {invoice.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items yet. Click "Add Item" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Additional Charges */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Additional Charges</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryCharges">Delivery Charges (₹)</Label>
            <Input
              id="deliveryCharges"
              type="number"
              min="0"
              step="0.01"
              value={invoice.deliveryCharges}
              onChange={(e) => updateField('deliveryCharges', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designingCharges">Designing Charges (₹)</Label>
            <Input
              id="designingCharges"
              type="number"
              min="0"
              step="0.01"
              value={invoice.designingCharges}
              onChange={(e) => updateField('designingCharges', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Expenses (for profit calculation) */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Expenses & Profit Tracking</h3>
        <p className="text-sm text-muted-foreground">This is for your records only and won't appear on the invoice.</p>
        
        <div className="space-y-2">
          <Label htmlFor="expenses">Total Expenses (₹)</Label>
          <Input
            id="expenses"
            type="number"
            min="0"
            step="0.01"
            value={invoice.expenses}
            onChange={(e) => updateField('expenses', parseFloat(e.target.value) || 0)}
            placeholder="Enter your costs"
          />
        </div>
      </div>

      {/* Terms */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Terms & Conditions</h3>
        
        <Textarea
          value={invoice.termsConditions}
          onChange={(e) => updateField('termsConditions', e.target.value)}
          placeholder="Enter terms and conditions..."
          rows={3}
        />
      </div>
    </div>
  );
};

export default InvoiceForm;

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceData, InvoiceItem } from '@/types/invoice';
import { Plus, Trash2, AlertTriangle, Wand2, Check, ChevronsUpDown } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useCustomers } from '@/hooks/useCustomers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface InvoiceFormProps {
  invoice: InvoiceData;
  onChange: (invoice: InvoiceData) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onChange }) => {
  const { invoices } = useInvoices();
  const { items: savedItems, upsertItem } = useSavedItems();
  const { customers } = useCustomers();
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInvoice, setDuplicateInvoice] = useState<{ number: string; customerName: string } | null>(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerWrapperRef = useRef<HTMLDivElement>(null);

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

  // Close customer suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerWrapperRef.current && !customerWrapperRef.current.contains(e.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const customerSuggestions = useMemo(() => {
    const q = invoice.customerName.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) && c.name.toLowerCase() !== q)
      .slice(0, 6);
  }, [invoice.customerName, customers]);

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...invoice, [field]: value });
  };

  const generateNextInvoiceNumber = () => {
    // Find pattern: optional prefix + number, e.g. INV-0001, INV001, 1, 0007
    let prefix = 'INV-';
    let maxNum = 0;
    let pad = 4;
    invoices.forEach((inv) => {
      const m = inv.invoiceNumber.match(/^(.*?)(\d+)$/);
      if (m) {
        const num = parseInt(m[2], 10);
        if (num > maxNum) {
          maxNum = num;
          prefix = m[1] || prefix;
          pad = Math.max(pad, m[2].length);
        }
      }
    });
    const next = (maxNum + 1).toString().padStart(pad, '0');
    updateField('invoiceNumber', `${prefix}${next}`);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      quantity: 1,
      description: '',
      price: 0,
      unit: 'pcs',
      width: null,
      height: null,
    };
    updateField('items', [...invoice.items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    const updatedItems = invoice.items.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...updates };
      // Auto-calc quantity from width × height for area units
      const unit = merged.unit || 'pcs';
      if (unit !== 'pcs' && merged.width != null && merged.height != null && merged.width > 0 && merged.height > 0) {
        merged.quantity = Number((merged.width * merged.height).toFixed(2));
      }
      return merged;
    });
    updateField('items', updatedItems);
  };

  const removeItem = (id: string) => {
    updateField('items', invoice.items.filter((item) => item.id !== id));
  };

  const handleItemBlur = (item: InvoiceItem) => {
    if (item.description.trim() && item.price > 0) {
      upsertItem(item.description, item.price, item.unit || 'pcs');
    }
  };

  const handlePickSaved = (id: string, savedId: string) => {
    const s = savedItems.find((x) => x.id === savedId);
    if (s) {
      updateItem(id, { description: s.description, price: s.price, unit: s.unit });
    }
  };

  const SavedItemPicker = ({ itemId }: { itemId: string }) => {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="mt-1 w-full justify-between h-9 font-normal"
          >
            <span className="text-muted-foreground">Select from saved items...</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput placeholder="Search saved items..." />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {savedItems.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`${s.description} ${s.unit}`}
                    onSelect={() => {
                      handlePickSaved(itemId, s.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4 opacity-0')} />
                    <span className="flex-1 truncate">{s.description}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ₹{s.price} / {s.unit}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-6">
      {/* Invoice Details */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Invoice Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <div className="flex gap-2">
              <Input
                id="invoiceNumber"
                value={invoice.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                placeholder="INV-0001"
                className={showDuplicateWarning ? 'border-warning focus-visible:ring-warning' : ''}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateNextInvoiceNumber}
                title="Auto-generate next invoice number"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
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
          <div className="space-y-2 relative" ref={customerWrapperRef}>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={invoice.customerName}
              onChange={(e) => {
                updateField('customerName', e.target.value);
                setShowCustomerSuggestions(true);
              }}
              onFocus={() => setShowCustomerSuggestions(true)}
              autoComplete="off"
              placeholder="Customer name"
            />
            {showCustomerSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-56 overflow-auto">
                {customerSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...invoice,
                        customerName: c.name,
                        customerAddress: c.address || invoice.customerAddress,
                      });
                      setShowCustomerSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  >
                    <div className="font-medium">{c.name}</div>
                    {c.address && (
                      <div className="text-xs text-muted-foreground truncate">{c.address}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
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
            <div key={item.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
              {savedItems.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Pick saved item (optional)</Label>
                  <SavedItemPicker itemId={item.id} />
                </div>
              )}
              <div className="flex gap-2 items-start flex-wrap">
                <div className="w-24">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Select
                    value={item.unit || 'pcs'}
                    onValueChange={(v) =>
                      updateItem(item.id, {
                        unit: v,
                        ...(v === 'pcs' ? { width: null, height: null } : {}),
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="sq.in">sq.in</SelectItem>
                      <SelectItem value="sq.ft">sq.ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {item.unit && item.unit !== 'pcs' ? (
                  <>
                    <div className="w-16">
                      <Label className="text-xs text-muted-foreground">W</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.width ?? ''}
                        onChange={(e) =>
                          updateItem(item.id, { width: e.target.value === '' ? null : parseFloat(e.target.value) })
                        }
                        className="mt-1"
                        placeholder="W"
                      />
                    </div>
                    <div className="w-16">
                      <Label className="text-xs text-muted-foreground">H</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.height ?? ''}
                        onChange={(e) =>
                          updateItem(item.id, { height: e.target.value === '' ? null : parseFloat(e.target.value) })
                        }
                        className="mt-1"
                        placeholder="H"
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs text-muted-foreground">Total</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="mt-1 bg-muted"
                        readOnly={!!(item.width && item.height)}
                      />
                    </div>
                  </>
                ) : (
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
                )}
                <div className="flex-1 min-w-[160px]">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    onBlur={() => handleItemBlur(item)}
                    placeholder="Item description"
                    list={`saved-items-${item.id}`}
                    className="mt-1"
                  />
                  <datalist id={`saved-items-${item.id}`}>
                    {savedItems.map((s) => (
                      <option key={s.id} value={s.description} />
                    ))}
                  </datalist>
                </div>
                <div className="w-28">
                  <Label className="text-xs text-muted-foreground">
                    Price (₹{item.unit && item.unit !== 'pcs' ? `/${item.unit}` : ''})
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                    onBlur={() => handleItemBlur(item)}
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
        <div className="space-y-2">
          <Label htmlFor="discount">Discount (₹)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            step="0.01"
            value={invoice.discount}
            onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
            placeholder="Discount amount to subtract from total"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="advance">Advance Received (₹)</Label>
          <Input
            id="advance"
            type="number"
            min="0"
            step="0.01"
            value={invoice.advance}
            onChange={(e) => updateField('advance', parseFloat(e.target.value) || 0)}
            placeholder="Amount already paid by customer in advance"
          />
          <p className="text-xs text-muted-foreground">
            This will be shown on the invoice and subtracted from the balance due.
          </p>
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

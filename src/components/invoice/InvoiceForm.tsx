import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceData, InvoiceItem } from "@/types/invoice";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Wand2,
  ChevronsUpDown,
  FileText,
  User,
  Package,
  Receipt,
  TrendingUp,
  ScrollText,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCustomers } from "@/hooks/useCustomers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
  // All sections render on a single page, stacked line-by-line.

  // Check for duplicate invoice number
  useEffect(() => {
    if (!invoice.invoiceNumber.trim()) {
      setShowDuplicateWarning(false);
      setDuplicateInvoice(null);
      return;
    }

    const existingInvoice = invoices.find(
      (inv) => inv.invoiceNumber.toLowerCase() === invoice.invoiceNumber.toLowerCase() && inv.id !== invoice.id, // Don't match self when editing
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
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const customerSuggestions = useMemo(() => {
    const q = invoice.customerName.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(q) && c.name.toLowerCase() !== q).slice(0, 6);
  }, [invoice.customerName, customers]);

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...invoice, [field]: value });
  };

  const generateNextInvoiceNumber = () => {
    // Find pattern: optional prefix + number, e.g. INV-0001, INV001, 1, 0007
    let prefix = "INV-";
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
    const next = (maxNum + 1).toString().padStart(pad, "0");
    updateField("invoiceNumber", `${prefix}${next}`);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      quantity: 1,
      description: "",
      price: 0,
      unit: "pcs",
      width: null,
      height: null,
      pieces: 1,
      mrp: null,
      taxRate: 0,
    };
    updateField("items", [...invoice.items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    const updatedItems = invoice.items.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...updates };
      // Auto-calc quantity from width × height for area units
      const unit = merged.unit || "pcs";
      if (unit !== "pcs" && merged.width != null && merged.height != null && merged.width > 0 && merged.height > 0) {
        const pcs = merged.pieces && merged.pieces > 0 ? merged.pieces : 1;
        merged.quantity = Number((merged.width * merged.height * pcs).toFixed(2));
      }
      return merged;
    });
    updateField("items", updatedItems);
  };

  const removeItem = (id: string) => {
    updateField(
      "items",
      invoice.items.filter((item) => item.id !== id),
    );
  };

  const handleItemBlur = (item: InvoiceItem) => {
    if (item.description.trim() && item.price > 0) {
      upsertItem(item.description, item.price, item.unit || "pcs", {
        width: item.width ?? null,
        height: item.height ?? null,
        pieces: item.pieces ?? null,
        mrp: item.mrp ?? null,
        taxRate: item.taxRate ?? 0,
      });
    }
  };

  const handlePickSaved = (id: string, savedId: string) => {
    const s = savedItems.find((x) => x.id === savedId);
    if (s) {
      updateItem(id, {
        description: s.description,
        price: s.price,
        unit: s.unit,
        width: s.width ?? null,
        height: s.height ?? null,
        pieces: s.pieces ?? 1,
        mrp: s.mrp ?? null,
        taxRate: s.taxRate ?? 0,
      });
    }
  };

  const getItemErrors = (item: InvoiceItem) => {
    const errors: {
      description?: string;
      price?: string;
      mrp?: string;
      taxRate?: string;
      width?: string;
      height?: string;
      pieces?: string;
    } = {};
    if (!item.description.trim()) errors.description = "Description is required";
    if (!(item.price > 0)) errors.price = "Price must be greater than 0";
    if (item.mrp != null && item.mrp !== ("" as any)) {
      if (!(item.mrp > 0)) errors.mrp = "MRP must be greater than 0";
      else if (item.price > 0 && item.mrp < item.price) errors.mrp = "MRP should be ≥ selling price";
    }
    if (item.taxRate != null && item.taxRate !== 0) {
      if (item.taxRate < 0 || item.taxRate > 100) errors.taxRate = "Tax % must be between 0 and 100";
    }
    if (item.unit && item.unit !== "pcs") {
      if (!item.width || item.width <= 0) errors.width = "Required";
      if (!item.height || item.height <= 0) errors.height = "Required";
      if (item.pieces != null && item.pieces < 1) errors.pieces = "Min 1";
    }
    return errors;
  };

  const SavedItemPicker = ({ itemId }: { itemId: string }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [unitFilter, setUnitFilter] = useState<string>("all");
    const [onlyWithDims, setOnlyWithDims] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const filteredSaved = useMemo(() => {
      const q = query.trim().toLowerCase();
      const min = minPrice ? parseFloat(minPrice) : null;
      const max = maxPrice ? parseFloat(maxPrice) : null;
      return savedItems.filter((s) => {
        if (q && !s.description.toLowerCase().includes(q)) return false;
        if (unitFilter !== "all" && (s.unit || "pcs") !== unitFilter) return false;
        if (onlyWithDims && !(s.width && s.height)) return false;
        if (min != null && s.price < min) return false;
        if (max != null && s.price > max) return false;
        return true;
      });
    }, [query, unitFilter, onlyWithDims, minPrice, maxPrice]);

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
        <PopoverContent className="p-0 w-[min(420px,calc(100vw-2rem))]" align="start">
          <div className="p-3 border-b space-y-2 bg-muted/30">
            <Input
              placeholder="Search by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All units</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="sq.in">sq.in</SelectItem>
                  <SelectItem value="sq.ft">sq.ft</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs px-2 border rounded-md bg-background">
                <Checkbox checked={onlyWithDims} onCheckedChange={(v) => setOnlyWithDims(v === true)} />
                Has W/H preset
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                min="0"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            {(query || unitFilter !== "all" || onlyWithDims || minPrice || maxPrice) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setUnitFilter("all");
                  setOnlyWithDims(false);
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-auto">
            {filteredSaved.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No items match.</p>
            ) : (
              filteredSaved.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    handlePickSaved(itemId, s.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm border-b last:border-0"
                >
                  <span className="flex-1 truncate">
                    {s.description}
                    {s.width && s.height ? (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({s.width}×{s.height}
                        {s.pieces && s.pieces > 1 ? `×${s.pieces}` : ""})
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ₹{s.price}/{s.unit}
                    {s.taxRate ? ` +${s.taxRate}%` : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Invoice Details */}
      <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base md:text-lg text-blue-700 dark:text-blue-300">Invoice Details</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <div className="flex gap-2">
              <Input
                id="invoiceNumber"
                value={invoice.invoiceNumber}
                onChange={(e) => updateField("invoiceNumber", e.target.value)}
                placeholder="INV-0001"
                className={showDuplicateWarning ? "border-warning focus-visible:ring-warning" : ""}
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
                onChange={(e) => updateField("invoiceDate", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base md:text-lg text-emerald-700 dark:text-emerald-300">
            Customer Details
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 relative" ref={customerWrapperRef}>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={invoice.customerName}
              onChange={(e) => {
                updateField("customerName", e.target.value);
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
                    {c.address && <div className="text-xs text-muted-foreground truncate">{c.address}</div>}
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
              onChange={(e) => updateField("customerAddress", e.target.value)}
              placeholder="Customer address"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base md:text-lg text-orange-700 dark:text-orange-300">Items</h3>
          </div>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {invoice.items.map((item, index) => {
            const errors = getItemErrors(item);
            return (
              <div key={item.id} className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Item #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {savedItems.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Pick saved item (optional)</Label>
                    <SavedItemPicker itemId={item.id} />
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3 items-start">
                  <div className="col-span-1 md:col-span-2 min-w-0">
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <Select
                      value={item.unit || "pcs"}
                      onValueChange={(v) =>
                        updateItem(item.id, {
                          unit: v,
                          ...(v === "pcs" ? { width: null, height: null } : {}),
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
                  {item.unit && item.unit !== "pcs" ? (
                    <>
                      <div className="col-span-1 md:col-span-1 min-w-0">
                        <Label className="text-xs text-muted-foreground">W</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.width ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, { width: e.target.value === "" ? null : parseFloat(e.target.value) })
                          }
                          className={cn("mt-1", errors.width && "border-destructive focus-visible:ring-destructive")}
                          placeholder="W"
                        />
                        {errors.width && <p className="text-[10px] text-destructive mt-1">{errors.width}</p>}
                      </div>
                      <div className="col-span-1 md:col-span-1 min-w-0">
                        <Label className="text-xs text-muted-foreground">H</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.height ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, { height: e.target.value === "" ? null : parseFloat(e.target.value) })
                          }
                          className={cn("mt-1", errors.height && "border-destructive focus-visible:ring-destructive")}
                          placeholder="H"
                        />
                        {errors.height && <p className="text-[10px] text-destructive mt-1">{errors.height}</p>}
                      </div>
                      <div className="col-span-1 md:col-span-1 min-w-0">
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.pieces ?? 1}
                          onChange={(e) =>
                            updateItem(item.id, { pieces: e.target.value === "" ? 1 : parseInt(e.target.value) || 1 })
                          }
                          className={cn("mt-1", errors.pieces && "border-destructive focus-visible:ring-destructive")}
                          placeholder="Qty"
                        />
                        {errors.pieces && <p className="text-[10px] text-destructive mt-1">{errors.pieces}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-2 min-w-0">
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
                    <div className="col-span-1 md:col-span-2 min-w-0">
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
                  <div className="col-span-2 md:col-span-5 min-w-0">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      onBlur={() => handleItemBlur(item)}
                      placeholder="Item description"
                      list={`saved-items-${item.id}`}
                      className={cn("mt-1", errors.description && "border-destructive focus-visible:ring-destructive")}
                    />
                    <datalist id={`saved-items-${item.id}`}>
                      {savedItems.map((s) => (
                        <option key={s.id} value={s.description} />
                      ))}
                    </datalist>
                    {errors.description && <p className="text-[10px] text-destructive mt-1">{errors.description}</p>}
                  </div>
                  <div className="col-span-2 md:col-span-3 min-w-0">
                    <Label className="text-xs text-muted-foreground">
                      Price (₹{item.unit && item.unit !== "pcs" ? `/${item.unit}` : ""})
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                      onBlur={() => handleItemBlur(item)}
                      className={cn("mt-1", errors.price && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.price && <p className="text-[10px] text-destructive mt-1">{errors.price}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3 items-start">
                  <div className="col-span-1 md:col-span-3 min-w-0">
                    <Label className="text-xs text-muted-foreground">
                      MRP (₹) <span className="opacity-60">optional</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.mrp ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, { mrp: e.target.value === "" ? null : parseFloat(e.target.value) })
                      }
                      onBlur={() => handleItemBlur(item)}
                      placeholder="Original price"
                      className={cn("mt-1", errors.mrp && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.mrp && <p className="text-[10px] text-destructive mt-1">{errors.mrp}</p>}
                  </div>
                  <div className="col-span-1 md:col-span-3 min-w-0">
                    <Label className="text-xs text-muted-foreground">Tax % (this item)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.taxRate ?? 0}
                      onChange={(e) =>
                        updateItem(item.id, { taxRate: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })
                      }
                      onBlur={() => handleItemBlur(item)}
                      placeholder="0 = no tax"
                      className={cn("mt-1", errors.taxRate && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.taxRate && <p className="text-[10px] text-destructive mt-1">{errors.taxRate}</p>}
                  </div>
                  <div className="col-span-2 md:col-span-6 flex items-end">
                    <p className="text-xs text-muted-foreground">
                      Line: ₹{(item.quantity * item.price).toFixed(2)}
                      {item.taxRate ? ` + ₹${((item.quantity * item.price * item.taxRate) / 100).toFixed(2)} tax` : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {invoice.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No items yet. Click "Add Item" to get started.</div>
          )}
        </div>
      </div>

      {/* Additional Charges */}
      <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base md:text-lg text-violet-700 dark:text-violet-300">
            Additional Charges
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryCharges">Delivery Charges (₹)</Label>
            <Input
              id="deliveryCharges"
              type="number"
              min="0"
              step="0.01"
              value={invoice.deliveryCharges}
              onChange={(e) => updateField("deliveryCharges", parseFloat(e.target.value) || 0)}
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
              onChange={(e) => updateField("designingCharges", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount">Discount (₹)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={invoice.discount}
              onChange={(e) => updateField("discount", parseFloat(e.target.value) || 0)}
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
              onChange={(e) => updateField("advance", parseFloat(e.target.value) || 0)}
              placeholder="Amount already paid by customer in advance"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This will be shown on the invoice and subtracted from the balance due.
        </p>
      </div>

      {/* Expenses (for profit calculation) */}
      <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base md:text-lg text-rose-700 dark:text-rose-300">
            Expenses & Profit Tracking
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">This is for your records only and won't appear on the invoice.</p>

        <div className="space-y-2">
          <Label htmlFor="expenses">Total Expenses (₹)</Label>
          <Input
            id="expenses"
            type="number"
            min="0"
            step="0.01"
            value={invoice.expenses}
            onChange={(e) => updateField("expenses", parseFloat(e.target.value) || 0)}
            placeholder="Enter your costs"
          />
        </div>
      </div>

      {/* Terms */}
      <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
            <ScrollText className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base md:text-lg text-sky-700 dark:text-sky-300">Terms & Conditions</h3>
        </div>

        <Textarea
          value={invoice.termsConditions}
          onChange={(e) => updateField("termsConditions", e.target.value)}
          placeholder="Enter terms and conditions..."
          rows={3}
        />
      </div>
    </div>
  );
};

export default InvoiceForm;

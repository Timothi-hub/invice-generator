import { useState, useMemo } from 'react';
import { SavedInvoice } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, FileText, Search, ArrowUpDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { calculateTotal } from '@/types/invoice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InvoiceHistoryProps {
  invoices: SavedInvoice[];
  loading: boolean;
  onSelect: (invoice: SavedInvoice) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  selectedId?: string;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  invoices,
  loading,
  onSelect,
  onDelete,
  onNew,
  selectedId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'number_asc' | 'number_desc' | 'name_asc' | 'name_desc'>('date_desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.customerName.toLowerCase().includes(query),
      );
    }

    if (fromDate) {
      const from = new Date(fromDate).getTime();
      result = result.filter((inv) => new Date(inv.invoiceDate).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime();
      result = result.filter((inv) => new Date(inv.invoiceDate).getTime() <= to);
    }

    const cmp = (a: SavedInvoice, b: SavedInvoice) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
        case 'date_desc':
          return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
        case 'number_asc':
          return a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true });
        case 'number_desc':
          return b.invoiceNumber.localeCompare(a.invoiceNumber, undefined, { numeric: true });
        case 'name_asc':
          return a.customerName.localeCompare(b.customerName);
        case 'name_desc':
          return b.customerName.localeCompare(a.customerName);
      }
    };
    result.sort(cmp);
    return result;
  }, [invoices, searchQuery, sortBy, fromDate, toDate]);

  const hasFilters = searchQuery || fromDate || toDate;

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice History
          </h3>
          <Button size="sm" onClick={onNew}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date — Newest first</SelectItem>
              <SelectItem value="date_asc">Date — Oldest first</SelectItem>
              <SelectItem value="number_desc">Invoice # — High to low</SelectItem>
              <SelectItem value="number_asc">Invoice # — Low to high</SelectItem>
              <SelectItem value="name_asc">Customer name — A → Z</SelectItem>
              <SelectItem value="name_desc">Customer name — Z → A</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                setSearchQuery('');
                setFromDate('');
                setToDate('');
              }}
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[360px]">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{invoices.length === 0 ? 'No invoices yet' : 'No matching invoices'}</p>
            <p className="text-sm">{invoices.length === 0 ? 'Create your first invoice to get started' : 'Try a different search term'}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredInvoices.map((invoice) => {
              const total = calculateTotal(
                invoice.items,
                invoice.deliveryCharges,
                invoice.designingCharges,
                invoice.discount || 0
              );
              const isSelected = selectedId === invoice.id;

              return (
                <div
                  key={invoice.id}
                  className={`p-3 transition-colors ${
                    isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left hover:bg-muted/50 rounded p-1 -m-1"
                      onClick={() => onSelect(invoice)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {invoice.invoiceNumber || 'No Number'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {invoice.customerName || 'No Customer'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</span>
                        <span className="font-medium text-foreground">₹{total.toFixed(2)}</span>
                      </div>
                    </button>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(invoice);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete invoice {invoice.invoiceNumber}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(invoice.id);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default InvoiceHistory;

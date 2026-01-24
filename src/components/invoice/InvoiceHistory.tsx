import { SavedInvoice } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { calculateTotal } from '@/types/invoice';
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
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoice History
        </h3>
        <Button size="sm" onClick={onNew}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((invoice) => {
              const total = calculateTotal(
                invoice.items,
                invoice.deliveryCharges,
                invoice.designingCharges
              );
              const isSelected = selectedId === invoice.id;

              return (
                <div
                  key={invoice.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => onSelect(invoice)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
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
                    </div>
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
                              onClick={() => onDelete(invoice.id)}
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

import { Customer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Phone, Mail, MapPin, Trash2, Edit2 } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  onSelect: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

const CustomerList = ({
  customers,
  loading,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
}: CustomerListProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Customers ({customers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {customers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No customers yet. Add your first customer!
            </div>
          ) : (
            <div className="divide-y">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedId === customer.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                  onClick={() => onSelect(customer)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </p>
                      )}
                      {customer.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3" /> {customer.address}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(customer);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this customer?')) {
                            onDelete(customer.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CustomerList;

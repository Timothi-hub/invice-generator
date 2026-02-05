import { useState, useMemo } from 'react';
import { Customer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, Phone, Mail, MapPin, Trash2, Edit2, Search, Filter, ChevronDown } from 'lucide-react';
import CustomerFilters, { CustomerFilterState } from './CustomerFilters';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterState>({
    addressContains: '',
    hasPhone: null,
    hasEmail: null,
    sortBy: 'name',
  });

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
      );
    }

    // Address filter
    if (filters.addressContains.trim()) {
      const addressQuery = filters.addressContains.toLowerCase();
      result = result.filter((c) =>
        c.address?.toLowerCase().includes(addressQuery)
      );
    }

    // Has phone filter
    if (filters.hasPhone !== null) {
      result = result.filter((c) =>
        filters.hasPhone ? !!c.phone?.trim() : !c.phone?.trim()
      );
    }

    // Has email filter
    if (filters.hasEmail !== null) {
      result = result.filter((c) =>
        filters.hasEmail ? !!c.email?.trim() : !c.email?.trim()
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (filters.sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [customers, searchQuery, filters]);

  const activeFilterCount = [
    filters.addressContains,
    filters.hasPhone !== null,
    filters.hasEmail !== null,
    filters.sortBy !== 'name',
  ].filter(Boolean).length;

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
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Customers ({filteredCustomers.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Advanced Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <CustomerFilters filters={filters} onFiltersChange={setFilters} />
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {customers.length === 0 ? 'No customers yet. Add your first customer!' : 'No matching customers found.'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
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

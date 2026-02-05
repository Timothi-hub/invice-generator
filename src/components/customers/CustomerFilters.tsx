import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, X } from 'lucide-react';

export interface CustomerFilterState {
  addressContains: string;
  hasPhone: boolean | null;
  hasEmail: boolean | null;
  sortBy: 'name' | 'updated';
}

interface CustomerFiltersProps {
  filters: CustomerFilterState;
  onFiltersChange: (filters: CustomerFilterState) => void;
}

const CustomerFilters = ({ filters, onFiltersChange }: CustomerFiltersProps) => {
  const updateFilter = <K extends keyof CustomerFilterState>(
    key: K,
    value: CustomerFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      addressContains: '',
      hasPhone: null,
      hasEmail: null,
      sortBy: 'name',
    });
  };

  const hasActiveFilters =
    filters.addressContains ||
    filters.hasPhone !== null ||
    filters.hasEmail !== null ||
    filters.sortBy !== 'name';

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3 space-y-3">
        {/* Address Filter */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" /> City/Address Contains
          </Label>
          <Input
            placeholder="Enter city or address..."
            value={filters.addressContains}
            onChange={(e) => updateFilter('addressContains', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Toggle Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-md">
            <Label className="text-xs">Has Phone</Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {filters.hasPhone === null ? 'Any' : filters.hasPhone ? 'Yes' : 'No'}
              </span>
              <Switch
                checked={filters.hasPhone === true}
                onCheckedChange={(checked) => {
                  if (filters.hasPhone === true) {
                    updateFilter('hasPhone', false);
                  } else if (filters.hasPhone === false) {
                    updateFilter('hasPhone', null);
                  } else {
                    updateFilter('hasPhone', true);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-md">
            <Label className="text-xs">Has Email</Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {filters.hasEmail === null ? 'Any' : filters.hasEmail ? 'Yes' : 'No'}
              </span>
              <Switch
                checked={filters.hasEmail === true}
                onCheckedChange={(checked) => {
                  if (filters.hasEmail === true) {
                    updateFilter('hasEmail', false);
                  } else if (filters.hasEmail === false) {
                    updateFilter('hasEmail', null);
                  } else {
                    updateFilter('hasEmail', true);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Sort & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilter('sortBy', value as 'name' | 'updated')}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="updated">Sort by Recent Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerFilters;

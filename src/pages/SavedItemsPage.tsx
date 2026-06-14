import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSavedItems } from '@/hooks/useSavedItems';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

const SavedItemsPage = () => {
  const { items, upsertItem, deleteItem, loading } = useSavedItems();
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [search, setSearch] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !price) {
      toast.error('Please enter description and price');
      return;
    }
    await upsertItem(description.trim(), parseFloat(price), unit);
    toast.success('Item saved');
    setDescription('');
    setPrice('');
    setUnit('pcs');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteItem(id);
    toast.success('Item deleted');
  };

  const filtered = items.filter((i) =>
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Saved Items">
      <div className="max-w-5xl mx-auto space-y-6">
        <p className="text-sm text-muted-foreground">
          Manage your reusable items. These will appear in the invoice form for quick selection.
        </p>

        {/* Add form */}
        <form onSubmit={handleAdd} className="bg-card rounded-lg border p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Item
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Flex Banner Printing"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="sq.in">sq.in</SelectItem>
                  <SelectItem value="sq.ft">sq.ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        </form>

        {/* Search + List */}
        <div className="bg-card rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-foreground">
              All Items ({items.length})
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm py-6 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{items.length === 0 ? 'No saved items yet.' : 'No items match your search.'}</p>
            </div>
          ) : (
            <div className="divide-y border rounded-md">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{item.price} / {item.unit}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item.id, item.description)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default SavedItemsPage;
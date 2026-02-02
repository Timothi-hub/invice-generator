import { useRef } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useProfile } from '@/hooks/useProfile';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportData {
  version: string;
  exportedAt: string;
  profile: any;
  customers: any[];
  invoices: any[];
}

const DataPage = () => {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { customers, loading: customersLoading, saveCustomer } = useCustomers();
  const { profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      customers,
      invoices,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully!');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.version || !data.customers || !data.invoices) {
        throw new Error('Invalid file format');
      }

      // Import customers
      let importedCustomers = 0;
      for (const customer of data.customers) {
        const result = await saveCustomer({
          name: customer.name,
          address: customer.address || '',
          phone: customer.phone || '',
          email: customer.email || '',
          notes: customer.notes || '',
        });
        if (result) importedCustomers++;
      }

      toast.success(`Imported ${importedCustomers} customers. Invoices need to be recreated manually.`);
    } catch (error: any) {
      toast.error('Failed to import data: ' + error.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loading = invoicesLoading || customersLoading;

  return (
    <AppLayout title="Data Management">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all your data as a JSON file for backup or transfer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customers:</span>
                <span className="font-medium">{customers.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoices:</span>
                <span className="font-medium">{invoices.length}</span>
              </div>
            </div>

            <Button onClick={handleExport} disabled={loading} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import customers from a previously exported JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-warning mb-1">Important</p>
                <p>
                  Importing will add new customers. Existing customers with the same name will not be overwritten.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import from JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-3xl font-bold text-foreground">{customers.length}</p>
              <p className="text-sm text-muted-foreground">Customers</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-3xl font-bold text-foreground">{invoices.length}</p>
              <p className="text-sm text-muted-foreground">Invoices</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-3xl font-bold text-foreground">
                {invoices.reduce((sum, inv) => sum + inv.items.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Line Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default DataPage;

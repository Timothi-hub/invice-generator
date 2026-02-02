import { useMemo } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, DollarSign, FileText, Calendar } from 'lucide-react';

const ReportsPage = () => {
  const { invoices, loading } = useInvoices();

  const stats = useMemo(() => {
    if (!invoices.length) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        invoiceCount: 0,
        avgInvoiceValue: 0,
        profitMargin: 0,
        byMonth: [] as { month: string; revenue: number; expenses: number; profit: number; count: number }[],
      };
    }

    let totalRevenue = 0;
    let totalExpenses = 0;
    const monthlyData: Record<string, { revenue: number; expenses: number; count: number }> = {};

    invoices.forEach((inv) => {
      const itemsTotal = inv.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const revenue = itemsTotal + inv.deliveryCharges + inv.designingCharges;
      totalRevenue += revenue;
      totalExpenses += inv.expenses;

      const monthKey = new Date(inv.invoiceDate).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0, count: 0 };
      }
      monthlyData[monthKey].revenue += revenue;
      monthlyData[monthKey].expenses += inv.expenses;
      monthlyData[monthKey].count += 1;
    });

    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const byMonth = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
        count: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      invoiceCount: invoices.length,
      avgInvoiceValue: totalRevenue / invoices.length,
      profitMargin,
      byMonth,
    };
  }, [invoices]);

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  if (loading) {
    return (
      <AppLayout title="Reports">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Financial Reports">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{formatCurrency(stats.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.totalProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.invoiceCount}</p>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.avgInvoiceValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {stats.byMonth.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No invoice data available yet.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Invoices</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Expenses</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byMonth.map((row) => (
                    <tr key={row.month} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{row.month}</td>
                      <td className="py-3 px-4 text-right">{row.count}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 px-4 text-right text-warning">{formatCurrency(row.expenses)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${row.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default ReportsPage;

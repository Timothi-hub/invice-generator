import { useMemo, useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, DollarSign, FileText, Calendar, BarChart3, Users, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const ReportsPage = () => {
  const { invoices, loading } = useInvoices();
  const [search, setSearch] = useState('');

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
        return dateA.getTime() - dateB.getTime();
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

  // Per-invoice profit breakdown
  const invoiceRows = useMemo(() => {
    return invoices
      .map((inv) => {
        const itemsTotal = inv.items.reduce((s, i) => s + i.quantity * i.price, 0);
        const revenue = itemsTotal + inv.deliveryCharges + inv.designingCharges - (inv.discount || 0);
        const profit = revenue - inv.expenses;
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          date: inv.invoiceDate,
          revenue,
          expenses: inv.expenses,
          profit,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [invoices]);

  // Per-customer aggregation
  const customerRows = useMemo(() => {
    const map = new Map<string, { customer: string; count: number; revenue: number; expenses: number; profit: number }>();
    invoiceRows.forEach((r) => {
      const key = r.customerName || 'Unknown';
      const cur = map.get(key) || { customer: key, count: 0, revenue: 0, expenses: 0, profit: 0 };
      cur.count += 1;
      cur.revenue += r.revenue;
      cur.expenses += r.expenses;
      cur.profit += r.profit;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [invoiceRows]);

  const filteredInvoiceRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoiceRows;
    return invoiceRows.filter(
      (r) =>
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q),
    );
  }, [invoiceRows, search]);

  const filteredCustomerRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customerRows;
    return customerRows.filter((r) => r.customer.toLowerCase().includes(q));
  }, [customerRows, search]);

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  // Pie chart data
  const pieData = [
    { name: 'Profit', value: Math.max(0, stats.totalProfit), color: 'hsl(145, 65%, 42%)' },
    { name: 'Expenses', value: stats.totalExpenses, color: 'hsl(35, 90%, 55%)' },
  ];

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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart - Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Revenue & Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byMonth.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(195, 75%, 35%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(35, 90%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Profit vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Profit Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byMonth.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Chart - Profit Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Profit Trend Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byMonth.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.byMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="hsl(145, 65%, 42%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(145, 65%, 42%)', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
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
                  {[...stats.byMonth].reverse().map((row) => (
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

      {/* Profit Breakdown — by customer / by invoice */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Profit Breakdown
            </CardTitle>
            <Input
              placeholder="Search invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer">
            <TabsList className="mb-4">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> By Customer
              </TabsTrigger>
              <TabsTrigger value="invoice" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" /> By Invoice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customer">
              <ScrollArea className="h-[360px]">
                {filteredCustomerRows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No matching customers.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Customer</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Invoices</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Revenue</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Expenses</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Profit</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomerRows.map((r) => {
                        const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
                        return (
                          <tr key={r.customer} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-3 font-medium">{r.customer}</td>
                            <td className="py-3 px-3 text-right">{r.count}</td>
                            <td className="py-3 px-3 text-right">{formatCurrency(r.revenue)}</td>
                            <td className="py-3 px-3 text-right text-warning">{formatCurrency(r.expenses)}</td>
                            <td className={`py-3 px-3 text-right font-semibold ${r.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(r.profit)}
                            </td>
                            <td className="py-3 px-3 text-right text-muted-foreground">{margin.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="invoice">
              <ScrollArea className="h-[360px]">
                {filteredInvoiceRows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No matching invoices.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Invoice #</th>
                        <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Customer</th>
                        <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Date</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Revenue</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Expenses</th>
                        <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoiceRows.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-3 font-medium">{r.invoiceNumber || '—'}</td>
                          <td className="py-3 px-3">{r.customerName || '—'}</td>
                          <td className="py-3 px-3 text-muted-foreground">{r.date}</td>
                          <td className="py-3 px-3 text-right">{formatCurrency(r.revenue)}</td>
                          <td className="py-3 px-3 text-right text-warning">{formatCurrency(r.expenses)}</td>
                          <td className={`py-3 px-3 text-right font-semibold ${r.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(r.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default ReportsPage;

import React, { useState } from 'react';
import { expensesApi } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatMoney, CHART_COLORS } from '@/utils/format';

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list(500),
  });

  const monthStart = format(startOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);

  const categoryData = Object.entries(
    monthExpenses.reduce((acc, e) => {
      acc[e.category || 'Uncategorized'] = (acc[e.category || 'Uncategorized'] || 0) + (e.amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(new Date(selectedMonth + '-01'), 5 - i);
    const ms = format(startOfMonth(m), 'yyyy-MM-dd');
    const me = format(endOfMonth(m), 'yyyy-MM-dd');
    const total = expenses
      .filter(e => e.date >= ms && e.date <= me)
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { month: format(m, 'MMM'), total: Math.round(total * 100) / 100 };
  });

  const paymentData = Object.entries(
    monthExpenses.reduce((acc, e) => {
      const method = (e.payment_method || 'other').replace(/_/g, ' ');
      acc[method] = (acc[method] || 0) + (e.amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const totalMonth = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div data-testid="reports-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Visualise your spending patterns</p>
        </div>
        <Input
          data-testid="reports-month-picker"
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="rounded-xl h-10 text-sm w-full sm:w-44"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Total Spending</p>
        <p data-testid="total-spending" className="text-3xl font-bold mt-1 tabular-nums">{formatMoney(totalMonth)}</p>
        <p className="text-sm text-muted-foreground mt-1">{monthExpenses.length} transactions in {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
      </div>

      <Tabs defaultValue="category" className="space-y-4">
        <TabsList className="rounded-xl h-9 text-sm">
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="trend">6-Month Trend</TabsTrigger>
          <TabsTrigger value="payment">By Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="category">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Spending by Category</h3>
            {categoryData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No data for this month</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" paddingAngle={3}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trend">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">6-Month Spending Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => formatMoney(v)} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Spending by Payment Method</h3>
            {paymentData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No data for this month</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" paddingAngle={3}>
                    {paymentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

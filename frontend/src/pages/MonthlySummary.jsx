import React, { useState } from 'react';
import { expensesApi, budgetsApi, aiApi } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Input } from '@/components/ui/input';
import { formatMoney, CHART_COLORS } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Sparkles, Loader2, FileText, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list(500),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedMonth],
    queryFn: () => budgetsApi.list(selectedMonth),
  });

  const monthStart = format(startOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);

  const totalSpent = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);

  const categoryBreakdown = Object.entries(
    monthExpenses.reduce((acc, e) => {
      acc[e.category || 'Uncategorized'] = (acc[e.category || 'Uncategorized'] || 0) + (e.amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
   .sort((a, b) => b.value - a.value);

  const budgetComparison = budgets.map(b => {
    const spent = monthExpenses.filter(e => e.category === b.category).reduce((s, e) => s + (e.amount || 0), 0);
    return { category: b.category, budget: b.amount, spent: Math.round(spent * 100) / 100 };
  });

  const generateAISummary = async () => {
    setIsGenerating(true);
    try {
      const summaryData = {
        month: format(new Date(selectedMonth + '-01'), 'MMMM yyyy'),
        totalSpent,
        totalBudget,
        transactionCount: monthExpenses.length,
        categoryBreakdown,
        budgetComparison,
        topExpenses: monthExpenses.sort((a, b) => b.amount - a.amount).slice(0, 5).map(e => ({ title: e.title, amount: e.amount, category: e.category })),
      };

      const prompt = `You are a personal finance advisor helping a user in Botswana. All amounts are in BWP (Botswana Pula). Analyze this monthly spending summary and provide a comprehensive, friendly, and actionable summary in English. Include:

1. **Overview**: A brief summary of total spending vs budget in BWP
2. **Category Analysis**: Which categories had the most spending, and any concerning patterns
3. **Budget Performance**: How well the user stayed within their BWP budgets
4. **Key Highlights**: Notable expenses or patterns
5. **Recommendations**: 2-3 specific, actionable tips to improve spending next month
6. **Savings Tip**: One creative saving suggestion relevant to Botswana

Here is the data:
${JSON.stringify(summaryData, null, 2)}

If there are no expenses, provide helpful tips for getting started with budgeting. Be encouraging and positive, using plain language. Always reference amounts in BWP.`;

      const result = await aiApi.invokeLLM(prompt);
      setAiSummary(result);
    } catch (err) {
      setAiSummary('Failed to generate summary. Please try again.');
    }
    setIsGenerating(false);
  };

  return (
    <div data-testid="monthly-summary-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monthly Summary</h1>
          <p className="text-muted-foreground text-sm mt-1">End-of-month financial review</p>
        </div>
        <Input
          data-testid="summary-month-picker"
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="rounded-xl h-10 text-sm w-full sm:w-44"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Spent', value: formatMoney(totalSpent) },
          { label: 'Budget', value: formatMoney(totalBudget) },
          { label: 'Remaining', value: formatMoney(Math.abs(totalBudget - totalSpent)), warn: totalBudget - totalSpent < 0 },
          { label: 'Transactions', value: monthExpenses.length },
        ].map(({ label, value, warn }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-1 tabular-nums ${warn ? 'text-destructive' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="ai"><Sparkles className="w-3.5 h-3.5 mr-1.5" />AI Summary</TabsTrigger>
          <TabsTrigger value="pie"><PieChartIcon className="w-3.5 h-3.5 mr-1.5" />Pie Chart</TabsTrigger>
          <TabsTrigger value="bar"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Bar Chart</TabsTrigger>
          <TabsTrigger value="text"><FileText className="w-3.5 h-3.5 mr-1.5" />Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            {!aiSummary && (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="font-medium">AI-Powered Monthly Summary</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Get personalized insights about your spending, budgeting, and tips for improvement
                </p>
                <Button data-testid="generate-summary-btn" onClick={generateAISummary} disabled={isGenerating} className="rounded-xl">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isGenerating ? 'Analyzing...' : 'Generate Summary'}
                </Button>
              </div>
            )}
            {aiSummary && (
              <div className="prose prose-sm prose-emerald max-w-none">
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" onClick={generateAISummary} disabled={isGenerating} className="rounded-xl">
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pie">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Category Breakdown</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No expenses this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={110} innerRadius={55} dataKey="value" paddingAngle={3}>
                    {categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bar">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Budget vs Actual</h3>
            {budgetComparison.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Set budgets to see comparison</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={budgetComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => formatMoney(v)} />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                  <Bar dataKey="budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Budget" />
                  <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-semibold">Detailed Breakdown — {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-muted-foreground">No expenses this month.</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-medium text-sm">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">{formatMoney(cat.value)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({totalSpent > 0 ? ((cat.value / totalSpent) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

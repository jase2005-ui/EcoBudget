import React, { useState } from 'react';
import { budgetsApi, categoriesApi, expensesApi } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function Budgets() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedMonth],
    queryFn: () => budgetsApi.list(selectedMonth),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list(500),
  });

  const monthStart = format(startOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const monthEnd   = format(endOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);

  const createMutation = useMutation({
    mutationFn: (data) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setCategory(''); setAmount('');
      toast.success('Budget set');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => budgetsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!category || !amount) return;
    createMutation.mutate({ category, amount: parseFloat(amount), month: selectedMonth });
  };

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);
  const totalSpent  = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div data-testid="budgets-page" className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground text-sm mt-1">Spending limits per category</p>
        </div>
        <Input
          data-testid="budget-month-picker"
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="rounded-xl h-10 text-sm w-full sm:w-44"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium">Total Budget</span>
          <span className="font-bold tabular-nums">{formatMoney(totalBudget)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium">Total Spent</span>
          <span className="font-bold tabular-nums">{formatMoney(totalSpent)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn("h-2 rounded-full transition-all", totalSpent > totalBudget ? "bg-destructive" : "bg-primary")}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right tabular-nums">
          {formatMoney(Math.abs(totalBudget - totalSpent))} {totalSpent > totalBudget ? 'over budget' : 'remaining'}
        </p>
      </div>

      <form onSubmit={handleAdd} className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-3">Set Budget</h3>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="budget-category-select" className="rounded-xl h-10 text-sm flex-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            data-testid="budget-amount-input"
            type="number" step="0.01" min="0"
            placeholder="BWP Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="rounded-xl h-10 text-sm w-full sm:w-36 tabular-nums"
          />
          <Button data-testid="set-budget-btn" type="submit" className="rounded-xl h-10 text-sm px-5" disabled={createMutation.isPending}>
            <Plus className="w-4 h-4 mr-1.5" /> Set
          </Button>
        </div>
      </form>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-3">
            <Wallet className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No budgets for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
          <p className="text-xs text-muted-foreground mt-1">Use the form above to set category limits</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {budgets.map(b => {
              const spent = monthExpenses.filter(e => e.category === b.category).reduce((s, e) => s + (e.amount || 0), 0);
              const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
              const over = spent > b.amount;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-2xl p-4 group"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-semibold text-sm">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-semibold tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
                        {formatMoney(spent)} <span className="font-normal opacity-60">/ {formatMoney(b.amount)}</span>
                      </span>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => deleteMutation.mutate(b.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn("h-1.5 rounded-full transition-all", over ? "bg-destructive" : pct > 80 ? "bg-yellow-500" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[11px] text-muted-foreground">{Math.round(pct)}% used</span>
                    {over
                      ? <span className="text-[11px] text-destructive font-medium">Over by {formatMoney(spent - b.amount)}</span>
                      : <span className="text-[11px] text-muted-foreground">{formatMoney(b.amount - spent)} left</span>
                    }
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

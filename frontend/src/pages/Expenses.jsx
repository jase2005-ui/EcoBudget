import React, { useState } from 'react';
import { expensesApi, categoriesApi } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, Filter, Receipt, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import TransactionRow from '@/components/ui/TransactionRow';
import EditExpenseModal from '@/components/EditExpenseModal';
import { formatMoney } from '@/utils/format';

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [editingExpense, setEditingExpense] = useState(null);
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list(300),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => expensesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const availableMonths = [...new Set(expenses.map(e => e.date?.slice(0, 7)).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const filtered = expenses.filter(e => {
    const matchesSearch = e.title?.toLowerCase().includes(search.toLowerCase()) ||
                          e.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesMonth = monthFilter === 'all' || e.date?.startsWith(monthFilter);
    return matchesSearch && matchesCat && matchesMonth;
  });

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  const grouped = filtered.reduce((acc, e) => {
    const day = e.date || 'Unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});
  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div data-testid="expenses-page" className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} transactions · <span className="font-semibold text-foreground">{formatMoney(total)}</span>
          </p>
        </div>
        <Link to="/add-expense">
          <Button data-testid="add-expense-btn" className="rounded-xl text-sm h-9">+ Add</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="search-expenses"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-10 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger data-testid="category-filter" className="w-full sm:w-44 rounded-xl h-10 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger data-testid="month-filter" className="w-full sm:w-40 rounded-xl h-10 text-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {availableMonths.map(m => (
              <SelectItem key={m} value={m}>
                {format(new Date(m + '-01'), 'MMM yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-[60px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-4">
            <Receipt className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold">No expenses found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          <Link to="/add-expense" className="mt-4 text-sm text-primary font-semibold hover:underline">
            Add expense
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDays.map(day => {
            const dayTotal = grouped[day].reduce((s, e) => s + (e.amount || 0), 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {day !== 'Unknown' ? format(new Date(day), 'EEEE, MMM d') : 'Unknown date'}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {formatMoney(dayTotal)}
                  </span>
                </div>
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
                  <AnimatePresence>
                    {grouped[day].map(expense => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <TransactionRow
                          expense={expense}
                          onDelete={(id) => deleteMutation.mutate(id)}
                          onEdit={(exp) => setEditingExpense(exp)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditExpenseModal
        expense={editingExpense}
        open={!!editingExpense}
        onOpenChange={(open) => { if (!open) setEditingExpense(null); }}
      />
    </div>
  );
}

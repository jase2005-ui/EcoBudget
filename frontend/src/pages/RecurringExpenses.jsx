import React, { useState } from 'react';
import { recurringApi, categoriesApi } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Pencil, RefreshCcw, Loader2, Repeat,
  CalendarDays, Zap, Save
} from 'lucide-react';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'other', label: 'Other' },
];

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function RecurringExpenses() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    title: '', amount: '', category: '', day_of_month: '1',
    notes: '', payment_method: 'bank_transfer',
  });

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => recurringApi.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => recurringApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      resetForm();
      toast.success('Recurring expense created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => recurringApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setEditItem(null);
      resetForm();
      toast.success('Recurring expense updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => recurringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast.success('Removed');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => recurringApi.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  });

  const generateMutation = useMutation({
    mutationFn: () => recurringApi.generate(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      if (data.generated > 0) {
        toast.success(`Generated ${data.generated} expense${data.generated > 1 ? 's' : ''} for this month`);
      } else {
        toast.info('All recurring expenses already generated for this month');
      }
    },
  });

  const resetForm = () => {
    setForm({ title: '', amount: '', category: '', day_of_month: '1', notes: '', payment_method: 'bank_transfer' });
    setShowForm(false);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title,
      amount: String(item.amount),
      category: item.category,
      day_of_month: String(item.day_of_month || 1),
      notes: item.notes || '',
      payment_method: item.payment_method || 'bank_transfer',
    });
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount), day_of_month: parseInt(form.day_of_month) };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalMonthly = recurring.filter(r => r.active).reduce((s, r) => s + (r.amount || 0), 0);
  const activeCount = recurring.filter(r => r.active).length;

  return (
    <div data-testid="recurring-expenses-page" className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recurring Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} active · <span className="font-semibold text-foreground">{formatMoney(totalMonthly)}</span>/month
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="generate-recurring-btn"
            variant="outline"
            className="rounded-xl text-sm h-9 gap-1.5"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || recurring.length === 0}
          >
            {generateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Generate
          </Button>
          <Button
            data-testid="add-recurring-btn"
            className="rounded-xl text-sm h-9 gap-1.5"
            onClick={() => { setEditItem(null); setShowForm(true); }}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums">{recurring.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Active</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums text-primary">{activeCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Monthly Cost</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums">{formatMoney(totalMonthly)}</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : recurring.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-4">
            <Repeat className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold">No recurring expenses</p>
          <p className="text-sm text-muted-foreground mt-1">Add rent, subscriptions, insurance and more</p>
          <Button className="mt-4 rounded-xl text-sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add First
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {recurring.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "bg-card border border-border rounded-2xl p-4 group transition-all",
                  !item.active && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      {!item.active && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">PAUSED</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.category} · {ordinal(item.day_of_month || 1)} of each month
                      {item.last_generated ? ` · Last: ${item.last_generated}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-sm tabular-nums">{formatMoney(item.amount)}</span>

                    <Switch
                      data-testid={`toggle-recurring-${item.id}`}
                      checked={item.active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, active: checked })}
                      className="scale-75"
                    />

                    <Button
                      data-testid={`edit-recurring-${item.id}`}
                      size="icon" variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      onClick={() => { openEdit(item); setShowForm(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      data-testid={`delete-recurring-${item.id}`}
                      size="icon" variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editItem ? 'Edit Recurring Expense' : 'New Recurring Expense'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editItem ? 'Update the details below' : 'Set up an expense that repeats every month'}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">BWP</span>
                <Input
                  data-testid="recurring-amount"
                  type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => update('amount', e.target.value)}
                  required
                  className="pl-14 text-xl font-bold h-12 rounded-xl tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Description</Label>
              <Input
                data-testid="recurring-title"
                placeholder="e.g. Rent, Netflix, Insurance"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                required
                className="rounded-xl h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Category</Label>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger data-testid="recurring-category" className="rounded-xl h-10 text-sm">
                    <SelectValue placeholder="Pick one" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Day of Month</Label>
                <Input
                  data-testid="recurring-day"
                  type="number" min="1" max="28"
                  value={form.day_of_month}
                  onChange={e => update('day_of_month', e.target.value)}
                  required
                  className="rounded-xl h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => update('payment_method', v)}>
                <SelectTrigger className="rounded-xl h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
              <Input
                data-testid="recurring-notes"
                placeholder="Additional details..."
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>

            <Button
              data-testid="save-recurring-btn"
              type="submit"
              className="w-full rounded-xl h-11 font-semibold"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Save className="w-4 h-4 mr-2" />}
              {editItem ? 'Save Changes' : 'Create Recurring'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

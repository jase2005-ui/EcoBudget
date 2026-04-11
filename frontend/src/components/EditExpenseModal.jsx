import React, { useState, useEffect } from 'react';
import { expensesApi, categoriesApi } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const paymentMethods = [
  { value: 'cash',          label: 'Cash' },
  { value: 'credit_card',   label: 'Credit Card' },
  { value: 'debit_card',    label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_payment',label: 'Mobile Payment' },
  { value: 'other',         label: 'Other' },
];

export default function EditExpenseModal({ expense, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', amount: '', category: '', date: '', notes: '', payment_method: 'cash',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title || '',
        amount: String(expense.amount || ''),
        category: expense.category || '',
        date: expense.date || '',
        notes: expense.notes || '',
        payment_method: expense.payment_method || 'cash',
      });
    }
  }, [expense]);

  const updateMutation = useMutation({
    mutationFn: (data) => expensesApi.update(expense.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update expense'),
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Expense</DialogTitle>
          <p className="text-sm text-muted-foreground">Update expense details below</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">BWP</span>
              <Input
                data-testid="edit-expense-amount"
                type="number" step="0.01" min="0"
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
              data-testid="edit-expense-title"
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
                <SelectTrigger data-testid="edit-expense-category" className="rounded-xl h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date</Label>
              <Input
                data-testid="edit-expense-date"
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
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
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes</Label>
            <Textarea
              data-testid="edit-expense-notes"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              className="rounded-xl text-sm resize-none"
              rows={2}
            />
          </div>

          <Button data-testid="save-edit-expense-btn" type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

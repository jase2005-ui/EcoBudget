import React, { useState } from 'react';
import { expensesApi, categoriesApi } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const paymentMethods = [
  { value: 'cash',          label: 'Cash' },
  { value: 'credit_card',   label: 'Credit Card' },
  { value: 'debit_card',    label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_payment',label: 'Mobile Payment' },
  { value: 'other',         label: 'Other' },
];

export default function AddExpense() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    payment_method: 'cash',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added');
      navigate('/expenses');
    },
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div data-testid="add-expense-page" className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/expenses">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Add Expense</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Record a new transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">BWP</span>
            <Input
              data-testid="expense-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              required
              className="pl-14 text-2xl font-bold h-14 rounded-xl tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Description</Label>
          <Input
            data-testid="expense-title"
            placeholder="e.g. Grocery shopping"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            required
            className="rounded-xl h-10 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Category</Label>
            <Select value={form.category} onValueChange={v => update('category', v)}>
              <SelectTrigger data-testid="expense-category" className="rounded-xl h-10 text-sm">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date</Label>
            <Input
              data-testid="expense-date"
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
            <SelectTrigger data-testid="expense-payment-method" className="rounded-xl h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
          <Textarea
            data-testid="expense-notes"
            placeholder="Additional details..."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            className="rounded-xl text-sm resize-none"
            rows={3}
          />
        </div>

        <Button data-testid="save-expense-btn" type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={createMutation.isPending}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {createMutation.isPending ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>
    </div>
  );
}

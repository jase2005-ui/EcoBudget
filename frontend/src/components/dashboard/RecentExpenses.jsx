import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Receipt } from 'lucide-react';
import TransactionRow from '@/components/ui/TransactionRow';

export default function RecentExpenses({ expenses }) {
  const recent = [...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-[0.95rem]">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last {recent.length} entries</p>
        </div>
        <Link
          to="/expenses"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-6">
          <div className="p-3 rounded-2xl bg-muted mb-3">
            <Receipt className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No expenses yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start tracking your spending</p>
          <Link to="/add-expense" className="mt-3 text-xs text-primary font-semibold hover:underline">
            Add first expense →
          </Link>
        </div>
      ) : (
        <div className="flex-1 py-1 divide-y divide-border/60">
          {recent.map((expense) => (
            <TransactionRow key={expense.id} expense={expense} compact />
          ))}
        </div>
      )}
    </div>
  );
}
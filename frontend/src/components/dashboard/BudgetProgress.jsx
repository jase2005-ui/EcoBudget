import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function BudgetProgress({ budgets, expenses }) {
  const budgetData = budgets
    .map(b => {
      const spent = expenses
        .filter(e => e.category === b.category)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
      const over = spent > b.amount;
      return { ...b, spent, pct, over };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-[0.95rem]">Budget Status</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{budgetData.length} categories</p>
        </div>
        <Link
          to="/budgets"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {budgetData.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-6">
          <div className="p-3 rounded-2xl bg-muted mb-3">
            <Wallet className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No budgets yet</p>
          <p className="text-xs text-muted-foreground mt-1">Set limits per category</p>
          <Link to="/budgets" className="mt-3 text-xs text-primary font-semibold hover:underline">
            Create budget →
          </Link>
        </div>
      ) : (
        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          {budgetData.map(b => (
            <div key={b.id}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm font-medium truncate">{b.category}</span>
                <span className={cn("text-xs font-semibold tabular-nums ml-2 flex-shrink-0", b.over ? "text-destructive" : "text-muted-foreground")}>
                  {formatMoney(b.spent)} <span className="font-normal opacity-60">/ {formatMoney(b.amount)}</span>
                </span>
              </div>
              {/* Custom progress bar with color logic */}
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={cn("h-1.5 rounded-full transition-all", b.over ? "bg-destructive" : b.pct > 80 ? "bg-yellow-500" : "bg-primary")}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              {b.over && (
                <p className="text-[10px] text-destructive mt-1 font-medium">
                  Over by {formatMoney(b.spent - b.amount)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
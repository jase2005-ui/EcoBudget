import React from 'react';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function SpendingHero({ totalMonthly, totalBudget, remaining, month }) {
  const pct = totalBudget > 0 ? Math.min((totalMonthly / totalBudget) * 100, 100) : 0;
  const isOver = remaining < 0;

  return (
    <div className="relative overflow-hidden bg-primary rounded-2xl p-6 md:p-8 text-primary-foreground">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />

      <div className="relative">
        <p className="text-sm font-medium opacity-70 uppercase tracking-widest">{month}</p>
        <p className="mt-1 text-4xl md:text-5xl font-bold tracking-tight tabular-nums">
          {formatMoney(totalMonthly)}
        </p>
        <p className="mt-1 text-sm opacity-70">total spent this month</p>

        {totalBudget > 0 && (
          <div className="mt-6 space-y-2">
            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className={cn("h-2 rounded-full transition-all", isOver ? "bg-red-300" : "bg-white")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-70">
                {isOver ? 'Over budget by ' : 'Remaining: '}
                <span className={cn("font-semibold", isOver && "text-red-300")}>
                  {formatMoney(Math.abs(remaining))}
                </span>
              </span>
              <span className="opacity-70">Budget: <span className="font-semibold opacity-100">{formatMoney(totalBudget)}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
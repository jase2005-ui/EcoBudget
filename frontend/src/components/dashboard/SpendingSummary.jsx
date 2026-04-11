import React from 'react';
import { formatMoney } from '@/utils/format';

const Item = ({ label, amount, count, borderRight }) => (
  <div className={`flex-1 px-4 py-4 ${borderRight ? 'border-r border-border' : ''}`}>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-xl font-bold tabular-nums mt-1 tracking-tight">{formatMoney(amount)}</p>
    <p className="text-xs text-muted-foreground mt-0.5">
      {count} transaction{count !== 1 ? 's' : ''}
    </p>
  </div>
);

export default function SpendingSummaryBar({ daily, weekly, monthly, dailyCount, weeklyCount, monthlyCount }) {
  return (
    <div className="bg-card border border-border rounded-2xl flex divide-x divide-border overflow-hidden">
      <Item label="Today"       amount={daily}   count={dailyCount}   borderRight />
      <Item label="This Week"   amount={weekly}  count={weeklyCount}  borderRight />
      <Item label="This Month"  amount={monthly} count={monthlyCount} />
    </div>
  );
}
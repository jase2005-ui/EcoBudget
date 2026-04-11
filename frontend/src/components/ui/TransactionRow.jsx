import React from 'react';
import { format } from 'date-fns';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney, getCategoryStyle } from '@/utils/format';
import { cn } from '@/lib/utils';

/**
 * Reusable transaction row — used in Expenses list, RecentExpenses, etc.
 */
export default function TransactionRow({ expense, onDelete, onEdit, compact = false }) {
  const style = getCategoryStyle(expense.category);

  return (
    <div className={cn(
      "flex items-center gap-3 group hover:bg-muted/40 transition-colors rounded-xl",
      compact ? "px-3 py-2.5" : "px-4 py-3.5"
    )}>
      {/* Category dot */}
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", style.dot)} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-foreground truncate", compact ? "text-sm" : "text-[0.9rem]")}>
          {expense.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium mr-1.5", style.bg, style.text)}>
            {expense.category || 'Uncategorized'}
          </span>
          {expense.date ? format(new Date(expense.date), 'MMM d, yyyy') : ''}
          {expense.payment_method && !compact ? ` · ${expense.payment_method.replace(/_/g, ' ')}` : ''}
        </p>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <span className={cn("font-semibold tabular-nums", compact ? "text-sm" : "text-[0.9rem]", "text-foreground")}>
          −{formatMoney(expense.amount)}
        </span>
        {onEdit && (
          <Button
            data-testid={`edit-expense-${expense.id}`}
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            onClick={() => onEdit(expense)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={() => onDelete(expense.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
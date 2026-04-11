import React from 'react';
import { expensesApi, budgetsApi } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/utils/format';
import SpendingHero from '../components/dashboard/SpendingHero';
import SpendingSummaryBar from '../components/dashboard/SpendingSummary';
import RecentExpenses from '../components/dashboard/RecentExpenses';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import { ArrowRight, Sparkles, Calendar } from 'lucide-react';

export default function Dashboard() {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list(200),
  });

  const { data: budgets = [], isLoading: loadingBud } = useQuery({
    queryKey: ['budgets', currentMonth],
    queryFn: () => budgetsApi.list(currentMonth),
  });

  const monthlyExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
  const weeklyExpenses  = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd);
  const dailyExpenses   = expenses.filter(e => e.date === today);

  const totalMonthly = monthlyExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalWeekly  = weeklyExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalDaily   = dailyExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalBudget  = budgets.reduce((s, b) => s + (b.amount || 0), 0);
  const remaining    = totalBudget - totalMonthly;

  const isLoading = loadingExp || loadingBud;

  return (
    <div data-testid="dashboard-page" className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {format(now, 'EEEE, MMMM d')}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
        </div>
        <Link
          to="/add-expense"
          data-testid="add-expense-btn"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Add Expense
        </Link>
      </div>

      {isLoading
        ? <Skeleton className="h-44 rounded-2xl" />
        : <SpendingHero totalMonthly={totalMonthly} totalBudget={totalBudget} remaining={remaining} month={format(now, 'MMMM yyyy')} />
      }

      {isLoading
        ? <Skeleton className="h-24 rounded-2xl" />
        : <SpendingSummaryBar
            daily={totalDaily}
            weekly={totalWeekly}
            monthly={totalMonthly}
            dailyCount={dailyExpenses.length}
            weeklyCount={weeklyExpenses.length}
            monthlyCount={monthlyExpenses.length}
          />
      }

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <RecentExpenses expenses={expenses} />
        </div>
        <div className="lg:col-span-2">
          <BudgetProgress budgets={budgets} expenses={monthlyExpenses} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/monthly-summary"
          data-testid="monthly-summary-link"
          className="group flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Monthly Summary</p>
              <p className="text-xs text-muted-foreground">AI-powered review</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/ai-advisor"
          data-testid="ai-advisor-link"
          className="group flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Advisor</p>
              <p className="text-xs text-muted-foreground">Saving & investing tips</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}

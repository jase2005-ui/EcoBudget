import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, PlusCircle, Tags, Wallet,
  BarChart3, Calendar, Sparkles, ChevronLeft, ChevronRight,
  Sun, Moon, LogOut, Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';

const navGroups = [
  {
    label: 'Main',
    items: [
      { path: '/',           label: 'Dashboard',   icon: LayoutDashboard },
      { path: '/expenses',   label: 'Expenses',    icon: Receipt },
      { path: '/add-expense',label: 'Add Expense', icon: PlusCircle },
    ],
  },
  {
    label: 'Planning',
    items: [
      { path: '/categories',     label: 'Categories',     icon: Tags },
      { path: '/budgets',        label: 'Budgets',        icon: Wallet },
      { path: '/recurring',      label: 'Recurring',      icon: Repeat },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/reports',        label: 'Reports',        icon: BarChart3 },
      { path: '/monthly-summary',label: 'Monthly Summary',icon: Calendar },
      { path: '/ai-advisor',     label: 'AI Advisor',     icon: Sparkles },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-card border-r border-border z-40 transition-all duration-300 flex flex-col",
      collapsed ? "w-[64px]" : "w-[220px]"
    )}>
      <div className={cn("flex items-center gap-2.5 border-b border-border flex-shrink-0", collapsed ? "p-4 justify-center" : "px-5 py-4")}>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Wallet className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-[0.95rem] tracking-tight block leading-none">EcoBudget</span>
            <span className="text-[10px] text-muted-foreground font-medium">Personal Finance</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg transition-all duration-150",
                      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span className="text-[0.82rem] font-medium">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-border space-y-0.5">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold truncate">{user.name || user.email}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={toggleTheme}
          data-testid="dark-mode-toggle"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className={cn(
            "flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          )}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!collapsed && <span className="text-[0.82rem] font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        <button
          onClick={logout}
          data-testid="logout-btn"
          title="Sign out"
          className={cn(
            "flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          )}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-[0.82rem] font-medium">Sign out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          data-testid="sidebar-toggle"
          title={collapsed ? "Expand" : "Collapse"}
          className={cn(
            "flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          )}
        >
          {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
          {!collapsed && <span className="text-[0.82rem] font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

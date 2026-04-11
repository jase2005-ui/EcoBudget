import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PlusCircle, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/add-expense', label: 'Add', icon: PlusCircle },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/ai-advisor', label: 'AI', icon: Sparkles },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav data-testid="mobile-nav" className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 md:hidden">
      <div className="flex items-center justify-around py-2">
        {mobileItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              data-testid={`mobile-nav-${label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

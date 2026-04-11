import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <main className={cn(
        "transition-all duration-300 pb-24 md:pb-0",
        collapsed ? "md:ml-[64px]" : "md:ml-[220px]"
      )}>
        <div className="px-4 py-5 md:px-8 md:py-7 min-h-screen">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

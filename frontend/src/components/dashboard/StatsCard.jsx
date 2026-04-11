import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card rounded-2xl border border-border p-5 relative overflow-hidden", className)}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1 tracking-tight">{value}</p>
          {trend !== undefined && (
            <p className={cn(
              "text-xs font-medium mt-2",
              trend >= 0 ? "text-primary" : "text-destructive"
            )}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || 'vs last month'}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
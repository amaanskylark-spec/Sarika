import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, variant = 'default' }) {
  const variantStyles = {
    default: 'bg-card',
    pending: 'bg-destructive/8 border-destructive/20',
    given: 'bg-chart-4/10 border-chart-4/20',
    received: 'bg-accent/10 border-accent/20',
    today: 'bg-primary/8 border-primary/20',
  };

  const iconStyles = {
    default: 'text-primary bg-primary/10',
    pending: 'text-destructive bg-destructive/10',
    given: 'text-chart-4 bg-chart-4/10',
    received: 'text-accent bg-accent/10',
    today: 'text-primary bg-primary/10',
  };

  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all duration-200",
      variantStyles[variant]
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl", iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-lg font-bold tracking-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
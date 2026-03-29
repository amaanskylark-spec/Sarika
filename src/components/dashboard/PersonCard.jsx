import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function PersonCard({ person, currencySymbol = '₹' }) {
  const isSettled = person.status === 'settled' || person.current_balance === 0;
  const balance = person.current_balance || 0;

  return (
    <Link
      to={`/person/${person.id}`}
      className="flex items-center gap-3 p-4 bg-card rounded-2xl border hover:shadow-md transition-all duration-200 active:scale-[0.98]"
    >
      <div className={cn(
        "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
        isSettled ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
      )}>
        {person.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{person.name}</p>
          {isSettled && <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {person.last_transaction_date 
            ? `Last: ${format(new Date(person.last_transaction_date), 'dd MMM yyyy')}`
            : 'No transactions yet'
          }
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn(
          "font-bold text-sm",
          isSettled ? "text-accent" : "text-destructive"
        )}>
          {isSettled ? 'Settled' : `${currencySymbol}${Math.abs(balance).toLocaleString('en-IN')}`}
        </p>
        {!isSettled && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {balance > 0 ? 'owes you' : 'you owe'}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
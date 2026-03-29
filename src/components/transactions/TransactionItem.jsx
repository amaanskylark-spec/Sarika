import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, MessageSquare, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TransactionItem({ transaction, currencySymbol = '₹', onEdit, onDelete }) {
  const isGiven = transaction.type === 'given';

  return (
    <div className="bg-card rounded-2xl border p-4 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-xl mt-0.5 shrink-0",
          isGiven ? "bg-destructive/10" : "bg-accent/10"
        )}>
          {isGiven 
            ? <ArrowUpRight className="h-4 w-4 text-destructive" />
            : <ArrowDownLeft className="h-4 w-4 text-accent" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                {isGiven ? 'Money Given' : 'Money Received'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(transaction.date), 'dd MMM yyyy')}
                {transaction.created_date && ` • ${format(new Date(transaction.created_date), 'hh:mm a')}`}
                {transaction.added_by_name && ` • by ${transaction.added_by_name}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <p className={cn(
                "font-bold text-base",
                isGiven ? "text-destructive" : "text-accent"
              )}>
                {isGiven ? '-' : '+'}{currencySymbol}{transaction.amount?.toLocaleString('en-IN')}
              </p>
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(transaction)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {transaction.comment && (
            <div className="mt-2 flex items-start gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
              <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{transaction.comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
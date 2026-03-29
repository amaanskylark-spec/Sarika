const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, UserPlus, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const actionIcons = {
  transaction_added: ArrowUpRight,
  transaction_edited: Pencil,
  transaction_deleted: Trash2,
  person_added: UserPlus,
  person_edited: Pencil,
  comment_added: Clock,
  member_added: UserPlus,
};

const actionColors = {
  transaction_added: 'bg-primary/10 text-primary',
  transaction_edited: 'bg-chart-4/10 text-chart-4',
  transaction_deleted: 'bg-destructive/10 text-destructive',
  person_added: 'bg-accent/10 text-accent',
  person_edited: 'bg-chart-4/10 text-chart-4',
  comment_added: 'bg-muted text-muted-foreground',
  member_added: 'bg-accent/10 text-accent',
};

export default function ActivityPage() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => db.entities.ActivityLog.list('-created_date', 50),
  });

  useEffect(() => {
    const unsub = db.entities.ActivityLog.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    });
    return unsub;
  }, [queryClient]);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Activity Log</h1>
      <div className="space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No activity yet"
            description="Activity will appear here as transactions are added or edited"
          />
        ) : (
          logs.map(log => {
            const Icon = actionIcons[log.action_type] || Clock;
            const color = actionColors[log.action_type] || 'bg-muted text-muted-foreground';
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-card rounded-2xl border">
                <div className={cn("p-2 rounded-xl shrink-0", color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{log.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.user_name || 'Unknown'} • {log.created_date ? format(new Date(log.created_date), 'dd MMM, h:mm a') : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
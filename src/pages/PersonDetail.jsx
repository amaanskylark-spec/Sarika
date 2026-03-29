const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Wallet, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import TransactionItem from '@/components/transactions/TransactionItem';
import AddTransactionDialog from '@/components/dialogs/AddTransactionDialog';
import EmptyState from '@/components/common/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PersonDetail({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [deleteTxn, setDeleteTxn] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: person, isLoading: personLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const list = await db.entities.Person.filter({ id });
      return list[0];
    },
  });

  const { data: transactions = [], isLoading: txnsLoading } = useQuery({
    queryKey: ['person-transactions', id],
    queryFn: () => db.entities.Transaction.filter({ person_id: id }, '-date'),
  });

  // Real-time sync
  useEffect(() => {
    const unsubs = [
      db.entities.Transaction.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['person-transactions', id] });
        queryClient.invalidateQueries({ queryKey: ['person', id] });
      }),
      db.entities.Person.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['person', id] });
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [id, queryClient]);

  const recalcBalance = async (personId, ledgerId) => {
    const allTxns = await db.entities.Transaction.filter({ person_id: personId });
    const given = allTxns.filter(t => t.type === 'given').reduce((s, t) => s + (t.amount || 0), 0);
    const received = allTxns.filter(t => t.type === 'received').reduce((s, t) => s + (t.amount || 0), 0);
    const balance = given - received;
    await db.entities.Person.update(personId, {
      current_balance: balance,
      status: balance === 0 ? 'settled' : 'pending',
      last_transaction_date: new Date().toISOString(),
    });
  };

  const addTxnMutation = useMutation({
    mutationFn: async (data) => {
      if (editTxn) {
        await db.entities.Transaction.update(editTxn.id, data);
        await db.entities.ActivityLog.create({
          ledger_id: person.ledger_id,
          user_name: user?.full_name,
          user_email: user?.email,
          action: `Edited transaction ₹${data.amount} for ${person.name}`,
          action_type: 'transaction_edited',
        });
      } else {
        await db.entities.Transaction.create({
          ...data,
          person_id: id,
          ledger_id: person.ledger_id,
          added_by_name: user?.full_name,
          added_by_email: user?.email,
        });
        await db.entities.ActivityLog.create({
          ledger_id: person.ledger_id,
          user_name: user?.full_name,
          user_email: user?.email,
          action: `Added ${data.type === 'given' ? 'given' : 'received'} ₹${data.amount} for ${person.name}`,
          action_type: 'transaction_added',
        });
      }
      await recalcBalance(id, person.ledger_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      setShowAddTxn(false);
      setEditTxn(null);
    },
  });

  const deleteTxnMutation = useMutation({
    mutationFn: async (txn) => {
      // Save to deleted entries before deleting
      await db.entities.DeletedEntry.create({
        entry_type: 'transaction',
        entry_id: txn.id,
        entry_data: JSON.stringify(txn),
        deleted_by: session?.username || user?.full_name || 'Unknown',
        ledger_id: person.ledger_id,
        person_name: person.name,
      });
      await db.entities.Transaction.delete(txn.id);
      await db.entities.ActivityLog.create({
        ledger_id: person.ledger_id,
        user_name: user?.full_name,
        user_email: user?.email,
        action: `Deleted transaction ₹${txn.amount} for ${person.name}`,
        action_type: 'transaction_deleted',
      });
      await recalcBalance(id, person.ledger_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      setDeleteTxn(null);
    },
  });

  const isSettled = person?.status === 'settled' || person?.current_balance === 0;
  const balance = person?.current_balance || 0;
  const totalGiven = transactions.filter(t => t.type === 'given').reduce((s, t) => s + (t.amount || 0), 0);
  const totalReceived = transactions.filter(t => t.type === 'received').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {personLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg">{person?.name}</h1>
              {isSettled && <CheckCircle2 className="h-4 w-4 text-accent" />}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-4">
        {/* Balance Card */}
        {personLoading ? (
          <Skeleton className="h-40 rounded-2xl mb-4" />
        ) : (
          <div className={cn(
            "rounded-2xl p-5 mb-4",
            isSettled ? "bg-accent/10 border border-accent/20" : "bg-primary text-primary-foreground"
          )}>
            <p className={cn("text-sm font-medium mb-1", isSettled ? "text-accent" : "text-primary-foreground/70")}>
              {isSettled ? 'Account Settled' : 'Remaining Balance'}
            </p>
            <p className="text-3xl font-bold">
              {isSettled ? '₹0' : `₹${Math.abs(balance).toLocaleString('en-IN')}`}
            </p>
            {!isSettled && (
              <p className="text-xs mt-1 text-primary-foreground/60">
                {balance > 0 ? 'This person owes you' : 'You owe this person'}
              </p>
            )}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className={cn("h-4 w-4", isSettled ? "text-destructive" : "text-primary-foreground/70")} />
                <div>
                  <p className={cn("text-[10px]", isSettled ? "text-muted-foreground" : "text-primary-foreground/60")}>Given</p>
                  <p className="text-sm font-semibold">₹{totalGiven.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className={cn("h-4 w-4", isSettled ? "text-accent" : "text-primary-foreground/70")} />
                <div>
                  <p className={cn("text-[10px]", isSettled ? "text-muted-foreground" : "text-primary-foreground/60")}>Received</p>
                  <p className="text-sm font-semibold">₹{totalReceived.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Transaction Button */}
        <Button
          className="w-full rounded-xl h-11 mb-4 shadow-sm"
          onClick={() => { setEditTxn(null); setShowAddTxn(true); }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Transaction
        </Button>

        {/* Transactions */}
        <h2 className="font-semibold text-sm text-muted-foreground mb-3">Transaction History</h2>
        <div className="space-y-2">
          {txnsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              description="Add your first transaction to get started"
            />
          ) : (
            transactions.map(txn => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onEdit={(t) => { setEditTxn(t); setShowAddTxn(true); }}
                onDelete={(t) => setDeleteTxn(t)}
              />
            ))
          )}
        </div>
      </div>

      <AddTransactionDialog
        open={showAddTxn}
        onOpenChange={(open) => { setShowAddTxn(open); if (!open) setEditTxn(null); }}
        onSubmit={(data) => addTxnMutation.mutate(data)}
        loading={addTxnMutation.isPending}
        editData={editTxn}
      />

      <AlertDialog open={!!deleteTxn} onOpenChange={() => setDeleteTxn(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction of ₹{deleteTxn?.amount?.toLocaleString('en-IN')}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground rounded-xl"
              onClick={() => deleteTxnMutation.mutate(deleteTxn)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import StatCard from '@/components/dashboard/StatCard';
import PersonCard from '@/components/dashboard/PersonCard';
import SearchFilter from '@/components/common/SearchFilter';
import EmptyState from '@/components/common/EmptyState';
import AddPersonDialog from '@/components/dialogs/AddPersonDialog';
import CreateLedgerDialog from '@/components/dialogs/CreateLedgerDialog';
import { Skeleton } from '@/components/ui/skeleton';
import AdminPanel from '@/pages/AdminPanel';

export default function Dashboard({ session }) {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showCreateLedger, setShowCreateLedger] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('balance_desc');
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const adminClickCount = useRef(0);
  const adminClickTimer = useRef(null);
  const queryClient = useQueryClient();

  const handleLedgerNameClick = () => {
    adminClickCount.current += 1;
    if (adminClickTimer.current) clearTimeout(adminClickTimer.current);
    adminClickTimer.current = setTimeout(() => { adminClickCount.current = 0; }, 2000);
    if (adminClickCount.current >= 4) {
      adminClickCount.current = 0;
      setShowAdmin(true);
    }
  };

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: ledgers = [], isLoading: ledgersLoading } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => db.entities.Ledger.list('-created_date'),
  });

  const activeLedger = ledgers[0];

  const { data: persons = [], isLoading: personsLoading } = useQuery({
    queryKey: ['persons', activeLedger?.id],
    queryFn: () => db.entities.Person.filter({ ledger_id: activeLedger.id }),
    enabled: !!activeLedger?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', activeLedger?.id],
    queryFn: () => db.entities.Transaction.filter({ ledger_id: activeLedger.id }),
    enabled: !!activeLedger?.id,
  });

  // Real-time subscriptions
  useEffect(() => {
    const unsubs = [
      db.entities.Person.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['persons'] });
      }),
      db.entities.Transaction.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['persons'] });
      }),
      db.entities.Ledger.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [queryClient]);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const totalGiven = transactions.filter(t => t.type === 'given').reduce((s, t) => s + (t.amount || 0), 0);
    const totalReceived = transactions.filter(t => t.type === 'received').reduce((s, t) => s + (t.amount || 0), 0);
    const totalPending = persons.reduce((s, p) => s + Math.abs(p.current_balance || 0), 0);
    const todayTxns = transactions.filter(t => t.date === today);
    const todayTotal = todayTxns.reduce((s, t) => s + (t.amount || 0), 0);
    return { totalGiven, totalReceived, totalPending, todayTotal };
  }, [transactions, persons]);

  const filteredPersons = useMemo(() => {
    let list = [...persons];
    if (searchQuery) {
      list = list.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    switch (sortBy) {
      case 'balance_desc': list.sort((a, b) => Math.abs(b.current_balance || 0) - Math.abs(a.current_balance || 0)); break;
      case 'balance_asc': list.sort((a, b) => Math.abs(a.current_balance || 0) - Math.abs(b.current_balance || 0)); break;
      case 'recent': list.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0)); break;
      case 'settled': list.sort((a, b) => (b.status === 'settled' ? 1 : 0) - (a.status === 'settled' ? 1 : 0)); break;
      case 'name': list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
    }
    return list;
  }, [persons, searchQuery, sortBy]);

  const createLedgerMutation = useMutation({
    mutationFn: (data) => db.entities.Ledger.create({
      ...data,
      owner_email: user?.email,
      members: [user?.email],
      currency_symbol: '₹',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      setShowCreateLedger(false);
    },
  });

  const addPersonMutation = useMutation({
    mutationFn: async (data) => {
      const person = await db.entities.Person.create({
        ...data,
        ledger_id: activeLedger.id,
        current_balance: data.initial_balance || 0,
        status: (data.initial_balance || 0) === 0 ? 'settled' : 'pending',
      });
      if (data.initial_balance && data.initial_balance > 0) {
        await db.entities.Transaction.create({
          person_id: person.id,
          ledger_id: activeLedger.id,
          amount: data.initial_balance,
          type: 'given',
          date: new Date().toISOString().split('T')[0],
          comment: 'Initial balance',
          added_by_name: user?.full_name,
          added_by_email: user?.email,
        });
        await db.entities.Person.update(person.id, { last_transaction_date: new Date().toISOString() });
      }
      await db.entities.ActivityLog.create({
        ledger_id: activeLedger.id,
        user_name: user?.full_name,
        user_email: user?.email,
        action: `Added ${data.name} with initial balance ₹${data.initial_balance || 0}`,
        action_type: 'person_added',
      });
      return person;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowAddPerson(false);
    },
  });

  const isLoading = ledgersLoading || personsLoading;

  if (!isLoading && ledgers.length === 0) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold mb-2">Money Tracker</h1>
        <EmptyState
          icon={BookOpen}
          title="No Ledger Yet"
          description="Create your first shared ledger to start tracking transactions between people."
          actionLabel="Create Ledger"
          onAction={() => setShowCreateLedger(true)}
        />
        <CreateLedgerDialog
          open={showCreateLedger}
          onOpenChange={setShowCreateLedger}
          onSubmit={(data) => createLedgerMutation.mutate(data)}
          loading={createLedgerMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{session?.username || 'User'}</span></p>
          <h1 className="text-xl font-bold cursor-pointer select-none" onClick={handleLedgerNameClick}>{activeLedger?.name || 'Money Tracker'}</h1>
        </div>
        <Button
          size="icon"
          className="rounded-full h-10 w-10 shadow-lg"
          onClick={() => setShowAddPerson(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Pending" value={`₹${stats.totalPending.toLocaleString('en-IN')}`} icon={Wallet} variant="pending" />
          <StatCard label="Today's Total" value={`₹${stats.todayTotal.toLocaleString('en-IN')}`} icon={TrendingUp} variant="today" />
          <StatCard label="Total Given" value={`₹${stats.totalGiven.toLocaleString('en-IN')}`} icon={ArrowUpRight} variant="given" />
          <StatCard label="Total Received" value={`₹${stats.totalReceived.toLocaleString('en-IN')}`} icon={ArrowDownLeft} variant="received" />
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-4">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* People List */}
      <div className="space-y-2">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : filteredPersons.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No results found' : 'No people added yet'}
            description={searchQuery ? 'Try a different search term' : 'Add a person to start tracking transactions'}
            actionLabel={!searchQuery ? 'Add Person' : undefined}
            onAction={!searchQuery ? () => setShowAddPerson(true) : undefined}
          />
        ) : (
          filteredPersons.map(person => (
            <PersonCard key={person.id} person={person} />
          ))
        )}
      </div>

      <AddPersonDialog
        open={showAddPerson}
        onOpenChange={setShowAddPerson}
        onSubmit={(data) => addPersonMutation.mutate(data)}
        loading={addPersonMutation.isPending}
      />

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import PersonCard from '@/components/dashboard/PersonCard';
import SearchFilter from '@/components/common/SearchFilter';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function PeopleList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('balance_desc');
  const queryClient = useQueryClient();

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => db.entities.Ledger.list('-created_date'),
  });

  const activeLedger = ledgers[0];

  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['persons', activeLedger?.id],
    queryFn: () => db.entities.Person.filter({ ledger_id: activeLedger.id }),
    enabled: !!activeLedger?.id,
  });

  useEffect(() => {
    const unsub = db.entities.Person.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    });
    return unsub;
  }, [queryClient]);

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

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">All People</h1>
      <div className="mb-4">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>
      <div className="space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : filteredPersons.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'No results' : 'No people yet'}
            description={searchQuery ? 'Try a different search' : 'Add people from the home screen'}
          />
        ) : (
          filteredPersons.map(person => (
            <PersonCard key={person.id} person={person} />
          ))
        )}
      </div>
    </div>
  );
}
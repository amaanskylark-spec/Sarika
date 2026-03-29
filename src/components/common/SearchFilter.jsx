import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SearchFilter({ searchQuery, onSearchChange, sortBy, onSortChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-xl h-10"
        />
      </div>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-36 rounded-xl h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="balance_desc">Highest Balance</SelectItem>
          <SelectItem value="balance_asc">Lowest Balance</SelectItem>
          <SelectItem value="recent">Recently Updated</SelectItem>
          <SelectItem value="settled">Settled First</SelectItem>
          <SelectItem value="name">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Loader2 } from 'lucide-react';

export default function AddPersonDialog({ open, onOpenChange, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    initial_balance: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      initial_balance: parseFloat(form.initial_balance) || 0,
    });
    setForm({ name: '', phone: '', initial_balance: '', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Person
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="e.g. Rahul"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              placeholder="e.g. +91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Initial Balance (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={form.initial_balance}
              onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11" disabled={loading || !form.name.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Person
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
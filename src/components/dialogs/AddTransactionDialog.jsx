import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AddTransactionDialog({ open, onOpenChange, onSubmit, loading, editData }) {
  const [form, setForm] = useState({
    amount: '',
    type: 'given',
    date: new Date().toISOString().split('T')[0],
    comment: '',
  });

  useEffect(() => {
    if (editData) {
      setForm({
        amount: String(editData.amount || ''),
        type: editData.type || 'given',
        date: editData.date || new Date().toISOString().split('T')[0],
        comment: editData.comment || '',
      });
    } else {
      setForm({
        amount: '',
        type: 'given',
        date: new Date().toISOString().split('T')[0],
        comment: '',
      });
    }
  }, [editData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'given' })}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                  form.type === 'given'
                    ? "border-destructive bg-destructive/8 text-destructive"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Money Given
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'received' })}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                  form.type === 'received'
                    ? "border-accent bg-accent/8 text-accent"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Money Received
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Amount (₹) *</Label>
            <Input
              type="number"
              placeholder="e.g. 20000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              min="0.01"
              step="0.01"
              className="text-lg font-semibold h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Comment / Note</Label>
            <Textarea
              placeholder="e.g. UPI payment received, First installment..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={2}
            />
          </div>
          <Button
            type="submit"
            className={cn(
              "w-full rounded-xl h-11",
              form.type === 'received' && "bg-accent hover:bg-accent/90"
            )}
            disabled={loading || !form.amount}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {editData ? 'Update Transaction' : form.type === 'given' ? 'Record Money Given' : 'Record Money Received'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, RotateCcw, QrCode, LogOut, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  verifyAdminCredentials,
  getTotpSecret,
  saveTotpSecret,
  generateTotpSecret,
  getTotpQrUrl,
  verifyTotp,
  setAdminSession,
  getAdminSession,
  clearAdminSession,
} from '@/lib/adminAuth';

// Step 1: Username/Password login
function AdminLoginStep({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verifyAdminCredentials(username, password)) {
      onSuccess();
    } else {
      setError('Invalid admin credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Shield className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted Area</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Username</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Admin username" className="h-11 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="h-11 rounded-xl pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
          <Button type="submit" className="w-full h-11 rounded-xl">Login</Button>
        </form>
      </div>
    </div>
  );
}

// Step 2: Google Authenticator
function AdminTotpStep({ onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const secret = getTotpSecret();

  useEffect(() => {
    if (!secret && !newSecret) {
      setNewSecret(generateTotpSecret());
    }
  }, []);

  const handleSetup = () => {
    saveTotpSecret(newSecret);
    setShowSetup(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const currentSecret = secret || newSecret;
    if (!currentSecret) { setError('Please set up authenticator first.'); return; }
    setLoading(true);
    const ok = await verifyTotp(currentSecret, code);
    setLoading(false);
    if (ok) {
      setAdminSession();
      onSuccess();
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-col items-center flex-1">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <QrCode className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Two-Factor Auth</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">Enter the 6-digit code from your authenticator app</p>
          </div>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-xs text-muted-foreground border rounded-lg px-2 py-1 hover:bg-muted transition-colors ml-2 mt-1 shrink-0"
          >
            {secret ? '✓ Setup Done' : 'Set Up'}
          </button>
        </div>

        {showSetup && (
          <div className="mb-6 p-4 border rounded-2xl bg-muted/30">
            {secret ? (
              <div className="flex items-center gap-2 text-sm text-accent">
                <CheckCircle2 className="h-4 w-4" />
                <span>Authenticator already set up. Scan a new QR to replace.</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">Scan this QR code with Google Authenticator app:</p>
            )}
            <img
              src={getTotpQrUrl(newSecret || secret)}
              alt="QR Code"
              className="mx-auto rounded-xl mb-3"
            />
            <p className="text-[10px] text-center text-muted-foreground mb-3 font-mono break-all">{newSecret || secret}</p>
            {!secret && (
              <Button onClick={handleSetup} className="w-full rounded-xl" size="sm">Save & Confirm Setup</Button>
            )}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="h-14 rounded-xl text-center text-2xl font-mono tracking-widest"
            maxLength={6}
          />
          {error && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
          <Button type="submit" className="w-full h-11 rounded-xl" disabled={code.length !== 6 || loading}>
            {loading ? 'Verifying...' : 'Verify & Enter'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Main Admin Panel content
function AdminContent({ onExit }) {
  const queryClient = useQueryClient();

  const { data: deletedEntries = [], isLoading } = useQuery({
    queryKey: ['deleted-entries'],
    queryFn: () => db.entities.DeletedEntry.list('-created_date'),
  });

  const recalcPersonBalance = async (personId) => {
    const allTxns = await db.entities.Transaction.filter({ person_id: personId });
    const given = allTxns.filter(t => t.type === 'given').reduce((s, t) => s + (t.amount || 0), 0);
    const received = allTxns.filter(t => t.type === 'received').reduce((s, t) => s + (t.amount || 0), 0);
    const balance = given - received;
    await db.entities.Person.update(personId, {
      current_balance: balance,
      status: balance === 0 ? 'settled' : 'pending',
    });
  };

  const restoreMutation = useMutation({
    mutationFn: async (entry) => {
      const data = JSON.parse(entry.entry_data);
      if (entry.entry_type === 'person') {
        // Restore person with recalculated balance
        const person = await db.entities.Person.create({
          name: data.name,
          phone: data.phone,
          notes: data.notes,
          ledger_id: data.ledger_id,
          initial_balance: data.initial_balance || 0,
          current_balance: data.current_balance || 0,
          status: data.status || 'pending',
        });
        // Also restore any transactions for this person stored in deleted entries
        const relatedTxns = deletedEntries.filter(e => e.entry_type === 'transaction' && JSON.parse(e.entry_data).person_id === entry.entry_id);
        for (const txnEntry of relatedTxns) {
          const txnData = JSON.parse(txnEntry.entry_data);
          await db.entities.Transaction.create({
            ...txnData,
            person_id: person.id,
          });
          await db.entities.DeletedEntry.delete(txnEntry.id);
        }
        await recalcPersonBalance(person.id);
      } else if (entry.entry_type === 'transaction') {
        await db.entities.Transaction.create({ ...data });
        if (data.person_id) await recalcPersonBalance(data.person_id);
      }
      await db.entities.DeletedEntry.delete(entry.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-entries'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleExit = () => {
    clearAdminSession();
    onExit();
  };

  const persons = deletedEntries.filter(e => e.entry_type === 'person');
  const transactions = deletedEntries.filter(e => e.entry_type === 'transaction');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h1 className="font-bold text-lg">Admin Panel</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExit} className="text-muted-foreground gap-1">
          <LogOut className="h-4 w-4" /> Exit
        </Button>
      </div>

      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-3 mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">Restricted Area — Admin Only. Session expires in 30 minutes.</p>
        </div>

        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <RotateCcw className="h-4 w-4" /> Deleted Persons ({persons.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : persons.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border rounded-2xl mb-6">No deleted persons found</div>
        ) : (
          <div className="space-y-2 mb-6">
            {persons.map(entry => {
              const data = JSON.parse(entry.entry_data);
              return (
                <div key={entry.id} className="bg-card border rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-bold text-destructive shrink-0">
                        {data.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Balance: ₹{Math.abs(data.current_balance || 0).toLocaleString('en-IN')} •{' '}
                          Deleted {format(new Date(entry.created_date), 'dd MMM yyyy')}
                        </p>
                        {entry.deleted_by && <p className="text-xs text-muted-foreground">By: {entry.deleted_by}</p>}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl shrink-0 gap-1"
                    onClick={() => restoreMutation.mutate(entry)}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <RotateCcw className="h-4 w-4" /> Deleted Transactions ({transactions.length})
        </h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border rounded-2xl">No deleted transactions found</div>
        ) : (
          <div className="space-y-2">
            {transactions.map(entry => {
              const data = JSON.parse(entry.entry_data);
              return (
                <div key={entry.id} className={cn("bg-card border rounded-2xl p-4 flex items-center justify-between gap-3")}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{data.type === 'given' ? 'Money Given' : 'Money Received'} — ₹{data.amount?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{entry.person_name && `Person: ${entry.person_name} • `}Deleted {format(new Date(entry.created_date), 'dd MMM yyyy')}</p>
                    {data.comment && <p className="text-xs text-muted-foreground mt-0.5">"{data.comment}"</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl shrink-0 gap-1"
                    onClick={() => restoreMutation.mutate(entry)}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel({ onClose }) {
  const [step, setStep] = useState(() => getAdminSession() ? 'content' : 'login');

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <button onClick={onClose} className="fixed top-4 right-4 z-50 p-2 rounded-full bg-muted hover:bg-muted/80">
        <X className="h-5 w-5" />
      </button>
      {step === 'login' && <AdminLoginStep onSuccess={() => setStep('totp')} />}
      {step === 'totp' && <AdminTotpStep onSuccess={() => setStep('content')} />}
      {step === 'content' && <AdminContent onExit={() => setStep('login')} />}
    </div>
  );
}
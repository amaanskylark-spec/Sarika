const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, UserPlus, LogOut, BookOpen, Users, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage({ session, onLogout }) {
  const user = session ? { full_name: session.username, email: session.username } : null;
  const [memberEmail, setMemberEmail] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => db.entities.Ledger.list('-created_date'),
  });

  const activeLedger = ledgers[0];

  const addMemberMutation = useMutation({
    mutationFn: async (email) => {
      if (!activeLedger) return;
      const currentMembers = activeLedger.members || [];
      if (currentMembers.includes(email)) {
        toast({ title: 'Member already exists', variant: 'destructive' });
        return;
      }
      await db.entities.Ledger.update(activeLedger.id, {
        members: [...currentMembers, email],
      });
      await db.entities.ActivityLog.create({
        ledger_id: activeLedger.id,
        user_name: user?.full_name,
        user_email: user?.email,
        action: `Added ${email} as a member`,
        action_type: 'member_added',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      setMemberEmail('');
      toast({ title: 'Member added and invited successfully' });
    },
  });

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      {/* Profile */}
      <Card className="rounded-2xl mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold">{user?.full_name || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Info */}
      {activeLedger && (
        <Card className="rounded-2xl mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Current Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">{activeLedger.name}</p>
              {activeLedger.description && (
                <p className="text-xs text-muted-foreground">{activeLedger.description}</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Members</p>
              <div className="space-y-1.5">
                {(activeLedger.members || []).map(email => (
                  <div key={email} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{email}</span>
                    {email === activeLedger.owner_email && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto font-medium">Owner</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs">Add Member</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="rounded-xl"
                  type="email"
                />
                <Button
                  size="sm"
                  className="rounded-xl px-4"
                  disabled={!memberEmail.trim() || addMemberMutation.isPending}
                  onClick={() => addMemberMutation.mutate(memberEmail.trim())}
                >
                  {addMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full rounded-xl h-11 text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
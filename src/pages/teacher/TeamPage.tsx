import { useState } from 'react';
import type React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { Mail, Phone, RotateCcw, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useTeachingAssistants } from '../../api/queries';
import type { StaffUser } from '../../api/queries';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { EmptyState, PageHeader, Skeleton } from '../../components/common';

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '' };

function apiError(err: unknown, fallback: string) {
  return (isAxiosError(err) && err.response?.data?.error) || fallback;
}

/** SuperAdmin-only: add, suspend and reactivate teaching assistants. */
export function TeamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const { data, isLoading } = useTeachingAssistants(isSuperAdmin);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirming, setConfirming] = useState<StaffUser | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tas'] });

  const addTa = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/tas', form)).data,
    onSuccess: () => {
      setOpen(false);
      setForm(EMPTY_FORM);
      refresh();
    },
  });
  const suspend = useMutation({
    mutationFn: async (userId: string) => apiClient.delete(`/admin/tas/${userId}`),
    onSuccess: () => {
      setConfirming(null);
      refresh();
    },
  });
  const reactivate = useMutation({
    mutationFn: async (userId: string) => apiClient.post(`/admin/tas/${userId}/reactivate`),
    onSuccess: refresh,
  });

  if (!isSuperAdmin) {
    return <EmptyState icon={ShieldOff} title="SuperAdmin only" description="Only the class owner can manage the teaching team." />;
  }

  const tas = [...(data ?? [])].sort((a, b) => (a.status === 'suspended' ? 1 : 0) - (b.status === 'suspended' ? 1 : 0) || a.firstName.localeCompare(b.firstName));
  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Teaching team"
        description="Teaching assistants can manage questions, quizzes, students, attendance and payments, but not the team itself."
        actions={
          <Button onClick={() => setOpen(true)}>
            <UserPlus /> Add assistant
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : tas.length === 0 ? (
        <Card className="py-0">
          <EmptyState
            icon={ShieldCheck}
            title="No teaching assistants yet"
            description="Add an assistant and they’ll get an email with a temporary password."
            action={
              <Button onClick={() => setOpen(true)}>
                <UserPlus /> Add assistant
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tas.map((ta) => {
            const suspended = ta.status === 'suspended';
            const name = `${ta.firstName} ${ta.lastName}`.trim() || ta.email;
            return (
              <Card key={ta.userId} className={suspended ? 'opacity-70' : 'interactive'}>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar id={ta.userId} name={name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      <Badge variant={suspended ? 'destructive' : 'success'} className="mt-1">
                        {suspended ? 'Suspended' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="size-3.5 shrink-0" /> {ta.email}
                    </p>
                    {ta.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="size-3.5 shrink-0" /> {ta.phone}
                      </p>
                    )}
                    {ta.createdAt && <p className="text-xs">Added {format(new Date(ta.createdAt), 'd MMM yyyy')}</p>}
                  </div>
                  {suspended ? (
                    <Button variant="outline" className="w-full" disabled={reactivate.isPending} onClick={() => reactivate.mutate(ta.userId)}>
                      <RotateCcw /> Reactivate
                    </Button>
                  ) : (
                    <Button variant="destructive" className="w-full" onClick={() => setConfirming(ta)}>
                      <ShieldOff /> Suspend access
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {reactivate.isError && <p className="text-sm text-destructive">{apiError(reactivate.error, 'Couldn’t reactivate. Please try again.')}</p>}

      {/* Add */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) addTa.reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a teaching assistant</DialogTitle>
            <DialogDescription>They’ll receive an email with a temporary password and must set a new one at first sign-in.</DialogDescription>
          </DialogHeader>
          <form
            id="add-ta"
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              addTa.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ta-first">First name</Label>
                <Input id="ta-first" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ta-last">Last name</Label>
                <Input id="ta-last" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-email">Email</Label>
              <Input id="ta-email" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-phone">Phone (optional)</Label>
              <Input id="ta-phone" type="tel" placeholder="07X XXX XXXX" value={form.phone} onChange={set('phone')} />
            </div>
            {addTa.isError && <p className="text-sm text-destructive">{apiError(addTa.error, 'Couldn’t add the assistant.')}</p>}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-ta" disabled={addTa.isPending}>
              {addTa.isPending ? 'Adding…' : 'Add assistant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm suspend */}
      <Dialog open={!!confirming} onOpenChange={(o) => { if (!o) { setConfirming(null); suspend.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend {confirming?.firstName}?</DialogTitle>
            <DialogDescription>
              They’re signed out everywhere and can’t sign in again until you reactivate them. Nothing they created is deleted.
            </DialogDescription>
          </DialogHeader>
          {suspend.isError && <p className="text-sm text-destructive">{apiError(suspend.error, 'Couldn’t suspend.')}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={suspend.isPending} onClick={() => confirming && suspend.mutate(confirming.userId)}>
              {suspend.isPending ? 'Suspending…' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

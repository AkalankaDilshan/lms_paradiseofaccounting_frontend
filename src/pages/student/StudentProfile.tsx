import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar } from '../../components/ui/avatar';
import { User, Mail, Phone, School, CalendarDays, MapPin, Key, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '../../contexts/AuthContext';

interface StudentProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school: string;
  examYear: number;
  address: string;
  role: string;
  status: string;
  verificationStatus: 'auto_approved' | 'pending_review';
  groups: string[];
}

export function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ phone: '', address: '' });

  // Change password state
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentProfile', user?.sub],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/students/${user?.sub}`);
      return res.data as StudentProfile;
    },
    enabled: !!user?.sub,
  });

  // Sync form data when profile loads (TanStack v5: no onSuccess callback)
  useEffect(() => {
    if (data) {
      setFormData({ phone: data.phone || '', address: data.address || '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.phone, data?.address]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/admin/students/${user?.sub}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      setEditMode(false);
    },
  });

  const handleChangePassword = () => {
    setPwError('');
    setPwSuccess('');
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return; }
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (!userPool) { setPwError('Auth not configured.'); return; }

    setPwLoading(true);
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) { setPwError('Session expired. Please log in again.'); setPwLoading(false); return; }

    cognitoUser.getSession((err: Error | null) => {
      if (err) { setPwError('Session expired.'); setPwLoading(false); return; }
      (cognitoUser as CognitoUser).changePassword(pwOld, pwNew, (err2) => {
        setPwLoading(false);
        if (err2) { setPwError(err2.message || 'Failed to change password.'); return; }
        setPwSuccess('Password changed successfully!');
        setPwOld(''); setPwNew(''); setPwConfirm('');
      });
    });
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to load profile.</div>;

  const displayName = `${data.firstName} ${data.lastName}`;
  const verificationColor = data.verificationStatus === 'auto_approved'
    ? 'bg-success/15 text-success'
    : 'bg-warning/15 text-warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6 pb-16"
    >
      <div>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-muted-foreground">View and manage your account information.</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-5 items-start">
          <Avatar id={user?.sub || ''} name={displayName} size="lg" className="h-20 w-20 text-2xl shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-muted-foreground">{data.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${verificationColor}`}>
                <ShieldCheck className="inline w-3 h-3 mr-1" />
                {data.verificationStatus === 'auto_approved' ? 'Verified' : 'Pending Review'}
              </span>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-primary/15 text-primary">
                {data.role}
              </span>
              {data.groups.map(g => (
                <span key={g} className="text-xs px-2 py-1 rounded-full font-medium bg-white/10 text-foreground">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Personal Information</CardTitle>
          {!editMode ? (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button size="sm" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoField icon={User} label="First Name" value={data.firstName} />
            <InfoField icon={User} label="Last Name" value={data.lastName} />
            <InfoField icon={Mail} label="Email" value={data.email} />
            <InfoField icon={School} label="School" value={data.school} />
            <InfoField icon={CalendarDays} label="Exam Year" value={String(data.examYear)} />

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5" /> Phone
              </Label>
              {editMode ? (
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  className="h-10"
                />
              ) : (
                <p className="text-sm font-medium">{data.phone || '—'}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" /> Address
            </Label>
            {editMode ? (
              <Input
                value={formData.address}
                onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                className="h-10"
              />
            ) : (
              <p className="text-sm font-medium">{data.address || '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-4 h-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pwOld">Current Password</Label>
            <Input id="pwOld" type="password" value={pwOld} onChange={e => setPwOld(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwNew">New Password</Label>
            <Input id="pwNew" type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwConfirm">Confirm New Password</Label>
            <Input id="pwConfirm" type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} className="h-10" />
          </div>
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-success">{pwSuccess}</p>}
          <Button onClick={handleChangePassword} disabled={pwLoading}>
            {pwLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoField({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

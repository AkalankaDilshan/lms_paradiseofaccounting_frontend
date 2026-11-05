import { useNavigate } from 'react-router-dom';
import { ChevronRight, Moon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { DemoRole } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ThemeToggle } from '../../components/theme-toggle';
import { PageHeader } from '../../components/common';

export function SettingsPage() {
  const { user, isDemo, switchRole } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'Student';
  const displayName = user?.name || user?.username || 'Guest';

  const handleRole = (role: DemoRole) => {
    switchRole(role);
    navigate(role === 'Student' ? '/student' : '/teacher');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Account" title="Settings" description="Your profile and workspace preferences." />

      <div className="stagger space-y-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar id={user?.sub || 'guest'} name={displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{displayName}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="primary">{user?.role}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Moon className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Appearance</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark theme.</p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        {user?.role === 'SuperAdmin' && (
          <Card className="interactive cursor-pointer" onClick={() => navigate('/teacher/team')}>
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Teaching team</p>
                <p className="text-xs text-muted-foreground">Add, suspend or reactivate teaching assistants.</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {isDemo && (
          <Card>
            <CardHeader>
              <CardTitle>Demo workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant={isStudent ? 'default' : 'outline'} onClick={() => handleRole('Student')}>
                View as student
              </Button>
              <Button variant={!isStudent ? 'default' : 'outline'} onClick={() => handleRole('TA')}>
                View as teacher
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

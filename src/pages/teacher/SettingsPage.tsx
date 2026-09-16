import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { DemoRole } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ThemeToggle } from '../../components/theme-toggle';

export function SettingsPage() {
  const { user, isDemo, switchRole } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'Student';

  const handleRole = (role: DemoRole) => {
    switchRole(role);
    navigate(role === 'Student' ? '/student' : '/teacher');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace profile and demo options.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar id={user?.username || 'guest'} name={user?.username || 'Guest'} size="lg" />
          <div>
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{user?.role}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Toggle light and dark theme.</p>
          <ThemeToggle />
        </CardContent>
      </Card>
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
  );
}

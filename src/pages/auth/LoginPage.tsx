import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { userPool, useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challengeUser, setChallengeUser] = useState<CognitoUser | null>(null);
  const [requiredAttributes, setRequiredAttributes] = useState<Record<string, string>>({});
  const { refreshSession, signInDemo, isDemo } = useAuth();
  const navigate = useNavigate();

  const enterDemo = (role: 'Student' | 'TA') => {
    signInDemo(role);
    navigate(role === 'Student' ? '/student' : '/teacher');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (import.meta.env.VITE_USE_MOCK || isDemo) {
      enterDemo('TA');
      return;
    }

    if (!userPool) {
      setError('Authentication is not configured for this environment.');
      setLoading(false);
      return;
    }

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: () => {
        refreshSession().then(() => {
          navigate('/');
        });
      },
      onFailure: (err) => {
        setError(err.message || 'Login failed');
        setLoading(false);
      },
      newPasswordRequired: (userAttributes) => {
        setChallengeUser(cognitoUser);
        const attrs = { ...userAttributes };
        delete attrs.email_verified;
        delete attrs.phone_number_verified;
        setRequiredAttributes(attrs);
        setLoading(false);
      },
    });
  };

  const handleNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    challengeUser!.completeNewPasswordChallenge(newPassword, requiredAttributes, {
      onSuccess: () => {
        refreshSession().then(() => {
          navigate('/');
        });
      },
      onFailure: (err) => {
        setError(err.message || 'Failed to set new password');
        setLoading(false);
      },
    });
  };

  if (challengeUser) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mb-4 flex justify-center">
              <img src="/logoIcon.png" alt="Asela LMS" className="h-12 w-12 rounded-xl object-cover" />
            </div>
            <CardTitle className="text-center text-2xl">Set New Password</CardTitle>
            <CardDescription className="text-center">
              Your temporary password must be changed before you can continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Set Password & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <img src="/logoIcon.png" alt="Asela LMS" className="h-12 w-12 rounded-xl object-cover" />
          </div>
          <CardTitle className="text-center text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-center">
            {isDemo ? 'Open a demo workspace or sign in with your account.' : 'Enter your email to sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDemo && (
            <div className="mb-5 grid grid-cols-2 gap-2">
              <Button type="button" onClick={() => enterDemo('TA')}>
                Teacher demo
              </Button>
              <Button type="button" variant="outline" onClick={() => enterDemo('Student')}>
                Student demo
              </Button>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required={!isDemo}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required={!isDemo}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { userPool, useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

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

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left side - Form */}
      <div className="flex flex-col p-8 lg:p-12 xl:p-16">
        <div className="mb-12">
          <img src="/logoIcon.png" alt="Asela LMS" className="h-10 w-10 rounded-lg object-cover" />
        </div>
        
        <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center mb-12">
          {challengeUser ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Set New Password</h1>
              <p className="text-muted-foreground mb-8">
                Your temporary password must be changed before you can continue.
              </p>

              <form onSubmit={handleNewPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button className="w-full h-11" type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Set Password & Continue'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
              <p className="text-muted-foreground mb-8">
                {isDemo ? 'Open a demo workspace or sign in with your account.' : 'Enter your email to sign in to your account.'}
              </p>

              {isDemo && (
                <div className="mb-8 grid grid-cols-2 gap-3">
                  <Button type="button" onClick={() => enterDemo('TA')} variant="outline" className="h-11">
                    Teacher demo
                  </Button>
                  <Button type="button" onClick={() => enterDemo('Student')} variant="outline" className="h-11">
                    Student demo
                  </Button>
                </div>
              )}

              {isDemo && (
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or sign in with email</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required={!isDemo}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required={!isDemo}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button className="w-full h-11 text-base" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          © 2026 Paradise of Accounting
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block relative bg-muted h-full w-full">
        <img 
          src="/auth-bg.jpg" 
          alt="Abstract 3D pattern" 
          className="absolute inset-0 h-full w-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    </div>
  );
}

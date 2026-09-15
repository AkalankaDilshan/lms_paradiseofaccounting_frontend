import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (import.meta.env.VITE_USE_MOCK) {
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 500);
      return;
    }

    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.forgotPassword({
      onSuccess: () => {
        setStep(2);
        setLoading(false);
      },
      onFailure: (err) => {
        setError(err.message || 'Failed to send reset code');
        setLoading(false);
      },
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (import.meta.env.VITE_USE_MOCK) {
      setTimeout(() => {
        navigate('/login');
      }, 500);
      return;
    }

    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        navigate('/login');
      },
      onFailure: (err) => {
        setError(err.message || 'Failed to reset password');
        setLoading(false);
      },
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {step === 1 ? 'Enter your email to receive a reset code.' : 'Enter the code sent to your email and your new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" type="email" required 
                  value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input 
                  id="code" required 
                  value={code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" type="password" required minLength={8}
                  value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-primary hover:underline font-medium">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

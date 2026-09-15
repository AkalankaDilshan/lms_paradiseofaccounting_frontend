import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', 
    phone: '', school: '', examYear: '', address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Android PWA Install logic
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  // iOS Safari detection for PWA
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
  const showIosPrompt = isIos && !isStandalone && success;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (import.meta.env.VITE_USE_MOCK) {
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
      }, 500);
      return;
    }

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: formData.email }),
      new CognitoUserAttribute({ Name: 'custom:firstName', Value: formData.firstName }),
      new CognitoUserAttribute({ Name: 'custom:lastName', Value: formData.lastName }),
      new CognitoUserAttribute({ Name: 'custom:phone', Value: formData.phone }),
      new CognitoUserAttribute({ Name: 'custom:school', Value: formData.school }),
      new CognitoUserAttribute({ Name: 'custom:examYear', Value: formData.examYear }),
      new CognitoUserAttribute({ Name: 'custom:address', Value: formData.address }),
    ];

    userPool.signUp(formData.email, formData.password, attributeList, [], (err) => {
      setLoading(false);
      if (err) {
        setError(err.message || 'Signup failed');
        return;
      }
      setSuccess(true);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-success/10 p-3 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <CardTitle>Account Created!</CardTitle>
            <CardDescription>
              Please check your email to verify your account before logging in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Android PWA Install */}
            {deferredPrompt && !isStandalone && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">Install App for Best Experience</h3>
                <p className="text-sm text-muted-foreground mb-4">Add this LMS to your home screen for faster access and fullscreen view.</p>
                <Button onClick={handleInstallClick} className="w-full">Install App</Button>
              </div>
            )}

            {/* iOS PWA Install */}
            {showIosPrompt && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-left">
                <h3 className="font-semibold text-primary mb-2 text-center">Install on iOS</h3>
                <p className="text-sm text-muted-foreground mb-2">To install this app on your iPhone/iPad:</p>
                <ol className="text-sm text-muted-foreground list-decimal pl-4 space-y-1">
                  <li>Tap the <strong>Share</strong> icon in Safari's bottom bar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
            )}

            <Link to="/login">
              <Button variant="outline" className="w-full mt-4">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join the Accounting with Asela platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" required value={formData.firstName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" required value={formData.lastName} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={formData.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={formData.password} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" required value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examYear">A/L Exam Year</Label>
                <Input id="examYear" type="number" required value={formData.examYear} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input id="school" required value={formData.school} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input id="address" value={formData.address} onChange={handleChange} />
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

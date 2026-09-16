import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

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

    if (!userPool) {
      setError('Authentication is not configured for this environment.');
      setLoading(false);
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

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left side - Form */}
      <div className="flex flex-col p-8 lg:p-12 xl:p-16">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logoIcon.png" alt="Asela LMS" className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-semibold text-xl tracking-tight">Accounting with Asela</span>
        </div>
        
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center mb-12">
          {success ? (
            <>
              <div className="mx-auto bg-success/10 p-3 rounded-full mb-6 w-16 h-16 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">Account Created!</h1>
              <p className="text-muted-foreground mb-8 text-center">
                Please check your email to verify your account before logging in.
              </p>

              {/* Android PWA Install */}
              {deferredPrompt && !isStandalone && (
                <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl mb-6">
                  <h3 className="font-semibold text-primary mb-2">Install App for Best Experience</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add this LMS to your home screen for faster access and fullscreen view.</p>
                  <Button onClick={handleInstallClick} className="w-full h-11">Install App</Button>
                </div>
              )}

              {/* iOS PWA Install */}
              {showIosPrompt && (
                <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl mb-6 text-left">
                  <h3 className="font-semibold text-primary mb-2 text-center">Install on iOS</h3>
                  <p className="text-sm text-muted-foreground mb-2">To install this app on your iPhone/iPad:</p>
                  <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                    <li>Tap the <strong>Share</strong> icon in Safari's bottom bar.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  </ol>
                </div>
              )}

              <Link to="/login">
                <Button variant="outline" className="w-full h-11">Go to Login</Button>
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Create an Account</h1>
              <p className="text-muted-foreground mb-8">
                Join the Accounting with Asela platform.
              </p>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={formData.firstName} onChange={handleChange} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={formData.lastName} onChange={handleChange} className="h-11" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={handleChange} className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={8} value={formData.password} onChange={handleChange} className="h-11" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" required value={formData.phone} onChange={handleChange} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examYear">A/L Exam Year</Label>
                    <Input id="examYear" type="number" required value={formData.examYear} onChange={handleChange} className="h-11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input id="school" required value={formData.school} onChange={handleChange} className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input id="address" value={formData.address} onChange={handleChange} className="h-11" />
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                
                <Button className="w-full h-11 text-base mt-2" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
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
      <div className="hidden lg:block relative bg-muted h-full w-full overflow-hidden">
        <img 
          src="/auth-bg.jpg" 
          alt="Abstract 3D pattern" 
          className="absolute inset-0 h-full w-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/40" />
        {/* Floating Green Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-48 h-48 bg-green-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
          <div className="absolute top-[40%] right-[20%] w-64 h-64 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-[20%] left-[30%] w-56 h-56 bg-teal-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>
    </div>
  );
}

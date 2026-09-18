import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Clock } from 'lucide-react';

/**
 * Shown to a student who has confirmed their email but hasn't been approved
 * by a SuperAdmin/TA yet (User.status === "pending" in DynamoDB). Their JWT
 * carries no "Student" Cognito group claim until approval (see
 * post_confirmation.py), so every role-gated API route already rejects them —
 * this page is purely the friendly explanation for that locked-out state.
 */
export function PendingApprovalPage() {
  const { signOut, forceRefreshSession, user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [stillPending, setStillPending] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    setStillPending(false);
    await forceRefreshSession();
    setChecking(false);
    setStillPending(true);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Clock className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Waiting for Admin Approval</h1>
        <p className="mb-1 text-muted-foreground">
          Thanks for verifying your email{user?.email ? `, ${user.email}` : ''}. A SuperAdmin or TA
          still needs to confirm you're an enrolled student before you can access the platform.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          This is usually quick — check back soon, or contact Asela directly if it's been a while.
        </p>

        {stillPending && (
          <p className="mb-4 text-sm font-medium text-accent">
            Still pending — you'll be let in automatically as soon as you're approved.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={handleCheckAgain} disabled={checking} className="w-full h-11">
            {checking ? 'Checking...' : 'Check Approval Status'}
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="w-full h-11">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

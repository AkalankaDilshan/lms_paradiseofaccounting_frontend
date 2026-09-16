import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'dummy-pool',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'dummy-client',
};
const hasCognitoConfig = Boolean(import.meta.env.VITE_COGNITO_USER_POOL_ID && import.meta.env.VITE_COGNITO_CLIENT_ID);
export const userPool = hasCognitoConfig ? new CognitoUserPool(poolData) : null;

export type UserRole = 'Student' | 'TA' | 'SuperAdmin' | null;
export type DemoRole = 'Student' | 'TA';
export interface User {
  username: string;
  sub: string;       // Cognito UUID — use for API calls
  role: UserRole;
  email: string;
}

const ROLE_KEY = 'lms-demo-role';
const SIGNED_OUT_KEY = 'lms-demo-signed-out';

function demoUser(role: DemoRole): User {
  if (role === 'Student') {
    return { username: 'Akalanka Dilshan', sub: 'demo-student-sub', email: 'akalanka@student.lk', role: 'Student' };
  }
  return { username: 'Asela', sub: 'demo-teacher-sub', email: 'asela@paradiseofaccounting.lk', role: 'TA' };
}

function readStoredRole(): DemoRole {
  return localStorage.getItem(ROLE_KEY) === 'Student' ? 'Student' : 'TA';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  idToken: string | null;
  signOut: () => void;
  refreshSession: () => Promise<void>;
  signInDemo: (role: DemoRole) => void;
  switchRole: (role: DemoRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyDemoSession = useCallback((role: DemoRole) => {
    localStorage.setItem(ROLE_KEY, role);
    localStorage.removeItem(SIGNED_OUT_KEY);
    setUser(demoUser(role));
    setIdToken('mock-token');
  }, []);

  const fetchSession = useCallback(async () => {
    const cognitoUser = userPool?.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          setUser(null);
          setIdToken(null);
          setIsLoading(false);
          return;
        }
        const token = session.getIdToken().getJwtToken();
        const payload = session.getIdToken().decodePayload();
        const role = (payload['cognito:groups']?.[0] as User['role']) || (import.meta.env.VITE_USE_MOCK ? 'Student' : null);
        setUser({ username: cognitoUser.getUsername(), sub: payload.sub || '', email: (payload.email as string) || '', role });
        setIdToken(token);
        setIsLoading(false);
      });
      return;
    }

    if (!hasCognitoConfig || import.meta.env.VITE_API_BASE_URL?.includes('localhost')) {
      if (localStorage.getItem(SIGNED_OUT_KEY) === '1') {
        setUser(null);
        setIdToken(null);
      } else {
        const role = readStoredRole();
        setUser(demoUser(role));
        setIdToken('mock-token');
      }
      setIsLoading(false);
      return;
    }

    setUser(null);
    setIdToken(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const signOut = () => {
    userPool?.getCurrentUser()?.signOut();
    if (!hasCognitoConfig) localStorage.setItem(SIGNED_OUT_KEY, '1');
    setUser(null);
    setIdToken(null);
  };

  const signInDemo = (role: DemoRole) => {
    applyDemoSession(role);
  };

  const switchRole = (role: DemoRole) => {
    applyDemoSession(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isDemo: !hasCognitoConfig,
        idToken,
        signOut,
        refreshSession: fetchSession,
        signInDemo,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

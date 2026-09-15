import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'dummy-pool',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'dummy-client',
};

export const userPool = new CognitoUserPool(poolData);

interface User {
  username: string;
  role: 'Student' | 'TA' | 'SuperAdmin' | null;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  idToken: string | null;
  signOut: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    const cognitoUser = userPool.getCurrentUser();
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
        
        // Defaulting role to Student if missing (for dev mocking)
        const role = (payload['cognito:groups']?.[0]) as User['role'] || 
                     (import.meta.env.VITE_USE_MOCK ? 'Student' : null);

        setUser({
          username: cognitoUser.getUsername(),
          email: payload.email || '',
          role,
        });
        setIdToken(token);
        setIsLoading(false);
      });
    } else {
      // Mocked dev environment fallback if no cognito setup
      if (import.meta.env.VITE_API_BASE_URL?.includes('localhost')) {
         setUser({ username: 'test-user', email: 'test@example.com', role: 'Student' });
         setIdToken('mock-token');
      } else {
         setUser(null);
         setIdToken(null);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const signOut = () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    setUser(null);
    setIdToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, idToken, signOut, refreshSession: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

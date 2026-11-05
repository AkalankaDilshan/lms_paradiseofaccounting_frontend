import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';

// Mock mode is opt-in: only an explicit VITE_USE_MOCK=true (local .env) swaps the
// real API/Cognito for axios-mock-adapter + demo users. Unset in Amplify builds.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

export const userPool = userPoolId && clientId
  ? new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId })
  : null;

/**
 * Current user's ID token, or null when signed out. getSession() transparently
 * uses the refresh token once the 1-hour ID token expires, so callers always
 * get a valid JWT for as long as the 30-day refresh token lasts.
 */
export function getIdToken(): Promise<string | null> {
  const cognitoUser = userPool?.getCurrentUser();
  if (!cognitoUser) return Promise.resolve(null);
  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      resolve(err || !session?.isValid() ? null : session.getIdToken().getJwtToken());
    });
  });
}

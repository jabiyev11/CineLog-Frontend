import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { setStoredAuth, getStoredAuth } from '../lib/storage';
import { requestGoogleCredential } from '../lib/google';
import type { AuthResponse } from '../types/models';

type AuthContextValue = {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  logout: () => void;
  setAuthFromVerification: (auth: AuthResponse) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth());

  useEffect(() => {
    setStoredAuth(auth);
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      async login(payload) {
        const response = await api.login(payload);
        setAuth(response);
        return response;
      },
      async loginWithGoogle() {
        const credential = await requestGoogleCredential();
        const response = await api.googleAuth(credential);
        setAuth(response);
        return response;
      },
      logout() {
        setAuth(null);
      },
      setAuthFromVerification(nextAuth) {
        setAuth(nextAuth);
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}

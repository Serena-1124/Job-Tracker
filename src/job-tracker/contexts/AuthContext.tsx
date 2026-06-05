import { createContext, useContext, useState, type ReactNode } from 'react';

type AuthMode = 'logged_in' | 'none';

interface AuthContextValue {
  mode: AuthMode;
  setLoggedIn: () => void;
  setNone: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  mode: 'none',
  setLoggedIn: () => {},
  setNone: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(() => {
    const saved = localStorage.getItem('job-tracker-auth-mode');
    if (saved === 'logged_in') return 'logged_in';
    return 'none';
  });

  const setLoggedIn = () => {
    setMode('logged_in');
    localStorage.setItem('job-tracker-auth-mode', 'logged_in');
  };

  const setNone = () => {
    setMode('none');
    localStorage.removeItem('job-tracker-auth-mode');
  };

  return (
    <AuthContext.Provider value={{ mode, setLoggedIn, setNone }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthMode() {
  return useContext(AuthContext);
}

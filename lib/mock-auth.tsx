import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MockAuthContextType {
  loggedIn: boolean;
  mockLogin: (email: string, password: string) => void;
  mockLogout: () => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  const mockEmail = 'user@example.com';
  const mockPassword = 'password123';

  const mockLogin = (email: string, password: string) => {
    if (email === mockEmail && password === mockPassword) {
      setLoggedIn(true);
      toast.success('Login successful! Redirecting to dashboard...');
      router.push('/dashboard');
    } else {
      toast.error('Invalid credentials. Please use the mock credentials provided.');
    }
  };

  const mockLogout = () => {
    setLoggedIn(false);
    toast.info('Logged out.');
    router.push('/login');
  };

  return (
    <MockAuthContext.Provider value={{ loggedIn, mockLogin, mockLogout }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}; 
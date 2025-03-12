import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { User, signIn, signUp, signOut, getCurrentUser } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize authentication state
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Try to get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        
        // If there's a session, get user data
        if (session) {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(!!userData);
        }
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        
        if (newSession) {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(!!userData);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await signIn(email, password);
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to sign in. Please check your credentials.');
      }
    } catch (e) {
      console.error('Error logging in:', e);
      setError(e instanceof Error ? e.message : 'An error occurred during login');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await signUp(email, password, firstName, lastName);
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        
        Alert.alert(
          'Account Created',
          'Your account has been created successfully!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Verification Required',
          'Please check your email to verify your account before logging in.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      console.error('Error registering:', e);
      setError(e instanceof Error ? e.message : 'An error occurred during registration');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
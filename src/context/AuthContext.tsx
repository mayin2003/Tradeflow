import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, company?: string) => Promise<{ session: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: { name?: string; companyName?: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          // Map Supabase user to our App User type
          const appUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            companyName: session.user.user_metadata?.company_name || 'My Business',
          };
          setUser(appUser);
        }
      } catch (err: any) {
        console.error('Auth session fetch failed:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const appUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          companyName: session.user.user_metadata?.company_name || 'My Business',
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error.message);
      throw error;
    }
    
    if (data.session?.user) {
      const appUser: User = {
        id: data.session.user.id,
        name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
        email: data.session.user.email || '',
        companyName: data.session.user.user_metadata?.company_name || 'My Business',
      };
      setUser(appUser);
    }
  };

  const register = async (name: string, email: string, password: string, company: string = 'TradeFlow') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          company_name: company,
        }
      }
    });
    
    if (error) {
      console.error('Signup error:', error.message);
      throw error;
    }

    if (data.session?.user) {
      const appUser: User = {
        id: data.session.user.id,
        name: name,
        email: email,
        companyName: company,
      };
      setUser(appUser);
      return { session: true };
    }
    
    return { session: false };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (data: { name?: string; companyName?: string }) => {
    if (!user) return;

    const { data: authData, error } = await supabase.auth.updateUser({
      data: {
        ...(data.name && { full_name: data.name }),
        ...(data.companyName && { company_name: data.companyName }),
      }
    });

    if (error) throw error;

    if (authData.user) {
      setUser({
        ...user,
        ...(data.name && { name: data.name }),
        ...(data.companyName && { companyName: data.companyName }),
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, resetPassword, updateUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

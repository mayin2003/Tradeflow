import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string, company?: string) => Promise<{ session: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: { name?: string; companyName?: string }) => Promise<void>;
  refreshSession: () => Promise<void>;
  setSession: (session: any) => Promise<void>;
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
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Your email address has not been confirmed yet. Please check your inbox for a verification link or disable "Confirm email" in your Supabase Auth settings.');
          }
          throw error;
        }
        
        if (session?.user) {
          // Map Supabase user to our App User type
          const appUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            companyName: session.user.user_metadata?.company_name || 'My Business',
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          };
          setUser(appUser);
        }
      } catch (err: any) {
        if (err.message.includes('Failed to fetch')) {
          console.warn('Network Error during Auth check: Proceeding as unauthenticated offline user.');
        } else {
          console.error('Auth session fetch failed:', err.message);
        }
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
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        companyName: session.user.user_metadata?.company_name || 'My Business',
        avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
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
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Your email address has not been confirmed yet. Please check your inbox for a verification link or disable "Confirm email" in your Supabase Auth settings.');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials or sign up for a new account.');
      }
      throw error;
    }
    
    if (data.session?.user) {
      const appUser: User = {
        id: data.session.user.id,
        name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'User',
        email: data.session.user.email || '',
        companyName: data.session.user.user_metadata?.company_name || 'My Business',
        avatar: data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture,
      };
      setUser(appUser);
    }
  };

  const signInWithGoogle = async () => {
    // Determine the redirect URL. We use current origin as fallback.
    // In AI Studio, window.location.origin within the iframe should be the proxy URL.
    // However, we use a more robust detection to avoid common redirect issues.
    let originToUse = window.location.origin;
    
    // Safety check for null or specific platform origins that might be incorrect
    if (!originToUse || originToUse === 'null' || originToUse.includes('aistudio.google.com')) {
      originToUse = window.location.href.split('/').slice(0, 3).join('/');
    }
    
    // Ensure no trailing slash
    if (originToUse.endsWith('/')) {
      originToUse = originToUse.slice(0, -1);
    }
    
    const redirectUrl = `${originToUse}/auth/callback`;
    
    console.log('[Supabase Auth] Attempting Google login');
    console.log('[Supabase Auth] Current Origin:', originToUse);
    console.log('[Supabase Auth] Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true
      }
    });

    if (error) {
      console.error('[Supabase Auth] Google login error:', error.message);
      if (error.message.includes('provider is not enabled')) {
        throw new Error('Google Sign-In is not enabled. Please go to Supabase Dashboard > Auth > Providers > Google and toggle "Enable Google" to ON.');
      }
      throw error;
    }

    if (data?.url) {
      console.log('[Supabase Auth] Opening OAuth popup');
      // Open the OAuth provider's URL directly in a popup
      const authWindow = window.open(
        data.url,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups to sign in with Google.');
      }
    }
  };

  const register = async (name: string, email: string, password: string, company: string = 'TradeFlow') => {
    // Stricter email validation: requires at least one char before @, a domain with a dot, and a 2+ char TLD
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address (e.g., name@example.com).');
    }

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
      if (error.message.includes('User already registered')) {
        throw new Error('This email is already registered. Please try logging in or use a different email.');
      }
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

  const resetPassword = React.useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const refreshSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        const appUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          companyName: session.user.user_metadata?.company_name || 'My Business',
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        };
        setUser(appUser);
      }
    } catch (err: any) {
      console.error('Session refresh failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = React.useCallback(async (session: any) => {
    setIsLoading(true);
    try {
      if (session?.user) {
        // Manually set the session in Supabase client
        await supabase.auth.setSession(session);
        
        const appUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          companyName: session.user.user_metadata?.company_name || 'My Business',
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        };
        setUser(appUser);
      }
    } catch (err: any) {
      console.error('Manual session set failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUser = React.useCallback(async (data: { name?: string; companyName?: string }) => {
    if (!user) return;

    const { data: authData, error } = await supabase.auth.updateUser({
      data: {
        ...(data.name && { full_name: data.name }),
        ...(data.companyName && { company_name: data.companyName }),
      }
    });

    if (error) throw error;

    if (authData.user) {
      setUser(prev => prev ? {
        ...prev,
        ...(data.name && { name: data.name }),
        ...(data.companyName && { companyName: data.companyName }),
      } : null);
    }
  }, [user]);

  const value = React.useMemo(() => ({
    user,
    login,
    signInWithGoogle,
    register,
    resetPassword,
    updateUser,
    refreshSession,
    setSession,
    logout,
    isLoading
  }), [user, login, signInWithGoogle, register, resetPassword, updateUser, refreshSession, setSession, logout, isLoading]);

  return (
    <AuthContext.Provider value={value}>
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

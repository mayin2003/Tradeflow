import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string, company?: string) => Promise<{ session: boolean; devCode?: string }>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: { name?: string; companyName?: string }) => Promise<void>;
  refreshSession: () => Promise<void>;
  setSession: (session: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  sendOTP: (email: string, registerData?: { name: string; password?: string; company?: string }) => Promise<any>;
  verifyOTP: (email: string, token: string, type: 'signup' | 'email') => Promise<void>;
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
          console.warn('Session check returned error:', error.message);
          // Highlight email confirmation required
          if (error.message?.includes('Email not confirmed')) {
            throw new Error('Your email address has not been confirmed yet. Please check your inbox for a verification link or disable "Confirm email" in your Supabase Auth settings.');
          }
          // For any other token/refresh error, clear storage so we don't throw or crash
          for (const key of Object.keys(localStorage)) {
            if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
              localStorage.removeItem(key);
            }
          }
          setUser(null);
          return;
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
        const errMsg = err?.message || '';
        console.warn('Exception during initial auth getSession check:', errMsg);
        // Safely clean storage to prevent further issues
        for (const key of Object.keys(localStorage)) {
          if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
            localStorage.removeItem(key);
          }
        }
        setUser(null);
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

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, company }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to start registration. Please try again.');
      }

      const data = await res.json();
      return { session: false, devCode: data.devCode };
    } catch (err: any) {
      console.error('Signup registration error:', err.message);
      throw err;
    }
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
      if (error) {
        console.warn('Session refresh returned error:', error.message);
        for (const key of Object.keys(localStorage)) {
          if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
            localStorage.removeItem(key);
          }
        }
        setUser(null);
        return;
      }
      
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
    } catch (err: any) {
      console.warn('Session refresh exception:', err.message);
      for (const key of Object.keys(localStorage)) {
        if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
          localStorage.removeItem(key);
        }
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = React.useCallback(async (session: any) => {
    setIsLoading(true);
    try {
      if (session?.user) {
        // Manually set the session in Supabase client
        const { error } = await supabase.auth.setSession(session);
        if (error) {
          console.warn('setSession returned error:', error.message);
          for (const key of Object.keys(localStorage)) {
            if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
              localStorage.removeItem(key);
            }
          }
          setUser(null);
          return;
        }
        
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
      console.warn('setSession exception:', err.message);
      for (const key of Object.keys(localStorage)) {
        if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
          localStorage.removeItem(key);
        }
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut failed (likely offline):', err);
    }
    for (const key of Object.keys(localStorage)) {
      if (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        localStorage.removeItem(key);
      }
    }
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

  const sendOTP = React.useCallback(async (email: string, registerData?: { name: string; password?: string; company?: string }) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        name: registerData?.name, 
        password: registerData?.password, 
        company: registerData?.company 
      }),
    });
    
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to send verification code. Please try again.');
    }
    
    return await res.json();
  }, []);

  const verifyOTP = React.useCallback(async (email: string, token: string, type: 'signup' | 'email') => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Incorrect or expired verification code.');
    }

    const data = await res.json();
    if (data.user) {
      const appUser: User = {
        id: data.user.id,
        name: data.user.name || email.split('@')[0],
        email: data.user.email,
        companyName: data.user.companyName || 'TradeFlow',
      };
      setUser(appUser);
      storage.setUser(appUser);
    }
  }, []);

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
    isLoading,
    sendOTP,
    verifyOTP
  }), [user, login, signInWithGoogle, register, resetPassword, updateUser, refreshSession, setSession, logout, isLoading, sendOTP, verifyOTP]);

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

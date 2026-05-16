import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthCallback = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Force session refresh to ensure it's loaded in this window
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (window.opener) {
          // Send success message to the parent window
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          // Close the popup after a brief delay
          setTimeout(() => window.close(), 1000);
        } else {
          // If opened directly, just redirect to home
          window.location.href = '/';
        }
      } catch (err: any) {
        console.error('Auth callback error:', err.message);
        setErrorMessage(err.message || 'Authentication failed');
        
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: err.message }, '*');
        }
      }
    };

    // Small delay to allow Supabase to process the hash/tokens in URL
    const timeout = setTimeout(handleCallback, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300 max-w-md w-full">
        {!errorMessage ? (
          <>
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Authenticating...</h1>
            <p className="text-slate-500 dark:text-slate-400">Completing your secure login to TradeFlow.</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-8">This window will close automatically.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">!</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Authentication Failed</h1>
            <p className="text-rose-600 dark:text-rose-400 font-medium mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.close()}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

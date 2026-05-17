import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthCallback = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Checking session (Attempt ' + (attempts + 1) + ')');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          console.log('AuthCallback: Session found, sending success message');
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            window.location.href = '/';
          }
          return;
        }

        // If no session and we have hash/search params, keep trying for a bit
        if (window.location.hash || window.location.search) {
          if (attempts < 10) {
            setTimeout(() => setAttempts(a => a + 1), 1000);
          } else {
            throw new Error('Authentication timeout. Please try again.');
          }
        } else {
          // If no hash/params and no session, we might have been opened incorrectly
          throw new Error('No authentication data found in URL.');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err.message);
        setErrorMessage(err.message || 'Authentication failed');
        
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: err.message }, '*');
        }
      }
    };

    handleCallback();
  }, [attempts]);

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

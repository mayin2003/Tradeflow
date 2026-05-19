import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Ship } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71a5.41 5.41 0 010-3.42V4.958H.957a8.991 8.991 0 000 8.084l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 3.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const LoginPage = ({ onBack }: { onBack: () => void }) => {
  const { login, register, resetPassword, signInWithGoogle, refreshSession, setSession } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length > 5) strength += 25;
    if (pass.length > 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return '';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  const strength = calculateStrength(password);
  const strengthLabel = getStrengthLabel(strength);

  const validateEmail = (email: string) => {
    // Stricter regex: requires at least one char before @, a domain with a dot, and a 2+ char TLD
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setStatus({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    
    setIsLoading(true);
    setStatus(null);
    
    try {
      await login(trimmedEmail, trimmedPassword);
    } catch (error: any) {
      let msg = error.message || 'Login failed. Please check your credentials.';
      // Note: AuthContext already maps some of these, but we keep this as defensive backup
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. Please try again or create a new account.';
      }
      setStatus({ type: 'error', message: msg });
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword || !fullName.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    
    setIsLoading(true);
    setStatus(null);
    
    try {
      const result = await register(fullName.trim(), trimmedEmail, trimmedPassword, companyName.trim() || 'TradeFlow');
      if (result.session) {
        setStatus({ type: 'success', message: 'Success! Logging you in...' });
      } else {
        setStatus({ type: 'success', message: 'Registration successful! Please check your email to verify your account.' });
        setTimeout(() => setTab('login'), 3000);
      }
    } catch (error: any) {
      let msg = error.message || 'Registration failed. Try a different email.';
      
      // Check if user is already registered to provide helpful UX
      if (msg.includes('already registered')) {
        setStatus({ 
          type: 'error', 
          message: 'This email is already registered. Did you mean to log in?' 
        });
      } else {
        setStatus({ type: 'error', message: msg });
      }
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    
    setIsLoading(true);
    setStatus(null);
    
    try {
      await resetPassword(trimmedEmail);
      setStatus({ type: 'success', message: 'Reset link sent! Please check your inbox.' });
      setTimeout(() => setTab('login'), 3000);
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to send reset link.' });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      await signInWithGoogle();
      
      const isInternal = window.location.hostname.includes('aistudio.google.com');
      const msg = isInternal 
        ? 'OAuth requires a public URL. Please click the "Shared App URL" in the bottom-right of the AI Studio editor to open the app in a new tab first, then try logging in there.'
        : 'Opening Google login window... Please complete authentication there.';
      
      setStatus({ 
        type: isInternal ? 'error' : 'success', 
        message: msg 
      });

      if (!isInternal && !window.location.host.includes('localhost')) {
        console.log('%c[Supabase Auth Tip]', 'color: #3ecf8e; font-weight: bold', 
          '\nIf the Google popup redirects to AI Studio 404 or localhost, ensure your Supabase configuration is updated:' +
          '\n1. Site URL: ' + window.location.origin +
          '\n2. Redirect URLs: ' + window.location.origin + '/auth/callback'
        );
      }
      
      if (isInternal) {
        setIsLoading(false);
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Google login failed.' });
      setIsLoading(false);
    }
  };

  // Listen for OAuth messages from popup
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log('LoginPage: Received OAUTH_AUTH_SUCCESS');
        const session = event.data.session;
        
        if (session) {
          console.log('LoginPage: Manually setting session');
          await setSession(session);
        } else {
          console.log('LoginPage: No session in message, falling back to refresh');
          await refreshSession();
        }
        
        setStatus({ type: 'success', message: 'Google authentication successful! Redirecting...' });
        setIsLoading(false);
      }
      if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setStatus({ type: 'error', message: event.data.error || 'Google authentication failed.' });
        setIsLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [refreshSession, setSession]);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 font-sans selection:bg-teal-100 dark:selection:bg-teal-900">
      
      {/* Logo Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 flex flex-col items-center"
      >
        <div className="text-4xl mb-2 drop-shadow-sm">🚢</div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">TradeFlow</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {tab === 'register' ? 'Create your global logistics account.' : 'Precision Logistics Cockpit'}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 p-10 relative z-10"
      >
        {tab !== 'register' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {tab === 'login' ? 'Secure Access' : 'Recover Access'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {tab === 'login' ? 'Enter your credentials to proceed.' : 'Enter your email to reset your security keys.'}
            </p>
          </div>
        )}

        {status && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium border relative overflow-hidden ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{status.message}</span>
              {status.type === 'error' && status.message.includes('already registered') && (
                <button 
                  onClick={() => {
                    setTab('login');
                    setStatus(null);
                  }}
                  className="shrink-0 text-rose-800 dark:text-rose-300 underline font-bold hover:no-underline"
                >
                  Login instead
                </button>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email or Username</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pilot@tradeflow.global" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <button 
                    onClick={() => setTab('forgot')}
                    className="text-sm font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition-all cursor-pointer shadow-sm" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    Remember me for 30 days
                  </span>
                </label>
              </div>

              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-[0_4px_20px_-4px_rgba(20,184,166,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(20,184,166,0.5)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Log In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <span className="relative px-4 bg-white dark:bg-slate-900 text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-[0.98]"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div className="text-center mt-6">
                <p className="text-sm font-medium text-slate-500">
                  Don't have an account? <button onClick={() => setTab('register')} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Sign Up</button>
                </p>
              </div>
            </motion.div>
          ) : tab === 'register' ? (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-1 tracking-wider uppercase">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-1 tracking-wider uppercase">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-1 tracking-wider uppercase">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password Strength Bar */}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${strength}%` }}
                      className={`h-full transition-all duration-500 ${
                        strength <= 25 ? 'bg-rose-400' :
                        strength <= 50 ? 'bg-amber-400' :
                        strength <= 75 ? 'bg-teal-400' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight w-10">{strengthLabel}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-1 tracking-wider uppercase">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors">
                    <div className="relative">
                      <Lock size={18} />
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-950 rounded-full p-0.5">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full h-14 bg-transparent group hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-teal-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-[0.98]"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div className="text-center mt-6">
                <p className="text-sm font-medium text-slate-500">
                  Already have an account? <button onClick={() => setTab('login')} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Log In</button>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Account Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email" 
                  className="w-full px-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>
              <button 
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link →'}
              </button>
              <button 
                onClick={() => setTab('login')}
                className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                ← Back to login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Support & Footer */}
      <div className="mt-8 text-center space-y-8">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Need assistance? <button className="text-teal-600 dark:text-teal-400 font-bold hover:underline underline-offset-4 tracking-tight transition-all">Contact Support</button>
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full max-w-7xl px-4 text-[13px] font-medium tracking-tight text-slate-400">
          <div className="order-2 md:order-1">
            © 2026 TradeFlow Global. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 order-1 md:order-2">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

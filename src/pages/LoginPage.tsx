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
  const { login, register, resetPassword, signInWithGoogle, refreshSession, setSession, sendOTP, verifyOTP } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'otp-login'>('login');
  const [otpToken, setOtpToken] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpType, setOtpType] = useState<'signup' | 'email'>('email');
  const [temporaryEmail, setTemporaryEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);

  React.useEffect(() => {
    if (rateLimitTimer === 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

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
        setIsLoading(false);
      } else {
        setTemporaryEmail(trimmedEmail);
        setOtpType('signup');
        setShowOtpInput(true);
        const msg = result.devCode 
          ? `Registration initiated! A 6-digit verification code has been sent to your email. (SANDBOX DEV CODE: ${result.devCode})`
          : 'Registration initiated! A 6-digit verification code has been sent to your email.';
        setStatus({ type: 'success', message: msg });
        setIsLoading(false);
      }
    } catch (error: any) {
      let msg = error.message || 'Registration failed. Try a different email.';
      
      // Check if user is already registered to provide helpful UX
      if (msg.includes('already registered')) {
        setStatus({ 
          type: 'error', 
          message: 'This email is already registered. Did you mean to log in?' 
        });
      } else if (msg.toLowerCase().includes('rate limit')) {
        setRateLimitTimer(60);
        setStatus({
          type: 'error',
          message: 'Too many verification code requests (rate limit exceeded). Please wait 60 seconds before trying again.'
        });
      } else {
        setStatus({ type: 'error', message: msg });
      }
      setIsLoading(false);
    }
  };

  const handleSendLoginOTP = async () => {
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
      await sendOTP(trimmedEmail);
      setTemporaryEmail(trimmedEmail);
      setOtpType('email');
      setShowOtpInput(true);
      setStatus({ type: 'success', message: 'A 6-digit verification code has been sent to your email.' });
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('rate limit')) {
        setRateLimitTimer(60);
        setStatus({
          type: 'error',
          message: 'Too many login attempts (rate limit exceeded). Please wait 60 seconds before trying again.'
        });
      } else {
        setStatus({ type: 'error', message: error.message || 'Failed to send verification code.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const trimmedToken = otpToken.trim();
    if (!trimmedToken || trimmedToken.length < 4) {
      setStatus({ type: 'error', message: 'Please enter a valid verification code.' });
      return;
    }

    setIsLoading(true);
    setStatus(null);
    try {
      await verifyOTP(temporaryEmail, trimmedToken, otpType);
      setStatus({ type: 'success', message: 'Verification successful! Logging you in...' });
      setShowOtpInput(false);
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Verification failed. Please check the code and try again.' });
    } finally {
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
        className="w-full max-w-[440px] bg-[#0c0f1d] rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.65)] border border-[#1e263d]/90 p-8 md:p-10 relative z-10"
      >
        {!showOtpInput && tab !== 'register' && tab !== 'otp-login' && tab !== 'forgot' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Secure Access
            </h2>
            <p className="text-[#94a3b8] text-sm">
              Enter your credentials to proceed.
            </p>
          </div>
        )}
        {!showOtpInput && tab === 'forgot' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Recover Access
            </h2>
            <p className="text-[#94a3b8] text-sm">
              Enter your email to reset your security keys.
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
            <div className="flex flex-col gap-2">
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
              
              {status.type === 'error' && status.message.toLowerCase().includes('rate limit') && (
                <div className="text-xs text-rose-600 dark:text-rose-400 border-t border-rose-100 dark:border-rose-500/10 pt-2.5 mt-1 space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800 dark:text-rose-300">🛠️ How to increase/disable this in Supabase:</span>
                  <p>1. Go to your <span className="font-semibold">Supabase Dashboard</span>.</p>
                  <p>2. Select your project, then click on <span className="font-semibold">Project Settings</span> (gear icon) &rsaquo; <span className="font-semibold">Auth</span>.</p>
                  <p>3. Scroll down to <span className="font-semibold">Rate Limits</span> / <span className="font-semibold">Email Rate Limits</span>.</p>
                  <p>4. Adjust the defaults <span className="italic">(e.g. Max Limit per period)</span> or turn them up higher to avoid interruption during your tests.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showOtpInput ? (
            <motion.div
              key="otp-verif"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📥</div>
                <h2 className="text-xl font-bold text-white">Verify Verification Code</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Please enter the 6-digit confirmation code sent to <strong className="text-white">{temporaryEmail}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#94a3b8] tracking-wider uppercase">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3.5 bg-white border border-transparent rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] outline-none transition-all text-slate-800 placeholder:text-slate-300 placeholder:tracking-normal font-bold"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className="w-full h-[54px] bg-[#00aece] hover:bg-[#00c2e6] text-white font-bold rounded-2xl shadow-[0_4px_24px_rgba(0,174,206,0.35)] hover:shadow-[0_6px_30px_rgba(0,174,206,0.55)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-base"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify Code & Log In"
                )}
              </button>

              <div className="flex justify-between items-center text-xs mt-3">
                <button
                  type="button"
                  disabled={isLoading || rateLimitTimer > 0}
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      // Pass metadata context for signup to allow correct backend account creation upon verify
                      const res = await sendOTP(
                        temporaryEmail, 
                        otpType === 'signup' 
                          ? { name: fullName, password, company: companyName } 
                          : undefined
                      );
                      const msg = res?.devCode
                        ? `Resent 6-digit verification code to your email. (SANDBOX DEV CODE: ${res.devCode})`
                        : 'Resent 6-digit verification code to your email.';
                      setStatus({ type: 'success', message: msg });
                      setRateLimitTimer(60); // Set cooldown timer
                    } catch (e: any) {
                      const msg = e.message || '';
                      if (msg.toLowerCase().includes('rate limit')) {
                        setRateLimitTimer(60);
                        setStatus({
                          type: 'error',
                          message: 'Too many resend attempts (rate limit exceeded). Please wait 60 seconds before trying again.'
                        });
                      } else {
                        setStatus({ type: 'error', message: 'Failed to send verification code. Please try again.' });
                      }
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="text-[#00aece] font-bold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {rateLimitTimer > 0 ? `Resend Code (${rateLimitTimer}s)` : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setStatus(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 font-bold hover:underline"
                >
                  Back to Form
                </button>
              </div>
            </motion.div>
          ) : tab === 'login' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Email or Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <User size={18} strokeWidth={1.8} />
                  </div>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pilot@tradeflow.global" 
                    className="w-full h-[54px] pl-12 pr-4 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 placeholder:text-[#94a3b8] font-medium text-[15px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal">Password</label>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <button 
                      type="button"
                      onClick={() => {
                        setTab('otp-login');
                        setStatus(null);
                      }}
                      className="text-[#00aece] hover:text-[#00c2e6] transition-colors cursor-pointer"
                    >
                      Login with OTP
                    </button>
                    <span className="text-[#222d44] font-light">|</span>
                    <button 
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-[#00aece] hover:text-[#00c2e6] transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <Lock size={18} strokeWidth={1.8} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="" 
                    className="w-full h-[54px] pl-12 pr-12 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 font-medium text-[15px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-[#1e2638] bg-transparent text-[#00aece] focus:ring-[#00aece]/20 focus:ring-offset-0 transition-all cursor-pointer shadow-none accent-[#00aece]" 
                  />
                  <span className="text-sm font-medium text-[#94a3b8] group-hover:text-slate-200 transition-colors">
                    Remember me for 30 days
                  </span>
                </label>
              </div>

              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-[54px] bg-[#00aece] hover:bg-[#00c2e6] text-white font-bold rounded-2xl shadow-[0_4px_24px_rgba(0,174,206,0.35)] hover:shadow-[0_6px_30px_rgba(0,174,206,0.55)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-[16px]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Log In <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e263c]"></div>
                </div>
                <span className="relative px-4 bg-[#0c0f1d] text-[11px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-[54px] bg-[#131826] border border-[#222e47] hover:border-[#314264] text-slate-200 font-semibold rounded-2xl transition-all flex items-center justify-center hover:bg-[#181f32] active:scale-[0.98] text-[15px]"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div className="text-center mt-6">
                <p className="text-sm font-medium text-slate-500">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { setTab('register'); setStatus(null); }} 
                    className="text-[#00aece] hover:text-[#00c2e6] font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </motion.div>
          ) : tab === 'otp-login' ? (
            <motion.div 
              key="otp-login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🔑</div>
                <h2 className="text-xl font-bold text-white">OTP One-Time Login</h2>
                <p className="text-xs text-[#94a3b8] mt-1">
                  Enter your email address to receive a secure login token.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <Mail size={18} strokeWidth={1.8} />
                  </div>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pilot@tradeflow.global" 
                    className="w-full h-[54px] pl-12 pr-4 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 placeholder:text-[#94a3b8] font-medium text-[15px]"
                  />
                </div>
              </div>

              <button 
                onClick={handleSendLoginOTP}
                disabled={isLoading}
                className="w-full h-[54px] bg-[#00aece] hover:bg-[#00c2e6] text-white font-bold rounded-2xl shadow-[0_4px_24px_rgba(0,174,206,0.35)] hover:shadow-[0_6px_30px_rgba(0,174,206,0.55)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-base"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Login Code <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center mt-6 flex justify-between px-2">
                <button onClick={() => { setTab('login'); setStatus(null); }} className="text-xs text-[#00aece] font-bold hover:underline">
                  Log in with Password
                </button>
                <button onClick={() => { setTab('register'); setStatus(null); }} className="text-xs text-[#00aece] font-bold hover:underline">
                  Create Account
                </button>
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
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <User size={18} strokeWidth={1.8} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe" 
                    className="w-full h-[54px] pl-12 pr-4 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 placeholder:text-[#94a3b8] font-medium text-[15px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <Mail size={18} strokeWidth={1.8} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com" 
                    className="w-full h-[54px] pl-12 pr-4 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 placeholder:text-[#94a3b8] font-medium text-[15px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <Lock size={18} strokeWidth={1.8} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full h-[54px] pl-12 pr-12 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 placeholder:text-[#94a3b8] font-medium text-[15px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                  </button>
                </div>
                {/* Password Strength Bar */}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
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

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <div className="relative">
                      <Lock size={18} strokeWidth={1.8} />
                      <div className="absolute -bottom-1 -right-1 bg-[#0c0f1d] rounded-full p-0.5">
                        <div className="w-1.5 h-1.5 bg-[#00aece] rounded-full" />
                      </div>
                    </div>
                  </div>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full h-[54px] pl-12 pr-12 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 placeholder:text-[#94a3b8] font-medium text-[15px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full h-[54px] bg-[#00aece] hover:bg-[#00c2e6] text-white font-bold rounded-2xl shadow-[0_4px_24px_rgba(0,174,206,0.35)] hover:shadow-[0_6px_30px_rgba(0,174,206,0.55)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-base"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e263c]"></div>
                </div>
                <span className="relative px-4 bg-[#0c0f1d] text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-[54px] bg-[#131826] border border-[#222e47] hover:border-[#314264] text-slate-200 font-semibold rounded-2xl transition-all flex items-center justify-center hover:bg-[#181f32] active:scale-[0.98] text-[15px]"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div className="text-center mt-6">
                <p className="text-sm font-medium text-slate-500">
                  Already have an account?{' '}
                  <button onClick={() => setTab('login')} className="text-[#00aece] hover:text-[#00c2e6] font-bold hover:underline">
                    Log In
                  </button>
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
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#94a3b8] tracking-normal mb-1 block">Account Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email" 
                  className="w-full h-[54px] px-5 bg-white rounded-2xl focus:ring-4 focus:ring-[#00aece]/20 focus:border-[#00aece] border-transparent outline-none transition-all text-slate-800 font-medium text-[15px]"
                />
              </div>
              <button 
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full h-[54px] bg-[#00aece] hover:bg-[#00c2e6] text-white font-bold rounded-2xl shadow-[0_4px_24px_rgba(0,174,206,0.35)] hover:shadow-[0_6px_30px_rgba(0,174,206,0.55)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-base"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link →'}
              </button>
              <button 
                onClick={() => setTab('login')}
                className="w-full text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors"
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

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, Chrome } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.53 1 10.21 1 12s.43 3.47 1.18 4.97l3.69-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
  </svg>
);

export const LoginPage = ({ onBack }: { onBack: () => void }) => {
  const { login, register, resetPassword } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setStatus({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }
    
    setIsLoading(true);
    setStatus(null);
    
    try {
      await login(trimmedEmail, trimmedPassword);
    } catch (error: any) {
      let msg = error.message || 'Login failed. Please check your credentials.';
      
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. Please try again.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Your email has not been verified yet. Please check your inbox for a confirmation link.';
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
      setStatus({ type: 'error', message: error.message || 'Registration failed. Try a different email.' });
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
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

  return (
    <div id="auth-screen">
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100 }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)', 
            padding: '8px 16px', 
            borderRadius: '12px', 
            fontSize: '13px', 
            fontWeight: 700, 
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          ← Back
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="login-glass-card"
      >
        <div className="login-logo-glass">
          <span>🚢</span>
        </div>
        <h1 className="login-title">TradeFlow</h1>
        <p className="login-subtitle">Enterprise Resource Planning Suite</p>

        {tab !== 'forgot' && (
          <div className="login-tab-box">
            <div 
              className={`login-tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Login
            </div>
            <div 
              className={`login-tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >
              Sign Up
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {status && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ 
                width: '100%',
                padding: '12px', 
                borderRadius: '16px', 
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight:600,
                textAlign: 'center',
                background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: status.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              }}
            >
              {status.message}
            </motion.div>
          )}

          {tab === 'login' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{ width: '100%' }}
            >
              <div className="login-input-wrap">
                <label className="login-label">Registered Email</label>
                <div className="login-field-container">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="login-field"
                  />
                </div>
              </div>
              
              <div className="login-input-wrap" style={{ marginBottom: '16px' }}>
                <label className="login-label">Password</label>
                <div className="login-field-container">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-field"
                  />
                  <Lock size={18} className="login-field-icon" />
                </div>
              </div>

              <div className="login-forgot" onClick={() => setTab('forgot')}>
                Forgot Password?
              </div>

              <button className="google-btn">
                <GoogleIcon />
                Log in with Google
              </button>

              <button 
                className="primary-action-btn"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Login Now'}
                <ArrowRight size={20} />
              </button>

              <div className="login-footer">
                Not a member? <a onClick={() => setTab('register')} style={{ cursor: 'pointer' }}>Sign up for a free trial</a>
              </div>
            </motion.div>
          ) : tab === 'register' ? (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ width: '100%' }}
            >
              <div className="login-input-wrap">
                <label className="login-label">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="login-field"
                />
              </div>
              <div className="login-input-wrap">
                <label className="login-label">Corporate Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="login-field"
                />
              </div>
              <div className="login-input-wrap">
                <label className="login-label">Create Password</label>
                <div className="login-field-container">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-field"
                  />
                  <Lock size={18} className="login-field-icon" />
                </div>
              </div>
              
              <button 
                className="primary-action-btn"
                onClick={handleRegister}
                disabled={isLoading}
                style={{ marginTop: '12px' }}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up Now'}
                <ArrowRight size={20} />
              </button>

              <div className="login-footer">
                Already have an account? <a onClick={() => setTab('login')} style={{ cursor: 'pointer' }}>Log In</a>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ width: '100%' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>Reset Password</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                  We'll send a recovery link to your inbox.
                </p>
              </div>
              <div className="login-input-wrap">
                <label className="login-label">Target Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="login-field"
                />
              </div>
              <button 
                className="primary-action-btn"
                onClick={handleResetPassword}
                disabled={isLoading}
                style={{ marginBottom: '16px' }}
              >
                {isLoading ? 'Sending...' : 'Send Recovery Link'}
                <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => setTab('login')}
                style={{ background: 'none', border: 'none', width: '100%', fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' }}
              >
                ← Back to Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

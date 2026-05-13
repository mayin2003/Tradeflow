import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

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
        setStatus({ type: 'success', message: 'Registration successful! Please check your email to verify your account before logging in.' });
        // Optionally switch back to login tab
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
    <div id="auth-screen" className="mesh-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '40px', left: '40px' }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'white', 
            border: '1px solid #e2e8f0', 
            padding: '10px 20px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: 600, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          ← Back to Site
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card" 
        style={{ width: '100%', maxWidth: '440px', padding: '50px 40px' }}
      >
        <div className="auth-logo">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1 }}
            className="logo-icon"
          >
            🚢
          </motion.div>
          <h1 className="text-gradient">TradeFlow</h1>
          <p>Enterprise Resource Planning Suite</p>
        </div>

        {tab !== 'forgot' && (
          <div className="auth-tabs" style={{ background: '#f8fafc', padding: '6px', borderRadius: '14px', marginBottom: '24px' }}>
            <div 
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`} 
              style={{ 
                background: tab === 'login' ? 'white' : 'transparent',
                boxShadow: tab === 'login' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
              onClick={() => setTab('login')}
            >
              Login
            </div>
            <div 
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`} 
              style={{ 
                background: tab === 'register' ? 'white' : 'transparent',
                boxShadow: tab === 'register' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
              onClick={() => setTab('register')}
            >
              Sign Up
            </div>
          </div>
        )}
        
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.4',
              textAlign: 'center',
              backgroundColor: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: status.type === 'success' ? '#15803d' : '#991b1b',
              border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {status.message}
          </motion.div>
        )}
        
        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              id="login-form"
            >
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#475569' }}>Registered Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  style={{ padding: '14px', borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#475569' }}>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ padding: '14px', borderRadius: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button 
                  onClick={() => setTab('forgot')}
                  style={{ background: 'none', border: 'none', fontSize: '14px', color: '#2563eb', fontWeight: 500, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <button 
                className="btn btn-primary btn-full" 
                onClick={handleLogin}
                disabled={isLoading}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                }}
              >
                {isLoading ? 'Authenticating...' : 'Login Now →'}
              </button>
            </motion.div>
          ) : tab === 'register' ? (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              id="register-form"
            >
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#475569' }}>Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe" 
                  style={{ padding: '14px', borderRadius: '12px' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#475569' }}>Educational/Company Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" 
                  style={{ padding: '14px', borderRadius: '12px' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#475569' }}>Security Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ padding: '14px', borderRadius: '12px' }} 
                />
              </div>
              <button 
                className="btn btn-primary btn-full" 
                onClick={handleRegister}
                disabled={isLoading}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  fontWeight: 700,
                  marginTop: '10px'
                }}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up Now →'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="forgot-form"
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Reset Password</h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#475569' }}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  style={{ padding: '14px', borderRadius: '12px' }}
                />
              </div>
              <button 
                className="btn btn-primary btn-full" 
                onClick={handleResetPassword}
                disabled={isLoading}
                style={{ padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link →'}
              </button>
              <button 
                onClick={() => setTab('login')}
                style={{ background: 'none', border: 'none', width: '100%', fontSize: '14px', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
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

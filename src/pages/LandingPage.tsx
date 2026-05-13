import React from 'react';
import { motion } from 'motion/react';

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div id="landing">
      <div className="mesh-bg"></div>
      
      <div className="landing-content">
        <nav className="landing-nav">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="box" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)', background: '#2563eb', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚢</div>
            <span className="text-gradient" style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '-0.03em' }}>TradeFlow</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-hero btn-hero-outline" onClick={onStart}>Log In</button>
            <button className="btn-hero btn-hero-primary" onClick={onStart}>Get Started</button>
          </div>
        </nav>
        
        <div className="landing-hero" style={{ padding: '80px 20px 100px', textAlign: 'center', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tag" 
            style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontWeight: 700, padding: '8px 20px', borderRadius: '30px', marginBottom: '32px', border: '1px solid rgba(59, 130, 246, 0.3)' }}
          >
            ✨ The Premium Export-Import Business Suite
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{ fontSize: 'clamp(36px, 8vw, 72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.05em', color: 'white' }}
          >
            Scale Your <span className="text-gradient">Trade Business</span> <br /> Without the Complexity
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '19px', color: 'rgba(255,255,255,0.7)', maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.6 }}
          >
            Automate purchase costing, inventory tracking, profit analysis, and professional invoicing in one powerful, multi-currency platform.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="btn-group"
            style={{ justifyContent: 'center' }}
          >
            <button className="btn-hero btn-hero-primary" style={{ padding: '18px 48px', fontSize: '18px', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.4)' }} onClick={onStart}>
              🚀 Start Free Trial
            </button>
            <button className="btn-hero btn-hero-outline" style={{ padding: '18px 48px', fontSize: '18px' }} onClick={onStart}>
              📺 Watch Product Tour
            </button>
          </motion.div>
        </div>

        <div className="features-grid" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '120px' }}>
          {[
            { icon: '📦', title: 'Smart Inventory', desc: 'Track products with HS codes and automatic low-stock alerts.', color: '#3b82f6' },
            { icon: '🧮', title: 'Landing Cost', desc: 'Auto-calculate costs including shipping, duty, and VAT.', color: '#8b5cf6' },
            { icon: '📈', title: 'Live Analytics', desc: 'Real-time profit tracking with advanced visual dashboards.', color: '#10b981' },
            { icon: '🧾', title: 'Instant Invoicing', desc: 'Generate professional A4 PDF invoices with one click.', color: '#f59e0b' },
            { icon: '🌍', title: 'Multi-Currency', desc: 'True global trade support for BDT, USD, Yuan, and Rupee.', color: '#06b6d4' },
            { icon: '📋', title: 'Smart Reports', desc: 'Automated daily and monthly financial audit logs.', color: '#ec4899' }
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ translateY: -10 }}
              className="feature-item" 
            >
              <div className="fi" style={{ 
                background: `${f.color}15`, 
                color: f.color,
                width: '64px', 
                height: '64px', 
                borderRadius: '16px', 
                fontSize: '32px', 
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 16px -4px ${f.color}20`
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ fontSize: '16px', lineHeight: 1.5 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

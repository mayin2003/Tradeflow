import React from 'react';
import { motion } from 'motion/react';

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div id="landing" className="mesh-bg" style={{ minHeight: '100vh' }}>
      <nav className="landing-nav glass" style={{ position: 'sticky', top: 0, zIndex: 100, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div className="brand">
          <div className="box" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>🚢</div>
          <span className="text-gradient" style={{ fontWeight: 800, fontSize: '20px' }}>TradeFlow</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn-hero btn-hero-outline" style={{ background: 'transparent', border: '1.5px solid #e2e8f0' }} onClick={onStart}>Log In</button>
          <button className="btn-hero btn-hero-primary" style={{ boxShadow: '0 8px 20px -6px rgba(37, 99, 235, 0.4)' }} onClick={onStart}>Get Started</button>
        </div>
      </nav>
      
      <div className="landing-hero" style={{ padding: '80px 20px 100px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tag" 
          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 700, padding: '8px 16px', borderRadius: '30px' }}
        >
          ✨ The Premium Export-Import Business Suite
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.05em' }}
        >
          Scale Your <span className="text-gradient">Trade Business</span> <br /> Without the Complexity
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: '18px', color: '#64748b', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}
        >
          Automate purchase costing, inventory tracking, profit analysis, and professional invoicing in one powerful, multi-currency platform.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="btn-group"
        >
          <button className="btn-hero btn-hero-primary" style={{ padding: '16px 40px', fontSize: '18px', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.3)' }} onClick={onStart}>
            🚀 Start Free Trial
          </button>
          <button className="btn-hero btn-hero-outline" style={{ padding: '16px 40px', fontSize: '18px', background: 'white' }} onClick={onStart}>
            📺 Watch Product Tour
          </button>
        </motion.div>
      </div>

      <div className="features-grid" style={{ maxWidth: '1200px', margin: '0 auto', gap: '24px', paddingBottom: '100px' }}>
        {[
          { icon: '📦', title: 'Smart Inventory', desc: 'Track products with HS codes and automatic low-stock alerts.' },
          { icon: '🧮', title: 'Landing Cost', desc: 'Auto-calculate costs including shipping, duty, and VAT.' },
          { icon: '📈', title: 'Live Analytics', desc: 'Real-time profit tracking with advanced visual dashboards.' },
          { icon: '🧾', title: 'Instant Invoicing', desc: 'Generate professional A4 PDF invoices with one click.' },
          { icon: '🌍', title: 'Multi-Currency', desc: 'True global trade support for BDT, USD, Yuan, and Rupee.' },
          { icon: '📋', title: 'Smart Reports', desc: 'Automated daily and monthly financial audit logs.' }
        ].map((f, i) => (
          <motion.div 
            key={i}
            whileHover={{ translateY: -8 }}
            className="feature-item" 
            style={{ 
              background: 'white', 
              padding: '32px', 
              borderRadius: '24px', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9',
              textAlign: 'left'
            }}
          >
            <div className="fi" style={{ background: '#f8fafc', width: '56px', height: '56px', borderRadius: '14px', fontSize: '28px', marginBottom: '20px' }}>{f.icon}</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>{f.title}</h3>
            <p style={{ color: '#64748b', fontSize: '15px' }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

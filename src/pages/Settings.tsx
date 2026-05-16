import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { settings, updateSettings, addActivityLog } = useData();
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'buy' | 'sell' | 'invoice'>('profile');
  const [localSettings, setLocalSettings] = useState(settings);
  const [fullName, setFullName] = useState(user?.name || '');
  const [showSaved, setShowSaved] = useState(false);

  // Sync local data if settings update from elsewhere
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (showSaved) {
      const timer = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSaved]);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      if (fullName !== user?.name) {
        await updateUser({ name: fullName });
      }
      addActivityLog('System settings updated', '⚙️', 'var(--bg)');
      setShowSaved(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateProfile = (field: keyof typeof localSettings.shopProfile, value: any) => {
    setLocalSettings({
      ...localSettings,
      shopProfile: { ...localSettings.shopProfile, [field]: value }
    });
  };

  const toggleBuy = (field: keyof typeof localSettings.buy) => {
    setLocalSettings({
      ...localSettings,
      buy: { ...localSettings.buy, [field]: !localSettings.buy[field] }
    });
  };

  const toggleSell = (field: keyof typeof localSettings.sell) => {
    setLocalSettings({
      ...localSettings,
      sell: { ...localSettings.sell, [field]: !localSettings.sell[field] }
    });
  };

  const updateInvoice = (field: keyof typeof localSettings.invoice, value: any) => {
    setLocalSettings({
      ...localSettings,
      invoice: { ...localSettings.invoice, [field]: value }
    });
  };

  return (
    <div id="page-settings" className="page active" style={{ position: 'relative' }}>
      <AnimatePresence>
        {showSaved && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="success-toast"
            style={{ 
              position: 'fixed', 
              top: '24px', 
              left: '50%', 
              zIndex: 9999,
              background: 'var(--success)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: 600,
            }}
          >
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: '20px' }}
            >
              ✨
            </motion.span> 
            <span>Settings Saved Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-header" style={{ marginBottom: '48px' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-0.06em' }}>Settings</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '16px', fontWeight: 500 }}>Refine your platform experience and business profile</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {showSaved && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', fontSize: '14px', fontWeight: 800 }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span>
                <span className="absolute flex h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              </div>
              Cloud Synced
            </motion.div>
          )}
          <motion.button 
            whileHover={{ scale: 1.05, translateY: -4 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={showSaved}
            style={{ 
              padding: '16px 40px', 
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 900,
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              background: showSaved ? 'var(--success)' : 'var(--accent)',
              boxShadow: showSaved ? '0 0 0 0 rgba(16, 185, 129, 0)' : '0 15px 35px -8px rgba(37, 99, 235, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              border: 'none',
              color: 'white',
              cursor: showSaved ? 'default' : 'pointer'
            }}
          >
            {showSaved ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✓</span> Securely Saved
              </motion.div>
            ) : (
              <><span style={{ fontSize: '20px' }}>⚡</span> Save Global Changes</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Modern Profile Banner */}
      <div className="settings-header-banner">
        {/* Decorative Glass Particles */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(30px)' }}></div>
        
        <div style={{ position: 'absolute', right: '40px', bottom: '20px', fontSize: '200px', opacity: 0.04, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>🚢</div>
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '32px' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              width: '130px', 
              height: '130px', 
              background: 'white', 
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '4px solid rgba(255,255,255,0.15)'
            }}
          >
            {localSettings.shopProfile.logoUrl ? (
              <img src={localSettings.shopProfile.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '64px' }}>📦</span>
            )}
          </motion.div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1 }}>
                {localSettings.shopProfile.name || 'TradeFlow Business'}
              </h1>
              <div className="glass-dark" style={{ padding: '6px 16px', borderRadius: '40px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 10px #60a5fa' }}></span>
                Verified Enterprise
              </div>
            </div>
            
            <p style={{ opacity: 0.8, fontSize: '17px', fontWeight: 500, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📍</span> {localSettings.shopProfile.address || 'Address not configured'}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { label: '📧 Contact', value: localSettings.shopProfile.email || 'N/A' },
                { label: '💱 Currency', value: localSettings.currency || 'USD' },
                { label: '📊 VAT', value: `${localSettings.taxRate}%` }
              ].map((item, idx) => (
                <div key={idx} className="glass-dark" style={{ padding: '10px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 600 }}>
                  <span style={{ opacity: 0.6, marginRight: '6px' }}>{item.label}:</span> {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-tab-container">
        {[
          { id: 'profile', label: 'Shop Profile', icon: '👤' },
          { id: 'general', label: 'General', icon: '⚙️' },
          { id: 'buy', label: 'Buy Settings', icon: '🛒' },
          { id: 'sell', label: 'Sell Settings', icon: '💰' },
          { id: 'invoice', label: 'Invoice Layout', icon: '🧾' }
        ].map((tab) => (
          <button 
            key={tab.id}
            className={`settings-tab-item ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' && (
            <div className="settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h3 className="settings-section-title" style={{ margin: 0 }}>Identity & Branding</h3>
                <span className="badge badge-info" style={{ borderRadius: '12px', padding: '6px 16px', fontWeight: 800 }}>Public Organization Data</span>
              </div>
              
              <div style={{ 
                background: 'var(--bg)', 
                borderRadius: '32px', 
                padding: '40px', 
                marginBottom: '40px',
                border: '2px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    style={{ 
                      width: '180px', 
                      height: '180px', 
                      background: 'var(--card-bg)',
                      borderRadius: '40px',
                      border: '3px dashed var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      position: 'relative',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'
                    }}
                  >
                    {localSettings.shopProfile.logoUrl ? (
                      <img src={localSettings.shopProfile.logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ textAlign: 'center', opacity: 0.6 }}>
                        <div style={{ fontSize: '56px' }}>📁</div>
                        <div style={{ fontSize: '12px', fontWeight: 900, marginTop: '8px' }}>BRAND LOGO</div>
                      </div>
                    )}
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>Corporate Identity</h4>
                    <p style={{ margin: '0 0 28px 0', color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.6 }}>This logo will appear on all digital exports, invoices, and your public trade profile. Use a clear, high-contrast image.</p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label className="btn btn-primary" style={{ cursor: 'pointer', borderRadius: '14px', padding: '12px 28px', fontWeight: 700 }}>
                        <span>Update Brand Logo</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => updateProfile('logoUrl', reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {localSettings.shopProfile.logoUrl && (
                        <button className="btn btn-outline" style={{ color: 'var(--danger)', borderRadius: '14px', padding: '12px 24px', fontWeight: 700 }} onClick={() => updateProfile('logoUrl', '')}>Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Account Representative</label>
                  <input className="input-modern" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Full Trading Name</label>
                  <input className="input-modern" type="text" value={localSettings.shopProfile.name} onChange={(e) => updateProfile('name', e.target.value)} placeholder="Business Name" />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Global Headquarters Address</label>
                <textarea className="input-modern" rows={4} value={localSettings.shopProfile.address} onChange={(e) => updateProfile('address', e.target.value)} placeholder="Street, City, State, Country, ZIP..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px' }} className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Admin Email Address</label>
                  <input className="input-modern" type="email" value={localSettings.shopProfile.email} onChange={(e) => updateProfile('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Support/Secondary Alias</label>
                  <input className="input-modern" type="email" value={localSettings.shopProfile.secondaryEmail || ''} onChange={(e) => updateProfile('secondaryEmail', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px' }} className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Official Website</label>
                  <input className="input-modern" type="text" value={localSettings.shopProfile.website} onChange={(e) => updateProfile('website', e.target.value)} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Corporate Tax ID</label>
                  <input className="input-modern" type="text" value={localSettings.shopProfile.taxId} onChange={(e) => updateProfile('taxId', e.target.value)} placeholder="Registration Number" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-card">
              <h3 className="settings-section-title">Platform Experience</h3>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Base Transaction Currency</label>
                  <input className="input-modern" type="text" value={localSettings.currency} onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})} placeholder="USD, EUR, GBP..." />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Default Sales Tax (%)</label>
                  <input className="input-modern" type="number" value={localSettings.taxRate} onChange={(e) => setLocalSettings({...localSettings, taxRate: +e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buy' && (
            <div className="settings-card">
              <h3 className="settings-section-title">Inbound Logistics Control</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>Optimize your inventory acquisition workflow with granular visibility controls.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                {[
                  { id: 'enableShippingCost', label: 'Logistics Expenses', desc: 'Add dedicated lines for freight and shipping charges' },
                  { id: 'enableCustomsDuty', label: 'Customs & Port Fees', desc: 'Track international clearance and duty payments' },
                  { id: 'enableOtherCosts', label: 'Handling & Surcharges', desc: 'Capture miscellaneous processing or storage fees' },
                  { id: 'requireDate', label: 'Mandatory Acquisition Date', desc: 'Enforce strict chronological record keeping' }
                ].map(item => (
                  <motion.div 
                    key={item.id} 
                    whileHover={{ scale: 1.02 }}
                    className="toggle-card" 
                    onClick={() => toggleBuy(item.id as any)}
                    style={{ padding: '24px' }}
                  >
                    <div style={{ flex: 1, marginRight: '24px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>{item.label}</span>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                    <div style={{ 
                      width: '56px', 
                      height: '30px', 
                      background: localSettings.buy[item.id as keyof typeof localSettings.buy] ? 'var(--success)' : 'var(--border)',
                      borderRadius: '40px',
                      position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0
                    }}>
                      <motion.div 
                        initial={false}
                        animate={{ x: localSettings.buy[item.id as keyof typeof localSettings.buy] ? 28 : 2 }}
                        style={{ 
                          width: '26px', 
                          height: '26px', 
                          background: 'white', 
                          borderRadius: '50%', 
                          marginTop: '2px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sell' && (
            <div className="settings-card">
              <h3 className="settings-section-title">Trade Velocity Engine</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>Precision controls for your sales and outbound transaction engine.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {[
                  { id: 'enableMultipleProducts', label: 'Bulk Sale Mode', desc: 'Support multiple unique line items in a single trade' },
                  { id: 'enableVat', label: 'Automated VAT Engine', desc: 'Real-time tax calculation and compliance checks' },
                  { id: 'enableCustomerName', label: 'Entity Identification', desc: 'Mandatory customer name tracking for audit logs' },
                  { id: 'enableCurrencySelection', label: 'Global Trade Sync', desc: 'Support per-transaction currency overrides' }
                ].map(item => (
                  <motion.div 
                    key={item.id} 
                    whileHover={{ scale: 1.02 }}
                    className="toggle-card" 
                    onClick={() => toggleSell(item.id as any)}
                    style={{ padding: '24px' }}
                  >
                    <div style={{ flex: 1, marginRight: '24px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>{item.label}</span>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                    <div style={{ 
                      width: '56px', 
                      height: '30px', 
                      background: localSettings.sell[item.id as keyof typeof localSettings.sell] ? 'var(--accent)' : 'var(--border)',
                      borderRadius: '40px',
                      position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0
                    }}>
                      <motion.div 
                        initial={false}
                        animate={{ x: localSettings.sell[item.id as keyof typeof localSettings.sell] ? 28 : 2 }}
                        style={{ 
                          width: '26px', 
                          height: '26px', 
                          background: 'white', 
                          borderRadius: '50%', 
                          marginTop: '2px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Default Transaction VAT (%)</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-modern" type="number" value={localSettings.sell.defaultVat} onChange={(e) => setLocalSettings({...localSettings, sell: {...localSettings.sell, defaultVat: +e.target.value}})} style={{ width: '100%', paddingRight: '50px' }} />
                  <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, opacity: 0.4 }}>%</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="settings-card">
              <h3 className="settings-section-title">Invoice Architecture</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>Design the ultimate document experience for your clients.</p>
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="toggle-card" 
                style={{ marginBottom: '40px', padding: '24px 32px', borderRadius: '28px' }} 
                onClick={() => updateInvoice('showLogo', !localSettings.invoice.showLogo)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ fontSize: '32px', background: 'var(--card-bg)', padding: '12px', borderRadius: '16px', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)' }}>💼</div>
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>Project Branding on Export</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Automatically render your corporate identity on all generated PDF invoices.</p>
                  </div>
                </div>
                <div style={{ 
                  width: '60px', 
                  height: '32px', 
                  background: localSettings.invoice.showLogo ? 'var(--accent)' : 'var(--border)',
                  borderRadius: '40px',
                  position: 'relative',
                  transition: '0.4s'
                }}>
                  <motion.div 
                    animate={{ x: localSettings.invoice.showLogo ? 30 : 2 }}
                    style={{ width: '28px', height: '28px', background: 'white', borderRadius: '50%', marginTop: '2px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
                  />
                </div>
              </motion.div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Payment Instructions (Primary)</label>
                  <input className="input-modern" type="text" value={localSettings.invoice.bankInfo} onChange={(e) => updateInvoice('bankInfo', e.target.value)} placeholder="Email / PayPal / Crypto" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Accepted Credit Networks</label>
                  <input className="input-modern" type="text" value={localSettings.invoice.cardPayment || ''} onChange={(e) => updateInvoice('cardPayment', e.target.value)} placeholder="Visa, Mastercard, Amex..." />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Standard VAT (%)</label>
                  <input className="input-modern" type="number" value={localSettings.invoice.taxRate} onChange={(e) => updateInvoice('taxRate', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Standard Trade Discount (%)</label>
                  <input className="input-modern" type="number" value={localSettings.invoice.discount} onChange={(e) => updateInvoice('discount', +e.target.value)} />
                </div>
              </div>

              <div style={{ padding: '40px', background: 'var(--bg)', borderRadius: '32px', border: '2px dashed var(--accent)', marginBottom: '48px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.03, transform: 'rotate(15deg)' }}>🖋️</div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    style={{ width: '220px', height: '120px', background: 'white', borderRadius: '20px', border: '2px solid var(--border)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                  >
                    {localSettings.invoice.signatureUrl ? (
                      <img src={localSettings.invoice.signatureUrl} alt="Sign" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 900, letterSpacing: '0.1em' }}>PLACEHOLDER SIGNATURE</span>
                    )}
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>Executive Authorization</h4>
                    <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Upload a high-fidelity digital signature to automate document authentication across your global trades.</p>
                    <label className="btn btn-outline" style={{ cursor: 'pointer', borderRadius: '14px', padding: '12px 28px', fontWeight: 700 }}>
                      <span>Add/Change Signature Identity</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => updateInvoice('signatureUrl', reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }} className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Authorized Signatory</label>
                  <input className="input-modern" type="text" value={localSettings.invoice.signatureName || ''} onChange={(e) => updateInvoice('signatureName', e.target.value)} placeholder="Full Legal Name" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', display: 'block' }}>Professional Title</label>
                  <input className="input-modern" type="text" placeholder="e.g. Managing Director" />
                </div>
              </div>

              <div style={{ padding: '40px', background: 'var(--bg)', borderRadius: '32px', border: '2px solid var(--border)', position: 'relative' }}>
                <h4 style={{ margin: '0 0 28px 0', fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>📜</span> Global Trade Terms
                </h4>
                <textarea 
                  className="input-modern" 
                  rows={6} 
                  value={localSettings.invoice.termsAndConditions} 
                  onChange={(e) => updateInvoice('termsAndConditions', e.target.value)}
                  placeholder="Define your business policies, returns, and sovereign trade terms..."
                  style={{ width: '100%', lineHeight: 1.7, background: 'var(--card-bg) !important' }}
                />
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Auto-rendered on every document footer</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

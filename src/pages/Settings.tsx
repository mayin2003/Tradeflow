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
              background: '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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

      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em' }}>Settings</h2>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '15px', fontWeight: 500 }}>Global system controls and profile management</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {showSaved && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              Changes Saved
            </motion.div>
          )}
          <motion.button 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={showSaved}
            style={{ 
              padding: '14px 32px', 
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 700,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: showSaved ? '#10b981' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: showSaved ? 'none' : '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: 'none'
            }}
          >
            {showSaved ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>✨</span> Updated
              </motion.div>
            ) : (
              <><span style={{ fontSize: '18px' }}>⚡</span> Save All Changes</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Shop Profile Hero Header */}
      <div style={{ 
        background: 'linear-gradient(225deg, #0f172a 0%, #1e3a8a 100%)',
        padding: '50px 40px',
        borderRadius: '28px',
        color: 'white',
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '40px',
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Decorative elements */}
        <div style={{ 
          position: 'absolute', 
          right: '-50px', 
          top: '-50px', 
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{ 
          position: 'absolute', 
          right: '40px', 
          bottom: '40px', 
          fontSize: '180px', 
          opacity: 0.05,
          transform: 'rotate(-10deg)',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>🚢</div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            width: '120px', 
            height: '120px', 
            background: 'white', 
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '10px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            zIndex: 2,
            border: '4px solid rgba(255,255,255,0.1)'
          }}
        >
          {localSettings.shopProfile.logoUrl ? (
            <img src={localSettings.shopProfile.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '60px' }}>📦</span>
          )}
        </motion.div>
        
        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}>
              {localSettings.shopProfile.name || 'TradeFlow'}
            </h1>
            <div className="glass-dark" style={{ padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
              Verified Professional
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', opacity: 0.8 }}>
            <span style={{ fontSize: '16px' }}>📍</span>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
              {localSettings.shopProfile.address || 'Address configuration required'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="glass-dark" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', padding: '10px 18px', borderRadius: '14px', fontWeight: 500 }}>
              <span style={{ opacity: 0.7 }}>✉️</span> {localSettings.shopProfile.email || 'No email set'}
            </div>
            <div className="glass-dark" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', padding: '10px 18px', borderRadius: '14px', fontWeight: 500 }}>
              <span style={{ opacity: 0.7 }}>💱</span> System Base: <strong>{localSettings.currency || 'USD'}</strong>
            </div>
            <div className="glass-dark" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', padding: '10px 18px', borderRadius: '14px', fontWeight: 500 }}>
              <span style={{ opacity: 0.7 }}>📊</span> Tax Rate: <strong>{localSettings.taxRate}%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-tabs" style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '32px', 
        background: '#f1f5f9', 
        padding: '6px', 
        borderRadius: '16px',
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        width: 'max-content'
      }}>
        {[
          { id: 'profile', label: 'Shop Profile', icon: '👤' },
          { id: 'general', label: 'General', icon: '⚙️' },
          { id: 'buy', label: 'Buy Settings', icon: '🛒' },
          { id: 'sell', label: 'Sell Settings', icon: '💰' },
          { id: 'invoice', label: 'Invoice Layout', icon: '🧾' }
        ].map((tab) => (
          <button 
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 700 : 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1e40af' : '#64748b',
              border: 'none',
              boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Shop Profile</h3>
              <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px' }}>Public Information</span>
            </div>
            
            <div className="form-row" style={{ gap: '24px', marginBottom: '32px', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ 
                width: '140px', 
                height: '140px', 
                border: '2px dashed #0ea5e9', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                margin: '0 auto'
              }}>
                {localSettings.shopProfile.logoUrl ? (
                  <img src={localSettings.shopProfile.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>NO LOGO</span>
                  </div>
                )}
              </div>
              <div>
                <label className="btn btn-sm btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span>Upload Shop Logo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateProfile('logoUrl', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>PNG, JPG or SVG. Recommended square size.</p>
                  {localSettings.shopProfile.logoUrl && (
                    <button 
                      className="btn btn-sm" 
                      style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', fontSize: '11px' }}
                      onClick={() => updateProfile('logoUrl', '')}
                    >Remove</button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>User Full Name</label>
              <input 
                type="text" 
                placeholder="Your personal name"
                style={{ fontSize: '16px', padding: '12px' }}
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>This is your account display name.</p>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Shop / Business Name</label>
              <input 
                type="text" 
                placeholder="e.g. Trade Flow"
                style={{ fontSize: '16px', padding: '12px' }}
                value={localSettings.shopProfile.name} 
                onChange={(e) => updateProfile('name', e.target.value)} 
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>This name will appear on your invoices and dashboard.</p>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Full Business Address</label>
              <textarea 
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                value={localSettings.shopProfile.address} 
                onChange={(e) => updateProfile('address', e.target.value)} 
                placeholder="Include street, city, state, and zip code"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Primary Contact Email</label>
                <input type="email" value={localSettings.shopProfile.email} onChange={(e) => updateProfile('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Secondary Contact Email (Optional)</label>
                <input type="email" value={localSettings.shopProfile.secondaryEmail || ''} onChange={(e) => updateProfile('secondaryEmail', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Website URL</label>
                <input type="text" value={localSettings.shopProfile.website} onChange={(e) => updateProfile('website', e.target.value)} placeholder="www.yourshop.com" />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Tax / VAT ID (Optional)</label>
                <input type="text" value={localSettings.shopProfile.taxId} onChange={(e) => updateProfile('taxId', e.target.value)} placeholder="e.g. VAT123456" />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Additional Business Information</label>
              <textarea 
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                value={localSettings.shopProfile.additionalInfo} 
                onChange={(e) => updateProfile('additionalInfo', e.target.value)} 
                placeholder="Any other details you want to save about your business..."
              />
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="chart-card">
            <h3 style={{ marginBottom: '16px' }}>System Preferences</h3>
            
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>App Theme</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setLocalSettings({...localSettings, theme: 'light'})}
                  className={`flex-1 p-6 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                    localSettings.theme === 'light' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-transparent bg-slate-50'
                  }`}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>☀️</div>
                  <div className={`font-bold ${localSettings.theme === 'light' ? 'text-blue-700' : 'text-slate-600'}`}>Light Mode</div>
                </button>
                <button 
                  onClick={() => setLocalSettings({...localSettings, theme: 'dark'})}
                  className={`flex-1 p-6 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                    localSettings.theme === 'dark' 
                      ? 'border-blue-500 bg-slate-800' 
                      : 'border-transparent bg-slate-50'
                  }`}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌙</div>
                  <div className={`font-bold ${localSettings.theme === 'dark' ? 'text-blue-100' : 'text-slate-600'}`}>Dark Mode</div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Default Currency Symbol</label>
              <input type="text" value={localSettings.currency} onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Default Tax Rate (%)</label>
              <input type="number" value={localSettings.taxRate} onChange={(e) => setLocalSettings({...localSettings, taxRate: +e.target.value})} />
            </div>
          </div>
        )}

        {activeTab === 'buy' && (
          <div className="chart-card">
            <h3 style={{ marginBottom: '16px' }}>Purchase/Buy Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.buy.enableShippingCost} onChange={() => toggleBuy('enableShippingCost')} />
                <span>Enable Shipping Cost Field</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.buy.enableCustomsDuty} onChange={() => toggleBuy('enableCustomsDuty')} />
                <span>Enable Customs Duty Field</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.buy.enableOtherCosts} onChange={() => toggleBuy('enableOtherCosts')} />
                <span>Enable Other Costs Field</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.buy.requireDate} onChange={() => toggleBuy('requireDate')} />
                <span>Require Purchase Date</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="chart-card">
            <h3 style={{ marginBottom: '16px' }}>Sales/Sell Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.sell.enableMultipleProducts} onChange={() => toggleSell('enableMultipleProducts')} />
                <span>Enable Multi-Product Sales</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.sell.enableVat} onChange={() => toggleSell('enableVat')} />
                <span>Enable VAT/Tax Calculation</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.sell.enableCustomerName} onChange={() => toggleSell('enableCustomerName')} />
                <span>Enable Customer Name Field</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={localSettings.sell.enableCurrencySelection} onChange={() => toggleSell('enableCurrencySelection')} />
                <span>Enable Individual Sale Currency</span>
              </label>
              <div className="form-group" style={{ maxWidth: '200px', marginTop: '8px' }}>
                <label>Default VAT (%)</label>
                <input type="number" value={localSettings.sell.defaultVat} onChange={(e) => setLocalSettings({...localSettings, sell: {...localSettings.sell, defaultVat: +e.target.value}})} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="chart-card">
            <h3 style={{ marginBottom: '16px' }}>Invoice Customization</h3>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '24px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
                <input type="checkbox" checked={localSettings.invoice.showLogo} onChange={() => updateInvoice('showLogo', !localSettings.invoice.showLogo)} />
                <span style={{ fontWeight: 600 }}>Show Shop Logo on Invoice Headers</span>
              </label>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Paypal / Digital Payment Info</label>
                <input 
                  type="text" 
                  value={localSettings.invoice.bankInfo} 
                  onChange={(e) => updateInvoice('bankInfo', e.target.value)} 
                  placeholder="e.g. invoma@gmail.com"
                />
              </div>
              <div className="form-group">
                <label>Card Payment Methods</label>
                <input 
                  type="text" 
                  value={localSettings.invoice.cardPayment || ''} 
                  onChange={(e) => updateInvoice('cardPayment', e.target.value)} 
                  placeholder="e.g. Visa, Master Card"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Default Discount (%)</label>
                <input 
                  type="number" 
                  value={localSettings.invoice.discount || 0} 
                  onChange={(e) => updateInvoice('discount', +e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Default VAT / Tax (%)</label>
                <input 
                  type="number" 
                  value={localSettings.invoice.taxRate || 0} 
                  onChange={(e) => updateInvoice('taxRate', +e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ 
                width: '100px', 
                height: '60px', 
                border: '1px dashed #ced4da', 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#fff'
              }}>
                {localSettings.invoice.signatureUrl ? (
                  <img src={localSettings.invoice.signatureUrl} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                ) : (
                  <span style={{ fontSize: '10px', color: '#adb5bd' }}>No Signature</span>
                )}
              </div>
              <div>
                <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  <span>Upload Signature</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateInvoice('signatureUrl', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>Upload a PNG with transparent background for best results.</p>
              </div>
            </div>

            <div className="form-group">
              <label>Authorized Signatory Name & Title</label>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input 
                  type="text" 
                  value={localSettings.invoice.signatureName || ''} 
                  onChange={(e) => updateInvoice('signatureName', e.target.value)} 
                  placeholder="e.g. Jhon Donate"
                />
                <input 
                  type="text" 
                  placeholder="e.g. Accounts Manager"
                  onChange={(e) => {/* Title could be another field or part of signatureName */}}
                />
              </div>
            </div>

            <h4 style={{ marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Default Client Context</h4>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Default Client Name</label>
                <input 
                  type="text" 
                  value={localSettings.invoice.defaultClientName || ''} 
                  onChange={(e) => updateInvoice('defaultClientName', e.target.value)} 
                  placeholder="e.g. Lowell H. Dominguez"
                />
              </div>
              <div className="form-group">
                <label>Default Client Phone</label>
                <input 
                  type="text" 
                  value={localSettings.invoice.defaultClientPhone || ''} 
                  onChange={(e) => updateInvoice('defaultClientPhone', e.target.value)} 
                />
              </div>
            </div>
            <div className="form-group">
                <label>Default Client Email</label>
                <input 
                  type="email" 
                  value={localSettings.invoice.defaultClientEmail || ''} 
                  onChange={(e) => updateInvoice('defaultClientEmail', e.target.value)} 
                />
              </div>
            <div className="form-group">
              <label>Default Client Address</label>
              <textarea 
                rows={2} 
                value={localSettings.invoice.defaultClientAddress || ''} 
                onChange={(e) => updateInvoice('defaultClientAddress', e.target.value)} 
              />
            </div>

            <h4 style={{ marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Footer & Terms</h4>
            <div className="form-group">
              <label>Invoice Terms & Conditions</label>
              <textarea 
                rows={4} 
                className="form-control"
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '100px', lineHeight: '1.5', fontSize: '14px' }} 
                value={localSettings.invoice.termsAndConditions} 
                onChange={(e) => updateInvoice('termsAndConditions', e.target.value)}
                placeholder="Enter terms, conditions, and any other notes to display at the bottom of your invoices..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

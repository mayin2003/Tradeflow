import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Settings2, 
  User, 
  ShoppingCart, 
  DollarSign, 
  FileText, 
  Globe, 
  MapPin, 
  Mail, 
  Briefcase, 
  ShieldCheck, 
  Trash2, 
  Upload, 
  Percent, 
  CheckCircle2, 
  Signature, 
  BadgeCheck, 
  Scale, 
  Sparkles, 
  BookOpen, 
  Link2,
  ChevronRight,
  FileSpreadsheet,
  CreditCard,
  Notebook
} from 'lucide-react';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { settings, updateSettings, addActivityLog } = useData();
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'buy' | 'sell' | 'invoice'>('profile');
  const [localSettings, setLocalSettings] = useState(settings);
  const [fullName, setFullName] = useState(user?.name || '');
  const [showSaved, setShowSaved] = useState(false);

  const isDark = settings.theme === 'dark';

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
    <div 
      id="page-settings" 
      className="page active w-full" 
      style={{ position: 'relative', minHeight: '100%' }}
    >
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
              padding: '14px 28px',
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

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gradient bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Settings
          </h2>
          <p className={`mt-2 font-medium text-sm md:text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Refine your trade operations parameters, invoice design, and business parameters
          </p>
        </div>

        <div className="flex items-center gap-4">
          {showSaved && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              Cloud Synced
            </motion.div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm md:text-base shadow-lg transition-all duration-300 ${
              showSaved 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25' 
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-blue-500/20'
            }`}
            onClick={handleSave}
            disabled={showSaved}
          >
            {showSaved ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Securely Saved</span>
              </motion.div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Save Global Changes</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ENTERPRISE PROFILE OVERVIEW BANNER */}
      <div className="relative overflow-hidden mb-10 rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#0f1b34] to-[#142347] border border-blue-500/15 shadow-2xl p-6 md:p-10 text-white">
        {/* Abstract futuristic network overlay art */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[250px] h-[250px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute right-10 bottom-4 text-[120px] md:text-[180px] opacity-10 font-mono select-none pointer-events-none spin-slow">
          🚢
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8">
          {/* Company Brand Logo Slot */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-shrink-0 w-32 h-32 bg-white rounded-3xl flex items-center justify-center p-3 shadow-2xl border-4 border-white/10 overflow-hidden"
          >
            {localSettings.shopProfile.logoUrl ? (
              <img src={localSettings.shopProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-5xl">📦</span>
            )}
          </motion.div>

          {/* Profile Corporate stats */}
          <div className="flex-1 w-full text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {localSettings.shopProfile.name || 'TradeFlow Business'}
              </h1>
              <div className="bg-blue-500/15 border border-blue-400/35 px-3 py-1 rounded-full text-[11px] font-bold text-blue-400 tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Verified Enterprise
              </div>
            </div>

            <p className="opacity-80 text-sm md:text-base font-medium flex items-center justify-center lg:justify-start gap-2 mb-6">
              <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{localSettings.shopProfile.address || 'Address not configured'}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold flex items-center gap-2">
                <span className="text-white/60">Email:</span>
                <span className="text-white">{localSettings.shopProfile.email || 'N/A'}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold flex items-center gap-2">
                <span className="text-white/60">Currency:</span>
                <span className="text-white font-mono">{localSettings.currency || 'USD'}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold flex items-center gap-2">
                <span className="text-white/60">Sales Tax (VAT):</span>
                <span className="text-white">{localSettings.taxRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PREMIUM SAAS TABS */}
      <div className={`p-1.5 rounded-2xl mb-8 flex gap-1.5 overflow-x-auto scrollbar-hide w-max max-w-full ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200'
      }`}>
        {[
          { id: 'profile', label: 'Shop Profile', icon: User },
          { id: 'general', label: 'General Settings', icon: Settings2 },
          { id: 'buy', label: 'Buy Settings', icon: ShoppingCart },
          { id: 'sell', label: 'Sell Settings', icon: DollarSign },
          { id: 'invoice', label: 'Invoice Layout', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 md:px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 whitespace-nowrap outline-none ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SETTINGS FORM SPACE */}
      <div className="pb-16">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.22 }}
        >
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* BRANDING SECTION */}
              <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
                isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        Identity & Branding
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Set your official business details and visual branding assets
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500">
                    Public
                  </span>
                </div>

                <div className={`p-6 rounded-2xl border mb-6 ${
                  isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200/50'
                }`}>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className={`relative w-36 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all overflow-hidden ${
                        isDark 
                          ? 'border-slate-700 bg-slate-900/80 hover:border-blue-500/50' 
                          : 'border-slate-300 bg-white hover:border-blue-500'
                      }`}
                    >
                      {localSettings.shopProfile.logoUrl ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <img 
                            src={localSettings.shopProfile.logoUrl} 
                            alt="Logo preview" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <span className={`text-[10px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            BRAND LOGO
                          </span>
                        </div>
                      )}
                    </motion.div>

                    <div className="flex-1 text-center md:text-left space-y-3">
                      <h4 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>
                        Corporate Brand Logo
                      </h4>
                      <p className={`text-xs leading-relaxed max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        This logo will appear on all digital exports, transactional invoices, and your public trade profile. Use a clear, high-contrast, high-resolution square image.
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 shadow-sm transition-all">
                          <Upload className="w-4 h-4" />
                          <span>Update Logo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
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
                          <button 
                            className={`flex items-center gap-1.5 rounded-xl text-xs font-bold py-2.5 px-4 border shadow-sm transition-all ${
                              isDark 
                                ? 'bg-slate-900 border-red-500/30 text-red-400 hover:bg-red-550/10' 
                                : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                            onClick={() => updateProfile('logoUrl', '')}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Account Representative
                    </label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="e.g. mizanroad800@gmail.com" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Full Trading Name / Business Name
                    </label>
                    <input 
                      type="text" 
                      value={localSettings.shopProfile.name} 
                      onChange={(e) => updateProfile('name', e.target.value)} 
                      placeholder="e.g. TradeFlow Enterprise" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Global Headquarters Address
                  </label>
                  <textarea 
                    rows={3} 
                    value={localSettings.shopProfile.address} 
                    onChange={(e) => updateProfile('address', e.target.value)} 
                    placeholder="Street, City, State, Country, ZIP..." 
                    className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 resize-none ${
                      isDark 
                        ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* CONTACT DETAILS PANEL */}
              <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
                isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Sovereign Contact channels
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Manage support contact and administrative secure endpoints
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Admin Email Address
                    </label>
                    <input 
                      type="email" 
                      value={localSettings.shopProfile.email} 
                      onChange={(e) => updateProfile('email', e.target.value)} 
                      placeholder="admin@enterprise.com" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Support/Secondary Contact Alias
                    </label>
                    <input 
                      type="email" 
                      value={localSettings.shopProfile.secondaryEmail || ''} 
                      onChange={(e) => updateProfile('secondaryEmail', e.target.value)} 
                      placeholder="support@enterprise.com" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* REGISTRY & WEBB SITE */}
              <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
                isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Legal & Registry Settings
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Official registration indices used on business exports & custom clearances
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Official Portal Website
                    </label>
                    <input 
                      type="text" 
                      value={localSettings.shopProfile.website} 
                      onChange={(e) => updateProfile('website', e.target.value)} 
                      placeholder="https://yourcompany.com" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Sovereign corporate tax ID
                    </label>
                    <input 
                      type="text" 
                      value={localSettings.shopProfile.taxId} 
                      onChange={(e) => updateProfile('taxId', e.target.value)} 
                      placeholder="e.g. VAT-92849103" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
              isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Platform Experience
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Define the baseline global variables and localizations of the workspace
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Base Transaction currency
                  </label>
                  <input 
                    type="text" 
                    value={localSettings.currency} 
                    onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})} 
                    placeholder="e.g. USD, EUR, BDT, GBP" 
                    className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                  <p className="mt-2 text-[11px] text-slate-400">
                    Determines unit representation globally on reports, charts, and invoice documents
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Default Sales Tax (%)
                  </label>
                  <input 
                    type="number" 
                    value={localSettings.taxRate} 
                    onChange={(e) => setLocalSettings({...localSettings, taxRate: +e.target.value})} 
                    placeholder="e.g. 5" 
                    className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                  <p className="mt-2 text-[11px] text-slate-400">
                    The default fallback VAT / processing tariff applied directly in newly drafted transactions
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buy' && (
            <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
              isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Inbound Logistics Control
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure custom duty flags, freight charges routing, and chronological constraints
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'enableShippingCost', label: 'Logistics Expenses', desc: 'Add dedicated lanes for freight and shipping charges' },
                  { id: 'enableCustomsDuty', label: 'Customs & Port Fees', desc: 'Track international clearance and duty payments spec' },
                  { id: 'enableOtherCosts', label: 'Handling & Surcharges', desc: 'Capture miscellaneous processing or storage fees' },
                  { id: 'requireDate', label: 'Mandatory Acquisition Date', desc: 'Enforce strict chronological transaction tracking' }
                ].map((item) => {
                  const isChecked = localSettings.buy[item.id as keyof typeof localSettings.buy];
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleBuy(item.id as any)}
                      className={`group p-5 rounded-2xl border flex items-center justify-between gap-6 cursor-pointer select-none transition-all duration-200 ${
                        isDark 
                          ? 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60' 
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex-1">
                        <span className={`text-sm md:text-base font-bold block mb-1 group-hover:text-blue-500 transition-colors ${
                          isDark ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                        <span className={`text-xs block leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </div>

                      {/* SWITCH/TOGGLE BODY */}
                      <div className={`relative w-14 h-7 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${
                        isChecked ? 'bg-blue-600' : isDark ? 'bg-slate-800' : 'bg-slate-250'
                      }`}>
                        <motion.div 
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="w-6 h-6 rounded-full bg-white shadow-md"
                          style={{
                            float: isChecked ? 'right' : 'left'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'sell' && (
            <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
              isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Trade Velocity Engine
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Formulate sales workflows, multi-item constraints, tracking filters, and tax engines
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  { id: 'enableMultipleProducts', label: 'Bulk Sale Mode', desc: 'Support multiple unique line items in a single trade' },
                  { id: 'enableVat', label: 'Automated VAT Engine', desc: 'Real-time tax calculation and compliance controls' },
                  { id: 'enableCustomerName', label: 'Entity Identification', desc: 'Mandatory customer name tracking for logs' },
                  { id: 'enableCurrencySelection', label: 'Global Trade Sync', desc: 'Support per-transaction currency overrides' }
                ].map((item) => {
                  const isChecked = localSettings.sell[item.id as keyof typeof localSettings.sell];
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleSell(item.id as any)}
                      className={`group p-5 rounded-2xl border flex items-center justify-between gap-6 cursor-pointer select-none transition-all duration-200 ${
                        isDark 
                          ? 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60' 
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex-1">
                        <span className={`text-sm md:text-base font-bold block mb-1 group-hover:text-blue-500 transition-colors ${
                          isDark ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                        <span className={`text-xs block leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </div>

                      {/* SWITCH/TOGGLE BODY */}
                      <div className={`relative w-14 h-7 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${
                        isChecked ? 'bg-blue-600' : isDark ? 'bg-slate-800' : 'bg-slate-250'
                      }`}>
                        <motion.div 
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="w-6 h-6 rounded-full bg-white shadow-md"
                          style={{
                            float: isChecked ? 'right' : 'left'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="max-w-md">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Default Transaction VAT (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={localSettings.sell.defaultVat} 
                    onChange={(e) => setLocalSettings({
                      ...localSettings, 
                      sell: {
                        ...localSettings.sell, 
                        defaultVat: +e.target.value
                      }
                    })} 
                    className={`w-full text-sm font-semibold pl-4 pr-12 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pr-1 pointer-events-none text-sm font-bold text-slate-400">
                    %
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
                isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Invoice Architecture
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Structure visual templates, executive authorizations, standard legal clauses, and discounts
                    </p>
                  </div>
                </div>

                {/* SHOW LOGO TOGGLE GRID */}
                <div 
                  onClick={() => updateInvoice('showLogo', !localSettings.invoice.showLogo)}
                  className={`group p-5 rounded-2xl border flex items-center justify-between gap-6 cursor-pointer select-none transition-all duration-200 mb-6 ${
                    isDark 
                      ? 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60' 
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex-1">
                    <span className={`text-sm md:text-base font-bold block mb-1 group-hover:text-blue-500 transition-colors ${
                      isDark ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      Project Branding on Export
                    </span>
                    <span className={`text-xs block leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Automatically render corporate visual logo on all digital PDF exports or physical invoice sheets
                    </span>
                  </div>

                  {/* SWITCH/TOGGLE BODY */}
                  <div className={`relative w-14 h-7 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${
                    localSettings.invoice.showLogo ? 'bg-blue-600' : isDark ? 'bg-slate-800' : 'bg-slate-250'
                  }`}>
                    <motion.div 
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-6 h-6 rounded-full bg-white shadow-md"
                      style={{
                        float: localSettings.invoice.showLogo ? 'right' : 'left'
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Payment Instructions (Primary)
                    </label>
                    <input 
                      type="text" 
                      value={localSettings.invoice.bankInfo} 
                      onChange={(e) => updateInvoice('bankInfo', e.target.value)} 
                      placeholder="e.g. Bank Account details / PayPal account" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Accepted Credit Networks
                    </label>
                    <input 
                      type="text" 
                      value={localSettings.invoice.cardPayment || ''} 
                      onChange={(e) => updateInvoice('cardPayment', e.target.value)} 
                      placeholder="e.g. Visa, Mastercard, American Express" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Standard VAT (%)
                    </label>
                    <input 
                      type="number" 
                      value={localSettings.invoice.taxRate} 
                      onChange={(e) => updateInvoice('taxRate', +e.target.value)} 
                      placeholder="VAT Percentage" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Standard Trade Discount (%)
                    </label>
                    <input 
                      type="number" 
                      value={localSettings.invoice.discount} 
                      onChange={(e) => updateInvoice('discount', +e.target.value)} 
                      placeholder="Discount Percentage" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* EXECUTIVE SIGNATURE CONTAINER */}
              <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
                isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                    <Signature className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Executive Authorization Signature
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Verify professional authorization parameters & digital autograph identity on docs
                    </p>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border mb-6 ${
                  isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200/50'
                }`}>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className={`relative w-48 h-24 bg-white rounded-xl border flex flex-col items-center justify-center p-3 shadow-sm overflow-hidden ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}
                    >
                      {localSettings.invoice.signatureUrl ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <img 
                            src={localSettings.invoice.signatureUrl} 
                            alt="Signature preview" 
                            className="max-w-full max-h-full object-contain" 
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold block select-none uppercase tracking-widest text-center">
                          NO AUTOGRAPH
                        </span>
                      )}
                    </motion.div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h4 className={`text-md font-bold ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>
                        Autograph Template Document
                      </h4>
                      <p className={`text-xs leading-relaxed max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Upload a premium high-contrast digital signature transparent png to automate authorization stamp parameters across transactional documents.
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 shadow-sm transition-all animate-none">
                          <Upload className="w-4.5 h-4.5" />
                          <span>Upload Signature</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Authorized Signatory Name
                    </label>
                    <input 
                      type="text" 
                      value={localSettings.invoice.signatureName || ''} 
                      onChange={(e) => updateInvoice('signatureName', e.target.value)} 
                      placeholder="e.g. Mahabub Alom" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Professional Position / Title
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Managing Director" 
                      className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* TERMS CONTROLLER */}
              <div className={`p-6 md:p-8 rounded-2xl shadow-sm border transition-all ${
                isDark ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-slate-205'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                    <Notebook className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Global Legal Trade terms
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Write general transaction clauses, returns policy parameters, and terms details
                    </p>
                  </div>
                </div>

                <textarea 
                  rows={5} 
                  value={localSettings.invoice.termsAndConditions} 
                  onChange={(e) => updateInvoice('termsAndConditions', e.target.value)} 
                  placeholder="e.g. All goods delivered remain the sole properties of TradeFlow until payment completed in full..." 
                  className={`w-full text-sm font-semibold px-4 py-3.5 rounded-xl border outline-none transition-all duration-200 ${
                    isDark 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
                <span className="text-[11px] block mt-2 text-right font-medium text-slate-400">
                  Automatically embedded at the footer of invoice document templates
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

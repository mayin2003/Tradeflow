import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Moon, Sun, Search, Bell, ChevronDown } from 'lucide-react';

interface TopbarProps {
  title: string;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
}

export const Topbar = ({ title, onToggleSidebar, onNavigate }: TopbarProps) => {
  const { products, settings, updateSettings } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const stockAlerts = products.filter(p => p.stock <= p.min_stock);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = settings.theme === 'dark';

  return (
    <div className={`topbar flex items-center justify-between h-[72px] px-6 lg:px-10 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0B1220]/90 border-b border-white/5 shadow-lg shadow-black/10' 
        : 'bg-white/95 border-b border-slate-100 shadow-sm shadow-slate-100/50'
    }`}>
      {/* Left side: Hamburger and Title or Search */}
      <div className="flex items-center gap-4">
        <div className="hamburger lg:hidden cursor-pointer p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors" onClick={onToggleSidebar}>☰</div>
        <div className="hidden md:flex topbar-search items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 transition-all focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500/10">
          <Search size={16} className="text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search here..." 
            className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 text-slate-800 dark:text-slate-100 placeholder-slate-400/80 dark:placeholder-slate-500" 
          />
        </div>
      </div>

      {/* Right side: Actions, notifications, divider, and profile */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Theme Toggle */}
        <button 
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
            isDark 
              ? 'bg-slate-900 border-white/5 text-amber-400 hover:text-amber-300' 
              : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-blue-600 hover:bg-slate-100'
          }`}
          onClick={() => {
            const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
            updateSettings({ ...settings, theme: nextTheme });
          }}
          title={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Button */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            className={`w-11 h-11 rounded-[12px] border flex items-center justify-center transition-all duration-200 ease-out relative z-[9999] shrink-0 select-none cursor-pointer ${
              isDark
                ? showNotifs
                  ? 'bg-[#334155] border-blue-500 text-white scale-105 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)]'
                  : `bg-[#334155] border-[rgba(255,255,255,0.20)] text-white hover:scale-105 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.35)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] ${
                      stockAlerts.length > 0
                        ? 'shadow-[0_0_0_1.5px_rgba(59,130,246,0.35),0_0_25px_rgba(59,130,246,0.25)]'
                        : 'shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
                    }`
                : showNotifs
                  ? 'border-blue-500 bg-blue-50 text-blue-600 scale-105 shadow-md border-2'
                  : 'bg-white border-slate-200 text-slate-705 hover:text-slate-900 hover:bg-slate-100 hover:scale-105 shadow-sm'
            }`}
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={20} strokeWidth={2.5} className="text-white !text-white !opacity-100" />
            {stockAlerts.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-[18px] h-[18px] text-white rounded-full flex items-center justify-center text-[9px] font-bold leading-none shadow-md z-[10000] ${
                isDark 
                  ? 'bg-[#EF4444] border-2 border-white shadow-red-500/40 text-white font-extrabold' 
                  : 'bg-rose-500 border border-white'
              }`}>
                {stockAlerts.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className={`absolute top-13 right-0 w-85 rounded-2xl shadow-2xl border z-[99999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
              isDark 
                ? 'bg-[#1E293B] border-white/10 text-white shadow-black/80' 
                : 'bg-white border-slate-100 text-slate-900 shadow-slate-200'
            }`}>
              <div className={`p-4 border-b flex justify-between items-center ${
                isDark 
                  ? 'border-white/10 bg-slate-900/60' 
                  : 'border-slate-100 bg-slate-50/50'
              }`}>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark 
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                    : 'text-blue-500 bg-blue-50/50 border-blue-500/20'
                }`}>{stockAlerts.length} Alerts</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {stockAlerts.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {stockAlerts.map(p => (
                      <div 
                        key={p.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group text-left ${
                          isDark 
                            ? 'hover:bg-slate-800/60' 
                            : 'hover:bg-slate-50/80'
                        }`}
                        onClick={() => {
                          setShowNotifs(false);
                          onNavigate('inventory');
                        }}
                      >
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black ${
                          isDark 
                            ? 'bg-[rgba(239,68,68,0.2)] text-red-400' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          !
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-bold transition-colors group-hover:text-blue-500 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>{p.name}</div>
                          <div className={`text-[10px] mt-0.5 ${
                            isDark ? 'text-slate-300' : 'text-slate-500'
                          }`}>Stock has reached {p.stock} units. Restock suggested.</div>
                          <div className="text-[10px] font-bold text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">Go to Inventory →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center">
                    <div className="text-3xl mb-2 text-blue-500/90 drop-shadow-sm">✨</div>
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>System check clear</div>
                    <div className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No pending stock alerts or issues found.</div>
                  </div>
                )}
              </div>
              {stockAlerts.length > 0 && (
                <div 
                  className={`p-3 text-center border-t transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-slate-900/40 border-white/10 hover:bg-slate-800/85' 
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                  }`} 
                  onClick={() => setShowNotifs(false)}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-505 hover:text-blue-500'
                  }`}>Mark All as Read</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-7 w-[1px] bg-slate-200 dark:bg-white/10"></div>

        {/* User Profile Info Area */}
        <div 
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-3 pl-1 sm:pl-2 py-1.5 pr-2 sm:pr-3 rounded-xl hover:bg-slate-100/75 dark:hover:bg-slate-900 cursor-pointer select-none transition-all duration-200"
        >
          {/* Avatar Container: Zachary A. */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-900">
              ZA
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0B1220] rounded-full"></span>
          </div>

          {/* User Meta Text */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Zachary A.</span>
            <span className="text-[10px] font-medium text-slate-450 dark:text-slate-400 mt-1">Owner Admin</span>
          </div>

          <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 hidden sm:block ml-0.5" />
        </div>
      </div>
    </div>
  );
};


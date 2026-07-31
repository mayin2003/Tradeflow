import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Moon, Sun, Search, Bell, ChevronDown, Settings, Check, Clock, ChevronRight } from 'lucide-react';

const StarSparkle = ({ className }: { className?: string }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
  </svg>
);

interface TopbarProps {
  title: string;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
}

export const TopbarComponent = ({ title, onToggleSidebar, onNavigate }: TopbarProps) => {
  const { products, settings, updateSettings } = useData();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const stockAlerts = useMemo(() => products.filter(p => p.stock <= p.min_stock), [products]);

  const userName = user?.name || 'User';

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=ffffff&bold=true&size=128`;
  const avatarSrc = (!avatarError && user?.avatar) ? user.avatar : defaultAvatar;

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
        : 'bg-[#E2E8F4] border-b border-slate-200/80 shadow-xs'
    }`}>
      {/* Left side: Hamburger and Title or Search */}
      <div className="flex items-center gap-4">
        <div className="hamburger lg:hidden cursor-pointer p-2 rounded-xl border border-slate-300/80 dark:border-white/10 bg-[#E2E8F4] dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors" onClick={onToggleSidebar}>☰</div>
        <div className="hidden md:flex topbar-search items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300/60 dark:border-white/5 transition-all focus-within:border-blue-500/50 focus-within:bg-[#E2E8F4] dark:focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500/10">
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
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ease-out cursor-pointer group ${
            isDark 
              ? 'bg-slate-900 border-white/5 text-amber-400 hover:text-amber-300' 
              : 'bg-white border-slate-300/90 text-slate-700 hover:text-blue-600 hover:bg-slate-50 hover:border-slate-400 hover:scale-105 shadow-xs'
          }`}
          onClick={() => {
            const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
            updateSettings({ ...settings, theme: nextTheme });
          }}
          title={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} className="transition-colors group-hover:text-blue-600" />}
        </button>

        {/* Notifications Button */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            className={`w-11 h-11 rounded-[12px] border flex items-center justify-center transition-all duration-200 ease-out relative z-[9999] shrink-0 select-none cursor-pointer group ${
              isDark
                ? showNotifs
                  ? 'bg-[#334155] border-blue-500 text-white scale-105 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)]'
                  : `bg-[#334155] border-[rgba(255,255,255,0.20)] text-white hover:scale-105 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.35)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] ${
                      stockAlerts.length > 0
                        ? 'shadow-[0_0_0_1.5px_rgba(59,130,246,0.35),0_0_25px_rgba(59,130,246,0.25)]'
                        : 'shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
                    }`
                : showNotifs
                  ? 'bg-white border-2 border-blue-600 text-blue-600 scale-105 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border border-slate-300/90 text-slate-700 hover:text-blue-600 hover:bg-slate-50 hover:border-slate-400 hover:scale-105 shadow-xs'
            }`}
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={20} strokeWidth={2.2} className={isDark ? "text-white" : showNotifs ? "text-blue-600" : "text-slate-700 group-hover:text-blue-600 transition-colors"} />
            {stockAlerts.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-[18px] h-[18px] text-white rounded-full flex items-center justify-center text-[9px] font-bold leading-none shadow-md z-[10000] ${
                isDark 
                  ? 'bg-[#EF4444] border-2 border-[#1E293B] shadow-red-500/40 text-white font-extrabold' 
                  : 'bg-rose-500 border-2 border-white text-white font-extrabold'
              }`}>
                {stockAlerts.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className={`absolute top-14 right-0 w-[330px] rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border z-[99999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
              isDark 
                ? 'bg-[#1E293B] border-slate-800 text-white shadow-black/80' 
                : 'bg-white border-slate-200/80 text-slate-900 shadow-slate-300/50'
            }`}>
              {/* Caret Pointer Arrow */}
              <div className={`absolute -top-1.5 right-4 w-3.5 h-3.5 rotate-45 border-t border-l z-[100000] ${
                isDark 
                  ? 'bg-[#1E293B] border-slate-800' 
                  : 'bg-white border-slate-200/80'
              }`} />

              {/* Header */}
              <div className={`p-4 px-5 border-b flex justify-between items-center relative z-10 ${
                isDark 
                  ? 'border-slate-800/80 bg-slate-900/40' 
                  : 'border-slate-100 bg-white'
              }`}>
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                    {stockAlerts.length} New
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-colors"
                    onClick={() => setShowNotifs(false)}
                  >
                    Mark all as read
                  </button>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                    title="Notification settings"
                    onClick={() => {
                      setShowNotifs(false);
                      onNavigate('settings');
                    }}
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="max-h-[320px] overflow-y-auto relative z-10">
                {stockAlerts.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {stockAlerts.map(p => (
                      <div 
                        key={p.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group text-left ${
                          isDark 
                            ? 'hover:bg-slate-800/60' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setShowNotifs(false);
                          onNavigate('inventory');
                        }}
                      >
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-black ${
                          isDark 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          !
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-bold transition-colors group-hover:text-blue-600 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>{p.name}</div>
                          <div className={`text-[11px] mt-0.5 ${
                            isDark ? 'text-slate-300' : 'text-slate-500'
                          }`}>Stock has reached {p.stock} units. Restock suggested.</div>
                          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            Go to Inventory <ChevronRight size={12} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-6 text-center flex flex-col items-center justify-center">
                    {/* Illustration with Bell, Glow & Sparkles */}
                    <div className="relative flex items-center justify-center mb-4 py-2 w-full">
                      {/* Ambient background glow */}
                      <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-100/80 via-purple-100/60 to-blue-100/80 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 blur-md"></div>
                      
                      {/* Sparkles */}
                      <StarSparkle className="text-indigo-300 dark:text-indigo-400/80 absolute top-0 left-16 w-3.5 h-3.5 animate-pulse" />
                      <StarSparkle className="text-purple-300 dark:text-purple-400/80 absolute top-1 right-16 w-3.5 h-3.5" />
                      <StarSparkle className="text-indigo-300 dark:text-indigo-400/80 absolute bottom-1 left-20 w-3 h-3" />
                      <StarSparkle className="text-purple-300 dark:text-purple-400/80 absolute bottom-2 right-20 w-3 h-3" />

                      {/* Main Bell Badge Circle */}
                      <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-[0_8px_25px_rgba(99,102,241,0.15)] border border-slate-100 dark:border-slate-700/60 flex items-center justify-center">
                        <Bell size={28} className="text-blue-600 dark:text-blue-400 fill-blue-600/15 dark:fill-blue-400/20" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white shadow-xs">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      </div>
                    </div>

                    {/* Headline */}
                    <h5 className={`text-base font-bold flex items-center justify-center gap-1.5 mb-1.5 ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      You&apos;re all caught up! 🎉
                    </h5>

                    {/* Subtitle */}
                    <p className={`text-xs max-w-[240px] mx-auto leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      No new notifications or stock alerts. Everything looks good.
                    </p>

                    {/* Last checked indicator */}
                    <div className={`flex items-center justify-center gap-1.5 text-xs font-medium mt-5 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <Clock size={13} />
                      <span>Last checked just now</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div 
                className={`border-t p-3.5 px-5 flex items-center justify-between transition-colors cursor-pointer relative z-10 rounded-b-[22px] ${
                  isDark 
                    ? 'border-slate-800/80 hover:bg-slate-800/50 text-slate-300' 
                    : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
                onClick={() => {
                  setShowNotifs(false);
                  onNavigate('inventory');
                }}
              >
                <span className="text-xs font-semibold">View notification history</span>
                <ChevronRight size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              </div>
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
          {/* Avatar Container */}
          <div className="relative">
            <img 
              src={avatarSrc} 
              alt={userName} 
              onError={() => setAvatarError(true)}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm" 
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0B1220] rounded-full"></span>
          </div>

          {/* User Meta Text - Displaying user full name only */}
          <div className="hidden sm:flex flex-col text-left justify-center">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {userName}
            </span>
          </div>

          <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 hidden sm:block ml-0.5" />
        </div>
      </div>
    </div>
  );
};

export const Topbar = React.memo(TopbarComponent);


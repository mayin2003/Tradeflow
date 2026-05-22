import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Moon, Sun } from 'lucide-react';

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

  return (
    <div className="topbar">
      <div className="hamburger" onClick={onToggleSidebar}>☰</div>
      <div className="topbar-title" id="page-title">{title}</div>
      <div className="topbar-actions">
        <div className="topbar-search">
          <span>🔍</span>
          <input type="text" placeholder="Search analytics, inventory..." className="bg-transparent border-none outline-none text-sm w-48 lg:w-64" />
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            className={`topbar-btn transition-all duration-300 relative ${
              showNotifs 
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/20 text-blue-500 scale-105 shadow-md border-2' 
                : ''
            }`}
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <span className="text-lg">🔔</span>
            {stockAlerts.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#111827] animate-pulse"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute top-12 right-0 w-80 bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border)] z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/60 flex justify-between items-center">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h4>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50/50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{stockAlerts.length} Alerts</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {stockAlerts.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {stockAlerts.map(p => (
                      <div 
                        key={p.id} 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group text-left"
                        onClick={() => {
                          setShowNotifs(false);
                          onNavigate('inventory');
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/25 text-rose-500 flex-shrink-0 flex items-center justify-center text-[10px] font-black">
                          !
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">{p.name}</div>
                          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Stock has reached {p.stock} units. Restock suggested.</div>
                          <div className="text-[10px] font-bold text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">Go to Inventory →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center">
                    <div className="text-3xl mb-2 text-blue-500/90 drop-shadow-sm">✨</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">System check clear</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">No pending stock alerts or issues found.</div>
                  </div>
                )}
              </div>
              {stockAlerts.length > 0 && (
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 text-center border-t border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => setShowNotifs(false)}>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest hover:text-blue-500 transition-colors">Mark All as Read</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="topbar-btn" 
          onClick={() => {
            const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
            updateSettings({ ...settings, theme: nextTheme });
          }}
          title={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button 
          className="topbar-btn" 
          onClick={() => onNavigate('settings')}
        >
          👤
        </button>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';

interface TopbarProps {
  title: string;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
}

export const Topbar = ({ title, onToggleSidebar, onNavigate }: TopbarProps) => {
  const { products } = useData();
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
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 relative ${
              showNotifs 
                ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105 shadow-sm' 
                : 'border-slate-200 bg-card text-slate-500 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <span className="text-lg">🔔</span>
            {stockAlerts.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute top-12 right-0 w-80 bg-card rounded-2xl shadow-2xl border border-slate-100 z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h4 className="text-sm font-bold text-primary">Notifications</h4>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{stockAlerts.length} Alerts</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {stockAlerts.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {stockAlerts.map(p => (
                      <div 
                        key={p.id} 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group text-left"
                        onClick={() => {
                          setShowNotifs(false);
                          onNavigate('inventory');
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex-shrink-0 flex items-center justify-center text-[10px] font-black">
                          !
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-primary group-hover:text-blue-600 transition-colors">{p.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Stock has reached {p.stock} units. Restock suggested.</div>
                          <div className="text-[10px] font-bold text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Go to Inventory →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center">
                    <div className="text-3xl mb-2">✨</div>
                    <div className="text-sm font-bold text-primary">System check clear</div>
                    <div className="text-xs text-slate-500 mt-1">No pending stock alerts or issues found.</div>
                  </div>
                )}
              </div>
              {stockAlerts.length > 0 && (
                <div className="p-3 bg-slate-50/30 text-center border-t border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setShowNotifs(false)}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mark All as Read</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 bg-card text-slate-500 hover:border-blue-400 hover:bg-slate-50 transition-all" 
          onClick={() => onNavigate('settings')}
        >
          👤
        </button>
      </div>
    </div>
  );
};

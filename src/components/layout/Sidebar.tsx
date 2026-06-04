import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  current: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ current, onNavigate, isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { settings } = useData();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', section: 'Main' },
    { id: 'inventory', label: 'Inventory', icon: '📦', section: 'Main', badge: 3 },
    { id: 'customers', label: 'Customers', icon: '👥', section: 'Main' },
    { id: 'buy', label: 'Buy (Import)', icon: '🛒', section: 'Trade' },
    { id: 'sell', label: 'Sell (Export)', icon: '💰', section: 'Trade' },
    { id: 'tracking', label: 'Shipment Tracking', icon: '🌐', section: 'Trade' },
    { id: 'invoice', label: 'Invoices', icon: '🧾', section: 'Trade' },
    { id: 'payroll', label: 'Staff Payroll', icon: '💰', section: 'Human Resources' },
    { id: 'reports', label: 'Reports', icon: '📊', section: 'Analysis' },
    { id: 'documents', label: 'Documents', icon: '📁', section: 'Analysis' },
    { id: 'activity', label: 'Activity Log', icon: '📋', section: 'Analysis' },
    { id: 'settings', label: 'Settings', icon: '⚙️', section: 'Settings' },
  ];

  const sections = ['Main', 'Trade', 'Human Resources', 'Analysis', 'Settings'];

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''} h-screen fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-out`}
      id="sidebar"
      style={{
        width: '260px',
        background: 'linear-gradient(180deg, rgba(13, 17, 26, 0.94) 0%, rgba(8, 10, 15, 0.97) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Texture Layer to mimic subtle brushed metal */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: 'linear-gradient(90deg, #fff 50%, transparent 50%), linear-gradient(#fff 50%, transparent 50%)',
          backgroundSize: '3px 3px',
        }}
      />

      {/* Floating Glass Cards: Top Branding Section */}
      <style>{`
        /* Premium custom styles for high-fidelity sidebar */
        .premium-brand-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 16px rgba(0, 0, 0, 0.25);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .premium-brand-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 
            inset 0 1px 2px rgba(255, 255, 255, 0.25), 
            0 12px 24px rgba(0, 0, 0, 0.35),
            0 0 15px rgba(255, 255, 255, 0.05);
        }

        /* Reflective light sweep effect */
        @keyframes sweep {
          0% {
            transform: translateX(-100%) rotate(30deg);
          }
          100% {
            transform: translateX(100%) rotate(30deg);
          }
        }
        .sweep-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: -50%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.03) 30%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.03) 70%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: translateX(-100%) rotate(30deg);
          transition: transform 0.6s ease-out;
          pointer-events: none;
          z-index: 1;
        }
        .sweep-container:hover::after {
          animation: sweep 2s ease-out;
        }

        /* Minimal high-end pulse for active elements */
        @keyframes activePulse {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 4px 22px rgba(255, 255, 255, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.16);
          }
        }
        .premium-active-item {
          animation: activePulse 3.5s infinite ease-in-out;
        }
      `}</style>

      <div className="flex flex-col gap-3 p-5 border-b border-white/5 relative z-10 select-none">
        {/* Card 1: TradeFlow (Business Suite) */}
        <div 
          onClick={() => { onNavigate('settings'); onClose(); }}
          className="premium-brand-card sweep-container flex items-center gap-3 p-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(20,184,166,0.3)] shrink-0 transition-transform duration-300 group-hover:scale-105">
            {settings?.shopProfile?.logoUrl ? (
              <img src={settings.shopProfile.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
            ) : '🚢'}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-white/95 tracking-tight truncate leading-tight">
              {settings?.shopProfile?.name || 'TradeFlow'}
            </div>
            <div className="text-[9px] text-white/40 font-bold tracking-wider uppercase mt-1">
              Business Suite
            </div>
          </div>
        </div>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-5 relative z-10 custom-scrollbar">
        {sections.map(section => (
          <div key={section} className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500/60 tracking-[0.2em] uppercase px-3 mb-1 select-none">
              {section}
            </div>
            <div className="space-y-0.5">
              {navItems.filter(item => item.section === section).map(item => {
                const isActive = current === item.id;
                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ease-out font-medium text-sm border group select-none hover:translate-x-1 ${
                      isActive 
                        ? 'border-white/10 text-white premium-active-item' 
                        : 'border-transparent text-slate-400 hover:text-white/90 hover:bg-white/[0.04]'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                    } : {
                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <span className="text-base select-none shrink-0 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out group-hover:scale-110 group-hover:brightness-125">
                      {item.icon}
                    </span> 
                    <span className="tracking-wide">{item.label}</span>
                    {item.badge && (
                      <span 
                        className="ml-auto flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.7)] select-none border border-white/10 transition-all duration-200 ease-out group-hover:scale-112 group-hover:shadow-[0_0_16px_rgba(239,68,68,0.95),0_0_4px_rgba(239,68,68,0.5)]"
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout Block */}
      <div className="p-4 border-t border-white/5 bg-black/20 mt-auto flex flex-col gap-3 relative z-10">
        {user && (
          <div 
            onClick={() => { onNavigate('settings'); onClose(); }}
            className="flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-200 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.2)] shrink-0 overflow-hidden">
              {settings?.shopProfile?.logoUrl ? (
                <img src={settings.shopProfile.logoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (settings?.shopProfile?.name || user.name).charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-white/95 truncate">
                {settings?.shopProfile?.name || 'TradeFlow'}
              </div>
              <div className="text-[10px] text-white/40 truncate mt-0.5 font-medium">
                {user.name}
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.02] hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 font-bold text-xs border border-white/5 hover:border-rose-500/10 transition-all duration-200 group active:scale-[0.98]"
        >
          <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

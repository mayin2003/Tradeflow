import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  Tag,
  Globe,
  Receipt,
  Wallet,
  BarChart3,
  Folder,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  current: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarComponent = ({ current, onNavigate, isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { settings } = useData();

  const isDark = settings.theme === 'dark';

  // Set to true to temporarily hide Shipment Tracking from the UI
  const HIDE_SHIPMENT_TRACKING = true;

  const getIcon = (id: string, active: boolean) => {
    const iconProps = {
      size: 20,
      className: `shrink-0 transition-colors duration-200 ${
        active
          ? 'text-white'
          : isDark
          ? 'text-slate-400 group-hover:text-blue-400'
          : 'text-slate-500 group-hover:text-[#244A8F]'
      }`,
    };

    switch (id) {
      case 'dashboard':
        return <Home {...iconProps} />;
      case 'inventory':
        return <Package {...iconProps} />;
      case 'customers':
        return <Users {...iconProps} />;
      case 'buy':
        return <ShoppingCart {...iconProps} />;
      case 'sell':
        return <Tag {...iconProps} />;
      case 'tracking':
        return <Globe {...iconProps} />;
      case 'invoice':
        return <Receipt {...iconProps} />;
      case 'payroll':
        return <Wallet {...iconProps} />;
      case 'reports':
        return <BarChart3 {...iconProps} />;
      case 'documents':
        return <Folder {...iconProps} />;
      case 'activity':
        return <ClipboardList {...iconProps} />;
      case 'settings':
        return <Settings {...iconProps} />;
      default:
        return <Home {...iconProps} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', section: 'Main' },
    { id: 'inventory', label: 'Inventory', section: 'Main', badge: 3 },
    { id: 'customers', label: 'Customers', section: 'Main' },
    { id: 'buy', label: 'Buy (Import)', section: 'Trade' },
    { id: 'sell', label: 'Sell (Export)', section: 'Trade' },
    { id: 'tracking', label: 'Shipment Tracking', section: 'Trade', hidden: HIDE_SHIPMENT_TRACKING },
    { id: 'invoice', label: 'Invoices', section: 'Trade' },
    { id: 'payroll', label: 'Staff Payroll', section: 'Human Resources' },
    { id: 'reports', label: 'Reports', section: 'Analysis' },
    { id: 'documents', label: 'Documents', section: 'Analysis' },
    { id: 'activity', label: 'Activity Log', section: 'Analysis' },
    { id: 'settings', label: 'Settings', section: 'Settings' },
  ].filter((item) => !item.hidden);

  const sections = ['Main', 'Trade', 'Human Resources', 'Analysis', 'Settings'];

  return (
    <aside
      id="sidebar"
      className={`sidebar ${
        isOpen ? 'open' : ''
      } h-screen fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-out`}
      style={{
        width: '260px',
        backgroundColor: isDark ? '#0B1220' : '#E2E8F4',
        borderRight: isDark
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: isDark
          ? '8px 0 30px rgba(0, 0, 0, 0.35)'
          : '8px 0 30px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Navigation section */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-5 custom-scrollbar">
        {sections.map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="space-y-1.5">
              <div
                className={`text-[11px] font-bold tracking-[2px] uppercase px-3.5 mb-2 select-none ${
                  isDark ? 'text-slate-400' : 'text-[#94A3B8]'
                }`}
              >
                {section}
              </div>
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = current === item.id || (item.id === 'inventory' && current.startsWith('inventory'));
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[16px] cursor-pointer transition-all duration-200 ease-out select-none group ${
                        isActive
                          ? 'text-white font-semibold text-[15px] shadow-[0_10px_25px_rgba(36,74,143,0.18)]'
                          : isDark
                          ? 'text-slate-300 font-semibold text-[15px] hover:bg-slate-800/60 hover:text-blue-400'
                          : 'text-[#475569] font-semibold text-[15px] hover:bg-slate-200/60 hover:text-[#244A8F]'
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                'linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)',
                            }
                          : undefined
                      }
                    >
                      {getIcon(item.id, isActive)}
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto flex items-center justify-center bg-[#EF4444] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-[0_4px_10px_rgba(239,68,68,0.35)] select-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout Block */}
      <div
        className={`p-4 border-t mt-auto flex flex-col gap-3.5 ${
          isDark ? 'border-white/5 bg-[#090F1A]' : 'border-slate-200/60 bg-[#E2E8F4]'
        }`}
      >
        {user && (
          <div
            onClick={() => {
              onNavigate('settings');
              onClose();
            }}
            className={`flex items-center gap-3 p-3 rounded-[18px] border transition-all duration-200 cursor-pointer select-none ${
              isDark
                ? 'border-white/10 bg-[#131E32] hover:bg-[#1A2842]'
                : 'border-slate-300/70 bg-[#E2E8F4] hover:bg-slate-200/50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              {settings?.shopProfile?.logoUrl ? (
                <img
                  src={settings.shopProfile.logoUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (settings?.shopProfile?.name || user.name || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <div
                className={`text-xs font-bold truncate ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}
              >
                {settings?.shopProfile?.name || 'Your Company Name'}
              </div>
              <div
                className={`text-[11px] truncate mt-0.5 font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {user.name || 'Admin User'}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-[14px] font-semibold text-sm transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20 hover:bg-rose-500/25'
              : 'bg-rose-500/10 text-[#DC2626] border border-rose-200/80 hover:bg-rose-500/20'
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export const Sidebar = React.memo(SidebarComponent);

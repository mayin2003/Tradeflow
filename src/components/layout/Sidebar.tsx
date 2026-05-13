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
    { id: 'invoice', label: 'Invoices', icon: '🧾', section: 'Trade' },
    { id: 'reports', label: 'Reports', icon: '📊', section: 'Analysis' },
    { id: 'documents', label: 'Documents', icon: '📁', section: 'Analysis' },
    { id: 'activity', label: 'Activity Log', icon: '📋', section: 'Analysis' },
    { id: 'settings', label: 'Settings', icon: '⚙️', section: 'Settings' },
  ];

  const sections = ['Main', 'Trade', 'Analysis', 'Settings'];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-header" style={{ padding: '20px' }}>
        <div 
          className="sidebar-logo" 
          onClick={() => { onNavigate('settings'); onClose(); }}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
        >
          <div className="logo-box" style={{ 
            width: '40px', 
            height: '40px', 
            background: 'var(--primary)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {settings?.shopProfile?.logoUrl ? (
              <img src={settings.shopProfile.logoUrl} alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            ) : '🚢'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'white', lineHeight: 1.2 }}>
              {settings?.shopProfile?.name || 'TradeFlow'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Business Suite</div>
          </div>
        </div>

        {user && (
          <div 
            className="sidebar-user" 
            onClick={() => { onNavigate('settings'); onClose(); }}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '10px 12px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <div className="user-avatar" style={{ 
              width: '32px', 
              height: '32px', 
              background: 'var(--accent)', 
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '50%'
            }}>
              {settings?.shopProfile?.logoUrl ? (
                <img src={settings.shopProfile.logoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (settings?.shopProfile?.name || user.name).charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-info" style={{ overflow: 'hidden' }}>
              <div className="name" style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                {settings?.shopProfile?.name || 'TradeFlow'}
              </div>
              <div className="role" style={{ 
                fontSize: '11px', 
                color: 'rgba(255,255,255,0.4)', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {user.name}
              </div>
            </div>
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {sections.map(section => (
          <React.Fragment key={section}>
            <div className="nav-section-label">{section}</div>
            {navItems.filter(item => item.section === section).map(item => (
              <div 
                key={item.id}
                className={`nav-item ${current === item.id ? 'active' : ''}`} 
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              >
                <span className="icon">{item.icon}</span> 
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" onClick={logout}>
          <span className="icon">🚪</span> Logout
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { BuyImport } from './pages/BuyImport';
import { SellExport } from './pages/SellExport';
import { InvoicePage } from './pages/InvoicePage';
import { Reports } from './pages/Reports';
import { Documents } from './pages/Documents';
import { ActivityLog } from './pages/ActivityLog';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import ShipmentTracking from './pages/ShipmentTracking';
import { StaffPayroll } from './pages/StaffPayroll';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

import { motion, AnimatePresence } from 'motion/react';

import { AuthCallback } from './pages/AuthCallback';

const AppContent = () => {
  const { user } = useAuth();
  const { addActivityLog } = useData();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle OAuth Callback route
  if (window.location.pathname === '/auth/callback' || window.location.pathname === '/auth/callback/') {
    return <AuthCallback />;
  }

  // Toggle body class for scroll lock on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [isSidebarOpen]);

  // Track page visits
  useEffect(() => {
    if (user) {
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
      const iconMap: Record<string, string> = {
        dashboard: '📊',
        inventory: '📦',
        buy: '🛒',
        sell: '💰',
        invoice: '🧾',
        reports: '📈',
        documents: '📄',
        customers: '👥',
        activity: '📋',
        tracking: '🌐',
        payroll: '💰',
        settings: '⚙️'
      };
      
      // Debounce activity log for page visits to avoid excessive state updates
      const timer = setTimeout(() => {
        addActivityLog(`Visited Section: ${pageTitle}`, iconMap[currentPage] || '🔗', '#3b82f6');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, user, addActivityLog]);

  const activePageElement = useMemo(() => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'inventory': return <Inventory initialTab="products" />;
      case 'inventory-categories': return <Inventory initialTab="categories" />;
      case 'buy': return <BuyImport onNavigate={handleNavigate} />;
      case 'sell': return <SellExport onNavigate={handleNavigate} />;
      case 'invoice': return <InvoicePage onNavigate={handleNavigate} />;
      case 'reports': return <Reports />;
      case 'documents': return <Documents />;
      case 'customers': return <Customers />;
      case 'tracking': return <ShipmentTracking />;
      case 'payroll': return <StaffPayroll />;
      case 'activity': return <ActivityLog />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  }, [currentPage, handleNavigate]);

  // If not logged in, show landing or login
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {showAuth ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoginPage onBack={() => setShowAuth(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LandingPage onStart={() => setShowAuth(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div id="app" className={isSidebarOpen ? 'sidebar-open' : ''} style={{ display: 'flex' }}>
      <Sidebar 
        current={currentPage} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />
      
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay" 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 900,
              cursor: 'pointer'
            }}
            onClick={handleCloseSidebar}
          />
        )}
      </AnimatePresence>
      
      <div className="main">
        <Topbar 
          title={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} 
          onToggleSidebar={handleToggleSidebar}
          onNavigate={handleNavigate}
        />
        
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
            >
              {activePageElement}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

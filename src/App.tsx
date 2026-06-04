import React, { useState, useEffect } from 'react';
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
  }, [currentPage, user]);

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
            transition={{ duration: 0.3 }}
          >
            <LoginPage onBack={() => setShowAuth(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage onStart={() => setShowAuth(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'inventory': return <Inventory />;
      case 'buy': return <BuyImport />;
      case 'sell': return <SellExport onNavigate={setCurrentPage} />;
      case 'invoice': return <InvoicePage onNavigate={setCurrentPage} />;
      case 'reports': return <Reports />;
      case 'documents': return <Documents />;
      case 'customers': return <Customers />;
      case 'tracking': return <ShipmentTracking />;
      case 'payroll': return <StaffPayroll />;
      case 'activity': return <ActivityLog />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div id="app" className={isSidebarOpen ? 'sidebar-open' : ''} style={{ display: 'flex' }}>
      <Sidebar 
        current={currentPage} 
        onNavigate={setCurrentPage} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="main">
        <Topbar 
          title={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigate={setCurrentPage}
        />
        
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderPage()}
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

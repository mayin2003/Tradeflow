import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, Download, Trash2, Clock, Hash, Check } from 'lucide-react';

export const ActivityLogComponent = () => {
  const { activityLogs, clearActivityLogs, settings, addActivityLog } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showClearedAlert, setShowClearedAlert] = useState(false);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase());
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const matchesDate = selectedDate ? logDate === selectedDate : true;
      return matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activityLogs, searchTerm, selectedDate]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const timestampStr = now.toLocaleString();
    
    const primaryColor = [14, 165, 233]; 
    const secondaryColor = [100, 116, 139]; 

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); 
    doc.setFont('helvetica', 'bold');
    doc.text('TradeFlow Activity Audit', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Official System Access & Activity Log Report`, 14, 32);

    doc.setFontSize(9);
    doc.text(`Shop Name: ${settings.shopProfile.name}`, 145, 18);
    doc.text(`Generated: ${timestampStr}`, 145, 23);
    doc.text(`Filter Date: ${selectedDate || 'Full History'}`, 145, 28);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 45, 196, 45);

    const tableData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleDateString(),
      new Date(log.timestamp).toLocaleTimeString(),
      log.action,
      log.icon || '•'
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Time', 'Detailed System Action / Event', 'Ref']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 8.5, 
        cellPadding: 4,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        3: { cellWidth: 15, halign: 'center' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `TradeFlow Audit System — Page ${data.pageNumber} — Confirms internal record for ${settings.shopProfile.name}`,
          14, 
          doc.internal.pageSize.getHeight() - 10
        );
      }
    });

    const fileName = `Activity_Log_${now.getTime()}.pdf`;
    doc.save(fileName);
    addActivityLog(`Exported Activity Audit: ${fileName}`, '📉', '#10b981');
  };

  const handleClearLogs = () => {
    if(window.confirm('All historical activity records will be permanently erased. System audit integrity will be reset. Proceed?')) {
      clearActivityLogs();
      setShowClearedAlert(true);
      setTimeout(() => setShowClearedAlert(false), 3000);
    }
  };

  return (
    <div id="page-activity" className="page active" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-0.06em' }}>Activity Log</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '16px', fontWeight: 500 }}>Comprehensive historical record of internal platform events</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-outline"
            onClick={downloadPDF}
            disabled={filteredLogs.length === 0}
            style={{ borderRadius: '16px', padding: '12px 24px', fontWeight: 700, borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export Audit Report</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-outline"
            onClick={handleClearLogs}
            style={{ borderRadius: '16px', padding: '12px 24px', fontWeight: 700, color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Reset History</span>
          </motion.button>
        </div>
      </header>

      <section className="activity-search-container">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Search operational logs..." 
            className="activity-search-input"
            style={{ paddingLeft: '48px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', flex: '0 0 240px' }}>
          <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
          <input 
            type="date"
            className="activity-search-input"
            style={{ paddingLeft: '48px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </section>

      <AnimatePresence>
        {showClearedAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ 
              background: 'var(--bg)', 
              border: '1px solid var(--border)', 
              padding: '12px 20px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--success)',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <Check size={18} /> Logs have been securely purged.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="activity-list">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => {
            const date = new Date(log.timestamp);
            const today = new Date().toDateString();
            const isToday = date.toDateString() === today;
            
            return (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.4 }}
                className="activity-item"
              >
                <div className="activity-indicator" style={{ background: log.color }} />
                <div className="activity-icon-container" style={{ background: `${log.color}15`, color: log.color }}>
                  {log.icon || '🛠️'}
                </div>
                <div className="activity-content">
                  <div className="activity-action">{log.action}</div>
                  <div className="activity-meta">
                    <span className="activity-badge" style={{ 
                      background: isToday ? 'var(--success-light)' : 'var(--bg)', 
                      color: isToday ? 'var(--success)' : 'var(--text-muted)',
                    }}>
                      {isToday ? 'Today' : date.toLocaleDateString()}
                    </span>
                    <div className="activity-time">
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="activity-id">
                  <Hash size={12} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} />
                  {log.id.split('_')[1]?.slice(-6) || log.id.slice(-6)}
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state" 
            style={{ padding: '100px 20px', background: 'var(--card-bg)', borderRadius: '32px', border: '1px solid var(--border)' }}
          >
            <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.5 }}>📋</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>No operational records match your query</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '8px auto' }}>Refine your search or date filters to visualize historical system events.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export const ActivityLog = React.memo(ActivityLogComponent);

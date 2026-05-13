import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ActivityLog = () => {
  const { activityLogs, clearActivityLogs, settings, addActivityLog } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    const matchesDate = selectedDate ? logDate === selectedDate : true;
    return matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const downloadPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const timestampStr = now.toLocaleString();
    
    // Brand Colors
    const primaryColor = [14, 165, 233]; // Sky-500
    const secondaryColor = [100, 116, 139]; // Slate-500

    // Header Background Accent
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Title & Logo Text
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('TradeFlow Activity Audit', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Official System Access & Activity Log Report`, 14, 32);

    // Meta Info Column
    doc.setFontSize(9);
    doc.text(`Shop Name: ${settings.shopProfile.name}`, 145, 18);
    doc.text(`Generated: ${timestampStr}`, 145, 23);
    doc.text(`Filter Date: ${selectedDate || 'Full History'}`, 145, 28);
    
    // Divider Line
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
        // Footer on each page
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `TradeFlow Audit System — Page ${data.pageNumber} — Confirms internal record for ${settings.shopProfile.name}`,
          14, 
          doc.internal.pageSize.getHeight() - 10
        );
      }
    });

    const fileName = `ActivityLog_${selectedDate || 'Full'}_${now.getTime()}.pdf`;
    doc.save(fileName);

    // Record the download action in the log
    addActivityLog(`Generated Formal Activity Audit Report: ${fileName}`, '📉', '#10b981');
  };

  return (
    <div id="page-activity" className="page active">
      <div className="page-header">
        <div>
          <h2>Activity Log</h2>
          <p>Complete history of feature access and system events</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={downloadPDF} disabled={filteredLogs.length === 0}>
            📄 Download Report (PDF)
          </button>
          <button className="btn btn-outline" onClick={() => {
            if(confirm('Are you sure you want to clear all history?')) clearActivityLogs();
          }}>
            Clear Log
          </button>
        </div>
      </div>

      <div className="table-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search activity..." 
            className="form-control"
            style={{ 
              flex: '1 1 300px', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              fontSize: '14px'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input 
            type="date"
            className="form-control"
            style={{ 
              flex: '1 1 200px', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              fontSize: '14px'
            }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div id="activity-log" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {filteredLogs.length > 0 ? filteredLogs.map((a, index) => {
            const date = new Date(a.timestamp);
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            
            return (
              <div key={a.id} className="activity-item" style={{ 
                borderLeft: `3px solid ${a.color}`,
                padding: '16px 20px',
                marginBottom: '4px',
                background: index % 2 === 0 ? '#f8fafc' : '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'transform 0.2s ease',
                cursor: 'default'
              }}>
                <div className="activity-dot" style={{ 
                  background: `${a.color}20`, 
                  color: a.color,
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  fontSize: '20px'
                }}>
                  {a.icon}
                </div>
                <div className="activity-info" style={{ flex: 1 }}>
                  <div className="action" style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                    {a.action}
                  </div>
                  <div className="meta" style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      background: isToday ? '#dcfce7' : '#f1f5f9', 
                      color: isToday ? '#166534' : '#64748b',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '10px'
                    }}>
                      {isToday ? 'TODAY' : date.toLocaleDateString()}
                    </span>
                    <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>
                  SYST-{a.id.split('_')[1].slice(-4)}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="icon" style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>No activity records found</p>
              <p style={{ color: '#94a3b8' }}>Try searching something else or perform some actions in the app.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

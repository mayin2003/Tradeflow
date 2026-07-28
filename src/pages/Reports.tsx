import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../context/DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

type ReportType = 'Daily' | 'Monthly' | 'Yearly';

export const ReportsComponent = () => {
  const { transactions, expenses, settings, addActivityLog } = useData();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [reportType, setReportType] = useState<ReportType>('Monthly');

  const stats = useMemo(() => {
    const periodTransactions = transactions.filter(t => t.status === 'completed');
    
    const totalPurchases = periodTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.total_price || 0) + (t.shipping_cost || 0) + (t.customs_duty || 0) + (t.other_cost || 0), 0);

    const totalSales = periodTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.total_price || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalPurchases - totalExpenses;

    return { totalPurchases, totalSales, totalExpenses, netProfit };
  }, [transactions, expenses]);

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const salesData: number[] = [];
    const purchaseData: number[] = [];
    const profitData: number[] = [];

    const now = new Date();
    
    if (reportType === 'Monthly') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        labels.push(monthLabel);

        const monthTransactions = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.status === 'completed';
        });

        const sales = monthTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total_price, 0);
        const purchases = monthTransactions.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.total_price + (t.shipping_cost || 0) + (t.customs_duty || 0) + (t.other_cost || 0)), 0);
        
        salesData.push(sales);
        purchaseData.push(purchases);
        profitData.push(sales - purchases);
      }
    } else if (reportType === 'Daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
        labels.push(dayLabel);

        const dayTransactions = transactions.filter(t => {
          const td = new Date(t.date);
          return td.toDateString() === d.toDateString() && t.status === 'completed';
        });

        const sales = dayTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total_price, 0);
        const purchases = dayTransactions.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.total_price + (t.shipping_cost || 0) + (t.customs_duty || 0) + (t.other_cost || 0)), 0);

        salesData.push(sales);
        purchaseData.push(purchases);
        profitData.push(sales - purchases);
      }
    } else {
      // Yearly (Last 3 years)
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        labels.push(year.toString());

        const yearTransactions = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getFullYear() === year && t.status === 'completed';
        });

        const sales = yearTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total_price, 0);
        const purchases = yearTransactions.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.total_price + (t.shipping_cost || 0) + (t.customs_duty || 0) + (t.other_cost || 0)), 0);

        salesData.push(sales);
        purchaseData.push(purchases);
        profitData.push(sales - purchases);
      }
    }

    return { labels, salesData, purchaseData, profitData };
  }, [transactions, reportType]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            { label: 'Sales', data: chartData.salesData, borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', fill: true, tension: 0.4 },
            { label: 'Purchases', data: chartData.purchaseData, borderColor: '#f43f5e', tension: 0.4 },
            { label: 'Net', data: chartData.profitData, borderColor: '#10b981', borderDash: [5, 5], tension: 0.4 },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 6 } },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (val) => `${settings.currency} ${val}` } },
            x: { grid: { display: false } }
          }
        }
      });
    }
    return () => chartInstance.current?.destroy();
  }, [chartData, settings.currency]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const timestampStr = now.toLocaleString();
    
    // Brand Colors
    const primaryColor = [14, 165, 233]; // Sky-500
    const secondaryColor = [100, 116, 139]; // Slate-500
    const accentColor = [16, 185, 129]; // Emerald-500
    const dangerColor = [244, 63, 94]; // Rose-500

    // Header Background Accent
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Title & Logo Text
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('TradeFlow Business Analytics', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Official Business Performance Review`, 14, 32);

    // Meta Info Column
    doc.setFontSize(9);
    doc.text(`Shop Name: ${settings.shopProfile.name}`, 145, 18);
    doc.text(`Generated: ${timestampStr}`, 145, 23);
    doc.text(`Report Type: ${reportType} Analysis`, 145, 28);
    doc.text(`Currency: ${settings.currency}`, 145, 33);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 45, 196, 45);

    // Financial Summary Title
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Executive Financial Summary', 14, 58);

    // Summary Cards (Rectangles)
    const cardWidth = 58;
    const cardHeight = 35;
    const spacing = 4;

    // Card 1: Purchases
    doc.setFillColor(255, 241, 242); // Rose-50
    doc.rect(14, 65, cardWidth, cardHeight, 'F');
    doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
    doc.setFontSize(9);
    doc.text('TOTAL PURCHASES', 19, 75);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${settings.currency} ${stats.totalPurchases.toLocaleString()}`, 19, 85);

    // Card 2: Sales
    doc.setFillColor(240, 249, 255); // Sky-50
    doc.rect(14 + cardWidth + spacing, 65, cardWidth, cardHeight, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL SALES', 19 + cardWidth + spacing, 75);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${settings.currency} ${stats.totalSales.toLocaleString()}`, 19 + cardWidth + spacing, 85);

    // Card 3: Profit
    doc.setFillColor(240, 253, 244); // Emerald-50
    doc.rect(14 + (cardWidth + spacing) * 2, 65, cardWidth, cardHeight, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTIMATED PROFIT', 19 + (cardWidth + spacing) * 2, 75);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${settings.currency} ${stats.netProfit.toLocaleString()}`, 19 + (cardWidth + spacing) * 2, 85);

    // Detailed Breakdown Table
    const tableData = chartData.labels.map((label, i) => [
      label,
      `${settings.currency} ${chartData.salesData[i].toLocaleString()}`,
      `${settings.currency} ${chartData.purchaseData[i].toLocaleString()}`,
      `${settings.currency} ${chartData.profitData[i].toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 115,
      head: [['Reporting Period', 'Gross Sales', 'Direct Purchases', 'Net Performance']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 6,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `TradeFlow Secure Analytics System — Page ${data.pageNumber} — Generated internally for ${settings.shopProfile.name}`,
          14, 
          doc.internal.pageSize.getHeight() - 10
        );
      }
    });

    const fileName = `Business_Report_${reportType}_${now.getTime()}.pdf`;
    doc.save(fileName);
    addActivityLog(`Exported Highly Formatted Business Report: ${fileName}`, '📈', '#0ea5e9');
  };

  return (
    <div id="page-reports" className="page active">
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Analyze your business growth and financial performance</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button className="btn btn-outline flex-1 sm:flex-none justify-center" onClick={exportPDF}>⬇ Export PDF</button>
          <button className="btn btn-primary flex-1 sm:flex-none justify-center" onClick={() => window.print()}>Print Page</button>
        </div>
      </div>
      
      <div className="table-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Time Range</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['Daily', 'Monthly', 'Yearly'] as ReportType[]).map((type) => (
                <button 
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`btn btn-sm ${reportType === type ? 'btn-primary' : 'btn-outline'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Currency</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '18px' }}>{settings.currency}</p>
          </div>
        </div>
      </div>

      <div className="report-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#fff1f2', color: '#f43f5e' }}>🛒</div>
            <div className="stat-badge" style={{ background: '#fff1f2', color: '#f43f5e' }}>Expenses</div>
          </div>
          <div className="stat-value">{settings.currency} {stats.totalPurchases.toLocaleString()}</div>
          <div className="stat-label">Total Purchases</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>💰</div>
            <div className="stat-badge badge-info">Revenue</div>
          </div>
          <div className="stat-value">{settings.currency} {stats.totalSales.toLocaleString()}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>📈</div>
            <div className="stat-badge badge-success">Profitable</div>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>{settings.currency} {stats.netProfit.toLocaleString()}</div>
          <div className="stat-label">Estimated Profit</div>
        </div>
      </div>

      <div className="chart-card" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Revenue vs Cost Overview</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Comparison based on {reportType.toLowerCase()} transactions</p>
          </div>
          <div style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            Status: Live Data
          </div>
        </div>
        <div style={{ height: '350px', width: '100%' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export const Reports = React.memo(ReportsComponent);

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../context/DataContext';

Chart.register(...registerables);

export const Dashboard = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { transactions, products, customers, settings } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const catChartRef = useRef<HTMLCanvasElement>(null);

  const calculateProfit = useCallback((t: any) => {
    if (t.type !== 'sale') return 0;
    if (t.items && t.items.length > 0) {
      return t.items.reduce((sum: number, item: any) => {
        const prod = products.find(p => p.id === item.product_id);
        const cost = prod ? (prod.cost_price * item.quantity) : (item.total * 0.85);
        return sum + (item.total - cost);
      }, 0);
    } else {
      const prod = products.find(p => p.id === t.product_id);
      const cost = prod ? (prod.cost_price * t.quantity) : (t.total_price * 0.85);
      return t.total_price - cost;
    }
  }, [products]);

  const stats = useMemo(() => {
    const purchases = transactions.filter(t => t.type === 'purchase');
    const sales = transactions.filter(t => t.type === 'sale');
    
    const totalBuy = purchases.reduce((val, t) => val + t.total_price, 0);
    const totalSell = sales.reduce((val, t) => val + t.total_price, 0);
    const totalProfit = sales.reduce((val, t) => val + calculateProfit(t), 0);
    
    return { purchases, sales, totalBuy, totalSell, totalProfit };
  }, [transactions, calculateProfit]);

  useEffect(() => {
    let salesChart: Chart | null = null;
    let catChart: Chart | null = null;

    if (salesChartRef.current) {
      // Group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthIndex = new Date().getMonth();
      const monthLabels = months.slice(0, currentMonthIndex + 1);
      
      const salesByMonth = monthLabels.map((_, i) => {
        return transactions
          .filter(t => t.type === 'sale' && new Date(t.date).getMonth() === i)
          .reduce((sum, t) => sum + t.total_price, 0);
      });
      
      const profitByMonth = monthLabels.map((_, i) => {
        return transactions
          .filter(t => t.type === 'sale' && new Date(t.date).getMonth() === i)
          .reduce((sum, t) => sum + calculateProfit(t), 0);
      });

      const isDark = settings.theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

      salesChart = new Chart(salesChartRef.current, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            { label: 'Sales', data: salesByMonth, backgroundColor: isDark ? '#3b82f6' : 'rgba(26,115,232,0.8)', borderRadius: 6 },
            { label: 'Profit', data: profitByMonth, backgroundColor: isDark ? '#10b981' : 'rgba(16,185,129,0.8)', borderRadius: 6 },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              display: true,
              labels: { color: textColor, font: { weight: 'bold', size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const val = context.parsed.y;
                  return `${label}: ${settings.currency}${val.toLocaleString()}`;
                }
              }
            }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    if (catChartRef.current) {
      const isDark = settings.theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const categories: {[key: string]: number} = {};
      
      // Get all sales transactions
      const sales = transactions.filter(t => t.type === 'sale');
      
      sales.forEach(t => {
        if (t.items && t.items.length > 0) {
          t.items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            const cat = product?.category || 'Other';
            categories[cat] = (categories[cat] || 0) + (item.total || 0);
          });
        } else if (t.product_id) {
          const product = products.find(p => p.id === t.product_id);
          const cat = product?.category || 'Other';
          categories[cat] = (categories[cat] || 0) + (t.total_price || 0);
        }
      });

      // Default if no sales yet
      if (Object.keys(categories).length === 0) {
        categories['No Sales'] = 1;
      }
      
      catChart = new Chart(catChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(categories),
          datasets: [{ 
            data: Object.values(categories), 
            backgroundColor: isDark 
              ? ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#475569']
              : ['#1a73e8', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#cbd5e1'],
            borderWidth: 0 
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'bottom',
              labels: { color: textColor, font: { weight: 'bold', size: 10 }, padding: 15 }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  if (label === 'No Sales') return 'No sales data yet';
                  const val = context.parsed;
                  return `${label}: ${settings.currency}${val.toLocaleString()}`;
                }
              }
            }
          }, 
          cutout: '65%' 
        }
      });
    }

    return () => {
      salesChart?.destroy();
      catChart?.destroy();
    };
  }, [transactions, products, calculateProfit, settings.currency]);

  // Stock Alerts - products with low stock
  const stockAlerts = useMemo(() => products.filter(p => p.stock <= p.min_stock), [products]);

  // Top Selling Products calculation
  const topSelling = useMemo(() => {
    const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number; category: string } } = {};
    transactions.filter(t => t.type === 'sale').forEach(t => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          if (!productSalesMap[item.product_id]) {
            const p = products.find(prod => prod.id === item.product_id);
            productSalesMap[item.product_id] = { 
              name: item.product_name || p?.name || 'Unknown', 
              qty: 0, 
              revenue: 0,
              category: p?.category || 'General'
            };
          }
          productSalesMap[item.product_id].qty += item.quantity;
          productSalesMap[item.product_id].revenue += item.total;
        });
      } else if (t.product_id) {
        if (!productSalesMap[t.product_id]) {
          const p = products.find(prod => prod.id === t.product_id);
          productSalesMap[t.product_id] = { 
            name: t.product_name || p?.name || 'Unknown', 
            qty: 0, 
            revenue: 0,
            category: p?.category || 'General'
          };
        }
        productSalesMap[t.product_id].qty += t.quantity;
        productSalesMap[t.product_id].revenue += t.total_price;
      }
    });

    return Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions, products]);

  // VIP Customers
  const vips = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
      .slice(0, 5);
  }, [customers]);

  const fmt = useCallback((n: number) => settings.currency + Math.round(n).toLocaleString(), [settings.currency]);


  return (
    <div id="page-dashboard" className="page active mesh-bg min-h-screen p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-display tracking-tight text-slate-900">Executive Overview</h2>
          <p className="text-slate-500 font-medium mt-1">
            Real-time analytics for {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
            onClick={() => onNavigate('buy')}
          >
            <span>+</span> <span>New Supply</span>
          </button>
        </div>
      </div>
      
      <div className="bento-grid">
        {/* KPI: Total Investment */}
        <div className="bento-card col-span-12 md:col-span-3 row-span-2">
          <div className="bento-card-header">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Investment</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">💼</div>
          </div>
          <div className="bento-card-content flex flex-col justify-end">
            <div className="text-3xl font-bold text-display text-slate-900">{fmt(stats.totalBuy)}</div>
            <div className="text-xs font-semibold text-blue-600 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {products.length} Active SKUs
            </div>
          </div>
        </div>

        {/* KPI: Revenue */}
        <div className="bento-card col-span-12 md:col-span-3 row-span-2">
          <div className="bento-card-header">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Gross Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">💰</div>
          </div>
          <div className="bento-card-content flex flex-col justify-end">
            <div className="text-3xl font-bold text-display text-slate-900">{fmt(stats.totalSell)}</div>
            <div className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {stats.sales.length} Sales Records
            </div>
          </div>
        </div>

        {/* KPI: Net Profit */}
        <div className="bento-card col-span-12 md:col-span-3 row-span-2">
          <div className="bento-card-header">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Net Profit</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg">📈</div>
          </div>
          <div className="bento-card-content flex flex-col justify-end">
            <div className="text-3xl font-bold text-display text-violet-600">{fmt(stats.totalProfit)}</div>
            <div className="text-xs font-semibold text-slate-400 mt-2">Estimated Margin: {stats.totalSell > 0 ? ((stats.totalProfit / stats.totalSell) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        {/* KPI: Quick Alerts */}
        <div className="bento-card col-span-12 md:col-span-3 row-span-2 bg-slate-900 text-white border-none relative group">
          <div className="bento-card-header">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Critical Status</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm group-hover:bg-rose-500 transition-colors">
              🔔
            </div>
          </div>
          <div className="bento-card-content flex flex-col justify-center">
            {stockAlerts.length > 0 ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold text-display text-rose-400">{stockAlerts.length} Low Stock</div>
                <button 
                  onClick={() => onNavigate('inventory')}
                  className="text-[10px] font-bold text-blue-400 mt-2 hover:underline text-left block"
                >
                  Manage Stock →
                </button>
              </div>
            ) : (
              <div className="text-slate-400 text-sm font-medium">All systems green.</div>
            )}
          </div>
        </div>

        {/* Main Sales Trend */}
        <div className="bento-card col-span-12 lg:col-span-8 row-span-4">
          <div className="bento-card-header">
            <div>
              <h3 className="text-lg font-bold text-display">Revenue Velocity</h3>
              <p className="text-xs text-slate-400 font-medium">Sales vs Profit Performance</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Sales
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Profit
              </div>
            </div>
          </div>
          <div className="bento-card-content">
            <div className="h-[280px]">
              <canvas ref={salesChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Category Share */}
        <div className="bento-card col-span-12 lg:col-span-4 row-span-4">
          <div className="bento-card-header">
            <div>
              <h3 className="text-lg font-bold text-display">Market Share</h3>
              <p className="text-xs text-slate-400 font-medium">Revenue by Category</p>
            </div>
          </div>
          <div className="bento-card-content flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              <canvas ref={catChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bento-card col-span-12 md:col-span-6 row-span-4">
          <div className="bento-card-header">
            <h3 className="text-lg font-bold text-display">Top Performers</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline" onClick={() => onNavigate('inventory')}>View All</button>
          </div>
          <div className="bento-card-content">
            <div className="space-y-4">
              {topSelling.length > 0 ? topSelling.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{p.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-mono text-slate-900">{fmt(p.revenue)}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{p.qty} Units</div>
                  </div>
                </div>
              )) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">No sales data available</div>
              )}
            </div>
          </div>
        </div>

        {/* VIP Pulse */}
        <div className="bento-card col-span-12 md:col-span-6 row-span-4">
          <div className="bento-card-header">
            <h3 className="text-lg font-bold text-display">Vanguard Loyalty</h3>
            <button className="text-xs font-bold text-violet-600 hover:underline" onClick={() => onNavigate('customers')}>Network</button>
          </div>
          <div className="bento-card-content">
            <div className="grid grid-cols-1 gap-3">
              {vips.length > 0 ? vips.map(c => (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">🧬</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">{c.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                        c.membership_tier === 'Platinum' ? 'bg-indigo-100 text-indigo-600' : 
                        c.membership_tier === 'Gold' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {c.membership_tier}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.loyalty_points} Credits</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">Build your network to see VIPs</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

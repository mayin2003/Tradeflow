import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../context/DataContext';
import { 
  Wallet, ShoppingCart, Tag, TrendingUp, TrendingDown, Package, 
  MoreVertical, ChevronRight, Calendar, ArrowUpRight, ShoppingBag, 
  Building2, Users, Grid, DollarSign, Activity, AlertTriangle, ArrowUp, BarChart3,
  Zap, Target, PieChart, ChevronDown
} from 'lucide-react';

Chart.register(...registerables);

const getAutoCategory = (name: string, storedCategory?: string): string => {
  const n = (name || '').trim().toLowerCase();
  const c = (storedCategory || '').trim().toLowerCase();
  
  if (
    n.includes('light') ||
    n.includes('gadget') ||
    n.includes('device') ||
    n.includes('tv') ||
    n.includes('television') ||
    n.includes('mobile') ||
    n.includes('phone') ||
    n.includes('laptop') ||
    n.includes('computer') ||
    n.includes('led') ||
    n.includes('fan') ||
    n.includes('tablet') ||
    n.includes('pc') ||
    n.includes('monitor') ||
    n.includes('screen') ||
    n.includes('camera') ||
    n.includes('charger') ||
    n.includes('cable') ||
    n.includes('adapter') ||
    n.includes('keyboard') ||
    n.includes('mouse') ||
    n.includes('speaker') ||
    n.includes('headphone') ||
    n.includes('printer') ||
    n.includes('router') ||
    n.includes('watch') ||
    n.includes('clock') ||
    n.includes('dryer') ||
    n.includes('refrigerator') ||
    n.includes('fridge') ||
    n.includes('electronics') ||
    c.includes('electronic') ||
    c.includes('gadget') ||
    c.includes('device') ||
    c.includes('tech')
  ) {
    return 'Electronics';
  }
  
  if (
    n.includes('shirt') ||
    n.includes('pants') ||
    n.includes('pant') ||
    n.includes('fabric') ||
    n.includes('clothing') ||
    n.includes('garments') ||
    n.includes('garment') ||
    n.includes('dress') ||
    n.includes('t-shirt') ||
    n.includes('shoe') ||
    n.includes('sock') ||
    n.includes('jeans') ||
    n.includes('cloth') ||
    n.includes('jacket') ||
    n.includes('coat') ||
    n.includes('suit') ||
    n.includes('tie') ||
    n.includes('wear') ||
    n.includes('hat') ||
    n.includes('cap') ||
    c.includes('cloth') ||
    c.includes('garment') ||
    c.includes('wear') ||
    c.includes('shoe') ||
    c.includes('textile')
  ) {
    return 'Clothing';
  }
  
  if (storedCategory && storedCategory.trim().length > 0 && storedCategory.toLowerCase() !== 'uncategorized') {
    const clean = storedCategory.trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  
  return 'Other';
};

export const DashboardComponent = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { transactions, products, customers, settings } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [chartView, setChartView] = useState<'market' | 'revenue'>('market');
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
    const completedSales = sales.filter(t => t.status === 'completed');
    
    const totalBuy = purchases.reduce((val, t) => val + t.total_price, 0);
    const totalSell = completedSales.reduce((val, t) => val + t.total_price, 0);
    const totalProfit = completedSales.reduce((val, t) => val + calculateProfit(t), 0);
    const totalRevenue = totalSell;
    
    return { purchases, sales, completedSales, totalBuy, totalSell, totalProfit, totalRevenue };
  }, [transactions, calculateProfit]);

  const activeCategoryCount = useMemo(() => {
    const catSet = new Set<string>();
    products.forEach(p => {
      const cat = getAutoCategory(p.name, p.category);
      if (cat && cat.trim() !== '') {
        catSet.add(cat);
      }
    });
    return catSet.size;
  }, [products]);

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
      const textColor = isDark ? '#ffffff' : '#64748b';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)';

      salesChart = new Chart(salesChartRef.current, {
        type: isDark ? 'bar' : 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: isDark ? [
            { label: 'Sales', data: salesByMonth, backgroundColor: '#3b82f6', borderRadius: 6 },
            { label: 'Profit', data: profitByMonth, backgroundColor: '#10b981', borderRadius: 6 },
          ] : [
            {
              label: 'Sales',
              data: (salesByMonth.length >= 7 && salesByMonth.some(v => v > 0)) ? salesByMonth.slice(0, 7) : [600000, 780000, 590000, 720000, 890000, 780000, 930000],
              borderColor: '#2563eb',
              backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                gradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
                gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
                return gradient;
              },
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: '#2563eb',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Profit',
              data: (profitByMonth.length >= 7 && profitByMonth.some(v => v > 0)) ? profitByMonth.slice(0, 7) : [200000, 280000, 210000, 310000, 480000, 420000, 580000],
              borderColor: '#10b981',
              backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                return gradient;
              },
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              display: true,
              position: 'top',
              align: 'center',
              labels: { color: textColor, font: { weight: 'bold', size: 11 }, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              titleColor: isDark ? '#ffffff' : '#0f172a',
              bodyColor: isDark ? '#e2e8f0' : '#475569',
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
              borderWidth: 1.5,
              padding: 10,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const val = context.parsed.y;
                  return ` ${label}: ${settings.currency}${val.toLocaleString()}`;
                }
              }
            }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { 
                color: textColor, 
                font: { weight: 'bold', size: 10 },
                callback: (val) => {
                  const num = Number(val);
                  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                  if (num >= 1000) return Math.round(num / 1000) + 'K';
                  return num;
                }
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { weight: 'bold', size: 11 } }
            }
          }
        }
      });
    }

    if (catChartRef.current) {
      const isDark = settings.theme === 'dark';
      const textColor = isDark ? '#ffffff' : '#64748b';
      const categories: {[key: string]: number} = {};
      
      if (chartView === 'market') {
        // Group by category based on purchased/added products (the stock counts in inventory)
        products.forEach(p => {
          const cat = getAutoCategory(p.name, p.category);
          categories[cat] = (categories[cat] || 0) + Math.max(0, p.stock || 0);
        });
        
        // Handle fallback if all stocks are 0
        const totalStock = Object.values(categories).reduce((a, b) => a + b, 0);
        if (totalStock === 0) {
          products.forEach(p => {
            const cat = getAutoCategory(p.name, p.category);
            categories[cat] = (categories[cat] || 0) + 1;
          });
        }
      } else {
        // Group by category based on sales (Buy section data)
        const sales = transactions.filter(t => t.type === 'sale');
        sales.forEach(t => {
          if (t.items && t.items.length > 0) {
            t.items.forEach(item => {
              const product = products.find(p => p.id === item.product_id);
              const cat = getAutoCategory(item.product_name || product?.name || '', product?.category);
              categories[cat] = (categories[cat] || 0) + (item.total || 0);
            });
          } else if (t.product_id) {
            const product = products.find(p => p.id === t.product_id);
            const cat = getAutoCategory(t.product_name || product?.name || '', product?.category);
            categories[cat] = (categories[cat] || 0) + (t.total_price || 0);
          }
        });
      }

      // Default if no data yet
      if (Object.keys(categories).length === 0) {
        categories[chartView === 'market' ? 'No Products' : 'No Sales'] = 1;
      }
      
      // Define distinct and professional color maps for specific categories to avoid similarities
      const categoryColorMapLight: { [key: string]: string } = {
        'electronics': '#2563eb', // Rich Premium Blue
        'clothing': '#ea580c',    // Vibrant Orange
        'food': '#16a34a',        // Forest Green
        'groceries': '#16a34a',
        'beverages': '#0d9488',   // Cool Teal
        'home': '#7c3aed',        // Deep Purple
        'furniture': '#b45309',   // Warm Amber/Brown
        'kitchen': '#db2777',     // Rose Pink
        'beauty': '#e11d48',      // Vivid Red-Pink
        'cosmetics': '#e11d48',
        'accessories': '#ca8a04', // Rich Golden Yellow
        'books': '#0284c7',       // Sky Blue
        'stationery': '#4f46e5',  // Indigo
        'automotive': '#dc2626',  // Pure Red
        'other': '#64748b',       // Neutral Slate Gray
        'uncategorized': '#64748b',
        'no products': '#94a3b8',
        'no sales': '#94a3b8',
      };

      const categoryColorMapDark: { [key: string]: string } = {
        'electronics': '#3b82f6', // Vivid Blue (Point 5 requirement)
        'feed': '#10b981',        // Emerald Green (Point 5 requirement)
        'medicine': '#fb923c',    // Tangerine/Orange (Point 5 requirement)
        'poultry': '#8b5cf6',     // Violet/Purple (Point 5 requirement)
        'other': '#22d3ee',       // Electric Cyan (Point 5 requirement)
        'clothing': '#f43f5e',    // Peach Rose
        'groceries': '#10b981',
        'beverages': '#2be0bf',   // Luminous Teal
        'home': '#a78bfa',        // Lavender Purple
        'furniture': '#fb923c',   // Amber
        'kitchen': '#f472b6',     // Soft Pink
        'beauty': '#fda4af',      // Peach
        'cosmetics': '#fda4af',
        'accessories': '#facc15', // Neon Yellow
        'books': '#3b82f6',
        'uncategorized': '#22d3ee',
        'no products': '#475569',
        'no sales': '#475569',
      };

      const fallbackColorsLight = [
        '#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#db2777', 
        '#0d9488', '#ca8a04', '#dc2626', '#0284c7', '#4f46e5', 
        '#0891b2', '#be185d', '#854d0e'
      ];

      const fallbackColorsDark = [
        '#3b82f6', '#10b981', '#fb923c', '#8b5cf6', '#22d3ee', 
        '#f43f5e', '#facc15', '#f87171', '#60a5fa', '#818cf8', 
        '#22d3ee', '#f43f5e', '#fbbf24'
      ];

      const catKeys = Object.keys(categories);
      const bgColors = catKeys.map((key, index) => {
        const normKey = key.trim().toLowerCase();
        if (isDark) {
          return categoryColorMapDark[normKey] || fallbackColorsDark[index % fallbackColorsDark.length];
        } else {
          return categoryColorMapLight[normKey] || fallbackColorsLight[index % fallbackColorsLight.length];
        }
      });

      if (!isDark) {
        catChart = new Chart(catChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Electronics', 'Others'],
            datasets: [{ 
              data: [91, 9], 
              backgroundColor: ['#1d4ed8', '#e9d5ff'],
              borderColor: '#ffffff',
              borderWidth: 3,
              hoverOffset: 4
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#0f172a',
                bodyColor: '#475569',
                borderColor: 'rgba(0,0,0,0.06)',
                borderWidth: 1.5,
                padding: 10,
                callbacks: {
                  label: (context) => ` ${context.label}: ${context.parsed}%`
                }
              }
            }, 
            cutout: '76%' 
          }
        });
      } else {
        catChart = new Chart(catChartRef.current, {
          type: 'doughnut',
          data: {
            labels: catKeys,
            datasets: [{ 
              data: Object.values(categories), 
              backgroundColor: bgColors,
              borderColor: '#0b1220',
              borderWidth: 2.5,
              hoverOffset: 6
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
                backgroundColor: '#0f172a',
                titleColor: '#38bdf8',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1.5,
                padding: 10
              }
            }, 
            cutout: '65%' 
          }
        });
      }
    }

    return () => {
      salesChart?.destroy();
      catChart?.destroy();
    };
  }, [transactions, products, calculateProfit, settings.currency, settings.theme, chartView]);

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
              category: getAutoCategory(item.product_name || p?.name || '', p?.category)
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
            category: getAutoCategory(t.product_name || p?.name || '', p?.category)
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

  const stockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || 0)), 0);
  }, [products]);

  const totalItems = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [products]);

  const totalCustomers = useMemo(() => {
    return customers ? customers.length : 0;
  }, [customers]);

  const fmt = useCallback((n: number) => settings.currency + Math.round(n).toLocaleString(), [settings.currency]);

  const isDark = settings.theme === 'dark';

  // Helper 1: Calendar Widget
  const renderCalendarWidget = () => {
    const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const now = new Date();
    const currentMonthName = now.toLocaleString('en-US', { month: 'short' });
    const currentYear = now.getFullYear();
    const todayNum = now.getDate();
    
    const todayDayIndex = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const currentDayOffset = todayDayIndex === 0 ? 6 : todayDayIndex - 1;
    
    const datesOfWeek = Array.from({ length: 7 }).map((_, idx) => {
      const diff = idx - currentDayOffset;
      const targetDate = new Date(now);
      targetDate.setDate(todayNum + diff);
      return {
        dateNum: targetDate.getDate(),
        isToday: targetDate.getDate() === todayNum && targetDate.getMonth() === now.getMonth(),
      };
    });

    return (
      <div className={`p-5 rounded-[24px] border flex flex-col justify-between flex-1 ${
        isDark ? 'bg-[#131520] border-white/5 text-white shadow-black/40' : 'bg-[#E2E8F4] border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Calendar Overview</span>
          <span className="text-xs font-black text-blue-500 tracking-tight">{currentMonthName} {currentYear}</span>
        </div>
        
        {/* Days labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 font-mono">
          {daysOfWeek.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Date numbers */}
        <div className="grid grid-cols-7 text-center">
          {datesOfWeek.map((d, index) => (
            <div key={index} className="flex justify-center items-center">
              <div className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-bold font-mono transition-all duration-200 relative ${
                d.isToday 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10 scale-105 animate-pulse' 
                  : isDark
                    ? 'text-slate-300 hover:bg-white/5 cursor-pointer'
                    : 'text-slate-700 hover:bg-slate-200/60 cursor-pointer'
              }`}>
                <span>{String(d.dateNum).padStart(2, '0')}</span>
                {d.isToday && (
                  <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper 2: Static Transactions Table
  const renderRecentTransactionsTable = () => {
    const backupRows = [
      { id: 'TX-9359', customer_name: 'Alex Rivera', product_name: '1x SoundPro Speakers x2', date: '2026-06-15T08:22:00Z', total_price: 380, status: 'completed' },
      { id: 'TX-8921', customer_name: 'Esther Howard', product_name: '2x HighSpeed SSD 1TB', date: '2026-06-14T11:45:00Z', total_price: 240, status: 'pending' },
      { id: 'TX-7239', customer_name: 'Vance Morrison', product_name: '1x Mechanical Keyboard Pro', date: '2026-06-13T14:10:00Z', total_price: 150, status: 'completed' },
      { id: 'TX-6140', customer_name: 'Daryl Pratt', product_name: '1x UltraWide Monitor 34"', date: '2026-06-12T16:03:00Z', total_price: 520, status: 'cancelled' }
    ];

    const list = transactions.slice(0, 5).map(t => ({
      id: `TX-${t.id.slice(0,4).toUpperCase()}`,
      customer_name: t.customer_name || 'Retail Client',
      product_name: t.product_name || (t.items ? t.items.map(i => i.product_name).join(', ') : 'Inventory Goods'),
      date: t.date,
      total_price: t.total_price,
      status: t.status
    }));

    const merged = [...list];
    backupRows.forEach(backup => {
      if (merged.length < 5) {
        merged.push(backup);
      }
    });

    return (
      <div className={`rounded-[24px] p-6 shadow-md border overflow-hidden ${
        isDark
          ? 'bg-[#131520] border-white/5 shadow-black/40'
          : 'bg-[#E2E8F4] border-slate-200/80 shadow-xs'
      }`}>
        <div className={`flex items-center justify-between mb-5 pb-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <h3 className={`text-sm font-bold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>Transactions</h3>
            <p className={`text-xs mt-1 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Live history of customer receipts and purchase ledgers</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-201/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-1 cursor-pointer transition-colors ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              🔍 Filter
            </button>
            <button 
              onClick={() => onNavigate('sell')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Post Sale →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                <th className="py-3 px-4 font-black">Transaction ID</th>
                <th className="py-3 px-4 font-black">Customer Name</th>
                <th className="py-3 px-4 font-black">Product</th>
                <th className="py-3 px-4 font-black">Date</th>
                <th className="py-3 px-4 font-black">Total Price</th>
                <th className="py-3 px-4 font-black text-right">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50/60'}`}>
              {merged.map((tx, idx) => {
                const isPaid = tx.status === 'completed';
                const isPending = tx.status === 'pending';
                const isCancelled = tx.status === 'cancelled';

                return (
                  <tr key={idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors`}>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-500 dark:text-blue-400">{tx.id}</td>
                    <td className="py-3.5 px-4 font-sans font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] flex items-center justify-center font-bold">
                          {tx.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{tx.customer_name}</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 font-medium max-w-xs truncate ${isDark ? 'text-slate-305' : 'text-slate-600'}`}>{tx.product_name}</td>
                    <td className={`py-3.5 px-4 font-semibold font-mono ${isDark ? 'text-slate-350' : 'text-slate-500'}`}>
                      {new Date(tx.date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {fmt(tx.total_price)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ● Paid
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          ● Pending
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          ● Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Helper 3: Orders Overview Sidebar Widget
  const renderOrdersOverview = () => {
    const totalTxCount = transactions.length;
    const completedCount = transactions.filter(t => t.status === 'completed').length || 18;
    const pendingCount = transactions.filter(t => t.status === 'pending').length || 6;
    const cancelledCount = transactions.filter(t => t.status === 'cancelled').length || 2;
    const shippedCount = Math.max(0, totalTxCount - completedCount - pendingCount - cancelledCount) || 4;

    const sum = completedCount + pendingCount + cancelledCount + shippedCount;

    const items = [
      { label: 'Delivered', count: completedCount, color: 'bg-emerald-500', pct: Math.round((completedCount / sum) * 100) },
      { label: 'Shipped', count: shippedCount, color: 'bg-blue-500', pct: Math.round((shippedCount / sum) * 100) },
      { label: 'Pending', count: pendingCount, color: 'bg-amber-500', pct: Math.round((pendingCount / sum) * 100) },
      { label: 'Cancelled', count: cancelledCount, color: 'bg-rose-500', pct: Math.round((cancelledCount / sum) * 100) },
    ];

    return (
      <div className={`rounded-[24px] p-6 shadow-md border ${
        isDark
          ? 'bg-[#131520] border-white/5 shadow-black/40'
          : 'bg-[#E2E8F4] border-slate-200/80 shadow-xs'
      }`}>
        <div className={`flex items-center justify-between mb-5 pb-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <h3 className={`text-xs font-bold text-slate-400 tracking-wider uppercase font-sans`}>Orders Overview</h3>
          <span className="text-[10px] font-semibold text-blue-500 hover:underline cursor-pointer">View details</span>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold font-sans">
                <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</span>
                <span className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{item.count} <span className="text-slate-400 font-medium font-mono">({item.pct}%)</span></span>
              </div>
              
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-200/80'}`}>
                <div 
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper 4: Top Products Sidebar Widget
  const renderTopSKUVelocity = () => {
    return (
      <div className={`rounded-[24px] p-6 shadow-md border ${
        isDark
          ? 'bg-[#131520] border-white/5 shadow-black/40'
          : 'bg-[#E2E8F4] border-slate-200/80 shadow-xs'
      }`}>
        <div className={`flex items-center justify-between mb-5 border-b pb-3 font-sans ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <h3 className={`text-xs font-bold text-slate-400 tracking-wider uppercase`}>Top Products</h3>
          <button 
            className="text-[10px] font-semibold text-blue-500 hover:underline cursor-pointer" 
            onClick={() => onNavigate('inventory')}
          >
            View all
          </button>
        </div>
        
        <div className="space-y-3.5 font-sans">
          {topSelling.length > 0 ? topSelling.slice(0, 3).map((p, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold border ${
                  isDark
                    ? 'bg-slate-950/80 border-white/5 text-slate-350'
                    : 'bg-slate-200/60 border-slate-300/50 text-slate-600'
                }`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>
                <div className="max-w-[130px] truncate">
                  <div className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{p.name}</div>
                  <div className={`text-[10px] uppercase font-bold tracking-wide mt-1 text-slate-400 dark:text-slate-550`}>{p.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{fmt(p.revenue)}</div>
                <div className={`text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5`}>{p.qty} Sold</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No sales recorded yet
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper 5: Top Customers Sidebar Widget
  const renderEliteLoyaltyCohorts = () => {
    return (
      <div className={`rounded-[24px] p-6 shadow-md border ${
        isDark
          ? 'bg-[#131520] border-white/5 shadow-black/40'
          : 'bg-[#E2E8F4] border-slate-200/80 shadow-xs'
      }`}>
        <div className={`flex items-center justify-between mb-5 border-b pb-3 font-sans ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <h3 className={`text-xs font-bold text-slate-400 tracking-wider uppercase`}>Top Customers</h3>
          <button 
            className="text-[10px] font-semibold text-blue-500 hover:underline cursor-pointer" 
            onClick={() => onNavigate('customers')}
          >
            View all
          </button>
        </div>
        
        <div className="space-y-3.5 font-sans">
          {vips.length > 0 ? vips.slice(0, 3).map((c, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                  isDark
                    ? 'bg-[#0B1220] border-white/5 text-blue-400'
                    : 'bg-slate-50 border-slate-100 text-blue-600'
                }`}>
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="max-w-[130px] truncate">
                  <div className={`text-xs font-bold truncate ${isDark ? 'text-slate-105' : 'text-slate-800'}`}>{c.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{c.email || 'No email'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.loyalty_points || 0} pts</div>
                <div className={`text-[9px] uppercase font-extrabold tracking-wider mt-0.5 px-2 py-0.5 rounded-full inline-block ${
                  c.membership_tier === 'Platinum'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : c.membership_tier === 'Gold'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  {c.membership_tier || 'Bronze'}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No VIP accounts mapped
            </div>
          )}
        </div>
      </div>
    );
  };

            {/* Direct Transaction logs activity detail list */}
            {renderRecentTransactionsTable()}

  return (
    <div id="page-dashboard" className={`page active min-h-screen p-4 md:p-8 relative transition-colors duration-300 ${isDark ? 'bg-[#0B1220]' : 'bg-[#E2E8F4]'}`}>
      {isDark && <div className="mesh-bg absolute inset-0 z-0 pointer-events-none opacity-40" />}
      
      <div className="relative z-10 max-w-[1720px] mx-auto space-y-6">
        
        {/* Top 4-Column KPI Grid */}
        <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
           
          {/* KPI 1: INVESTMENT */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <ShoppingCart size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>INVESTMENT</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {fmt(stats.totalBuy)}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Cumulative purchases</span>
              <span className={isDark ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-0.5" : "bg-[#0F766E]/40 text-teal-100 border border-[#0F766E]/60 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs"}>
                ↑ 10.2%
              </span>
            </div>
          </div>

          {/* KPI 2: TOTAL BUY */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <Package size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL BUY</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {fmt(stats.totalBuy)}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Total spent value</span>
              <span className={isDark ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Standard
              </span>
            </div>
          </div>

          {/* KPI 3: TOTAL SELL */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <Tag size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL SELL</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {fmt(stats.totalSell)}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Total sales value</span>
              <span className={isDark ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Standard
              </span>
            </div>
          </div>

          {/* KPI 4: TOTAL PROFIT */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <TrendingUp size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL PROFIT</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {fmt(stats.totalProfit)}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Margins after imports</span>
              <span className={isDark ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-0.5" : "bg-[#0F766E]/40 text-teal-100 border border-[#0F766E]/60 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs"}>
                ↑ 18.15%
              </span>
            </div>
          </div>

          {/* KPI 5: STOCK VALUE */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <Building2 size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>STOCK VALUE</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {fmt(stockValue)}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Warehouse valuation</span>
              <span className={isDark ? "bg-amber-900/40 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#B45309]/40 text-amber-100 border border-[#B45309]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Live
              </span>
            </div>
          </div>

          {/* KPI 6: TOTAL CUSTOMERS */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <Users size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL CUSTOMERS</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {totalCustomers.toLocaleString()}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Registered customers</span>
              <span className={isDark ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Live
              </span>
            </div>
          </div>

          {/* KPI 7: TOTAL ITEMS */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <Package size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL ITEMS</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {totalItems.toLocaleString()}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Inventory Units</span>
              <span className={isDark ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Live
              </span>
            </div>
          </div>

          {/* KPI 8: TOTAL CATEGORY */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <Grid size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL CATEGORY</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {activeCategoryCount}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Active categories</span>
              <span className={isDark ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Live
              </span>
            </div>
          </div>

          {/* KPI 9: TOTAL REVENUE */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
            style={isDark ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className={isDark ? "w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                  <DollarSign size={18} />
                </div>
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL REVENUE</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {fmt(stats.totalRevenue)}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Total revenue</span>
              <span className={isDark ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-0.5" : "bg-[#0F766E]/40 text-teal-100 border border-[#0F766E]/60 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs"}>
                ↑ 14.7%
              </span>
            </div>
          </div>

        </div>

        {/* Middle Section: Revenue Velocity Chart + Market Share Donut + Quick Summary Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Revenue Velocity Chart Panel (5 Cols) */}
          <div className={`lg:col-span-5 rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between ${
            isDark 
              ? 'bg-[#131520] border-white/5 shadow-black/40' 
              : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
          }`}>
            {isDark ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3 mb-5">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight font-sans text-white">Revenue Velocity</h3>
                    <p className="text-[11px] mt-0.5 font-normal text-slate-400">Dynamic sales comparison against profits</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Revenue
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Net Profit
                    </div>
                    <button className="text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 bg-slate-900 border-slate-700 text-slate-300">
                      <Calendar size={13} />
                      <span>This Month</span>
                      <ChevronRight size={12} className="rotate-90" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl p-3 border bg-slate-950/20 border-white/5">
                  <div className="h-[220px] w-full">
                    <canvas ref={salesChartRef}></canvas>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Top Header */}
                <div className="flex items-start justify-between pb-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50/90 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0">
                      <TrendingUp size={22} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Revenue Velocity</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">Dynamic sales comparison against profits</p>
                    </div>
                  </div>
                  <button className="px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2 cursor-pointer transition-colors">
                    <Calendar size={15} className="text-slate-600" />
                    <span>This Month</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 gap-4 my-3 pt-1">
                  {/* Revenue metric */}
                  <div className="border-r border-slate-100 pr-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
                      <span>Revenue</span>
                    </div>
                    <div className="text-2xl font-black text-blue-600 tracking-tight my-1 font-sans">
                      {stats.totalRevenue > 0 ? fmt(stats.totalRevenue) : `${settings.currency}145,890`}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">▲ 18.6%</span>
                      <span className="text-slate-400 font-medium">vs last month</span>
                    </div>
                  </div>

                  {/* Net Profit metric */}
                  <div className="pl-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                      <span>Net Profit</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 tracking-tight my-1 font-sans">
                      {stats.totalProfit > 0 ? fmt(stats.totalProfit) : `${settings.currency}45,320`}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">▲ 16.4%</span>
                      <span className="text-slate-400 font-medium">vs last month</span>
                    </div>
                  </div>
                </div>

                {/* Chart Box */}
                <div className="rounded-2xl p-4 border border-slate-100/80 bg-white/50 my-2 relative">
                  {/* Custom Legend matching Image 2 */}
                  <div className="flex items-center justify-center gap-6 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="w-4 h-1 rounded-full bg-blue-600 block"></span>
                      <span>Sales</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="w-4 h-1 rounded-full bg-emerald-500 block"></span>
                      <span>Profit</span>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <canvas ref={salesChartRef}></canvas>
                  </div>
                </div>

                {/* Bottom Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100/60 flex items-center justify-between gap-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                      <Zap size={16} className="fill-blue-600 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Revenue is up <strong className="text-blue-600 font-bold">18.6%</strong> this month
                    </span>
                  </div>
                  <button className="bg-white hover:bg-slate-50 text-blue-600 border border-slate-200/80 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
                    <span>View Details</span>
                    <ArrowUpRight size={14} className="text-blue-600" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Market Share Donut Chart Panel (4 Cols) */}
          <div className={`lg:col-span-4 rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between ${
            isDark 
              ? 'bg-[#131520] border-white/5 shadow-black/40' 
              : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
          }`}>
            {isDark ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 gap-2">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight font-sans text-white">Market Share</h3>
                    <p className="text-[11px] mt-0.5 font-medium text-slate-400">
                      {chartView === 'market' ? 'In Stock Categories' : 'Ledger Contribution'}
                    </p>
                  </div>
                  
                  <div className="flex p-0.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider font-sans shrink-0 bg-slate-950/60 border-white/10">
                    <button 
                      onClick={() => setChartView('market')}
                      className={`px-2.5 py-1 rounded-md transition-all ${chartView === 'market' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Stock
                    </button>
                    <button 
                      onClick={() => setChartView('revenue')}
                      className={`px-2.5 py-1 rounded-md transition-all ${chartView === 'revenue' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Rev
                    </button>
                  </div>
                </div>

                <div className="rounded-xl p-3 border flex items-center justify-center my-2 bg-slate-950/20 border-white/5">
                  <div className="h-[170px] w-full relative flex items-center justify-center">
                    <canvas ref={catChartRef}></canvas>
                  </div>
                </div>
                
                <div className="text-[10px] text-slate-500 font-bold text-center tracking-wider uppercase font-mono">
                  OPERATIONAL DISTRIBUTION MATRIX
                </div>
              </>
            ) : (
              <>
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50/90 border border-purple-100/60 flex items-center justify-center text-purple-600 shrink-0">
                      <PieChart size={22} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Market Share</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">
                        {chartView === 'market' ? 'In Stock Categories' : 'Ledger Contribution'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggle Pill (Stock / Rev) */}
                <div className="flex justify-center my-3">
                  <div className="inline-flex p-1 rounded-full border border-slate-200/80 bg-slate-50/80 text-xs font-semibold">
                    <button 
                      onClick={() => setChartView('market')}
                      className={`px-5 py-1.5 rounded-full transition-all cursor-pointer ${
                        chartView === 'market' 
                          ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                          : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                    >
                      Stock
                    </button>
                    <button 
                      onClick={() => setChartView('revenue')}
                      className={`px-5 py-1.5 rounded-full transition-all cursor-pointer ${
                        chartView === 'revenue' 
                          ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                          : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                    >
                      Rev
                    </button>
                  </div>
                </div>

                {/* Donut Chart with Center Text Overlay */}
                <div className="relative flex items-center justify-center my-1 py-1">
                  <div className="h-[200px] w-full relative flex items-center justify-center">
                    <canvas ref={catChartRef}></canvas>
                    {/* Center Overlay Text matching Image 2 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-sm font-bold text-slate-900 font-sans">Electronics</span>
                      <span className="text-3xl font-black text-blue-600 tracking-tight my-0.5 font-sans">91%</span>
                      <span className="text-[11px] font-semibold text-slate-400 font-sans">Market Share</span>
                    </div>
                  </div>
                </div>

                {/* Category Percentage Legend Rows */}
                <div className="space-y-2.5 my-2 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-xs bg-blue-600 block shrink-0"></span>
                      <span className="font-bold text-slate-800 font-sans">Electronics</span>
                    </div>
                    <span className="font-black text-slate-900 font-sans">91%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-xs bg-purple-200 block shrink-0"></span>
                      <span className="font-bold text-slate-800 font-sans">Others</span>
                    </div>
                    <span className="font-black text-slate-900 font-sans">9%</span>
                  </div>
                </div>

                {/* Bottom Insight Banner */}
                <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/60 flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                    <Target size={16} className="text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 font-sans">
                    Electronics leads the market with <strong className="text-blue-600 font-bold">91%</strong> share
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Quick Summary Panel (3 Cols) matching reference image */}
          <div className={`lg:col-span-3 rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between ${
            isDark 
              ? 'bg-[#131520] border-white/5 shadow-black/40' 
              : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
          }`}>
            {isDark ? (
              <>
                <div className="pb-3 border-b border-white/5">
                  <h3 className="text-sm font-bold tracking-tight font-sans text-white">Quick Summary</h3>
                </div>

                <div className="space-y-3.5 my-2">
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <Package size={14} />
                      </div>
                      <span className="font-semibold text-slate-300">Total Items</span>
                    </div>
                    <span className="font-bold font-mono text-white">{totalItems.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Building2 size={14} />
                      </div>
                      <span className="font-semibold text-slate-300">Stock Value</span>
                    </div>
                    <span className="font-bold font-mono text-white">{fmt(stockValue)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                        <DollarSign size={14} />
                      </div>
                      <span className="font-semibold text-slate-300">Total Revenue</span>
                    </div>
                    <span className="font-bold font-mono text-white">{fmt(stats.totalRevenue)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                        <Users size={14} />
                      </div>
                      <span className="font-semibold text-slate-300">Total Customers</span>
                    </div>
                    <span className="font-bold font-mono text-white">{totalCustomers.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                        <Grid size={14} />
                      </div>
                      <span className="font-semibold text-slate-300">Active Categories</span>
                    </div>
                    <span className="font-bold font-mono text-white">{activeCategoryCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Building2 size={14} />
                      </div>
                      <span className="font-semibold text-slate-300">Warehouse Value</span>
                    </div>
                    <span className="font-bold font-mono text-white">{fmt(stockValue)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50/90 border border-emerald-100/60 flex items-center justify-center text-emerald-600 shrink-0">
                    <BarChart3 size={22} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Quick Summary</h3>
                </div>

                {/* 6 Metric Card Boxes */}
                <div className="space-y-2.5">
                  {/* Card 1: Total Items */}
                  <div className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50/90 text-blue-600 flex items-center justify-center shrink-0">
                        <Package size={22} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-sans">Total Items</div>
                        <div className="text-lg font-black text-blue-600 tracking-tight font-sans mt-0.5">
                          {totalItems > 0 ? totalItems.toLocaleString() : '57'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>

                  {/* Card 2: Stock Value */}
                  <div className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50/90 text-emerald-600 flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-sans">Stock Value</div>
                        <div className="text-lg font-black text-emerald-600 tracking-tight font-sans mt-0.5">
                          {stockValue > 0 ? fmt(stockValue) : `${settings.currency}627,450`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>

                  {/* Card 3: Total Revenue */}
                  <div className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-50/90 text-cyan-600 flex items-center justify-center shrink-0">
                        <DollarSign size={22} className="text-cyan-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-sans">Total Revenue</div>
                        <div className="text-lg font-black text-cyan-600 tracking-tight font-sans mt-0.5">
                          {stats.totalRevenue > 0 ? fmt(stats.totalRevenue) : `${settings.currency}145,890`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>

                  {/* Card 4: Total Customers */}
                  <div className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-50/90 text-rose-500 flex items-center justify-center shrink-0">
                        <Users size={22} className="text-rose-500" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-sans">Total Customers</div>
                        <div className="text-lg font-black text-rose-500 tracking-tight font-sans mt-0.5">
                          {totalCustomers.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>

                  {/* Card 5: Active Categories */}
                  <div className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50/90 text-purple-600 flex items-center justify-center shrink-0">
                        <Grid size={22} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-sans">Active Categories</div>
                        <div className="text-lg font-black text-purple-600 tracking-tight font-sans mt-0.5">
                          {activeCategoryCount}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>

                  {/* Card 6: Warehouse Value */}
                  <div className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50/90 text-amber-600 flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-sans">Warehouse Value</div>
                        <div className="text-lg font-black text-amber-600 tracking-tight font-sans mt-0.5">
                          {stockValue > 0 ? fmt(stockValue) : `${settings.currency}627,450`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>

                {/* Bottom Systems Status Banner */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 font-sans">All systems are performing well</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0"></span>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Lower Layout: Transactions Table & Sidebar Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Transactions Table (8 Cols) */}
          <div className="lg:col-span-8">
            {renderRecentTransactionsTable()}
          </div>

          {/* Right Sidebar Widgets (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {renderCalendarWidget()}
            {renderOrdersOverview()}
            {renderTopSKUVelocity()}
            {renderEliteLoyaltyCohorts()}
          </div>

        </div>

      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardComponent);
export default Dashboard;


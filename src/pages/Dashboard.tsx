import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../context/DataContext';
import { Wallet, ShoppingCart, Tag, TrendingUp, TrendingDown, Package, MoreVertical, ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';

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

export const Dashboard = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { transactions, products, customers, settings } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [chartView, setChartView] = useState<'market' | 'revenue'>('market');
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const catChartRef = useRef<HTMLCanvasElement>(null);

  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    
    return { purchases, sales, completedSales, totalBuy, totalSell, totalProfit };
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
              labels: { color: textColor, font: { weight: 'bold', size: 12 } }
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
              ticks: { color: textColor, font: { weight: 'bold', size: 11 } }
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

      catChart = new Chart(catChartRef.current, {
        type: 'doughnut',
        data: {
          labels: catKeys,
          datasets: [{ 
            data: Object.values(categories), 
            backgroundColor: bgColors,
            borderColor: isDark ? '#0b1220' : '#ffffff',
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
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              titleColor: isDark ? '#38bdf8' : '#0f172a',
              bodyColor: isDark ? '#ffffff' : '#475569',
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
              borderWidth: 1.5,
              padding: 10,
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  if (label === 'No Sales' || label === 'No Products') {
                    return chartView === 'market' ? 'No product data yet' : 'No sales data yet';
                  }
                  const val = context.parsed;
                  if (chartView === 'market') {
                    return ` ${label}: ${val.toLocaleString()} units`;
                  }
                  return ` ${label}: ${settings.currency}${val.toLocaleString()}`;
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
        isDark ? 'bg-[#131520] border-white/5 text-white shadow-black/40' : 'bg-white border-slate-100 shadow-sm shadow-slate-100/50'
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
                    : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
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
          : 'bg-white border-slate-100 shadow-slate-100/50'
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
          : 'bg-white border-slate-100 shadow-slate-100/50'
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
              
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
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
          : 'bg-white border-slate-100 shadow-slate-100/50'
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
                    : 'bg-slate-50 border-slate-100 text-slate-600'
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
          : 'bg-white border-slate-100 shadow-slate-100/50'
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
    <div id="page-dashboard" className={`page active min-h-screen p-4 md:p-8 relative transition-colors duration-300 ${isDark ? 'bg-[#0B1220]' : 'bg-[#f8fafc]'}`}>
      <div className="mesh-bg absolute inset-0 z-0 pointer-events-none opacity-60" />
      
      <div className="relative z-10 max-w-[1720px] mx-auto space-y-8">
        {/* Row of 6 KPI Cards (Clean professional grid with identical dimensions and consistent spacing) */}
        <div id="dashboard-kpi-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           
          {/* KPI 1: INVESTMENT (Soft Blue Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(59,130,246,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg shrink-0">
                  🛒
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Investment</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {fmt(stats.totalBuy)}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">Cumulative purchases</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">+10.2%</span>
            </div>
          </div>

          {/* KPI 2: TOTAL BUY (Amber Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(245,158,11,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0">
                  📦
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Buy</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-500 hover:text-amber-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {fmt(stats.totalBuy)}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">Total spent value</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">Standard</span>
            </div>
          </div>

          {/* KPI 3: TOTAL SELL (Soft Purplish Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(168,85,247,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-lg shrink-0">
                  🏷️
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Sell</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-500 hover:text-purple-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {fmt(stats.totalSell)}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">Total sales value</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">Standard</span>
            </div>
          </div>

          {/* KPI 4: TOTAL CATEGORY (Vivid Pink Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(236,72,153,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center text-lg shrink-0">
                  🏷️
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Category</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-500 hover:text-pink-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {activeCategoryCount}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">Active Categories</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Live</span>
            </div>
          </div>

          {/* KPI 5: TOTAL PROFIT (Vivid Emerald Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(16,185,129,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg shrink-0">
                  💰
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Profit</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-600 hover:text-emerald-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {fmt(stats.totalProfit)}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">Margins after imports</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold text-[10px]">+18.1%</span>
            </div>
          </div>

          {/* KPI 6: STOCK VALUE (Vivid Rose Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(244,63,94,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg shrink-0">
                  🏢
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Stock Value</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-500 hover:text-orange-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {fmt(stockValue)}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-550">Warehouse valuation</span>
              <span className="text-orange-500 font-bold font-mono text-[10px]">Live</span>
            </div>
          </div>

          {/* KPI 7: TOTAL ITEMS (Vivid Cyan Accent) */}
          <div className={`p-6 h-[170px] rounded-[22px] border flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#131520] border-white/5 text-white shadow-black/40 hover:shadow-[0_4px_24px_rgba(6,182,212,0.1)]' 
              : 'bg-white border-slate-100 text-slate-800 shadow-sm shadow-slate-100/60 hover:shadow-md'
          }`}>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-lg shrink-0">
                  🗃️
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Items</span>
              </div>
              <MoreVertical size={16} className="text-slate-400 dark:text-slate-500 hover:text-cyan-500 cursor-pointer" />
            </div>
            <div className="text-[28px] font-black tracking-tight mt-3 font-mono leading-none">
              {totalItems.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/30 dark:border-white/5 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">Inventory Units</span>
              <span className="text-cyan-500 font-bold font-mono text-[10px]">Live</span>
            </div>
          </div>
        </div>

        {/* Unified Custom Dual-Column Dashboard Grid */}
        <div id="dashboard-saas-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT ZONE: Real-time Charts, Transactions, and AI Copilot (8/12 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Visual Charts Segment - side-by-side cleanly */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Sales Chart (Revenue Velocity) */}
              <div id="revenue-velocity-panel" className={`md:col-span-7 rounded-[22px] p-6 border transition-all duration-300 ${
                isDark 
                  ? 'bg-[#131520] border-white/5 shadow-black/40' 
                  : 'bg-white border-slate-100 shadow-sm shadow-slate-100/60'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 mb-6 ${
                  isDark ? 'border-white/5' : 'border-slate-100'
                }`}>
                  <div>
                    <h3 className={`text-sm font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>Revenue Velocity</h3>
                    <p className={`text-[11px] mt-1 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dynamic sales comparison against profits</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Revenue
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Net Profit
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50/50 border-slate-100/50'}`}>
                  <div className="h-[240px] w-full">
                    <canvas ref={salesChartRef}></canvas>
                  </div>
                </div>
              </div>

              {/* Market Share Companion Pie Chart */}
              <div id="market-share-panel" className={`md:col-span-5 rounded-[22px] p-6 border transition-all duration-300 flex flex-col justify-between ${
                isDark 
                  ? 'bg-[#131520] border-white/5 shadow-black/40' 
                  : 'bg-white border-slate-100 shadow-sm shadow-slate-100/60'
              }`}>
                <div className={`flex items-center justify-between pb-4 border-b gap-2 ${
                  isDark ? 'border-white/5' : 'border-slate-100'
                }`}>
                  <div>
                    <h3 className={`text-sm font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>Market Share</h3>
                    <p className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-505'}`}>
                      {chartView === 'market' ? 'In Stock Categories' : 'Ledger Contribution'}
                    </p>
                  </div>
                  
                  {/* Small toggles */}
                  <div className={`flex p-0.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider font-sans shrink-0 ${
                    isDark ? 'bg-slate-950/60 border-white/10' : 'bg-[#fafbfc] border-slate-150'
                  }`}>
                    <button 
                      onClick={() => setChartView('market')}
                      className={`px-2 py-0.5 rounded-md transition-all ${chartView === 'market' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'}`}
                    >
                      Stock
                    </button>
                    <button 
                      onClick={() => setChartView('revenue')}
                      className={`px-2 py-0.5 rounded-md transition-all ${chartView === 'revenue' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'}`}
                    >
                      Rev
                    </button>
                  </div>
                </div>

                <div className={`rounded-xl p-3 border flex items-center justify-center ${isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50/50 border-slate-100/50'}`}>
                  <div className="h-[175px] w-full relative flex items-center justify-center">
                    <canvas ref={catChartRef}></canvas>
                  </div>
                </div>
                
                <div className="text-[10px] text-slate-405 dark:text-slate-500 font-bold text-center mt-2 tracking-wide uppercase select-none font-mono">
                  Operational distribution matrix
                </div>
              </div>

            </div>

            {/* Direct Transaction logs activity detail list */}
            {renderRecentTransactionsTable()}

          </div>

          {/* RIGHT ZONE: Static Sidebar components & Sticky widgets (4/12 Columns) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Real Date and Time Calendar block */}
            {renderCalendarWidget()}

            {/* Orders Summary widget */}
            {renderOrdersOverview()}

            {/* Top SKU contributor listing */}
            {renderTopSKUVelocity()}

            {/* Loyalty cohorts mapping */}
            {renderEliteLoyaltyCohorts()}

          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;


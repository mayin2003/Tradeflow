import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../context/DataContext';

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
        'electronics': '#38bdf8', // Bright Radiant Light Blue
        'clothing': '#fb923c',    // Bright Pastel Orange
        'food': '#4ade80',        // Fresh Mint Green
        'groceries': '#4ade80',
        'beverages': '#2dd4bf',   // Luminous Teal
        'home': '#a78bfa',        // Lavender Purple
        'furniture': '#f59e0b',   // Bright Amber
        'kitchen': '#f472b6',     // Soft Pastel Pink
        'beauty': '#fda4af',      // Peach Rose
        'cosmetics': '#fda4af',
        'accessories': '#facc15', // Neon Yellow
        'books': '#60a5fa',       // Soft Cornflower Blue
        'stationery': '#818cf8',  // Soft Indigo Blue
        'automotive': '#f87171',  // Soft Coral Red
        'other': '#94a3b8',       // Light Slate Gray
        'uncategorized': '#94a3b8',
        'no products': '#475569',
        'no sales': '#475569',
      };

      const fallbackColorsLight = [
        '#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#db2777', 
        '#0d9488', '#ca8a04', '#dc2626', '#0284c7', '#4f46e5', 
        '#0891b2', '#be185d', '#854d0e'
      ];

      const fallbackColorsDark = [
        '#38bdf8', '#fb923c', '#4ade80', '#a78bfa', '#f472b6', 
        '#2dd4bf', '#facc15', '#f87171', '#60a5fa', '#818cf8', 
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
            borderColor: isDark ? '#0f172a' : '#ffffff',
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
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  if (label === 'No Sales' || label === 'No Products') {
                    return chartView === 'market' ? 'No product data yet' : 'No sales data yet';
                  }
                  const val = context.parsed;
                  if (chartView === 'market') {
                    return `${label}: ${val.toLocaleString()} units`;
                  }
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
  }, [transactions, products, calculateProfit, settings.currency, chartView]);

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

  const fmt = useCallback((n: number) => settings.currency + Math.round(n).toLocaleString(), [settings.currency]);

  // AI Assistant Parsing Logic and States
  const [queryInput, setQueryInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Welcome, Operator. I am your **Vanguard AI Financial Copilot** linked into your active databases. I compile real-time ledger records, calculate stock valuations, itemize supply costs, and project profitability instantaneous. Ask me any question or click a smart action chip below to begin!",
      timestamp: new Date()
    }
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isAnalyzing]);

  const getAIResponse = (text: string) => {
    const norm = text.toLowerCase();
    
    // Purchases (Buy Section)
    if (norm.includes('buy') || norm.includes('purchas') || norm.includes('invest') || norm.includes('import') || norm.includes('cost') || norm.includes('supplier')) {
      const purchases = transactions.filter(t => t.type === 'purchase');
      const totalBuy = purchases.reduce((sum, t) => sum + t.total_price, 0);
      const totalItemsCount = products.length;
      
      const metrics = [
        { label: 'Capital Invested', value: fmt(totalBuy), extra: 'Invoiced supplies' },
        { label: 'Active Supply Orders', value: `${purchases.length} Records`, extra: 'Primary inventory intake' },
        { label: 'Imported SKUs Listed', value: `${totalItemsCount} Products`, extra: 'Active supplier catalog' }
      ];

      const rows = purchases.slice(0, 5).map(t => [
        new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        t.product_name || 'Supply Goods Intake',
        t.supplier || 'Standard Supplier',
        t.quantity ?? '-',
        fmt(t.total_price)
      ]);

      return {
        text: `Based on your live purchase histories, I have completed a full supply calculation. You has total capital investments of **${fmt(totalBuy)}** across **${purchases.length}** invoices. Here is the active purchase cost profiling and high-value supplier allocations.`,
        calculationResult: {
          title: 'Capital Buy & Investment Audit Report',
          metrics,
          table: {
            headers: ['Date', 'Item Description', 'Supplier Name', 'Qty', 'Total Cost'],
            rows
          },
          alerts: totalBuy > 50000 
            ? ['Optimal supply restock budget is maintained.', 'Regular audits recommended monthly.'] 
            : ['Capital allocation is lean. Recommend SKU catalog expansion.']
        }
      };
    }

    // Sales (Sell Section)
    if (norm.includes('sale') || norm.includes('sell') || norm.includes('export') || norm.includes('rev') || norm.includes('profit') || norm.includes('margin')) {
      const sales = transactions.filter(t => t.type === 'sale');
      const totalSell = sales.reduce((sum, t) => sum + t.total_price, 0);
      const totalProfit = sales.reduce((sum, t) => sum + calculateProfit(t), 0);
      const marginRate = totalSell > 0 ? ((totalProfit / totalSell) * 100).toFixed(1) : '0.0';
      const totalItemsSold = sales.reduce((sum, t) => {
        if (t.items && t.items.length > 0) {
          return sum + t.items.reduce((acc: number, i: any) => acc + i.quantity, 0);
        }
        return sum + (t.quantity || 0);
      }, 0);

      const metrics = [
        { label: 'Gross Sales Revenue', value: fmt(totalSell), extra: 'Total incoming client capital' },
        { label: 'Net Profit Earnings', value: fmt(totalProfit), extra: `${marginRate}% operating margin` },
        { label: 'Accumulated Volume Sold', value: `${totalItemsSold} Units`, extra: `${sales.length} invoices generated` }
      ];

      const rows = sales.slice(0, 5).map(t => [
        new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        t.customer_name || 'Guest Segment',
        t.items ? `${t.items.length} unique items` : (t.product_name || 'Retail Product'),
        fmt(t.total_price)
      ]);

      return {
        text: `Reconciled total retail sales: dynamic calculations confirm your gross revenue is **${fmt(totalSell)}** with **${totalProfit > 0 ? 'an active net profit of ' + fmt(totalProfit) : 'no net profit registered yet'}**, yielding a margins profile of **${marginRate}%**.`,
        calculationResult: {
          title: 'Sales Intelligence & Net Profit Margins',
          metrics,
          table: {
            headers: ['Date', 'Customer Link', 'Item Manifest', 'Total Invoice'],
            rows
          },
          alerts: parseFloat(marginRate) > 15 
            ? ['Excellent! Margins are exceeding regional corporate benchmark levels (15%).', 'Customer segments indicate high retention potential.'] 
            : ['Operating margins are narrow. Recommend optimizing supplier costs or adjusting listing prices.']
        }
      };
    }

    // Stock / Inventory
    if (norm.includes('inv') || norm.includes('stock') || norm.includes('item') || norm.includes('product') || norm.includes('sku') || norm.includes('warehouse')) {
      const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
      const holdingCostValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || 0)), 0);
      const estimatedSellValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.sell_price || 0)), 0);
      const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;

      const metrics = [
        { label: 'Holding Warehouse Units', value: `${totalUnits} Units`, extra: `${products.length} distinct SKUs` },
        { label: 'Asset Holding Cost Value', value: fmt(holdingCostValue), extra: 'Capital locked in warehouse' },
        { label: 'Projected Retail Value', value: fmt(estimatedSellValue), extra: `Asset gain: ${fmt(estimatedSellValue - holdingCostValue)}` }
      ];

      const rows = products.slice(0, 5).map(p => [
        p.name,
        p.category || 'Other',
        p.stock,
        fmt(p.cost_price),
        fmt(p.sell_price)
      ]);

      return {
        text: `Your distribution centers currently house **${totalUnits} physical units** across **${products.length} active SKUs**. Real-time valuation checks compute cost holdings of **${fmt(holdingCostValue)}** and a prospective client sales yield of **${fmt(estimatedSellValue)}**.`,
        calculationResult: {
          title: 'Asset Warehouse Valuation & Allocation Profile',
          metrics,
          table: {
            headers: ['Product Line', 'Category', 'Quantity', 'Cost Price', 'Retail Price'],
            rows
          },
          alerts: lowStockCount > 0 
            ? [`CRITICAL ALERT: ${lowStockCount} products are running below safety-stock thresholds! Reorder from supplies module.`] 
            : ['Warehouse supply chains are healthy. No replenishment deficits registered.']
        }
      };
    }

    // High Contribution Clients / Customers
    if (norm.includes('customer') || norm.includes('vip') || norm.includes('loyalty') || norm.includes('client') || norm.includes('tier') || norm.includes('points') || norm.includes('network')) {
      const totalCustCount = customers.length;
      const tierMap = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
      customers.forEach(c => {
        const tier = c.membership_tier || 'Bronze';
        if (tier in tierMap) tierMap[tier]++;
      });

      const metrics = [
        { label: 'Vanguard Registered Clients', value: `${totalCustCount} Accounts`, extra: 'Integrated customer base' },
        { label: 'Elite Tier Profiles', value: `${tierMap.Gold + tierMap.Platinum} Users`, extra: 'Loyalty program participants' },
        { label: 'Mean Loyalty Balance', value: `${customers.length > 0 ? Math.round(customers.reduce((s,c)=>s+(c.loyalty_points || 0),0)/customers.length) : 0} points`, extra: 'Account ledger baseline' }
      ];

      const rows = customers.slice(0, 5).map(c => [
        c.name,
        c.membership_tier || 'Bronze',
        c.phone || 'No phone',
        c.loyalty_points || 0
      ]);

      return {
        text: `Your trade relationships ledger has registered **${totalCustCount} client profiles**. Key cohort segments show **${tierMap.Platinum} Platinum** and **${tierMap.Gold} Gold** peak-tier members generating high-lifetime-value conversions.`,
        calculationResult: {
          title: 'Customer Relations & Loyalty Network Matrix',
          metrics,
          table: {
            headers: ['Client Profile', 'Membership Segment', 'Contact', 'Loyalty Balance'],
            rows
          },
          alerts: totalCustCount > 0 
            ? ['Reconciliation audit verified. Client point ledgers matches ledger database.', 'Retention rewards campaign ready for high contributors.'] 
            : ['Loyalty profile ledger is empty. Register clients to track retention indexes.']
        }
      };
    }

    // Default Fallback
    return {
      text: `Hello Operator! I parsed your custom query but didn't locate exact keyword links to database arrays. 

I can compute advanced multi-variable analytics for these profiles instantly:
- **"Calculate overall purchase and cost totals"** (or click **🛒 Calculate Capital Buys**)
- **"Calculate gross sales and profits analysis"** (or click **💰 Run Sales Margins**)
- **"Generate warehouse asset evaluations"** (or click **📦 SKU Valuations**)
- **"Perform cohort loyalty analysis"** (or click **👥 Client Loyalty**)

Please trigger one of the fast analysis chips below or elaborate your phrase.`,
      calculationResult: undefined
    };
  };

  const handleQuery = (textOverride?: string) => {
    const rawText = (textOverride || queryInput).trim();
    if (!rawText) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setQueryInput('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const responseObj = getAIResponse(rawText);
      const assistantMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: responseObj.text,
        calculationResult: responseObj.calculationResult,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, assistantMessage]);
      setIsAnalyzing(false);
    }, 1100);
  };


  return (
    <div id="page-dashboard" className="page active min-h-screen p-4 md:p-8 relative">
      <div className="mesh-bg absolute inset-0 z-0 pointer-events-none" />
      <div className="relative z-10">
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
          <div className="bento-card-header flex flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-display">Market Share</h3>
              <p className="text-xs text-slate-400 font-medium">
                {chartView === 'market' ? 'Product Category Mix' : 'Revenue by Category'}
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <button
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  chartView === 'market'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
                onClick={() => setChartView('market')}
              >
                In Stock
              </button>
              <button
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  chartView === 'revenue'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
                onClick={() => setChartView('revenue')}
              >
                Revenue
              </button>
            </div>
          </div>
          <div className="bento-card-content flex flex-col items-center justify-center">
            <div className="h-[220px] w-full mt-2">
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

        {/* Vanguard Smart AI Financial Copilot */}
        <div id="vanguard-ai-copilot" className="bento-card col-span-12 row-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl mt-6 relative overflow-hidden group hover:shadow-xl hover:border-blue-500/20 dark:hover:border-blue-500/30 transition-all duration-300">
          {/* Subtle cyber grid backdrop decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.04),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none z-0" />
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Copilot Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-2xl text-blue-600 dark:text-blue-400 font-bold shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                  🤖
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center flex-wrap gap-2">
                    Vanguard Financial Copilot
                    <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/25 tracking-widest uppercase animate-pulse">
                      Beta v3.1
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Reconciling live ledgers, cost allocations, and inventory metrics instantly</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-start sm:self-center bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse"></span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-550 dark:text-slate-400 font-mono">LEDGER SECURED</span>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 min-h-[380px]">
              {/* Chat Viewport (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col h-[420px] border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/40 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm shadow-inner">
                {/* Scrollable messages and insights mapping */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent pb-4"
                >
                  {chatHistory.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[90%] ${msg.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
                    >
                      {/* Message Bubble text */}
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 dark:bg-blue-600 text-white rounded-tr-none font-medium' 
                          : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none font-normal'
                      }`}>
                        {/* Support simplistic bold formatting if present */}
                        <div className="whitespace-pre-wrap">
                          {msg.text.split('**').map((part: string, i: number) => 
                            i % 2 === 1 ? <strong key={i} className="text-slate-950 dark:text-white font-extrabold">{part}</strong> : part
                          )}
                        </div>
                      </div>

                      {/* Struct calculation rendering details */}
                      {msg.calculationResult && (
                        <div className="w-full mt-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-4 shadow-md text-left transition-all duration-300">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-sans">
                              <span>📊</span> {msg.calculationResult.title}
                            </span>
                            <span className="text-[9px] font-mono bg-slate-50 dark:bg-slate-855 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                              Calculated Live
                            </span>
                          </div>

                          {/* Metric box cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {msg.calculationResult.metrics.map((metric: any, mIdx: number) => (
                              <div key={mIdx} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/60 p-3.5 rounded-xl flex flex-col justify-between shadow-xs hover:border-blue-500/20 dark:hover:border-blue-500/20 transition-all duration-200">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest">{metric.label}</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 border-b border-transparent font-mono">{metric.value}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase leading-none">{metric.extra}</span>
                              </div>
                            ))}
                          </div>

                          {/* Data tables */}
                          {msg.calculationResult.table && (
                            <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-150 dark:border-slate-850 bg-slate-100/60 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                    {msg.calculationResult.table.headers.map((hdr: string, hIdx: number) => (
                                      <th key={hIdx} className="p-3 font-semibold uppercase text-[10px]">{hdr}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900/40">
                                  {msg.calculationResult.table.rows.map((row: any, rIdx: number) => (
                                    <tr key={rIdx} className="hover:bg-blue-50/20 dark:hover:bg-slate-900/45 transition-colors">
                                      {row.map((cell: any, cIdx: number) => (
                                        <td key={cIdx} className="p-3 font-medium text-slate-700 dark:text-slate-300 font-mono">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Custom Alerts */}
                          {msg.calculationResult.alerts && (
                            <div className="space-y-1.5 pt-1">
                              {msg.calculationResult.alerts.map((alert: string, aIdx: number) => (
                                <div key={aIdx} className="flex items-start gap-2.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 shadow-xs font-mono">
                                  <span className="text-xs shrink-0">💡</span>
                                  <span className="font-medium leading-relaxed">{alert}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1.5 tracking-wider font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {/* Thinking/Analyzing state */}
                  {isAnalyzing && (
                    <div className="flex flex-col items-start max-w-[80%] mr-auto space-y-1.5">
                      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-blue-600 dark:text-blue-400 font-bold shadow-sm animate-pulse flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 dark:bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-550 dark:bg-blue-500 animate-pulse"></span>
                        </span>
                        Reconciling live finance ledgers and compiling calculations ...
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Input form */}
                <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-800 flex gap-2.5">
                  <input 
                    type="text" 
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(); }}
                    placeholder="Ask Copilot (e.g., 'total buy calculation', 'sales totals')..."
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700/80 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm transition-all focus:bg-white dark:focus:bg-slate-950 bg-slate-50/35 shadow-inner"
                  />
                  <button 
                    onClick={() => handleQuery()}
                    disabled={isAnalyzing || !queryInput.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-550 disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:text-slate-400 dark:disabled:text-slate-650 text-white rounded-xl font-bold text-sm select-none cursor-pointer transition-all flex items-center justify-center shadow-md active:scale-95 duration-150 hover:shadow-lg hover:shadow-blue-500/15"
                  >
                    Transmit
                  </button>
                </div>
              </div>

              {/* Side Blueprint / Hot Suggest Chips (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between border border-slate-100 dark:border-slate-800 bg-slate-50/25 dark:bg-slate-900/40 rounded-2xl p-5 gap-5">
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5 font-sans">
                    <span className="text-amber-550 dark:text-amber-400">⚡</span> Smart Action chips
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2.5">
                    Click any action blueprint to automatically query database state vectors and render a multi-variable custom financial report:
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 mt-4">
                    <button 
                      onClick={() => handleQuery("Calculate Buy Totals (Investment Profile)")}
                      disabled={isAnalyzing}
                      className="w-full text-left bg-white dark:bg-slate-950 hover:bg-blue-50/30 dark:hover:bg-slate-850/85 border border-slate-150 dark:border-slate-850 hover:border-blue-400 dark:hover:border-blue-500/40 p-3 rounded-xl transition-all cursor-pointer group/btn shadow-xs hover:shadow-md duration-200"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500 dark:text-blue-400">🛒</span>
                          <span>Calculate Capital Buys</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 font-bold transition-all group-hover/btn:translate-x-1 duration-200">→</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-medium mt-1 leading-normal pl-5">Audit raw supply purchase ledgers, total expenditures, and active SKUs.</p>
                    </button>

                    <button 
                      onClick={() => handleQuery("Calculate Sales Totals (Revenue & Profit Analysis)")}
                      disabled={isAnalyzing}
                      className="w-full text-left bg-white dark:bg-slate-950 hover:bg-emerald-50/30 dark:hover:bg-slate-850/85 border border-slate-150 dark:border-slate-850 hover:border-emerald-400 dark:hover:border-emerald-500/40 p-3 rounded-xl transition-all cursor-pointer group/btn shadow-xs hover:shadow-md duration-200"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-emerald-500 dark:text-emerald-400 font-normal">💰</span>
                          <span>Run Sales Margins</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400 font-bold transition-all group-hover/btn:translate-x-1 duration-200">→</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-medium mt-1 leading-normal pl-5">Reconcile customer sales invoices, total revenues, and profit margins.</p>
                    </button>

                    <button 
                      onClick={() => handleQuery("Vanguard SKU Valuation (Inventory Valuation)")}
                      disabled={isAnalyzing}
                      className="w-full text-left bg-white dark:bg-slate-950 hover:bg-amber-50/20 dark:hover:bg-slate-850/85 border border-slate-150 dark:border-slate-850 hover:border-amber-400 dark:hover:border-amber-500/40 p-3 rounded-xl transition-all cursor-pointer group/btn shadow-xs hover:shadow-md duration-200"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-amber-500 dark:text-amber-400 font-normal">📦</span>
                          <span>SKU Valuations</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/btn:text-amber-400 dark:group-hover/btn:text-amber-450 font-bold transition-all group-hover/btn:translate-x-1 duration-200">→</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-medium mt-1 leading-normal pl-5">Compile warehouse stock quantities, total cost values, and potential gains.</p>
                    </button>

                    <button 
                      onClick={() => handleQuery("Customer Loyalty and Engagement (VIP Contribution)")}
                      disabled={isAnalyzing}
                      className="w-full text-left bg-white dark:bg-slate-950 hover:bg-violet-50/30 dark:hover:bg-slate-850/85 border border-slate-150 dark:border-slate-850 hover:border-violet-400 dark:hover:border-purple-500/40 p-3 rounded-xl transition-all cursor-pointer group/btn shadow-xs hover:shadow-md duration-200"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-violet-500 dark:text-violet-400 font-normal">👥</span>
                          <span>Client Loyalty Map</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/btn:text-purple-600 dark:group-hover/btn:text-violet-400 font-bold transition-all group-hover/btn:translate-x-1 duration-200">→</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-medium mt-1 leading-normal pl-5">Track cohort distributions, Gold/Platinum tier count, and loyalty indexes.</p>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850/85 p-3.5 rounded-xl text-left shadow-xs">
                  <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5 font-sans">
                    <span className="text-blue-500 dark:text-blue-400">💡</span> Copilot Instruction
                  </div>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal font-medium mt-1.5">
                    This interactive copilot translates natural English phrases into precise analytical calculations executing fully securely inside your browser session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

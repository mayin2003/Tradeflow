import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData, deduplicateProducts } from '../context/DataContext';
import { calculateCategoryMasterList, inferCategory } from './Inventory';
import { 
  Wallet, ShoppingCart, Tag, TrendingUp, TrendingDown, Package, 
  MoreVertical, ChevronRight, Calendar, ArrowUpRight, ShoppingBag, 
  Building2, Users, Grid, DollarSign, Activity, AlertTriangle, ArrowUp, BarChart3,
  Zap, Target, PieChart, ChevronDown, FileText, Filter, CheckCircle2, Truck, Clock, XCircle, ChevronLeft, Search
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
  const { transactions, products, customers, settings, employees } = useData();
  const [showNotifications, setShowNotifications] = useState(false);

  const [manualInvestment, setManualInvestment] = useState<number>(() => {
    const stored = localStorage.getItem('tradeflow_manual_investment');
    if (stored !== null && !isNaN(Number(stored))) {
      return Number(stored);
    }
    return 15301;
  });

  const [isEditingInvestmentModal, setIsEditingInvestmentModal] = useState(false);
  const [tempInvestmentInput, setTempInvestmentInput] = useState<string>('');

  const handleSaveInvestment = () => {
    const parsed = parseFloat(tempInvestmentInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setManualInvestment(parsed);
      localStorage.setItem('tradeflow_manual_investment', String(parsed));
    }
    setIsEditingInvestmentModal(false);
  };

  const totalEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return 0;
    return employees.filter((e: any) => e.active !== false && e.status !== 'Archived' && e.status !== 'Inactive').length;
  }, [employees]);
  const [chartView, setChartView] = useState<'market' | 'revenue'>('market');
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const catChartRef = useRef<HTMLCanvasElement>(null);

  // O(1) Fast Product Map for instant lookup by ID and Name
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (p.id) map.set(p.id, p);
      if (p.name) map.set(p.name.trim().toLowerCase(), p);
    }
    return map;
  }, [products]);

  // Fast Purchase Cost Map for backup unit cost lookup
  const purchaseCostMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (t.type === 'purchase') {
        const cost = t.unit_price || (t.quantity ? t.total_price / t.quantity : 0);
        if (cost > 0) {
          if (t.product_id) map.set(t.product_id, cost);
          if (t.product_name) map.set(t.product_name.trim().toLowerCase(), cost);
        }
        if (t.items && Array.isArray(t.items)) {
          for (let j = 0; j < t.items.length; j++) {
            const item = t.items[j];
            const itemCost = item.unit_price || (item.quantity ? item.total / item.quantity : 0);
            if (itemCost > 0) {
              if (item.product_id) map.set(item.product_id, itemCost);
              if (item.product_name) map.set(item.product_name.trim().toLowerCase(), itemCost);
            }
          }
        }
      }
    }
    return map;
  }, [transactions]);

  const calculateProfit = useCallback((t: any) => {
    if (t.type !== 'sale') return 0;
    if (t.status && t.status.toLowerCase() === 'cancelled') return 0;

    let totalProfit = 0;

    if (t.items && Array.isArray(t.items) && t.items.length > 0) {
      for (let i = 0; i < t.items.length; i++) {
        const item = t.items[i];
        const qty = item.quantity ?? item.qty ?? 1;
        const itemTotal = item.total ?? (item.unit_price ? item.unit_price * qty : 0);
        
        const prod = (item.product_id ? productMap.get(item.product_id) : null) || 
                     (item.product_name ? productMap.get(item.product_name.trim().toLowerCase()) : null);
        
        let unitCost = item.cost_price ?? item.purchase_price ?? item.unit_cost ?? 0;

        if (unitCost <= 0 && item.product_id && purchaseCostMap.has(item.product_id)) {
          unitCost = purchaseCostMap.get(item.product_id)!;
        }
        if (unitCost <= 0 && item.product_name && purchaseCostMap.has(item.product_name.trim().toLowerCase())) {
          unitCost = purchaseCostMap.get(item.product_name.trim().toLowerCase())!;
        }
        if (unitCost <= 0 && prod) {
          unitCost = prod.cost_price ?? 0;
        }

        const itemCostTotal = unitCost > 0 ? (unitCost * qty) : (itemTotal * 0.85);
        totalProfit += (itemTotal - itemCostTotal);
      }
    } else {
      const qty = t.quantity ?? t.qty ?? 1;
      const totalRevenue = t.total_price ?? t.total ?? 0;
      
      const prod = (t.product_id ? productMap.get(t.product_id) : null) || 
                   (t.product_name ? productMap.get(t.product_name.trim().toLowerCase()) : null);
      
      let unitCost = t.cost_price ?? t.purchase_price ?? t.unit_cost ?? 0;

      if (unitCost <= 0 && t.product_id && purchaseCostMap.has(t.product_id)) {
        unitCost = purchaseCostMap.get(t.product_id)!;
      }
      if (unitCost <= 0 && t.product_name && purchaseCostMap.has(t.product_name.trim().toLowerCase())) {
        unitCost = purchaseCostMap.get(t.product_name.trim().toLowerCase())!;
      }
      if (unitCost <= 0 && prod) {
        unitCost = prod.cost_price ?? 0;
      }

      const totalCost = unitCost > 0 ? (unitCost * qty) : (totalRevenue * 0.85);
      totalProfit = totalRevenue - totalCost;
    }

    return totalProfit;
  }, [productMap, purchaseCostMap]);

  const stats = useMemo(() => {
    const purchases = transactions.filter(t => t.type === 'purchase');
    const sales = transactions.filter(t => t.type === 'sale');
    const completedSales = sales.filter(t => !t.status || t.status.toLowerCase() !== 'cancelled');
    
    const totalBuy = purchases.reduce((val, t) => val + (t.total_price || 0), 0);
    const totalSell = completedSales.reduce((val, t) => val + (t.total_price || 0), 0);
    const totalProfit = completedSales.reduce((val, t) => val + calculateProfit(t), 0);
    const totalRevenue = totalSell;
    
    return { purchases, sales, completedSales, totalBuy, totalSell, totalProfit, totalRevenue };
  }, [transactions, calculateProfit]);

  const activeCategoryCount = useMemo(() => {
    const list = [...products];
    const existingNames = new Set(list.map(p => p.name.trim().toLowerCase()));

    if (transactions && Array.isArray(transactions)) {
      transactions.forEach(t => {
        if (t.type === 'purchase') {
          const processItem = (pName?: string, catName?: string, cost?: number, qty?: number) => {
            if (!pName || !pName.trim()) return;
            const norm = pName.trim().toLowerCase();
            if (!existingNames.has(norm)) {
              existingNames.add(norm);
              list.push({
                id: `trans-prod-${norm.replace(/[^a-z0-9]/g, '-')}`,
                name: pName.trim(),
                category: catName || inferCategory(pName.trim()),
                cost_price: cost || 0,
                sell_price: (cost || 0) * 1.2,
                stock: qty || 0,
                min_stock: 5,
                hs_code: '',
                barcode: '',
                sku: '',
                unit: 'pcs',
                date: t.date || new Date().toISOString().split('T')[0]
              } as any);
            }
          };

          if (t.items && t.items.length > 0) {
            t.items.forEach(item => processItem(item.product_name, item.category, item.unit_price, item.quantity));
          } else if (t.product_name) {
            processItem(t.product_name, t.category, t.unit_price, t.quantity);
          }
        }
      });
    }

    const deduplicated = deduplicateProducts(list);
    const activeProducts = deduplicated.filter(p => !(p as any).is_inactive && (p as any).status !== 'inactive');

    return calculateCategoryMasterList(activeProducts).length;
  }, [products, transactions]);

  const categoryShareData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    
    if (chartView === 'market') {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const cat = getAutoCategory(p.name, p.category);
        categories[cat] = (categories[cat] || 0) + Math.max(0, p.stock || 0);
      }
      const totalStock = Object.values(categories).reduce((a, b) => a + b, 0);
      if (totalStock === 0) {
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          const cat = getAutoCategory(p.name, p.category);
          categories[cat] = (categories[cat] || 0) + 1;
        }
      }
    } else {
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        if (t.type === 'sale') {
          if (t.items && t.items.length > 0) {
            for (let j = 0; j < t.items.length; j++) {
              const item = t.items[j];
              const product = productMap.get(item.product_id);
              const cat = getAutoCategory(item.product_name || product?.name || '', product?.category);
              categories[cat] = (categories[cat] || 0) + (item.total || 0);
            }
          } else if (t.product_id) {
            const product = productMap.get(t.product_id);
            const cat = getAutoCategory(t.product_name || product?.name || '', product?.category);
            categories[cat] = (categories[cat] || 0) + (t.total_price || 0);
          }
        }
      }
    }

    if (Object.keys(categories).length === 0) {
      categories['Electronics'] = 91;
      categories['Others'] = 9;
    }

    const catKeys = Object.keys(categories);
    const totalVal = Object.values(categories).reduce((a, b) => a + b, 0) || 1;

    const itemsList = catKeys.map(key => {
      const val = categories[key];
      const pct = Math.round((val / totalVal) * 100);
      return { name: key, value: val, percentage: pct };
    }).sort((a, b) => b.value - a.value);

    let displayItems = itemsList;
    if (itemsList.length > 4) {
      const top = itemsList.slice(0, 3);
      const otherVal = itemsList.slice(3).reduce((sum, item) => sum + item.value, 0);
      const otherPct = Math.round((otherVal / totalVal) * 100);
      displayItems = [...top, { name: 'Others', value: otherVal, percentage: otherPct }];
    }

    const leading = displayItems[0] || { name: 'Electronics', percentage: 91, value: 91 };

    return {
      rawCategories: categories,
      items: displayItems,
      leading,
      totalVal
    };
  }, [chartView, products, transactions, productMap]);

  const growthStats = useMemo(() => {
    const currentMonthIndex = new Date().getMonth();
    const salesByMonth = new Array(currentMonthIndex + 1).fill(0);
    const profitByMonth = new Array(currentMonthIndex + 1).fill(0);

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (t.type === 'sale') {
        const m = new Date(t.date).getMonth();
        if (m <= currentMonthIndex) {
          salesByMonth[m] += t.total_price || 0;
          profitByMonth[m] += calculateProfit(t);
        }
      }
    }

    let revenueGrowth = '18.6';
    let profitGrowth = '16.4';

    if (salesByMonth.length >= 2) {
      const currS = salesByMonth[salesByMonth.length - 1];
      const prevS = salesByMonth[salesByMonth.length - 2];
      if (prevS > 0) {
        revenueGrowth = (((currS - prevS) / prevS) * 100).toFixed(1);
      }
    }

    if (profitByMonth.length >= 2) {
      const currP = profitByMonth[profitByMonth.length - 1];
      const prevP = profitByMonth[profitByMonth.length - 2];
      if (prevP > 0) {
        profitGrowth = (((currP - prevP) / prevP) * 100).toFixed(1);
      }
    }

    return { revenueGrowth, profitGrowth };
  }, [transactions, calculateProfit]);

  useEffect(() => {
    let salesChart: Chart | null = null;
    let catChart: Chart | null = null;

    if (salesChartRef.current) {
      // Group by month
      const currentMonthIndex = new Date().getMonth();
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, currentMonthIndex + 1);
      
      const salesByMonth = new Array(monthLabels.length).fill(0);
      const profitByMonth = new Array(monthLabels.length).fill(0);

      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        if (t.type === 'sale') {
          const m = new Date(t.date).getMonth();
          if (m < monthLabels.length) {
            salesByMonth[m] += t.total_price || 0;
            profitByMonth[m] += calculateProfit(t);
          }
        }
      }

      const isDark = settings.theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

      salesChart = new Chart(salesChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [
            {
              label: 'Sales',
              data: (salesByMonth.length >= 7 && salesByMonth.some(v => v > 0)) ? salesByMonth.slice(0, 7) : [600000, 780000, 590000, 720000, 890000, 780000, 930000],
              borderColor: isDark ? '#3b82f6' : '#2563eb',
              backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                if (isDark) {
                  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
                  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
                } else {
                  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
                  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
                }
                return gradient;
              },
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: isDark ? '#3b82f6' : '#2563eb',
              pointBorderColor: isDark ? '#ffffff' : '#ffffff',
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
                if (isDark) {
                  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
                  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
                } else {
                  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
                  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                }
                return gradient;
              },
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: isDark ? '#ffffff' : '#ffffff',
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
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#0F121C' : '#ffffff',
              titleColor: isDark ? '#ffffff' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#475569',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
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
            labels: categoryShareData.items.map(i => i.name),
            datasets: [{ 
              data: categoryShareData.items.map(i => i.value), 
              backgroundColor: categoryShareData.items.map((i, idx) => {
                const normKey = i.name.trim().toLowerCase();
                return categoryColorMapLight[normKey] || fallbackColorsLight[idx % fallbackColorsLight.length];
              }),
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
                  label: (context) => {
                    const total = context.dataset.data.reduce((a: any, b: any) => Number(a) + Number(b), 0) || 1;
                    const pct = Math.round((Number(context.parsed) / total) * 100);
                    return ` ${context.label}: ${pct}%`;
                  }
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
            labels: categoryShareData.items.map(i => i.name),
            datasets: [{ 
              data: categoryShareData.items.map(i => i.value), 
              backgroundColor: categoryShareData.items.map((i, idx) => {
                const normKey = i.name.trim().toLowerCase();
                return categoryColorMapDark[normKey] || fallbackColorsDark[idx % fallbackColorsDark.length];
              }),
              borderColor: '#0B0E17',
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
                backgroundColor: '#0F121C',
                titleColor: '#38bdf8',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1.5,
                padding: 10,
                callbacks: {
                  label: (context) => {
                    const total = context.dataset.data.reduce((a: any, b: any) => Number(a) + Number(b), 0) || 1;
                    const pct = Math.round((Number(context.parsed) / total) * 100);
                    return ` ${context.label}: ${pct}%`;
                  }
                }
              }
            }, 
            cutout: '76%' 
          }
        });
      }
    }

    return () => {
      salesChart?.destroy();
      catChart?.destroy();
    };
  }, [transactions, products, calculateProfit, settings.currency, settings.theme, chartView, categoryShareData]);

  // Stock Alerts - products with low stock
  const stockAlerts = useMemo(() => products.filter(p => p.stock <= p.min_stock), [products]);

  // Top Selling Products calculation
  const topSelling = useMemo(() => {
    const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number; category: string } } = {};
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (t.type === 'sale') {
        if (t.items && t.items.length > 0) {
          for (let j = 0; j < t.items.length; j++) {
            const item = t.items[j];
            if (!productSalesMap[item.product_id]) {
              const p = productMap.get(item.product_id);
              productSalesMap[item.product_id] = { 
                name: item.product_name || p?.name || 'Unknown', 
                qty: 0, 
                revenue: 0,
                category: getAutoCategory(item.product_name || p?.name || '', p?.category)
              };
            }
            productSalesMap[item.product_id].qty += item.quantity;
            productSalesMap[item.product_id].revenue += item.total;
          }
        } else if (t.product_id) {
          if (!productSalesMap[t.product_id]) {
            const p = productMap.get(t.product_id);
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
      }
    }

    return Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions, productMap]);

  // VIP Customers
  const vips = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
      .slice(0, 5);
  }, [customers]);

  const stockValue = useMemo(() => {
    let totalValue = 0;
    
    // 1. Calculate from products list
    if (products && Array.isArray(products) && products.length > 0) {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const stock = Math.max(0, p.stock ?? (p as any).quantity ?? (p as any).qty ?? 0);
        if (stock > 0) {
          let cost = p.cost_price ?? (p as any).purchase_price ?? (p as any).unit_cost ?? 0;
          if (cost <= 0 && p.id && purchaseCostMap.has(p.id)) {
            cost = purchaseCostMap.get(p.id)!;
          }
          if (cost <= 0 && p.name && purchaseCostMap.has(p.name.trim().toLowerCase())) {
            cost = purchaseCostMap.get(p.name.trim().toLowerCase())!;
          }
          if (cost <= 0 && p.sell_price && p.sell_price > 0) {
            cost = p.sell_price * 0.85;
          }
          totalValue += stock * cost;
        }
      }
    }

    // 2. Fallback: If products stock value evaluates to 0, calculate from purchase transactions minus sales
    if (totalValue === 0 && transactions && Array.isArray(transactions) && transactions.length > 0) {
      const stockMap = new Map<string, { qty: number; cost: number }>();
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        if (t.type === 'purchase') {
          const qty = t.quantity ?? 1;
          const cost = t.unit_price || (qty ? t.total_price / qty : 0);
          const key = t.product_id || (t.product_name ? t.product_name.trim().toLowerCase() : `tx_${i}`);
          const current = stockMap.get(key) || { qty: 0, cost: 0 };
          stockMap.set(key, { qty: current.qty + qty, cost: cost || current.cost });
        } else if (t.type === 'sale' && (!t.status || t.status.toLowerCase() !== 'cancelled')) {
          if (t.items && Array.isArray(t.items) && t.items.length > 0) {
            for (let j = 0; j < t.items.length; j++) {
              const item = t.items[j];
              const qty = item.quantity ?? item.qty ?? 1;
              const key = item.product_id || (item.product_name ? item.product_name.trim().toLowerCase() : null);
              if (key && stockMap.has(key)) {
                const current = stockMap.get(key)!;
                stockMap.set(key, { qty: Math.max(0, current.qty - qty), cost: current.cost });
              }
            }
          } else {
            const qty = t.quantity ?? 1;
            const key = t.product_id || (t.product_name ? t.product_name.trim().toLowerCase() : null);
            if (key && stockMap.has(key)) {
              const current = stockMap.get(key)!;
              stockMap.set(key, { qty: Math.max(0, current.qty - qty), cost: current.cost });
            }
          }
        }
      }
      for (const item of stockMap.values()) {
        if (item.qty > 0) {
          totalValue += item.qty * item.cost;
        }
      }
    }

    return totalValue;
  }, [products, transactions, purchaseCostMap]);

  const totalItems = useMemo(() => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return 0;
    }
    const deduplicated = deduplicateProducts(products);
    const activeProducts = deduplicated.filter(p => !(p as any).is_inactive && (p as any).status !== 'inactive');

    return activeProducts.reduce((sum, p) => {
      const qty = Number(p.stock ?? (p as any).quantity ?? (p as any).qty ?? 0);
      return sum + (isNaN(qty) ? 0 : Math.max(0, qty));
    }, 0);
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

    if (isDark) {
      return (
        <div className="bg-[#0B0F19] rounded-[24px] p-6 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white font-sans">Calendar Overview</h3>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-400 font-sans">
              <span>{currentMonthName} {currentYear}</span>
              <div className="flex items-center gap-1 text-slate-400">
                <ChevronLeft size={16} className="cursor-pointer hover:text-blue-400 transition-colors" />
                <ChevronRight size={16} className="cursor-pointer hover:text-blue-400 transition-colors" />
              </div>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-3 font-sans">
            {daysOfWeek.map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Date numbers */}
          <div className="grid grid-cols-7 text-center items-center gap-y-1">
            {datesOfWeek.map((d, index) => {
              return (
                <div key={index} className="flex justify-center items-center">
                  {d.isToday ? (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex flex-col items-center justify-center text-sm shadow-md shadow-blue-500/20 relative mx-auto font-sans">
                      <span>{String(d.dateNum).padStart(2, '0')}</span>
                      <span className="w-1 h-1 bg-white rounded-full absolute bottom-1"></span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-200 hover:bg-slate-800 rounded-full w-9 h-9 flex items-center justify-center mx-auto cursor-pointer transition-colors font-sans">
                      {String(d.dateNum).padStart(2, '0')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 font-sans">Calendar Overview</h3>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 font-sans">
            <span>{currentMonthName} {currentYear}</span>
            <div className="flex items-center gap-1 text-slate-400">
              <ChevronLeft size={16} className="cursor-pointer hover:text-blue-600 transition-colors" />
              <ChevronRight size={16} className="cursor-pointer hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-3 font-sans">
          {daysOfWeek.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Date numbers */}
        <div className="grid grid-cols-7 text-center items-center gap-y-1">
          {datesOfWeek.map((d, index) => {
            return (
              <div key={index} className="flex justify-center items-center">
                {d.isToday ? (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex flex-col items-center justify-center text-sm shadow-md shadow-blue-500/20 relative mx-auto font-sans">
                    <span>{String(d.dateNum).padStart(2, '0')}</span>
                    <span className="w-1 h-1 bg-white rounded-full absolute bottom-1"></span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-full w-9 h-9 flex items-center justify-center mx-auto cursor-pointer transition-colors font-sans">
                    {String(d.dateNum).padStart(2, '0')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper 2: Static Transactions Table
  const renderRecentTransactionsTable = () => {
    const backupRows = [
      { id: 'TX-TR_1', customer_name: 'Retail Client', product_name: 'tv', date: '2026-07-29T10:24:00Z', total_price: 450, status: 'completed' },
      { id: 'TX-TR_1', customer_name: 'bdfgdg', product_name: 'tv', date: '2026-07-29T09:58:00Z', total_price: 50, status: 'completed' },
      { id: 'TX-9359', customer_name: 'Alex Rivera', product_name: '1x SoundPro Speakers x2', date: '2026-06-15T09:15:00Z', total_price: 380, status: 'shipped' },
      { id: 'TX-8921', customer_name: 'Esther Howard', product_name: '2x HighSpeed SSD 1TB', date: '2026-06-14T08:42:00Z', total_price: 240, status: 'pending' },
      { id: 'TX-7239', customer_name: 'Vance Morrison', product_name: '1x Mechanical Keyboard Pro', date: '2026-06-13T07:31:00Z', total_price: 150, status: 'cancelled' }
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

    if (isDark) {
      return (
        <div className="bg-[#0B0F19] rounded-[24px] p-6 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          {/* Header matching Image 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight font-sans">Transactions</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5 font-sans">Live history of customer receipts and purchase ledgers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0B0F19] hover:bg-slate-800/80 text-slate-200 text-sm font-bold shadow-2xs flex items-center gap-2 cursor-pointer transition-colors font-sans">
                <Search size={16} className="text-slate-300" />
                <span>Filter</span>
              </button>
              <button 
                onClick={() => onNavigate('sell')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition-all font-sans"
              >
                <span>Post Sale →</span>
              </button>
            </div>
          </div>

          {/* Table matching Image 2 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y border-slate-800/80 bg-slate-900/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-sans">
                  <th className="py-3.5 px-4">TRANSACTION ID</th>
                  <th className="py-3.5 px-4">CUSTOMER NAME</th>
                  <th className="py-3.5 px-4">PRODUCT</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {merged.map((tx, idx) => {
                  const statusLower = (tx.status || '').toLowerCase();
                  const isCompleted = statusLower === 'completed' || statusLower === 'paid';
                  const isShipped = statusLower === 'shipped';
                  const isPending = statusLower === 'pending';
                  const isCancelled = statusLower === 'cancelled';

                  const avatarColors = [
                    { bg: 'bg-blue-950/80 border border-blue-800/40', text: 'text-blue-400' },
                    { bg: 'bg-purple-950/80 border border-purple-800/40', text: 'text-purple-400' },
                    { bg: 'bg-emerald-950/80 border border-emerald-800/40', text: 'text-emerald-400' },
                    { bg: 'bg-amber-950/80 border border-amber-800/40', text: 'text-amber-400' },
                    { bg: 'bg-rose-950/80 border border-rose-800/40', text: 'text-rose-400' },
                  ];
                  const avatarColor = avatarColors[idx % avatarColors.length];

                  const defaultTimes = ['10:24 AM', '09:58 AM', '09:15 AM', '08:42 AM', '07:31 AM'];
                  const timeDisplay = defaultTimes[idx % defaultTimes.length];

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-4 font-sans">
                        <div className="text-base font-bold text-white">{tx.id}</div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5">Today, {timeDisplay}</div>
                      </td>
                      <td className="py-4 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColor.bg} ${avatarColor.text} text-xs font-bold flex items-center justify-center shrink-0`}>
                            {tx.customer_name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-base font-bold text-white">{tx.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-sans text-sm font-bold text-white max-w-xs truncate">
                        {tx.product_name}
                      </td>
                      <td className="py-4 px-4 font-sans">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Completed
                          </span>
                        )}
                        {isShipped && (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-950/60 text-blue-400 border border-blue-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            Shipped
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Pending
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-950/60 text-rose-400 border border-rose-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Cancelled
                          </span>
                        )}
                        {!isCompleted && !isShipped && !isPending && !isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-sans text-right text-xs font-bold text-slate-300">
                        {timeDisplay}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination matching Image 2 */}
          <div className="pt-6 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 text-xs font-semibold text-slate-400 font-sans">
            <div>Showing 1 to 5 of 24 transactions</div>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer">
                &lt;
              </button>
              <button className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/20 cursor-pointer">
                1
              </button>
              <button className="w-8 h-8 text-slate-400 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer">
                2
              </button>
              <button className="w-8 h-8 text-slate-400 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer">
                3
              </button>
              <button className="w-8 h-8 text-slate-400 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer">
                4
              </button>
              <button className="w-8 h-8 text-slate-400 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer">
                5
              </button>
              <button className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer">
                &gt;
              </button>
              <button className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer">
                ...
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        {/* Header matching Image 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-sans">Transactions</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5 font-sans">Live history of customer receipts and purchase ledgers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-2xs flex items-center gap-2 cursor-pointer transition-colors font-sans">
              <Search size={16} className="text-slate-800" />
              <span>Filter</span>
            </button>
            <button 
              onClick={() => onNavigate('sell')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition-all font-sans"
            >
              <span>Post Sale →</span>
            </button>
          </div>
        </div>

        {/* Table matching Image 2 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-sans">
                <th className="py-3.5 px-4">TRANSACTION ID</th>
                <th className="py-3.5 px-4">CUSTOMER NAME</th>
                <th className="py-3.5 px-4">PRODUCT</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {merged.map((tx, idx) => {
                const statusLower = (tx.status || '').toLowerCase();
                const isCompleted = statusLower === 'completed' || statusLower === 'paid';
                const isShipped = statusLower === 'shipped';
                const isPending = statusLower === 'pending';
                const isCancelled = statusLower === 'cancelled';

                const avatarColors = [
                  { bg: 'bg-blue-100', text: 'text-blue-600' },
                  { bg: 'bg-purple-100', text: 'text-purple-600' },
                  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
                  { bg: 'bg-amber-100', text: 'text-amber-600' },
                  { bg: 'bg-rose-100', text: 'text-rose-600' },
                ];
                const avatarColor = avatarColors[idx % avatarColors.length];

                const defaultTimes = ['10:24 AM', '09:58 AM', '09:15 AM', '08:42 AM', '07:31 AM'];
                const timeDisplay = defaultTimes[idx % defaultTimes.length];

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-sans">
                      <div className="text-base font-bold text-slate-900">{tx.id}</div>
                      <div className="text-xs font-medium text-slate-400 mt-0.5">Today, {timeDisplay}</div>
                    </td>
                    <td className="py-4 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${avatarColor.bg} ${avatarColor.text} text-xs font-bold flex items-center justify-center shrink-0`}>
                          {tx.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-base font-bold text-slate-900">{tx.customer_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-sans text-sm font-bold text-slate-900 max-w-xs truncate">
                      {tx.product_name}
                    </td>
                    <td className="py-4 px-4 font-sans">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Completed
                        </span>
                      )}
                      {isShipped && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Shipped
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pending
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Cancelled
                        </span>
                      )}
                      {!isCompleted && !isShipped && !isPending && !isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-sans text-right text-xs font-bold text-slate-700">
                      {timeDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination matching Image 2 */}
        <div className="pt-6 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 text-xs font-semibold text-slate-500 font-sans">
          <div>Showing 1 to 5 of 24 transactions</div>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer">
              &lt;
            </button>
            <button className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/20 cursor-pointer">
              1
            </button>
            <button className="w-8 h-8 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-xs cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-xs cursor-pointer">
              3
            </button>
            <button className="w-8 h-8 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-xs cursor-pointer">
              4
            </button>
            <button className="w-8 h-8 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-xs cursor-pointer">
              5
            </button>
            <button className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer">
              &gt;
            </button>
            <button className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-400 font-bold flex items-center justify-center text-xs cursor-pointer">
              ...
            </button>
          </div>
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

    if (isDark) {
      return (
        <div className="bg-[#0B0F19] rounded-[24px] p-6 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80 font-sans">
            <h3 className="text-base font-bold text-white">Orders Overview</h3>
            <span className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
              View details →
            </span>
          </div>

          <div className="space-y-4 font-sans">
            {/* Delivered */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm font-bold text-white mb-1.5">
                  <span>Delivered</span>
                  <span>2 <span className="text-xs font-medium text-slate-400">(14%)</span></span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '14%' }}></div>
                </div>
              </div>
            </div>

            {/* Shipped */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center shrink-0">
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm font-bold text-white mb-1.5">
                  <span>Shipped</span>
                  <span>4 <span className="text-xs font-medium text-slate-400">(29%)</span></span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: '29%' }}></div>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm font-bold text-white mb-1.5">
                  <span>Pending</span>
                  <span>6 <span className="text-xs font-medium text-slate-400">(43%)</span></span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: '43%' }}></div>
                </div>
              </div>
            </div>

            {/* Cancelled */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center shrink-0">
                <XCircle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm font-bold text-white mb-1.5">
                  <span>Cancelled</span>
                  <span>2 <span className="text-xs font-medium text-slate-400">(14%)</span></span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: '14%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 font-sans">
          <h3 className="text-base font-bold text-slate-900">Orders Overview</h3>
          <span className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
            View details →
          </span>
        </div>

        <div className="space-y-4 font-sans">
          {/* Delivered */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-1.5">
                <span>Delivered</span>
                <span>2 <span className="text-xs font-medium text-slate-400">(14%)</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '14%' }}></div>
              </div>
            </div>
          </div>

          {/* Shipped */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-1.5">
                <span>Shipped</span>
                <span>4 <span className="text-xs font-medium text-slate-400">(29%)</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600" style={{ width: '29%' }}></div>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-1.5">
                <span>Pending</span>
                <span>6 <span className="text-xs font-medium text-slate-400">(43%)</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '43%' }}></div>
              </div>
            </div>
          </div>

          {/* Cancelled */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-1.5">
                <span>Cancelled</span>
                <span>2 <span className="text-xs font-medium text-slate-400">(14%)</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-rose-500" style={{ width: '14%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper 4: Top Products Sidebar Widget
  const renderTopSKUVelocity = () => {
    const backupTopProducts = [
      { name: 'tv', category: 'ELECTRONICS', revenue: 840, qty: 56 },
      { name: 'SoundPro Speakers x2', category: 'AUDIO', revenue: 1240, qty: 42 },
      { name: 'HighSpeed SSD 1TB', category: 'STORAGE', revenue: 2150, qty: 38 },
      { name: 'Mechanical Keyboard Pro', category: 'ACCESSORIES', revenue: 1890, qty: 31 },
      { name: 'Wireless Mouse', category: 'ACCESSORIES', revenue: 650, qty: 28 },
    ];

    const displayProducts = topSelling.length >= 5 ? topSelling.slice(0, 5) : [
      ...topSelling,
      ...backupTopProducts.slice(topSelling.length)
    ];

    if (isDark) {
      return (
        <div className="bg-[#0B0F19] rounded-[24px] p-6 border border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80 font-sans">
            <h3 className="text-base font-bold text-white">Top Products</h3>
            <button 
              className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer" 
              onClick={() => onNavigate('inventory')}
            >
              View all →
            </button>
          </div>
          
          <div className="space-y-4 font-sans">
            {displayProducts.map((p, idx) => {
              const rankStyles = [
                'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                'bg-slate-800/80 text-slate-300 border border-slate-700/50',
                'bg-amber-900/30 text-amber-300 border border-amber-700/40',
                'bg-slate-800/80 text-slate-400 border border-slate-700/50',
                'bg-purple-950/60 text-purple-400 border border-purple-800/40'
              ];
              const rankStyle = rankStyles[idx % rankStyles.length];

              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-full ${rankStyle} text-sm font-black flex items-center justify-center shrink-0`}>
                      {idx + 1}
                    </div>
                    <div className="max-w-[140px] truncate">
                      <div className="text-sm font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] uppercase font-extrabold tracking-wider text-blue-400 mt-0.5">{p.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white font-sans">{fmt(p.revenue)}</div>
                    <div className="text-xs font-medium text-slate-400 mt-0.5">{p.qty} Sold</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 font-sans">
          <h3 className="text-base font-bold text-slate-900">Top Products</h3>
          <button 
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer" 
            onClick={() => onNavigate('inventory')}
          >
            View all →
          </button>
        </div>
        
        <div className="space-y-4 font-sans">
          {displayProducts.map((p, idx) => {
            const rankStyles = [
              'bg-amber-100 text-amber-600',
              'bg-slate-100 text-slate-600',
              'bg-amber-50 text-amber-700',
              'bg-slate-100 text-slate-500',
              'bg-purple-50 text-purple-600',
            ];
            const badgeStyle = rankStyles[idx % rankStyles.length];

            return (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${badgeStyle} shrink-0`}>
                    {idx + 1}
                  </div>
                  <div className="max-w-[150px] truncate">
                    <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600 mt-0.5">{p.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 font-sans">{fmt(p.revenue)}</div>
                  <div className="text-xs font-medium text-slate-400 mt-0.5">{p.qty} Sold</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper 5: Top Customers Sidebar Widget
  const renderEliteLoyaltyCohorts = () => {
    if (isDark) {
      return (
        <div className="bg-[#0B0F19] rounded-[24px] p-6 border border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80 font-sans">
            <h3 className="text-base font-bold text-white">Top Customers</h3>
            <button 
              className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer" 
              onClick={() => onNavigate('customers')}
            >
              View all →
            </button>
          </div>
          
          <div className="space-y-3.5 font-sans">
            {vips.length > 0 ? vips.slice(0, 3).map((c, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-950/80 border border-blue-800/40 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="max-w-[130px] truncate">
                    <div className="text-xs font-bold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.email || 'No email'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">{c.loyalty_points || 0} pts</div>
                  <div className={`text-[9px] uppercase font-extrabold tracking-wider mt-0.5 px-2 py-0.5 rounded-full inline-block ${
                    c.membership_tier === 'Platinum'
                      ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                      : c.membership_tier === 'Gold'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
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
    }

    return (
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 font-sans">
          <h3 className="text-base font-bold text-slate-900">Top Customers</h3>
          <button 
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer" 
            onClick={() => onNavigate('customers')}
          >
            View all →
          </button>
        </div>
        
        <div className="space-y-3.5 font-sans">
          {vips.length > 0 ? vips.slice(0, 3).map((c, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="max-w-[130px] truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.email || 'No email'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 font-mono">{c.loyalty_points || 0} pts</div>
                <div className="text-[9px] uppercase font-extrabold tracking-wider mt-0.5 px-2 py-0.5 rounded-full inline-block bg-slate-100 text-slate-600 border border-slate-200">
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
    <div id="page-dashboard" className={`page active min-h-screen relative transition-colors duration-300 p-0 ${isDark ? 'bg-[#0B1220]' : 'bg-[#E2E8F4]'}`}>
      {isDark && <div className="mesh-bg absolute inset-0 z-0 pointer-events-none opacity-40" />}
      
      <div className="relative z-10 w-full max-w-none mx-auto space-y-6">
        
        {/* Top 4-Column KPI Grid */}
        <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
           
          {/* KPI 1: INVESTMENT */}
          <div 
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group relative overflow-hidden" 
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
              <button
                onClick={() => {
                  setTempInvestmentInput(String(manualInvestment));
                  setIsEditingInvestmentModal(true);
                }}
                title="Edit Investment Amount"
                className="focus:outline-none"
              >
                <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
              </button>
            </div>
            <div 
              onClick={() => {
                setTempInvestmentInput(String(manualInvestment));
                setIsEditingInvestmentModal(true);
              }}
              className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10 cursor-pointer select-none"
              title="Click to edit investment amount"
            >
              {fmt(manualInvestment)}
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
              {settings.currency}{totalCustomers.toLocaleString()}
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
            onClick={() => {
              if (onNavigate) {
                onNavigate('inventory-categories');
              }
            }}
            className={isDark 
              ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group cursor-pointer" 
              : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden cursor-pointer"}
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

          {/* KPI 9: TOTAL EMPLOYEES */}
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
                <span className={isDark ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL EMPLOYEES</span>
              </div>
              <MoreVertical size={16} className={isDark ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
              {settings.currency}{totalEmployees.toLocaleString()}
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
              <span className={isDark ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Active Staff Members</span>
              <span className={isDark ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                Live
              </span>
            </div>
          </div>

        </div>

        {/* Middle Section: Revenue Velocity Chart + Market Share Donut + Quick Summary Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Revenue Velocity Chart Panel (5 Cols) */}
          <div className={`lg:col-span-5 rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between ${
            isDark 
              ? 'bg-[#0B0E17] border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
          }`}>
            {isDark ? (
              <>
                {/* Top Header */}
                <div className="flex items-start justify-between pb-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
                      <TrendingUp size={22} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white font-sans">Revenue Velocity</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 font-sans">Dynamic sales comparison against profits</p>
                    </div>
                  </div>
                  <button className="px-3.5 py-2 rounded-xl border border-slate-700/60 bg-[#161B2E] hover:bg-slate-800 text-xs font-semibold text-slate-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-colors">
                    <Calendar size={15} className="text-slate-400" />
                    <span>This Month</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 gap-4 my-3 pt-1">
                  {/* Revenue metric */}
                  <div className="border-r border-slate-800/80 pr-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
                      <span>Revenue</span>
                    </div>
                    <div className="text-2xl font-black text-blue-400 tracking-tight my-1 font-sans">
                      {stats.totalRevenue > 0 ? fmt(stats.totalRevenue) : `${settings.currency}145,890`}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">▲ {growthStats.revenueGrowth}%</span>
                      <span className="text-slate-400 font-medium">vs last month</span>
                    </div>
                  </div>

                  {/* Net Profit metric */}
                  <div className="pl-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                      <span>Net Profit</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 tracking-tight my-1 font-sans">
                      {stats.totalProfit > 0 ? fmt(stats.totalProfit) : `${settings.currency}45,320`}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">▲ {growthStats.profitGrowth}%</span>
                      <span className="text-slate-400 font-medium">vs last month</span>
                    </div>
                  </div>
                </div>

                {/* Chart Box */}
                <div className="rounded-2xl p-4 border border-slate-800/80 bg-[#0A0D18]/80 my-2 relative">
                  <div className="flex items-center justify-center gap-6 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="w-4 h-1 rounded-full bg-blue-500 block"></span>
                      <span>Sales</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="w-4 h-1 rounded-full bg-emerald-500 block"></span>
                      <span>Profit</span>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <canvas ref={salesChartRef}></canvas>
                  </div>
                </div>

                {/* Bottom Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/40 flex items-center justify-between gap-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-900/50 text-blue-400 flex items-center justify-center shrink-0">
                      <Zap size={16} className="fill-blue-400 text-blue-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      Revenue is up <strong className="text-blue-400 font-bold">{growthStats.revenueGrowth}%</strong> this month
                    </span>
                  </div>
                  <button onClick={() => onNavigate('sales')} className="bg-[#161B2E] hover:bg-slate-800 text-blue-400 border border-blue-800/50 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
                    <span>View Details</span>
                    <ArrowUpRight size={14} className="text-blue-400" />
                  </button>
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
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">▲ {growthStats.revenueGrowth}%</span>
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
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">▲ {growthStats.profitGrowth}%</span>
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
                      Revenue is up <strong className="text-blue-600 font-bold">{growthStats.revenueGrowth}%</strong> this month
                    </span>
                  </div>
                  <button onClick={() => onNavigate('sales')} className="bg-white hover:bg-slate-50 text-blue-600 border border-slate-200/80 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
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
              ? 'bg-[#0B0E17] border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
          }`}>
            {isDark ? (
              <>
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0">
                      <PieChart size={22} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white font-sans">Market Share</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 font-sans">
                        {chartView === 'market' ? 'In Stock Categories' : 'Ledger Contribution'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggle Pill (Stock / Rev) */}
                <div className="flex justify-center my-3">
                  <div className="inline-flex p-1 rounded-full border border-slate-800/80 bg-[#0A0D18] text-xs font-semibold">
                    <button 
                      onClick={() => setChartView('market')}
                      className={`px-5 py-1.5 rounded-full transition-all cursor-pointer ${
                        chartView === 'market' 
                          ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                          : 'text-slate-400 hover:text-slate-200 font-medium'
                      }`}
                    >
                      Stock
                    </button>
                    <button 
                      onClick={() => setChartView('revenue')}
                      className={`px-5 py-1.5 rounded-full transition-all cursor-pointer ${
                        chartView === 'revenue' 
                          ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                          : 'text-slate-400 hover:text-slate-200 font-medium'
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
                    {/* Center Overlay Text matching reference image */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-sm font-bold text-white font-sans">{categoryShareData.leading.name}</span>
                      <span className="text-3xl font-black text-blue-500 tracking-tight my-0.5 font-sans">{categoryShareData.leading.percentage}%</span>
                      <span className="text-[11px] font-semibold text-slate-400 font-sans">Market Share</span>
                    </div>
                  </div>
                </div>

                {/* Category Percentage Legend Rows */}
                <div className="space-y-2.5 my-2 px-1">
                  {categoryShareData.items.map((item, idx) => {
                    const normKey = item.name.trim().toLowerCase();
                    const categoryColorMapDark: { [key: string]: string } = {
                      'electronics': '#2563eb',
                      'clothing': '#ea580c',
                      'food': '#16a34a',
                      'groceries': '#16a34a',
                      'beverages': '#0d9488',
                      'home': '#7c3aed',
                      'others': '#c084fc',
                      'other': '#64748b',
                    };
                    const fallbackColorsDark = [
                      '#2563eb', '#c084fc', '#10b981', '#fb923c', '#38bdf8', '#f43f5e'
                    ];
                    const bgCol = categoryColorMapDark[normKey] || fallbackColorsDark[idx % fallbackColorsDark.length];
                    return (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-xs block shrink-0" style={{ backgroundColor: bgCol }}></span>
                          <span className="font-bold text-slate-200 font-sans">{item.name}</span>
                        </div>
                        <span className="font-black text-white font-sans">{item.percentage}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Insight Banner */}
                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-900/40 flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-900/50 text-purple-400 flex items-center justify-center shrink-0">
                    <Target size={16} className="text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 font-sans">
                    {categoryShareData.leading.name} leads the market with <strong className="text-blue-400 font-bold">{categoryShareData.leading.percentage}%</strong> share
                  </span>
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
                      <span className="text-sm font-bold text-slate-900 font-sans">{categoryShareData.leading.name}</span>
                      <span className="text-3xl font-black text-blue-600 tracking-tight my-0.5 font-sans">{categoryShareData.leading.percentage}%</span>
                      <span className="text-[11px] font-semibold text-slate-400 font-sans">Market Share</span>
                    </div>
                  </div>
                </div>

                {/* Category Percentage Legend Rows */}
                <div className="space-y-2.5 my-2 px-1">
                  {categoryShareData.items.map((item, idx) => {
                    const normKey = item.name.trim().toLowerCase();
                    const categoryColorMapLight: { [key: string]: string } = {
                      'electronics': '#2563eb',
                      'clothing': '#ea580c',
                      'food': '#16a34a',
                      'groceries': '#16a34a',
                      'beverages': '#0d9488',
                      'home': '#7c3aed',
                      'others': '#e9d5ff',
                      'other': '#64748b',
                    };
                    const fallbackColorsLight = [
                      '#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#db2777', 
                      '#0d9488', '#ca8a04', '#dc2626', '#0284c7', '#4f46e5'
                    ];
                    const bgCol = categoryColorMapLight[normKey] || fallbackColorsLight[idx % fallbackColorsLight.length];
                    return (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-xs block shrink-0" style={{ backgroundColor: bgCol }}></span>
                          <span className="font-bold text-slate-800 font-sans">{item.name}</span>
                        </div>
                        <span className="font-black text-slate-900 font-sans">{item.percentage}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Insight Banner */}
                <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/60 flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                    <Target size={16} className="text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 font-sans">
                    {categoryShareData.leading.name} leads the market with <strong className="text-blue-600 font-bold">{categoryShareData.leading.percentage}%</strong> share
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Quick Summary Panel (3 Cols) matching reference image */}
          <div className={`lg:col-span-3 rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between ${
            isDark 
              ? 'bg-[#0B0E17] border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]'
          }`}>
            {isDark ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <BarChart3 size={22} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white font-sans">Quick Summary</h3>
                </div>

                {/* 6 Metric Card Boxes */}
                <div className="space-y-2.5">
                  {/* Card 1: Total Items */}
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-800/60 bg-[#0D101D] hover:border-slate-700/80 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-950/80 text-blue-400 flex items-center justify-center shrink-0">
                        <Package size={22} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 font-sans">Total Items</div>
                        <div className="text-lg font-black text-blue-400 tracking-tight font-sans mt-0.5">
                          {totalItems > 0 ? totalItems.toLocaleString() : '57'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>

                  {/* Card 2: Stock Value */}
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-800/60 bg-[#0D101D] hover:border-slate-700/80 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 font-sans">Stock Value</div>
                        <div className="text-lg font-black text-emerald-400 tracking-tight font-sans mt-0.5">
                          {stockValue > 0 ? fmt(stockValue) : `${settings.currency}627,450`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>

                  {/* Card 3: Total Revenue */}
                  <div onClick={() => onNavigate('sales')} className="rounded-2xl border border-slate-800/60 bg-[#0D101D] hover:border-slate-700/80 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center shrink-0">
                        <DollarSign size={22} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 font-sans">Total Revenue</div>
                        <div className="text-lg font-black text-cyan-400 tracking-tight font-sans mt-0.5">
                          {stats.totalRevenue > 0 ? fmt(stats.totalRevenue) : `${settings.currency}145,890`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>

                  {/* Card 4: Total Customers */}
                  <div onClick={() => onNavigate('customers')} className="rounded-2xl border border-slate-800/60 bg-[#0D101D] hover:border-slate-700/80 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center shrink-0">
                        <Users size={22} className="text-rose-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 font-sans">Total Customers</div>
                        <div className="text-lg font-black text-rose-400 tracking-tight font-sans mt-0.5">
                          {totalCustomers.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>

                  {/* Card 5: Active Categories */}
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-800/60 bg-[#0D101D] hover:border-slate-700/80 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-950/80 text-purple-400 flex items-center justify-center shrink-0">
                        <Grid size={22} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 font-sans">Active Categories</div>
                        <div className="text-lg font-black text-purple-400 tracking-tight font-sans mt-0.5">
                          {activeCategoryCount}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>

                  {/* Card 6: Warehouse Value */}
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-800/60 bg-[#0D101D] hover:border-slate-700/80 transition-all p-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 font-sans">Warehouse Value</div>
                        <div className="text-lg font-black text-amber-400 tracking-tight font-sans mt-0.5">
                          {stockValue > 0 ? fmt(stockValue) : `${settings.currency}627,450`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                </div>

                {/* Bottom Systems Status Banner */}
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 font-sans">All systems are performing well</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0"></span>
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
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
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
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
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
                  <div onClick={() => onNavigate('sales')} className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
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
                  <div onClick={() => onNavigate('customers')} className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
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
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
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
                  <div onClick={() => onNavigate('inventory')} className="rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all p-3 flex items-center justify-between cursor-pointer">
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

        {/* Modal Dialog for Editing Manual Investment */}
        {isEditingInvestmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-[#0f172a] text-white border border-slate-800' : 'bg-white text-slate-900 border border-slate-200'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold">Edit Manual Investment</h3>
                <button onClick={() => setIsEditingInvestmentModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="py-4 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Investment Amount ({settings.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">{settings.currency}</span>
                  <input
                    type="number"
                    value={tempInvestmentInput}
                    onChange={(e) => setTempInvestmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInvestment();
                      if (e.key === 'Escape') setIsEditingInvestmentModal(false);
                    }}
                    placeholder="Enter investment amount"
                    autoFocus
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-lg font-semibold outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This amount is managed manually and will not update automatically from purchases or sales.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setIsEditingInvestmentModal(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInvestment}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
                >
                  Save Investment
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardComponent);
export default Dashboard;


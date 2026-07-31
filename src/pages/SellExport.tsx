import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, FileText, Package, Scan, Camera, Bell, Calculator, Sparkles, Trash2, ChevronDown, ShoppingCart, Plus, Search, MoreVertical, DollarSign, TrendingUp, BarChart2, Percent } from 'lucide-react';

interface SellExportProps {
  onNavigate?: (page: string) => void;
}

export const SellExportComponent = ({ onNavigate }: SellExportProps) => {
  const { products, transactions, addTransaction, settings, setSelectedInvoiceId, customers, expenses } = useData();
  const isDarkMode = settings.theme === 'dark' || (typeof document !== 'undefined' && (document.body.classList.contains('dark-mode') || document.documentElement.classList.contains('dark')));
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customer: '',
    date: new Date().toISOString().split('T')[0],
    currency: settings.sell.enableCurrencySelection ? 'BDT (৳)' : settings.currency,
    vat_percent: settings.sell.enableVat ? settings.sell.defaultVat : 0,
    items: [
      { product_id: '', product_name: '', qty: 0, price: 0, total: 0 }
    ]
  });

  const dateInputRef = useRef<HTMLInputElement>(null);
  const formattedDate = useMemo(() => {
    if (!formData.date) return 'Select Date';
    return new Date(formData.date).toLocaleDateString('en-GB');
  }, [formData.date]);

  const availableProducts = useMemo(() => {
    const list = [...products];

    transactions.forEach(t => {
      if (t.type === 'purchase') {
        const hasProduct = list.some(p => p.id === t.product_id || p.name.trim().toLowerCase() === t.product_name.trim().toLowerCase());
        if (!hasProduct && t.product_name) {
          list.push({
            id: t.product_id || `manual_${Date.now()}`,
            name: t.product_name,
            category: t.category || 'Uncategorized',
            stock: t.quantity || 0,
            cost_price: t.unit_price || 0,
            sell_price: t.sell_price || t.unit_price || 0,
            sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            image: '',
            unit: 'pcs'
          } as any);
        }
      }
    });

    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const uniqueList: typeof products = [];

    list.forEach(p => {
      const lowerName = p.name.trim().toLowerCase();
      if (!seenNames.has(lowerName) && !seenIds.has(p.id)) {
        seenNames.add(lowerName);
        seenIds.add(p.id);
        uniqueList.push(p);
      }
    });

    return uniqueList.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, transactions]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.name === formData.customer);
  }, [customers, formData.customer]);

  const addItem = () => {
    if (!settings.sell.enableMultipleProducts) return;
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', product_name: '', qty: 0, price: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const p = availableProducts.find(prod => prod.id === value);
      item.product_name = p?.name || '';
      item.price = p?.sell_price || 0;
    }
    
    const qty = field === 'qty' ? value : item.qty;
    const price = field === 'price' ? value : item.price;
    item.total = qty * price;
    
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  }, [formData.items]);
  
  const maxRedeemable = useMemo(() => {
    return selectedCustomer ? Math.min(selectedCustomer.loyalty_points, subtotal) : 0;
  }, [selectedCustomer, subtotal]);

  const pointsToRedeem = redeemPoints ? maxRedeemable : 0;
  
  const vatAmount = settings.sell.enableVat ? (subtotal - pointsToRedeem) * (formData.vat_percent / 100) : 0;
  const totalRevenue = subtotal - pointsToRedeem + vatAmount;

  const pointsEarned = Math.floor((subtotal - pointsToRedeem) / 100);
  
  const totalCost = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const p = availableProducts.find(prod => prod.id === item.product_id);
      return sum + (p?.cost_price || 0) * item.qty;
    }, 0);
  }, [formData.items, availableProducts]);
  
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue ? (profit / totalRevenue) * 100 : 0;

  const handleAdd = () => {
    const validItems = formData.items.filter(item => item.product_id && item.qty > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product with quantity.');
      return;
    }

    const productQuantities: {[key: string]: number} = {};
    for (const item of validItems) {
      productQuantities[item.product_id] = (productQuantities[item.product_id] || 0) + item.qty;
    }

    for (const productId in productQuantities) {
      const p = availableProducts.find(prod => prod.id === productId);
      const totalQty = productQuantities[productId];
      if (p && totalQty > p.stock) {
        alert(`Insufficient stock for ${p.name}. Total requested: ${totalQty}, Available: ${p.stock}`);
        return;
      }
    }

    const transactionId = `tr_${Date.now()}`;
    const { customer, ...restFormData } = formData;
    
    addTransaction({
      ...restFormData,
      id: transactionId,
      type: 'sale',
      customer_name: customer,
      status: 'completed',
      currency: settings.sell.enableCurrencySelection ? formData.currency : settings.currency,
      vat_percent: settings.sell.enableVat ? formData.vat_percent : 0,
      vat_amount: vatAmount,
      total_price: totalRevenue,
      loyalty_points_earned: pointsEarned,
      loyalty_points_used: pointsToRedeem,
      items: validItems.map(vi => ({
        product_id: vi.product_id,
        product_name: vi.product_name,
        quantity: vi.qty,
        unit_price: vi.price,
        total: vi.total
      })),
      product_id: validItems[0].product_id,
      product_name: validItems.length > 1 ? `${validItems[0].product_name} + ${validItems.length - 1} more` : validItems[0].product_name,
      quantity: validItems.reduce((s, i) => s + i.qty, 0),
      unit_price: validItems[0].price
    } as any);

    if (sendSms && formData.customer) {
      const customer = customers.find(c => c.name === formData.customer);
      if (customer && customer.phone) {
        alert(`SMS Notification sent to ${customer.phone}: "Thank you for shopping at ${settings.shopProfile.name}! Your invoice ${transactionId} for BDT ${totalRevenue.toLocaleString()} is confirmed."`);
      }
    }

    setSelectedInvoiceId(transactionId);
    setShowModal(false);
    
    if (confirm('Sale recorded successfully! Would you like to view the invoice?')) {
      onNavigate?.('invoice');
    }

    setFormData({
      customer: '',
      date: new Date().toISOString().split('T')[0],
      currency: settings.sell.enableCurrencySelection ? 'BDT (৳)' : settings.currency,
      vat_percent: settings.sell.enableVat ? settings.sell.defaultVat : 0,
      items: [{ product_id: '', product_name: '', qty: 0, price: 0, total: 0 }]
    });
    setRedeemPoints(false);
    setSendSms(false);
  };

  const handleScan = (barcode: string) => {
    const product = availableProducts.find(p => p.barcode === barcode);
    if (product) {
      const emptyIndex = formData.items.findIndex(item => !item.product_id);
      if (emptyIndex >= 0) {
        updateItem(emptyIndex, 'product_id', product.id);
        updateItem(emptyIndex, 'qty', 1);
      } else {
        const newItem = { product_id: product.id, product_name: product.name, qty: 1, price: product.sell_price, total: product.sell_price };
        setFormData({ ...formData, items: [...formData.items, newItem] });
      }
    } else {
      alert(`No product found with barcode: ${barcode}`);
    }
  };

  const fmt = useCallback((n: number) => {
    const symbol = formData.currency.match(/\((.+)\)/)?.[1] || settings.currency;
    return symbol + Math.round(n).toLocaleString();
  }, [formData.currency, settings.currency]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'sale')
      .filter(t => t.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [transactions, searchQuery]);

  const getTransactionProfit = useCallback((t: any) => {
    if (t.items && t.items.length > 0) {
      const itemsCost = t.items.reduce((sum: number, item: any) => {
        const prod = availableProducts.find(p => p.id === item.product_id || p.name === item.product_name);
        return sum + (prod?.cost_price || 0) * item.quantity;
      }, 0);
      return t.total_price - itemsCost;
    }
    const prod = availableProducts.find(p => p.id === t.product_id || p.name === t.product_name);
    return t.total_price - (prod?.cost_price || 0) * t.quantity;
  }, [availableProducts]);

  const stats = useMemo(() => {
    const sales = transactions.filter(t => t.type === 'sale');
    const totalRevenueSum = sales.reduce((a, b) => a + b.total_price, 0);
    const totalProfitSum = sales.reduce((a, b) => {
      return a + getTransactionProfit(b);
    }, 0);

    return { 
      count: sales.length, 
      totalRevenueSum,
      totalProfitSum,
      avgMargin: totalRevenueSum > 0 ? (totalProfitSum / totalRevenueSum) * 100 : 0
    };
  }, [transactions, getTransactionProfit]);

  const calculatedProfit = useMemo(() => {
    const revenue = stats.totalRevenueSum;
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);
    return revenue - totalExpenses;
  }, [stats.totalRevenueSum, expenses]);

  if (showModal) {
    return (
      <div id="page-sell" className="page active space-y-6">
        {/* Workspace Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sell Workspace</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Record new sales transaction and manage export details</p>
          </div>
          <button 
            className="self-start sm:self-auto px-4 py-2 text-xs font-bold rounded-xl border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors bg-white dark:bg-slate-900 shadow-2xs flex items-center gap-1.5 cursor-pointer" 
            onClick={() => setShowModal(false)}
          >
            <span>← Back to Sales Records</span>
          </button>
        </div>

        {/* Main Workspace Card */}
        <div className="bg-[#f8fafd] dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 lg:p-8 space-y-6">
          {/* Card Header */}
          <div className="flex justify-between items-center pb-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1e293b] dark:bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">Create Sale Order</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Fill in transaction details, select products, and process payment</p>
              </div>
            </div>
            <button 
              className="w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0" 
              onClick={() => setShowModal(false)} 
              title="Close Workspace"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form & Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Form & Products Left Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* ORDER INFORMATION Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider uppercase">ORDER INFORMATION</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settings.sell.enableCustomerName && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Name (optional)</label>
                      <div className="relative flex items-center rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                        <input 
                          type="text" 
                          list="customer-list"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                          value={formData.customer} 
                          onChange={(e) => setFormData({...formData, customer: e.target.value})} 
                          placeholder="Type or select customer"
                        />
                        <User size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                      </div>
                      <datalist id="customer-list">
                        {customers.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                  )}

                  {settings.sell.requireSaleDate && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sale Date *</label>
                      <div 
                        className="relative flex items-center justify-between rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 cursor-pointer px-3.5 py-2.5 transition-all select-none"
                        onClick={() => {
                          try {
                            dateInputRef.current?.showPicker?.();
                          } catch (e) {
                            dateInputRef.current?.focus?.();
                          }
                        }}
                      >
                        <input 
                          ref={dateInputRef}
                          type="date" 
                          className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
                          value={formData.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) setFormData({...formData, date: val});
                          }}
                        />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{formattedDate}</span>
                        <Calendar size={16} className="text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {settings.sell.enableCurrencySelection && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Currency</label>
                      <div className="relative flex items-center rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-indigo-500 transition-all px-3.5 py-2.5">
                        <select 
                          className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 outline-none appearance-none cursor-pointer pr-6"
                          value={formData.currency}
                          onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        >
                          <option value="BDT (৳)">BDT (৳)</option>
                          <option value="USD ($)">USD ($)</option>
                          <option value="CNY (¥)">CNY (¥)</option>
                          <option value="INR (₹)">INR (₹)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {settings.sell.enableVat && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">VAT (%)</label>
                      <div className="flex gap-2.5">
                        <input 
                          type="number" 
                          className="flex-1 rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
                          value={formData.vat_percent} 
                          onChange={(e) => setFormData({...formData, vat_percent: +e.target.value})}
                          placeholder="0"
                        />
                        <div className="relative flex items-center rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 px-3 py-2.5">
                          <select 
                            className="bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 outline-none appearance-none cursor-pointer pr-5"
                            value={formData.vat_percent}
                            onChange={(e) => setFormData({...formData, vat_percent: +e.target.value})}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Products</h4>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button 
                      className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all shadow-2xs cursor-pointer" 
                      onClick={() => setShowScanner(true)}
                    >
                      <Scan size={15} />
                      <span>Scan Barcode</span>
                    </button>
                    {settings.sell.enableMultipleProducts && (
                      <button 
                        className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer" 
                        onClick={addItem}
                      >
                        <Plus size={15} />
                        <span>Add Product</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {formData.items.map((item, index) => {
                  const p = availableProducts.find(prod => prod.id === item.product_id);
                  
                  return (
                    <div key={index} className="bg-[#f8fafc] dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#1e293b] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Product Item</span>
                        </div>
                        {formData.items.length > 1 && (
                          <button 
                            className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-200/60 dark:border-red-900/40 transition-colors cursor-pointer"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Product *</label>
                          <div className="relative flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-indigo-500 transition-all px-3.5 py-2.5">
                            <select 
                              className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 outline-none appearance-none cursor-pointer pr-6"
                              value={item.product_id}
                              onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            >
                              <option value="">-- Choose Product --</option>
                              {availableProducts.map(prod => (
                                <option key={prod.id} value={prod.id}>{prod.name} (Available: {prod.stock} units)</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                              <span>Quantity *</span>
                              {p && item.qty > p.stock && <span className="text-red-500 text-xs font-semibold">(Exceeds Stock: {p.stock})</span>}
                            </label>
                            <input 
                              type="number" 
                              value={item.qty || ''} 
                              onChange={(e) => updateItem(index, 'qty', +e.target.value)}
                              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
                              style={{ 
                                borderColor: p && item.qty > p.stock ? '#ef4444' : undefined,
                                color: p && item.qty > p.stock ? '#ef4444' : undefined,
                              }}
                              placeholder="0"
                              min="1"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sell Price ({settings.currency}) *</label>
                            <input 
                              type="number" 
                              value={item.price || ''} 
                              onChange={(e) => updateItem(index, 'price', +e.target.value)}
                              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="text-right text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
                          Item Total: {fmt(item.total)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {settings.sell.enableMultipleProducts && (
                  <div className="pt-1 text-center">
                    <button 
                      className="mx-auto px-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer" 
                      onClick={addItem}
                    >
                      <Plus size={14} />
                      <span>Add Another Product</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-5 sticky top-6 shadow-2xs">
                {/* LOYALTY & NOTIFICATIONS */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider uppercase">LOYALTY & NOTIFICATIONS</h4>
                  </div>

                  {selectedCustomer && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Current Points: <strong className="text-slate-900 dark:text-white">{selectedCustomer.loyalty_points}</strong></span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">{selectedCustomer.membership_tier} Member</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={redeemPoints} 
                          disabled={selectedCustomer.loyalty_points === 0}
                          onChange={(e) => setRedeemPoints(e.target.checked)} 
                        />
                        <span>Redeem Points (Max ৳{maxRedeemable})</span>
                      </label>
                      {redeemPoints && (
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          - ৳{pointsToRedeem.toLocaleString()} Discount Applied
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5 flex justify-between">
                        <span>Points to earn:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">+{pointsEarned}</span>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                      checked={sendSms} 
                      onChange={(e) => setSendSms(e.target.checked)} 
                    />
                    <span>Send SMS Invoice Notification</span>
                  </label>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* AUTO CALCULATION */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider uppercase">AUTO CALCULATION</h4>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{fmt(subtotal)}</span>
                    </div>
                    {redeemPoints && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Points Discount</span>
                        <span className="font-mono">-{fmt(pointsToRedeem)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>VAT ({formData.vat_percent}%)</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{fmt(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-semibold">
                      <span>Total Revenue</span>
                      <span className="font-mono text-slate-900 dark:text-white font-bold">{fmt(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
                      <span>Total Cost (landing)</span>
                      <span className="font-mono">{fmt(totalCost)}</span>
                    </div>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 my-3" />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">Total Profit / Loss</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-xl sm:text-2xl">{fmt(profit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Profit Margin</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{margin.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    className="w-full py-3 px-4 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all text-center cursor-pointer" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer" 
                    onClick={handleAdd}
                  >
                    <span>Sell</span>
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showScanner && (
          <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}
      </div>
    );
  }

  return (
    <div id="page-sell" className="page active space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sell / Export Management</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Record sales and track profit per transaction</p>
        </div>
        <button 
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto" 
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          <span>Sell</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-6">
        {/* KPI 1: TOTAL REVENUE */}
        <div 
          id="card-sell-revenue"
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <DollarSign size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL REVENUE</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {fmt(stats.totalRevenueSum)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Total sales value</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              {stats.count} Sales
            </span>
          </div>
        </div>

        {/* KPI 2: PROFIT */}
        <div 
          id="card-sell-profit"
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <TrendingUp size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>PROFIT</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {fmt(calculatedProfit)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Net profit after expenses</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Live
            </span>
          </div>
        </div>

        {/* KPI 3: ESTIMATED PROFIT */}
        <div 
          id="card-sell-est-profit"
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <BarChart2 size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>ESTIMATED PROFIT</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {fmt(stats.totalProfitSum)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Margins after imports</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Standard
            </span>
          </div>
        </div>

        {/* KPI 4: AVG PROFIT MARGIN */}
        <div 
          id="card-sell-profit-margin"
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Percent size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>AVG PROFIT MARGIN</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {stats.avgMargin.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Average sales margin</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Standard
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales Records</h3>
          <div className="relative flex items-center w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search sales..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Qty</th>
                <th className="px-5 py-3.5">Sell Price</th>
                <th className="px-5 py-3.5">Revenue</th>
                <th className="px-5 py-3.5" id="th-sell-record-profit">Profit</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.map(t => {
                const rowProfit = getTransactionProfit(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{t.product_name}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-400">{t.customer_name || 'Walk-in'}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-400">{t.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{t.unit_price.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{t.total_price.toLocaleString()}</td>
                    <td id={`td-sell-record-profit-${t.id}`} className="px-5 py-3.5 font-mono font-bold" style={{ color: rowProfit >= 0 ? '#10b981' : '#ef4444' }}>
                      {rowProfit >= 0 ? '' : '-'}{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{Math.abs(Math.round(rowProfit)).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 items-center">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">Completed</span>
                        <button 
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" 
                          onClick={() => {
                            setSelectedInvoiceId(t.id);
                            onNavigate?.('invoice');
                          }}
                        >
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export const SellExport = React.memo(SellExportComponent);

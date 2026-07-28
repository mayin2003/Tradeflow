import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, Watch, Percent, Trash2, Sparkles, Camera } from 'lucide-react';

interface SellExportProps {
  onNavigate?: (page: string) => void;
}

export const SellExportComponent = ({ onNavigate }: SellExportProps) => {
  const { products, transactions, addTransaction, settings, setSelectedInvoiceId, customers, expenses } = useData();
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
    // Start with all products from the context
    const list = [...products];

    // Scan transactions for any purchase transactions that aren't already represented in products list
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

    // To prevent duplicate product entries (by name or ID case-insensitively), let's keep only unique ones
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

    // Sort alphabetically by name
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
      // Auto-fill price from product's sell_price (determined during purchase or in inventory)
      item.price = p?.sell_price || 0;
      
      // If we still have 0 price but the product has a cost_price, we could suggest a price, 
      // but p.sell_price should have a default from our addTransaction logic.
    }
    
    // Recalculate total
    const qty = field === 'qty' ? value : item.qty;
    
    // Immediate stock validation for individual row
    const p = availableProducts.find(prod => prod.id === item.product_id);
    if (p && qty > p.stock) {
      // We allow them to type it but we'll cap it or just rely on the final validation
      // Let's at least warn or cap it if it's not the cumulative check
    }

    const price = field === 'price' ? value : item.price;
    item.total = qty * price;
    
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  }, [formData.items]);
  
  // Loyalty Logic: 1 point = ৳1 discount
  const maxRedeemable = useMemo(() => {
    return selectedCustomer ? Math.min(selectedCustomer.loyalty_points, subtotal) : 0;
  }, [selectedCustomer, subtotal]);

  const pointsToRedeem = redeemPoints ? maxRedeemable : 0;
  
  const vatAmount = settings.sell.enableVat ? (subtotal - pointsToRedeem) * (formData.vat_percent / 100) : 0;
  const totalRevenue = subtotal - pointsToRedeem + vatAmount;

  // Earn Logic: 1 point per ৳100 spent
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

    // Check stock for all items (cumulative check)
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
      // Set lead product info for basic compatibility if needed
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
      // Find empty slot or add new item
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

  return (
    <div id="page-sell" className="page active">
      <div className="page-header">
        <div><h2>Sell / Export Management</h2><p>Record sales and track profit per transaction</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Sell</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card" id="card-sell-revenue">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>💰</div>
            <div className="stat-badge badge-success">{stats.count} Sales</div>
          </div>
          <div className="stat-value">{fmt(stats.totalRevenueSum)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>

        <div className="stat-card" id="card-sell-profit">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>📈</div>
          </div>
          <div className="stat-value">{fmt(calculatedProfit)}</div>
          <div className="stat-label">Profit</div>
        </div>
        <div className="stat-card" id="card-sell-est-profit">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>📊</div>
          </div>
          <div className="stat-value">{fmt(stats.totalProfitSum)}</div>
          <div className="stat-label">Estimated Profit</div>
        </div>
        <div className="stat-card" id="card-sell-profit-margin">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>%</div>
          </div>
          <div className="stat-value">{stats.avgMargin.toFixed(1)}%</div>
          <div className="stat-label">Avg Profit Margin</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Sales Records</h3>
          <div className="search-input">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search sales..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Sell Price</th>
                <th>Revenue</th>
                <th id="th-sell-record-profit">Profit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => {
                const rowProfit = getTransactionProfit(t);
                return (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td><strong>{t.product_name}</strong></td>
                    <td>{t.customer_name || 'Walk-in'}</td>
                    <td>{t.quantity.toLocaleString()}</td>
                    <td className="text-mono">{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{t.unit_price.toLocaleString()}</td>
                    <td className="text-mono">{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{t.total_price.toLocaleString()}</td>
                    <td id={`td-sell-record-profit-${t.id}`} className="text-mono" style={{ color: rowProfit >= 0 ? 'var(--success)' : '#ef4444', fontWeight: 600 }}>
                      {rowProfit >= 0 ? '' : '-'}{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{Math.abs(Math.round(rowProfit)).toLocaleString()}
                    </td>
                    <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-success">Completed</span>
                      <button 
                        className="btn btn-sm btn-outline" 
                        style={{ padding: '2px 8px', fontSize: '11px' }}
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
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay custom-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="retro-modal"
            >
              <div className="retro-modal-header">
                <h3>Sell</h3>
                <button className="retro-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="retro-modal-body custom-scrollbar">
                <div className="retro-form-row">
                  {settings.sell.enableCustomerName && (
                    <div className="retro-form-group">
                      <label>Customer Name (optional)</label>
                      <div className="retro-input-wrapper">
                        <input 
                          type="text" 
                          list="customer-list"
                          className="retro-input"
                          value={formData.customer} 
                          onChange={(e) => setFormData({...formData, customer: e.target.value})} 
                          placeholder="Type or select customer"
                        />
                      </div>
                      <datalist id="customer-list">
                        {customers.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                  )}
                  {settings.sell.requireSaleDate && (
                    <div className="retro-form-group">
                      <label>Sale Date *</label>
                      <div className="retro-input-wrapper with-icon cursor-pointer group relative overflow-hidden" 
                           onClick={() => dateInputRef.current?.showPicker?.()}>
                        <input 
                          ref={dateInputRef}
                          type="date" 
                          className="retro-input-hidden"
                          value={formData.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) setFormData({...formData, date: val});
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="retro-input-display group-hover:border-blue-400 transition-colors duration-100 relative z-0 pointer-events-none">
                          {formattedDate}
                        </div>
                        <div className="retro-input-icon group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-100 z-0 pointer-events-none">
                          <Watch size={18} className="text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors duration-100" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="retro-form-row">
                  {settings.sell.enableCurrencySelection && (
                    <div className="retro-form-group">
                      <label>Currency</label>
                      <div className="retro-input-wrapper">
                        <select 
                          className="retro-input"
                          value={formData.currency}
                          onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        >
                          <option value="BDT (৳)">BDT (৳)</option>
                          <option value="USD ($)">USD ($)</option>
                          <option value="CNY (¥)">CNY (¥)</option>
                          <option value="INR (₹)">INR (₹)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {settings.sell.enableVat && (
                    <div className="retro-form-group">
                      <label>VAT (%)</label>
                      <div className="flex gap-2">
                        <div className="retro-input-wrapper flex-1">
                          <input 
                            type="number" 
                            className="retro-input"
                            value={formData.vat_percent} 
                            onChange={(e) => setFormData({...formData, vat_percent: +e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div className="retro-input-wrapper w-[100px]">
                          <select 
                            className="retro-input"
                            value={formData.vat_percent}
                            onChange={(e) => setFormData({...formData, vat_percent: +e.target.value})}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Products</h4>
                    <div className="flex gap-2">
                      <button className="retro-btn-metallic-teal px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={() => setShowScanner(true)}>
                        <Camera size={14} />
                        <span>Barcode Scan</span>
                      </button>
                      {settings.sell.enableMultipleProducts && (
                        <button className="retro-btn-metallic-teal px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={addItem}>
                          <span>+ Add Product</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {formData.items.map((item, index) => {
                    const p = availableProducts.find(prod => prod.id === item.product_id);
                    
                    return (
                      <div key={index} className="retro-section-container flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/60 pb-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="bg-teal-600 dark:bg-teal-550 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{index + 1}</span>
                            <span>Product Item</span>
                          </span>
                          {formData.items.length > 1 && (
                            <button 
                              className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 bg-red-50 dark:bg-red-950/10 px-2.5 py-1 rounded-md border border-red-200/50 dark:border-red-900/40 transition-colors cursor-pointer"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 size={12} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          <div className="retro-form-group">
                            <label>Select Product *</label>
                            <div className="retro-input-wrapper">
                              <select 
                                className="retro-input"
                                value={item.product_id}
                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                              >
                                <option value="">-- Choose Product --</option>
                                {availableProducts.map(prod => (
                                  <option key={prod.id} value={prod.id}>{prod.name} (Available: {prod.stock} units)</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="retro-form-row !mb-0">
                            <div className="retro-form-group">
                              <label className="flex items-center gap-1">
                                <span>Quantity *</span>
                                {p && item.qty > p.stock && <span className="text-red-500 text-xs font-semibold">(Exceeds Stock: {p.stock})</span>}
                              </label>
                              <div className="retro-input-wrapper" style={{
                                background: p && item.qty > p.stock ? 'rgba(239, 68, 68, 0.2)' : undefined
                              }}>
                                <input 
                                  type="number" 
                                  value={item.qty || ''} 
                                  onChange={(e) => updateItem(index, 'qty', +e.target.value)}
                                  className="retro-input"
                                  style={{ 
                                    background: p && item.qty > p.stock ? 'rgba(239, 68, 68, 0.05)' : undefined,
                                    borderColor: p && item.qty > p.stock ? '#ef4444' : undefined,
                                    color: p && item.qty > p.stock ? '#ef4444' : undefined,
                                  }}
                                  placeholder="0"
                                  min="1"
                                />
                              </div>
                            </div>
                            
                            <div className="retro-form-group">
                              <label>Sell Price ({settings.currency}) *</label>
                              <div className="retro-input-wrapper">
                                <input 
                                  type="number" 
                                  value={item.price || ''} 
                                  onChange={(e) => updateItem(index, 'price', +e.target.value)}
                                  className="retro-input"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end p-2 px-3 bg-slate-100/30 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                            Item Total: {fmt(item.total)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {settings.sell.enableMultipleProducts && (
                    <div className="mt-2 text-center">
                      <button 
                        className="retro-btn-metallic-silver px-6 py-2 text-xs font-bold" 
                        onClick={addItem}
                      >
                        + Add Another Product
                      </button>
                    </div>
                  )}
                </div>

                <div className="retro-calc-box">
                  <div className="calc-header">LOYALTY & NOTIFICATIONS</div>
                  
                  {selectedCustomer && (
                    <div className="mb-4 p-3.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Current Points: <strong className="text-slate-900 dark:text-white">{selectedCustomer.loyalty_points}</strong></span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">{selectedCustomer.membership_tier} Member</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input 
                          type="checkbox" 
                          className="rounded text-teal-600"
                          checked={redeemPoints} 
                          disabled={selectedCustomer.loyalty_points === 0}
                          onChange={(e) => setRedeemPoints(e.target.checked)} 
                        />
                        <span>Redeem Points (Max ৳{maxRedeemable})</span>
                      </label>
                      {redeemPoints && (
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-450">
                          - ৳{pointsToRedeem.toLocaleString()} Discount Applied
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 mt-1.5 flex justify-between">
                        <span>Points to earn:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">+{pointsEarned}</span>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                      <input type="checkbox" className="rounded text-teal-600 font-bold" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
                      <span>Send SMS Invoice Notification</span>
                    </label>
                  </div>

                  <div className="calc-header">AUTO CALCULATION</div>
                  <div className="calc-grid text-sm">
                    <div className="calc-item">
                      <span>Subtotal</span>
                      <span className="text-mono font-medium">{fmt(subtotal)}</span>
                    </div>
                    {redeemPoints && (
                      <div className="calc-item text-emerald-600 dark:text-emerald-450 font-semibold">
                        <span>Points Discount</span>
                        <span className="text-mono">-{fmt(pointsToRedeem)}</span>
                      </div>
                    )}
                    <div className="calc-item">
                      <span>VAT ({formData.vat_percent}%)</span>
                      <span className="text-mono font-medium">{fmt(vatAmount)}</span>
                    </div>
                    <div className="calc-item font-semibold text-slate-800 dark:text-slate-200">
                      <span>Total Revenue</span>
                      <span className="text-mono">{fmt(totalRevenue)}</span>
                    </div>
                    <div className="calc-item text-slate-500 dark:text-slate-450 text-xs">
                      <span>Total Cost (landing)</span>
                      <span className="text-mono">{fmt(totalCost)}</span>
                    </div>
                    
                    <div className="calc-divider my-2"></div>
                    
                    <div className="calc-item highlight font-black text-base flex items-center justify-between">
                      <span className="font-bold text-teal-700 dark:text-teal-400">Total Profit / Loss</span>
                      <span className="text-mono text-teal-700 dark:text-teal-400">{fmt(profit)}</span>
                    </div>
                    <div className="calc-item text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Profit Margin</span>
                      <span className="text-mono text-emerald-600 dark:text-emerald-450 font-bold">{margin.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="retro-modal-footer">
                <button className="retro-btn-metallic-silver lg" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="retro-btn-metallic-teal lg flex-1 font-bold" onClick={handleAdd}>
                  <span>Sell</span>
                  <Sparkles size={18} className="sparkle-icon" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export const SellExport = React.memo(SellExportComponent);

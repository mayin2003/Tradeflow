import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { BarcodeScanner } from '../components/BarcodeScanner';

interface SellExportProps {
  onNavigate?: (page: string) => void;
}

export const SellExport = ({ onNavigate }: SellExportProps) => {
  const { products, transactions, addTransaction, settings, setSelectedInvoiceId, customers } = useData();
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
      const p = products.find(prod => prod.id === value);
      item.product_name = p?.name || '';
      // Auto-fill price from product's sell_price (determined during purchase or in inventory)
      item.price = p?.sell_price || 0;
      
      // If we still have 0 price but the product has a cost_price, we could suggest a price, 
      // but p.sell_price should have a default from our addTransaction logic.
    }
    
    // Recalculate total
    const qty = field === 'qty' ? value : item.qty;
    
    // Immediate stock validation for individual row
    const p = products.find(prod => prod.id === item.product_id);
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
      const p = products.find(prod => prod.id === item.product_id);
      return sum + (p?.cost_price || 0) * item.qty;
    }, 0);
  }, [formData.items, products]);
  
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
      const p = products.find(prod => prod.id === productId);
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
    const product = products.find(p => p.barcode === barcode);
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

  const stats = useMemo(() => {
    const sales = transactions.filter(t => t.type === 'sale');
    const totalRevenueSum = sales.reduce((a, b) => a + b.total_price, 0);
    const totalProfitSum = sales.reduce((a, b) => {
      const p = products.find(prod => prod.name === b.product_name);
      return a + (b.total_price - (p?.cost_price || 0) * b.quantity);
    }, 0);

    return { 
      count: sales.length, 
      totalRevenueSum,
      totalProfitSum,
      avgMargin: totalRevenueSum > 0 ? (totalProfitSum / totalRevenueSum) * 100 : 0
    };
  }, [transactions, products]);

  return (
    <div id="page-sell" className="page active">
      <div className="page-header">
        <div><h2>Sell / Export Management</h2><p>Record sales and track profit per transaction</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Sell</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>💰</div>
            <div className="stat-badge badge-success">{stats.count} Sales</div>
          </div>
          <div className="stat-value">{fmt(stats.totalRevenueSum)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>📊</div>
          </div>
          <div className="stat-value">{fmt(stats.totalProfitSum)}</div>
          <div className="stat-label">Estimated Profit</div>
        </div>
        <div className="stat-card">
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td><strong>{t.product_name}</strong></td>
                  <td>{t.customer_name || 'Walk-in'}</td>
                  <td>{t.quantity.toLocaleString()}</td>
                  <td className="text-mono">{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{t.unit_price.toLocaleString()}</td>
                  <td className="text-mono">{(t.currency?.match(/\((.+)\)/)?.[1] || settings.currency)}{t.total_price.toLocaleString()}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Sell</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-row">
                {settings.sell.enableCustomerName && (
                  <div className="form-group">
                    <label>Customer Name (optional)</label>
                    <input 
                      type="text" 
                      list="customer-list"
                      value={formData.customer} 
                      onChange={(e) => setFormData({...formData, customer: e.target.value})} 
                      placeholder="Type or select customer"
                    />
                    <datalist id="customer-list">
                      {customers.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                )}
                {settings.sell.requireSaleDate && (
                  <div className="form-group">
                    <label>Sale Date *</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="form-row">
                {settings.sell.enableCurrencySelection && (
                  <div className="form-group">
                    <label>Currency</label>
                    <select 
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    >
                      <option value="BDT (৳)">BDT (৳)</option>
                      <option value="USD ($)">USD ($)</option>
                      <option value="CNY (¥)">CNY (¥)</option>
                      <option value="INR (₹)">INR (₹)</option>
                    </select>
                  </div>
                )}
                {settings.sell.enableVat && (
                  <div className="form-group">
                    <label>VAT (%)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="number" 
                        value={formData.vat_percent} 
                        onChange={(e) => setFormData({...formData, vat_percent: +e.target.value})}
                        placeholder="0"
                      />
                      <select 
                        value={formData.vat_percent}
                        onChange={(e) => setFormData({...formData, vat_percent: +e.target.value})}
                        style={{ width: '80px' }}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ margin: '20px 0', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>Products</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setShowScanner(true)}>📷 Scan Barcode</button>
                    {settings.sell.enableMultipleProducts && (
                      <button className="btn btn-sm btn-outline" onClick={addItem}>+ Add Product</button>
                    )}
                  </div>
                </div>
                
                {formData.items.map((item, index) => {
                  const p = products.find(prod => prod.id === item.product_id);
                  const stock = p ? p.stock : 0;
                  
                  return (
                    <div key={index} style={{ 
                      background: '#ffffff', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      marginBottom: '16px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'var(--primary)', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>{index + 1}</span>
                          Product Item
                        </span>
                        {formData.items.length > 1 && (
                          <button 
                            className="btn btn-sm btn-outline" 
                            style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', padding: '4px 12px', fontSize: '12px' }}
                            onClick={() => removeItem(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Select Product *</label>
                          <select 
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                          >
                            <option value="">-- Choose Product --</option>
                            {[...products]
                              .filter(p => p.stock > 0)
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Available: {p.stock} units)</option>
                              ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                              Quantity {p && item.qty > p.stock && <span style={{ color: '#ef4444' }}>(Exceeds Stock: {p.stock})</span>}
                            </label>
                            <input 
                              type="number" 
                              value={item.qty || ''} 
                              onChange={(e) => updateItem(index, 'qty', +e.target.value)}
                              style={{ 
                                width: '100%', 
                                padding: '10px', 
                                borderRadius: '8px', 
                                border: '1px solid',
                                borderColor: p && item.qty > p.stock ? '#ef4444' : '#e2e8f0',
                                background: p && item.qty > p.stock ? '#fef2f2' : '#ffffff',
                                fontSize: '14px' 
                              }}
                              placeholder="0"
                              min="1"
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Sell Price ({settings.currency})</label>
                            <input 
                              type="number" 
                              value={item.price || ''} 
                              onChange={(e) => updateItem(index, 'price', +e.target.value)}
                              style={{ 
                                width: '100%',
                                padding: '10px', 
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                background: item.price > 0 ? '#f0fdf4' : '#ffffff',
                                borderColor: item.price > 0 ? '#10b981' : '#e2e8f0',
                                fontWeight: 600,
                                color: item.price > 0 ? '#166534' : 'inherit'
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          padding: '8px 12px', 
                          background: '#f8fafc', 
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#475569'
                        }}>
                          Item Total: {fmt(item.total)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {settings.sell.enableMultipleProducts && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={addItem}
                      style={{ padding: '8px 24px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}
                    >
                      + Add Another Product
                    </button>
                  </div>
                )}
              </div>

              <div className="calc-box" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Loyalty & Notifications</p>
                
                {selectedCustomer && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px' }}>Current Points: <strong>{selectedCustomer.loyalty_points}</strong></span>
                      <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{selectedCustomer.membership_tier} Member</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="checkbox" 
                        checked={redeemPoints} 
                        disabled={selectedCustomer.loyalty_points === 0}
                        onChange={(e) => setRedeemPoints(e.target.checked)} 
                      />
                      Redeem Points (Max ৳{maxRedeemable})
                    </label>
                    {redeemPoints && (
                      <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>
                        - ৳{pointsToRedeem.toLocaleString()} Discount Applied
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                      Points to be earned from this sale: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>+{pointsEarned}</span>
                    </div>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>
                  <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
                  Send SMS Invoice Notification
                </label>

                <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Auto Calculation</p>
                <div className="calc-row"><span>Subtotal</span><span className="text-mono">{fmt(subtotal)}</span></div>
                {redeemPoints && <div className="calc-row" style={{ color: 'var(--success)' }}><span>Points Discount</span><span className="text-mono">-{fmt(pointsToRedeem)}</span></div>}
                <div className="calc-row"><span>VAT ({formData.vat_percent}%)</span><span className="text-mono">{fmt(vatAmount)}</span></div>
                <div className="calc-row"><span>Total Revenue</span><span className="text-mono">{fmt(totalRevenue)}</span></div>
                <div className="calc-row"><span>Total Cost (landing)</span><span className="text-mono">{fmt(totalCost)}</span></div>
                <div className="form-divider" style={{ margin: '8px 0' }}></div>
                <div className="calc-row total" style={{ color: 'var(--accent)' }}>
                  <span style={{ fontWeight: 700 }}>Total Profit / Loss</span>
                  <span className="text-mono" style={{ fontWeight: 700 }}>{fmt(profit)}</span>
                </div>
                <div className="calc-row">
                  <span>Profit Margin</span>
                  <span className="text-mono" style={{ color: 'var(--success)', fontWeight: 600 }}>{margin.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Sell</button>
            </div>
          </div>
        </div>
      )}
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

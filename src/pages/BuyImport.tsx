import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

export const BuyImport = () => {
  const { products, transactions, addTransaction, settings } = useData();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    qty: 0,
    price: 0,
    sell_price: 0,
    ship: 0,
    duty: 0,
    vat: 0,
    other: 0,
    currency: 'BDT',
    date: new Date().toISOString().split('T')[0]
  });

  const calc = () => {
    const prod = formData.price * formData.qty;
    const add = formData.ship + formData.duty + formData.vat + formData.other;
    const total = prod + add;
    const land = formData.qty ? total / formData.qty : 0;
    return { prod, add, total, land };
  };

  const handleAdd = () => {
    if (!formData.product_name || !formData.qty) {
      alert('Please fill in all required fields (Product, Quantity).');
      return;
    }
    
    // Default sell_price to purchase price if not set
    const finalSellPrice = formData.sell_price || formData.price;

    const { total } = calc();
    addTransaction({
      type: 'purchase',
      product_id: formData.product_id || `manual_${Date.now()}`,
      product_name: formData.product_name,
      quantity: formData.qty,
      unit_price: formData.price,
      sell_price: finalSellPrice,
      total_price: total,
      date: formData.date,
      status: 'completed',
      shipping_cost: formData.ship,
      customs_duty: formData.duty,
      vat: formData.vat,
      other_cost: formData.other
    } as any);
    setShowModal(false);
    setFormData({
      product_id: '',
      product_name: '',
      qty: 0,
      price: 0,
      sell_price: 0,
      ship: 0,
      duty: 0,
      vat: 0,
      other: 0,
      currency: 'BDT',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const fmt = (n: number) => settings.currency + Math.round(n).toLocaleString();
  const { prod, add, total, land } = calc();

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'purchase')
      .filter(t => t.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [transactions, searchQuery]);

  const stats = useMemo(() => {
    const purchaseTransactions = transactions.filter(t => t.type === 'purchase');
    const totalPurchaseCost = purchaseTransactions.reduce((a, b) => a + b.total_price, 0);
    const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const avgLandingCost = purchaseTransactions.length > 0 
      ? totalPurchaseCost / purchaseTransactions.reduce((a, b) => a + (b.quantity || 1), 0)
      : 0;

    return { 
      count: purchaseTransactions.length, 
      totalPurchaseCost, 
      totalStockUnits,
      avgLandingCost
    };
  }, [transactions, products]);

  return (
    <div id="page-buy" className="page active">
      <div className="page-header">
        <div><h2>Buy / Import Management</h2><p>Record purchases with full cost breakdown</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Purchase</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>🛒</div>
            <div className="stat-badge badge-info">{stats.count} Records</div>
          </div>
          <div className="stat-value">{fmt(stats.totalPurchaseCost)}</div>
          <div className="stat-label">Total Purchase Cost</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>📦</div>
            <div className="stat-badge badge-info">{products.length} SKUs</div>
          </div>
          <div className="stat-value">{stats.totalStockUnits.toLocaleString()}</div>
          <div className="stat-label">Total Stock Units</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>🏷️</div>
          </div>
          <div className="stat-value">{fmt(stats.avgLandingCost)}</div>
          <div className="stat-label">Avg Landing Cost</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Purchase Records</h3>
          <div className="search-input">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search purchases..." 
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
                <th>Qty</th>
                <th>Purchase Price</th>
                <th>Target Sell Price</th>
                <th>Total Cost</th>
                <th>Landing/Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td><strong>{t.product_name}</strong></td>
                  <td>{t.quantity.toLocaleString()}</td>
                  <td className="text-mono">{settings.currency}{t.unit_price.toLocaleString()}</td>
                  <td className="text-mono" style={{ color: 'var(--accent)' }}>{settings.currency}{t.sell_price?.toLocaleString() || '0'}</td>
                  <td className="text-mono"><strong>{settings.currency}{t.total_price.toLocaleString()}</strong></td>
                  <td className="text-mono" style={{ color: 'var(--success)' }}>{settings.currency}{Math.round(t.total_price / (t.quantity || 1)).toLocaleString()}</td>
                  <td><span className="badge badge-info">Completed</span></td>
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
              <h3>Record Purchase</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Product *</label>
                  <input 
                    type="text" 
                    list="products-list"
                    value={formData.product_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const existing = products.find(p => p.name === name);
                      setFormData({
                        ...formData, 
                        product_name: name,
                        product_id: existing ? existing.id : '',
                        price: existing ? existing.cost_price : formData.price,
                        sell_price: existing ? existing.sell_price : formData.sell_price
                      });
                    }}
                    placeholder="e.g. Samsung TV" 
                  />
                  <datalist id="products-list">
                    {products.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
                {settings.buy.requireDate && (
                  <div className="form-group">
                    <label>Purchase Date *</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input 
                    type="number" 
                    value={formData.qty || ''}
                    onChange={(e) => setFormData({...formData, qty: +e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Purchase Price (unit)</label>
                  <input 
                    type="number" 
                    value={formData.price || ''}
                    onChange={(e) => {
                      const val = +e.target.value;
                      setFormData({
                        ...formData, 
                        price: val,
                        sell_price: formData.sell_price === formData.price || !formData.sell_price ? val : formData.sell_price
                      });
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Sell Price (unit) *</label>
                  <input 
                    type="number" 
                    value={formData.sell_price || ''}
                    onChange={(e) => setFormData({...formData, sell_price: +e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              
              {(settings.buy.enableShippingCost || settings.buy.enableCustomsDuty || settings.buy.enableOtherCosts) && (
                <>
                  <div className="form-divider"></div>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Additional Costs</p>
                  <div className="form-row">
                    {settings.buy.enableShippingCost && (
                      <div className="form-group">
                        <label>Shipping Cost</label>
                        <input 
                          type="number" 
                          value={formData.ship || ''}
                          onChange={(e) => setFormData({...formData, ship: +e.target.value})} 
                          placeholder="0"
                        />
                      </div>
                    )}
                    {settings.buy.enableCustomsDuty && (
                      <div className="form-group">
                        <label>Customs Duty</label>
                        <input 
                          type="number" 
                          value={formData.duty || ''}
                          onChange={(e) => setFormData({...formData, duty: +e.target.value})} 
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                  {settings.buy.enableOtherCosts && (
                    <div className="form-group">
                      <label>Other Costs</label>
                      <input 
                        type="number" 
                        value={formData.other || ''}
                        onChange={(e) => setFormData({...formData, other: +e.target.value})} 
                        placeholder="0"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="calc-box">
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>AUTO CALCULATION</p>
                <div className="calc-row"><span>Product Cost</span><span className="text-mono">{fmt(prod)}</span></div>
                <div className="calc-row"><span>Total Import Cost</span><span className="text-mono">{fmt(total)}</span></div>
                <div className="calc-row total"><span>Landing Cost / Unit</span><span className="text-mono" style={{ color: 'var(--success)' }}>{fmt(land)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Record Purchase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

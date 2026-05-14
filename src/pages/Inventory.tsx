import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BarcodeScanner } from '../components/BarcodeScanner';

export const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    hs_code: '',
    cost_price: 0,
    stock: 0,
    min_stock: 10,
    barcode: '',
    description: ''
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) {
      alert("Please provide at least a Product Name and Category");
      return;
    }
    
    if (editingId) {
      const existing = products.find(p => p.id === editingId);
      if (existing) {
        updateProduct({
          ...existing,
          ...newProduct,
          sell_price: newProduct.cost_price * 1.2
        });
      }
    } else {
      addProduct({
        ...newProduct,
        sell_price: newProduct.cost_price * 1.2 // Default markup
      } as any);
    }

    setEditingId(null);
    setShowModal(false);
    setNewProduct({
      name: '',
      category: '',
      hs_code: '',
      cost_price: 0,
      stock: 0,
      min_stock: 10,
      barcode: '',
      description: ''
    });
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setNewProduct({
      name: p.name,
      category: p.category,
      hs_code: p.hs_code,
      cost_price: p.cost_price,
      stock: p.stock,
      min_stock: p.min_stock,
      barcode: p.barcode || '',
      description: p.description || ''
    });
    setShowModal(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const stats = useMemo(() => ({
    lowStockCount: products.filter(p => p.stock <= p.min_stock).length,
    productNames: Array.from(new Set(products.map(p => p.name))),
    categories: Array.from(new Set(products.map(p => p.category)))
  }), [products]);

  return (
    <div id="page-inventory" className="page active">
      <div className="page-header">
        <div><h2>Product & Inventory</h2><p>Manage your product catalog and stock levels</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Product</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>📦</div>
            <div className="stat-badge" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>Active</div>
          </div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>⚠️</div>
            <div className="stat-badge badge-danger">{stats.lowStockCount} Items</div>
          </div>
          <div className="stat-value">{stats.lowStockCount}</div>
          <div className="stat-label">Low Stock Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>📑</div>
          </div>
          <div className="stat-value">{stats.categories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
      </div>

      {stats.lowStockCount > 0 && (
        <div className="low-stock-alert">
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{stats.lowStockCount} products</strong> are below minimum stock level. 
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Please restock soon to avoid export delays.</p>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ background: 'var(--accent)', width: '4px', height: '16px', borderRadius: '2px' }}></div>
            <h3 style={{ margin: 0 }}>All Products</h3>
          </div>
          <div className="search-input">
            <span style={{ opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table style={{ background: 'transparent' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Product Details</th>
                <th>Category</th>
                <th>HS Code / Barcode</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? filteredProducts.map(p => (
                <tr key={p.id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{p.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {p.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border)' }}>
                      {p.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>HS: {p.hs_code || 'N/A'}</span>
                      <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--accent)', border: '1px solid var(--border)', width: 'fit-content' }}>
                        {p.barcode || 'Empty'}
                      </code>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {p.stock.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    {p.stock <= p.min_stock ? (
                      <span className="badge badge-danger" style={{ fontWeight: 700 }}>⚠ Low</span>
                    ) : (
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>✓ OK</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id, p.name)}>Del</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No products matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Product Name / Item *</label>
                  <input 
                    type="text" 
                    list="product-names"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Samsung LED TV 55" 
                  />
                  <datalist id="product-names">
                    {stats.productNames.map(name => <option key={name} value={name} />)}
                    <option value="Others" />
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Barcode</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                      placeholder="SCAN ME" 
                    />
                    <button className="btn btn-sm btn-outline" onClick={() => setShowScanner(true)}>📷</button>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category (Item Type) *</label>
                  <input 
                    type="text"
                    list="category-list"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    placeholder="Select or type category"
                  />
                  <datalist id="category-list">
                    <option value="Electronics" />
                    <option value="Garments" />
                    <option value="Chemicals" />
                    <option value="Food & Beverage" />
                    <option value="Machinery" />
                    <option value="Others" />
                    {stats.categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>HS Code</label>
                  <input 
                    type="text" 
                    value={newProduct.hs_code}
                    onChange={(e) => setNewProduct({...newProduct, hs_code: e.target.value})}
                    placeholder="8528.72" 
                  />
                </div>
                <div className="form-group">
                  <label>Cost Price (BDT)</label>
                  <input 
                    type="number" 
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({...newProduct, cost_price: +e.target.value})}
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: +e.target.value})}
                    placeholder="0" 
                  />
                </div>
                <div className="form-group">
                  <label>Min Stock Alert</label>
                  <input 
                    type="number" 
                    value={newProduct.min_stock}
                    onChange={(e) => setNewProduct({...newProduct, min_stock: +e.target.value})}
                    placeholder="10" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={2} 
                  placeholder="Brief product description..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddProduct}>{editingId ? 'Save Changes' : 'Add Product'}</button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onScan={(text) => setNewProduct({...newProduct, barcode: text})} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

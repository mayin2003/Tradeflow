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

      <div className="low-stock-alert">
        ⚠️ <strong>{stats.lowStockCount} products</strong> are below minimum stock level.
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>All Products</h3>
          <div className="search-input">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Barcode</th>
                <th>Stock Qty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category}</td>
                  <td><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{p.barcode || 'No Barcode'}</code></td>
                  <td>{p.stock.toLocaleString()}</td>
                  <td>
                    {p.stock <= p.min_stock ? (
                      <span className="badge badge-danger">⚠ Low Stock</span>
                    ) : (
                      <span className="badge badge-success">✓ In Stock</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id, p.name)} style={{ marginLeft: '4px' }}>Del</button>
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

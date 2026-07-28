import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

export const CustomersComponent = () => {
  const { customers, addCustomer, transactions } = useData();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name) return;
    addCustomer(newCustomer);
    setShowModal(false);
    setNewCustomer({ name: '', email: '', phone: '', address: '' });
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const stats = useMemo(() => {
    const vipCount = customers.filter(c => c.membership_tier === 'Platinum' || c.membership_tier === 'Gold').length;
    const totalPoints = customers.reduce((a, b) => a + (b.loyalty_points || 0), 0);
    const redeemedPoints = transactions
      .filter(t => t.type === 'sale')
      .reduce((a, b) => a + (b.loyalty_points_used || 0), 0);
    
    return { vipCount, totalPoints, redeemedPoints };
  }, [customers, transactions]);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Platinum': return '#1e293b';
      case 'Gold': return '#f59e0b';
      case 'Silver': return '#94a3b8';
      default: return '#92400e';
    }
  };

  const getTierBg = (tier?: string) => {
    switch (tier) {
      case 'Platinum': return '#f1f5f9';
      case 'Gold': return '#fffbeb';
      case 'Silver': return '#f8fafc';
      default: return '#fff7ed';
    }
  };

  return (
    <div id="page-customers" className="page active">
      <div className="page-header">
        <div>
          <h2>Customer Management</h2>
          <p>Track loyalty, membership tiers, and contact information</p>
        </div>
        <button className="btn btn-primary w-full sm:w-auto" onClick={() => setShowModal(true)}>+ Add Customer</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>👥</div>
          </div>
          <div className="stat-value">{customers.length}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>🌟</div>
            <div className="stat-badge badge-success">High Value</div>
          </div>
          <div className="stat-value">{stats.vipCount}</div>
          <div className="stat-label">VIP Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>💎</div>
          </div>
          <div className="stat-value">{stats.totalPoints.toLocaleString()}</div>
          <div className="stat-label">Total Loyalty Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>🎁</div>
          </div>
          <div className="stat-value">৳{stats.redeemedPoints.toLocaleString()}</div>
          <div className="stat-label">Points Redeemed</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Customer Directory</h3>
          <div className="search-input">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search by name, phone or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Membership Tier</th>
                <th>Loyalty Points</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        background: 'var(--bg)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        fontSize: '12px'
                      }}>
                        {c.name.charAt(0)}
                      </div>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{c.phone}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{c.email}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: getTierBg(c.membership_tier), 
                      color: getTierColor(c.membership_tier),
                      border: `1px solid ${getTierColor(c.membership_tier)}20`
                    }}>
                      {c.membership_tier || 'Bronze'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.loyalty_points || 0} pts</div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Name *</label>
                <input 
                  type="text" 
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="John Doe" 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="+8801..." 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  placeholder="john@example.com" 
                />
              </div>
              <div className="form-group">
                <label>Shipping Address</label>
                <textarea 
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  rows={2}
                  placeholder="Full delivery address..." 
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddCustomer}>Save Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Customers = React.memo(CustomersComponent);

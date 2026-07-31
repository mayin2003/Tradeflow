import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Users, Star, Award, Gift, MoreVertical } from 'lucide-react';

export const CustomersComponent = () => {
  const { customers, addCustomer, transactions, settings } = useData();
  const isDarkMode = settings.theme === 'dark' || (typeof document !== 'undefined' && (document.body.classList.contains('dark-mode') || document.documentElement.classList.contains('dark')));
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-6">
        {/* KPI 1: TOTAL CUSTOMERS */}
        <div 
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group relative overflow-hidden" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Users size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL CUSTOMERS</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {customers.length.toLocaleString()}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Registered customers</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Live
            </span>
          </div>
        </div>

        {/* KPI 2: VIP MEMBERS */}
        <div 
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group relative overflow-hidden" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Star size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>VIP MEMBERS</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {stats.vipCount.toLocaleString()}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>High value clients</span>
            <span className={isDarkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              High Value
            </span>
          </div>
        </div>

        {/* KPI 3: TOTAL LOYALTY POINTS */}
        <div 
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group relative overflow-hidden" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Award size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL LOYALTY POINTS</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {stats.totalPoints.toLocaleString()}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Active customer points</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Active
            </span>
          </div>
        </div>

        {/* KPI 4: POINTS REDEEMED */}
        <div 
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group relative overflow-hidden" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Gift size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>POINTS REDEEMED</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {(settings?.currency || '৳')}{stats.redeemedPoints.toLocaleString()}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Redeemed rewards</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Total
            </span>
          </div>
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
